#!/usr/bin/env python3
"""collect_b.py — source class (b): PORTFOLIO-COMPANY RELEASES that name B Capital or a partner (2026-10-19 sweep).

Per portfolio company (data/portfolio.json):
  1. own site: sitemap.xml (news|press|blog|… locs) → else /news, /newsroom, /press, /blog, /company/news, /media link pages;
     ≤60 candidates, fetch_article('b', …) and keep only items naming B Capital / a partner (Stage.add enforces registers).
  2. Google News RSS: '"<name>" "B Capital"' → resolve_gnews → fetch_article.
Plus a few seed URLs and the public investor lists (dealroom / crunchbase / cbinsights — mostly 403, recorded as blockers).
Resumable: Stage skips canonical URLs already in data/sweep/b.jsonl; companies logged as 'company-done <slug>' in b.log are skipped.
Hard wall-clock budget: 32 min for collection; ≤2 req/s per host; 6 workers.
"""
from __future__ import annotations
import collections, json, os, re, sys, threading, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as sl

CLS = "b"
BUDGET_S = 32 * 60
COMPANY_CAP_S = 60
MAX_CANDIDATES = 60
WORKERS = 6
T0 = time.time()
DEADLINE = T0 + BUDGET_S

# ------------------------------------------------------------------ throttled / instrumented GET ------------------------------------
_orig_get = sl.get
_host_lock = threading.Lock()
_host_last: dict[str, float] = {}
_status_counts: collections.Counter = collections.Counter()
_req_count = [0]

def _throttle(url: str):
  host = sl.host_of(url)
  while True:
    with _host_lock:
      last = _host_last.get(host, 0.0)
      now = time.time()
      if now - last >= 0.5:
        _host_last[host] = now
        return
      wait_s = 0.5 - (now - last)
    time.sleep(wait_s)

def throttled_get(url, timeout=25, retries=2, headers=None, _skip_robots=False):
  if time.time() > DEADLINE + 60:  # hard stop: refuse new requests well past the budget
    return 0, ""
  _throttle(url)
  st, body = _orig_get(url, timeout=min(timeout, 15), retries=min(retries, 1), headers=headers, _skip_robots=_skip_robots)
  _status_counts[str(st)] += 1
  _req_count[0] += 1
  return st, body

sl.get = throttled_get  # module-internal calls (sitemap_urls, fetch_article, robots…) resolve the global name at call time

# ------------------------------------------------------------------ stage (thread-safe wrappers) ----------------------------------------
stage = sl.Stage(CLS)
_stage_lock = threading.Lock()
def log(msg: str):
  with _stage_lock: stage.log(msg)
def add(it, slug: str | None = None) -> bool:
  if not it: return False
  if slug: it["companies"] = sorted(set(it.get("companies") or []) | {slug})
  with _stage_lock: return stage.add(it)

done_slugs: set[str] = set()
if os.path.exists(stage.logp):
  for line in open(stage.logp, encoding="utf-8"):
    m = re.search(r"company-done (\S+)", line)
    if m: done_slugs.add(m.group(1))

stats = {"companies_scanned": 0, "companies_with_hits": 0, "candidates_fetched": 0, "gnews_queries": 0, "gnews_resolved": 0, "seed_urls": 0}
stats_lock = threading.Lock()
blockers: list[str] = []
hits_by_company: collections.Counter = collections.Counter()

def bump(k: str, n: int = 1):
  with stats_lock: stats[k] = stats.get(k, 0) + n

# ------------------------------------------------------------------ candidate discovery ------------------------------------------------
NEWSY = re.compile(r"news|press|blog|newsroom|media|announc|release|funding|series|investor", re.I)
PRIORITY = re.compile(r"b-?capital|funding|series-[a-f]|raises|raised|investment|investor|round|financing|capital", re.I)
SKIP_EXT = re.compile(r"\.(png|jpe?g|gif|svg|webp|pdf|css|js|xml|mp4|mp3|zip|ico|woff2?)(\?|$)", re.I)
PAGES = ["/news", "/newsroom", "/press", "/blog", "/company/news", "/media"]

