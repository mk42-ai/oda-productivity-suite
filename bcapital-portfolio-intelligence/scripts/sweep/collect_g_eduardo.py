#!/usr/bin/env python3
"""collect_g_eduardo — source class (g-eduardo): register BCAP-002 Eduardo Saverin, NEW-source sweep (2026-10-19).

The corpus already carries ~3,000 Saverin items from Google News, so this collector prioritises sources the earlier classes did not
reach: Forbes Brasil / Portuguese-language press, Singapore outlets, philanthropy (Saverin Foundation, NUS, SAS, cancer-center gift),
Brazilian business press, Forbes IT/CN, LinkedIn / X permalinks, GDELT (incl. Portuguese) and the @esaverin X syndication timeline.

Pipeline (hard wall-clock budget 30 min):
  1. seeds (ThreadPoolExecutor 8, fetch_article + wayback fallback)        5. GDELT DOC 2.0 yearly windows 2015→2026 (+ sourcelang:portuguese), 7 s apart (background thread)
  2. outlet tag/search pages (serial, ≤6 pages, ≤80 links)                 6. X syndication timeline @esaverin → forced BCAP-002, keep_offsubject
  3. Google News RSS half-year windows 2012→2026 (US/SG/BR, ≤2 req/s)        → resolve news.google.com links (≤2 req/s) → fetch_article (8 workers) → Stage('g-eduardo').add
  4. Bing News RSS (4 markets) + Bing web HTML (3 pages, ck/a base64 decode)
Resumable (Stage skips canonical URLs already in data/sweep/g-eduardo.jsonl); append-only. Google News rows whose title already exists in
web/data/reputation/evidence.json are not re-resolved (counted as gnews_skipped_in_evidence) so the budget goes to genuinely new URLs.
Mediaite op-ed exception: Saverin's first-person CNBC op-ed is kept even if Stage's film-noise filter rejects it (see keep_mediaite()).
Outputs: data/sweep/g-eduardo.jsonl, .log, .rejects.jsonl, .summary.json
"""
from __future__ import annotations
import base64, html as _html, json, os, re, sys, threading, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as L

T0 = time.time()
BUDGET = 30 * 60
DISCOVERY_BUDGET = 13 * 60
CLS = "g-eduardo"; REG = "BCAP-002"
stage = L.Stage(CLS)
S = {"gnews_queries": 0, "gnews_rows": 0, "gnews_skipped_in_evidence": 0, "gnews_resolved": 0, "gnews_unresolved": 0, "bing_rows": 0, "bing_web_rows": 0, "gdelt_rows": 0, "gdelt_calls": 0,
     "tag_pages_tried": 0, "tag_links": 0, "x_tweets": 0, "http_status_counts": {}, "blockers": [], "seed_status": {}, "fetched": 0, "skipped_in_evidence": 0, "run_added": 0,
     "mediaite_oped_kept": False, "mediaite_note": ""}
SUBJECT_RE = re.compile(r"eduardo\s+saverin|\bsaverin\b|esaverin", re.I)
NEW_SOURCE_RE = re.compile(r"forbes\.com\.br|\.br$|\.com\.br|straitstimes|businesstimes|channelnewsasia|mothership|tatlerasia|todayonline|asiaone|caproasia|forbes\.it|forbeschina|nus\.edu|eesaverinfoundation|linkedin\.com|x\.com|twitter\.com|exame|infomoney|valor\.globo|folha|estadao|tecnoblog|epocanegocios|globo\.com|bloomberglinea|startse|neofeed|pipelinevalor|scmp|edgesingapore|theedgesingapore|vulcanpost|techinasia|dealstreetasia|e27\.co", re.I)
_lock = threading.Lock()

class Limiter:
  def __init__(self, interval: float): self.iv = interval; self.t = 0.0; self.lk = threading.Lock()
  def wait(self):
    with self.lk:
      now = time.time(); d = self.t + self.iv - now
      if d > 0: time.sleep(d); now = time.time()
      self.t = now
GOOGLE = Limiter(0.5)    # ≤ 2 req/s for news.google.com (discovery) — resolve uses its own 1 s pacing because each resolve can be 2 requests
GRESOLVE = Limiter(1.0)
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

# ------------------------------------------------------------------ existing corpus (for NEW-vs-present) ------------------------------
EV_URLS: set[str] = set(); EV_TITLES: set[str] = set()
def norm_title(t: str) -> str: return re.sub(r"\W+", " ", (t or "").lower()).strip()
def load_evidence():
  p = os.path.join(L.ROOT, "web", "data", "reputation", "evidence.json")
  try:
    for d in json.load(open(p, encoding="utf-8")):
      c = L.canonical(d.get("canonical_url") or "")
      if c: EV_URLS.add(c)
      t = norm_title(d.get("title") or "")
      if len(t) > 20: EV_TITLES.add(t)
  except Exception as e: stage.log(f"evidence.json not loaded: {e}")
  stage.log(f"evidence.json urls={len(EV_URLS)} titles={len(EV_TITLES)}")
