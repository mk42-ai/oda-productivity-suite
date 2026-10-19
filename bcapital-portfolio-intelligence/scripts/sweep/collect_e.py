#!/usr/bin/env python3
"""collect_e.py — source class (e): PUBLIC LinkedIn posts/articles + X posts for the four B Capital subjects (2026-10-19 sweep).

No login, public permalinks only. robots.txt is respected for LinkedIn post pages (sweeplib returns 999 → we fall back to the
search-result title/snippet + activity-id date). _skip_robots=True is used ONLY for public search/RSS/oEmbed/syndication endpoints.
Resumable: Stage dedups by canonical URL; re-running only appends new items. Hard wall-clock budget 28 min.

Outputs: data/sweep/e.jsonl (append-only), e.log, e.rejects.jsonl, e.summary.json
"""
from __future__ import annotations
import base64, collections, datetime as dt, json, os, re, sys, time, urllib.parse, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sweeplib import (STAGE, UA, Stage, canonical, fetch_article, get, google_news_search, html, html_title, iso_date, make_item,
                      meta, registers_for, resolve_gnews, strip_html)

T0 = time.time()
BUDGET_S = 28 * 60
CLS = "e"
stage = Stage(CLS)
VERIF = {"verification": "Unverified source"}

# ------------------------------------------------------------------ subjects -----------------------------------------------------------
X_HANDLES = {"rajganguly_": "BCAP-003", "esaverin": "BCAP-002", "BCapitalGroup": "BCAP-001", "karanmohla": "BCAP-004"}
LI_HANDLES = {"rajganguly": "BCAP-003", "karan-mohla-153998": "BCAP-004", "karanmohla": "BCAP-004", "eduardosaverin": "BCAP-002", "saverin": "BCAP-002",
              "b-capital-group": "BCAP-001", "bcapitalgroup": "BCAP-001", "b-capital": "BCAP-001"}
def reg_for_handle(h: str | None) -> str | None:
  if not h: return None
  h = h.lower().strip("@")
  return X_HANDLES.get({k.lower(): k for k in X_HANDLES}.get(h, ""), None) or LI_HANDLES.get(h)

# ------------------------------------------------------------------ bookkeeping ---------------------------------------------------------
status_counts: collections.Counter = collections.Counter()
endpoints_tried: dict[str, object] = {}
blockers: list[str] = []
search_pages_parsed = 0
_last_hit: dict[str, float] = {}

def out_of_time() -> bool: return time.time() - T0 > BUDGET_S

def G(url: str, *, skip_robots: bool = False, retries: int = 1, headers: dict | None = None, timeout: int = 25) -> tuple[int, str]:
  """Polite GET: ≤1 req/s per host, status accounting."""
  host = urllib.parse.urlsplit(url).netloc
  wait = 1.0 - (time.time() - _last_hit.get(host, 0))
  if wait > 0: time.sleep(wait)
  st, body = get(url, timeout=timeout, retries=retries, headers=headers, _skip_robots=skip_robots)
  _last_hit[host] = time.time()
  status_counts[f"{host}:{st}"] += 1
  return st, body

def POST(url: str, data: dict, headers: dict | None = None, timeout: int = 25) -> tuple[int, str]:
  host = urllib.parse.urlsplit(url).netloc
  wait = 1.0 - (time.time() - _last_hit.get(host, 0))
  if wait > 0: time.sleep(wait)
  h = {"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded", "Accept": "text/html,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9"}
  if headers: h.update(headers)
  try:
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode(), headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r: st, body = r.status, r.read().decode("utf-8", "replace")
  except urllib.error.HTTPError as e:
    st = e.code
    try: body = e.read().decode("utf-8", "replace")
    except Exception: body = ""
  except Exception: st, body = 0, ""
  _last_hit[host] = time.time()
  status_counts[f"{host}:{st}"] += 1
  return st, body

# ------------------------------------------------------------------ dates from ids -----------------------------------------------------
def ts_from_activity_id(aid) -> str | None:
  """LinkedIn activity / ugcPost ids: the first 41 bits of the id's binary representation are a Unix-ms timestamp.
  (Equivalent to id >> 22 for the 63-bit ids in circulation; the generic '>> 23' only holds for a full 64-bit id.)"""
  try:
    b = bin(int(aid))[2:]
    ms = int(b[:41], 2)
    d = dt.datetime.fromtimestamp(ms / 1000, dt.timezone.utc)
    if 2010 <= d.year <= 2027: return d.strftime("%Y-%m-%dT%H:%M:%SZ")
  except Exception: pass
  return None