def site_base(c: dict) -> str | None:
  w = (c.get("website") or "").strip()
  if not w and c.get("domain"): w = "https://" + c["domain"].strip()
  if not w: return None
  if not w.startswith("http"): w = "https://" + w
  p = urllib.parse.urlsplit(w)
  return f"{p.scheme}://{p.netloc}"

def rank_candidates(urls: list[tuple[str, str | None]]) -> list[str]:
  """urls: (loc, lastmod). Priority: B Capital / funding-ish paths first, then newest lastmod."""
  seen = set(); out = []
  for loc, lm in urls:
    c = sl.canonical(loc)
    if not c or c in seen or SKIP_EXT.search(c): continue
    seen.add(c)
    path = urllib.parse.urlsplit(c).path
    if path.count("/") < 2 and not PRIORITY.search(path): continue  # section index pages, not articles
    out.append((0 if PRIORITY.search(path) else 1, -(int(re.sub(r"\D", "", lm or "0")[:8] or 0)), c))
  out.sort()
  return [c for _, _, c in out][:MAX_CANDIDATES]

def links_on_page(base: str, page_url: str, body: str) -> list[tuple[str, str | None]]:
  host = sl.host_of(base); out = []
  for href in re.findall(r'href=["\']([^"\'#\s]+)', body):
    u = urllib.parse.urljoin(page_url, href.strip())
    if sl.host_of(u) != host: continue
    path = urllib.parse.urlsplit(u).path
    if SKIP_EXT.search(path) or path.rstrip("/") in ("", urllib.parse.urlsplit(page_url).path.rstrip("/")): continue
    if path.count("/") >= 2 or NEWSY.search(path) or PRIORITY.search(path):
      out.append((u, None))
  return out

def discover_candidates(c: dict, base: str, t_end: float) -> tuple[list[str], str]:
  # 1) sitemap.xml
  try:
    locs = sl.sitemap_urls(base + "/sitemap.xml")
  except Exception:
    locs = []
  if time.time() > t_end: return [], "sitemap-timeout"
  cand = rank_candidates([(d["loc"], d.get("lastmod")) for d in locs if NEWSY.search(d["loc"])])
  if cand: return cand, f"sitemap({len(locs)} locs)"
  # 2) section pages
  for pg in PAGES:
    if time.time() > t_end: return [], "pages-timeout"
    st, body = sl.get(base + pg, timeout=12, retries=0)
    if st in (999, 0, 403, 401, 429):
      if st == 999: return [], "robots"
      if st == 403: return [], "403"
      if st == 0: return [], "net"
      continue
    if st != 200 or not body: continue
    cand = rank_candidates(links_on_page(base, base + pg, body))
    if cand: return cand, f"page{pg}"
  return [], "none"

# ------------------------------------------------------------------ per-company task --------------------------------------------------------
def clean_gn_title(t: str) -> str:
  return re.sub(r"\s+-\s+[^-]{2,60}$", "", t or "").strip()

