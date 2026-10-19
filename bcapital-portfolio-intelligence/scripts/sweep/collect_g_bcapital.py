#!/usr/bin/env python3
"""collect_g_bcapital.py — source class (g) deep press / database / fund-close sweep for BCAP-001 B CAPITAL (the firm), 2026-10-19.

Class (a) already crawled the full b.capital sitemap, so this collector does NOT touch the sitemap. Value-add: outlet tag/search
pages (trade press, Asian/Indian/Brazilian press, wires), investor databases (Tracxn / Dealroom / PitchBook / Crunchbase — mostly
403, status recorded, og: metadata kept), LinkedIn company-page permalinks (robots → hint-only items), Google News RSS in quarterly
windows 2015→2026 across US/IN/SG/BR, Bing News RSS + Bing web HTML, GDELT DOC 2.0 half-year windows 2016→2026.

Discovery is serial per source (each source in its own thread; Google ≤ 2 req/s globally); fetch_article runs in a
ThreadPoolExecutor(max_workers=8). Resumable (canonical URLs already in g-bcapital.jsonl / .rejects.jsonl are skipped), append-only.
Hard wall-clock budget 30 min → data/sweep/g-bcapital.summary.json.
"""
from __future__ import annotations
import base64, collections, datetime as dt, html, json, os, re, sys, threading, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as L

T0 = time.time()
DISCOVERY_BUDGET = int(os.environ.get("G_DISCOVERY_BUDGET", 24 * 60))
HARD_BUDGET = int(os.environ.get("G_HARD_BUDGET", 29 * 60))
def elapsed(): return time.time() - T0
def discovery_over(): return elapsed() > DISCOVERY_BUDGET
def hard_over(): return elapsed() > HARD_BUDGET
TODAY = "2026-10-19"
CLS = "g-bcapital"
stage = L.Stage(CLS)

# ---------------------------------------------------------------- http accounting -----------------------------------------------------
status_counts: collections.Counter = collections.Counter()
_orig_get = L.get
def counted_get(url, *a, **k):
  if url.startswith("http://"): url = "https://" + url[7:]
  k.setdefault("timeout", 15); k.setdefault("retries", 1)
  st, body = _orig_get(url, *a, **k)
  if not url.endswith("/robots.txt"): status_counts[str(st)] += 1
  return st, body
L.get = counted_get

_glock = threading.Lock(); _glast = [0.0]
def gthrottle():                       # ≤ 2 Google requests / s
  with _glock:
    w = _glast[0] + 0.5 - time.time()
    if w > 0: time.sleep(w)
    _glast[0] = time.time()

# ---------------------------------------------------------------- resume state -------------------------------------------------------
attempted: set[str] = set(stage.seen)
rej_path = os.path.join(L.STAGE, f"{CLS}.rejects.jsonl")
if os.path.exists(rej_path):
  for line in open(rej_path, encoding="utf-8"):
    try: attempted.add(json.loads(line)["url"])
    except Exception: pass
_alock = threading.Lock()
def claim(url: str) -> bool:
  c = L.canonical(url) or url
  with _alock:
    if c in attempted: return False
    attempted.add(c); return True

counters: collections.Counter = collections.Counter()
blockers: list[dict] = []
seeds_failed: list[dict] = []
PRE_NAMESAKE_RE = re.compile(r"capital b news|city of new berlin|new berlin|\bcapital b\b", re.I)
namesake_pre = [0]

# ---------------------------------------------------------------- fetch pool ---------------------------------------------------------
EX = ThreadPoolExecutor(max_workers=8)
futures: list = []; _flock = threading.Lock()
processed = [0]
def submit(src: str, url: str, **hints):
  if not url or hard_over(): return
  if url.startswith("http://"): url = "https://" + url[7:]
  t = {"src": src, "url": url, **hints}
  if PRE_NAMESAKE_RE.search(f"{hints.get('title') or ''} {hints.get('excerpt') or ''}") and not re.search(r"b[\s\.\-]?capital\b(?! b)", (hints.get("title") or "") + (hints.get("excerpt") or ""), re.I):
    namesake_pre[0] += 1; return
  counters[f"queued_{src}"] += 1
  with _flock: futures.append(EX.submit(process, t))

