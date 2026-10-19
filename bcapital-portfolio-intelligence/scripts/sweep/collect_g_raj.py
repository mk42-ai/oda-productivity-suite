#!/usr/bin/env python3
"""collect_g_raj — source class (g-raj): BCAP-003 Raj Ganguly deep sweep (2026-10-19).

Priority is on sources the Google-News-heavy corpus does NOT already hold: first-party/profile seeds (b.capital, Milken, CNBC Events,
LABJ LA500, dot.LA, Icertis board, TenOneTen podcast, Fintech Leaders), CNBC's queryly search API (every video/article naming him),
Bloomberg/CNBC video pages, YouTube (Bloomberg TV Milken Asia, Moneycontrol Davos), X syndication timeline (@rajganguly_), LinkedIn
articles via Google/Bing, outlet tag/search pages, Google News RSS (half-year windows 2010→2026, US + IN), Bing News RSS (4 markets),
Bing web HTML, GDELT DOC 2.0 (yearly 2015→2026) and Apple Podcasts search.

Pipeline: seeds → discovery rows (serial, ≤2 Google req/s) → resolve news.google.com links → fetch_article in ThreadPoolExecutor(8) →
Stage('g-raj').add (dedup + namesake/film-noise drops → g-raj.rejects.jsonl). Resumable (append-only JSONL). Hard budget 30 min.
Outputs: data/sweep/g-raj.jsonl, g-raj.log, g-raj.rejects.jsonl, g-raj.summary.json.
Only the full name "Raj Ganguly" is used in queries.
"""
from __future__ import annotations
import base64, html as _html, json, os, re, sys, threading, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as L

T0 = time.time()
BUDGET = 30 * 60
DISCOVERY_BUDGET = 15 * 60
CLS = "g-raj"
REG = "BCAP-003"
NAME = "Raj Ganguly"
stage = L.Stage(CLS)
S = {"seeds_ok": 0, "seeds_failed": [], "seed_status": {}, "cnbc_rows": 0, "tag_pages_tried": 0, "tag_links": 0, "gnews_queries": 0, "gnews_rows": 0,
     "gnews_resolved": 0, "gnews_unresolved": 0, "bing_rows": 0, "bing_web_rows": 0, "gdelt_rows": 0, "itunes_rows": 0, "x_tweets": 0, "linkedin_rows": 0,
     "http_status_counts": {}, "blockers": [], "fetched": 0, "run_added": 0}
SUBJECT_RE = re.compile(r"raj\s+ganguly|\bganguly\b|rajganguly", re.I)
_lock = threading.Lock()

class Limiter:
  def __init__(self, interval: float): self.iv = interval; self.t = 0.0; self.lk = threading.Lock()
  def wait(self):
    with self.lk:
      now = time.time(); d = self.t + self.iv - now
      if d > 0: time.sleep(d); now = time.time()
      self.t = now
GOOGLE = Limiter(0.5)   # ≤ 2 req/s (search + resolve share it)
BING = Limiter(1.0)

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
def add(it, keep_offsubject: bool = False) -> bool:
  if not it: return False
  ok = stage.add(it, keep_offsubject=keep_offsubject)
  if ok:
    S["run_added"] += 1
    if stage.n % 50 == 0: stage.log(f"progress items={stage.n} dropped={stage.dropped} fetched={S['fetched']} elapsed={int(time.time() - T0)}s")
  return ok

# ------------------------------------------------------------------ candidate rows --------------------------------------------------
ROWS: dict[str, dict] = {}
def row(url: str, title: str = "", date: str = "", outlet: str = "", excerpt: str = "", prio: int = 1, glyph: str | None = None):
  if not url or not url.startswith("http"): return
  key = url if "news.google.com" in url else (L.canonical(url) or url)
  if key in ROWS: return
  if "news.google.com" not in url and stage.has(url): return
  ROWS[key] = {"url": url, "title": title, "date": date, "outlet": outlet, "excerpt": excerpt, "prio": prio, "glyph": glyph}

