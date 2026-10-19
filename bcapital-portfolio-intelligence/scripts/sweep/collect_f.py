#!/usr/bin/env python3
"""collect_f — source class (f): rich-list / biography / pre-B-Capital-era coverage of the three principals (2026-10-19 sweep).

  BCAP-002 Eduardo Saverin — Forbes profile, Singapore's 50 Richest, net-worth, Saverin Foundation, NUS, Liverpool, Brazil, Meta stake
  BCAP-004 Karan Mohla     — Chiratae / IDG Ventures India era (YourStory, Inc42, Entrackr, VCCircle, ET, BS, Mint, Moneycontrol, Outlook Business)
  BCAP-003 Raj Ganguly     — Bain Capital / Velos Partners / BCG senior-advisor era (TechCrunch, dot.LA, LABJ, Axios)

Pipeline: seeds → discovery rows (Google News RSS yearly windows ≤2 req/s, Bing News RSS ≤1 req/s, outlet tag/search pages) → resolve
news.google.com links (rate-limited pool) → fetch_article in ThreadPoolExecutor(8) → Stage('f').add (dedup + film-noise / namesake drops).
Resumable: Stage skips canonical URLs already in data/sweep/f.jsonl; file is append-only. Hard wall-clock budget 30 minutes.
Outputs: data/sweep/f.jsonl, f.log, f.rejects.jsonl, f.summary.json.
"""
from __future__ import annotations
import html as _html, json, os, re, sys, threading, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as L

T0 = time.time()
BUDGET = 30 * 60
DISCOVERY_BUDGET = 13 * 60          # discovery must end by this mark so resolve/fetch get the remaining time
stage = L.Stage("f")
S = {"gnews_rows": 0, "bing_rows": 0, "tag_pages_tried": 0, "tag_links": 0, "gnews_queries": 0, "gnews_resolved": 0, "gnews_unresolved": 0,
     "http_status_counts": {}, "blockers": [], "seed_status": {}, "run_added": {"BCAP-002": 0, "BCAP-003": 0, "BCAP-004": 0}, "fetched": 0}
SUBJECT_RE = re.compile(r"eduardo\s+saverin|\bsaverin\b|raj\s+ganguly|karan\s+mohla|\bmohla\b", re.I)
_lock = threading.Lock()

class Limiter:
  """Minimum interval between calls (thread-safe)."""
  def __init__(self, interval: float): self.iv = interval; self.t = 0.0; self.lk = threading.Lock()
  def wait(self):
    with self.lk:
      now = time.time(); d = self.t + self.iv - now
      if d > 0: time.sleep(d); now = time.time()
      self.t = now
GOOGLE = Limiter(0.5)   # ≤ 2 req/s
BING = Limiter(1.0)     # ≤ 1 req/s

def left() -> float: return BUDGET - (time.time() - T0)
def over(mark: float = BUDGET) -> bool:
  if time.time() - T0 >= mark:
    if mark == BUDGET and "time-budget-exhausted" not in S["blockers"]: S["blockers"].append("time-budget-exhausted"); stage.log("TIME BUDGET EXHAUSTED")
    return True
  return False
def hs(st):
  with _lock: S["http_status_counts"][str(st)] = S["http_status_counts"].get(str(st), 0) + 1
def blocker(msg):
  with _lock:
    if msg not in S["blockers"]: S["blockers"].append(msg)
def add(it, reg_hint: str) -> bool:
  """Stage.add (main thread only) + per-register run counters."""
  if not it: return False
  ok = stage.add(it)
  if ok:
    for r in it.get("registers", []):
      if r in S["run_added"]: S["run_added"][r] += 1
    if stage.n % 50 == 0: stage.log(f"progress items={stage.n} dropped={stage.dropped} fetched={S['fetched']} elapsed={int(time.time() - T0)}s")
  return ok

# ------------------------------------------------------------------ candidate rows --------------------------------------------------
# row = {url, title, date, outlet, excerpt, reg, prio}  (url may be a news.google.com link → resolved later)
ROWS: dict[str, dict] = {}
def row(url: str, reg: str, title: str = "", date: str = "", outlet: str = "", excerpt: str = "", prio: int = 1):
  if not url or not url.startswith("http"): return
  key = url if "news.google.com" in url else (L.canonical(url) or url)
  if key in ROWS: return
  if not title and not re.search(r"\.google\.com", url) and stage.has(url): return
  ROWS[key] = {"url": url, "reg": reg, "title": title, "date": date, "outlet": outlet, "excerpt": excerpt, "prio": prio}