def ts_from_tweet_id(tid) -> str | None:
  try:
    ms = (int(tid) >> 22) + 1288834974657
    d = dt.datetime.fromtimestamp(ms / 1000, dt.timezone.utc)
    if 2006 <= d.year <= 2027: return d.strftime("%Y-%m-%dT%H:%M:%SZ")
  except Exception: pass
  return None

def li_author_from_url(u: str) -> str | None:
  p = urllib.parse.urlsplit(u).path
  m = re.match(r"^/posts/([^/_]+)_", p)
  if m: return m.group(1)
  m = re.match(r"^/in/([^/]+)", p)
  if m: return m.group(1)
  m = re.match(r"^/company/([^/]+)", p)
  if m: return m.group(1)
  return None

def li_date_from_url(u: str) -> str | None:
  m = re.search(r"(?:activity|ugcPost)-(\d{15,22})", u)
  return ts_from_activity_id(m.group(1)) if m else None

# ------------------------------------------------------------------ discovery: search engines ------------------------------------------
LI_URL_RE = re.compile(r"https?://(?:[a-z]{2,3}\.)?linkedin\.com/(?:posts|pulse|feed/update)/[^\s\"'<>#?]+", re.I)
X_URL_RE = re.compile(r"https?://(?:www\.|mobile\.)?(?:x|twitter)\.com/([A-Za-z0-9_]{1,20})/status/(\d{10,25})", re.I)

def bing_search(q: str, first: int = 1, count: int = 50) -> tuple[int, list[tuple[str, str, str]]]:
  """Bing HTML → [(url, title, snippet)]. Result hrefs are bing.com/ck/a?…&u=a1<base64url> wrappers → decoded."""
  global search_pages_parsed
  url = f"https://www.bing.com/search?q={urllib.parse.quote(q)}&count={count}&first={first}"
  st, b = G(url, skip_robots=True, retries=0)
  if st != 200: return st, []
  if re.search(r"captcha|verify you are human|unusual traffic", b[:200000], re.I) and "b_algo" not in b:
    blockers.append(f"bing captcha page for {q!r}"); return st, []
  search_pages_parsed += 1
  out = []
  for blk in re.findall(r'<li class="b_algo"(.*?)</li>', b, re.S):
    hm = re.search(r'<h2><a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', blk, re.S)
    if not hm: continue
    href = html.unescape(hm.group(1)); title = strip_html(hm.group(2))
    um = re.search(r"[?&]u=a1([A-Za-z0-9_-]+)", href)
    if um:
      try: href = base64.urlsafe_b64decode(um.group(1) + "=" * (-len(um.group(1)) % 4)).decode("utf-8", "replace")
      except Exception: pass
    sn = re.search(r'<p[^>]*>(.*?)</p>', blk, re.S)
    out.append((href, title, strip_html(sn.group(1)) if sn else ""))
  return st, out