def gn_title_known(t: str) -> bool:
  base = t.rsplit(" - ", 1)[0] if " - " in t else t
  return norm_title(base) in EV_TITLES or norm_title(t) in EV_TITLES

def add(it, keep_offsubject: bool = False) -> bool:
  if not it: return False
  ok = stage.add(it, keep_offsubject=keep_offsubject)
  if ok:
    S["run_added"] += 1
    if stage.n % 50 == 0: stage.log(f"progress items={stage.n} dropped={stage.dropped} fetched={S['fetched']} elapsed={int(time.time() - T0)}s")
  return ok
def force_add(it: dict, note: str) -> bool:
  """Bypass Stage's noise filter for a documented exception (append-only write through stage.f, same schema, registers forced to BCAP-002)."""
  if not it or it["canonical_url"] in stage.seen: return False
  if REG not in it["registers"]: it["registers"] = it["registers"] + [REG]
  it["noise_override"] = note
  stage.seen.add(it["canonical_url"]); stage.n += 1; S["run_added"] += 1
  stage.f.write(json.dumps(it, ensure_ascii=False) + "\n"); stage.f.flush()
  return True

# ------------------------------------------------------------------ candidate rows ----------------------------------------------------
ROWS: dict[str, dict] = {}
def row(url: str, title: str = "", date: str = "", outlet: str = "", excerpt: str = "", prio: int = 1, pub_url: str = ""):
  if not url or not url.startswith("http"): return
  gn = "news.google.com" in url
  key = url if gn else (L.canonical(url) or url)
  if key in ROWS: return
  if not gn and (stage.has(url) or key in EV_URLS):
    S["skipped_in_evidence"] += 1; return
  if gn and title and gn_title_known(title): S["gnews_skipped_in_evidence"] += 1; return
  if pub_url and NEW_SOURCE_RE.search(L.host_of(pub_url)): prio = min(prio, 0)
  ROWS[key] = {"url": url, "title": title, "date": date, "outlet": outlet, "excerpt": excerpt, "prio": prio}