def gnews(query: str, reg: str, after=None, before=None, lang="en-US", gl="US", prio: int = 1) -> int:
  if over(DISCOVERY_BUDGET): return 0
  GOOGLE.wait()
  try: rows = L.google_news_search(query, after=after, before=before, lang=lang, gl=gl)
  except Exception as e: stage.log(f"gnews error {query}: {e}"); rows = []
  S["gnews_queries"] += 1; S["gnews_rows"] += len(rows)
  for r in rows:
    p = prio if SUBJECT_RE.search(r["title"] + " " + r["excerpt"]) else prio + 2
    row(r["url"], reg, r["title"], r["published_at"], r["publisher"], r["excerpt"], p)
  return len(rows)

def gnews_yearly(query: str, reg: str, y0: int, y1: int, markets, prio: int = 1):
  tot = 0
  for y in range(y0, y1 + 1):
    for lang, gl in markets:
      if over(DISCOVERY_BUDGET): return
      tot += gnews(query, reg, after=f"{y}-01-01", before=f"{y}-12-31", lang=lang, gl=gl, prio=prio)
  stage.log(f"gnews yearly '{query}' {y0}-{y1} x{len(markets)} rows={tot} candidates={len(ROWS)}")

def bing(query: str, reg: str, mkts=("en-US",)):
  for mkt in mkts:
    if over(DISCOVERY_BUDGET): return
    BING.wait()
    u = "https://www.bing.com/news/search?q=" + urllib.parse.quote(query) + f"&format=rss&count=100&mkt={mkt}"
    st, body = L.get(u, _skip_robots=True); hs(st)
    rows = L.rss_items(body) if st == 200 else []
    S["bing_rows"] += len(rows)
    for r in rows:
      url = r["url"]
      m = re.search(r"[?&](?:url|r)=(https?[^&]+)", url)
      if m and "bing.com" in url: url = urllib.parse.unquote(m.group(1))
      p = 1 if SUBJECT_RE.search(r["title"] + " " + r["excerpt"]) else 3
      row(url, reg, r["title"], r["published_at"], r["publisher"], r["excerpt"], p)
    stage.log(f"bing '{query}' mkt={mkt} status={st} rows={len(rows)}")
    if st != 200: blocker(f"bing news rss HTTP {st} ({mkt})")

ART_HREF = re.compile(r'href=["\']([^"\'#\s]+)["\']', re.I)
ART_PATH = re.compile(r"/20[0-2]\d/|/news/|/article|/story|/stories/", re.I)
SKIP_PATH = re.compile(r"/tag/|/topic/|/search|/author/|/category/|/page/\d|\?s=|/login|/subscribe|/newsletter|/video/|/photos?/|/tags/|/companies/|/markets/|/mutual-funds/|/stocks/|/budget|/elections|/quiz|/podcasts?/", re.I)
def tag_pages(base: str, reg: str, cap: int = 60, max_pages: int = 5):
  """Parse article links from an outlet tag/search page, paginate with ?page=N / /page/N/ while new links appear."""
  host = L.host_of(base); found: list[str] = []; seen = set()
  for n in range(1, max_pages + 1):
    if over(DISCOVERY_BUDGET) or len(found) >= cap: break
    if n == 1: u = base
    elif "?" in base: u = base + f"&page={n}"
    else: u = base.rstrip("/") + f"/page/{n}/"
    st, body = L.get(u); hs(st); S["tag_pages_tried"] += 1
    if st != 200 or not body:
      stage.log(f"tag page {u} status={st}")
      if st in (403, 999, 0, 429): blocker(f"tag page {host} HTTP {st}")
      break
    new = 0
    for h in ART_HREF.findall(body):
      h = _html.unescape(h)
      if h.startswith("//"): h = "https:" + h
      if h.startswith("/"): h = f"https://{urllib.parse.urlsplit(base).netloc}{h}"
      if not h.startswith("http"): continue
      hh = L.host_of(h)
      if hh.split(".")[-2:] != host.split(".")[-2:]: continue
      if not ART_PATH.search(urllib.parse.urlsplit(h).path) or SKIP_PATH.search(h): continue
      c = L.canonical(h)
      if not c or c in seen: continue
      seen.add(c); new += 1
      if len(found) < cap: found.append(h)
    stage.log(f"tag page {u} status={st} new_links={new} total={len(found)}")
    if new == 0: break
  S["tag_links"] += len(found)
  # tag/search listings are the outlet's own relevance ranking → prio 1 when the slug names the subject, else 2
  for h in found: row(h, reg, prio=1 if SUBJECT_RE.search(h.replace("-", " ")) else 2)