def process(t: dict):
  try:
    if hard_over(): return
    src, url = t["src"], t["url"]
    if src.startswith("gnews"):
      pub = L.decode_gnews(url)
      if not (pub and pub.startswith("http") and "news.google.com" not in pub):
        gthrottle(); pub = L.resolve_gnews(url)
      if not pub or "news.google.com" in pub:
        counters["gnews_unresolved"] += 1
        if not claim(url): return
        it = L.make_item(source_class=CLS, url=url, title=t.get("title"), text=t.get("excerpt"), outlet=t.get("outlet"), published_at=t.get("date"), date_source="rss", http_status=None)
        if stage.add(it): counters[f"added_{src}"] += 1
        return
      url = pub
    if not claim(url): counters["skipped_seen"] += 1; return
    glyph = t.get("glyph") or ("linkedin" if "linkedin.com" in url else None)
    it = L.fetch_article(CLS, url, hint_title=t.get("title"), hint_date=t.get("date"), hint_outlet=t.get("outlet") or L.host_of(url), hint_excerpt=t.get("excerpt"), glyph=glyph)
    if stage.add(it): counters[f"added_{src}"] += 1
    elif it is None: counters[f"noitem_{src}"] += 1
  except Exception as e:
    counters["worker_errors"] += 1
    if counters["worker_errors"] <= 20: stage.log(f"worker error {type(e).__name__}: {str(e)[:120]} on {t.get('url','')[:120]}")
  finally:
    processed[0] += 1
    if processed[0] % 50 == 0: stage.log(f"processed={processed[0]} items={stage.n} dropped={dict(stage.dropped)} elapsed={int(elapsed())}s")

