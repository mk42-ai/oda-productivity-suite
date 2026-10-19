#!/usr/bin/env python3
"""collect_g_karan — source class (g-karan): register BCAP-004 Karan Mohla deep sweep (2026-10-19).

Sources: 1) direct seeds (b.capital, CNBC, ET/Moneycontrol/BusinessLine SolarSquare coverage, YouTube talks, Entrepreneur/YourStory/KrAsia/Outlook
interviews, LinkedIn/X/Instagram profile probes incl. the X syndication timeline); 2) outlet tag/search pages (paginated); 3) Google News RSS
half-year windows 2012→2026 (en-IN + en-US) for 8 queries + no-window social queries; 4) Bing News RSS + Bing web HTML (base64 ck/a wrappers);
5) GDELT DOC 2.0 yearly windows 2015→2026.
Pipeline: discovery (serial, ≤2 Google req/s) → resolve news.google.com links (pool 3) → fetch_article (pool 8) → Stage('g-karan').add.
Resumable / append-only (Stage skips canonical URLs already in data/sweep/g-karan.jsonl). Hard wall-clock budget 28 minutes.
Known-URL skip: rows whose canonical URL already sits in web/data/reputation/evidence.json or an earlier sweep file are NOT re-fetched
(the merge dedups them anyway) so the budget goes to genuinely new URLs.
Outputs: data/sweep/g-karan.jsonl, g-karan.log, g-karan.rejects.jsonl, g-karan.summary.json.
"""
from __future__ import annotations
import base64, html as _html, json, os, re, sys, threading, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as L

T0 = time.time()
BUDGET = 28 * 60 - 40              # leave margin for the summary before the external `timeout 1800`
DISCOVERY_BUDGET = 13 * 60
TODAY = "2026-10-19"
REG = "BCAP-004"
stage = L.Stage("g-karan")
S = {"seeds_ok": 0, "seeds_failed": [], "seed_status": {}, "tag_pages_tried": 0, "tag_links": 0, "gnews_queries": 0, "gnews_rows": 0, "gnews_resolved": 0, "gnews_unresolved": 0,
     "bing_rows": 0, "gdelt_rows": 0, "http_status_counts": {}, "blockers": [], "fetched": 0, "known_skipped": 0, "estimated_dates": 0, "x_tweets": 0}
SUBJECT_RE = re.compile(r"karan\s+mohla|\bmohla\b|karanmohla", re.I)
_lock = threading.Lock()

# ---------------------------------------------------------------- known canonical URLs (evidence.json + earlier sweep files) -------------
KNOWN: set[str] = set()
def load_known():
  p = os.path.join(L.ROOT, "web", "data", "reputation", "evidence.json")
  try:
    for e in json.load(open(p, encoding="utf-8")):
      c = e.get("canonical_url")
      if c: KNOWN.add(c)
  except Exception as ex: stage.log(f"evidence.json not loaded: {ex}")
  for fn in os.listdir(L.STAGE):
    if fn.endswith(".jsonl") and not fn.startswith("g-karan") and "rejects" not in fn:
      try:
        for line in open(os.path.join(L.STAGE, fn), encoding="utf-8"):
          try: KNOWN.add(json.loads(line)["canonical_url"])
          except Exception: pass
      except Exception: pass
  stage.log(f"known canonical urls={len(KNOWN)}")
def known(url: str) -> bool:
  c = L.canonical(url); return bool(c) and (c in KNOWN or c in stage.seen)

class Limiter:
  def __init__(self, interval: float): self.iv = interval; self.t = 0.0; self.lk = threading.Lock()
  def wait(self):
    with self.lk:
      now = time.time(); d = self.t + self.iv - now
      if d > 0: time.sleep(d); now = time.time()
      self.t = now
GOOGLE = Limiter(0.5); BING = Limiter(1.0)

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
def force_reg(it: dict | None) -> dict | None:
  if it and REG not in it["registers"]: it["registers"].append(REG)
  return it
def add(it, keep_offsubject: bool = False) -> bool:
  if not it: return False
  ok = stage.add(it, keep_offsubject=keep_offsubject)
  if ok:
    if it.get("published_at_estimated"): S["estimated_dates"] += 1
    if stage.n % 25 == 0: stage.log(f"progress items={stage.n} dropped={stage.dropped} fetched={S['fetched']} elapsed={int(time.time() - T0)}s")
  return ok

