#!/usr/bin/env python3
"""collect_g_portfolio.py — source class (g-portfolio): PORTFOLIO-COMPANY RELEASES naming B Capital or a partner (2026-10-19 sweep, pass 2).

Value-add over collect_b.py (136 companies, sitemaps/newsrooms + one Google query each):
  1. WIDER company list: data/portfolio.json ∪ app API /companies ∪ b.capital/portfolio (embedded JSON) ∪ dealroom ∪ cbinsights ∪ tracxn ∪ 40 named events.
  2. Two Google News queries per company ('"<name>" "B Capital"' and '"<name>" Saverin OR Ganguly OR Mohla'); yearly windows 2016→2026 for the 40 named.
  3. Wire services: PR Newswire search pages (Business Wire / GlobeNewswire / Accesswire are 403/400 → blockers).
  4. Google News RSS quarterly windows 2016→2026 for six B Capital deal phrases.  5. Bing News RSS (en-US / en-IN / en-SG).
Discovery is serial in the main thread (≤2 Google req/s, ≤2 req/s per host); resolve+fetch run in a ThreadPoolExecutor(8).
Resumable: Stage skips canonical URLs already in data/sweep/g-portfolio.jsonl; 'query-done <key>' lines in g-portfolio.log skip finished queries.
URLs already collected by class (b) are not re-fetched (counted as skipped_already_in_b). Hard wall-clock budget 30 min.
"""
from __future__ import annotations
import collections, json, os, re, sys, threading, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as sl

CLS = "g-portfolio"
BUDGET_S = 30 * 60
T0 = time.time()
DISCOVERY_END = T0 + 24 * 60          # stop issuing new queries
FETCH_END = T0 + 28 * 60 + 30         # stop waiting for workers; write summary
WORKERS = 8
NAMED = ["Fervo Energy", "Labelbox", "Meesho", "Bird", "Innovaccer", "Icertis", "Carro", "Ninja Van", "Byju's", "PharmEasy", "Khatabook", "MoEngage", "Bhanzu",
         "Sugarfit", "Turno", "Nektar", "Eureka Robotics", "Lunar Energy", "JetZero", "Code Metal", "Axiom", "Solve Therapeutics", "ARTBIO", "Flourish Health",
         "Cadence", "Star Catcher", "Evidation", "Notable", "Yalo", "Kopi Kenangan", "Mswipe", "Bounce", "SolarSquare", "FalconX", "Accacia", "EvenUp", "Gushwork", "Overstory"]
NAMED_URLS = [("fervo-energy", "https://techcrunch.com/2026/05/13/geothermal-startup-fervo-energy-pops-33-in-ipo-debut-fueled-by-ai-data-center-demand/")]
PHRASES = ['"B Capital" led the round', '"led by B Capital"', '"B Capital" participated', '"backed by B Capital"', '"B Capital" portfolio company', '"B Capital" Series A OR B OR C OR D']
INVESTOR_NOISE = re.compile(r"\b(ventures?|capital|partners|fund|management|holdings|sequoia|undisclosed|investors?|cb insights|dealroom|tracxn|crunchbase|pitchbook|openai|sap|boston consulting group|cooley|public)\b", re.I)

# ------------------------------------------------------------------ throttled / instrumented GET ------------------------------------
_orig_get = sl.get
_host_lock = threading.Lock(); _host_last: dict[str, float] = {}
_status_counts: collections.Counter = collections.Counter(); _req_count = [0]
def _throttle(url: str):
  host = sl.host_of(url); gap = 0.5
  while True:
    with _host_lock:
      now = time.time(); last = _host_last.get(host, 0.0)
      if now - last >= gap: _host_last[host] = now; return
      w = gap - (now - last)
    time.sleep(w)
def throttled_get(url, timeout=25, retries=2, headers=None, _skip_robots=False):
  if time.time() > FETCH_END: return 0, ""
  _throttle(url)
  st, body = _orig_get(url, timeout=min(timeout, 15), retries=min(retries, 1), headers=headers, _skip_robots=_skip_robots)
  _status_counts[str(st)] += 1; _req_count[0] += 1
  return st, body
sl.get = throttled_get

# ------------------------------------------------------------------ stage / state ---------------------------------------------------
stage = sl.Stage(CLS)
_lock = threading.Lock()
def log(msg: str):
  with _lock: stage.log(msg)
