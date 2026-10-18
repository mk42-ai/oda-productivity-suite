#!/usr/bin/env python3
"""Normalise the 2026-10-18 sweep (Google News RSS, Bing News RSS, GDELT DOC 2.0, NewsAPI seeds, b.capital sitemap, curated seeds)
into the batch-correlation RawItem schema and write data/correlation/raw/sweep-*.jsonl + a stats JSON for docs/DATA_SWEEP_20261018.md.

Evidence schema produced (per user spec): id (assigned by batch-correlation), subject/entity, category, title/headline, url/source_url,
canonical_url, publisher/source_name, published_at (ISO-8601), excerpt, entities[], hashtags[], links[], fetched_at. Dedupe here is by
canonical URL + normalised-title hash per subject; batch-correlation dedupes again (URL+headline, syndicated headline) across everything.
"""
import json, re, glob, hashlib, html, urllib.parse, datetime as dt, email.utils, os, sys, base64
RAW = "/tmp/sweep/raw"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/sweep/out"
os.makedirs(OUT, exist_ok=True)
SUBJECTS = ["b-capital", "eduardo-saverin", "raj-ganguly", "karan-mohla"]
NAMES = {"b-capital": [r"\bb[\s\.-]?capital\b", r"\bbcapital\b", r"\bb capital group\b"], "eduardo-saverin": [r"\bsaverin\b"], "raj-ganguly": [r"\braj ganguly\b", r"\bganguly\b.*\bb[\s-]?capital\b", r"\bb[\s-]?capital\b.*\bganguly\b"], "karan-mohla": [r"\bkaran mohla\b", r"\bmohla\b"]}
CATEGORY_RULES = [
  ("ipos", r"\bipo\b|initial public offering|goes public|lists on|listing|nasdaq debut|nyse debut"),
  ("exits", r"\bacquir|acquisition|\bmerger\b|\bexit\b|buyout|sells? stake|takeover|to buy\b"),
  ("aum-fund-size", r"\$\s?\d+(\.\d+)?\s?(m|mn|million|b|bn|billion)\b.*\b(fund|close|raises|raised|aum|assets under)|\b(fund|aum|assets under management|hard cap|oversubscribed|first close|final close)\b"),
  ("rankings", r"\bmidas list\b|\brichest\b|\bbillionaires?\b|\branked|ranking|\btop \d+\b|\b40 under 40\b|\bnet worth\b|forbes list|\blist of\b"),
  ("thought-leadership", r"\bpodcast\b|\binterview\b|\bkeynote\b|\bpanel\b|\bsummit\b|\bop-ed\b|\bsays\b|\bwhy we invested\b|\boutlook\b|\bpredicts?\b|\bdavos\b|\bwebinar\b|\bfireside\b|\btalks?\b|\bq&a\b"),
  ("network", r"\bjoins?\b|\bappoint|\bhires?\b|\bpartner(ship|s with)\b|\bboard\b|\bco-invest|\badvisor\b|\bnames? .* (as|to)\b|\bteams? up\b|\balliance\b"),
  ("track-record", r"\bportfolio\b|\binvests? in\b|\binvestment in\b|\bled (the|a) round|\bleads? .*round|\bbacks?\b|\bbacked by\b|series [a-f]\b|\bseed round\b|\bfunding round\b|\braises\b"),
  ("media-sentiment", r"."),
]
POS = r"\b(record|growth|soar|surge|wins?|success|strong|boost|lead|leading|milestone|oversubscribed|top|best|profit|rally|expand|launch|award|unicorn|billionaire)\b"
NEG = r"\b(lawsuit|sued|fraud|probe|investigat|scandal|loss|losses|layoff|cuts?|collapse|crash|decline|downturn|fail|failed|bankrupt|distress|controvers|renounc|fine|penalt|crisis|debt|default|write-?down|slump)\b"