# ---------------------------------------------------------------- candidate rows ---------------------------------------------------------
ROWS: dict[str, dict] = {}
def row(url: str, title: str = "", date: str = "", outlet: str = "", excerpt: str = "", prio: int = 1, src: str = ""):
  if not url or not url.startswith("http"): return
  key = url if "news.google.com" in url else (L.canonical(url) or url)
  if key in ROWS: return
  if "news.google.com" not in url and known(url): S["known_skipped"] += 1; return
  ROWS[key] = {"url": url, "title": title, "date": date, "outlet": outlet, "excerpt": excerpt, "prio": prio, "src": src}

# ---------------------------------------------------------------- 1. seeds ------------------------------------------------------------------
SEEDS = [
  ("https://b.capital/team/karan-mohla/", "Karan Mohla — Partner, B Capital (team page)", True),
  ("https://b.capital/why-we-invested/why-we-invested-in-solarsquare/", "Why We Invested in SolarSquare — B Capital", True),
  ("https://b.capital/why-we-invested/why-we-invested-sugarfit/", "Why We Invested: Sugarfit — B Capital", True),
  ("https://b.capital/why-we-invested/why-we-invested-bhanzu/", "Why We Invested: Bhanzu — B Capital", True),
  ("https://www.cnbc.com/video/2026/06/17/b-capital-on-space-tech.html", "B Capital on space tech — CNBC video (Karan Mohla)", True),
  ("https://www.cnbc.com/video/2026/06/17/b-capital-on-india-space-tech.html", "B Capital on India space tech — CNBC video (Karan Mohla)", True),
  ("https://m.economictimes.com/tech/funding/cleantech-startup-solarsquare-raises-53-million-in-funding-round-led-by-b-capital/articleshow/131760590.cms", "Cleantech startup SolarSquare raises $53 million in funding round led by B Capital", False),
  ("https://m.economictimes.com/industry/renewables/solarsquare-raises-53-million-in-indias-largest-residential-solar-funding-round/articleshow/131758098.cms", "SolarSquare raises $53 million in India's largest residential solar funding round", False),
  ("https://www.moneycontrol.com/news/business/startup/solarsquare-raises-53-million-in-series-c-round-led-by-b-capital-13950439.html", "SolarSquare raises $53 million in Series C round led by B Capital", False),
  ("https://www.energetica-india.net/news/solarsquare-raises-usd-53-mn-in-series-c-round-led-by-b-capital-to-expand-residential-solar-business", "SolarSquare raises USD 53 mn in Series C round led by B Capital", False),
  ("https://www.thehindubusinessline.com/markets/solarsquare-raises-53-million-series-c-funding-led-by-b-capital-to-expand-residential-solar/article71109815.ece", "SolarSquare raises $53 million Series C funding led by B Capital", False),
  ("https://www.bwdisrupt.com/article/solarsquare-raises-53-mn-in-series-c-round-from-b-capital-existing-investors-610837", "SolarSquare raises $53 mn in Series C round from B Capital, existing investors", False),
  ("https://startuptalky.com/news/solarsquare-raises-53-million-series-c-funding/", "SolarSquare raises $53 million Series C funding", False),
  ("https://www.instagram.com/reel/CzBTpy_PHd6/", "Karan Mohla — Instagram reel CzBTpy_PHd6", True),
  ("https://india.entrepreneur.com/finance/being-a-value-added-partner-to-founders-and-making/456364", "Being a value-added partner to founders — Karan Mohla (Entrepreneur India)", True),
  ("https://yourstory.com/2020/08/investors-startup-pitching-tips-chiratae-ventures-karan-mohla", "Startup pitching tips from Chiratae Ventures' Karan Mohla — YourStory", True),
  ("https://kr-asia.com/what-it-takes-for-indian-startups-to-go-global-qa-with-karan-mohla-of-chiratae-ventures", "What it takes for Indian startups to go global: Q&A with Karan Mohla of Chiratae Ventures — KrASIA", True),
  ("https://www.outlookbusiness.com/enterprise/trend/pace-of-money-flowing-into-early-stage-has-accelerated-ev", "Pace of money flowing into early stage has accelerated — Karan Mohla (Outlook Business)", True),
  ("https://www.linkedin.com/in/karan-mohla-153998", "Karan Mohla — LinkedIn profile", True),
  ("https://twitter.com/karanmohla", "Karan Mohla (@karanmohla) — X profile", True),
]
YT_SEEDS = [
  ("https://www.youtube.com/watch?v=eSBr39UU2k8", "Business Standard", "2026-03-19"),
  ("https://www.youtube.com/watch?v=6w9OEy-BOUA", "Indian Silicon Valley", "2023-06-01"),
  ("https://www.youtube.com/watch?v=d5HbrW6SDwk", "1947 Rise", "2022-06-01"),
  ("https://www.youtube.com/watch?v=Ear_HgkuCPQ", "India Global Forum UK-India Week", "2023-06-28"),
]
def seed_result(u: str, st, ok: bool, regs=None):
  hs(st); S["seed_status"][u] = st
  if st == 200 and ok: S["seeds_ok"] += 1
  elif st != 200: S["seeds_failed"].append({"url": u, "status": st})
  if st in (0, 403, 404, 429, 999): blocker(f"seed {L.host_of(u)} HTTP {st}: {u}")
  stage.log(f"seed {u} status={st} added={ok} regs={regs}")

