#!/usr/bin/env python3
"""sweeplib — shared helpers for the 2026-10-19 mass data sweep (source classes a–f).

Every collector imports this module and emits ONE JSON line per item into data/sweep/<class>.jsonl with the schema below.
The coordinator (scripts/sweep/merge.py) merges, dedups (canonical URL + SimHash), drops noise, tags registers and rebuilds
web/data/reputation/evidence.json, data/corpus.json and data/corpus.sqlite.

Item schema (all collectors):
  { id, title, canonical_url, original_url, outlet, author, published_at (ISO-8601 UTC, required), published_at_estimated (bool),
    date_source ("meta"|"jsonld"|"sitemap"|"url"|"rss"|"wayback"|"api"|"estimated"), text (full text or ≥400-char excerpt),
    platform_glyph (web|news|linkedin|youtube|podcast|x|reddit|instagram|tiktok|pr), named_entities[], registers[] (BCAP-001..004),
    companies[] (portfolio slugs named in the text), source_class (a–f), fetched_at, http_status, hash, provider_receipt (bool),
    hashtags[], mentions[], outbound_links[], reply_to }
"""
from __future__ import annotations
import datetime as dt, email.utils, hashlib, html, json, os, re, sys, time, urllib.parse, urllib.request, urllib.error

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STAGE = os.path.join(ROOT, "data", "sweep")
os.makedirs(STAGE, exist_ok=True)
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
NOW = lambda: dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# ---------------------------------------------------------------- registers & noise -----------------------------------------------
REGISTER_PATTERNS = {
  "BCAP-001": [r"\bb[\s\.\-]?capital(\s+group)?\b", r"\bbcapital(group)?\b", r"@bcapitalgroup\b"],
  "BCAP-002": [r"\beduardo\s+saverin\b", r"\bsaverin\b", r"@esaverin\b", r"@eduardosaverin\b"],
  "BCAP-003": [r"\braj\s+ganguly\b", r"\bganguly\b", r"@rajganguly_?\b"],
  "BCAP-004": [r"\bkaran\s+mohla\b", r"\bmohla\b", r"@karanmohla\b"],
}
_REG_RE = {k: re.compile("|".join(v), re.I) for k, v in REGISTER_PATTERNS.items()}
# "Ganguly" / "Mohla" / "Saverin" alone are only accepted when the text also carries an investing / B Capital context, otherwise a
# surname-only hit is a namesake (Sourav Ganguly the cricketer, the ksmhomes.ca realtor, …).
_CONTEXT_RE = re.compile(r"\b(b[\s\.\-]?capital|venture|vc\b|investor|investment|fund|startup|portfolio|series [a-f]|raises?|raised|co-?ceo|general partner|chiratae|idg ventures|bain capital|velos|facebook co-?founder|billionaire|forbes)", re.I)
_FULLNAME_RE = {"BCAP-002": re.compile(r"\beduardo\s+saverin\b|@esaverin|@eduardosaverin", re.I), "BCAP-003": re.compile(r"\braj\s+ganguly\b|@rajganguly", re.I), "BCAP-004": re.compile(r"\bkaran\s+mohla\b|@karanmohla", re.I)}
FILM_NOISE_RE = re.compile(r"the social network|social reckoning|andrew garfield|jesse eisenberg|aaron sorkin|fincher|armie hammer|winklevoss twins|mikey madison|jeremy strong\b|oscar|box office|trailer|screenplay|sequel|movie|film\b", re.I)
NAMESAKE_RE = re.compile(r"ksmhomes|sourav ganguly|dada ganguly|kolkata knight riders|cricket|bcci|realtor|real estate agent|mls listing|ganguly.*(bengali|actor|singer|professor of)|mohla.*(dermatolog|dentist|realty)", re.I)

def registers_for(text: str) -> list[str]:
  """Registers an item is tagged with. BCAP-001 on any B Capital mention; persons need the full name/handle, or the surname + investing context."""
  t = text or ""
  out = []
  if _REG_RE["BCAP-001"].search(t): out.append("BCAP-001")
  ctx = bool(_CONTEXT_RE.search(t))
  for r in ("BCAP-002", "BCAP-003", "BCAP-004"):
    if _FULLNAME_RE[r].search(t) or (_REG_RE[r].search(t) and ctx): out.append(r)
  return out