# ------------------------------------------------------------------ 1. seeds ----------------------------------------------------------
SEEDS = [
  "https://b.capital/team/eduardo-saverin/", "https://www.forbes.com/profile/eduardo-saverin/",
  "https://www.forbes.com/sites/alexkonrad/2019/03/19/life-after-facebook--the-untold-story-of-billionaire-eduardo-saverins-highly-networked-venture-firm/",
  "https://www.forbes.com/sites/pamelaambler/2019/10/13/from-silicon-valley-to-singapore-eduardo-saverin-and-vc-partners-approach-to-accelerate-innovation/",
  "https://www.forbes.com/sites/naazneenkarmali/2017/12/08/facebook-co-founder-eduardo-saverin-becomes-singapores-richest-person/",
  "https://www.forbes.com/sites/naazneenkarmali/2023/09/06/singapores-50-richest-2023-facebook-cofounder-eduardo-saverin-is-new-no-1-as-combined-wealth-rises-8-to-177-billion/",
  "https://www.forbes.com/sites/naazneenkarmali/2024/09/04/singapores-50-richest-2024-a-double-digit-boost-propels-combined-wealth-to-195-billion/",
  "https://www.forbes.com/sites/janeho/2025/09/03/singapores-50-richest-2025-combined-wealth-jumps-to-239-billion-facebook-cofounder-eduardo-saverin-adds-14-billion-to-remain-at-no-1/",
  "https://www.asiaone.com/money/singapore-50-richest-list-2026-eduardo-saverin-ocbc-lee-family",
  "https://bilyonaryo.com/singapores-50-richest-worth-239b-facebook-co-founder-eduardo-saverin-stays-no-1-for-4th-year/",
  "https://malaysia.news.yahoo.com/eduardo-saverin-keeps-singapore-rich-033139936.html",
  "https://www.forbes.com/sites/yessarrosendar/2024/03/20/billionaire-eduardo-saverins-b-capital-raises-750-million-to-fund-late-stage-startups/",
  "https://www.forbes.com/sites/jonathanburgos/2022/07/20/facebook-billionaire-eduardo-saverins-b-capital-raises-250-million-for-its-early-stage-vc-fund/",
  "https://www.forbes.com/sites/jonathanburgos/2022/05/02/facebook-billionaire-eduardo-saverins-b-capital-halts-spac-plans-amid-market-volatility/",
  "https://www.bloomberg.com/news/articles/2022-07-19/eduardo-saverin-s-b-capital-raises-first-early-stage-vc-fund",
  "https://www.forbes.com/sites/irisleung/2016/04/15/eduardo-saverin-unlike-the-valley-mobile-first-southeast-asia-is-a-white-space/",
  "https://www.forbes.com/sites/janeroberts/2015/06/24/facebook-cofounder-eduardo-saverin-invests-in-tech-in-asia/",
  "https://www.forbes.com/sites/worldviews/2012/05/11/why-eduardo-saverin-moved-to-singapore/",
  "https://www.businessinsider.com/facebook-cofounder-eduardo-saverin-donation-singapore-american-school-2024-9",
  "https://www.straitstimes.com/singapore/community/singapore-a-special-place-in-giving-journey-of-facebook-co-founder-eduardo-saverin-and-wife-elaine",
  "https://lifestylesmagazine.com/latest-news/20-million-gift-to-cancer-center-from-elaine-and-eduardo-saverin/",
  "https://eesaverinfoundation.org/", "https://eesaverinfoundation.org/media-center/scholarship-to-build-singapores-mental-health-workforce/",
  "https://medicine.nus.edu.sg/news/nus-medicine-establishes-new-mental-health-scholarship-with-s3-million-gift-from-elaine-and-eduardo-saverin-foundation/",
  "https://www.caproasia.com/2025/11/27/facebook-co-founder-singapore-richest-man-with-34-billion-fortune-eduardo-saverin-wife-elaine-saverin-elaine-and-eduardo-saverin-foundation-launch-mental-health-scholarship-in-singapore-starts/",
  "https://www.scmp.com/magazines/style/entertainment/article/3245743/where-facebook-co-founder-eduardo-saverin-now-brazilian-billionaire-still-owns-stake-meta-and",
  "https://forbes.com.br/forbes-tech/2026/08/conheca-a-trajetoria-de-eduardo-saverin-o-brasileiro-com-a-maior-fortuna-pessoal-desde-2024/",
  "https://forbes.com.br/forbes-tech/2025/03/oriente-medio-a-nova-grande-aposta-de-eduardo-saverin/",
  "https://forbes.com.br/negocios/2016/10/procuro-investir-no-ecossistema-brasileiro-de-startups-afirma-saverin-bilionario-cofundador-do-facebook/",
  "https://tecnoblog.net/responde/quem-e-eduardo-saverin-conheca-o-brasileiro-cofundador-do-facebook/",
  "https://brasil.perfil.com/economia/quem-e-eduardo-saverin-o-brasileiro-mais-rico-da-historia.phtml",
  "https://gpsbrasilia.com.br/quem-e-eduardo-saverin-o-brasileiro-mais-rico-do-mundo/",
  "https://www.estadao.com.br/link/empresas/quem-eduardo-saverin-brasileiro-mais-rico-do-mundo-nprei/",
  "https://www.thekeyexecutives.com/2022/05/30/status-update-eduardo-saverin/",
  "https://www.bloomberglinea.com.br/2023/01/19/bilionario-brasileiro-eduardo-saverin-capta-us-21-bi-para-investir-em-startups/",
  "https://forbes.com.br/forbes-money/2022/07/b-capital-de-eduardo-saverin-capta-us-250-milhoes-para-venture-capital/",
]
MEDIAITE = "https://www.mediaite.com/online/eduardo-saverin-facebook-co-founder-responds-to-the-social-network/"
FOUNDATION = "https://eesaverinfoundation.org/"
FORBES_BR_TAG = "https://forbes.com.br/noticias-sobre/eduardo-saverin/"

def seed_fetch(u: str):
  slug = re.sub(r"[-_/]+", " ", urllib.parse.urlsplit(u).path).strip().title() or L.host_of(u)
  try:
    it = L.fetch_article(CLS, u, hint_title=f"Eduardo Saverin — {slug}", hint_excerpt=f"Eduardo Saverin coverage: {u}", glyph="web" if re.search(r"b\.capital|forbes\.com/profile|eesaverinfoundation", u) else None, wayback=True)
  except Exception as e: it = None
  return u, it

def seeds():
  stage.log(f"== seeds n={len(SEEDS)} (pool 8)")
  todo = [u for u in SEEDS if not stage.has(u)]
  for u in SEEDS:
    if stage.has(u): S["seed_status"][u] = "resumed"
  with ThreadPoolExecutor(max_workers=8) as P:
    for fut in as_completed({P.submit(seed_fetch, u): u for u in todo}):
      u, it = fut.result(); st = it.get("http_status") if it else None
      hs(st); S["seed_status"][u] = st
      if st in (403, 999, 0, 404, 429, 451): blocker(f"seed {L.host_of(u)} HTTP {st}")
      ok = add(it) if it else False
      stage.log(f"seed {u} status={st} added={ok} regs={(it or {}).get('registers')} date={(it or {}).get('published_at')}")
      if over(): break