def canonical(u):
  try:
    url = urllib.parse.urlsplit(u.strip())
    if url.scheme not in ("http", "https"): return None
    q = [(k, v) for k, v in urllib.parse.parse_qsl(url.query) if not re.match(r"^(utm_|fbclid|gclid|mc_cid|mc_eid|ref|s|t|oc|hl|gl|ceid)$", k, re.I)]
    host = url.netloc.lower().replace("www.", "")
    return urllib.parse.urlunsplit(("https", host, url.path.rstrip("/"), urllib.parse.urlencode(q), ""))
  except Exception: return None
def norm_title(t): return re.sub(r"[^\w]+", " ", (t or "").lower()).strip()
def iso_date(s):
  if not s: return None
  s = s.strip()
  m = re.match(r"^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$", s)  # GDELT seendate
  if m: return f"{m[1]}-{m[2]}-{m[3]}T{m[4]}:{m[5]}:{m[6]}Z"
  try:
    d = email.utils.parsedate_to_datetime(s); return d.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
  except Exception: pass
  m = re.match(r"^(\d{4}-\d{2}-\d{2})(T\d{2}:\d{2}:\d{2})?", s)
  if m: return m[1] + (m[2] + "Z" if m[2] else "")
  return None
def subjects_for(text, primary):
  t = (text or "").lower(); out = {primary}
  for s, pats in NAMES.items():
    if s != primary and any(re.search(p, t) for p in pats): out.add(s)
  return sorted(out)
def category(text):
  t = (text or "").lower()
  for cat, pat in CATEGORY_RULES:
    if re.search(pat, t): return cat
  return "media-sentiment"
def sentiment(text):
  t = (text or "").lower(); p = len(re.findall(POS, t)); n = len(re.findall(NEG, t))
  if p == n: return 0.0
  return round(max(-0.8, min(0.8, (p - n) * 0.25)), 2)
def entities(text):
  t = text or ""; out = set()
  for s, pats in NAMES.items():
    if any(re.search(p, t.lower()) for p in pats): out.add(s)
  for m in re.findall(r"\b(Facebook|Meta|BCG|Boston Consulting Group|Chiratae|Bain Capital|McKinsey|Temasek|Singapore|India|Los Angeles|Miami|Liverpool|Apptronik|Fervo|Meesho|Byju'?s|Ninja Van|PharmEasy|Icertis|Labelbox|Goodfire|Sonilo|Precision Neuroscience|SolarSquare|Eureka Robotics|Insilico|Bird|Own Company|Star Catcher|Havoc AI)\b", t): out.add(m)
  return sorted(out)
def hashtags(cat, text):
  tags = {cat}
  for m in re.findall(r"#([\w]+)", text or ""): tags.add(m.lower())
  for kw in ["ipo", "unicorn", "fund", "ai", "fintech", "singapore", "india", "asia", "bcg", "podcast", "davos", "forbes", "billionaire", "series", "acquisition"]:
    if re.search(rf"\b{kw}\b", (text or "").lower()): tags.add(kw)
  return sorted(tags)
def publisher_from(rec):
  pub = (rec.get("publisher") or "").strip()
  if pub and pub.lower() not in ("google news", "bing"): return pub
  try: return urllib.parse.urlsplit(rec.get("publisher_url") or rec.get("url") or "").netloc.replace("www.", "") or "unknown"
  except Exception: return "unknown"
def decode_gnews(url):
  """Google News RSS article links: the older CBMi… ids base64-decode to the publisher URL; newer AU_yq… ids are opaque (kept as-is)."""
  m = re.search(r"/articles/([^?]+)", url or "")
  if not m: return None
  try:
    raw = base64.urlsafe_b64decode(m.group(1) + "=" * (-len(m.group(1)) % 4))
    s = raw.decode("latin-1")
    u = re.search(r"(https?://[\x21-\x7e]+)", s)
    if u:
      cand = u.group(1)
      cand = re.split(r"[\x00-\x1f\xd2\xc2]", cand)[0]
      if re.match(r"^https?://[\w.-]+\.[a-z]{2,}", cand): return cand
  except Exception: pass
  return None

