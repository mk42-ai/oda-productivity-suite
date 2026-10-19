#!/usr/bin/env python3
"""collect_c.py — source class (c) PRESS BY SUBJECT for the 2026-10-19 mass data sweep.

Discovery (serial per source, each source in its own thread):
  1. curated seed URLs (Bloomberg / Forbes / Reuters / WSJ / Axios / …) fetched directly
  2. outlet site-search / tag / author pages for the four subjects (paginated ≤5 pages, ≤40 candidates per outlet per subject)
  3. Bing News RSS (7 queries × 4 markets)
  4. Google News RSS finer windows (quarterly for Raj Ganguly / Karan Mohla queries, half-year for B Capital Group / Saverin)
  5. GDELT DOC 2.0 artlist, yearly windows 2017→2026, 7 s between calls
Fetch stage: ThreadPoolExecutor-style pool of 8 workers fed from a priority queue → sweeplib.fetch_article → Stage('c').add.
Resumable: canonical URLs already in data/sweep/c.jsonl / c.rejects.jsonl are skipped. Append-only. Hard wall-clock budget 34 min.
"""
from __future__ import annotations
import collections, datetime as dt, html, json, os, queue, re, sys, threading, time, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as L

T0 = time.time()
DISCOVERY_BUDGET = int(os.environ.get("C_DISCOVERY_BUDGET", 32 * 60))          # discovery loops stop here
HARD_BUDGET = int(os.environ.get("C_HARD_BUDGET", 34 * 60))               # fetch pool drained / cut here
def elapsed(): return time.time() - T0
def discovery_over(): return elapsed() > DISCOVERY_BUDGET
def hard_over(): return elapsed() > HARD_BUDGET

TODAY = "2026-10-19"
SUBJECTS = ["B Capital", "Eduardo Saverin", "Raj Ganguly", "Karan Mohla"]
stage = L.Stage("c")

# ---------------------------------------------------------------- http status accounting -------------------------------------------
status_counts: collections.Counter = collections.Counter()
_orig_get = L.get
def counted_get(url, *a, **k):
  if url.startswith("http://"): url = "https://" + url[7:]          # outbound :80 is blocked in this pod (SYN never answered)
  k.setdefault("timeout", 15); k.setdefault("retries", 1)
  st, body = _orig_get(url, *a, **k)
  if not url.endswith("/robots.txt"): status_counts[str(st)] += 1
  return st, body
L.get = counted_get

# ---------------------------------------------------------------- google throttle (≤ 1 request / 0.5 s) -----------------------------
_glock = threading.Lock(); _glast = [0.0]
def gthrottle():
  with _glock:
    w = _glast[0] + 0.5 - time.time()
    if w > 0: time.sleep(w)
    _glast[0] = time.time()

# ---------------------------------------------------------------- resume state -------------------------------------------------------
attempted: set[str] = set()
rej_path = os.path.join(L.STAGE, "c.rejects.jsonl")
if os.path.exists(rej_path):
  for line in open(rej_path, encoding="utf-8"):
    try: attempted.add(json.loads(line)["url"])
    except Exception: pass
attempted |= set(stage.seen)
_alock = threading.Lock()
def claim(url: str) -> bool:
  c = L.canonical(url) or url
  with _alock:
    if c in attempted: return False
    attempted.add(c); return True

# ---------------------------------------------------------------- fetch pool ---------------------------------------------------------
Q: "queue.PriorityQueue" = queue.PriorityQueue()
_seq = [0]; _seqlock = threading.Lock()
counters = collections.Counter()
def enqueue(prio: int, src: str, url: str, **hints):
  if not url or hard_over(): return
  if url.startswith("http://"): url = "https://" + url[7:]
  with _seqlock:
    _seq[0] += 1; n = _seq[0]
  Q.put((prio, n, {"src": src, "url": url, **hints}))
  counters[f"queued_{src}"] += 1