# ---------------------------------------------------------------- 1. SEEDS -----------------------------------------------------------
SEEDS = """https://b.capital/
https://b.capital/about/
https://b.capital/team/
https://b.capital/portfolio/
https://b.capital/news-and-insights/
https://b.capital/news-category/press/
https://b.capital/why-we-invested/why-we-invested-flourish-health/
https://b.capital/why-we-invested/why-we-invested-cadence/
https://b.capital/why-we-invested/why-we-invested-innovaccer-2/
https://b.capital/news-article/b-capital-highlights-ai-driven-investment-momentum-and-global-thought-leadership-at-2025-annual-general-meeting-and-ceo-summit/
https://b.capital/news-article/b-capital-closes-inaugural-healthcare-fund-commits-500-million-to-healthcare-innovation/
https://b.capital/insights/b-capital-2022-growth-portfolio-nps-survey/
https://www.bloomberg.com/news/articles/2018-02-09/facebook-co-founder-saverin-s-b-capital-closes-360-million-fund
https://www.bloomberg.com/news/articles/2020-06-30/facebook-co-founder-saverin-s-venture-firm-raises-820-million
https://www.bloomberg.com/news/articles/2021-11-04/eduardo-saverin-s-b-capital-eyes-2-5-billion-for-newest-fund
https://www.bloomberg.com/news/articles/2023-01-19/eduardo-saverin-s-b-capital-raises-2-1-billion
https://www.reuters.com/business/finance/facebook-co-founder-saverins-b-capital-raises-750-mln-new-opportunities-fund-2024-03-19/
https://www.forbes.com/sites/yessarrosendar/2026/07/08/billionaire-eduardo-saverin-backed-b-capital-raises-500-million-to-fund-early-stage-startups/
https://www.wsj.com/pro/venture-capital/b-capital-unveils-500-million-early-stage-fund-as-startup-valuations-soar-cd73bc9e
https://www.axios.com/2026/07/23/vc-job-chief-ai-officer
https://techcrunch.com/2025/12/09/b-capital-founding-partner-kabir-narang-leaves-to-launch-new-investment-platform/
https://www.techbuzz.ai/articles/b-capital-founding-partner-kabir-narang-exits-to-launch-ai-focused-fund
https://kr-asia.com/b-capital-group-closes-its-second-fund-at-usd-820-million
https://www.businessinsider.com/b-capital-vc-fund-set-up-by-facebook-cofounder-raises-fresh-capital-2020-6
https://yourstory.com/2024/03/b-capital-raises-750m-for-its-second-fund-opportunities-fund-ii
https://peforum.org/b-capital-closes-oversubscribed-ascent-fund-iii-at-500-million-hard-cap/
https://www.citybiz.co/article/869878/b-capital-closes-500-million-ascent-fund-iii-to-back-early-stage-ai-and-technology-companies/
https://mediabrief.com/b-capital-closes-ascent-fund-iii-at-500-million-hard-cap/
https://fundmomentum.vc/blog/b-capital-ascent-fund-iii-500m-hard-cap-early-stage-ai-2026
https://www.caproasia.com/2025/11/11/facebook-co-founder-eduardo-saverin-9-billion-b-capital-raised-307-million-for-early-stage-fund-b-capital-ascent-fund-iii/
https://sg.news.yahoo.com/eduardo-saverin-b-capital-set-ramp-asia-deals-030807696.html
https://m.economictimes.com/tech/funding/b-capital-closes-third-growth-fund-at-2-1-billion-to-ramp-up-india-bets/articleshow/97138394.cms
https://www.bloomberglinea.com.br/2023/01/19/bilionario-brasileiro-eduardo-saverin-capta-us-21-bi-para-investir-em-startups/
https://forbes.com.br/forbes-money/2022/07/b-capital-de-eduardo-saverin-capta-us-250-milhoes-para-venture-capital/
https://nvca.org/careers/principal-investor-early-stage-focus-b-capital-group/
https://tracxn.com/d/venture-capital/b-capital/__vAnWVl1HF7mLz_Whht2Z2hZ4ns8OQXK6WrDhblsa8UE
https://dealroom.co/investors/b-capital/
https://pitchbook.com/profiles/investor/155248-48
https://www.crunchbase.com/organization/b-capital-group
https://www.linkedin.com/company/b-capital-group""".split()
SEED_HINTS = {
  "2018-02-09/facebook-co-founder-saverin-s-b-capital-closes-360-million-fund": ("Facebook Co-Founder Saverin's B Capital Closes $360 Million Fund", "Bloomberg: B Capital Group, the venture firm co-founded by Eduardo Saverin and Raj Ganguly with BCG, closed its first fund at $360 million."),
  "2020-06-30/facebook-co-founder-saverin-s-venture-firm-raises-820-million": ("Facebook Co-Founder Saverin's Venture Firm Raises $820 Million", "Bloomberg: B Capital Group closed its second fund at $820 million."),
  "2021-11-04/eduardo-saverin-s-b-capital-eyes-2-5-billion-for-newest-fund": ("Eduardo Saverin's B Capital Eyes $2.5 Billion for Newest Fund", "Bloomberg: B Capital Group is targeting $2.5 billion for Growth Fund III."),
  "2023-01-19/eduardo-saverin-s-b-capital-raises-2-1-billion": ("Eduardo Saverin's B Capital Raises $2.1 Billion", "Bloomberg: B Capital closed Growth Fund III at $2.1 billion."),
  "b-capital-raises-750-mln-new-opportunities-fund-2024-03-19": ("Facebook co-founder Saverin's B Capital raises $750 mln new opportunities fund", "Reuters: B Capital raised $750 million for Opportunities Fund II."),
  "b-capital-unveils-500-million-early-stage-fund": ("B Capital Unveils $500 Million Early-Stage Fund as Startup Valuations Soar", "WSJ Pro Venture Capital: B Capital closed Ascent Fund III at $500 million."),
  "vc-job-chief-ai-officer": ("The hot new VC job: chief AI officer", "Axios Pro Rata: venture firms including Eduardo Saverin's B Capital are creating chief AI officer roles."),
  "tracxn.com": ("B Capital - Investor Profile - Tracxn", "Tracxn investor profile for B Capital Group (venture capital, Los Angeles / Singapore)."),
  "dealroom.co": ("B Capital - Investor - Dealroom", "Dealroom investor profile for B Capital."),
  "pitchbook.com": ("B Capital Group Investor Profile: Portfolio & Exits | PitchBook", "PitchBook investor profile for B Capital Group."),
  "crunchbase.com": ("B Capital Group - Crunchbase Investor Profile & Investments", "Crunchbase investor profile for B Capital Group."),
  "linkedin.com/company/b-capital-group": ("B Capital | LinkedIn", "B Capital Group company page on LinkedIn — venture capital firm founded by Eduardo Saverin and Raj Ganguly."),
}
def slug_title(u: str) -> str:
  seg = [s for s in urllib.parse.urlsplit(u).path.split("/") if s and not re.fullmatch(r"[\d\-]+|sites|news|articles?|article|business|finance|pro|venture-capital|blog|tech|funding|why-we-invested|news-article|insights|forbes-money", s)]
  s = seg[-1] if seg else L.host_of(u)
  s = re.sub(r"\.(html?|cms)$|-\d{6,}$|-[0-9a-f]{8}$|^\d+$", "", s)
  return re.sub(r"[-_]+", " ", s).strip().capitalize() or u