done_queries: set[str] = set()
if os.path.exists(stage.logp):
  for line in open(stage.logp, encoding="utf-8"):
    m = re.search(r"query-done (\S+)", line)
    if m: done_queries.add(m.group(1))
b_seen: set[str] = set()
bp = os.path.join(sl.STAGE, "b.jsonl")
if os.path.exists(bp):
  for line in open(bp, encoding="utf-8"):
    try: b_seen.add(json.loads(line)["canonical_url"])
    except Exception: pass

stats: collections.Counter = collections.Counter()
blockers: list[str] = []
hits_by_company: collections.Counter = collections.Counter()
companies_sources: dict[str, int] = {}
seen_titles: set[str] = set(); seen_gn: set[str] = set(); queued: set[str] = set()
estimated = [0]

def norm_title(t: str) -> str: return re.sub(r"\W+", " ", re.sub(r"\s+-\s+[^-]{2,60}$", "", t or "").lower()).strip()
def clean_gn_title(t: str) -> str: return re.sub(r"\s+-\s+[^-]{2,60}$", "", t or "").strip()

# ------------------------------------------------------------------ worker ---------------------------------------------------------
ex = ThreadPoolExecutor(max_workers=WORKERS)
inflight = [0]
def submit(fn, *a):
  while inflight[0] > 120 and time.time() < FETCH_END: time.sleep(0.5)   # bounded backlog
  with _lock: inflight[0] += 1
  def run():
    try: fn(*a)
    except Exception as e: log(f"worker error: {type(e).__name__}: {e}")
    finally:
      with _lock: inflight[0] -= 1
  ex.submit(run)

def keep(it, slug: str | None, kind: str, label: str) -> bool:
  if not it: stats[f"{kind}_invalid"] += 1; return False
  if slug: it["companies"] = sorted(set(it.get("companies") or []) | {slug})
  with _lock:
    ok = stage.add(it)
    if ok:
      stats[f"{kind}_rows"] += 1
      if it.get("published_at_estimated"): estimated[0] += 1
      for s in it["companies"]: hits_by_company[s] += 1
      if label: hits_by_company[f"name:{label}"] += 1
  return ok

def fetch_task(url: str, slug: str | None, kind: str, label: str, hints: dict):
  if time.time() > FETCH_END: return
  c = sl.canonical(url)
  if not c: return
  if c in b_seen: stats["skipped_already_in_b"] += 1; return
  with _lock:
    if c in queued or stage.has(c): stats["dup_queued"] += 1; return
    queued.add(c)
  it = sl.fetch_article(CLS, url, hint_title=hints.get("title"), hint_date=hints.get("date"), hint_outlet=hints.get("outlet"), hint_excerpt=hints.get("excerpt"))
  stats["fetched"] += 1
  keep(it, slug, kind, label)

def gn_task(gi: dict, slug: str | None, kind: str, label: str):
  if time.time() > FETCH_END: return
  u = gi["url"]
  pub = sl.resolve_gnews(u) if "news.google.com" in u else u
  stats["gnews_resolve_attempts"] += 1
  if not pub: stats["gnews_unresolved"] += 1; return
  stats["gnews_resolved"] += 1
  fetch_task(pub, slug, kind, label, {"title": clean_gn_title(gi["title"]), "date": gi["published_at"], "outlet": gi.get("publisher") or None, "excerpt": gi.get("excerpt") or None})

# ------------------------------------------------------------------ discovery helpers ------------------------------------------------
def gnews(query: str, key: str, slug: str | None, label: str, cap: int, kind: str = "gnews", **win) -> int:
  if key in done_queries or time.time() > DISCOVERY_END: return 0
  try: items = sl.google_news_search(query, **win)
  except Exception: items = []
  stats["gnews_queries"] += 1
  n = 0
  for gi in items:
    if n >= cap: break
    nt = norm_title(gi["title"])
    with _lock:
      if gi["url"] in seen_gn or nt in seen_titles: continue
      seen_gn.add(gi["url"]); seen_titles.add(nt)
    submit(gn_task, gi, slug, kind, label); n += 1
  log(f"query-done {key} results={len(items)} new={n}")
  return n