def process(t: dict):
  src, url = t["src"], t["url"]
  if src == "gnews":
    pub = L.decode_gnews(url)
    if not (pub and pub.startswith("http") and "news.google.com" not in pub):
      gthrottle(); pub = L.resolve_gnews(url)
    if not pub or "news.google.com" in pub:
      counters["gnews_unresolved"] += 1
      if not claim(url): return
      it = L.make_item(source_class="c", url=url, title=t.get("title"), text=t.get("excerpt"), outlet=t.get("outlet"), published_at=t.get("date"), date_source="rss", http_status=None)
      if stage.add(it): counters[f"added_{src}"] += 1
      return
    url = pub
  if not claim(url): counters["skipped_seen"] += 1; return
  it = L.fetch_article("c", url, hint_title=t.get("title"), hint_date=t.get("date"), hint_outlet=t.get("outlet") or L.host_of(url), hint_excerpt=t.get("excerpt"))
  if it and src == "seed" and it.get("http_status") in (200, 401, 402, 403, 404, 429): counters["seeds_fetched"] += 1
  if stage.add(it):
    counters[f"added_{src}"] += 1
    if src == "seed": counters["seeds_ok"] += 1
  elif it is None: counters[f"noitem_{src}"] += 1

processed = [0]; _plock = threading.Lock()
def worker():
  while True:
    try: prio, n, t = Q.get(timeout=2)
    except queue.Empty:
      if STOP.is_set(): return
      continue
    try:
      if not hard_over(): process(t)
    except Exception as e:
      counters["worker_errors"] += 1
      if counters["worker_errors"] <= 20: stage.log(f"worker error {type(e).__name__}: {str(e)[:120]} on {t.get('url','')[:120]}")
    finally:
      Q.task_done()
      with _plock:
        processed[0] += 1
        if processed[0] % 50 == 0:
          stage.log(f"processed={processed[0]} items={stage.n} queue={Q.qsize()} dropped={dict(stage.dropped)} elapsed={int(elapsed())}s")
STOP = threading.Event()
workers = [threading.Thread(target=worker, daemon=True, name=f"w{i}") for i in range(8)]
for w in workers: w.start()