def noise_reason(title: str, text: str, registers: list[str]) -> str | None:
  """Return a drop reason ('film-noise' | 'namesake' | 'off-subject') or None when the item is keepable."""
  blob = f"{title}\n{text or ''}"
  if not registers: return "off-subject"
  if "BCAP-002" in registers and len(registers) == 1 and FILM_NOISE_RE.search(blob) and not re.search(r"b[\s\.\-]?capital|venture|invest|fund|startup", blob, re.I):
    return "film-noise"
  if NAMESAKE_RE.search(blob) and not re.search(r"b[\s\.\-]?capital", blob, re.I): return "namesake"
  return None

# ---------------------------------------------------------------- urls / hashing --------------------------------------------------
_TRACK = re.compile(r"^(utm_\w+|fbclid|gclid|mc_cid|mc_eid|ref|ref_src|ref_url|source|s|t|oc|hl|gl|ceid|igshid|si|feature|cmpid|sref|srnd|leadSource|taid|ncid|guccounter|guce_referrer\w*|_hsenc|_hsmi|mkt_tok|trk|trackingId|lipi|rcm|originalSubdomain)$", re.I)
def canonical(u: str | None) -> str | None:
  if not u: return None
  try:
    u = html.unescape(u.strip())
    p = urllib.parse.urlsplit(u)
    if p.scheme not in ("http", "https"): return None
    host = p.netloc.lower().split("@")[-1].split(":")[0]
    host = re.sub(r"^(www|m|amp|mobile)\.", "", host)
    host = re.sub(r"^[a-z]{2}\.linkedin\.com$", "linkedin.com", host)  # uk./in./gq. country mirrors of the same activity id
    if host == "youtu.be": return f"https://youtube.com/watch?v={p.path.strip('/')}"
    if host == "twitter.com": host = "x.com"
    q = [(k, v) for k, v in urllib.parse.parse_qsl(p.query, keep_blank_values=False) if not _TRACK.match(k)]
    if host == "youtube.com": q = [(k, v) for k, v in q if k == "v"]
    path = re.sub(r"/+", "/", p.path).rstrip("/")
    path = re.sub(r"/(amp|index\.html?)$", "", path)
    return urllib.parse.urlunsplit(("https", host, path, urllib.parse.urlencode(q), ""))
  except Exception:
    return None
def host_of(u: str) -> str:
  try: return urllib.parse.urlsplit(u).netloc.replace("www.", "")
  except Exception: return ""
def sha(s: str) -> str: return hashlib.sha256((s or "").encode("utf-8", "replace")).hexdigest()
def item_hash(canon: str, title: str) -> str: return sha(f"{canon}\n{re.sub(r'\W+', ' ', (title or '').lower()).strip()}")