def bing_news(query: str, mkt: str, key: str):
  if key in done_queries or time.time() > DISCOVERY_END: return
  st, body = sl.get("https://www.bing.com/news/search?q=" + urllib.parse.quote(query) + f"&format=rss&mkt={mkt}", _skip_robots=True)
  items = sl.rss_items(body) if st == 200 else []
  stats["bing_queries"] += 1; n = 0
  if st != 200: blockers.append(f"bing news rss {mkt} → HTTP {st}")
  for gi in items[:40]:
    u = gi["url"]
    m = re.search(r"[?&]url=([^&]+)", u)
    if "bing.com" in sl.host_of(u) and m: u = urllib.parse.unquote(m.group(1))
    nt = norm_title(gi["title"])
    with _lock:
      if nt in seen_titles: continue
      seen_titles.add(nt)
    submit(fetch_task, u, None, "bing", query, {"title": gi["title"], "date": gi["published_at"], "outlet": gi.get("publisher") or None, "excerpt": gi.get("excerpt") or None}); n += 1
  log(f"query-done {key} status={st} results={len(items)} new={n}")

def prnewswire():
  total = 0
  for n in range(1, 11):
    key = f"prn:{n}"
    if key in done_queries or time.time() > DISCOVERY_END: continue
    u = f"https://www.prnewswire.com/search/news/?keyword=%22B%20Capital%22&page={n}&pagesize=100"
    st, body = sl.get(u, retries=1)
    if st != 200: blockers.append(f"prnewswire search page {n} → HTTP {st}"); log(f"prn page {n}: HTTP {st}"); break
    links = []
    for l in re.findall(r'href="(/news-releases/[^"]+-\d{6,}\.html)"', body):
      if l not in links: links.append(l)
    for l in links: submit(fetch_task, "https://www.prnewswire.com" + l, None, "wire", "prnewswire", {"outlet": "PR Newswire"})
    total += len(links)
    log(f"query-done {key} links={len(links)}")
    if not links: break
  return total

def other_wires():
  for name, u in [("businesswire", "https://www.businesswire.com/portal/site/home/search/?searchType=news&searchTerm=%22B%20Capital%22&searchPage=1"),
                  ("globenewswire", "https://www.globenewswire.com/search/keyword/%22B%20Capital%22?page=1"),
                  ("accesswire", "https://www.accesswire.com/newsroom?q=%22B%20Capital%22")]:
    st, body = sl.get(u, retries=0)
    if st != 200: blockers.append(f"{name} search → HTTP {st}"); log(f"{name}: HTTP {st}"); continue
    links = set()
    if name == "businesswire": links = set(re.findall(r'href="(https://www\.businesswire\.com/news/home/\d+/en/[^"]+)"', body))
    elif name == "globenewswire": links = {"https://www.globenewswire.com" + l for l in re.findall(r'href="(/news-release/\d{4}/[^"]+)"', body)}
    else: links = set(re.findall(r'href="(https://www\.accesswire\.com/\d+/[^"]+)"', body))
    for l in sorted(links): submit(fetch_task, l, None, "wire", name, {"outlet": name})
    log(f"{name}: HTTP {st} links={len(links)}")