# ---------------------------------------------------------------- 1. SEEDS -----------------------------------------------------------
SEEDS = """https://www.bloomberg.com/news/articles/2023-01-19/eduardo-saverin-s-b-capital-raises-2-1-billion
https://www.bloomberg.com/news/articles/2021-11-04/eduardo-saverin-s-b-capital-eyes-2-5-billion-for-newest-fund
https://www.bloomberg.com/news/articles/2022-07-19/eduardo-saverin-s-b-capital-raises-first-early-stage-vc-fund
https://www.bloomberg.com/news/articles/2020-06-30/facebook-co-founder-saverin-s-venture-firm-raises-820-million
https://www.bloomberg.com/news/articles/2018-02-09/facebook-co-founder-saverin-s-b-capital-closes-360-million-fund
https://www.forbes.com/sites/pamelaambler/2019/10/13/from-silicon-valley-to-singapore-eduardo-saverin-and-vc-partners-approach-to-accelerate-innovation/
https://www.forbes.com/sites/alexkonrad/2019/03/19/life-after-facebook--the-untold-story-of-billionaire-eduardo-saverins-highly-networked-venture-firm/
https://www.forbes.com/sites/jonathanburgos/2022/05/02/facebook-billionaire-eduardo-saverins-b-capital-halts-spac-plans-amid-market-volatility/
https://www.forbes.com/sites/jonathanburgos/2022/07/20/facebook-billionaire-eduardo-saverins-b-capital-raises-250-million-for-its-early-stage-vc-fund/
https://www.forbes.com/sites/yessarrosendar/2024/03/20/billionaire-eduardo-saverins-b-capital-raises-750-million-to-fund-late-stage-startups/
https://www.forbes.com/sites/yessarrosendar/2026/07/08/billionaire-eduardo-saverin-backed-b-capital-raises-500-million-to-fund-early-stage-startups/
https://www.reuters.com/business/finance/facebook-co-founder-saverins-b-capital-raises-750-mln-new-opportunities-fund-2024-03-19/
https://www.wsj.com/pro/venture-capital/b-capital-unveils-500-million-early-stage-fund-as-startup-valuations-soar-cd73bc9e
https://www.axios.com/2026/07/23/vc-job-chief-ai-officer
https://finance.yahoo.com/technology/ai/articles/vc-job-chief-ai-officer-154824396.html
https://peforum.org/b-capital-closes-oversubscribed-ascent-fund-iii-at-500-million-hard-cap/
https://mediabrief.com/b-capital-closes-ascent-fund-iii-at-500-million-hard-cap/
https://www.citybiz.co/article/869878/b-capital-closes-500-million-ascent-fund-iii-to-back-early-stage-ai-and-technology-companies/
https://fundmomentum.vc/blog/b-capital-ascent-fund-iii-500m-hard-cap-early-stage-ai-2026
https://kr-asia.com/b-capital-group-closes-its-second-fund-at-usd-820-million
https://yourstory.com/2024/03/b-capital-raises-750m-for-its-second-fund-opportunities-fund-ii
https://www.businessinsider.com/b-capital-vc-fund-set-up-by-facebook-cofounder-raises-fresh-capital-2020-6
https://www.venturecapitaljournal.com/growth-fund-led-by-facebook-co-founder-raises-2-1bn/
https://www.moneycontrol.com/news/business/startup/india-is-becoming-an-innovation-economy-b-capitals-raj-ganguly-9902781.html
https://labusinessjournal.com/special-editions/la500/2023-la500/finance-2023/la500-2023-raj-ganguly/
https://labusinessjournal.com/la500-2024/banks-2024/la500-2024-raj-ganguly/
https://dot.la/b-capital-group-raj-ganguly-2657710464.html
https://www.caproasia.com/2025/11/11/facebook-co-founder-eduardo-saverin-9-billion-b-capital-raised-307-million-for-early-stage-fund-b-capital-ascent-fund-iii/
https://india.entrepreneur.com/finance/being-a-value-added-partner-to-founders-and-making/456364
https://kr-asia.com/what-it-takes-for-indian-startups-to-go-global-qa-with-karan-mohla-of-chiratae-ventures
https://sg.news.yahoo.com/eduardo-saverin-b-capital-set-ramp-asia-deals-030807696.html""".split()
def slug_title(u: str) -> str:
  seg = [s for s in urllib.parse.urlsplit(u).path.split("/") if s and not re.fullmatch(r"[\d\-]+|sites|news|articles|article|business|finance|pro|venture-capital|blog|technology|ai|startup|special-editions", s)]
  s = seg[-1] if seg else u
  s = re.sub(r"\.html?$|-\d{6,}$|-[0-9a-f]{8}$|^\d+$", "", s)
  return re.sub(r"[-_]+", " ", s).strip().capitalize() or u
SEED_EXCERPTS = {
  "life-after-facebook": "Forbes cover story by Alex Konrad on Eduardo Saverin and B Capital Group, the venture firm he co-founded with Raj Ganguly.",
  "vc-job-chief-ai-officer": "Axios Pro Rata: B Capital names a chief AI officer — venture firms are creating the role; B Capital, Eduardo Saverin's firm, among them.",
}
def run_seeds():
  for u in SEEDS:
    ex = next((v for k, v in SEED_EXCERPTS.items() if k in u), None)
    enqueue(0, "seed", u, outlet=L.host_of(u), title=slug_title(u), date=L.date_from_url(u), excerpt=ex)
  stage.log(f"seeds queued: {len(SEEDS)}")