def process_company(c: dict):
  slug, name = c["slug"], c["name"].strip()
  if slug in done_slugs: return
  if time.time() > DEADLINE: log(f"{slug}: skipped (budget exhausted)"); return
  t_start = time.time(); t_end = min(t_start + COMPANY_CAP_S, DEADLINE)
  hits = 0; fetched = 0; how = "no-site"
  base = site_base(c)
  if base:
    try:
      cands, how = discover_candidates(c, base, t_end)
    except Exception as e:
      cands, how = [], f"error:{type(e).__name__}"
    if how in ("robots", "403", "net"): blockers.append(f"{slug}: site {base} → {how}")
    for u in cands:
      if time.time() > t_end: how += ",cap-hit"; break
      if stage.has(u): continue
      try:
        it = sl.fetch_article(CLS, u, hint_outlet=name)
      except Exception:
        it = None
      fetched += 1
      if add(it, slug): hits += 1
    bump("candidates_fetched", fetched)
    log(f"{slug}: site {how} candidates={len(cands)} fetched={fetched} hits={hits} ({time.time()-t_start:.0f}s)")
  # Google News
  gn_hits = 0; gn_n = 0
  if time.time() < DEADLINE:
    try:
      items = sl.google_news_search(f'"{name}" "B Capital"')
    except Exception:
      items = []
    bump("gnews_queries")
    gn_end = min(time.time() + 40, DEADLINE)
    for gi in items[:12]:
      if time.time() > gn_end: break
      blob = f"{gi['title']} {gi['excerpt']}"
      if not (re.search(r"b[\s\.\-]?capital", blob, re.I) or re.search(re.escape(name), blob, re.I)): continue
      pub = sl.resolve_gnews(gi["url"]) if "news.google.com" in gi["url"] else gi["url"]
      if not pub: continue
      bump("gnews_resolved")
      if stage.has(pub): continue
      try:
        it = sl.fetch_article(CLS, pub, hint_title=clean_gn_title(gi["title"]), hint_date=gi["published_at"], hint_outlet=gi["publisher"] or None, hint_excerpt=gi["excerpt"] or None)
      except Exception:
        it = None
      gn_n += 1
      if add(it, slug): gn_hits += 1
    log(f"{slug}: gnews results={len(items)} fetched={gn_n} hits={gn_hits}")
  total = hits + gn_hits
  bump("companies_scanned")
  if total:
    bump("companies_with_hits"); hits_by_company[slug] += total
  log(f"company-done {slug} hits={total} ({time.time()-t_start:.0f}s)")

# ------------------------------------------------------------------ seeds & investor lists ----------------------------------------------------
SEEDS = [
  ("icertis", "Icertis", "https://www.icertis.com/company/leadership/board/raj-ganguly/"),
  ("solar-square", "SolarSquare", "https://startuptalky.com/news/solarsquare-raises-53-million-series-c-funding/"),
  ("solar-square", "SolarSquare", "https://m.economictimes.com/tech/funding/cleantech-startup-solarsquare-raises-53-million-in-funding-round-led-by-b-capital/articleshow/131760590.cms"),
]
INVESTOR_LISTS = ["https://dealroom.co/investors/b-capital/", "https://www.crunchbase.com/organization/b-capital-group", "https://www.cbinsights.com/investor/b-capital-group"]

def run_seeds(slug_by_name: dict[str, str]):
  for slug, name, u in SEEDS:
    if stage.has(u): continue
    try:
      it = sl.fetch_article(CLS, u, hint_outlet=None)
    except Exception as e:
      it = None; log(f"seed error {u}: {e}")
    bump("seed_urls")
    real_slug = slug if slug in slug_by_name.values() else None
    ok = add(it, real_slug)
    log(f"seed {u} → status={it['http_status'] if it else None} kept={ok} title={it['title'][:80] if it else None}")

def run_investor_lists() -> list[str]:
  names: list[str] = []
  t_end = time.time() + 120
  for u in INVESTOR_LISTS:
    if time.time() > t_end: break
    st, body = sl.get(u, timeout=15, retries=0)
    if st != 200 or not body:
      blockers.append(f"investor list {u} → HTTP {st}"); log(f"investor-list {u}: HTTP {st} (blocked)"); continue
    # best-effort: org names from JSON-LD / anchor text of /organization|/companies links
    found = set(re.findall(r'"name"\s*:\s*"([A-Z][\w\.&\- ]{2,40})"', body))
    found |= set(re.sub(r"<[^>]+>", "", m).strip() for m in re.findall(r'<a[^>]+href="[^"]*/(?:organization|companies)/[^"]+"[^>]*>(.*?)</a>', body, re.S))
    found = {n for n in found if 2 < len(n) < 40 and not re.search(r"b capital|crunchbase|dealroom|cb insights", n, re.I)}
    log(f"investor-list {u}: HTTP {st}, parsed {len(found)} names")
    names.extend(sorted(found)[:40])
  return names