def seeds():
  stage.log("== seeds")
  # Eureka Robotics post: locate on the why-we-invested index
  st, body = L.get("https://b.capital/why-we-invested/"); hs(st)
  eureka = None
  if st == 200:
    for h in re.findall(r'href=["\'](https?://b\.capital/why-we-invested/[^"\'#]+)', body):
      if "eureka" in h.lower(): eureka = h; break
    for h in re.findall(r'href=["\'](https?://b\.capital/why-we-invested/[^"\'#]+)', body):
      if not known(h) and h.rstrip("/") != "https://b.capital/why-we-invested": row(h, prio=2, src="bcap-index")
  if not eureka: eureka = "https://b.capital/why-we-invested/why-we-invested-eureka-robotics/"; stage.log("eureka post not found on index; trying guessed slug")
  all_seeds = SEEDS + [(eureka, "Why We Invested: Eureka Robotics — B Capital (Jan 9 2025)", True)]
  for u, hint, about_him in all_seeds:
    if over(): return
    if stage.has(u): S["seed_status"][u] = "resumed"; continue
    if "twitter.com/karanmohla" in u or "linkedin.com/in/" in u or "instagram.com" in u:
      st, body = L.get(u); hs(st)
      excerpt = f"Karan Mohla, Partner at B Capital (ex-Chiratae Ventures / IDG Ventures India) — profile page {u}. Fetch status {st}."
      it = L.make_item(source_class="g-karan", url=u, title=hint, text=excerpt, published_at="2026-10-19", date_source="estimated", estimated=True, http_status=st, platform_glyph=L.glyph_for(u))
      if st == 200 and body and "<html" in body[:5000].lower():
        t = L.html_title(body); d = L.meta(body, "og:description", "description")
        if t and "login" not in t.lower(): it = L.make_item(source_class="g-karan", url=u, title=t, text=(d or "") + "\n" + L.article_text(body)[:4000], published_at="2026-10-19", date_source="estimated", estimated=True, http_status=st, platform_glyph=L.glyph_for(u))
      ok = add(force_reg(it), keep_offsubject=True); seed_result(u, st, ok, (it or {}).get("registers"))
      if st != 200: blocker(f"social profile blocked ({st}): {u}")
      if "twitter.com" in u: x_syndication()
      continue
    hint_date = "2025-01-09" if "eureka" in u else ("2026-06-17" if "cnbc.com" in u else None)
    it = L.fetch_article("g-karan", u, hint_title=hint, hint_date=hint_date, hint_excerpt=f"{hint}. Source: {u}", wayback=True)
    if about_him: force_reg(it)
    st = it.get("http_status") if it else 0
    ok = add(it); seed_result(u, st, ok, (it or {}).get("registers"))
  for u, chan_hint, date_hint in YT_SEEDS:
    if over(): return
    if stage.has(u): S["seed_status"][u] = "resumed"; continue
    try: m = L.youtube_meta(u)
    except Exception as e: m = None; stage.log(f"youtube_meta error {u}: {e}")
    st = (m or {}).get("http_status") or 0
    title = (m or {}).get("title") or f"Karan Mohla — {chan_hint} (YouTube)"
    chan = (m or {}).get("channel") or chan_hint
    text = f"{title}\n{chan}\n{(m or {}).get('description') or ''}\nFeaturing Karan Mohla (B Capital; formerly Chiratae Ventures)."
    it = L.make_item(source_class="g-karan", url=u, title=title, text=text, outlet=chan, author=chan, published_at=(m or {}).get("published_at") or date_hint,
                     date_source="jsonld" if (m or {}).get("published_at") else "given", estimated=not (m or {}).get("published_at"), http_status=st, platform_glyph="youtube")
    ok = add(force_reg(it)); seed_result(u, st, ok, (it or {}).get("registers"))