def seed_fetch(u: str):
  hint = next((v for k, v in SEED_HINTS.items() if k in u), None)
  ht, hx = hint if hint else (slug_title(u), None)
  glyph = "web" if L.host_of(u) == "b.capital" else ("linkedin" if "linkedin.com" in u else None)
  st, body = L.get(u, timeout=25, retries=1)
  ok = False
  if st == 200 and body and "<html" in body[:5000].lower():
    attempted.add(L.canonical(u) or u)
    it = L.fetch_article(CLS, u, hint_title=ht, hint_date=L.date_from_url(u), hint_outlet=L.host_of(u), hint_excerpt=hx, glyph=glyph)
    ok = stage.add(it)
  else:
    # 403 / 999 / 0: keep whatever og: metadata the block page returned, else fall back to hints
    title = (L.html_title(body) if body else None) or ht
    if title and not re.search(r"b[\s\.\-]?capital|saverin", title, re.I): title = ht
    desc = (L.meta(body, "og:description", "description") if body else None)
    text = "\n".join(x for x in (desc, hx) if x)
    attempted.add(L.canonical(u) or u)
    it = L.make_item(source_class=CLS, url=u, title=title, text=text, outlet=L.host_of(u), published_at=L.date_from_url(u), http_status=st, platform_glyph=glyph)
    ok = stage.add(it)
  if ok: counters["seeds_ok"] += 1
  if st != 200 or not ok: seeds_failed.append({"url": u, "status": st, "kept_from_hints": bool(ok)})
  if st == 200 and ok: counters["seeds_200_ok"] += 1
def run_seeds():
  for u in SEEDS:
    if hard_over(): return
    if stage.has(u): counters["seeds_already"] += 1; counters["seeds_ok"] += 1; continue
    try: seed_fetch(u)
    except Exception as e: seeds_failed.append({"url": u, "status": -1, "error": f"{type(e).__name__}: {str(e)[:100]}"})
  stage.log(f"seeds done: ok={counters['seeds_ok']} failed={len(seeds_failed)}")