def keep_mediaite():
  """Saverin's own first-person CNBC op-ed (via Mediaite) — the brief wants it kept although its title names 'The Social Network'."""
  if stage.has(MEDIAITE): S["mediaite_oped_kept"] = True; S["mediaite_note"] = "resumed (already in stage)"; return
  u, it = seed_fetch(MEDIAITE); st = it.get("http_status") if it else None; hs(st); S["seed_status"][MEDIAITE] = st
  if not it: S["mediaite_note"] = f"fetch failed status={st}"; blocker("mediaite op-ed fetch failed"); return
  reason = L.noise_reason(it["title"], it["text"], it["registers"])
  if reason is None: S["mediaite_oped_kept"] = add(it); S["mediaite_note"] = "passed Stage.add normally"
  else:
    # Stage.add would reject it (film-noise: title/body cite 'The Social Network'). Documented override: written through stage.f with
    # registers forced to BCAP-002 and extra noise_override, dedup state kept in sync (stage.seen / stage.n). Nothing goes to rejects.
    S["mediaite_oped_kept"] = force_add(it, "first-person op-ed"); S["mediaite_note"] = f"Stage would drop as {reason}; force-added via stage.f with noise_override='first-person op-ed'"
  stage.log(f"mediaite op-ed status={st} kept={S['mediaite_oped_kept']} note={S['mediaite_note']}")

def foundation_crawl():
  """Every /media-center/ link on eesaverinfoundation.org (home + /media-center/ index, paginated)."""
  links: set[str] = set()
  for u in [FOUNDATION, FOUNDATION + "media-center/", FOUNDATION + "media-center/page/2/", FOUNDATION + "media-center/page/3/", FOUNDATION + "news/", FOUNDATION + "sitemap.xml", FOUNDATION + "post-sitemap.xml"]:
    if over(DISCOVERY_BUDGET): break
    st, body = L.get(u); hs(st)
    if st != 200: stage.log(f"foundation page {u} status={st}"); continue
    for h in re.findall(r'(?:href=["\']|<loc>\s*)(https?://(?:www\.)?eesaverinfoundation\.org/[^"\'<\s#]+)', body):
      if re.search(r"/media-center/.+|/news/.+|/press/.+", h) and not re.search(r"/page/\d|/feed|\.(jpg|png|pdf)$", h): links.add(h)
    stage.log(f"foundation page {u} status={st} media_links={len(links)}")
  for h in sorted(links): row(h, prio=0)
  S["foundation_links"] = len(links)

# ------------------------------------------------------------------ 2. tag / search pages -----------------------------------------------
ART_HREF = re.compile(r'href=["\']([^"\'#\s]+)["\']', re.I)
ART_PATH = re.compile(r"/20[0-2]\d/|/news/|/article|/story|/stories/|/noticias?/|/negocios/|/forbes-|/economia/|/mercados/|/tecnologia/|/business/|/singapore/|/asia/|/companies-markets/|/startups/|/mercado/|/empresas/|/colunas/|/carreira/|/tech/|/lifestyle/|/\d{4}/\d{2}/", re.I)
SKIP_PATH = re.compile(r"/tag/|/topic/|/search|/author/|/category/|/page/\d|\?s=|\?q=|/login|/subscribe|/newsletter|/video/|/photos?/|/tags/|/noticias-sobre/|/busca|/autor/|/assine|/podcasts?/|/multimedia/|/live/|/quiz", re.I)
def tag_pages(base: str, cap: int = 80, max_pages: int = 6, require_subject: bool = False):
  host = L.host_of(base); found: list[str] = []; seen = set()
  for n in range(1, max_pages + 1):
    if over(DISCOVERY_BUDGET) or len(found) >= cap: break
    if n == 1: u = base
    elif "?" in base: u = base + f"&page={n}"
    else: u = base.rstrip("/") + f"/page/{n}/"
    st, body = L.get(u); hs(st); S["tag_pages_tried"] += 1
    if st != 200 or not body:
      stage.log(f"tag page {u} status={st}")
      if st in (403, 999, 0, 429, 451): blocker(f"tag page {host} HTTP {st}")
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
      if not ART_PATH.search(path) or SKIP_PATH.search(h) or path.count("/") < 2: continue
      if require_subject and not SUBJECT_RE.search(h.replace("-", " ")): continue
      c = L.canonical(h)
      if not c or c in seen: continue
      seen.add(c); new += 1
      if len(found) < cap: found.append(h)
    stage.log(f"tag page {u} status={st} new_links={new} total={len(found)}")
    if new == 0: break
  S["tag_links"] += len(found)
  for h in found: row(h, prio=0 if SUBJECT_RE.search(h.replace("-", " ")) else 2)