# ---------------------------------------------------------------- 2. OUTLET SEARCH / TAG PAGES ----------------------------------------
OUTLETS = [
  ("techcrunch.com", "https://techcrunch.com/?s={q}", "wp"), ("techcrunch.com", "https://techcrunch.com/tag/{slug}/", "wp"),
  ("yourstory.com", "https://yourstory.com/search?q={q}", "query"), ("yourstory.com", "https://yourstory.com/tag/{slug}", "none"),
  ("inc42.com", "https://inc42.com/?s={q}", "wp"), ("entrackr.com", "https://entrackr.com/?s={q}", "wp"),
  ("economictimes.indiatimes.com", "https://economictimes.indiatimes.com/topic/{slug}", "none"),
  ("livemint.com", "https://www.livemint.com/Search/Link/Keyword/{name}", "none"),
  ("business-standard.com", "https://www.business-standard.com/topic/{slug}", "pathpage"),
  ("moneycontrol.com", "https://www.moneycontrol.com/news/tags/{slug}.html", "mc"),
  ("dealstreetasia.com", "https://www.dealstreetasia.com/?s={q}", "wp"), ("vccircle.com", "https://www.vccircle.com/?s={q}", "query"),
  ("kr-asia.com", "https://kr-asia.com/?s={q}", "wp"), ("businesstimes.com.sg", "https://www.businesstimes.com.sg/search?query={q}", "query"),
  ("channelnewsasia.com", "https://www.channelnewsasia.com/search?q={q}", "query"), ("variety.com", "https://variety.com/?s={q}", "wp"),
  ("scmp.com", "https://www.scmp.com/search/{q}", "none"), ("asiaone.com", "https://www.asiaone.com/search/{q}", "query"),
  ("forbes.com", "https://www.forbes.com/search/?q={q}", "none"), ("dot.la", "https://dot.la/?s={q}", "wp"),
  ("labusinessjournal.com", "https://labusinessjournal.com/?s={q}", "wp"), ("caproasia.com", "https://www.caproasia.com/?s={q}", "wp"),
  ("mediabrief.com", "https://mediabrief.com/?s={q}", "wp"), ("citybiz.co", "https://www.citybiz.co/?s={q}", "wp"),
]
ARTICLE_PATH_RE = re.compile(r"/20[12]\d/|/news/|/article|/story|/stories/|-\d{5,}|/companies/|/startups/|/markets/|/technology/|/sites/[^/]+/20|/articleshow/|\.cms$|/finance/|/business/", re.I)
NONART_RE = re.compile(r"/(tag|tags|topic|topics|author|authors|category|search|page|wp-content|wp-json|feed|about|contact|privacy|terms|subscribe|login|newsletter|events|videos?|photos?|podcasts?|live-coverage|indian-indices|global-indices|definition|rss|sitemap)(/|$|\?)|privacy-policy|\?s=|/search\?|#|\.(jpg|jpeg|png|gif|webp|pdf|xml)(\?|$)", re.I)
IMG_HOST_RE = re.compile(r"^(images?|img|static|cdn|assets|media)\d*\.", re.I)
blockers: list[dict] = []; outlet_pages_tried = [0]; outlet_pages_blocked = [0]
def page_url(base: str, kind: str, n: int) -> str | None:
  if n == 1: return base
  if kind == "wp":
    p = urllib.parse.urlsplit(base)
    if p.query: return urllib.parse.urlunsplit((p.scheme, p.netloc, f"/page/{n}/", p.query, ""))
    return base.rstrip("/") + f"/page/{n}/"
  if kind == "query": return base + f"&page={n}"
  if kind == "pathpage": return base.rstrip("/") + f"/page-{n}"
  if kind == "mc": return base.replace(".html", f".html/page-{n}/")
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
    if slug.count("-") < 4 and not re.search(r"\d{5,}", path): continue     # section pages, not stories
    c = L.canonical(u)
    if c and c not in out: out.append(c)
  return out
def run_outlets(subjects: list[str]):
  for subj in subjects:
    q = urllib.parse.quote(subj); slug = subj.lower().replace(" ", "-"); name = urllib.parse.quote(subj)
    for host, tmpl, kind in OUTLETS:
      if discovery_over(): return
      if "{slug}" in tmpl and subj != "B Capital" and host == "techcrunch.com": continue   # techcrunch tag only for b-capital
      base = tmpl.format(q=q, slug=slug, name=name); seen: list[str] = []; n_cand = 0
      for pg in range(1, 6):
        u = page_url(base, kind, pg)
        if not u: break
        outlet_pages_tried[0] += 1
        st, body = L.get(u, timeout=20, retries=0)
        if st != 200:
          outlet_pages_blocked[0] += 1
          if pg == 1: blockers.append({"outlet": host, "url": u, "status": st, "subject": subj})
          break
        links = [l for l in article_links(body, u) if l not in seen]
        if not links: break
        seen.extend(links)
        for l in links:
          if n_cand >= 40: break
          if stage.has(l): continue
          n_cand += 1; enqueue(1, "outlet", l, outlet=host, title=slug_title(l), date=L.date_from_url(l))
        if n_cand >= 40: break
        time.sleep(0.5)
      counters["outlet_candidates"] += n_cand
    stage.log(f"outlet pages done for {subj}: tried={outlet_pages_tried[0]} blocked={outlet_pages_blocked[0]} candidates={counters['outlet_candidates']}")