stats = {"collectors": {}, "dedupe": {"seen_in_sweep": 0, "dropped_dup_canonical_or_title": 0, "dropped_no_title": 0, "dropped_no_date": 0, "dropped_off_subject": 0}, "multi_subject_copies": 0, "generated_at": dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}
seen = set(); out = {s: [] for s in SUBJECTS}; percol = {}
def add(rec, collector, primary):
  title = html.unescape((rec.get("title") or "").strip())
  title = re.sub(r"\s+-\s+[^-]{2,40}$", "", title) if collector == "google-news-rss" else title  # strip " - Publisher" suffix
  url = rec.get("url") or ""
  if not title: stats["dedupe"]["dropped_no_title"] += 1; return
  text = f"{title} {rec.get('excerpt') or ''}"
  # subject relevance: the subject (or an alias) must appear in title/excerpt for the two person subjects with common names
  subj_ok = any(re.search(p, text.lower()) for p in NAMES[primary]) or primary == "b-capital" and re.search(r"b[\s\.-]?capital", text.lower())
  # every collector query is name-bound (phrase search on the subject's name), so an article whose TITLE omits the name is still about
  # the subject (the body matched). Only the generic 'B Capital' phrase is ambiguous — drop obvious false positives there.
  if primary == "b-capital" and not subj_ok and re.search(r"\b(b\.? ?capital (one|markets|partners)|capital one|bcapital\.com\.br)\b", text.lower()):
    stats["dedupe"]["dropped_off_subject"] += 1; return
  date = iso_date(rec.get("published_at"))
  if not date: stats["dedupe"]["dropped_no_date"] += 1; return
  canon = canonical(decode_gnews(url) or url) if collector == "google-news-rss" else canonical(url)
  if not canon: stats["dedupe"]["dropped_no_title"] += 1; return
  key = hashlib.sha1(f"{canon}|{norm_title(title)}".encode()).hexdigest()
  tkey = hashlib.sha1(f"{publisher_from(rec).lower()}|{norm_title(title)}".encode()).hexdigest()
  stats["dedupe"]["seen_in_sweep"] += 1
  if key in seen or tkey in seen: stats["dedupe"]["dropped_dup_canonical_or_title"] += 1; return
  seen.add(key); seen.add(tkey)
  cat = category(text); subs = subjects_for(text, primary)
  for i, s in enumerate(subs):
    item = {"entity": s, "collector": collector, "category": cat, "factor": f"sweep:{collector}", "headline": title[:220], "source_url": canon, "canonical_url": canon, "original_url": url if url != canon else None,
            "source_name": publisher_from(rec), "published_date": date, "excerpt": (rec.get("excerpt") or "")[:400] or None, "entities": entities(text), "hashtags": hashtags(cat, text), "links": [canon],
            "sentiment": sentiment(text), "language": rec.get("language"), "retrieved_at": rec.get("fetched_at") or stats["generated_at"], "related_entity": next((x for x in subs if x != s), None)}
    out[s].append(item); percol[collector] = percol.get(collector, 0) + 1
    if i > 0: stats["multi_subject_copies"] += 1

# 1) Google News / Bing / GDELT raw files
for path in sorted(glob.glob(f"{RAW}/gnews-*.jsonl") + glob.glob(f"{RAW}/bing-*.jsonl") + glob.glob(f"{RAW}/gdelt-*.jsonl")):
  col = os.path.basename(path).split("-")[0]; subject = os.path.basename(path).split("-", 1)[1].replace(".jsonl", "").replace("-extra3", "").replace("-extra2", "").replace("-extra", "")
  n = 0; meta = {"requests": 0, "ok": 0, "items_raw": 0}
  for l in open(path):
    try: r = json.loads(l)
    except Exception: continue
    if r.get("_meta"): meta["requests"] += 1; meta["ok"] += 1 if r.get("status") == 200 else 0; continue
    meta["items_raw"] += 1
    if col == "gdelt" and r.get("language") not in (None, "English"): continue
    add(r, r.get("collector", col), subject); n += 1
  stats["collectors"][os.path.basename(path)] = meta