def extra_gnews(names: list[str]):
  for name in names:
    if time.time() > DEADLINE: break
    try: items = sl.google_news_search(f'"{name}" "B Capital"')
    except Exception: items = []
    bump("gnews_queries")
    for gi in items[:5]:
      pub = sl.resolve_gnews(gi["url"]) if "news.google.com" in gi["url"] else gi["url"]
      if not pub or stage.has(pub): continue
      bump("gnews_resolved")
      try: it = sl.fetch_article(CLS, pub, hint_title=clean_gn_title(gi["title"]), hint_date=gi["published_at"], hint_outlet=gi["publisher"] or None, hint_excerpt=gi["excerpt"] or None)
      except Exception: it = None
      add(it)
    log(f"extra-gnews {name}: results={len(items)}")

# ------------------------------------------------------------------ main ---------------------------------------------------------------------
def main():
  companies = sl.portfolio_companies()
  if os.environ.get("SWEEP_B_ONLY"): companies = [c for c in companies if c["slug"] in os.environ["SWEEP_B_ONLY"].split(",")]
  slug_by_name = {c["name"]: c["slug"] for c in companies}
  log(f"start: {len(companies)} companies, {len(done_slugs)} already done, {stage.n} items on disk, budget {BUDGET_S}s")
  run_seeds(slug_by_name)
  extra_names: list[str] = []
  try: extra_names = run_investor_lists()
  except Exception as e: log(f"investor-list error: {e}")
  known = {c["name"].lower() for c in companies}
  extra_names = [n for n in extra_names if n.lower() not in known][:30]

  todo = [c for c in companies if c["slug"] not in done_slugs]
  ex = ThreadPoolExecutor(max_workers=WORKERS)
  futs = {ex.submit(process_company, c): c["slug"] for c in todo}
  if extra_names: futs[ex.submit(extra_gnews, extra_names)] = "__extra_gnews__"
  pending = set(futs)
  while pending and time.time() < DEADLINE + 90:
    done, pending = wait(pending, timeout=15, return_when=FIRST_COMPLETED)
    for f in done:
      try: f.result()
      except Exception as e: log(f"task {futs[f]} crashed: {type(e).__name__}: {e}")
  if pending:
    log(f"budget exhausted with {len(pending)} tasks still pending → cancelling")
    for f in pending: f.cancel()
  ex.shutdown(wait=False, cancel_futures=True)

  dur = time.time() - T0
  summ = stage.summary()
  summ.update({
    "companies_scanned": stats["companies_scanned"], "companies_with_hits": stats["companies_with_hits"], "candidates_fetched": stats["candidates_fetched"],
    "http_status_counts": dict(_status_counts), "http_requests": _req_count[0], "gnews_queries": stats["gnews_queries"], "gnews_resolved": stats["gnews_resolved"],
    "seed_urls": stats["seed_urls"], "duration_s": round(dur, 1), "budget_s": BUDGET_S, "blockers": blockers, "hits_by_company": dict(hits_by_company.most_common()),
    "companies_total": len(companies), "companies_skipped_resume": len(done_slugs), "finished_at": sl.NOW(),
  })
  with open(os.path.join(sl.STAGE, f"{CLS}.summary.json"), "w", encoding="utf-8") as f: json.dump(summ, f, indent=2, ensure_ascii=False)
  log(f"done: items={summ['items']} scanned={summ['companies_scanned']} with_hits={summ['companies_with_hits']} dur={dur:.0f}s status={dict(_status_counts)}")
  sys.stdout.flush()
  os._exit(0)  # don't wait for threads stuck in a socket read

if __name__ == "__main__":
  main()