# ------------------------------------------------------------------ 1. seeds ---------------------------------------------------------
SEEDS = [
  "https://b.capital/team/raj-ganguly/",
  "https://www.linkedin.com/in/rajganguly",
  "https://x.com/rajganguly_",
  "https://www.cnbc.com/video/2026/01/23/b-capital-pharma-biotech-undergoing-transformation-thanks-to-ai.html",
  "https://www.cnbc.com/video/2025/09/18/todays-generative-ai-could-be-the-worst-yet-b-capital-co-founder.html",
  "https://www.cnbc.com/video/2025/01/09/should-see-successful-tech-ipos-in-the-second-half-of-2025-b-capital.html",
  "https://www.cnbc.com/video/2024/08/15/we-focus-on-helping-great-japanese-startups-go-global-b-capital.html",
  "https://www.cnbc.com/video/2024/03/26/investment-firm-b-capital-announces-its-new-750-million-opportunities-fund-co-ceo-discusses.html",
  "https://www.cnbc.com/video/2023/01/20/were-excited-about-software-health-care-and-fintech-investment-firm.html",
  "https://www.bloomberg.com/news/videos/2026-06-24/focused-on-ai-at-the-enterprise-level-ganguly-video",
  "https://www.youtube.com/watch?v=hp4Foxv0sdE",
  "https://www.youtube.com/watch?v=sL7Cq0u3vu4",
  "https://www.moneycontrol.com/news/business/startup/davos-2026-b-capital-to-do-more-ai-services-deals-in-india-says-co-founder-raj-ganguly-13782579.html",
  "https://www.moneycontrol.com/news/business/startup/india-is-becoming-an-innovation-economy-b-capitals-raj-ganguly-9902781.html",
  "https://milkeninstitute.org/events/global-conference-2026/speakers/raj-ganguly",
  "https://milkeninstitute.org/events/global-conference-2023/speakers/raj-ganguly",
  "https://www.cnbcevents.com/speakers/raj-ganguly/",
  "https://labusinessjournal.com/special-editions/la500/2023-la500/finance-2023/la500-2023-raj-ganguly/",
  "https://labusinessjournal.com/la500-2024/banks-2024/la500-2024-raj-ganguly/",
  "https://dot.la/b-capital-group-raj-ganguly-2657710464.html",
  "https://www.tenoneten.com/podcast/raj-ganguly-b-capital",
  "https://fintechleaders.substack.com/p/investing-in-transformational-technologies",
  "https://www.instagram.com/reel/DeLzwRvE6Zs/",
  "https://www.icertis.com/company/leadership/board/raj-ganguly/",
  "https://www.crunchbase.com/person/raj-ganguly",
]
SEED_HINT_DATES = {"hp4Foxv0sdE": "2022-09-29", "sL7Cq0u3vu4": "2026-01-21", "DeLzwRvE6Zs": None}
SEED_GLYPH = [(r"tenoneten|substack", "podcast"), (r"instagram", "instagram"), (r"b\.capital|milken|cnbcevents|icertis|crunchbase|labusinessjournal\.com/(special-editions|la500)", "web"), (r"youtube", "youtube"), (r"x\.com", "x"), (r"linkedin", "linkedin")]
def seed_glyph(u):
  for rx, g in SEED_GLYPH:
    if re.search(rx, u): return g
  return None
def seed_result(u, st, ok):
  S["seed_status"][u] = st
  if ok: S["seeds_ok"] += 1
  else: S["seeds_failed"].append({"url": u, "status": st})

def seed_youtube(u):
  vid = re.search(r"v=([\w-]+)", u).group(1)
  m = None
  try: m = L.youtube_meta(u)
  except Exception as e: stage.log(f"youtube_meta error {u}: {e}")
  if not m or not m.get("title"):
    hs(0); seed_result(u, (m or {}).get("http_status") or 0, False); blocker(f"youtube meta unavailable: {u}"); return
  hs(m["http_status"])
  text = (m.get("description") or "")
  if m.get("transcript"): text += "\n\nTRANSCRIPT:\n" + m["transcript"]
  else: blocker("youtube transcripts IP-blocked (youtube_transcript_api)") if "youtube transcripts IP-blocked (youtube_transcript_api)" not in S["blockers"] else None
  if NAME.lower() not in (m["title"] + text).lower(): text = f"{NAME} (B Capital co-founder) on {m.get('channel') or 'YouTube'}.\n" + text
  it = L.make_item(source_class=CLS, url=u, title=m["title"], text=text, outlet=m.get("channel"), published_at=m.get("published_at") or SEED_HINT_DATES.get(vid),
                   date_source="meta" if m.get("published_at") else "given", http_status=m["http_status"], platform_glyph="youtube")
  ok = add(it); seed_result(u, m["http_status"], True)
  stage.log(f"seed youtube {u} title={m['title']!r} chan={m.get('channel')} date={it and it['published_at']} transcript={bool(m.get('transcript'))} added={ok}")