TAG_PAGES = [
  (FORBES_BR_TAG, 150, 10, False),
  ("https://www.straitstimes.com/search?searchkey=eduardo%20saverin", 80, 6, False), ("https://www.businesstimes.com.sg/search?query=eduardo%20saverin", 80, 6, False),
  ("https://mothership.sg/?s=saverin", 80, 6, False), ("https://www.tatlerasia.com/search?q=eduardo%20saverin", 80, 6, False), ("https://www.channelnewsasia.com/search?q=saverin", 80, 6, False),
  ("https://exame.com/noticias-sobre/eduardo-saverin/", 80, 6, False), ("https://epocanegocios.globo.com/busca/?q=eduardo+saverin", 80, 6, False), ("https://www.infomoney.com.br/?s=eduardo+saverin", 80, 6, False),
  ("https://valor.globo.com/busca/?q=eduardo+saverin", 80, 6, False), ("https://www1.folha.uol.com.br/busca/?q=eduardo+saverin", 80, 6, False), ("https://forbes.it/?s=saverin", 80, 6, False),
  ("https://www.forbeschina.com/search?q=Saverin", 80, 6, False), ("https://techcrunch.com/tag/eduardo-saverin/", 80, 6, False), ("https://www.businessinsider.com/s?q=eduardo+saverin", 80, 6, False),
  ("https://fortune.com/search/?q=eduardo%20saverin", 80, 6, False),
]
def tags():
  stage.log("== tag / search pages")
  for base, cap, mp, rs in TAG_PAGES:
    if over(DISCOVERY_BUDGET): return
    try: tag_pages(base, cap, mp, rs)
    except Exception as e: stage.log(f"tag page {base} failed: {type(e).__name__}: {e}")

# ------------------------------------------------------------------ 3. google news ------------------------------------------------------
def half_year_windows(start="2012-01-01", end="2026-10-19"):
  out = []; y = int(start[:4])
  while f"{y}-01-01" <= end:
    out.append((f"{y}-01-01", min(f"{y}-06-30", end)))
    if f"{y}-07-01" <= end: out.append((f"{y}-07-01", min(f"{y}-12-31", end)))
    y += 1
  return out
def gnews(query: str, after=None, before=None, lang="en-US", gl="US", prio: int = 1) -> int:
  if over(DISCOVERY_BUDGET): return 0
  GOOGLE.wait()
  try: rows = L.google_news_search(query, after=after, before=before, lang=lang, gl=gl)
  except Exception as e: stage.log(f"gnews error {query}: {e}"); rows = []
  S["gnews_queries"] += 1; S["gnews_rows"] += len(rows)
  for r in rows:
    p = prio if SUBJECT_RE.search(r["title"] + " " + r["excerpt"]) else prio + 2
    row(r["url"], r["title"], r["published_at"], r["publisher"], r["excerpt"], p, pub_url=r.get("publisher_url") or "")
  return len(rows)
GN_QUERIES = ['"Eduardo Saverin"', '"Eduardo Saverin" "B Capital"', '"Saverin" Singapore richest', '"Saverin Foundation" OR "Elaine Saverin"', '"Eduardo Saverin" Brazil OR Brasil OR brasileiro',
              '"Eduardo Saverin" Meta stake OR Facebook shares', '"Eduardo Saverin" interview OR entrevista', '"Eduardo Saverin" Middle East OR Abu Dhabi OR Dubai']
GN_SITE = ['site:linkedin.com "Eduardo Saverin"', 'site:x.com esaverin', 'site:forbes.com.br Saverin', 'site:straitstimes.com Saverin', 'site:businesstimes.com.sg Saverin', 'site:exame.com Saverin', 'site:infomoney.com.br Saverin', 'site:valor.globo.com Saverin', 'site:mothership.sg Saverin', 'site:tatlerasia.com Saverin']
MARKETS = [("pt-BR", "BR"), ("en-SG", "SG"), ("en-US", "US")]   # new-source markets first so a time-out favours them
def google():
  stage.log("== Google News RSS")
  for q in GN_SITE:
    if over(DISCOVERY_BUDGET): return
    n = gnews(q, prio=0); stage.log(f"gnews '{q}' rows={n}")
  wins = half_year_windows()
  for q in GN_QUERIES:
    tot = 0
    for lang, gl in MARKETS:
      for a, b in wins:
        if over(DISCOVERY_BUDGET): stage.log(f"gnews budget hit at '{q}' {lang} {a}"); return
        tot += gnews(q, after=a, before=b, lang=lang, gl=gl)
    stage.log(f"gnews half-year '{q}' x{len(MARKETS)} rows={tot} candidates={len(ROWS)} skipped_in_evidence={S['gnews_skipped_in_evidence']}")