# ------------------------------------------------------------------ 1. Eduardo Saverin ---------------------------------------------
SAVERIN_SEEDS = [
  "https://www.forbes.com/profile/eduardo-saverin/",
  "https://bilyonaryo.com/singapores-50-richest-worth-239b-facebook-co-founder-eduardo-saverin-stays-no-1-for-4th-year/",
  "https://www.asiaone.com/money/singapore-50-richest-list-2026-eduardo-saverin-ocbc-lee-family",
  "https://malaysia.news.yahoo.com/eduardo-saverin-keeps-singapore-rich-033139936.html",
  "https://www.forbes.com/sites/naazneenkarmali/2017/12/08/facebook-co-founder-eduardo-saverin-becomes-singapores-richest-person/",
]
MOHLA_SEEDS = ["https://yourstory.com/tag/karan-mohla", "https://yourstory.com/2020/08/investors-startup-pitching-tips-chiratae-ventures-karan-mohla"]
GANGULY_SEEDS = ["https://www.crunchbase.com/person/raj-ganguly", "https://www.bcg.com/about/people/experts/raj-ganguly", "https://www.velospartners.com/"]

def seeds():
  stage.log("== seeds (direct fetch)")
  for reg, urls, outlet_hint in (("BCAP-002", SAVERIN_SEEDS, None), ("BCAP-004", MOHLA_SEEDS, None), ("BCAP-003", GANGULY_SEEDS, None)):
    for u in urls:
      if over(): return
      if stage.has(u): S["seed_status"][u] = "resumed"; continue
      if "/tag/" in u: tag_pages(u, reg); S["seed_status"][u] = "tag-page"; continue
      slug = re.sub(r"[-_/]+", " ", urllib.parse.urlsplit(u).path).strip().title() or L.host_of(u)
      hint = {"BCAP-002": "Eduardo Saverin", "BCAP-003": "Raj Ganguly", "BCAP-004": "Karan Mohla"}[reg]
      it = L.fetch_article("f", u, hint_title=f"{hint} — {slug}", hint_excerpt=f"{hint} profile page: {u}", glyph="web" if re.search(r"crunchbase|bcg\.com|velospartners|forbes\.com/profile", u) else None, wayback=True)
      st = it.get("http_status") if it else None
      hs(st); S["seed_status"][u] = st
      if st in (403, 999, 0, 404, 429): blocker(f"seed {L.host_of(u)} HTTP {st}: {u}")
      ok = add(it, reg) if it else False
      stage.log(f"seed {u} status={st} added={ok} regs={(it or {}).get('registers')}")

def discover_saverin():
  stage.log("== Saverin discovery")
  mk = [("en-US", "US"), ("en-SG", "SG")]
  for q in ['"Eduardo Saverin" richest', '"Saverin" "Singapore\'s 50 richest"', '"Eduardo Saverin" net worth', '"Eduardo Saverin" Forbes',
            '"Saverin Foundation"', '"Eduardo Saverin" NUS scholarship', '"Eduardo Saverin" Liverpool', '"Eduardo Saverin" Brazil', '"Eduardo Saverin" Meta stake']:
    if over(DISCOVERY_BUDGET): return
    gnews_yearly(q, "BCAP-002", 2015, 2026, mk)
  for q in ['site:caproasia.com Saverin', 'site:scmp.com "Eduardo Saverin"', 'site:forbes.com "Eduardo Saverin" Singapore', 'site:asiaone.com Saverin']:
    n = gnews(q, "BCAP-002"); stage.log(f"gnews '{q}' rows={n}")
  bing('"Eduardo Saverin" richest', "BCAP-002", ("en-US", "en-SG"))

