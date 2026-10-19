#!/usr/bin/env python3
"""collect_d — source class (d): video / podcast transcripts and episode pages (2026-10-19 sweep).

Resumable: Stage('d') skips canonical URLs already in data/sweep/d.jsonl; only appends. Hard wall-clock budget 30 minutes.
Outputs: data/sweep/d.jsonl, d.log, d.rejects.jsonl, d.summary.json.
"""
from __future__ import annotations
import json, os, re, sys, time, urllib.parse, html as _html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as L

T0 = time.time()
BUDGET = 30 * 60
SUBJECT_RE = re.compile(r"b[\s\.\-]?capital|eduardo\s+saverin|\bsaverin\b|raj\s+ganguly|\bganguly\b|karan\s+mohla|\bmohla\b", re.I)
stage = L.Stage("d")
S = {"videos": 0, "podcasts": 0, "transcripts_obtained": 0, "channels_scanned": 0, "itunes_rows": 0, "http_status_counts": {}, "blockers": [], "transcript_api_tried": 0}
VALID_GLYPHS = {"youtube", "podcast", "news", "web"}

def left() -> float: return BUDGET - (time.time() - T0)
def over() -> bool:
  if left() <= 0:
    if "time-budget-exhausted" not in S["blockers"]: S["blockers"].append("time-budget-exhausted"); stage.log("TIME BUDGET EXHAUSTED")
    return True
  return False
def hs(st): S["http_status_counts"][str(st)] = S["http_status_counts"].get(str(st), 0) + 1
def blocker(msg):
  if msg not in S["blockers"]: S["blockers"].append(msg)
def add(it, kind: str) -> bool:
  if not it: return False
  if it.get("platform_glyph") not in VALID_GLYPHS: it["platform_glyph"] = "web"
  ok = stage.add(it)
  if ok:
    if kind == "video": S["videos"] += 1
    elif kind == "podcast": S["podcasts"] += 1
    if it.get("transcript_obtained"): S["transcripts_obtained"] += 1
  return ok
def subject(*parts) -> bool: return bool(SUBJECT_RE.search(" ".join(p or "" for p in parts)))

# ------------------------------------------------------------------ 1. CNBC video pages --------------------------------------------
CNBC_SEEDS = [
  "https://www.cnbc.com/video/2024/03/26/investment-firm-b-capital-announces-its-new-750-million-opportunities-fund-co-ceo-discusses.html",
  "https://www.cnbc.com/video/2026/01/23/b-capital-pharma-biotech-undergoing-transformation-thanks-to-ai.html",
  "https://www.cnbc.com/video/2025/09/18/todays-generative-ai-could-be-the-worst-yet-b-capital-co-founder.html",
  "https://www.cnbc.com/video/2025/01/09/should-see-successful-tech-ipos-in-the-second-half-of-2025-b-capital.html",
  "https://www.cnbc.com/video/2026/06/17/b-capital-on-india-space-tech.html",
]
def _json_str(body: str, key: str) -> str | None:
  m = re.search(r'"%s"\s*:\s*"((?:[^"\\]|\\.)*)"' % re.escape(key), body)
  if not m: return None
  try: return json.loads('"' + m.group(1) + '"')
  except Exception: return m.group(1)