# ---------------------------------------------------------------- dates -----------------------------------------------------------
def iso_date(s) -> str | None:
  """Any date-ish string → ISO-8601 UTC. Returns None when nothing parses."""
  if s is None: return None
  if isinstance(s, (int, float)):
    try: return dt.datetime.fromtimestamp(float(s if s < 1e12 else s / 1000), dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception: return None
  s = str(s).strip()
  if not s: return None
  m = re.match(r"^(\d{4})(\d{2})(\d{2})(?:T?(\d{2})(\d{2})(\d{2}))?Z?$", s)
  if m:
    try:
      d = dt.datetime(int(m[1]), int(m[2]), int(m[3]), int(m[4] or 0), int(m[5] or 0), int(m[6] or 0), tzinfo=dt.timezone.utc)
      return d.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception: return None
  try:
    d = email.utils.parsedate_to_datetime(s)
    if d.tzinfo is None: d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
  except Exception: pass
  m = re.match(r"^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?)?", s)
  if m:
    try:
      t = m[2] or "00:00:00"
      if len(t) == 5: t += ":00"
      tz = m[3] or "Z"
      d = dt.datetime.fromisoformat(f"{m[1]}T{t}{'+00:00' if tz == 'Z' else tz[:3] + ':' + tz[-2:]}")
      return d.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception: return m[1] + "T00:00:00Z"
  for fmt in ("%B %d, %Y", "%b %d, %Y", "%d %B %Y", "%d %b %Y", "%B %d %Y", "%b. %d, %Y", "%Y/%m/%d", "%m/%d/%Y", "%d/%m/%Y"):
    try: return dt.datetime.strptime(re.sub(r"(\d)(st|nd|rd|th)", r"\1", s), fmt).strftime("%Y-%m-%dT00:00:00Z")
    except Exception: pass
  m = re.search(r"\b(20[012]\d|201\d)-(\d{2})-(\d{2})\b", s)
  if m: return f"{m[1]}-{m[2]}-{m[3]}T00:00:00Z"
  return None
def date_from_url(u: str) -> str | None:
  m = re.search(r"/(20[0-2]\d)/(\d{1,2})/(\d{1,2})(?:/|$)", u) or re.search(r"/(20[0-2]\d)-(\d{2})-(\d{2})", u)
  if m:
    try: return dt.date(int(m[1]), int(m[2]), int(m[3])).strftime("%Y-%m-%dT00:00:00Z")
    except Exception: return None
  m = re.search(r"/(20[0-2]\d)/(\d{1,2})(?:/|$)", u)
  if m:
    try: return dt.date(int(m[1]), int(m[2]), 1).strftime("%Y-%m-%dT00:00:00Z")
    except Exception: return None
  return None
_META_DATE_RES = [
  r'<meta[^>]+(?:property|name)=["\'](?:article:published_time|og:article:published_time|datePublished|pubdate|publishdate|publish-date|date|dc\.date(?:\.issued)?|sailthru\.date|parsely-pub-date|article\.published|cXenseParse:recs:publishtime|timestamp)["\'][^>]+content=["\']([^"\']+)',
  r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:article:published_time|og:article:published_time|datePublished|pubdate|date)["\']',
  r'"datePublished"\s*:\s*"([^"]+)"', r'"dateCreated"\s*:\s*"([^"]+)"', r'"uploadDate"\s*:\s*"([^"]+)"',
  r'<time[^>]+datetime=["\']([^"\']+)', r'"publishedAt"\s*:\s*"([^"]+)"', r'"published_at"\s*:\s*"([^"]+)"',
]
def date_from_html(h: str) -> tuple[str | None, str]:
  for i, rx in enumerate(_META_DATE_RES):
    m = re.search(rx, h, re.I)
    if m:
      d = iso_date(m.group(1))
      if d and d[:4] >= "2000": return d, ("jsonld" if "datePublished" in rx or "dateCreated" in rx or "uploadDate" in rx else "meta")
  return None, ""
def wayback_first_capture(u: str) -> str | None:
  try:
    st, body = get(f"https://web.archive.org/cdx/search/cdx?url={urllib.parse.quote(u, safe='')}&output=json&limit=1&fl=timestamp&filter=statuscode:200", timeout=20, retries=1)
    if st == 200:
      rows = json.loads(body)
      if len(rows) > 1: return iso_date(rows[1][0])
  except Exception: pass
  return None

# ---------------------------------------------------------------- http ------------------------------------------------------------
_ROBOTS: dict[str, list[str]] = {}
def robots_allowed(u: str) -> bool:
  try:
    p = urllib.parse.urlsplit(u); key = f"{p.scheme}://{p.netloc}"
    if key not in _ROBOTS:
      st, body = get(key + "/robots.txt", timeout=10, retries=0, _skip_robots=True)
      dis = []
      if st == 200:
        ua_all = False
        for line in body.splitlines():
          line = line.split("#")[0].strip()
          if not line: continue
          k, _, v = line.partition(":"); k = k.strip().lower(); v = v.strip()
          if k == "user-agent": ua_all = (v == "*")
          elif k == "disallow" and ua_all and v and v != "/": dis.append(v)
          elif k == "disallow" and ua_all and v == "/": dis.append("/")
      _ROBOTS[key] = dis
    path = p.path or "/"
    for d in _ROBOTS[key]:
      if d == "/" : return False
      if path.startswith(d.rstrip("*")): return False
    return True
  except Exception:
    return True
def get(url: str, timeout: int = 25, retries: int = 2, headers: dict | None = None, _skip_robots: bool = False) -> tuple[int, str]:
  """GET with UA, 429 back-off and robots.txt respect. Returns (status, text). status 0 = network failure, 999 = robots-disallowed."""
  if not _skip_robots and not robots_allowed(url): return 999, ""
  h = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9"}
  if headers: h.update(headers)
  for i in range(retries + 1):
    try:
      req = urllib.request.Request(url, headers=h)
      with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        enc = "utf-8"
        m = re.search(rb'charset=["\']?([\w-]+)', raw[:4000])
        if m:
          try: enc = m.group(1).decode()
          except Exception: pass
        try: return r.status, raw.decode(enc, "replace")
        except LookupError: return r.status, raw.decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
      if e.code in (429, 503) and i < retries: time.sleep(6 + 6 * i); continue
      try: return e.code, e.read().decode("utf-8", "replace")[:20000]
      except Exception: return e.code, ""
    except Exception:
      if i < retries: time.sleep(2 + 2 * i)
  return 0, ""

# ---------------------------------------------------------------- html → text ----------------------------------------------------
def strip_html(h: str) -> str:
  h = re.sub(r"(?is)<(script|style|noscript|svg|nav|footer|header|form|aside)[^>]*>.*?</\1>", " ", h or "")
  h = re.sub(r"(?s)<!--.*?-->", " ", h)
  h = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</li>|</h\d>", "\n", h)
  t = html.unescape(re.sub(r"<[^>]+>", " ", h))
  t = re.sub(r"[ \t\r\f\v]+", " ", t)
  return re.sub(r"\n\s*\n+", "\n", t).strip()
def meta(h: str, *names: str) -> str | None:
  for n in names:
    m = re.search(rf'<meta[^>]+(?:property|name)=["\']{re.escape(n)}["\'][^>]+content=["\']([^"\']*)', h, re.I) or re.search(rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:property|name)=["\']{re.escape(n)}["\']', h, re.I)
    if m and m.group(1).strip(): return html.unescape(m.group(1).strip())
  return None
def html_title(h: str) -> str | None:
  t = meta(h, "og:title", "twitter:title")
  if t: return t
  m = re.search(r"(?is)<title[^>]*>(.*?)</title>", h or "")
  return html.unescape(re.sub(r"\s+", " ", m.group(1))).strip() if m else None
def article_text(h: str) -> str:
  """Best-effort main text: trafilatura when available, else <article>/<main>/largest <p> cluster, else stripped body."""
  try:
    import trafilatura  # type: ignore
    t = trafilatura.extract(h, include_comments=False, include_tables=False, favor_recall=True)
    if t and len(t) > 200: return t.strip()
  except Exception: pass
  for tag in ("article", "main"):
    m = re.search(rf"(?is)<{tag}[^>]*>(.*?)</{tag}>", h or "")
    if m:
      t = strip_html(m.group(1))
      if len(t) > 200: return t
  paras = [strip_html(p) for p in re.findall(r"(?is)<p[^>]*>(.*?)</p>", h or "")]
  t = "\n".join(p for p in paras if len(p) > 40)
  return t if len(t) > 200 else strip_html(h or "")[:6000]
def author_of(h: str) -> str | None:
  a = meta(h, "author", "article:author", "parsely-author", "dc.creator", "sailthru.author", "byl")
  if a and not a.startswith("http"): return a[:120]
  m = re.search(r'"author"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"', h or "")
  return m.group(1)[:120] if m else None

# ---------------------------------------------------------------- named entities / companies -----------------------------------------
_PORTFOLIO: list[tuple[str, re.Pattern]] | None = None
def portfolio_companies() -> list[dict]:
  return json.load(open(os.path.join(ROOT, "data", "portfolio.json")))["companies"]
def companies_in(text: str) -> list[str]:
  global _PORTFOLIO
  if _PORTFOLIO is None:
    _PORTFOLIO = []
    for c in portfolio_companies():
      n = c["name"].strip()
      if len(n) < 4 and n.lower() not in ("bolt", "icertis"): continue
      _PORTFOLIO.append((c["slug"], re.compile(r"(?<![\w-])" + re.escape(n) + r"(?![\w-])", re.I)))
  t = text or ""
  return [slug for slug, rx in _PORTFOLIO if rx.search(t)]
_ENT_RE = re.compile(r"\b((?:[A-Z][a-z&\.']+|[A-Z]{2,})(?:\s+(?:[A-Z][a-z&\.']+|[A-Z]{2,}|of|de|&)){0,3})\b")
_ENT_STOP = set("The This That These Those There Here When Where What Which Who Why How And But For Nor Yet So In On At To By With From As Of A An It Its He She They We You I Our Their His Her Mr Ms Mrs Dr Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Reuters Bloomberg Forbes CNBC TechCrunch Read More Share Image Photo Getty Images Credit Source Subscribe Sign Up Log In".split())
def named_entities(text: str, limit: int = 30) -> list[str]:
  seen: dict[str, int] = {}
  for m in _ENT_RE.finditer(text or ""):
    e = m.group(1).strip()
    if len(e) < 3 or e.split()[0] in _ENT_STOP or e.upper() == e and len(e) < 3: continue
    if e in _ENT_STOP: continue
    seen[e] = seen.get(e, 0) + 1
  return [e for e, _ in sorted(seen.items(), key=lambda kv: -kv[1])[:limit]]
def hashtags_in(text: str) -> list[str]: return sorted({h.lower() for h in re.findall(r"#(\w{2,40})", text or "")})
def mentions_in(text: str) -> list[str]: return sorted({m.lower() for m in re.findall(r"@(\w{2,40})", text or "")})
def links_in(h: str, base: str | None = None) -> list[str]:
  out = []
  for u in re.findall(r'href=["\'](https?://[^"\'#\s]+)', h or ""):
    c = canonical(u)
    if c and (not base or host_of(c) != host_of(base)): out.append(c)
  return sorted(set(out))[:40]

# ---------------------------------------------------------------- item assembly ---------------------------------------------------
GLYPH_BY_HOST = [(r"linkedin\.com", "linkedin"), (r"youtube\.com|youtu\.be", "youtube"), (r"x\.com|twitter\.com", "x"), (r"reddit\.com", "reddit"), (r"instagram\.com", "instagram"), (r"tiktok\.com", "tiktok"),
                 (r"podcasts\.apple\.com|spotify\.com|substack\.com/p/.*podcast|anchor\.fm|libsyn|simplecast|buzzsprout|podbean|transistor", "podcast"),
                 (r"prnewswire|businesswire|globenewswire|newswire|accesswire|prweb|einpresswire", "pr"),
                 (r"b\.capital", "web")]
def glyph_for(url: str, default: str = "news") -> str:
  h = host_of(url)
  for rx, g in GLYPH_BY_HOST:
    if re.search(rx, h): return g
  return default

def make_item(*, source_class: str, url: str, title: str | None, text: str | None, outlet: str | None = None, author: str | None = None,
              published_at: str | None = None, date_source: str = "", estimated: bool = False, http_status: int | None = None,
              platform_glyph: str | None = None, provider_receipt: bool = False, extra: dict | None = None) -> dict | None:
  """Build a schema-complete item. Returns None when the URL is invalid or there is no title."""
  canon = canonical(url)
  if not canon: return None
  title = re.sub(r"\s+", " ", (title or "").strip())
  if not title: return None
  text = (text or "").strip()
  blob = f"{title}\n{text}"
  regs = registers_for(blob)
  pub = iso_date(published_at) if published_at else None
  if not pub:
    pub = date_from_url(canon); date_source = date_source or ("url" if pub else "")
  if not pub: pub, date_source, estimated = NOW()[:10] + "T00:00:00Z", "estimated", True
  it = {
    "id": "sw-" + sha(canon)[:16], "title": title[:300], "canonical_url": canon, "original_url": url, "outlet": (outlet or host_of(canon))[:120],
    "author": author, "published_at": pub, "published_at_estimated": bool(estimated), "date_source": date_source or ("given" if published_at else "unknown"),
    "text": text[:20000], "platform_glyph": platform_glyph or glyph_for(canon), "named_entities": named_entities(blob), "registers": regs,
    "companies": companies_in(blob), "source_class": source_class, "fetched_at": NOW(), "http_status": http_status, "hash": item_hash(canon, title),
    "provider_receipt": bool(provider_receipt), "hashtags": hashtags_in(blob), "mentions": mentions_in(blob), "outbound_links": [], "reply_to": None,
  }
  if extra: it.update(extra)
  return it

class Stage:
  """Append-only JSONL writer for data/sweep/<class>.jsonl with resume support (skips canonical URLs already written)."""
  def __init__(self, source_class: str):
    self.path = os.path.join(STAGE, f"{source_class}.jsonl"); self.cls = source_class
    self.seen: set[str] = set(); self.n = 0; self.dropped: dict[str, int] = {}
    if os.path.exists(self.path):
      for line in open(self.path, encoding="utf-8"):
        try:
          d = json.loads(line); self.seen.add(d["canonical_url"]); self.n += 1
        except Exception: pass
    self.f = open(self.path, "a", encoding="utf-8")
    self.logp = os.path.join(STAGE, f"{source_class}.log")
  def log(self, msg: str):
    line = f"{NOW()} [{self.cls}] {msg}"
    print(line, flush=True)
    with open(self.logp, "a", encoding="utf-8") as lf: lf.write(line + "\n")
  def has(self, url: str) -> bool:
    c = canonical(url); return bool(c) and c in self.seen
  def add(self, it: dict | None, keep_offsubject: bool = False) -> bool:
    if not it: self.dropped["invalid"] = self.dropped.get("invalid", 0) + 1; return False
    if it["canonical_url"] in self.seen: self.dropped["dup"] = self.dropped.get("dup", 0) + 1; return False
    reason = noise_reason(it["title"], it["text"], it["registers"])
    if reason and not (keep_offsubject and reason == "off-subject"):
      self.dropped[reason] = self.dropped.get(reason, 0) + 1
      with open(os.path.join(STAGE, f"{self.cls}.rejects.jsonl"), "a", encoding="utf-8") as rf:
        rf.write(json.dumps({"reason": reason, "url": it["canonical_url"], "title": it["title"][:200]}, ensure_ascii=False) + "\n")
      return False
    self.seen.add(it["canonical_url"]); self.n += 1
    self.f.write(json.dumps(it, ensure_ascii=False) + "\n"); self.f.flush()
    return True
  def summary(self) -> dict:
    return {"class": self.cls, "items": self.n, "dropped": self.dropped, "file": os.path.relpath(self.path, ROOT)}

def fetch_article(source_class: str, url: str, *, hint_title: str | None = None, hint_date: str | None = None, hint_outlet: str | None = None,
                  hint_excerpt: str | None = None, glyph: str | None = None, wayback: bool = False) -> dict | None:
  """GET a page and build an item from its og:/JSON-LD metadata + extracted text. Paywalled / blocked pages fall back to the hints (title/url/date/excerpt)."""
  st, body = get(url)
  title = text = author = outlet = None; pub = None; dsrc = ""; est = False
  if st == 200 and body and "<html" in body[:5000].lower():
    title = html_title(body); text = article_text(body); author = author_of(body)
    outlet = meta(body, "og:site_name", "application-name", "publisher") or hint_outlet
    pub, dsrc = date_from_html(body)
    desc = meta(body, "og:description", "description", "twitter:description")
    if desc and (not text or len(text) < 400): text = f"{desc}\n{text or ''}".strip()
  if not title: title = hint_title
  if not text and hint_excerpt: text = hint_excerpt
  if not pub and hint_date: pub, dsrc = iso_date(hint_date), (dsrc or "rss")
  if not pub: pub = date_from_url(url); dsrc = "url" if pub else dsrc
  if not pub and wayback: pub = wayback_first_capture(url); dsrc = "wayback" if pub else dsrc; est = bool(pub)
  if not title: return None
  it = make_item(source_class=source_class, url=url, title=title, text=text, outlet=outlet or hint_outlet, author=author, published_at=pub, date_source=dsrc, estimated=est, http_status=st, platform_glyph=glyph)
  if it and st == 200 and body: it["outbound_links"] = links_in(body, url)[:25]
  return it

# ---------------------------------------------------------------- rss / sitemap helpers -------------------------------------------
def rss_items(xml: str) -> list[dict]:
  out = []
  for m in re.finditer(r"<(item|entry)>(.*?)</\1>", xml or "", re.S):
    it = m.group(2)
    def g(tag):
      mm = re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", it, re.S); return html.unescape(re.sub(r"<!\[CDATA\[|\]\]>", "", mm.group(1))).strip() if mm else ""
    link = g("link")
    if not link:
      lm = re.search(r'<link[^>]*href=["\']([^"\']+)', it); link = lm.group(1).strip() if lm else ""
    src = re.sub(r"<[^>]+>", "", g("source")).strip()
    srcurl = (re.search(r'<source[^>]*url="([^"]+)"', it) or [None, ""])[1]
    desc = strip_html(g("description") or g("summary") or g("content"))
    out.append({"title": re.sub(r"<[^>]+>", "", g("title")), "url": link, "published_at": g("pubDate") or g("published") or g("updated") or g("dc:date"), "publisher": src, "publisher_url": srcurl, "excerpt": desc[:1500], "author": g("dc:creator") or g("author")})
  return out
def google_news_search(query: str, *, after: str | None = None, before: str | None = None, lang: str = "en-US", gl: str = "US") -> list[dict]:
  q = query + (f" after:{after}" if after else "") + (f" before:{before}" if before else "")
  st, body = get("https://news.google.com/rss/search?q=" + urllib.parse.quote(q) + f"&hl={lang}&gl={gl}&ceid={gl}:{lang.split('-')[0]}", _skip_robots=True)
  return rss_items(body) if st == 200 else []
def decode_gnews(url: str) -> str | None:
  """news.google.com/rss/articles/<id> → publisher URL when the id embeds it (older ids do; new ones need the batchexecute API)."""
  m = re.search(r"/articles/([^?/]+)", url)
  if not m: return None
  try:
    import base64
    raw = base64.urlsafe_b64decode(m.group(1) + "=" * (-len(m.group(1)) % 4))
    s = raw.decode("latin-1")
    mm = re.search(r"https?://[\x21-\x7e]+", s)
    if mm: return re.sub(r"[^\x21-\x7e]+$", "", mm.group(0)).rstrip("\x01\x02\xd2\x01")
  except Exception: pass
  return None
_GN_CACHE: dict[str, str | None] = {}
def resolve_gnews(url: str) -> str | None:
  """Resolve a Google News RSS article link to the publisher URL (embedded id first, then the DotsSplashUi batchexecute endpoint)."""
  if url in _GN_CACHE: return _GN_CACHE[url]
  d = decode_gnews(url)
  if d and not d.startswith("https://news.google.com") and d.startswith("http"): _GN_CACHE[url] = d; return d
  m = re.search(r"/articles/([^?/]+)", url)
  if not m: return None
  out = None
  try:
    aid = m.group(1)
    st, body = get(f"https://news.google.com/rss/articles/{aid}", _skip_robots=True)
    sig = re.search(r'data-n-a-sg="([^"]+)"', body or ""); ts = re.search(r'data-n-a-ts="([^"]+)"', body or "")
    if sig and ts:
      inner = json.dumps(["garturlreq", [["en-US", "US", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"], None, None, 1, 1, "US:en", None, 180, None, None, None, None, None, 0, None, None, [1608992183, 723341000]], "en-US", "US", 1, [2, 3, 4, 8], 1, 0, "655000234", 0, 0, None, 0], aid, int(ts.group(1)), sig.group(1)])
      data = urllib.parse.urlencode({"f.req": json.dumps([[["Fbv4je", inner, None, "generic"]]])}).encode()
      req = urllib.request.Request("https://news.google.com/_/DotsSplashUi/data/batchexecute", data=data, headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"})
      with urllib.request.urlopen(req, timeout=20) as r: txt = r.read().decode("utf-8", "replace")
      mm = re.search(r'\\"(https?://[^\\"]+)\\"', txt)
      if mm: out = mm.group(1)
  except Exception: out = None
  _GN_CACHE[url] = out
  return out
def sitemap_urls(url: str, depth: int = 0) -> list[dict]:
  """Recursively expand a sitemap index → [{loc, lastmod}]."""
  st, body = get(url, _skip_robots=True)
  if st != 200: return []
  out = []
  if "<sitemapindex" in body:
    for loc in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", body):
      if depth < 3: out.extend(sitemap_urls(loc.strip(), depth + 1))
  else:
    for m in re.finditer(r"<url>(.*?)</url>", body, re.S):
      loc = re.search(r"<loc>\s*([^<\s]+)\s*</loc>", m.group(1)); lm = re.search(r"<lastmod>\s*([^<\s]+)\s*</lastmod>", m.group(1))
      if loc: out.append({"loc": html.unescape(loc.group(1).strip()), "lastmod": lm.group(1).strip() if lm else None})
  return out
def youtube_meta(video_url: str) -> dict | None:
  """Title / channel / upload date / description for a YouTube video via the watch page (+ transcript via youtube_transcript_api when installed)."""
  st, body = get(video_url, _skip_robots=True)
  if st != 200: return None
  title = html_title(body); chan = None
  if True:
    try:
      so, ob = get("https://www.youtube.com/oembed?url=" + urllib.parse.quote(video_url, safe="") + "&format=json", _skip_robots=True)
      if so == 200:
        oj = json.loads(ob); title = oj.get("title") or (None if title in ("- YouTube", "YouTube") else title); chan = oj.get("author_name")
    except Exception: pass
  m = re.search(r'"ownerChannelName":"([^"]+)"', body) or re.search(r'"author":"([^"]+)"', body)
  chan = chan or (m.group(1) if m else None)
  d = re.search(r'"(?:uploadDate|publishDate)":"([^"]+)"', body); desc = re.search(r'"shortDescription":"((?:[^"\\]|\\.)*)"', body)
  text = ""
  if desc:
    try: text = json.loads('"' + desc.group(1) + '"')
    except Exception: text = desc.group(1)
  vid = (re.search(r"[?&]v=([\w-]{6,})", video_url) or re.search(r"youtu\.be/([\w-]{6,})", video_url) or [None, None])[1]
  transcript = None
  if vid:
    try:
      from youtube_transcript_api import YouTubeTranscriptApi  # type: ignore
      try: segs = YouTubeTranscriptApi().fetch(vid)
      except Exception: segs = YouTubeTranscriptApi.get_transcript(vid)
      transcript = " ".join((s.text if hasattr(s, "text") else s["text"]) for s in segs)
    except Exception: transcript = None
  return {"title": title, "channel": chan, "published_at": iso_date(d.group(1)) if d else None, "description": text, "transcript": transcript, "video_id": vid, "http_status": st}

if __name__ == "__main__":
  print(json.dumps({"stage": STAGE, "registers": registers_for("Eduardo Saverin's B Capital raises $750m; Raj Ganguly and Karan Mohla comment"), "canon": canonical("https://www.forbes.com/sites/x/2024/03/20/story/?utm_source=a&sh=1"), "date": iso_date("Tue, 19 Mar 2024 10:00:00 GMT")}))