# ------------------------------------------------------------------ 4. bing -------------------------------------------------------------
def bing_unwrap(url: str) -> str:
  if "bing.com" not in url: return url
  m = re.search(r"[?&](?:url|r)=(https?[^&]+)", url)
  if m: return urllib.parse.unquote(m.group(1))
  m = re.search(r"[?&]u=a1([A-Za-z0-9_-]+)", url)
  if m:
    try:
      s = m.group(1); return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)).decode("utf-8", "replace")
    except Exception: pass
  return url
def bing():
  stage.log("== Bing")
  for mkt in ("en-US", "en-SG", "pt-BR", "en-GB"):
    if over(DISCOVERY_BUDGET): return
    BING.wait()
    u = "https://www.bing.com/news/search?q=" + urllib.parse.quote('"Eduardo Saverin"') + f"&format=rss&count=100&mkt={mkt}"
    st, body = L.get(u, _skip_robots=True); hs(st)
    rows = L.rss_items(body) if st == 200 else []
    S["bing_rows"] += len(rows)
    for r in rows:
      p = 1 if SUBJECT_RE.search(r["title"] + " " + r["excerpt"]) else 3
      row(bing_unwrap(r["url"]), r["title"], r["published_at"], r["publisher"], r["excerpt"], p)
    stage.log(f"bing news mkt={mkt} status={st} rows={len(rows)}")
    if st != 200: blocker(f"bing news rss HTTP {st} ({mkt})")
  for first in (1, 51, 101):
    if over(DISCOVERY_BUDGET): return
    BING.wait()
    u = f"https://www.bing.com/search?q=%22Eduardo+Saverin%22+%22B+Capital%22&count=50&first={first}"
    st, body = L.get(u, _skip_robots=True); hs(st)
    n = 0
    if st == 200:
      for h in re.findall(r'<h2><a[^>]+href="([^"]+)"', body) + re.findall(r'href="(https://www\.bing\.com/ck/a\?[^"]+)"', body):
        real = bing_unwrap(_html.unescape(h))
        if real.startswith("http") and "bing.com" not in real and "microsoft.com" not in real: row(real, prio=1); n += 1
    S["bing_web_rows"] += n
    stage.log(f"bing web first={first} status={st} links={n}")
    if st != 200: blocker(f"bing web HTTP {st}")

# ------------------------------------------------------------------ 5. GDELT (background) -------------------------------------------------
GDELT_ROWS: list[dict] = []
def gdelt_thread():
  for y in range(2015, 2027):
    for q in ['"Eduardo Saverin"', '"Eduardo Saverin" sourcelang:portuguese']:
      if over(DISCOVERY_BUDGET + 120): return
      end = "20261019235959" if y == 2026 else f"{y}1231235959"
      u = "https://api.gdeltproject.org/api/v2/doc/doc?" + urllib.parse.urlencode({"query": q, "mode": "artlist", "maxrecords": 250, "format": "json", "startdatetime": f"{y}0101000000", "enddatetime": end, "sort": "datedesc"})
      st, body = L.get(u, timeout=40, retries=1); hs(st); S["gdelt_calls"] += 1
      n = 0
      if st == 200 and body.strip().startswith("{"):
        try:
          for a in json.loads(body).get("articles", []):
            GDELT_ROWS.append({"url": a.get("url"), "title": a.get("title") or "", "date": L.iso_date(a.get("seendate")) or "", "outlet": a.get("domain") or "", "lang": a.get("language")}); n += 1
        except Exception as e: stage.log(f"gdelt parse {y}: {e}")
      elif st != 200: blocker(f"gdelt HTTP {st}")
      stage.log(f"gdelt {y} '{q}' status={st} rows={n}")
      time.sleep(7)
def gdelt_merge():
  S["gdelt_rows"] = len(GDELT_ROWS)
  for r in GDELT_ROWS:
    if not r["url"]: continue
    p = 0 if (r.get("lang") == "Portuguese" or NEW_SOURCE_RE.search(r["outlet"])) else (1 if SUBJECT_RE.search(r["title"]) else 3)
    row(r["url"], r["title"], r["date"], r["outlet"], "", p)