def x_syndication():
  u = "https://syndication.twitter.com/srv/timeline-profile/screen-name/karanmohla"
  st, body = L.get(u, _skip_robots=True); hs(st)
  stage.log(f"x syndication status={st} len={len(body)}")
  if st != 200 or "__NEXT_DATA__" not in body: blocker(f"x syndication timeline HTTP {st} / no __NEXT_DATA__"); return
  try:
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S)
    data = json.loads(m.group(1)); entries = data["props"]["pageProps"]["timeline"]["entries"]
  except Exception as e: blocker(f"x syndication parse: {type(e).__name__}"); return
  n = 0
  for e in entries:
    tw = (e.get("content") or {}).get("tweet") or {}
    if not tw: continue
    user = (tw.get("user") or {}).get("screen_name", "")
    tid = tw.get("id_str"); text = tw.get("full_text") or tw.get("text") or ""
    if not tid: continue
    url = f"https://x.com/{user or 'karanmohla'}/status/{tid}"
    it = L.make_item(source_class="g-karan", url=url, title=f"@{user}: {text[:120]}", text=text, outlet="X", author=f"@{user}", published_at=L.iso_date(tw.get("created_at")), date_source="api", http_status=200, platform_glyph="x", provider_receipt=True)
    mine = user.lower() == "karanmohla"
    if mine: force_reg(it)
    if add(it, keep_offsubject=mine): n += 1
  S["x_tweets"] = n; stage.log(f"x syndication tweets added={n} entries={len(entries)}")

# ---------------------------------------------------------------- 2. tag / search pages --------------------------------------------------
TAG_PAGES = ["https://yourstory.com/tag/karan-mohla", "https://yourstory.com/search?q=karan%20mohla", "https://inc42.com/tag/karan-mohla/", "https://inc42.com/?s=karan+mohla",
             "https://entrackr.com/?s=Karan+Mohla", "https://www.vccircle.com/search?q=Karan%20Mohla", "https://economictimes.indiatimes.com/topic/karan-mohla",
             "https://www.business-standard.com/topic/karan-mohla", "https://www.moneycontrol.com/news/tags/karan-mohla.html", "https://www.livemint.com/topic/karan-mohla",
             "https://www.dealstreetasia.com/?s=karan+mohla", "https://www.medianama.com/?s=karan+mohla", "https://www.financialexpress.com/about/karan-mohla/", "https://techcrunch.com/?s=karan+mohla"]
ART_HREF = re.compile(r'href=["\']([^"\'#\s]+)["\']', re.I)
ART_PATH = re.compile(r"/20[0-2]\d/|/news/|/article|/story|/stories/|/funding", re.I)
SKIP_PATH = re.compile(r"/tag/|/topic/|/search|/author/|/category/|/page/\d|\?s=|/login|/subscribe|/newsletter|/photos?/|/tags/|/companies/|/markets/|/mutual-funds/|/stocks/|/budget|/elections|/quiz|/about/|/privacy|/terms|/rss|/feed", re.I)
def tag_pages(base: str, cap: int = 80, max_pages: int = 6):
  host = L.host_of(base); found: list[str] = []; seen = set()
  for n in range(1, max_pages + 1):
    if over(DISCOVERY_BUDGET) or len(found) >= cap: break
    if n == 1: u = base
    elif "?" in base: u = base + f"&page={n}"
    else: u = base.rstrip("/") + f"/page/{n}/"
    st, body = L.get(u); hs(st); S["tag_pages_tried"] += 1
    if st != 200 or not body:
      stage.log(f"tag page {u} status={st}")
      if st in (403, 999, 0, 429, 404): blocker(f"tag page {host} HTTP {st}")
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
  for h in found: row(h, prio=1 if SUBJECT_RE.search(h.replace("-", " ")) else 2, src="tag")