# ---------------------------------------------------------------- 2. TAG / SEARCH PAGES ----------------------------------------------
TAG_PAGES = [
  ("https://techcrunch.com/tag/b-capital/", "wp"), ("https://techcrunch.com/tag/b-capital-group/", "wp"),
  ("https://www.dealstreetasia.com/tag/b-capital/", "wp"), ("https://www.dealstreetasia.com/?s=%22B+Capital%22", "wp"),
  ("https://www.techinasia.com/tag/b-capital", "none"), ("https://e27.co/tag/b-capital/", "wp"), ("https://kr-asia.com/tag/b-capital", "wp"),
  ("https://asia.nikkei.com/search?query=%22B%20Capital%22", "query"), ("https://www.pehub.com/?s=%22B+Capital%22", "wp"),
  ("https://www.venturecapitaljournal.com/?s=%22B+Capital%22", "wp"), ("https://www.avcj.com/search?q=%22B+Capital%22", "query"),
  ("https://inc42.com/tag/b-capital/", "wp"), ("https://entrackr.com/?s=%22B+Capital%22", "wp"), ("https://yourstory.com/tag/b-capital", "none"),
  ("https://www.vccircle.com/search?q=%22B%20Capital%22", "query"), ("https://economictimes.indiatimes.com/topic/b-capital", "none"),
  ("https://www.business-standard.com/topic/b-capital", "pathpage"), ("https://www.moneycontrol.com/news/tags/b-capital.html", "mc"),
  ("https://www.livemint.com/topic/b-capital", "none"), ("https://www.businesstimes.com.sg/search?query=%22B%20Capital%22", "query"),
  ("https://www.axios.com/search?q=%22B+Capital%22", "none"), ("https://fortune.com/search/?q=%22B%20Capital%22", "none"),
  ("https://www.businessinsider.com/s?q=%22B+Capital%22", "none"),
  ("https://www.prnewswire.com/search/news/?keyword=%22B%20Capital%22", "prn"),
  ("https://www.businesswire.com/portal/site/home/search/?searchType=news&searchTerm=%22B%20Capital%22", "none"),
  ("https://www.globenewswire.com/search/keyword/%22B%20Capital%22", "none"),
]
ARTICLE_PATH_RE = re.compile(r"/20[12]\d/|/news/|/article|/story|/stories/|-\d{5,}|/companies/|/startups/|/markets/|/technology/|/sites/[^/]+/20|/articleshow/|\.cms$|/finance/|/business/|/news-releases?/|/news-release/|/Business/|/Spotlight/|/Companies/|/Startups/|/funding/|/deals/|/venture/|/posts/", re.I)
NONART_RE = re.compile(r"/(tag|tags|topic|topics|author|authors|category|search|page|wp-content|wp-json|feed|about|contact|privacy|terms|subscribe|login|newsletter|events|videos?|photos?|podcasts?|live-coverage|indian-indices|global-indices|definition|rss|sitemap|news-releases-list|rss-feeds)(/|$|\?)|privacy-policy|\?s=|/search\?|#|\.(jpg|jpeg|png|gif|webp|pdf|xml)(\?|$)", re.I)
IMG_HOST_RE = re.compile(r"^(images?|img|static|cdn|assets|media|mma)\d*\.", re.I)
tag_pages_tried = [0]; tag_pages_blocked = [0]
def page_url(base: str, kind: str, n: int) -> str | None:
  if n == 1: return base
  if kind == "wp":
    p = urllib.parse.urlsplit(base)
    if p.query: return urllib.parse.urlunsplit((p.scheme, p.netloc, f"/page/{n}/", p.query, ""))
    return base.rstrip("/") + f"/page/{n}/"
  if kind == "query": return base + f"&page={n}"
  if kind == "pathpage": return base.rstrip("/") + f"/page-{n}"
  if kind == "mc": return base.replace(".html", f".html/page-{n}/")
  if kind == "prn": return base + f"&page={n}&pagesize=25"
  return None
def article_links(body: str, base: str) -> list[str]:
  host = L.host_of(base); root = host.split(".", 1)[-1] if host.count(".") >= 2 else host; out = []
  for href in re.findall(r'href=["\']([^"\'#\s]+)', body or ""):
    u = urllib.parse.urljoin(base, html.unescape(href))
    if not u.startswith("http"): continue
    h = L.host_of(u)
    if not (h == host or h.endswith("." + root) or h == root) or IMG_HOST_RE.match(h): continue
    path = urllib.parse.urlsplit(u).path
    slug = path.rstrip("/").rsplit("/", 1)[-1]
    if len(path) < 12 or NONART_RE.search(u) or not ARTICLE_PATH_RE.search(path): continue
    if slug.count("-") < 4 and not re.search(r"\d{5,}", path): continue
    c = L.canonical(u)
    if c and c not in out: out.append(c)
  return out