def cnbc_video(url: str, hint_title=None, hint_date=None, hint_desc=None):
  if stage.has(url): return
  st, body = L.get(url); hs(st)
  title = text = None; pub = None; dsrc = ""; transcript = None; author = None
  if st == 200 and body:
    title = L.meta(body, "og:title") or L.html_title(body)
    # VideoObject JSON-LD
    m = re.search(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', body, re.S)
    vo = None
    for mm in re.finditer(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', body, re.S):
      if "VideoObject" in mm.group(1):
        try: vo = json.loads(mm.group(1)); break
        except Exception: vo = None
    if isinstance(vo, dict):
      if isinstance(vo.get("@graph"), list): vo = next((g for g in vo["@graph"] if g.get("@type") == "VideoObject"), vo)
      title = vo.get("name") or title; text = vo.get("description") or ""
      pub = L.iso_date(vo.get("uploadDate") or vo.get("datePublished")); dsrc = "jsonld" if pub else ""
      transcript = vo.get("transcript") or None
    if not transcript: transcript = _json_str(body, "transcript") or _json_str(body, "closedCaption") or None
    if transcript and len(transcript) < 50: transcript = None
    desc = _json_str(body, "description") or L.meta(body, "og:description", "description")
    if not text: text = desc or ""
    if not pub: pub, dsrc = L.date_from_html(body)
    author = L.author_of(body)
  if not title: title = hint_title
  if not text: text = hint_desc or ""
  if not pub and hint_date: pub, dsrc = L.iso_date(hint_date), "api"
  if transcript: text = (text + "\n\nTRANSCRIPT:\n" + transcript).strip()
  if not title: stage.log(f"cnbc no title {url} status={st}"); return
  it = L.make_item(source_class="d", url=url, title=title, text=text, outlet="CNBC", author=author, published_at=pub, date_source=dsrc or "url",
                   http_status=st, platform_glyph="youtube", provider_receipt=False, extra={"media_kind": "video", "transcript_obtained": bool(transcript)})
  if it and st == 200 and body: it["outbound_links"] = L.links_in(body, url)[:25]
  add(it, "video")

def cnbc():
  stage.log("== CNBC video pages")
  for u in CNBC_SEEDS:
    if over(): return
    cnbc_video(u)
  # CNBC search (HTML page is JS rendered; the queryly API behind it returns JSON) + the combinedcms XML
  for u in ["https://www.cnbc.com/search/?query=%22B%20Capital%22&qsearchterm=%22B%20Capital%22",
            "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&keywords=B%20Capital"]:
    st, body = L.get(u, _skip_robots=True); hs(st)
    found = [x for x in re.findall(r'https://www\.cnbc\.com/video/20\d\d/\d\d/\d\d/[\w-]+\.html', body or "")]
    for it in L.rss_items(body or ""):
      if "/video/" in (it.get("url") or "") and subject(it["title"], it["excerpt"]): cnbc_video(it["url"], it["title"], it["published_at"], it["excerpt"])
    stage.log(f"cnbc search {u[:70]} status={st} bytes={len(body or '')} video-urls={len(set(found))}")
    if not body: blocker(f"cnbc search endpoint empty: {u.split('?')[0]}")
    for v in sorted(set(found)):
      if over(): return
      cnbc_video(v)
  # queryly JSON API (what the search page calls)
  seen = set()
  for q in ['"B Capital"', '"Raj Ganguly"', '"Eduardo Saverin"', '"Karan Mohla"', 'B Capital Ganguly', 'B Capital Saverin']:
    for start in (0, 50):
      if over(): return
      u = ("https://api.queryly.com/cnbc/json.aspx?queryly_key=31a35d40a9a64ab3&query=" + urllib.parse.quote(q) +
           f"&endindex={start}&batchsize=50&callback=&showfaceted=false&timezoneoffset=0&facetedfields=formats&facetedkey=formats%7C&facetedvalue=Video%7C&sort=date")
      st, body = L.get(u, _skip_robots=True); hs(st)
      if st != 200 or not body: stage.log(f"queryly {q} start={start} status={st}"); break
      try: j = json.loads(body)
      except Exception: break
      res = j.get("results") or []
      stage.log(f"queryly {q} start={start} total={j.get('metadata', {}).get('totalresults')} got={len(res)}")
      for r in res:
        url = r.get("cn:liveURL") or r.get("url"); t = r.get("cn:title") or ""; d = r.get("description") or r.get("summary") or ""
        if not url or url in seen or r.get("cn:type") != "cnbcvideo": continue
        seen.add(url)
        if not subject(t, d, url): continue
        cnbc_video(url, t, r.get("datePublished"), d)
      if len(res) < 50: break

# ------------------------------------------------------------------ 2. Bloomberg ---------------------------------------------------
def bloomberg():
  stage.log("== Bloomberg")
  u = "https://www.bloomberg.com/news/videos/2026-06-24/focused-on-ai-at-the-enterprise-level-ganguly-video"
  if not stage.has(u):
    st, body = L.get(u); hs(st)
    title = L.meta(body or "", "og:title") if st == 200 else None
    desc = L.meta(body or "", "og:description", "description") if st == 200 else None
    pub, dsrc = (L.date_from_html(body) if st == 200 and body else (None, ""))
    if st != 200: blocker(f"bloomberg.com video page HTTP {st} (paywall/bot wall) — og: tags unavailable, used URL slug")
    title = title or "Focused on AI at the Enterprise Level: B Capital's Raj Ganguly (Bloomberg Television video)"
    text = desc or "Bloomberg Television video interview: B Capital co-founder and co-CEO Raj Ganguly on being focused on AI at the enterprise level. (Paywalled page; metadata from URL slug.)"
    it = L.make_item(source_class="d", url=u, title=title, text=text, outlet="Bloomberg", published_at=pub or L.date_from_url(u), date_source=dsrc or "url", estimated=False,
                     http_status=st, platform_glyph="youtube", provider_receipt=False, extra={"media_kind": "video", "transcript_obtained": False})
    add(it, "video")
  youtube_video("https://www.youtube.com/watch?v=hp4Foxv0sdE", hint_date="2022-09-01", hint_outlet="Bloomberg Television")

# ------------------------------------------------------------------ YouTube helpers ------------------------------------------------
_CHAN_FEED: dict[str, list[dict]] = {}
_CHAN_ID: dict[str, str | None] = {}
def channel_id_for(page_url: str) -> str | None:
  if page_url in _CHAN_ID: return _CHAN_ID[page_url]
  cid = None
  st, body = L.get(page_url, _skip_robots=True); hs(st)
  if st == 200 and body:
    m = (re.search(r'"channelId":"(UC[\w-]+)"', body) or re.search(r'channel_id=(UC[\w-]+)', body) or re.search(r'<meta itemprop="channelId" content="(UC[\w-]+)"', body)
         or re.search(r'"externalId":"(UC[\w-]+)"', body) or re.search(r'youtube\.com/channel/(UC[\w-]+)', body))
    cid = m.group(1) if m else None
  _CHAN_ID[page_url] = cid
  return cid
def channel_feed(cid: str) -> list[dict]:
  if cid in _CHAN_FEED: return _CHAN_FEED[cid]
  st, body = L.get(f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}", _skip_robots=True); hs(st)
  rows = []
  if st == 200 and body:
    for m in re.finditer(r"<entry>(.*?)</entry>", body, re.S):
      e = m.group(1)
      g = lambda rx: (re.search(rx, e, re.S) or [None, ""])[1]
      rows.append({"video_id": g(r"<yt:videoId>([^<]+)"), "title": _html.unescape(g(r"<title>([^<]*)")), "published_at": g(r"<published>([^<]+)"),
                   "description": _html.unescape(g(r"<media:description>(.*?)</media:description>")), "channel": _html.unescape(g(r"<name>([^<]*)"))})
  _CHAN_FEED[cid] = rows; S["channels_scanned"] += 1
  return rows

def youtube_video(url: str, *, hint_date: str | None = None, hint_outlet: str | None = None, feed_row: dict | None = None, channel_id: str | None = None):
  if stage.has(url) or over(): return
  vid = (re.search(r"[?&]v=([\w-]{6,})", url) or re.search(r"youtu\.be/([\w-]{6,})", url) or [None, None])[1]
  url = f"https://www.youtube.com/watch?v={vid}" if vid else url
  if stage.has(url): return
  meta = None
  try: meta = L.youtube_meta(url)
  except Exception as e: stage.log(f"youtube_meta error {url}: {e}")
  S["transcript_api_tried"] += 1
  if not meta:
    so, ob = L.get("https://www.youtube.com/oembed?url=" + urllib.parse.quote(url, safe="") + "&format=json", _skip_robots=True); hs(so)
    meta = {"title": None, "channel": None, "published_at": None, "description": "", "transcript": None, "video_id": vid, "http_status": so}
    if so == 200:
      try: oj = json.loads(ob); meta["title"] = oj.get("title"); meta["channel"] = oj.get("author_name"); meta["author_url"] = oj.get("author_url")
      except Exception: pass
  else:
    hs(meta.get("http_status"))
  if meta.get("transcript") is None: blocker("youtube_transcript_api RequestBlocked / IP-blocked — transcripts unavailable for YouTube")
  title = (feed_row or {}).get("title") or meta.get("title"); chan = meta.get("channel") or (feed_row or {}).get("channel") or hint_outlet
  desc = meta.get("description") or (feed_row or {}).get("description") or ""
  pub = meta.get("published_at"); dsrc = "meta" if pub else ""; est = False
  if not pub and feed_row and feed_row.get("published_at"): pub, dsrc = L.iso_date(feed_row["published_at"]), "rss"
  if not pub and hint_date: pub, dsrc, est = L.iso_date(hint_date), "estimated", True
  if not pub and not feed_row:
    # channel atom feed: oEmbed author_url → channel page → channelId
    au = None
    try:
      so, ob = L.get("https://www.youtube.com/oembed?url=" + urllib.parse.quote(url, safe="") + "&format=json", _skip_robots=True); hs(so)
      if so == 200: au = json.loads(ob).get("author_url")
    except Exception: pass
    cid = channel_id or (channel_id_for(au) if au else None)
    if cid:
      for r in channel_feed(cid):
        if r["video_id"] == vid:
          pub, dsrc = L.iso_date(r["published_at"]), "rss"; desc = desc or r["description"]; title = title or r["title"]; break
  if not pub:
    pub = L.wayback_first_capture(url); dsrc, est = ("wayback", True) if pub else ("", False)
  if not title: stage.log(f"youtube no title {url} status={meta.get('http_status')}"); return
  text = meta.get("transcript") or desc or ""
  if not text or len(text) < 60: text = f"{text}\n{title} — {chan or 'YouTube'} — YouTube video".strip()
  if meta.get("transcript"): text = (desc + "\n\nTRANSCRIPT:\n" + meta["transcript"]).strip()
  it = L.make_item(source_class="d", url=url, title=title, text=text, outlet=chan or "YouTube", author=chan, published_at=pub, date_source=dsrc or "estimated", estimated=est or not pub,
                   http_status=meta.get("http_status"), platform_glyph="youtube", provider_receipt=False,
                   extra={"media_kind": "video", "transcript_obtained": bool(meta.get("transcript")), "video_id": vid, "channel": chan})
  add(it, "video")

# ------------------------------------------------------------------ 3. Podcasts / talks -------------------------------------------
def podcasts_seed():
  stage.log("== podcast / talk pages")
  pages = [
    ("https://www.tenoneten.com/podcast/raj-ganguly-b-capital", "podcast", "LA Venture", "podcast"),
    ("https://fintechleaders.substack.com/p/investing-in-transformational-technologies", "podcast", "Fintech Leaders", "podcast"),
    ("https://milkeninstitute.org/events/global-conference-2026/speakers/raj-ganguly", "web", "Milken Institute", "video"),
    ("https://milkeninstitute.org/events/global-conference-2023/speakers/raj-ganguly", "web", "Milken Institute", "video"),
  ]
  for u, glyph, outlet, kind in pages:
    if over() or stage.has(u): continue
    it = L.fetch_article("d", u, hint_outlet=outlet, glyph=glyph, wayback=True, hint_title=f"Raj Ganguly — {outlet}")
    if it:
      hs(it.get("http_status"))
      if it["date_source"] in ("wayback", "estimated", "unknown", ""): it["published_at_estimated"] = True
      it["media_kind"] = kind; it["transcript_obtained"] = False
      stage.log(f"page {u} status={it['http_status']} date={it['published_at']} ({it['date_source']}) text={len(it['text'])}")
      add(it, kind)
  yts = [("https://www.youtube.com/watch?v=Ear_HgkuCPQ", None, "IGF"), ("https://www.youtube.com/watch?v=eSBr39UU2k8", "2026-03-19", "Business Standard"),
         ("https://www.youtube.com/watch?v=6w9OEy-BOUA", None, "Indian Silicon Valley"), ("https://www.youtube.com/watch?v=d5HbrW6SDwk", None, "1947 Rise")]
  for u, hd, outlet in yts: youtube_video(u, hint_date=hd, hint_outlet=outlet)

# ------------------------------------------------------------------ 4. Discovery ---------------------------------------------------
def itunes():
  stage.log("== iTunes episode search")
  for term in ["B Capital", "Eduardo Saverin", "Raj Ganguly", "Karan Mohla", "B Capital Group venture"]:
    if over(): return
    u = f"https://itunes.apple.com/search?term={urllib.parse.quote(term)}&media=podcast&entity=podcastEpisode&limit=200"
    st, body = L.get(u, _skip_robots=True); hs(st)
    if st != 200: stage.log(f"itunes {term} status={st}"); blocker(f"itunes search HTTP {st}"); continue
    try: rows = json.loads(body).get("results", [])
    except Exception: rows = []
    S["itunes_rows"] += len(rows); kept = 0
    for r in rows:
      t = r.get("trackName") or ""; d = r.get("description") or r.get("shortDescription") or ""; coll = r.get("collectionName") or ""
      if not subject(t, d, coll): continue
      it = L.make_item(source_class="d", url=r.get("trackViewUrl") or r.get("episodeUrl") or "", title=t, text=d, outlet=coll, published_at=r.get("releaseDate"), date_source="api",
                       http_status=200, platform_glyph="podcast", provider_receipt=False,
                       extra={"media_kind": "podcast", "transcript_obtained": False, "episode_audio_url": r.get("episodeUrl"), "feed_url": r.get("feedUrl"), "duration_ms": r.get("trackTimeMillis")})
      if add(it, "podcast"): kept += 1
    stage.log(f"itunes '{term}' rows={len(rows)} kept={kept}")

def itunes_feed_url(name: str) -> str | None:
  st, body = L.get(f"https://itunes.apple.com/search?term={urllib.parse.quote(name)}&media=podcast&entity=podcast&limit=3", _skip_robots=True); hs(st)
  if st != 200: return None
  try:
    for r in json.loads(body).get("results", []):
      if r.get("feedUrl"): return r["feedUrl"]
  except Exception: pass
  return None

def podcast_feeds():
  stage.log("== podcast RSS feeds")
  feeds = {"LA Venture": "https://laventure.libsyn.com/rss", "Fintech Leaders": "https://fintechleaders.substack.com/feed"}
  for name in ["The Twenty Minute VC", "Invest Like the Best", "Masters of Scale", "The Logan Bartlett Show", "Village Global Venture Stories", "Business Standard Podcast", "Moneycontrol Podcast"]:
    if over(): break
    fu = itunes_feed_url(name)
    if fu: feeds[name] = fu
    else: stage.log(f"feed not found via itunes: {name}")
  for name, fu in feeds.items():
    if over(): return
    st, body = L.get(fu, _skip_robots=True); hs(st)
    rows = L.rss_items(body or "") if st == 200 else []
    kept = 0
    for r in rows:
      if not subject(r["title"], r["excerpt"]): continue
      it = L.make_item(source_class="d", url=r["url"], title=r["title"], text=r["excerpt"], outlet=name, author=r.get("author") or None, published_at=r["published_at"], date_source="rss",
                       http_status=200, platform_glyph="podcast", provider_receipt=False, extra={"media_kind": "podcast", "transcript_obtained": False, "feed_url": fu})
      if add(it, "podcast"): kept += 1
    stage.log(f"feed {name} {fu[:60]} status={st} episodes={len(rows)} kept={kept}")

YT_HANDLES = ["@markets", "@CNBCtelevision", "@CNBCi", "@BusinessStandard", "@Moneycontrol", "@ETNow", "@YourStoryTV", "@MilkenInstitute", "@WebSummit", "@money2020", "@BCG", "@TiEGlobal", "@inc42media", "@IndianSiliconValley"]
def youtube_channels():
  stage.log("== YouTube channel Atom feeds")
  for h in YT_HANDLES:
    if over(): return
    cid = channel_id_for(f"https://www.youtube.com/{h}")
    if not cid: stage.log(f"channel id not found for {h}"); continue
    rows = channel_feed(cid); kept = 0
    for r in rows:
      if subject(r["title"], r["description"]):
        before = stage.n
        youtube_video(f"https://www.youtube.com/watch?v={r['video_id']}", feed_row=r, channel_id=cid)
        kept += stage.n - before
    stage.log(f"channel {h} {cid} videos={len(rows)} kept={kept}")

def gnews():
  stage.log("== Google News RSS discovery")
  for q in ['"B Capital" podcast', '"Raj Ganguly" podcast OR interview OR CNBC', '"Karan Mohla" podcast OR interview', '"Eduardo Saverin" interview']:
    if over(): return
    rows = L.google_news_search(q); kept = 0
    for r in rows[:25]:
      if over(): break
      if not subject(r["title"], r["excerpt"]): continue
      real = L.resolve_gnews(r["url"]) if "news.google.com" in r["url"] else r["url"]
      if not real: continue
      if stage.has(real): continue
      host = L.host_of(real)
      if "youtube.com" in host or "youtu.be" in host: youtube_video(real, hint_date=r["published_at"], hint_outlet=r["publisher"]); continue
      glyph = "podcast" if re.search(r"podcasts\.apple|spotify|substack|libsyn|simplecast|megaphone|buzzsprout|anchor\.fm|podbean|transistor", host) else L.glyph_for(real, "news")
      if glyph not in VALID_GLYPHS: glyph = "web"
      it = L.fetch_article("d", real, hint_title=r["title"], hint_date=r["published_at"], hint_outlet=r["publisher"], hint_excerpt=r["excerpt"], glyph=glyph)
      if it:
        hs(it.get("http_status")); it["media_kind"] = "podcast" if glyph == "podcast" else "article"; it["transcript_obtained"] = False
        if add(it, "podcast" if glyph == "podcast" else "other"): kept += 1
    stage.log(f"gnews '{q}' rows={len(rows)} kept={kept}")

# ------------------------------------------------------------------ main -----------------------------------------------------------
def main():
  stage.log(f"start collect_d resume_items={stage.n} budget={BUDGET}s")
  for step in (cnbc, bloomberg, podcasts_seed, itunes, podcast_feeds, youtube_channels, gnews):
    if over(): break
    try: step()
    except Exception as e: stage.log(f"step {step.__name__} failed: {type(e).__name__}: {e}"); blocker(f"{step.__name__}: {type(e).__name__}")
  # totals over the whole file (incl. resumed rows)
  vids = pods = tr = 0
  for line in open(stage.path, encoding="utf-8"):
    try: d = json.loads(line)
    except Exception: continue
    if d.get("platform_glyph") == "youtube" or d.get("media_kind") == "video": vids += 1
    elif d.get("platform_glyph") == "podcast" or d.get("media_kind") == "podcast": pods += 1
    if d.get("transcript_obtained"): tr += 1
  summ = stage.summary()
  summ.update({"videos": vids, "podcasts": pods, "transcripts_obtained": tr, "channels_scanned": S["channels_scanned"], "itunes_rows": S["itunes_rows"],
               "http_status_counts": S["http_status_counts"], "duration_s": round(time.time() - T0, 1), "blockers": S["blockers"], "run_added": {"videos": S["videos"], "podcasts": S["podcasts"]}, "finished_at": L.NOW()})
  with open(os.path.join(L.STAGE, "d.summary.json"), "w", encoding="utf-8") as f: json.dump(summ, f, indent=2, ensure_ascii=False)
  stage.log(f"done {json.dumps(summ)}")

if __name__ == "__main__":
  main()