def seed_x(u):
  st, body = L.get("https://syndication.twitter.com/srv/timeline-profile/screen-name/rajganguly_", _skip_robots=True); hs(st)
  n = 0
  if st == 200 and "__NEXT_DATA__" in body:
    try:
      j = json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S).group(1))
      entries = j["props"]["pageProps"]["timeline"]["entries"]
      for e in entries:
        tw = e.get("content", {}).get("tweet") or {}
        user = (tw.get("user") or {}).get("screen_name", "")
        if user.lower() != "rajganguly_": continue
        tid = tw.get("id_str") or str(tw.get("id") or "")
        text = tw.get("full_text") or tw.get("text") or ""
        if not tid or not text: continue
        turl = f"https://x.com/rajganguly_/status/{tid}"
        title = re.sub(r"\s+", " ", text)[:140]
        it = L.make_item(source_class=CLS, url=turl, title=f"@rajganguly_: {title}", text=text, outlet="X (@rajganguly_)", author="Raj Ganguly", published_at=tw.get("created_at"),
                         date_source="api", http_status=st, platform_glyph="x", provider_receipt=True,
                         extra={"reply_to": (f"https://x.com/i/status/{tw['in_reply_to_status_id_str']}" if tw.get("in_reply_to_status_id_str") else None)})
        if it:
          it["registers"] = sorted(set(it["registers"]) | {REG})
          it["outbound_links"] = [u2.get("expanded_url") for u2 in (tw.get("entities") or {}).get("urls", []) if u2.get("expanded_url")][:25]
          if add(it, keep_offsubject=True): n += 1
      S["x_tweets"] = n
    except Exception as e:
      stage.log(f"x syndication parse error: {type(e).__name__}: {e}"); blocker(f"x syndication parse error {type(e).__name__}")
  else: blocker(f"x syndication timeline HTTP {st}")
  # the profile page itself
  it = L.fetch_article(CLS, u, hint_title=f"{NAME} (@rajganguly_) on X", hint_excerpt=f"{NAME}, co-founder of B Capital — X profile @rajganguly_", glyph="x")
  pst = it.get("http_status") if it else 0; hs(pst)
  if pst in (403, 999, 0, 404, 429): blocker(f"x.com profile HTTP {pst}")
  ok = add(it) if it else False
  seed_result(u, pst if n == 0 else 200, bool(n) or ok)
  stage.log(f"seed x syndication status={st} tweets_added={n} profile_status={pst}")

def seeds():
  stage.log("== seeds")
  for u in SEEDS:
    if over(): return
    if stage.has(u) and "x.com" not in u: S["seed_status"][u] = "resumed"; S["seeds_ok"] += 1; continue
    try:
      if "youtube.com" in u: seed_youtube(u); continue
      if "x.com/rajganguly_" in u: seed_x(u); continue
      slug = re.sub(r"[-_/]+", " ", urllib.parse.urlsplit(u).path).strip().title() or L.host_of(u)
      slug = re.sub(r"\.Html?$", "", slug)
      hint_title = f"{NAME} — {slug}" if NAME.lower() not in slug.lower() else slug
      it = L.fetch_article(CLS, u, hint_title=hint_title, hint_date=SEED_HINT_DATES.get(u), hint_excerpt=f"{NAME}, co-founder and co-CEO of B Capital: {u}", glyph=seed_glyph(u), wayback=True)
      st = it.get("http_status") if it else 0; hs(st)
      ok = add(it) if it else False
      if st in (403, 999, 0, 404, 429, 401, 451): blocker(f"seed {L.host_of(u)} HTTP {st}: {u}")
      seed_result(u, st, st == 200 and ok)
      stage.log(f"seed {u} status={st} added={ok} title={(it or {}).get('title', '')[:80]!r} date={(it or {}).get('published_at')}/{(it or {}).get('date_source')}")
    except Exception as e:
      stage.log(f"seed {u} error {type(e).__name__}: {e}"); seed_result(u, 0, False)