# ---------------------------------------------------------------- 3. Google News RSS -----------------------------------------------------
GN_QUERIES = ['"Karan Mohla"', '"Karan Mohla" Chiratae', '"Karan Mohla" IDG Ventures', '"Karan Mohla" "B Capital"', '"Mohla" "B Capital"',
              '"Karan Mohla" FirstCry OR Xpressbees OR HealthifyMe OR CropIn OR Bounce OR "Oye Rickshaw"',
              '"Karan Mohla" Sugarfit OR Bhanzu OR SolarSquare OR Turno OR Nektar OR "Eureka Robotics"', '"Karan Mohla" podcast OR interview OR fireside']
GN_NOWINDOW = ['"Karan Mohla" linkedin', 'site:linkedin.com "Karan Mohla"', 'site:x.com "Karan Mohla"']
def half_year_windows(y0: int, y1: int, end: str):
  for y in range(y0, y1 + 1):
    for a, b in ((f"{y}-01-01", f"{y}-06-30"), (f"{y}-07-01", f"{y}-12-31")):
      if a > end: return
      yield a, min(b, end)
def gnews(query: str, after=None, before=None, lang="en-IN", gl="IN", prio: int = 1) -> int:
  if over(DISCOVERY_BUDGET): return 0
  GOOGLE.wait()
  try: rows = L.google_news_search(query, after=after, before=before, lang=lang, gl=gl)
  except Exception as e: stage.log(f"gnews error {query}: {e}"); rows = []
  S["gnews_queries"] += 1; S["gnews_rows"] += len(rows)
  for r in rows:
    p = prio if SUBJECT_RE.search(r["title"] + " " + r["excerpt"]) else prio + 2
    row(r["url"], r["title"], r["published_at"], r["publisher"], r["excerpt"], p, src="gnews")
  return len(rows)
def discover_gnews():
  stage.log("== Google News RSS (half-year windows 2012→2026, en-IN + en-US)")
  for q in GN_NOWINDOW:
    for lang, gl in (("en-IN", "IN"), ("en-US", "US")): n = gnews(q, lang=lang, gl=gl); stage.log(f"gnews '{q}' {gl} rows={n}")
  # most specific first so a budget cut still covers the long tail of the main query across all windows
  for q in GN_QUERIES:
    tot = 0
    for a, b in half_year_windows(2012, 2026, TODAY):
      for lang, gl in (("en-IN", "IN"), ("en-US", "US")):
        if over(DISCOVERY_BUDGET): stage.log(f"gnews budget cut at '{q}' {a}"); blocker("gnews windows truncated by discovery budget"); return
        tot += gnews(q, after=a, before=b, lang=lang, gl=gl)
    stage.log(f"gnews '{q}' half-year windows rows={tot} candidates={len(ROWS)} elapsed={int(time.time() - T0)}s")

# ---------------------------------------------------------------- 4. Bing -----------------------------------------------------------------
def discover_bing():
  stage.log("== Bing News RSS + web HTML")
  for mkt in ("en-IN", "en-US"):
    if over(DISCOVERY_BUDGET): return
    BING.wait()
    u = f"https://www.bing.com/news/search?q=%22Karan+Mohla%22&format=rss&count=100&mkt={mkt}"
    st, body = L.get(u, _skip_robots=True); hs(st)
    rows = L.rss_items(body) if st == 200 else []
    S["bing_rows"] += len(rows)
    for r in rows:
      url = r["url"]; m = re.search(r"[?&](?:url|r)=(https?[^&]+)", url)
      if m and "bing.com" in url: url = urllib.parse.unquote(m.group(1))
      row(url, r["title"], r["published_at"], r["publisher"], r["excerpt"], 1 if SUBJECT_RE.search(r["title"] + " " + r["excerpt"]) else 3, src="bing-news")
    stage.log(f"bing news rss mkt={mkt} status={st} rows={len(rows)}")
    if st != 200: blocker(f"bing news rss HTTP {st} ({mkt})")
  for first in (1, 51, 101):
    if over(DISCOVERY_BUDGET): return
    BING.wait()
    u = f"https://www.bing.com/search?q=%22Karan+Mohla%22+Chiratae&count=50&first={first}"
    st, body = L.get(u, _skip_robots=True); hs(st)
    n = 0
    if st == 200:
      for h in re.findall(r'href=["\'](https?://www\.bing\.com/ck/a\?[^"\']+)', body):
        m = re.search(r"[&?]u=a1([A-Za-z0-9_-]+)", _html.unescape(h))
        if not m: continue
        try: real = base64.urlsafe_b64decode(m.group(1) + "=" * (-len(m.group(1)) % 4)).decode("utf-8", "replace")
        except Exception: continue
        if real.startswith("http") and "bing.com" not in real and "microsoft.com" not in real:
          n += 1; S["bing_rows"] += 1; row(real, prio=1 if SUBJECT_RE.search(real.replace("-", " ")) else 2, src="bing-web")
      for h in re.findall(r'<h2><a[^>]+href=["\'](https?://(?!www\.bing\.com)[^"\']+)', body):
        n += 1; S["bing_rows"] += 1; row(_html.unescape(h), prio=2, src="bing-web")
    stage.log(f"bing web first={first} status={st} links={n}")
    if st != 200: blocker(f"bing web HTTP {st}"); break
    if n == 0: break

