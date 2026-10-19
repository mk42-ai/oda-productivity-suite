#!/usr/bin/env python3
"""collect_a.py — source class (a): full b.capital first-party archive (sitemap + listing pagination + known anchors).

Resumable: Stage skips canonical URLs already present in data/sweep/a.jsonl. Appends only. Output:
  data/sweep/a.jsonl, a.log, a.rejects.jsonl, a.summary.json
"""
from __future__ import annotations
import collections, json, os, re, sys, threading, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as sl

T0 = time.time()
TIME_BUDGET_S = 30 * 60
BASE = "https://b.capital"
MAX_WORKERS = 4
MIN_INTERVAL = 1.0 / 3.0  # ≤ 3 req/s to b.capital

CONTENT_PATH_RE = re.compile(r"^/(news-article|insights|why-we-invested|news-category|team|portfolio|companies|press)(/|$)")
ANCHORS = [
  "https://b.capital/", "https://b.capital/team/", "https://b.capital/team/eduardo-saverin/", "https://b.capital/team/raj-ganguly/",
  "https://b.capital/team/karan-mohla/", "https://b.capital/portfolio/", "https://b.capital/news-category/press/", "https://b.capital/news-and-insights/",
  "https://b.capital/insights/", "https://b.capital/why-we-invested/",
  "https://b.capital/insights/b-capital-group-closes-820mm-second-fund-to-support-global-innovation/",
  "https://b.capital/news-article/b-capital-closes-opportunities-fund-ii-at-750-million/",
  "https://b.capital/news-article/b-capital-closes-250m-early-stage-fund-dedicated-to-building-the-economy-of-the-future/",
  "https://b.capital/news-article/b-capital-closes-inaugural-healthcare-fund-commits-500-million-to-healthcare-innovation/",
  "https://b.capital/news-article/b-capital-highlights-ai-driven-investment-momentum-and-global-thought-leadership-at-2025-annual-general-meeting-and-ceo-summit/",
  "https://b.capital/why-we-invested/why-we-invested-in-solarsquare/",
  "https://b.capital/insights/b-capital-2022-growth-portfolio-nps-survey/",
]
LISTINGS = ["https://b.capital/news-and-insights/", "https://b.capital/news-category/press/", "https://b.capital/insights/",
            "https://b.capital/why-we-invested/", "https://b.capital/team/", "https://b.capital/portfolio/"]
PERSON_REG = {"/team/eduardo-saverin": "BCAP-002", "/team/raj-ganguly": "BCAP-003", "/team/karan-mohla": "BCAP-004"}

_lock = threading.Lock()
_last_req = [0.0]
def throttle():
  with _lock:
    wait = _last_req[0] + MIN_INTERVAL - time.time()
    if wait > 0: time.sleep(wait)
    _last_req[0] = time.time()

def over_budget() -> bool: return time.time() - T0 > TIME_BUDGET_S

def internal_links(body: str) -> list[str]:
  out = []
  for u in re.findall(r'href=["\'](https?://(?:www\.)?b\.capital/[^"\'#?\s]+|/[^"\'#?\s]+)', body or ""):
    if u.startswith("/"): u = BASE + u
    p = urllib.parse.urlsplit(u).path
    if CONTENT_PATH_RE.match(p) and not re.search(r"/(feed|page/\d+)/?$|\.(png|jpg|jpeg|svg|pdf|css|js)$", p):
      out.append(u if u.endswith("/") else u + "/")
  return sorted(set(out))