# ------------------------------------------------------------------ 2. CNBC queryly ----------------------------------------------------
def cnbc_search():
  stage.log("== CNBC queryly search")
  for start in (0, 100, 200):
    if over(DISCOVERY_BUDGET): return
    u = (f"https://api.queryly.com/cnbc/json.aspx?queryly_key=31a35d40a9a64ab3&query=%22Raj%20Ganguly%22&endindex={start}&batchsize=100&callback=&showfaceted=false"
         "&timezoneoffset=0&facetedfields=formats&facetedkey=formats%7C&facetedvalue=!Press%20Release%7C&sort=date")
    st, body = L.get(u, headers={"Referer": "https://www.cnbc.com/search/", "Origin": "https://www.cnbc.com"}); hs(st)
    if st != 200:
      stage.log(f"cnbc queryly status={st}"); blocker(f"cnbc queryly HTTP {st}"); return
    try: j = json.loads(body.strip().strip("();"))
    except Exception as e: stage.log(f"cnbc queryly parse error {e}: {body[:200]!r}"); blocker("cnbc queryly parse error"); return
    res = j.get("results") or []
    S["cnbc_rows"] += len(res)
    for r in res:
      url = r.get("url") or r.get("cn_liveURL") or ""
      if url.startswith("//"): url = "https:" + url
      title = r.get("cn_title") or r.get("title") or ""
      date = r.get("datePublished") or r.get("cn_lastPubDate") or r.get("pubdate") or ""
      desc = r.get("description") or r.get("cn_description") or ""
      row(url, title, date, "CNBC", desc, prio=0)
    stage.log(f"cnbc queryly endindex={start} status={st} results={len(res)} total={j.get('metadata', {}).get('totalresults')}")
    if len(res) < 100: break

# ------------------------------------------------------------------ 3. tag / search pages ------------------------------------------------
ART_HREF = re.compile(r'href=["\']([^"\'#\s]+)["\']', re.I)
ART_PATH = re.compile(r"/20[0-2]\d/|/news/|/article|/story|/stories/|/videos?/|/podcast|-\d{5,}|/p/|/[a-z0-9-]{25,}", re.I)
SKIP_PATH = re.compile(r"/tag/|/topic/|/search|/author/|/category/|/page/\d|\?s=|\?q=|/login|/subscribe|/newsletter|/photos?/|/tags/|/companies/|/markets/|/mutual-funds/|/stocks/|/budget|/elections|/quiz|/privacy|/terms|/about|/contact|/events/|/sitemap|/feed", re.I)
TAG_PAGES = [
  "https://techcrunch.com/tag/raj-ganguly/", "https://techcrunch.com/?s=raj+ganguly", "https://dot.la/?s=raj+ganguly", "https://labusinessjournal.com/?s=raj+ganguly",
  "https://www.axios.com/search?q=raj+ganguly", "https://yourstory.com/search?q=raj%20ganguly", "https://inc42.com/?s=raj+ganguly",
  "https://economictimes.indiatimes.com/topic/raj-ganguly", "https://www.business-standard.com/topic/raj-ganguly", "https://www.moneycontrol.com/news/tags/raj-ganguly.html",
  "https://www.dealstreetasia.com/?s=raj+ganguly", "https://www.businesstimes.com.sg/search?query=raj%20ganguly", "https://kr-asia.com/?s=raj+ganguly",
  "https://www.pehub.com/?s=raj+ganguly", "https://www.privateequityinternational.com/?s=raj+ganguly", "https://www.fiercebiotech.com/search?q=raj+ganguly",
]
def page_url(base: str, n: int) -> str:
  if n == 1: return base
  p = urllib.parse.urlsplit(base)
  if p.query.startswith("s=") or "&s=" in p.query: return f"{p.scheme}://{p.netloc}/page/{n}/?{p.query}"
  if "moneycontrol.com" in p.netloc: return base.replace(".html", f"/page-{n}/")
  if "economictimes" in p.netloc or "business-standard" in p.netloc: return base.rstrip("/") + f"/page/{n}"
  if p.query: return base + f"&page={n}"
  return base.rstrip("/") + f"/page/{n}/"