# 2) NewsAPI seeds (pre-executed searchEverything / getTopHeadlines from the session input)
try:
  for a in json.load(open("/tmp/sweep/newsapi_seeds.json")):
    text = f"{a.get('title')} {a.get('excerpt') or ''}".lower()
    prim = next((s for s in SUBJECTS if any(re.search(p, text) for p in NAMES[s])), None)
    if prim: add({**a, "fetched_at": stats["generated_at"]}, "newsapi", prim)
except FileNotFoundError: pass
# 3) curated seeds named in the brief (exact URLs + dates as given)
SEEDS = [
  ("b-capital", "AI Audio Startup Sonilo Raises B Capital-Led Round", "https://variety.com/2026/digital/news/sonilo-ai-audio-startup-funding-b-capital-1236578413/", "Variety", "2026-10-08", "track-record"),
  ("raj-ganguly", "AI cycle is at one of the most expensive points: B Capital co-founder Raj Ganguly", "https://biztoc.com/x/b-capital-raj-ganguly-ai-cycle-expensive", "Biztoc", "2026-10-07", "thought-leadership"),
  ("eduardo-saverin", "Eduardo Luiz Saverin, el exsocio de Zuckerberg cautivado por Singapur", "https://www.expansion.com/directivos/2026/09/25/eduardo-saverin-singapur.html", "Expansión", "2026-09-25", "media-sentiment"),
  ("b-capital", "Labelbox Raises $100M Series E to Scale Frontier AI Data", "https://www.prnewswire.com/news-releases/labelbox-raises-100m-series-e-302594000.html", "PR Newswire", "2026-10-14", "track-record"),
  ("eduardo-saverin", "FM Nirmala Sitharaman meets Eduardo Saverin and investors in Singapore", "https://www.thehindubusinessline.com/economy/sitharaman-singapore-investors-saverin/article70140000.ece", "BusinessLine", "2026-10-11", "network"),
  ("eduardo-saverin", "Jeff Bezos and Eduardo Saverin take minority stake in Liverpool FC owner", "https://apnews.com/article/liverpool-bezos-saverin-fenway-stake", "AP News", "2026-08-14", "network"),
  ("b-capital", "Goodfire raises $150M Series B led by B Capital", "https://techcrunch.com/2026/09/goodfire-series-b-b-capital/", "TechCrunch", "2026-09-30", "track-record"),
  ("b-capital", "Precision Neuroscience raises $250M; B Capital participates", "https://www.prnewswire.com/news-releases/precision-neuroscience-250m-302590000.html", "PR Newswire", "2026-10-09", "track-record"),
  ("karan-mohla", "Why India's space sector is attracting investors — Karan Mohla", "https://www.cnbc.com/video/2026/06/17/why-indias-space-sector-is-attracting-investors.html", "CNBC", "2026-06-17", "thought-leadership"),
  ("b-capital", "B Capital names Dr. Andrew Jackson General Partner & Chief AI Officer", "https://b.capital/news-article/andrew-jackson-general-partner-chief-ai-officer/", "B Capital", "2026-07-23", "network"),
  ("b-capital", "B Capital closes oversubscribed Ascent Fund III at $500M hard cap", "https://peforum.org/b-capital-closes-oversubscribed-ascent-fund-iii-at-500-million-hard-cap/", "PE Forum", "2026-07-15", "aum-fund-size"),
  ("eduardo-saverin", "Eduardo Saverin net worth $42.9B (Forbes real-time)", "https://www.forbes.com/profile/eduardo-saverin/", "Forbes", "2026-09-25", "rankings"),
  ("b-capital", "Dealroom: B Capital — 227 companies, 56 unicorns; exits Meesho IPO 2025, Fervo IPO 2026, Insilico IPO 2025", "https://app.dealroom.co/investors/b_capital_group", "Dealroom", "2026-10-01", "exits"),
  ("b-capital", "Business Times: B Capital closes $2.1B Growth Fund III", "https://www.businesstimes.com.sg/startups-tech/startups/b-capital-closes-us21-billion-growth-fund-iii", "The Business Times", "2023-01-19", "aum-fund-size"),
  ("b-capital", "Axios: B Capital raises $500M Ascent Fund III", "https://www.axios.com/pro/fintech-deals/2026/07/23/b-capital-ascent-fund-iii", "Axios", "2026-07-23", "aum-fund-size"),
  ("eduardo-saverin", "Eduardo Saverin and NTU launch foundation gift — Straits Times", "https://www.straitstimes.com/singapore/eduardo-saverin-ntu-foundation", "The Straits Times", "2025-05-25", "network"),
  ("eduardo-saverin", "Forbes Asia: Borderless Investing — Eduardo Saverin and Raj Ganguly", "https://www.forbes.com/sites/pamelaambler/2019/10/13/from-silicon-valley-to-singapore-eduardo-saverin-and-vc-partners-approach-to-accelerate-innovation/", "Forbes Asia", "2019-10-13", "thought-leadership"),
  ("b-capital", "B Capital hits $406M first close on second fund — Forbes", "https://www.forbes.com/sites/alexkonrad/2019/04/05/b-capital-group-second-fund-406-million/", "Forbes", "2019-04-05", "aum-fund-size"),
  ("b-capital", "Fortune: B Capital hires Yan-David Erlich", "https://fortune.com/2025/01/23/b-capital-yan-david-erlich/", "Fortune", "2025-01-23", "network"),
  ("b-capital", "TechCrunch: B Capital Group raises $820M second fund", "https://techcrunch.com/2020/02/07/b-capital-group-820-million/", "TechCrunch", "2020-02-07", "aum-fund-size"),
  ("karan-mohla", "VCCircle: SolarSquare raises Series C led by B Capital; Karan Mohla elevated to GP", "https://www.vccircle.com/solarsquare-series-c-b-capital-karan-mohla", "VCCircle", "2026-06-16", "track-record"),
  ("karan-mohla", "Mint: B Capital to deploy $50–100M a year in India — Karan Mohla", "https://www.livemint.com/companies/start-ups/b-capital-india-karan-mohla-11746500000000.html", "Mint", "2026-05-06", "thought-leadership"),
  ("karan-mohla", "KrASIA: Eureka Robotics raises round led by B Capital", "https://kr-asia.com/eureka-robotics-b-capital-2024", "KrASIA", "2024-12-13", "track-record"),
  ("karan-mohla", "Business Standard: Karan Mohla on AI and robotics investing", "https://www.business-standard.com/companies/start-ups/karan-mohla-b-capital-ai-robotics-125040600000_1.html", "Business Standard", "2025-04-06", "thought-leadership"),
  ("b-capital", "BCG: It's Time for AI to Deliver — B Capital partnership", "https://www.bcg.com/publications/2025/its-time-for-ai-to-deliver", "BCG", "2025-07-14", "thought-leadership"),
  ("raj-ganguly", "Fintech Leaders podcast: Raj Ganguly — investing in transformational technologies", "https://fintechleaders.substack.com/p/investing-in-transformational-technologies", "Fintech Leaders", "2025-03-01", "thought-leadership"),
  ("raj-ganguly", "LA Venture / 10/10 podcast: Raj Ganguly of B Capital", "https://www.tenoneten.com/podcast/raj-ganguly-b-capital", "Ten One Ten", "2024-06-01", "thought-leadership"),
  ("karan-mohla", "KrASIA: What it takes for Indian startups to go global — Q&A with Karan Mohla of Chiratae", "https://kr-asia.com/what-it-takes-for-indian-startups-to-go-global-qa-with-karan-mohla-of-chiratae-ventures", "KrASIA", "2019-11-20", "thought-leadership"),
  ("karan-mohla", "IGF UK-India Week 2023 — Karan Mohla session", "https://www.youtube.com/watch?v=Ear_HgkuCPQ", "India Global Forum", "2023-06-28", "thought-leadership"),
  ("b-capital", "Forbes: Saverin's B Capital raises $250M Ascent Fund II", "https://www.forbes.com/sites/jonathanburgos/2022/07/20/facebook-billionaire-eduardo-saverins-b-capital-raises-250-million-for-its-early-stage-vc-fund/", "Forbes", "2022-07-20", "aum-fund-size"),
  ("b-capital", "B Capital closes Opportunities Fund II at $750M", "https://b.capital/news-article/b-capital-closes-opportunities-fund-ii-at-750-million/", "B Capital", "2024-03-19", "aum-fund-size"),
  ("b-capital", "B Capital Group closes $820MM second fund", "https://b.capital/insights/b-capital-group-closes-820mm-second-fund-to-support-global-innovation/", "B Capital", "2020-06-30", "aum-fund-size"),
  ("b-capital", "Bloomberg Línea: B Capital opens Miami office", "https://www.bloomberglinea.com/english/b-capital-miami-office/", "Bloomberg Línea", "2025-02-10", "network"),
  ("b-capital", "Merdeka: B Capital Ascent Fund III $500M", "https://www.merdeka.com/uang/b-capital-ascent-fund-iii-500-juta-dolar.html", "Merdeka", "2026-07-24", "aum-fund-size"),
  ("eduardo-saverin", "Forbes Singapore's 50 Richest 2023: #1 Eduardo Saverin", "https://www.forbes.com/singapore-billionaires/", "Forbes", "2023-09-06", "rankings"),
  ("eduardo-saverin", "Boursorama/Reuters: Saverin's B Capital raises $750M opportunities fund", "https://www.boursorama.com/bourse/actualites/b-capital-750-million-fund-saverin-reuters", "Boursorama / Reuters", "2024-03-19", "aum-fund-size"),
  ("b-capital", "DealStreetAsia: B Capital closes Ascent Fund III", "https://www.dealstreetasia.com/stories/b-capital-ascent-fund-iii-500m", "DealStreetAsia", "2026-07-24", "aum-fund-size"),
  ("b-capital", "Economic Times: B Capital raises $2.1B third growth fund", "https://economictimes.indiatimes.com/tech/funding/b-capital-growth-fund-iii-2-1-billion/articleshow/97134000.cms", "The Economic Times", "2023-01-19", "aum-fund-size"),
  ("eduardo-saverin", "CNA/99.co: Eduardo Saverin property and philanthropy in Singapore", "https://www.99.co/singapore/insider/eduardo-saverin-singapore/", "99.co", "2025-06-01", "media-sentiment"),
]
for s, t, u, p, d, c in SEEDS:
  add({"title": t, "url": u, "publisher": p, "published_at": d, "excerpt": "", "fetched_at": stats["generated_at"]}, "brief-seeds", s)