# ---------------------------------------------------------------- 5. GDELT DOC 2.0 -------------------------------------------------------
def discover_gdelt():
  stage.log("== GDELT DOC 2.0 yearly 2015→2026")
  for y in range(2015, 2027):
    if over(DISCOVERY_BUDGET): return
    end = f"{y}1231235959" if y < 2026 else "20261019235959"
    u = f"https://api.gdeltproject.org/api/v2/doc/doc?query=%22Karan%20Mohla%22&mode=artlist&maxrecords=250&format=json&startdatetime={y}0101000000&enddatetime={end}"
    st, body = L.get(u, _skip_robots=True, retries=1); hs(st)
    arts = []
    if st == 200 and body.strip().startswith("{"):
      try: arts = json.loads(body).get("articles", [])
      except Exception: arts = []
    elif st == 200: stage.log(f"gdelt {y} non-json: {body[:120]!r}")
    S["gdelt_rows"] += len(arts)
    for a in arts: row(a.get("url", ""), a.get("title", ""), a.get("seendate", ""), a.get("domain", ""), "", 2, src="gdelt")
    stage.log(f"gdelt {y} status={st} rows={len(arts)}")
    if st in (429, 0, 403): blocker(f"gdelt HTTP {st}")
    time.sleep(7)

# ---------------------------------------------------------------- resolve + fetch ----------------------------------------------------------
def resolve(r: dict) -> dict:
  if "news.google.com" in r["url"]:
    real = L.decode_gnews(r["url"])
    if real and real.startswith("http") and "news.google.com" not in real: return dict(r, real=real)
    GOOGLE.wait()
    try: real = L.resolve_gnews(r["url"])
    except Exception: real = None
    return dict(r, real=real)
  return dict(r, real=r["url"])
def fetch(r: dict):
  try: it = L.fetch_article("g-karan", r["real"], hint_title=r["title"] or None, hint_date=r["date"] or None, hint_outlet=r["outlet"] or None, hint_excerpt=r["excerpt"] or None)
  except Exception: it = None
  return r, it
def _consume(pf, wait=0):
  try: r, it = pf.result(timeout=wait)
  except Exception: return
  S["fetched"] += 1
  if it: hs(it.get("http_status")); add(it)
def process():
  rows = sorted(ROWS.values(), key=lambda r: (r["prio"], r["src"] == "gnews", r["date"] == "", r["date"]))
  stage.log(f"== resolve+fetch candidates={len(rows)} gnews={sum('news.google.com' in r['url'] for r in rows)} known_skipped={S['known_skipped']} time_left={int(left())}s")
  pending = []
  with ThreadPoolExecutor(max_workers=3) as RP, ThreadPoolExecutor(max_workers=8) as FP:
    rf = {RP.submit(resolve, r): r for r in rows}; done_r = 0
    try:
      for fut in as_completed(rf):
        done_r += 1
        if over(): RP.shutdown(wait=False, cancel_futures=True); break
        r = fut.result()
        if "news.google.com" in r["url"]:
          if r.get("real") and "news.google.com" not in r["real"]: S["gnews_resolved"] += 1
          else: S["gnews_unresolved"] += 1; continue
        if not r.get("real"): continue
        if known(r["real"]): S["known_skipped"] += 1; continue
        pending.append(FP.submit(fetch, r))
        if done_r % 100 == 0: stage.log(f"resolved {done_r}/{len(rows)} queue={len(pending)} items={stage.n} known_skipped={S['known_skipped']} elapsed={int(time.time() - T0)}s")
        still = []
        for pf in pending:
          if pf.done(): _consume(pf)
          else: still.append(pf)
        pending = still
    finally:
      for pf in pending:
        if over(): pf.cancel(); continue
        try: _consume(pf, wait=max(1, int(left())))
        except Exception: pass
      FP.shutdown(wait=False, cancel_futures=True)
  stage.log(f"resolve+fetch done resolved={S['gnews_resolved']} unresolved={S['gnews_unresolved']} fetched={S['fetched']} items={stage.n}")