def tag_pages(base: str, cap: int = 80, max_pages: int = 6):
  host = L.host_of(base); found: list[str] = []; seen = set()
  for n in range(1, max_pages + 1):
    if over(DISCOVERY_BUDGET) or len(found) >= cap: break
    u = page_url(base, n)
    st, body = L.get(u); hs(st); S["tag_pages_tried"] += 1
    if st != 200 or not body:
      stage.log(f"tag page {u} status={st}")
      if st in (403, 999, 0, 429, 401): blocker(f"tag page {host} HTTP {st}")
      break
    new = 0
    for h in ART_HREF.findall(body):
      h = _html.unescape(h)
      if h.startswith("//"): h = "https:" + h
      if h.startswith("/"): h = f"https://{urllib.parse.urlsplit(base).netloc}{h}"
      if not h.startswith("http"): continue
      hh = L.host_of(h)
      if hh.split(".")[-2:] != host.split(".")[-2:]: continue
      path = urllib.parse.urlsplit(h).path
      if not ART_PATH.search(path) or SKIP_PATH.search(h) or path.count("/") < 2 and not re.search(r"-\d{5,}", path): continue
      c = L.canonical(h)
      if not c or c in seen: continue
      seen.add(c); new += 1
      if len(found) < cap: found.append(h)
    stage.log(f"tag page {u} status={st} new_links={new} total={len(found)}")
    if new == 0: break
  S["tag_links"] += len(found)
  for h in found: row(h, prio=1 if SUBJECT_RE.search(h.replace("-", " ")) else 2)

# ------------------------------------------------------------------ 4. Google News RSS ---------------------------------------------------
def gnews(query: str, after=None, before=None, lang="en-US", gl="US", prio: int = 2) -> int:
  if over(DISCOVERY_BUDGET): return 0
  GOOGLE.wait()
  try: rows = L.google_news_search(query, after=after, before=before, lang=lang, gl=gl)
  except Exception as e: stage.log(f"gnews error {query}: {e}"); rows = []
  S["gnews_queries"] += 1; S["gnews_rows"] += len(rows)
  for r in rows:
    p = prio if SUBJECT_RE.search(r["title"] + " " + r["excerpt"]) else prio + 2
    row(r["url"], r["title"], r["published_at"], r["publisher"], r["excerpt"], p)
  return len(rows)
def half_years(y0: int, y1: int, end: str):
  for y in range(y0, y1 + 1):
    for a, b in ((f"{y}-01-01", f"{y}-06-30"), (f"{y}-07-01", f"{y}-12-31")):
      if a > end: return
      yield a, min(b, end)
GNEWS_QUERIES = ['"Raj Ganguly"', '"Raj Ganguly" "B Capital"', '"Raj Ganguly" Bain Capital', '"Raj Ganguly" Velos', '"Raj Ganguly" BCG OR "Boston Consulting"', '"Raj Ganguly" Harvard',
                 '"Raj Ganguly" podcast OR interview OR CNBC OR Bloomberg', '"Raj Ganguly" Liverpool', '"Raj Ganguly" Icertis OR Innovaccer OR Evidation OR Notable OR Bird OR Ninja Van']
def gnews_linkedin():
  stage.log("== LinkedIn article discovery (Google News)")
  for q in ['site:linkedin.com/pulse "Raj Ganguly"', 'site:linkedin.com/posts rajganguly', 'site:linkedin.com "Raj Ganguly" "B Capital"']:
    n = gnews(q, prio=0); stage.log(f"gnews '{q}' rows={n}")