def discover_mohla():
  stage.log("== Mohla discovery")
  gnews_yearly('"Karan Mohla"', "BCAP-004", 2012, 2026, [("en-IN", "IN"), ("en-US", "US")])
  for q in ['"Karan Mohla" Chiratae', '"Karan Mohla" IDG Ventures', '"Karan Mohla" Oye Rickshaw', '"Karan Mohla" Outlook Business', '"Mohla" Chiratae partner', '"Karan Mohla" B Capital']:
    if over(DISCOVERY_BUDGET): return
    n = gnews(q, "BCAP-004", lang="en-IN", gl="IN"); stage.log(f"gnews '{q}' rows={n}")
  bing('"Karan Mohla"', "BCAP-004", ("en-IN", "en-US"))
  for u in ["https://inc42.com/tag/karan-mohla/", "https://entrackr.com/?s=Karan+Mohla", "https://www.vccircle.com/search?q=Karan%20Mohla", "https://yourstory.com/search?q=karan%20mohla",
            "https://economictimes.indiatimes.com/topic/karan-mohla", "https://www.business-standard.com/topic/karan-mohla", "https://www.outlookbusiness.com/search?q=karan+mohla",
            "https://www.moneycontrol.com/news/tags/karan-mohla.html", "https://www.livemint.com/Search/Link/Keyword/Karan%20Mohla"]:
    if over(DISCOVERY_BUDGET): return
    tag_pages(u, "BCAP-004")

def discover_ganguly():
  stage.log("== Ganguly discovery")
  gnews_yearly('"Raj Ganguly"', "BCAP-003", 2010, 2026, [("en-US", "US"), ("en-IN", "IN")])
  for q in ['"Raj Ganguly" Bain Capital', '"Raj Ganguly" Velos Partners', '"Raj Ganguly" BCG', '"Raj Ganguly" Harvard', '"Raj Ganguly" co-CEO', '"Raj Ganguly" Liverpool', '"Raj Ganguly" B Capital']:
    if over(DISCOVERY_BUDGET): return
    n = gnews(q, "BCAP-003"); stage.log(f"gnews '{q}' rows={n}")
  bing('"Raj Ganguly"', "BCAP-003", ("en-US", "en-IN"))
  for u in ["https://techcrunch.com/tag/raj-ganguly/", "https://dot.la/?s=raj+ganguly", "https://labusinessjournal.com/?s=raj+ganguly", "https://www.axios.com/search?q=raj+ganguly"]:
    if over(DISCOVERY_BUDGET): return
    tag_pages(u, "BCAP-003")

# ------------------------------------------------------------------ resolve + fetch -------------------------------------------------
def resolve(r: dict) -> dict:
  if "news.google.com" in r["url"]:
    GOOGLE.wait()
    try: real = L.resolve_gnews(r["url"])
    except Exception: real = None
    r = dict(r, real=real)
  else: r = dict(r, real=r["url"])
  return r

def fetch(r: dict) -> tuple[dict, dict | None]:
  try:
    it = L.fetch_article("f", r["real"], hint_title=r["title"] or None, hint_date=r["date"] or None, hint_outlet=r["outlet"] or None, hint_excerpt=r["excerpt"] or None)
  except Exception as e:
    it = None
  return r, it

def ordered_rows() -> list[dict]:
  """Round-robin across registers, priority first, so a time-out never starves one person."""
  by: dict[str, list[dict]] = {}
  for r in ROWS.values(): by.setdefault(r["reg"], []).append(r)
  for v in by.values(): v.sort(key=lambda r: (r["prio"], r["date"] == "", r["date"]))
  out = []; regs = list(by)
  while any(by.values()):
    for g in regs:
      if by[g]: out.append(by[g].pop(0))
  return out