def run_tags():
  for base, kind in TAG_PAGES:
    if discovery_over(): return
    host = L.host_of(base); seen: list[str] = []; n_cand = 0
    for pg in range(1, 7):
      u = page_url(base, kind, pg)
      if not u: break
      tag_pages_tried[0] += 1
      st, body = L.get(u, timeout=20, retries=0)
      if st != 200:
        tag_pages_blocked[0] += 1
        if pg == 1: blockers.append({"source": "tag", "outlet": host, "url": u, "status": st})
        break
      links = [l for l in article_links(body, u) if l not in seen]
      if not links: break
      seen.extend(links)
      for l in links:
        if n_cand >= 80: break
        if stage.has(l): continue
        n_cand += 1; submit("tag", l, outlet=host, title=slug_title(l), date=L.date_from_url(l))
      if n_cand >= 80: break
      time.sleep(0.5)
    counters["tag_candidates"] += n_cand
  stage.log(f"tag pages done: tried={tag_pages_tried[0]} blocked={tag_pages_blocked[0]} candidates={counters['tag_candidates']}")

# ---------------------------------------------------------------- 3. GOOGLE NEWS RSS -------------------------------------------------
def windows(start: str, months: int, end_s: str = TODAY) -> list[tuple[str, str]]:
  out = []; y, m = int(start[:4]), int(start[5:7]); end = dt.date.fromisoformat(end_s)
  while True:
    a = dt.date(y, m, 1); m2 = m + months; y2 = y + (m2 - 1) // 12; m2 = (m2 - 1) % 12 + 1
    b = dt.date(y2, m2, 1)
    if a >= end: break
    out.append((a.isoformat(), min(b, end + dt.timedelta(days=1)).isoformat())); y, m = y2, m2
  return out
GN_Q = ['"B Capital Group"', '"B Capital" venture', '"B Capital" led OR leads round', '"B Capital" Series', '"B Capital" fund close OR closes OR raises',
        '"B Capital" Ascent OR Opportunities OR "Growth Fund" OR "Healthcare Fund"', '"B Capital" Saverin', '"B Capital" India OR Singapore OR Japan OR "Southeast Asia"',
        '"B Capital" BCG OR "Boston Consulting"', '"B Capital" IPO OR exit OR acquisition']
LOCALES = [("en-US", "US"), ("en-IN", "IN"), ("en-SG", "SG"), ("pt-BR", "BR")]
gnews_rows = [0]; gnews_calls = [0]
def gn_plan():
  # oldest windows first (deep history is the value-add); US + IN for every query, SG for the Asia-flavoured ones, BR for the Saverin / Group ones
  plan = []
  for a, b in windows("2015-01-01", 3):
    for q in GN_Q:
      for lang, gl in LOCALES:
        if gl == "SG" and q not in (GN_Q[0], GN_Q[1], GN_Q[7], GN_Q[4]): continue
        if gl == "BR" and q not in (GN_Q[0], GN_Q[6]): continue
        plan.append((q, (a, b), lang, gl))
  return plan
def run_gnews():
  plan = gn_plan(); stage.log(f"gnews plan: {len(plan)} requests")
  for i, (q, (a, b), lang, gl) in enumerate(plan):
    if discovery_over(): stage.log(f"gnews stopped at {i}/{len(plan)} (budget)"); return
    gthrottle(); gnews_calls[0] += 1
    rows = L.google_news_search(q, after=a, before=b, lang=lang, gl=gl)
    gnews_rows[0] += len(rows)
    for r in rows:
      submit("gnews", r["url"], title=re.sub(r"\s+-\s+[^-]+$", "", r["title"]), date=r["published_at"], outlet=r["publisher"] or L.host_of(r["publisher_url"] or ""), excerpt=r["excerpt"])
    if i % 100 == 99: stage.log(f"gnews {i+1}/{len(plan)} rows={gnews_rows[0]} items={stage.n}")
  stage.log(f"gnews done: calls={gnews_calls[0]} rows={gnews_rows[0]}")