# ------------------------------------------------------------------ 6. X syndication @esaverin -------------------------------------------
def x_timeline():
  stage.log("== X syndication @esaverin")
  u = "https://syndication.twitter.com/srv/timeline-profile/screen-name/esaverin"
  st, body = L.get(u, _skip_robots=True, retries=2); hs(st)   # lib backs off 6 s / 12 s on 429; we do not loop beyond that
  if st != 200:
    blocker(f"x syndication HTTP {st}"); stage.log(f"x syndication status={st}"); return
  m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', body, re.S)
  if not m: blocker("x syndication: no __NEXT_DATA__"); stage.log("x syndication: no __NEXT_DATA__"); return
  try: data = json.loads(m.group(1))
  except Exception as e: blocker("x syndication: json error"); stage.log(f"x syndication json error {e}"); return
  entries = (((data.get("props") or {}).get("pageProps") or {}).get("timeline") or {}).get("entries") or []
  n = 0
  for e in entries:
    tw = (e.get("content") or {}).get("tweet") or {}
    if not tw: continue
    sn = ((tw.get("user") or {}).get("screen_name") or "").lower()
    if sn != "esaverin": continue
    tid = tw.get("id_str") or tw.get("conversation_id_str")
    if not tid: continue
    text = tw.get("full_text") or tw.get("text") or ""
    for ue in (tw.get("entities") or {}).get("urls") or []:
      if ue.get("url") and ue.get("expanded_url"): text = text.replace(ue["url"], ue["expanded_url"])
    url = f"https://x.com/esaverin/status/{tid}"
    it = L.make_item(source_class=CLS, url=url, title=f"@esaverin: {text[:140]}", text=text, outlet="X (@esaverin)", author="Eduardo Saverin (@esaverin)", published_at=L.iso_date(tw.get("created_at")), date_source="api", http_status=st, platform_glyph="x", provider_receipt=True, extra={"reply_to": (f"https://x.com/i/status/{tw['in_reply_to_status_id_str']}" if tw.get("in_reply_to_status_id_str") else None), "outbound_links": [ue.get("expanded_url") for ue in (tw.get("entities") or {}).get("urls") or [] if ue.get("expanded_url")][:25], "x_metrics": {"likes": tw.get("favorite_count"), "retweets": tw.get("retweet_count")}})
    if not it: continue
    if REG not in it["registers"]: it["registers"].append(REG)   # authored by @esaverin → forced BCAP-002
    if add(it, keep_offsubject=True): n += 1
  S["x_tweets"] = n
  stage.log(f"x syndication status={st} entries={len(entries)} tweets_added={n}")

# ------------------------------------------------------------------ resolve + fetch ------------------------------------------------------
def resolve(r: dict) -> dict:
  if "news.google.com" in r["url"]:
    real = L.decode_gnews(r["url"])
    if not (real and real.startswith("http") and "news.google.com" not in real):
      GRESOLVE.wait()
      try: real = L.resolve_gnews(r["url"])
      except Exception: real = None
    return dict(r, real=real)
  return dict(r, real=r["url"])
def fetch(r: dict):
  try: it = L.fetch_article(CLS, r["real"], hint_title=r["title"] or None, hint_date=r["date"] or None, hint_outlet=r["outlet"] or None, hint_excerpt=r["excerpt"] or None)
  except Exception: it = None
  return r, it
def _consume(pf, wait=0):
  try: r, it = pf.result(timeout=wait)
  except Exception: return
  S["fetched"] += 1
  if it: hs(it.get("http_status")); add(it)
def process():
  rows = sorted(ROWS.values(), key=lambda r: (r["prio"], "news.google.com" in r["url"], r["date"] == "", r["date"]))
  stage.log(f"== resolve+fetch candidates={len(rows)} gnews={sum('news.google.com' in r['url'] for r in rows)} prio0={sum(r['prio'] == 0 for r in rows)} time_left={int(left())}s")
  pending = []
  with ThreadPoolExecutor(max_workers=2) as RP, ThreadPoolExecutor(max_workers=8) as FP:
    rf = {RP.submit(resolve, r): r for r in rows}; done_r = 0
    try:
      for fut in as_completed(rf):
        done_r += 1
        if over(): RP.shutdown(wait=False, cancel_futures=True); break
        r = fut.result()
        if "news.google.com" in r["url"]:
          if r.get("real") and "news.google.com" not in r["real"]: S["gnews_resolved"] += 1
          else: S["gnews_unresolved"] += 1; continue
        real = r.get("real")
        if not real: continue
        c = L.canonical(real)
        if stage.has(real) or (c and c in EV_URLS): S["skipped_in_evidence"] += 1; continue
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