# ------------------------------------------------------------------ company list -------------------------------------------------------
def build_companies() -> tuple[list[tuple[str, str | None]], dict[str, str]]:
  names: dict[str, tuple[str, str | None]] = {}   # lower → (display, slug)
  slug_by_lower: dict[str, str] = {}
  def add(n: str, slug: str | None, src: str):
    n = re.sub(r"\s+", " ", (n or "").strip())
    if not (1 < len(n) < 60) or re.fullmatch(r"b[\s\.\-]?capital( group)?", n, re.I): return
    k = n.lower()
    if k not in names: names[k] = (n, slug); companies_sources[src] = companies_sources.get(src, 0) + 1
    elif slug and not names[k][1]: names[k] = (names[k][0], slug)
  pj = sl.portfolio_companies()
  for c in pj: add(c["name"], c["slug"], "portfolio_json"); slug_by_lower[c["name"].lower()] = c["slug"]
  try:
    import urllib.request
    with urllib.request.urlopen("http://127.0.0.1:4000/companies?limit=200", timeout=5) as r: api = json.loads(r.read())
    for c in api.get("data", []): add(c.get("name"), c.get("slug"), "app_api")
    log(f"app api: {len(api.get('data', []))} companies")
  except Exception as e: log(f"app api unavailable: {type(e).__name__}")
  st, b = sl.get("https://b.capital/portfolio/", retries=1)
  if st == 200:
    for t, s in re.findall(r'"title":"([^"]+)","slug":"([^"]+)","permalink":"\\/companies', b): add(json.loads(f'"{t}"'), slug_by_lower.get(json.loads(f'"{t}"').lower()) or s, "bcapital_page")
  else: blockers.append(f"b.capital/portfolio → HTTP {st}")
  log(f"b.capital page: HTTP {st}")
  st, d = sl.get("https://dealroom.co/investors/b-capital/", retries=1)
  if st == 200:
    for n in re.findall(r'<a href="/companies/[^/"]+/">([^<]+)</a>', d): add(sl.strip_html(n), slug_by_lower.get(sl.strip_html(n).lower()), "dealroom")
    for s in set(re.findall(r'/companies/([a-z0-9\-]+)/', d)):   # the rest of the page only carries slugs (holdings tiles)
      n = re.sub(r"(-\d)+$|-$", "", s).replace("-", " ").strip().title()
      n = {"Byju S": "Byju's", "Pendo Io": "Pendo", "Lunarenergy": "Lunar Energy", "American Well": "Amwell", "Perplexity Ai": "Perplexity", "Poolside Ai": "Poolside", "Reflection Ai": "Reflection AI", "Newfrontinsurance Com": "Newfront", "Apptronik Systems": "Apptronik", "Axiom Math": "Axiom", "Own Company": "Own", "Xingyun Group": "Xingyun", "Credavenue": "CredAvenue", "Datarobot": "DataRobot", "Companycam": "CompanyCam", "Falconx": "FalconX", "Moengage": "MoEngage", "Pharmeasy": "PharmEasy", "Evenup": "EvenUp", "Profoundbio": "ProfoundBio", "Tuhu": "Tuhu", "Zaihui": "Zaihui"}.get(n, n)
      if len(n) > 2: add(n, slug_by_lower.get(n.lower()), "dealroom")
  else: blockers.append(f"dealroom → HTTP {st}")
  log(f"dealroom: HTTP {st}")
  st, c = sl.get("https://www.cbinsights.com/investor/b-capital-group", retries=1)
  if st == 200:
    for n in re.findall(r'href="https://www\.cbinsights\.com/company/[^"]+"[^>]*>([^<]+)</a>', c):
      n = sl.strip_html(n)
      if not INVESTOR_NOISE.search(n) or n.lower() in slug_by_lower: add(n, slug_by_lower.get(n.lower()), "cbinsights")
  else: blockers.append(f"cbinsights → HTTP {st}")
  log(f"cbinsights: HTTP {st}")
  st, t = sl.get("https://tracxn.com/d/venture-capital/b-capital/__vAnWVl1HF7mLz_Whht2Z2hZ4ns8OQXK6WrDhblsa8UE", retries=0)
  if st == 200:
    for n in re.findall(r'href="/d/companies/[^"]+"[^>]*>([^<]{2,50})</a>', t): add(sl.strip_html(n), slug_by_lower.get(sl.strip_html(n).lower()), "tracxn")
  else: blockers.append(f"tracxn → HTTP {st} ({'robots.txt disallow' if st == 999 else 'blocked'})")
  log(f"tracxn: HTTP {st}")
  for n in NAMED:
    k = n.lower(); slug = slug_by_lower.get(k) or slug_by_lower.get(k.replace("'", "’"))
    if not slug:
      for nm, s in slug_by_lower.items():
        if nm.replace(" ", "").replace("-", "") == k.replace(" ", "").replace("-", ""): slug = s; break
    add(n, slug, "named_list")
  for src in ("portfolio_json", "app_api", "bcapital_page", "dealroom", "cbinsights", "tracxn", "named_list"): companies_sources.setdefault(src, 0)
  return list(names.values()), slug_by_lower