def gnews_all():
  stage.log("== Google News RSS half-year windows")
  for q in GNEWS_QUERIES:
    tot = 0; before = len(ROWS)
    for a, b in half_years(2010, 2026, "2026-10-19"):
      for lang, gl in (("en-US", "US"), ("en-IN", "IN")):
        if over(DISCOVERY_BUDGET): stage.log(f"gnews '{q}' truncated rows={tot}"); return
        tot += gnews(q, after=a, before=b, lang=lang, gl=gl)
    stage.log(f"gnews '{q}' half-years rows={tot} new_candidates={len(ROWS) - before}")

# ------------------------------------------------------------------ 5. Bing ----------------------------------------------------------------
def bing_decode(u: str) -> str:
  if "bing.com/ck/a" in u:
    m = re.search(r"[?&]u=a1([A-Za-z0-9_-]+)", u)
    if m:
      try: return base64.urlsafe_b64decode(m.group(1) + "=" * (-len(m.group(1)) % 4)).decode("utf-8", "replace")
      except Exception: return u
  m = re.search(r"[?&](?:url|r)=(https?[^&]+)", u)
  if m and "bing.com" in u: return urllib.parse.unquote(m.group(1))
  return u
def bing_news(query: str, mkts):
  stage.log("== Bing News RSS")
  for mkt in mkts:
    if over(DISCOVERY_BUDGET): return
    BING.wait()
    u = "https://www.bing.com/news/search?q=" + urllib.parse.quote(query) + f"&format=rss&count=100&mkt={mkt}"
    st, body = L.get(u, _skip_robots=True); hs(st)
    rows = L.rss_items(body) if st == 200 else []
    S["bing_rows"] += len(rows)
    for r in rows:
      p = 1 if SUBJECT_RE.search(r["title"] + " " + r["excerpt"]) else 3
      row(bing_decode(r["url"]), r["title"], r["published_at"], r["publisher"], r["excerpt"], p)
    stage.log(f"bing news '{query}' mkt={mkt} status={st} rows={len(rows)}")
    if st != 200: blocker(f"bing news rss HTTP {st} ({mkt})")
def bing_web(query: str, firsts=(1, 51, 101), prio=1, only_host: str | None = None):
  n_tot = 0
  for first in firsts:
    if over(DISCOVERY_BUDGET): return
    BING.wait()
    u = "https://www.bing.com/search?q=" + urllib.parse.quote_plus(query) + f"&count=50&first={first}"
    st, body = L.get(u, _skip_robots=True, headers={"Accept-Language": "en-US,en;q=0.9", "Cookie": "SRCHHPGUSR=ADLT=OFF&NRSLT=50"}); hs(st)
    if st != 200: stage.log(f"bing web '{query}' first={first} status={st}"); blocker(f"bing web HTML HTTP {st}"); return
    n = 0
    for m in re.finditer(r'<li class="b_algo"[^>]*>(.*?)</li>', body, re.S):
      blk = m.group(1)
      hm = re.search(r'<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', blk, re.S)
      if not hm: continue
      url = bing_decode(_html.unescape(hm.group(1))); title = L.strip_html(hm.group(2))
      snip = L.strip_html((re.search(r'<p[^>]*>(.*?)</p>', blk, re.S) or [None, ""])[1])
      if "bing.com" in L.host_of(url) or "microsoft.com" in L.host_of(url): continue
      if only_host and only_host not in L.host_of(url): continue
      dm = re.match(r"^(\w{3} \d{1,2}, \d{4})", snip)
      row(url, title, dm.group(1) if dm else "", "", snip, prio); n += 1
    n_tot += n; S["bing_web_rows"] += n
    stage.log(f"bing web '{query}' first={first} status={st} results={n}")
    if n == 0: break
  return n_tot