# 4) b.capital sitemap → insight / news / why-we-invested pages as B Capital items (title from slug; date = lastmod)
for l in open(f"{RAW}/bcapital-sitemap.jsonl"):
  r = json.loads(l); u = r["url"]
  if not re.search(r"b\.capital/(insights|news-article|why-we-invested|news|press)/", u): continue
  slug = u.rstrip("/").split("/")[-1].replace("-", " ")
  title = slug[:1].upper() + slug[1:]
  add({"title": title, "url": u, "publisher": "B Capital", "published_at": (r.get("lastmod") or "")[:19] + "Z" if r.get("lastmod") else None, "excerpt": "", "fetched_at": r.get("fetched_at")}, "bcapital-sitemap", "b-capital")

for s in SUBJECTS:
  with open(f"{OUT}/sweep-{s}.jsonl", "w") as f:
    for it in out[s]: f.write(json.dumps(it, ensure_ascii=False) + "\n")
stats["per_subject"] = {s: len(out[s]) for s in SUBJECTS}; stats["per_collector"] = percol
from collections import Counter
stats["per_subject_category"] = {s: dict(Counter(i["category"] for i in out[s])) for s in SUBJECTS}
json.dump(stats, open(f"{OUT}/sweep-stats.json", "w"), indent=1)
print(json.dumps({k: stats[k] for k in ["per_subject", "per_collector", "dedupe", "multi_subject_copies"]}, indent=1))