# ------------------------------------------------------------------ main ---------------------------------------------------------------
def main():
  log(f"start: {stage.n} items on disk, {len(done_queries)} queries done, {len(b_seen)} class-b urls known, budget {BUDGET_S}s")
  companies, slug_by_lower = build_companies()
  named_lower = {n.lower() for n in NAMED}
  log(f"companies: total={len(companies)} sources={companies_sources}")
  # named seed URLs
  for slug, u in NAMED_URLS: submit(fetch_task, u, slug, "seed", slug or "", {})
  # 3. wire services
  stats["wire_links"] = prnewswire(); other_wires()
  # 5. bing
  for q in ['"led by B Capital"', '"B Capital" raises']:
    for mkt in ("en-US", "en-IN", "en-SG"): bing_news(q, mkt, f"bing:{mkt}:{re.sub(r'\\W+', '_', q)}")
  # 2a. named companies first (2 queries each)
  def company_queries(name: str, slug: str | None, cap: int):
    k = re.sub(r"\W+", "_", name.lower())
    a = gnews(f'"{name}" "B Capital"', f"co:{k}:bcap", slug, name, cap)
    b = gnews(f'"{name}" Saverin OR Ganguly OR Mohla', f"co:{k}:partner", slug, name, cap)
    return a + b
  named = [(n, s) for n, s in companies if n.lower() in named_lower]
  rest = [(n, s) for n, s in companies if n.lower() not in named_lower]
  for n, s in named: company_queries(n, s, 15)
  # 4. quarterly phrase windows 2016 → 2026
  import datetime as dt
  quarters = []
  y, m = 2016, 1
  while (y, m) <= (2026, 10):
    y2, m2 = (y, m + 3) if m < 10 else (y + 1, 1)
    quarters.append((f"{y}-{m:02d}-01", f"{y2}-{m2:02d}-01")); y, m = y2, m2
  for a, b in quarters:
    for i, p in enumerate(PHRASES):
      gnews(p, f"ph:{i}:{a}", None, p, 20, kind="gnews", after=a, before=b)
  # 2b. remaining companies
  for n, s in rest: company_queries(n, s, 10)
  # 2c. yearly windows for the named companies
  for n, s in named:
    k = re.sub(r"\W+", "_", n.lower())
    for yr in range(2016, 2027):
      gnews(f'"{n}" "B Capital"', f"co:{k}:y{yr}", s, n, 8, after=f"{yr}-01-01", before=f"{yr + 1}-01-01")
  log(f"discovery finished at {time.time() - T0:.0f}s; inflight={inflight[0]}")
  while inflight[0] > 0 and time.time() < FETCH_END: time.sleep(2)
  if inflight[0]: log(f"budget exhausted with {inflight[0]} fetches in flight → abandoning")
  dur = time.time() - T0
  summ = stage.summary()
  cw = {k: v for k, v in hits_by_company.items() if not k.startswith("name:")}
  summ.update({
    "companies_total": len(companies), "companies_sources": companies_sources, "companies_with_hits": len(cw), "hits_by_company": dict(sorted(cw.items(), key=lambda kv: -kv[1])),
    "hits_by_query_label": {k[5:]: v for k, v in hits_by_company.most_common() if k.startswith("name:") and v},
    "wire_rows": stats["wire_rows"], "wire_links": stats["wire_links"], "gnews_rows": stats["gnews_rows"], "bing_rows": stats["bing_rows"], "seed_rows": stats["seed_rows"],
    "gnews_queries": stats["gnews_queries"], "gnews_resolve_attempts": stats["gnews_resolve_attempts"], "gnews_resolved": stats["gnews_resolved"], "gnews_unresolved": stats["gnews_unresolved"],
    "bing_queries": stats["bing_queries"], "fetched": stats["fetched"], "skipped_already_in_b": stats["skipped_already_in_b"], "dup_queued": stats["dup_queued"],
    "http_status_counts": dict(_status_counts), "http_requests": _req_count[0], "estimated_dates": estimated[0], "duration_s": round(dur, 1), "budget_s": BUDGET_S,
    "blockers": blockers, "finished_at": sl.NOW(),
  })
  with open(os.path.join(sl.STAGE, f"{CLS}.summary.json"), "w", encoding="utf-8") as f: json.dump(summ, f, indent=2, ensure_ascii=False)
  log(f"done: items={summ['items']} companies_with_hits={summ['companies_with_hits']} wire={stats['wire_rows']} gnews={stats['gnews_rows']} dur={dur:.0f}s status={dict(_status_counts)}")
  sys.stdout.flush(); os._exit(0)

if __name__ == "__main__":
  main()