def run_linkedin_discovery():
  li_rows = 0
  for q in ("site:linkedin.com/posts b-capital-group", "site:linkedin.com/company/b-capital-group", "site:linkedin.com/posts \"B Capital\" bcapitalgroup", "linkedin.com/posts bcapitalgroup"):
    for lang, gl in (("en-US", "US"), ("en-SG", "SG")):
      if discovery_over(): return
      gthrottle(); gnews_calls[0] += 1
      rows = L.google_news_search(q, lang=lang, gl=gl); li_rows += len(rows)
      for r in rows: submit("gnews-li", r["url"], title=re.sub(r"\s+-\s+[^-]+$", "", r["title"]), date=r["published_at"], outlet=r["publisher"] or "LinkedIn", excerpt=r["excerpt"], glyph="linkedin")
  # Bing web for LinkedIn permalinks
  for q in ('site:linkedin.com/posts "B Capital" bcapitalgroup', 'site:linkedin.com/company/b-capital-group/posts', '"b-capital-group" linkedin.com/posts'):
    for first in (1, 51):
      if discovery_over(): return
      n = bing_web(q, first, src="bing-li", glyph="linkedin")
      li_rows += n
      if n == 0: break
      time.sleep(1.5)
  counters["linkedin_discovery_rows"] = li_rows
  stage.log(f"linkedin discovery rows={li_rows}")

# ---------------------------------------------------------------- 4. BING NEWS RSS + BING WEB ----------------------------------------
bing_rows = [0]
def bing_decode(u: str) -> str | None:
  m = re.search(r"[?&]u=a1([A-Za-z0-9_\-]+)", u)
  if not m: return u if "bing.com" not in u else None
  try:
    s = m.group(1); d = base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)).decode("utf-8", "replace")
    return d if d.startswith("http") else None
  except Exception: return None
def bing_web(q: str, first: int, src: str = "bing-web", glyph: str | None = None) -> int:
  u = f"https://www.bing.com/search?q={urllib.parse.quote(q)}&count=50&first={first}"
  st, body = L.get(u, _skip_robots=True, headers={"Accept-Language": "en-US,en;q=0.9", "Cookie": "SRCHHPGUSR=ADLT=OFF&NRSLT=50"})
  if st != 200: blockers.append({"source": src, "url": u, "status": st}); return 0
  n = 0
  for m in re.finditer(r'<li class="b_algo".*?<h2><a[^>]+href="([^"]+)"[^>]*>(.*?)</a></h2>(.*?)</li>', body, re.S):
    href = bing_decode(html.unescape(m.group(1)))
    if not href or "bing.com" in href: continue
    title = L.strip_html(m.group(2)); snippet = L.strip_html(m.group(3))[:600]
    n += 1; bing_rows[0] += 1
    if glyph == "linkedin" and "linkedin.com" not in href: continue
    submit(src, href, title=title, excerpt=snippet, outlet=L.host_of(href), glyph=glyph)
  return n
def run_bing():
  for q in ('"B Capital Group"', '"B Capital" venture'):
    for mkt in ("en-US", "en-IN", "en-SG", "en-GB"):
      if discovery_over(): return
      u = f"https://www.bing.com/news/search?q={urllib.parse.quote(q)}&format=rss&count=100&mkt={mkt}"
      st, body = L.get(u, _skip_robots=True)
      if st != 200: blockers.append({"source": "bing-news-rss", "url": u, "status": st}); time.sleep(2); continue
      rows = L.rss_items(body); bing_rows[0] += len(rows)
      for r in rows:
        # bing.com/news/apiclick.aspx?…&url=<publisher> → unwrap to the publisher URL so the canonical is the article, not the redirect
        mu = re.search(r"[?&]url=([^&]+)", r["url"] or "")
        if mu and "apiclick" in r["url"]: r["url"] = urllib.parse.unquote(mu.group(1))
        if r["url"] and not stage.has(r["url"]):
          submit("bing", r["url"], title=r["title"], date=r["published_at"], outlet=r["publisher"] or L.host_of(r["url"]), excerpt=r["excerpt"])
      time.sleep(1.0)
  for first in (1, 51, 101, 151):
    if discovery_over(): return
    n = bing_web('"B Capital Group"', first)
    if n == 0: break
    time.sleep(1.5)
  stage.log(f"bing done: rows={bing_rows[0]}")