# ------------------------------------------------------------------ 6. GDELT ---------------------------------------------------------------
def gdelt():
  stage.log("== GDELT DOC 2.0")
  for y in range(2015, 2027):
    if over(DISCOVERY_BUDGET): return
    end = "20261019235959" if y == 2026 else f"{y}1231235959"
    u = f"https://api.gdeltproject.org/api/v2/doc/doc?query=%22Raj%20Ganguly%22&mode=artlist&format=json&maxrecords=250&sort=datedesc&startdatetime={y}0101000000&enddatetime={end}"
    st, body = L.get(u, timeout=40, retries=1); hs(st)
    arts = []
    if st == 200 and body.strip().startswith("{"):
      try: arts = json.loads(body).get("articles", [])
      except Exception: arts = []
    elif st != 200: blocker(f"gdelt HTTP {st}")
    S["gdelt_rows"] += len(arts)
    for a in arts:
      if a.get("language") not in (None, "English"): continue
      row(a.get("url"), a.get("title", ""), a.get("seendate", ""), a.get("domain", ""), "", 1)
    stage.log(f"gdelt {y} status={st} rows={len(arts)}")
    time.sleep(7)

# ------------------------------------------------------------------ 7. Apple Podcasts ----------------------------------------------------
def itunes():
  stage.log("== Apple Podcasts search")
  for ent in ("podcastEpisode", "podcast"):
    if over(DISCOVERY_BUDGET): return
    u = f"https://itunes.apple.com/search?term=Raj%20Ganguly&media=podcast&entity={ent}&limit=200"
    st, body = L.get(u, _skip_robots=True); hs(st)
    if st != 200: stage.log(f"itunes status={st}"); blocker(f"itunes search HTTP {st}"); continue
    try: res = json.loads(body).get("results", [])
    except Exception: res = []
    S["itunes_rows"] += len(res); n = 0
    for r in res:
      title = r.get("trackName") or r.get("collectionName") or ""
      desc = r.get("description") or r.get("shortDescription") or ""
      blob = f"{title} {desc} {r.get('collectionName', '')}"
      if not SUBJECT_RE.search(blob): continue
      url = r.get("trackViewUrl") or r.get("collectionViewUrl")
      it = L.make_item(source_class=CLS, url=url, title=title, text=desc, outlet=r.get("collectionName"), author=r.get("artistName"), published_at=r.get("releaseDate"),
                       date_source="api", http_status=st, platform_glyph="podcast", provider_receipt=True,
                       extra={"outbound_links": [x for x in (r.get("episodeUrl"), r.get("feedUrl")) if x][:2]})
      if add(it): n += 1
    stage.log(f"itunes entity={ent} status={st} results={len(res)} added={n}")

# ------------------------------------------------------------------ resolve + fetch -------------------------------------------------
def resolve(r: dict) -> dict:
  if "news.google.com" in r["url"]:
    GOOGLE.wait()
    try: real = L.resolve_gnews(r["url"])
    except Exception: real = None
    return dict(r, real=real)
  return dict(r, real=r["url"])
def fetch(r: dict):
  try:
    it = L.fetch_article(CLS, r["real"], hint_title=r["title"] or None, hint_date=r["date"] or None, hint_outlet=r["outlet"] or None, hint_excerpt=r["excerpt"] or None, glyph=r.get("glyph"))
  except Exception: it = None
  return r, it
def ordered_rows() -> list[dict]:
  rows = list(ROWS.values())
  # new-source rows (non-Google) first, then by priority, dated first
  rows.sort(key=lambda r: ("news.google.com" in r["url"], r["prio"], r["date"] == "", r["date"]))
  return rows
def _consume(pf, wait=0):
  try: r, it = pf.result(timeout=wait)
  except Exception: return
  S["fetched"] += 1
  if it: hs(it.get("http_status")); add(it)
def process():
  rows = ordered_rows()
  stage.log(f"== resolve+fetch candidates={len(rows)} gnews={sum('news.google.com' in r['url'] for r in rows)} time_left={int(left())}s")
  pending = []
  with ThreadPoolExecutor(max_workers=3) as RP, ThreadPoolExecutor(max_workers=8) as FP:
    rf = [RP.submit(resolve, r) for r in rows]
    done_r = 0
    try:
      for fut in as_completed(rf):
        done_r += 1
        if over(): RP.shutdown(wait=False, cancel_futures=True); break
        r = fut.result()
        if "news.google.com" in r["url"]:
          if r.get("real") and "news.google.com" not in r["real"]: S["gnews_resolved"] += 1
          else: S["gnews_unresolved"] += 1; continue
        if not r.get("real") or stage.has(r["real"]): continue
        pending.append(FP.submit(fetch, r))
        if done_r % 100 == 0: stage.log(f"resolved {done_r}/{len(rows)} fetch_queue={len(pending)} items={stage.n} elapsed={int(time.time() - T0)}s")
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