# ---------------------------------------------------------------- main -------------------------------------------------------------------
def main():
  stage.log(f"start collect_g_karan resume_items={stage.n} budget={BUDGET}s")
  load_known()
  steps = [seeds, lambda: [tag_pages(u) for u in TAG_PAGES if not over(DISCOVERY_BUDGET)], discover_bing, discover_gdelt, discover_gnews]
  names = ["seeds", "tag_pages", "bing", "gdelt", "gnews"]
  for name, step in zip(names, steps):
    if over(DISCOVERY_BUDGET): blocker(f"discovery budget hit before {name}"); continue
    try: step()
    except Exception as e: stage.log(f"step {name} failed: {type(e).__name__}: {e}"); blocker(f"{name}: {type(e).__name__}")
  stage.log(f"discovery done gnews_queries={S['gnews_queries']} gnews_rows={S['gnews_rows']} bing_rows={S['bing_rows']} gdelt_rows={S['gdelt_rows']} tag_pages={S['tag_pages_tried']} candidates={len(ROWS)} elapsed={int(time.time() - T0)}s")
  if not over():
    try: process()
    except Exception as e: stage.log(f"process failed: {type(e).__name__}: {e}"); blocker(f"process: {type(e).__name__}")
  # file-level totals
  new_vs_known = {"new": 0, "already_in_evidence": 0}; samples = []; per_glyph = {}; est = 0
  for line in open(stage.path, encoding="utf-8"):
    try: d = json.loads(line)
    except Exception: continue
    new_vs_known["already_in_evidence" if d["canonical_url"] in KNOWN else "new"] += 1
    per_glyph[d["platform_glyph"]] = per_glyph.get(d["platform_glyph"], 0) + 1
    if d.get("published_at_estimated"): est += 1
    if len(samples) < 5 and not d.get("published_at_estimated") and d["canonical_url"] not in KNOWN: samples.append({"title": d["title"], "published_at": d["published_at"], "url": d["canonical_url"]})
  rej = {}
  rp = os.path.join(L.STAGE, "g-karan.rejects.jsonl")
  if os.path.exists(rp):
    for line in open(rp, encoding="utf-8"):
      try: k = json.loads(line)["reason"]; rej[k] = rej.get(k, 0) + 1
      except Exception: pass
  summ = stage.summary()
  summ.update({"register": REG, "seeds_ok": S["seeds_ok"], "seeds_failed": S["seeds_failed"], "seed_status": S["seed_status"], "tag_pages_tried": S["tag_pages_tried"], "tag_links": S["tag_links"],
               "gnews_queries": S["gnews_queries"], "gnews_rows": S["gnews_rows"], "gnews_resolved": S["gnews_resolved"], "gnews_unresolved": S["gnews_unresolved"], "bing_rows": S["bing_rows"], "gdelt_rows": S["gdelt_rows"],
               "x_tweets": S["x_tweets"], "candidates": len(ROWS), "known_skipped": S["known_skipped"], "fetched": S["fetched"], "http_status_counts": S["http_status_counts"], "estimated_dates": est,
               "new_vs_evidence": new_vs_known, "per_glyph": per_glyph, "rejects_file_totals": rej, "duration_s": round(time.time() - T0, 1), "blockers": S["blockers"], "samples": samples, "finished_at": L.NOW()})
  with open(os.path.join(L.STAGE, "g-karan.summary.json"), "w", encoding="utf-8") as f: json.dump(summ, f, indent=2, ensure_ascii=False)
  stage.log(f"done {json.dumps(summ)[:1800]}")

if __name__ == "__main__":
  main()