def process():
  rows = ordered_rows()
  stage.log(f"== resolve+fetch candidates={len(rows)} gnews={sum('news.google.com' in r['url'] for r in rows)} time_left={int(left())}s")
  pending_fetch = []
  with ThreadPoolExecutor(max_workers=3) as RP, ThreadPoolExecutor(max_workers=8) as FP:
    rf = {RP.submit(resolve, r): r for r in rows}
    done_r = 0
    try:
      for fut in as_completed(rf):
        done_r += 1
        if over():
          RP.shutdown(wait=False, cancel_futures=True); break
        r = fut.result()
        if "news.google.com" in r["url"]:
          if r.get("real"): S["gnews_resolved"] += 1
          else: S["gnews_unresolved"] += 1; continue
        if not r.get("real") or stage.has(r["real"]): continue
        if "news.google.com" in r["real"]: S["gnews_unresolved"] += 1; continue
        pending_fetch.append(FP.submit(fetch, r))
        if done_r % 100 == 0: stage.log(f"resolved {done_r}/{len(rows)} fetch_queue={len(pending_fetch)} items={stage.n} elapsed={int(time.time() - T0)}s")
        # drain finished fetches opportunistically so Stage writes happen in the main thread
        still = []
        for pf in pending_fetch:
          if pf.done(): _consume(pf)
          else: still.append(pf)
        pending_fetch = still
    finally:
      for pf in pending_fetch:
        if over(): pf.cancel(); continue
        try: _consume(pf, wait=max(1, int(left())))
        except Exception: pass
      FP.shutdown(wait=False, cancel_futures=True)
  stage.log(f"resolve+fetch done resolved={S['gnews_resolved']} unresolved={S['gnews_unresolved']} fetched={S['fetched']} items={stage.n}")

def _consume(pf, wait: int | None = 0):
  try: r, it = pf.result(timeout=wait)
  except Exception: return
  S["fetched"] += 1
  if it: hs(it.get("http_status")); add(it, r["reg"])

# ------------------------------------------------------------------ main -----------------------------------------------------------
def main():
  stage.log(f"start collect_f resume_items={stage.n} budget={BUDGET}s")
  for step in (seeds, discover_saverin, discover_mohla, discover_ganguly):
    if over(DISCOVERY_BUDGET): stage.log(f"discovery budget hit before {step.__name__}"); blocker(f"discovery budget hit before {step.__name__}"); continue
    try: step()
    except Exception as e: stage.log(f"step {step.__name__} failed: {type(e).__name__}: {e}"); blocker(f"{step.__name__}: {type(e).__name__}")
  stage.log(f"discovery done gnews_queries={S['gnews_queries']} gnews_rows={S['gnews_rows']} bing_rows={S['bing_rows']} tag_pages={S['tag_pages_tried']} candidates={len(ROWS)} elapsed={int(time.time() - T0)}s")
  if not over():
    try: process()
    except Exception as e: stage.log(f"process failed: {type(e).__name__}: {e}"); blocker(f"process: {type(e).__name__}")
  # totals over the whole file (incl. resumed rows)
  per = {"BCAP-002": 0, "BCAP-003": 0, "BCAP-004": 0}; samples = []
  for line in open(stage.path, encoding="utf-8"):
    try: d = json.loads(line)
    except Exception: continue
    for r in d.get("registers", []):
      if r in per: per[r] += 1
    if len(samples) < 3 and d.get("date_source") not in ("estimated", "unknown") and not d.get("published_at_estimated"): samples.append({"title": d["title"], "published_at": d["published_at"], "url": d["canonical_url"]})
  rej = {"film-noise": 0, "namesake": 0, "off-subject": 0}
  rp = os.path.join(L.STAGE, "f.rejects.jsonl")
  if os.path.exists(rp):
    for line in open(rp, encoding="utf-8"):
      try: rej[json.loads(line)["reason"]] = rej.get(json.loads(line)["reason"], 0) + 1
      except Exception: pass
  summ = stage.summary()
  summ.update({"per_register": per, "film_noise_dropped": stage.dropped.get("film-noise", 0), "namesake_dropped": stage.dropped.get("namesake", 0), "rejects_file_totals": rej,
               "gnews_queries": S["gnews_queries"], "gnews_rows": S["gnews_rows"], "gnews_resolved": S["gnews_resolved"], "gnews_unresolved": S["gnews_unresolved"], "bing_rows": S["bing_rows"],
               "tag_pages_tried": S["tag_pages_tried"], "tag_links": S["tag_links"], "candidates": len(ROWS), "fetched": S["fetched"], "http_status_counts": S["http_status_counts"],
               "seed_status": S["seed_status"], "run_added": S["run_added"], "duration_s": round(time.time() - T0, 1), "blockers": S["blockers"], "samples": samples, "finished_at": L.NOW()})
  with open(os.path.join(L.STAGE, "f.summary.json"), "w", encoding="utf-8") as f: json.dump(summ, f, indent=2, ensure_ascii=False)
  stage.log(f"done {json.dumps(summ)[:1500]}")

if __name__ == "__main__":
  main()