# ------------------------------------------------------------------ main --------------------------------------------------------------
def main():
  stage.log(f"start collect_g_eduardo resume_items={stage.n} budget={BUDGET}s")
  load_evidence()
  gt = threading.Thread(target=gdelt_thread, daemon=True); gt.start()
  for step in (seeds, keep_mediaite, foundation_crawl, x_timeline, tags, bing, google):
    if over(DISCOVERY_BUDGET) and step not in (keep_mediaite, x_timeline): stage.log(f"discovery budget hit before {step.__name__}"); blocker(f"discovery budget hit before {step.__name__}"); continue
    try: step()
    except Exception as e: stage.log(f"step {step.__name__} failed: {type(e).__name__}: {e}"); blocker(f"{step.__name__}: {type(e).__name__}")
  gt.join(timeout=max(1, min(90, DISCOVERY_BUDGET + 120 - (time.time() - T0))))
  gdelt_merge()
  stage.log(f"discovery done gnews_queries={S['gnews_queries']} gnews_rows={S['gnews_rows']} bing_rows={S['bing_rows']} gdelt_rows={S['gdelt_rows']} tag_pages={S['tag_pages_tried']} candidates={len(ROWS)} elapsed={int(time.time() - T0)}s")
  if not over():
    try: process()
    except Exception as e: stage.log(f"process failed: {type(e).__name__}: {e}"); blocker(f"process: {type(e).__name__}")
  # file-wide totals
  est = 0; new_vs_ev = {"new": 0, "already_in_evidence": 0}; samples = []; hosts: dict[str, int] = {}
  for line in open(stage.path, encoding="utf-8"):
    try: d = json.loads(line)
    except Exception: continue
    if d.get("published_at_estimated"): est += 1
    new_vs_ev["already_in_evidence" if d["canonical_url"] in EV_URLS else "new"] += 1
    h = L.host_of(d["canonical_url"]); hosts[h] = hosts.get(h, 0) + 1
    if len(samples) < 3 and not d.get("published_at_estimated") and SUBJECT_RE.search(d["title"]): samples.append({"title": d["title"], "published_at": d["published_at"], "url": d["canonical_url"]})
  rej: dict[str, int] = {}
  rp = os.path.join(L.STAGE, f"{CLS}.rejects.jsonl")
  if os.path.exists(rp):
    for line in open(rp, encoding="utf-8"):
      try: k = json.loads(line)["reason"]; rej[k] = rej.get(k, 0) + 1
      except Exception: pass
  seeds_failed = [{"url": u, "status": st} for u, st in S["seed_status"].items() if st in (0, 999, 403, 404, 429, 451, 500, 502, 503, None)]
  seeds_ok = sum(1 for st in S["seed_status"].values() if st == 200 or st == "resumed")
  summ = stage.summary()
  summ.update({"register": REG, "seeds_total": len(SEEDS) + 1, "seeds_ok": seeds_ok, "seeds_failed": seeds_failed, "seed_status": S["seed_status"], "film_noise_dropped": stage.dropped.get("film-noise", 0), "rejects_file_totals": rej,
               "tag_pages_tried": S["tag_pages_tried"], "tag_links": S["tag_links"], "foundation_links": S.get("foundation_links", 0), "gnews_queries": S["gnews_queries"], "gnews_rows": S["gnews_rows"], "gnews_skipped_in_evidence": S["gnews_skipped_in_evidence"],
               "gnews_resolved": S["gnews_resolved"], "gnews_unresolved": S["gnews_unresolved"], "bing_rows": S["bing_rows"], "bing_web_rows": S["bing_web_rows"], "gdelt_calls": S["gdelt_calls"], "gdelt_rows": S["gdelt_rows"], "x_tweets": S["x_tweets"],
               "candidates": len(ROWS), "fetched": S["fetched"], "skipped_in_evidence": S["skipped_in_evidence"], "http_status_counts": S["http_status_counts"], "estimated_dates": est, "new_vs_evidence": new_vs_ev, "top_hosts": dict(sorted(hosts.items(), key=lambda kv: -kv[1])[:25]),
               "run_added": S["run_added"], "duration_s": round(time.time() - T0, 1), "blockers": S["blockers"], "mediaite_oped_kept": S["mediaite_oped_kept"], "mediaite_note": S["mediaite_note"], "samples": samples, "finished_at": L.NOW()})
  with open(os.path.join(L.STAGE, f"{CLS}.summary.json"), "w", encoding="utf-8") as f: json.dump(summ, f, indent=2, ensure_ascii=False)
  stage.log(f"done {json.dumps(summ, ensure_ascii=False)[:1800]}")

if __name__ == "__main__":
  main()