# ---------------------------------------------------------------- 3. BING NEWS RSS -----------------------------------------------------
BING_Q = ['"B Capital" venture', '"B Capital Group"', '"Eduardo Saverin"', '"Raj Ganguly"', '"Karan Mohla"', '"B Capital" fund', '"B Capital" Series']
bing_rows = [0]
def run_bing():
  for q in BING_Q:
    for mkt in ("en-US", "en-IN", "en-SG", "en-GB"):
      if discovery_over(): return
      u = f"https://www.bing.com/news/search?q={urllib.parse.quote(q)}&format=rss&count=100&mkt={mkt}"
      st, body = L.get(u, _skip_robots=True)
      if st != 200: blockers.append({"outlet": "bing-news-rss", "url": u, "status": st}); time.sleep(2); continue
      rows = L.rss_items(body); bing_rows[0] += len(rows)
      for r in rows:
        if r["url"] and not stage.has(r["url"]):
          enqueue(1, "bing", r["url"], title=r["title"], date=r["published_at"], outlet=r["publisher"] or L.host_of(r["url"]), excerpt=r["excerpt"])
      time.sleep(1.0)
  stage.log(f"bing done: rows={bing_rows[0]}")

# ---------------------------------------------------------------- 4. GOOGLE NEWS RSS finer windows ------------------------------------
def windows(start: str, months: int) -> list[tuple[str, str]]:
  out = []; y, m = int(start[:4]), int(start[5:7]); end = dt.date(2026, 10, 19)
  while True:
    a = dt.date(y, m, 1); m2 = m + months; y2 = y + (m2 - 1) // 12; m2 = (m2 - 1) % 12 + 1
    b = dt.date(y2, m2, 1)
    if a >= end: break
    out.append((a.isoformat(), min(b, end + dt.timedelta(days=1)).isoformat())); y, m = y2, m2
  return out
GN_QUARTERLY = ['"Raj Ganguly"', '"Karan Mohla"', '"Raj Ganguly" B Capital', '"Karan Mohla" B Capital', '"Karan Mohla" Chiratae', '"Raj Ganguly" Bain Capital', '"Raj Ganguly" Velos']
GN_HALF = ['"B Capital Group"', '"Eduardo Saverin" B Capital']
gnews_rows = [0]; gnews_calls = [0]
def run_gnews():
  plan = [(q, w, lang, gl) for q in GN_QUARTERLY for w in windows("2015-01-01", 3) for lang, gl in (("en-US", "US"), ("en-IN", "IN"))]
  plan += [(q, w, lang, gl) for q in GN_HALF for w in windows("2015-01-01", 6) for lang, gl in (("en-US", "US"), ("en-IN", "IN"))]
  stage.log(f"gnews plan: {len(plan)} requests")
  for i, (q, (a, b), lang, gl) in enumerate(plan):
    if discovery_over(): stage.log(f"gnews stopped at {i}/{len(plan)} (budget)"); return
    gthrottle(); gnews_calls[0] += 1
    rows = L.google_news_search(q, after=a, before=b, lang=lang, gl=gl)
    gnews_rows[0] += len(rows)
    for r in rows:
      enqueue(2, "gnews", r["url"], title=re.sub(r"\s+-\s+[^-]+$", "", r["title"]), date=r["published_at"], outlet=r["publisher"] or L.host_of(r["publisher_url"] or ""), excerpt=r["excerpt"])
    if i % 50 == 49: stage.log(f"gnews {i+1}/{len(plan)} rows={gnews_rows[0]} queue={Q.qsize()}")
  stage.log(f"gnews done: calls={gnews_calls[0]} rows={gnews_rows[0]}")