# ---------------------------------------------------------------- 5. GDELT DOC 2.0 ---------------------------------------------------
gdelt_rows = [0]
def run_gdelt():
  wins = []
  for y in range(2016, 2027):
    wins.append((f"{y}0101000000", f"{y}0701000000"))
    wins.append((f"{y}0701000000", f"{y+1}0101000000" if y < 2026 else "20261020000000"))
  for q in ('"B Capital Group"', '"B Capital" (Saverin OR Ganguly OR venture)'):
    for a, b in wins:
      if discovery_over(): return
      u = f"https://api.gdeltproject.org/api/v2/doc/doc?query={urllib.parse.quote(q)}&mode=artlist&maxrecords=250&format=json&startdatetime={a}&enddatetime={b}"
      st, body = L.get(u, timeout=40, retries=1, _skip_robots=True)
      if st == 200:
        try: arts = json.loads(body).get("articles", [])
        except Exception: arts = []
        gdelt_rows[0] += len(arts)
        for ar in arts:
          if ar.get("url") and not stage.has(ar["url"]):
            submit("gdelt", ar["url"], title=ar.get("title"), date=ar.get("seendate"), outlet=ar.get("domain"))
      else:
        blockers.append({"source": "gdelt", "url": u[:160], "status": st})
      time.sleep(7)
  stage.log(f"gdelt done: rows={gdelt_rows[0]}")

# ---------------------------------------------------------------- main ---------------------------------------------------------------
def write_summary():
  summ = stage.summary()
  est = 0; regs = collections.Counter(); glyphs = collections.Counter()
  for line in open(stage.path, encoding="utf-8"):
    try:
      d = json.loads(line); est += int(bool(d.get("published_at_estimated"))); glyphs[d.get("platform_glyph")] += 1
      for r in d.get("registers", []): regs[r] += 1
    except Exception: pass
  summ.update({
    "seeds_total": len(SEEDS), "seeds_ok": counters["seeds_ok"], "seeds_failed": seeds_failed,
    "tag_pages_tried": tag_pages_tried[0], "tag_pages_blocked": tag_pages_blocked[0], "tag_candidates": counters["tag_candidates"],
    "gnews_rows": gnews_rows[0], "gnews_calls": gnews_calls[0], "bing_rows": bing_rows[0], "gdelt_rows": gdelt_rows[0],
    "namesake_dropped": namesake_pre[0] + stage.dropped.get("namesake", 0), "namesake_prefiltered": namesake_pre[0],
    "http_status_counts": dict(status_counts), "estimated_dates": est, "items_by_register": dict(regs), "items_by_glyph": dict(glyphs),
    "duration_s": int(elapsed()), "processed": processed[0], "counters": dict(counters), "blockers": blockers, "finished_at": L.NOW(),
  })
  json.dump(summ, open(os.path.join(L.STAGE, f"{CLS}.summary.json"), "w"), indent=2, ensure_ascii=False)
  return summ

def main():
  stage.log(f"collect_g_bcapital start; resume: items={stage.n} attempted={len(attempted)}")
  threads = [threading.Thread(target=f, daemon=True, name=n) for f, n in (
    (run_seeds, "seeds"), (run_tags, "tags"), (run_gnews, "gnews"), (run_bing, "bing"), (run_gdelt, "gdelt"), (run_linkedin_discovery, "linkedin"))]
  for t in threads: t.start()
  while any(t.is_alive() for t in threads) and not hard_over(): time.sleep(5)
  stage.log(f"discovery finished/cut at {int(elapsed())}s; items={stage.n} queued={sum(v for k, v in counters.items() if k.startswith('queued_'))} processed={processed[0]}")
  while not hard_over():
    with _flock: pending = [f for f in futures if not f.done()]
    if not pending: break
    time.sleep(2)
  with _flock:
    for f in futures: f.cancel()
  EX.shutdown(wait=False, cancel_futures=True)
  time.sleep(3)
  stage.f.flush()
  summ = write_summary()
  stage.log(f"DONE items={stage.n} by_register={summ['items_by_register']} dropped={dict(stage.dropped)} namesake={summ['namesake_dropped']} status={dict(status_counts)} duration={int(elapsed())}s")
  os._exit(0)

if __name__ == "__main__":
  main()