# ------------------------------------------------------------------ main -----------------------------------------------------------
def main():
  stage.log(f"start collect_g_raj resume_items={stage.n} budget={BUDGET}s")
  steps = [seeds, cnbc_search, itunes,
           lambda: bing_web('"Raj Ganguly" "B Capital"', (1, 51, 101)),
           lambda: bing_web('site:linkedin.com/pulse "Raj Ganguly"', (1,), prio=0, only_host="linkedin.com"),
           lambda: bing_web('site:linkedin.com/posts "Raj Ganguly"', (1,), prio=0, only_host="linkedin.com"),
           lambda: bing_news('"Raj Ganguly"', ("en-US", "en-IN", "en-SG", "en-GB")),
           gnews_linkedin, gdelt,
           lambda: [tag_pages(u) for u in TAG_PAGES],
           gnews_all]
  for step in steps:
    nm = getattr(step, "__name__", "step")
    if over(DISCOVERY_BUDGET): stage.log(f"discovery budget hit before {nm}"); blocker(f"discovery budget hit before {nm}"); continue
    try: step()
    except Exception as e: stage.log(f"step {nm} failed: {type(e).__name__}: {e}"); blocker(f"{nm}: {type(e).__name__}")
  stage.log(f"discovery done gnews_queries={S['gnews_queries']} gnews_rows={S['gnews_rows']} bing_rows={S['bing_rows']} bing_web={S['bing_web_rows']} cnbc={S['cnbc_rows']} gdelt={S['gdelt_rows']} itunes={S['itunes_rows']} tag_pages={S['tag_pages_tried']} candidates={len(ROWS)} elapsed={int(time.time() - T0)}s")
  if not over():
    try: process()
    except Exception as e: stage.log(f"process failed: {type(e).__name__}: {e}"); blocker(f"process: {type(e).__name__}")
  est = 0; samples = []; glyphs = {}; outlets = {}
  for line in open(stage.path, encoding="utf-8"):
    try: d = json.loads(line)
    except Exception: continue
    if d.get("published_at_estimated"): est += 1
    glyphs[d["platform_glyph"]] = glyphs.get(d["platform_glyph"], 0) + 1
    outlets[d["outlet"]] = outlets.get(d["outlet"], 0) + 1
    if len(samples) < 5 and not d.get("published_at_estimated") and d.get("http_status") == 200: samples.append({"title": d["title"], "published_at": d["published_at"], "url": d["canonical_url"]})
  summ = stage.summary()
  summ.update({"seeds_ok": S["seeds_ok"], "seeds_failed": S["seeds_failed"], "seed_status": S["seed_status"], "cnbc_rows": S["cnbc_rows"], "tag_pages_tried": S["tag_pages_tried"], "tag_links": S["tag_links"],
               "gnews_queries": S["gnews_queries"], "gnews_rows": S["gnews_rows"], "gnews_resolved": S["gnews_resolved"], "gnews_unresolved": S["gnews_unresolved"], "bing_rows": S["bing_rows"], "bing_web_rows": S["bing_web_rows"],
               "gdelt_rows": S["gdelt_rows"], "itunes_rows": S["itunes_rows"], "x_tweets": S["x_tweets"], "candidates": len(ROWS), "fetched": S["fetched"], "run_added": S["run_added"],
               "http_status_counts": S["http_status_counts"], "estimated_dates": est, "namesake_dropped": stage.dropped.get("namesake", 0), "glyphs": glyphs,
               "top_outlets": dict(sorted(outlets.items(), key=lambda kv: -kv[1])[:25]), "duration_s": round(time.time() - T0, 1), "blockers": S["blockers"], "samples": samples, "finished_at": L.NOW()})
  with open(os.path.join(L.STAGE, f"{CLS}.summary.json"), "w", encoding="utf-8") as f: json.dump(summ, f, indent=2, ensure_ascii=False)
  stage.log(f"done {json.dumps(summ)[:1500]}")

if __name__ == "__main__":
  main()