def main():
  stage = sl.Stage("a")
  stage.log(f"start; already have {stage.n} items")
  status_counts: collections.Counter = collections.Counter()
  blockers: list[str] = []
  discovered: dict[str, str | None] = {}  # url -> lastmod hint

  # 1. sitemap
  try:
    sm = sl.sitemap_urls(f"{BASE}/sitemap.xml")
    for e in sm:
      loc = e["loc"]
      if "b.capital" in loc and not re.search(r"\.(png|jpg|jpeg|svg|pdf)$", loc, re.I): discovered[loc] = e.get("lastmod")
    stage.log(f"sitemap: {len(sm)} entries")
    if not sm: blockers.append("sitemap.xml returned no entries")
  except Exception as ex:
    blockers.append(f"sitemap error: {ex}")

  # 1b. listing pages with pagination
  for lst in LISTINGS:
    seen_sets: list[frozenset] = []
    for page in range(1, 60):
      if over_budget(): break
      u = lst if page == 1 else f"{lst}page/{page}/"
      throttle(); st, body = sl.get(u, retries=1)
      status_counts[st] += 1
      if st != 200: break
      links = internal_links(body)
      fs = frozenset(links)
      if page > 1 and (not links or fs in seen_sets): break
      seen_sets.append(fs)
      new = 0
      for l in links:
        if l not in discovered: discovered[l] = None; new += 1
      stage.log(f"listing {u}: {len(links)} links, {new} new")
      if page > 1 and new == 0 and len(seen_sets) > 2: break
      if not re.search(rf'href=["\']{re.escape(lst)}(?:page/{page + 1}/|\?paged={page + 1})', body) and "page/" not in body: 
        # no visible pagination link -> probe next page once anyway (handled by 404 break)
        pass

  # 1c. RSS feeds give us extra hints (dates) for recent posts
  for feed in (f"{BASE}/feed/", f"{BASE}/news-category/press/feed/"):
    throttle(); st, body = sl.get(feed, retries=1); status_counts[st] += 1
    if st == 200:
      for it in sl.rss_items(body):
        u = it["url"]
        if u and "b.capital" in u:
          u = u if u.endswith("/") else u + "/"
          if u not in discovered or not discovered[u]: discovered[u] = it.get("published_at") or discovered.get(u)
      stage.log(f"feed {feed}: parsed")

  for a in ANCHORS: discovered.setdefault(a, None)
  stage.log(f"urls discovered: {len(discovered)}")

  # 3. fetch all
  todo = [(u, lm) for u, lm in discovered.items() if not stage.has(u)]
  stage.log(f"to fetch: {len(todo)} (skipping {len(discovered) - len(todo)} already staged)")
  fetched = [0]; added = [0]; real_date = [0]; est_date = [0]

  def work(u: str, lm: str | None):
    if over_budget(): return None
    throttle()
    it = sl.fetch_article("a", u, hint_date=lm, hint_outlet="B Capital", wayback=True)
    return u, lm, it

  def finalize(u: str, lm: str | None, it: dict | None):
    with _lock:
      fetched[0] += 1
      if it is None:
        status_counts["noitem"] += 1
        return
      status_counts[it.get("http_status")] += 1
      path = urllib.parse.urlsplit(u).path.rstrip("/")
      it["platform_glyph"] = "pr" if path.startswith("/news-article/") else "web"
      it["provider_receipt"] = True
      it["outlet"] = "B Capital"
      regs = set(it.get("registers") or []) | {"BCAP-001"}
      for pfx, r in PERSON_REG.items():
        if path.startswith(pfx): regs.add(r)
      it["registers"] = sorted(regs)
      if it.get("date_source") in ("rss", "given") and lm:
        # only the sitemap lastmod / feed date was available -> estimated
        it["published_at_estimated"] = True; it["date_source"] = "sitemap"
      if path.startswith(("/companies/", "/portfolio/")):
        it["companies"] = sl.companies_in(f"{it['title']}\n{it['text']}")
      if it.get("published_at_estimated"): est_date[0] += 1
      else: real_date[0] += 1
      if stage.add(it, keep_offsubject=True): added[0] += 1
      if fetched[0] % 25 == 0:
        stage.log(f"progress: fetched={fetched[0]}/{len(todo)} added={added[0]} items={stage.n} elapsed={int(time.time() - T0)}s")

  with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
    futs = [ex.submit(work, u, lm) for u, lm in todo]
    for f in as_completed(futs):
      try:
        r = f.result()
      except Exception as e:
        with _lock: status_counts["exception"] += 1; blockers.append(f"exception: {e}"[:200]); continue
      if r is None: continue
      finalize(*r)
  # 3b. Portfolio enrichment: /companies/<slug>/ 301s to /portfolio/?company=<slug>, which renders the SAME generic page for every company
  # (title "Portfolio - B Capital"). The per-company facts live in a JSON array embedded in /portfolio/. Emit one enriched item per
  # company at its real resolved URL (canonical keeps ?company=), dated by the companies-sitemap lastmod (estimated).
  comp_added = 0
  try:
    throttle(); st, body = sl.get(f"{BASE}/portfolio/", retries=1); status_counts[st] += 1
    m = re.search(r'\[\{"post_id":.*?\}\](?=[,;\s<)])', body or "", re.S)
    arr = json.loads(m.group(0)) if m else []
    lastmod = {re.sub(r".*/companies/([^/]+)/?$", r"\1", u): lm for u, lm in discovered.items() if "/companies/" in u}
    for c in arr:
      if over_budget(): break
      slug = c.get("slug") or ""; url = f"{BASE}/portfolio/?company={slug}"
      if not slug or stage.has(url): continue
      ttl = f"{c.get('title', slug)} — B Capital portfolio company"
      txt = (f"{c.get('title')} is a B Capital portfolio company. {c.get('txt') or ''} Industry: {c.get('industry') or 'n/a'}. Region: {c.get('tagplace') or 'n/a'}. "
             f"Status: {c.get('tagstate') or 'n/a'}. Website: {c.get('link_href') or 'n/a'}. B Capital profile: {BASE}{c.get('permalink') or '/portfolio/'}")
      it = sl.make_item(source_class="a", url=url, title=ttl, text=txt, outlet="B Capital", published_at=lastmod.get(slug), date_source="sitemap",
                        estimated=True, http_status=st, platform_glyph="web", provider_receipt=True,
                        extra={"outbound_links": [x for x in [sl.canonical(c.get("link_href") or "")] if x], "company_slug": slug, "company_name": c.get("title")})
      if it:
        it["registers"] = sorted(set(it["registers"]) | {"BCAP-001"})
        it["companies"] = sorted(set(it["companies"]) | set(sl.companies_in(c.get("title") or "")))
        if stage.add(it, keep_offsubject=True): comp_added += 1; est_date[0] += 1
    stage.log(f"portfolio enrichment: {len(arr)} companies in embedded JSON, {comp_added} enriched items added")
    if arr: blockers.append("note: /companies/<slug>/ pages 301 to the generic /portfolio/ page (identical text); enriched per-company items are at /portfolio/?company=<slug>")
  except Exception as ex:
    blockers.append(f"portfolio enrichment error: {ex}"[:200])

  if over_budget(): blockers.append("time budget (30 min) reached before all URLs were fetched")
  for k, v in list(status_counts.items()):
    if k in (0, 999, 403, 429) and v: blockers.append(f"http {k} x{v}")

  summ = stage.summary()
  # cumulative figures over the whole jsonl (resume runs only fetch the delta) + merged http counts from the previous summary
  allit = [json.loads(l) for l in open(stage.path, encoding="utf-8")]
  real_all = sum(1 for i in allit if not i.get("published_at_estimated")); est_all = len(allit) - real_all
  prev_counts: dict = {}
  sp = os.path.join(sl.STAGE, "a.summary.json")
  if os.path.exists(sp):
    try: prev_counts = json.load(open(sp)).get("http_status_counts_cumulative", {}) or json.load(open(sp)).get("http_status_counts", {})
    except Exception: prev_counts = {}
  cum = collections.Counter({str(k): v for k, v in prev_counts.items()}); cum.update({str(k): v for k, v in status_counts.items()})
  summ["http_status_counts_cumulative"] = dict(cum); summ["real_date_total"] = real_all; summ["estimated_date_total"] = est_all
  summ["note_companies_pages"] = "135 /companies/<slug>/ URLs resolve (301) to the generic /portfolio/ page and carry identical text; merge.py should prefer the enriched /portfolio/?company=<slug> items"
  summ.update({"urls_discovered": len(discovered), "fetched": fetched[0], "added_this_run": added[0] + comp_added,
               "http_status_counts": {str(k): v for k, v in status_counts.items()}, "real_date": real_date[0], "estimated_date": est_date[0],
               "duration_s": round(time.time() - T0, 1), "blockers": blockers[:20], "finished_at": sl.NOW()})
  with open(os.path.join(sl.STAGE, "a.summary.json"), "w", encoding="utf-8") as f: json.dump(summ, f, indent=2)
  stage.log("done " + json.dumps(summ))

if __name__ == "__main__":
  main()