# ---------------------------------------------------------------- 5. GDELT DOC 2.0 -------------------------------------------------
gdelt_rows = [0]
def run_gdelt():
  for name in ['"Eduardo Saverin"', '"B Capital"', '"Raj Ganguly"', '"Karan Mohla"']:
    for y in range(2017, 2027):
      if discovery_over(): return
      a = f"{y}0101000000"; b = f"{y+1}0101000000" if y < 2026 else "20261020000000"
      q = name if name != '"B Capital"' else '"B Capital" (venture OR fund OR Saverin OR startup)'
      u = f"https://api.gdeltproject.org/api/v2/doc/doc?query={urllib.parse.quote(q)}&mode=artlist&maxrecords=250&format=json&startdatetime={a}&enddatetime={b}"
      st, body = L.get(u, timeout=40, retries=1, _skip_robots=True)
      if st == 200:
        try: arts = json.loads(body).get("articles", [])
        except Exception: arts = []
        gdelt_rows[0] += len(arts)
        for ar in arts:
          if ar.get("url") and not stage.has(ar["url"]):
            enqueue(2, "gdelt", ar["url"], title=ar.get("title"), date=ar.get("seendate"), outlet=ar.get("domain"))
      else:
        blockers.append({"outlet": "gdelt", "url": u[:160], "status": st})
      time.sleep(7)
  stage.log(f"gdelt done: rows={gdelt_rows[0]}")

# ---------------------------------------------------------------- main ---------------------------------------------------------------
def main():
  stage.log(f"collect_c start; resume: items={stage.n} attempted={len(attempted)}")
  run_seeds()
  threads = [threading.Thread(target=f, args=a, daemon=True, name=n) for f, a, n in (
    (run_outlets, (SUBJECTS[:2],), "outlets-1"), (run_outlets, (SUBJECTS[2:],), "outlets-2"), (run_bing, (), "bing"), (run_gnews, (), "gnews"), (run_gdelt, (), "gdelt"))]
  for t in threads: t.start()
  while any(t.is_alive() for t in threads) and not hard_over():
    time.sleep(5)
  stage.log(f"discovery finished/cut at {int(elapsed())}s; queue={Q.qsize()} items={stage.n}")
  while Q.qsize() > 0 and not hard_over(): time.sleep(2)
  STOP.set()
  for w in workers: w.join(timeout=max(1, HARD_BUDGET + 60 - elapsed()))
  stage.f.flush()
  summ = stage.summary()
  summ.update({
    "seeds_total": len(SEEDS), "seeds_ok": counters["seeds_ok"], "seeds_fetched": counters["seeds_fetched"],
    "outlet_pages_tried": outlet_pages_tried[0], "outlet_pages_blocked": outlet_pages_blocked[0], "outlet_candidates": counters["outlet_candidates"],
    "bing_rows": bing_rows[0], "gnews_rows": gnews_rows[0], "gnews_calls": gnews_calls[0], "gdelt_rows": gdelt_rows[0],
    "http_status_counts": dict(status_counts), "duration_s": int(elapsed()), "processed": processed[0], "queue_left": Q.qsize(),
    "counters": dict(counters), "blockers": blockers, "finished_at": L.NOW(),
  })
  # register counts over the whole c.jsonl
  regs = collections.Counter()
  for line in open(stage.path, encoding="utf-8"):
    try:
      for r in json.loads(line).get("registers", []): regs[r] += 1
    except Exception: pass
  summ["items_by_register"] = dict(regs)
  summ["seeds_in_corpus"] = sum(1 for u in SEEDS if (L.canonical(u) or u) in stage.seen)   # counts seeds landed in this or an earlier (resumed) run
  json.dump(summ, open(os.path.join(L.STAGE, "c.summary.json"), "w"), indent=2, ensure_ascii=False)
  stage.log(f"DONE items={stage.n} by_register={dict(regs)} dropped={dict(stage.dropped)} status={dict(status_counts)} duration={int(elapsed())}s")
  os._exit(0)

if __name__ == "__main__":
  main()