def ddg_search(q: str) -> tuple[int, list[tuple[str, str, str]]]:
  global search_pages_parsed
  st, b = POST("https://html.duckduckgo.com/html/", {"q": q, "b": "", "kl": "us-en"}, headers={"Referer": "https://html.duckduckgo.com/"})
  if st != 200 or "result__a" not in b:
    if st == 200: st2, b2 = G("https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(q), skip_robots=True, retries=0); st, b = st2, b2
  if st == 202 or (st == 200 and "result__a" not in b and re.search(r"anomaly|challenge|bots", b, re.I)):
    blockers.append(f"duckduckgo bot-challenge (HTTP {st}) for {q!r}"); return st, []
  if st != 200: return st, []
  search_pages_parsed += 1
  out = []
  for blk in re.findall(r'<div class="result results_links(.*?)</div>\s*</div>', b, re.S):
    hm = re.search(r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', blk, re.S)
    if not hm: continue
    href = html.unescape(hm.group(1))
    um = re.search(r"uddg=([^&]+)", href)
    if um: href = urllib.parse.unquote(um.group(1))
    sn = re.search(r'class="result__snippet"[^>]*>(.*?)</a>', blk, re.S)
    out.append((href, strip_html(hm.group(2)), strip_html(sn.group(1)) if sn else ""))
  return st, out

# ------------------------------------------------------------------ item builders ------------------------------------------------------
li_items = 0; x_items = 0
per_account: collections.Counter = collections.Counter()

def add_item(it: dict | None, author_handle: str | None, platform: str) -> bool:
  global li_items, x_items
  if not it: stage.dropped["invalid"] = stage.dropped.get("invalid", 0) + 1; return False
  it["provider_receipt"] = False; it.update(VERIF)
  reg = reg_for_handle(author_handle)
  keep = False
  if reg:
    it["registers"] = sorted(set(it["registers"]) | {reg}); keep = True
  ok = stage.add(it, keep_offsubject=keep)
  if ok:
    if platform == "linkedin": li_items += 1
    else: x_items += 1
    per_account[f"{platform}:{(author_handle or 'other').lower()}" if reg else f"{platform}:other"] += 1
  return ok

def linkedin_item(url: str, title: str | None, snippet: str | None, hint_date: str | None = None, hint_author: str | None = None) -> bool:
  url = html.unescape(url.split("?")[0])
  if stage.has(url): return False
  handle = li_author_from_url(url) or hint_author
  act_date = li_date_from_url(url)
  it = fetch_article(CLS, url, hint_title=title, hint_date=act_date or hint_date, hint_outlet="LinkedIn", hint_excerpt=snippet, glyph="linkedin")
  host = urllib.parse.urlsplit(url).netloc; status_counts[f"{host}:{it['http_status'] if it else 'n/a'}"] += 1
  if not it and title:
    it = make_item(source_class=CLS, url=url, title=title, text=snippet or "", outlet="LinkedIn", author=handle, published_at=act_date or hint_date,
                   date_source="activity-id" if act_date else ("rss" if hint_date else ""), http_status=None, platform_glyph="linkedin")
  if not it: return False
  if act_date and it["published_at"][:10] != act_date[:10] and it["date_source"] in ("estimated", "rss", "", "unknown", "given"):
    it["published_at"], it["date_source"], it["published_at_estimated"] = act_date, "activity-id", False
  elif act_date and it["date_source"] == "rss": it["date_source"] = "activity-id"
  it["outlet"] = "LinkedIn"; it["author"] = it.get("author") or handle
  # strip the LinkedIn authwall boilerplate when that is all we got
  if it["text"] and re.search(r"Sign in to view|Join now|Agree & Join LinkedIn", it["text"][:200]): it["text"] = snippet or ""
  return add_item(it, handle, "linkedin")

def tweet_item_from_json(handle: str, t: dict) -> bool:
  tid = t.get("id_str") or t.get("id") or t.get("rest_id")
  if not tid: return False
  text = t.get("full_text") or t.get("text") or ""
  url = f"https://x.com/{handle}/status/{tid}"
  if stage.has(url): return False
  created = iso_date(t.get("created_at")); dsrc = "api"
  if not created: created, dsrc = ts_from_tweet_id(tid), "snowflake"
  for u in (t.get("entities") or {}).get("urls", []) or []:
    if u.get("url") and u.get("expanded_url"): text = text.replace(u["url"], u["expanded_url"])
  it = make_item(source_class=CLS, url=url, title=text[:140] or f"@{handle} post {tid}", text=text, outlet="X", author="@" + handle, published_at=created,
                 date_source=dsrc, http_status=200, platform_glyph="x")
  if it:
    it["reply_to"] = t.get("in_reply_to_screen_name") or t.get("in_reply_to_status_id_str")
    it["outbound_links"] = sorted({canonical(u.get("expanded_url")) for u in (t.get("entities") or {}).get("urls", []) or [] if canonical(u.get("expanded_url"))})
  return add_item(it, handle, "x")

def tweet_item_from_status_url(url: str, hint_title: str | None = None, hint_excerpt: str | None = None, hint_date: str | None = None) -> bool:
  m = X_URL_RE.search(url)
  if not m: return False
  handle, tid = m.group(1), m.group(2)
  url = f"https://x.com/{handle}/status/{tid}"
  if stage.has(url): return False
  text = None; created = None; dsrc = ""; st = None; author_name = None
  # 1) syndication tweet-result (public JSON behind embedded tweets)
  st, b = G(f"https://cdn.syndication.twimg.com/tweet-result?id={tid}&token=x", skip_robots=True, retries=0)
  endpoints_tried.setdefault("cdn.syndication.twimg.com/tweet-result", st)
  if st == 200 and b.startswith("{"):
    try:
      j = json.loads(b)
      text = j.get("text"); created = iso_date(j.get("created_at")); dsrc = "api" if created else ""
      u = j.get("user") or {}
      if u.get("screen_name"): handle = u["screen_name"]
      author_name = u.get("name")
      for e in (j.get("entities") or {}).get("urls", []) or []:
        if e.get("url") and e.get("expanded_url") and text: text = text.replace(e["url"], e["expanded_url"])
    except Exception: text = None
  # 2) oEmbed
  if not text:
    st, b = G("https://publish.twitter.com/oembed?url=" + urllib.parse.quote(url, safe="") + "&omit_script=1&dnt=1", skip_robots=True, retries=0)
    endpoints_tried.setdefault("publish.twitter.com/oembed(status)", st)
    if st == 200 and b.startswith("{"):
      try:
        j = json.loads(b); h = j.get("html", "")
        pm = re.search(r"(?is)<p[^>]*>(.*?)</p>", h)
        text = strip_html(pm.group(1)) if pm else None
        am = re.findall(r"(?is)<a[^>]*>([^<]*\d{4})</a>", h)
        if am: created = iso_date(am[-1].strip()); dsrc = "api" if created else ""
        author_name = j.get("author_name")
        um = re.search(r"https://x\.com/([A-Za-z0-9_]+)/status/", j.get("url", "") or "")
        if um: handle = um.group(1)
      except Exception: pass
  if not text:
    if not hint_title: return False
    text = hint_excerpt or hint_title
  if not created: created, dsrc = (iso_date(hint_date) if hint_date else None) or ts_from_tweet_id(tid), ("rss" if hint_date and iso_date(hint_date) else "snowflake")
  title = re.sub(r"\s+", " ", text)[:140]
  it = make_item(source_class=CLS, url=f"https://x.com/{handle}/status/{tid}", title=title, text=text, outlet="X", author="@" + handle, published_at=created,
                 date_source=dsrc, http_status=st, platform_glyph="x")
  if it and author_name: it["author_name"] = author_name
  return add_item(it, handle, "x")

# ------------------------------------------------------------------ X: syndication profile timelines --------------------------------------
def x_timeline(handle: str) -> int:
  n = 0
  url = f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}"
  st, b = 0, ""
  for i, back in enumerate((0, 20, 45, 90)):
    if out_of_time(): break
    if back: time.sleep(back)
    st, b = G(url, skip_robots=True, retries=0, headers={"Referer": "https://platform.twitter.com/", "Accept": "text/html,*/*"})
    if st == 200 and "__NEXT_DATA__" in b and '"entries":[]' not in b: break
    stage.log(f"x timeline {handle}: HTTP {st} (attempt {i + 1})")
  endpoints_tried[f"syndication.twitter.com/timeline-profile/{handle}"] = st
  if st != 200 or "__NEXT_DATA__" not in b:
    blockers.append(f"syndication.twitter.com timeline-profile/{handle}: HTTP {st} ({(b or '')[:60].strip()!r})"); return 0
  m = re.search(r'id="__NEXT_DATA__"[^>]*>(.*?)</script>', b, re.S)
  try: j = json.loads(m.group(1))
  except Exception: blockers.append(f"timeline-profile/{handle}: unparsable __NEXT_DATA__"); return 0
  entries = (((j.get("props") or {}).get("pageProps") or {}).get("timeline") or {}).get("entries") or []
  for e in entries:
    t = (e.get("content") or {}).get("tweet") or {}
    if not t: continue
    rt = t.get("retweeted_status")
    if rt: t = dict(rt); t["full_text"] = "RT @" + (rt.get("user") or {}).get("screen_name", "") + ": " + (rt.get("full_text") or "")
    user = (t.get("user") or {}).get("screen_name") or handle
    if tweet_item_from_json(handle if user.lower() == handle.lower() else handle, t): n += 1
  stage.log(f"x timeline {handle}: {len(entries)} entries → {n} new items")
  return n

# ------------------------------------------------------------------ main ---------------------------------------------------------------
def main():
  global search_pages_parsed
  stage.log(f"collect_e start; resume with {stage.n} existing items; budget {BUDGET_S}s")

  # ---- 1. X account timelines (highest-value, authored posts) ----
  for h in X_HANDLES:
    if out_of_time(): break
    x_timeline(h)
  if "--x-only" in sys.argv:  # resumable re-run of just the X timelines (syndication endpoint rate-limits bursts)
    prev = json.load(open(os.path.join(STAGE, "e.summary.json"))) if os.path.exists(os.path.join(STAGE, "e.summary.json")) else {}
    prev.update({"items": stage.n, "x_items": prev.get("x_items", 0) + x_items, "x_timeline_rerun": {"endpoints": endpoints_tried, "new_items": dict(per_account), "blockers": blockers}})
    json.dump(prev, open(os.path.join(STAGE, "e.summary.json"), "w"), indent=2, ensure_ascii=False)
    stage.log(f"x-only rerun done: +{x_items} items"); return

  # ---- 3. Bing HTML ----
  bing_queries = ['site:linkedin.com/posts "B Capital"', 'site:linkedin.com/posts/rajganguly', 'site:linkedin.com/posts/b-capital-group', 'site:linkedin.com/posts/karan-mohla-153998',
                  'site:linkedin.com/posts "Raj Ganguly"', 'site:linkedin.com/posts "Karan Mohla"', 'site:linkedin.com/posts "Eduardo Saverin"',
                  'site:linkedin.com/pulse "B Capital"', 'site:linkedin.com/pulse "Raj Ganguly"', 'site:x.com/BCapitalGroup/status', 'site:x.com/rajganguly_/status', 'site:x.com/esaverin/status',
                  'site:x.com/karanmohla/status', 'site:x.com "B Capital" status', 'site:x.com "Raj Ganguly"', 'site:x.com "Eduardo Saverin" status', 'site:x.com "Karan Mohla"']
  bing_li_hits = bing_x_hits = 0; bing_st = None
  for q in bing_queries:
    q_hits = 0
    for first in (1, 11, 21, 31, 51, 101):
      if out_of_time(): break
      if first > 1 and q_hits == 0: break  # don't page when Bing returned nothing on-platform for this query
      st, res = bing_search(q, first=first); bing_st = st
      hits = 0
      for href, title, sn in res:
        if LI_URL_RE.match(href):
          hits += 1; bing_li_hits += 1
          if linkedin_item(href, title, sn): pass
        elif X_URL_RE.search(href):
          hits += 1; bing_x_hits += 1
          tweet_item_from_status_url(href, hint_title=title, hint_excerpt=sn)
      q_hits += hits
      stage.log(f"bing {q!r} first={first}: HTTP {st}, {len(res)} results, {hits} on-platform links")
      if len(res) < 5 or hits == 0: break
      time.sleep(1.5)
  endpoints_tried["bing.com/search"] = bing_st
  if bing_li_hits + bing_x_hits == 0: blockers.append("bing.com/search: HTTP 200 but results ignore the site: operator (generic SERP, zero linkedin.com/x.com hits)")

  # ---- 2. Google News RSS discovery ----
  gn_queries = [
    ('site:linkedin.com/posts "B Capital"', None), ('site:linkedin.com/pulse "B Capital"', None), ('site:linkedin.com "Raj Ganguly"', None),
    ('site:linkedin.com "Karan Mohla"', None), ('site:linkedin.com "Eduardo Saverin"', None), ('site:linkedin.com/posts "Saverin"', None),
    ('site:linkedin.com/posts/rajganguly', "rajganguly"), ('site:linkedin.com/posts/b-capital-group', "b-capital-group"), ('site:linkedin.com/posts/karan-mohla-153998', "karan-mohla-153998"),
    ('site:x.com "B Capital"', None), ('site:x.com "Raj Ganguly"', None), ('site:x.com "Eduardo Saverin"', None), ('site:x.com "Karan Mohla"', None),
    ('site:x.com/BCapitalGroup', "BCapitalGroup"), ('site:x.com/rajganguly_', "rajganguly_"), ('site:x.com/esaverin', "esaverin"), ('site:x.com/karanmohla', "karanmohla"),
    ('"B Capital" linkedin.com/posts', None), ('"B Capital" x.com status', None),
  ]
  resolved = 0
  for q, forced in gn_queries:
    if out_of_time(): break
    items = google_news_search(q)
    status_counts["news.google.com:rss"] += 1; search_pages_parsed += 1
    endpoints_tried.setdefault("news.google.com/rss/search", 200 if items else "empty")
    cand = []
    for r in items:
      pub = (r.get("publisher") or "").lower()
      if pub not in ("linkedin", "x", "twitter", "x.com"): continue
      blob = f"{r['title']}\n{r.get('excerpt', '')}"
      if forced or registers_for(blob): cand.append(r)
    stage.log(f"gnews {q!r}: {len(items)} results, {len(cand)} candidates")
    for r in cand[:40]:
      if out_of_time(): break
      u = resolve_gnews(r["url"]); resolved += 1; time.sleep(0.4)
      if not u: status_counts["gnews-resolve:fail"] += 1; continue
      status_counts["gnews-resolve:ok"] += 1
      title = re.sub(r"\s*[-|]\s*(LinkedIn|X)\s*$", "", r["title"]).strip()
      if "linkedin.com" in u:
        if not re.search(r"linkedin\.com/(posts|pulse|feed/update|in|company)/", u): continue
        if re.search(r"linkedin\.com/(in|company)/[^/]+/?$", u): continue  # profile root, not a post
        linkedin_item(u, title, r.get("excerpt"), hint_date=r.get("published_at"))
      elif X_URL_RE.search(u):
        tweet_item_from_status_url(u, hint_title=title, hint_excerpt=r.get("excerpt"), hint_date=r.get("published_at"))
  stage.log(f"gnews phase done: resolved {resolved} links; li={li_items} x={x_items}")

  # ---- 4. DuckDuckGo HTML ----
  ddg_queries = ['site:linkedin.com/posts "B Capital"', 'site:linkedin.com/posts "Raj Ganguly"', 'site:linkedin.com/posts "Karan Mohla"', 'site:linkedin.com/posts "Eduardo Saverin"',
                 'site:linkedin.com/pulse "B Capital"', 'site:x.com "B Capital"', 'site:x.com "Raj Ganguly"', 'site:x.com "Eduardo Saverin"']
  ddg_hits = 0; ddg_st = None; ddg_blocked = 0
  for q in ddg_queries:
    if out_of_time(): break
    st, res = ddg_search(q); ddg_st = st
    if not res and st in (202, 403): ddg_blocked += 1
    if ddg_blocked >= 3: stage.log("ddg: 3 consecutive bot challenges → stop"); break
    hits = 0
    for href, title, sn in res:
      if LI_URL_RE.match(href): hits += 1; linkedin_item(href, title, sn)
      elif X_URL_RE.search(href): hits += 1; tweet_item_from_status_url(href, hint_title=title, hint_excerpt=sn)
    ddg_hits += hits
    stage.log(f"ddg {q!r}: HTTP {st}, {len(res)} results, {hits} on-platform links")
    time.sleep(3)
  endpoints_tried["html.duckduckgo.com/html"] = ddg_st

  # ---- 5. summary ----
  dur = round(time.time() - T0, 1)
  summ = stage.summary()
  summ.update({"linkedin_items": li_items, "x_items": x_items, "per_account_new_items": dict(per_account), "endpoints_tried": endpoints_tried,
               "search_pages_parsed": search_pages_parsed, "http_status_counts": dict(status_counts), "duration_s": dur, "blockers": sorted(set(blockers)),
               "budget_hit": out_of_time(), "generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")})
  with open(os.path.join(STAGE, "e.summary.json"), "w", encoding="utf-8") as f: json.dump(summ, f, indent=2, ensure_ascii=False)
  stage.log(f"done in {dur}s: items={summ['items']} (+li {li_items}, +x {x_items}) dropped={summ['dropped']} blockers={len(summ['blockers'])}")

if __name__ == "__main__":
  main()
