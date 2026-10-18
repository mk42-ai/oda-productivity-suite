#!/usr/bin/env python3
"""Mass news sweep for the four B Capital subjects. Writes raw/<collector>.jsonl, rate-limited, resumable."""
import json, re, sys, time, hashlib, urllib.parse, urllib.request, html, datetime as dt, os, random
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
OUT = "/tmp/sweep/raw"
SUBJECTS = {
  "eduardo-saverin": ['"Eduardo Saverin"', '"Saverin" "B Capital"', '"Eduardo Saverin" Facebook', '"Eduardo Saverin" Singapore', '"Saverin" Meta stake', '"Eduardo Saverin" investor', 'Eduardo Saverin billionaire', '"Eduardo Saverin" fund'],
  "raj-ganguly": ['"Raj Ganguly"', '"Raj Ganguly" "B Capital"', '"Raj Ganguly" venture', '"Raj Ganguly" CNBC', '"Raj Ganguly" AI', '"Ganguly" "B Capital" co-CEO'],
  "karan-mohla": ['"Karan Mohla"', '"Karan Mohla" "B Capital"', '"Karan Mohla" Chiratae', '"Karan Mohla" India startup', '"Mohla" "B Capital" partner', '"Karan Mohla" investment'],
  "b-capital": ['"B Capital Group"', '"B Capital" venture fund', '"B Capital" raises', '"B Capital" led round', '"B Capital" Series', '"B Capital" Ascent', '"B Capital" Opportunities Fund', '"B Capital" Growth Fund', '"B Capital" portfolio', '"B Capital" BCG', '"B Capital" AI investment', '"B Capital" Asia'],
}
def get(url, timeout=25, retries=2):
  for i in range(retries + 1):
    try:
      req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
      with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
      if e.code == 429: time.sleep(8 + 4 * i); continue
      return e.code, ""
    except Exception:
      time.sleep(2 + 2 * i)
  return 0, ""
def emit(f, rec):
  f.write(json.dumps(rec, ensure_ascii=False) + "\n"); f.flush()
def rss_items(xml):
  out = []
  for m in re.finditer(r"<item>(.*?)</item>", xml, re.S):
    it = m.group(1)
    g = lambda tag: (re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", it, re.S) or [None, ""])[1]
    title = html.unescape(re.sub(r"<!\[CDATA\[|\]\]>", "", g("title"))).strip()
    link = html.unescape(re.sub(r"<!\[CDATA\[|\]\]>", "", g("link"))).strip()
    if not link:
      lm = re.search(r"<link>([^<]+)", it) or re.search(r"<link[^>]*href=\"([^\"]+)", it)
      link = lm.group(1).strip() if lm else ""
    pub = g("pubDate").strip()
    src = html.unescape(re.sub(r"<[^>]+>", "", g("source"))).strip()
    srcurl = (re.search(r'<source url="([^"]+)"', it) or [None, ""])[1]
    desc = html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<!\[CDATA\[|\]\]>", "", g("description")))).strip()
    out.append({"title": title, "url": link, "published_at": pub, "publisher": src, "publisher_url": srcurl, "excerpt": desc[:400]})
  return out
def month_windows(start="2015-01-01", end="2026-10-18", step_months=6):
  d = dt.date.fromisoformat(start); e = dt.date.fromisoformat(end); out = []
  while d < e:
    m = d.month - 1 + step_months; y = d.year + m // 12; m = m % 12 + 1
    nd = min(dt.date(y, m, 1), e); out.append((d.isoformat(), nd.isoformat())); d = nd
  return out
def google_news(subject, queries, windows):
  path = f"{OUT}/gnews-{subject}.jsonl"; done = set()
  if os.path.exists(path):
    for l in open(path): 
      try: done.add(json.loads(l)["_q"])
      except: pass
  with open(path, "a") as f:
    for q in queries:
      for (a, b) in windows:
        key = f"{q}|{a}|{b}"
        if key in done: continue
        url = "https://news.google.com/rss/search?q=" + urllib.parse.quote(f"{q} after:{a} before:{b}") + "&hl=en-US&gl=US&ceid=US:en"
        st, body = get(url)
        items = rss_items(body) if st == 200 else []
        for it in items: emit(f, {**it, "subject": subject, "collector": "google-news-rss", "_q": key, "fetched_at": dt.datetime.utcnow().isoformat() + "Z"})
        emit(f, {"_q": key, "_meta": True, "status": st, "n": len(items)})
        print(f"gnews {subject} {q[:30]} {a}..{b} -> {st} {len(items)}", flush=True)
        time.sleep(1.2 + random.random())
def bing_news(subject, queries):
  path = f"{OUT}/bing-{subject}.jsonl"
  with open(path, "a") as f:
    for q in queries:
      for extra in ["", " news", " fund", " 2025", " 2024", " 2023", " interview"]:
        url = "https://www.bing.com/news/search?q=" + urllib.parse.quote(q + extra) + "&format=rss&count=100"
        st, body = get(url); items = rss_items(body) if st == 200 else []
        for it in items: emit(f, {**it, "subject": subject, "collector": "bing-news-rss", "fetched_at": dt.datetime.utcnow().isoformat() + "Z"})
        print(f"bing {subject} {q[:30]}{extra} -> {st} {len(items)}", flush=True)
        time.sleep(1.5)
def gdelt(subject, query):
  path = f"{OUT}/gdelt-{subject}.jsonl"; done = set()
  if os.path.exists(path):
    for l in open(path):
      try: done.add(json.loads(l)["_q"])
      except: pass
  with open(path, "a") as f:
    for (a, b) in month_windows("2017-01-01", "2026-10-18", 3):
      key = f"{query}|{a}|{b}"
      if key in done: continue
      sd = a.replace("-", "") + "000000"; ed = b.replace("-", "") + "000000"
      url = f"https://api.gdeltproject.org/api/v2/doc/doc?query={urllib.parse.quote(query)}&mode=artlist&maxrecords=250&format=json&startdatetime={sd}&enddatetime={ed}"
      st, body = get(url, retries=1)
      n = 0
      if st == 200 and body.strip().startswith("{"):
        try:
          for a_ in json.loads(body).get("articles", []):
            emit(f, {"title": a_.get("title"), "url": a_.get("url"), "published_at": a_.get("seendate"), "publisher": a_.get("domain"), "language": a_.get("language"), "country": a_.get("sourcecountry"), "subject": subject, "collector": "gdelt-doc-2.0", "_q": key, "fetched_at": dt.datetime.utcnow().isoformat() + "Z"}); n += 1
        except Exception as e: st = f"parse:{e}"
      emit(f, {"_q": key, "_meta": True, "status": st, "n": n})
      print(f"gdelt {subject} {a}..{b} -> {st} {n}", flush=True)
      time.sleep(6.5)
def bcapital_sitemaps():
  path = f"{OUT}/bcapital-sitemap.jsonl"
  with open(path, "w") as f:
    st, idx = get("https://b.capital/sitemap_index.xml")
    maps = re.findall(r"<loc>([^<]+)</loc>", idx)
    for m in maps:
      st, body = get(m)
      for u, lm in re.findall(r"<url>\s*<loc>([^<]+)</loc>(?:\s*<lastmod>([^<]+)</lastmod>)?", body, re.S):
        emit(f, {"url": html.unescape(u), "lastmod": lm, "sitemap": m, "collector": "bcapital-sitemap", "fetched_at": dt.datetime.utcnow().isoformat() + "Z"})
      print(f"sitemap {m} -> {st}", flush=True); time.sleep(1)
def wayback():
  path = f"{OUT}/wayback-bcapital.jsonl"
  with open(path, "w") as f:
    for pat in ["b.capital/insights/*", "b.capital/news-article/*", "b.capital/why-we-invested/*", "bcapgroup.com/*"]:
      st, body = get(f"https://web.archive.org/cdx/search/cdx?url={urllib.parse.quote(pat)}&output=json&fl=original,timestamp&filter=statuscode:200&collapse=urlkey&limit=3000", timeout=60, retries=1)
      n = 0
      if st == 200 and body.startswith("["):
        for row in json.loads(body)[1:]:
          emit(f, {"url": row[0], "first_seen": row[1], "collector": "wayback-cdx", "pattern": pat}); n += 1
      print(f"wayback {pat} -> {st} {n}", flush=True); time.sleep(3)
if __name__ == "__main__":
  which = sys.argv[1]
  if which == "gnews":
    w = month_windows("2015-01-01", "2026-10-18", 6)
    for s in ["eduardo-saverin", "raj-ganguly", "karan-mohla", "b-capital"]: google_news(s, SUBJECTS[s], w)
  elif which == "gnews-dense":
    # second pass: 3-month windows for the two person subjects that need the most volume
    w = month_windows("2015-01-01", "2026-10-18", 3)
    for s in ["eduardo-saverin", "raj-ganguly", "karan-mohla"]: google_news(s, SUBJECTS[s][:3], w)
  elif which == "bing":
    for s in SUBJECTS: bing_news(s, SUBJECTS[s][:4])
  elif which == "gdelt":
    for s, q in [("eduardo-saverin", '"Eduardo Saverin"'), ("raj-ganguly", '"Raj Ganguly"'), ("karan-mohla", '"Karan Mohla"'), ("b-capital", '"B Capital"')]: gdelt(s, q)
  elif which == "sitemap": bcapital_sitemaps()
  elif which == "wayback": wayback()

EXTRA = {
  "raj-ganguly": ['Raj Ganguly B Capital', 'Raj Ganguly investor', 'Raj Ganguly Bain Capital', '"Ganguly" "B Capital"', 'Raj Ganguly Singapore', 'Raj Ganguly Icertis', 'Raj Ganguly AI investing', 'Raj Ganguly Davos', 'Raj Ganguly fund', 'Raj Ganguly startup', '"Raj Ganguly" Forbes', '"Raj Ganguly" Bloomberg', '"Raj Ganguly" podcast', '"Raj Ganguly" healthcare'],
  "karan-mohla": ['Karan Mohla B Capital', 'Karan Mohla investor', 'Karan Mohla Chiratae Ventures', 'Karan Mohla IDG Ventures', 'Karan Mohla India', 'Karan Mohla startup', 'Karan Mohla Southeast Asia', 'Karan Mohla SolarSquare', 'Karan Mohla MoEngage', 'Karan Mohla Bhanzu', 'Karan Mohla fintech', 'Karan Mohla AI', '"Karan Mohla" YourStory', '"Karan Mohla" Economic Times', '"Karan Mohla" Mint', '"Karan Mohla" Inc42', '"Karan Mohla" VCCircle', '"Karan Mohla" Entrackr'],
  "b-capital": ['"B Capital" Saverin', '"B Capital" unicorn', '"B Capital" IPO', '"B Capital" exit', '"B Capital" India', '"B Capital" Singapore', '"B Capital" healthcare', '"B Capital" fintech', '"B Capital" climate', '"B Capital" robotics', '"B Capital" Apptronik', '"B Capital" Fervo', '"B Capital" Meesho', '"B Capital" Byju', '"B Capital" Ninja Van', '"B Capital" PharmEasy', '"B Capital" Icertis', '"B Capital" Labelbox', '"B Capital" Goodfire', '"B Capital" Insilico', '"B Capital" Flutterwave', '"B Capital" Writer', '"B Capital" Perplexity', '"B Capital" co-led', '"B Capital" participated', '"B Capital" Los Angeles', '"B Capital" Howard Morgan', '"B Capital" Jeff Johnson', '"B Capital" Rich Lesser', '"B Capital" CEO summit'],
  "eduardo-saverin": ['"Eduardo Saverin" B Capital', '"Eduardo Saverin" Meta', '"Eduardo Saverin" philanthropy', '"Eduardo Saverin" Liverpool', '"Eduardo Saverin" NTU', '"Eduardo Saverin" wedding', '"Eduardo Saverin" citizenship', '"Eduardo Saverin" Brazil', '"Eduardo Saverin" Forbes', '"Eduardo Saverin" startup', '"Eduardo Saverin" Asia'],
}
def gnews_simple(subject, queries, path_tag):
  path = f"{OUT}/gnews-{subject}-{path_tag}.jsonl"
  with open(path, "a") as f:
    for q in queries:
      for suffix in ["", " when:5y", " when:10y"]:
        url = "https://news.google.com/rss/search?q=" + urllib.parse.quote(q + suffix) + "&hl=en-US&gl=US&ceid=US:en"
        st, body = get(url); items = rss_items(body) if st == 200 else []
        for it in items: emit(f, {**it, "subject": subject, "collector": "google-news-rss", "_q": q + suffix, "fetched_at": dt.datetime.utcnow().isoformat() + "Z"})
        print(f"gnews-extra {subject} {q[:34]}{suffix} -> {st} {len(items)}", flush=True)
        time.sleep(1.2 + random.random())
      for region in [("en-IN", "IN", "IN:en"), ("en-SG", "SG", "SG:en"), ("en-GB", "GB", "GB:en")]:
        url = "https://news.google.com/rss/search?q=" + urllib.parse.quote(q) + f"&hl={region[0]}&gl={region[1]}&ceid={region[2]}"
        st, body = get(url); items = rss_items(body) if st == 200 else []
        for it in items: emit(f, {**it, "subject": subject, "collector": "google-news-rss", "_q": f"{q}|{region[1]}", "fetched_at": dt.datetime.utcnow().isoformat() + "Z"})
        time.sleep(1.2 + random.random())
if __name__ == "__main__" and sys.argv[1] == "extra":
  for s in ["raj-ganguly", "karan-mohla", "b-capital", "eduardo-saverin"]: gnews_simple(s, EXTRA[s], "extra")
if __name__ == "__main__" and sys.argv[1] == "gdelt2":
  for s, q in [("raj-ganguly", '"Raj Ganguly"'), ("karan-mohla", '"Karan Mohla"'), ("b-capital", '"B Capital Group"')]: gdelt(s, q)
MORE = {
  "raj-ganguly": ['Ganguly B Capital', '"B Capital" co-CEO', '"B Capital" co-founder Ganguly', 'Raj Ganguly Bloomberg TV', 'Raj Ganguly CNBC Asia', 'Raj Ganguly TechCrunch', 'Raj Ganguly Fortune', 'Raj Ganguly WSJ', 'Raj Ganguly Business Insider', 'Raj Ganguly Axios', 'Raj Ganguly "The Information"', 'Raj Ganguly PitchBook', 'Raj Ganguly DealStreetAsia', 'Raj Ganguly Nikkei', 'Raj Ganguly Economic Times', 'Raj Ganguly Mint', 'Raj Ganguly Straits Times', 'Raj Ganguly Business Times', 'Raj Ganguly Forbes Asia', 'Raj Ganguly "Opportunities Fund"', 'Raj Ganguly "Growth Fund"', 'Raj Ganguly Apptronik', 'Raj Ganguly Fervo', 'Raj Ganguly Meesho', 'Raj Ganguly Byju', 'Raj Ganguly Ninja Van', 'Raj Ganguly Labelbox', 'Raj Ganguly Goodfire', 'Raj Ganguly healthcare AI', 'Raj Ganguly defense tech', 'Raj Ganguly climate', 'Raj Ganguly Miami', 'Raj Ganguly LA500', 'Raj Ganguly Harvard Business School', 'Raj Ganguly Wharton', 'Raj Ganguly Diageo', 'Raj Ganguly McKinsey', '"Raj Ganguly" 2026', '"Raj Ganguly" 2025', '"Raj Ganguly" 2024', '"Raj Ganguly" 2023', '"Raj Ganguly" 2022', '"Raj Ganguly" 2021', '"Raj Ganguly" 2020', '"Raj Ganguly" 2019', '"Raj Ganguly" 2018', '"Raj Ganguly" 2017', '"Raj Ganguly" 2016'],
  "karan-mohla": ['Mohla B Capital', 'Karan Mohla general partner', 'Karan Mohla partner B Capital India', 'Karan Mohla IDG Ventures India', 'Karan Mohla FirstCry', 'Karan Mohla Xpressbees', 'Karan Mohla HealthifyMe', 'Karan Mohla Lenskart', 'Karan Mohla Myntra', 'Karan Mohla Policybazaar', 'Karan Mohla Curefit', 'Karan Mohla Rentomojo', 'Karan Mohla Uniphore', 'Karan Mohla Sugar.fit', 'Karan Mohla Turno', 'Karan Mohla Nektar', 'Karan Mohla Carro', 'Karan Mohla Eureka Robotics', 'Karan Mohla space tech', 'Karan Mohla deeptech', 'Karan Mohla climate', 'Karan Mohla Bengaluru', 'Karan Mohla Singapore', 'Karan Mohla INSEAD', 'Karan Mohla Michigan Ross', 'Karan Mohla QVT', 'Karan Mohla Jefferies', 'Karan Mohla 40 under 40', 'Karan Mohla Business World', 'Karan Mohla IAAIF', 'Karan Mohla TiE', 'Karan Mohla SaaSBoomi', 'Karan Mohla Nasscom', 'Karan Mohla podcast', 'Karan Mohla interview', 'Karan Mohla quote', '"Karan Mohla" 2026', '"Karan Mohla" 2025', '"Karan Mohla" 2024', '"Karan Mohla" 2023', '"Karan Mohla" 2022', '"Karan Mohla" 2021', '"Karan Mohla" 2020', '"Karan Mohla" 2019', '"Karan Mohla" 2018', '"Karan Mohla" 2017', '"Karan Mohla" 2016', '"Karan Mohla" 2015'],
}
def bing_more(subject, queries):
  path = f"{OUT}/bing-{subject}-extra.jsonl"
  with open(path, "a") as f:
    for q in queries:
      for mkt in ["en-US", "en-IN", "en-SG", "en-GB"]:
        url = "https://www.bing.com/news/search?q=" + urllib.parse.quote(q) + f"&format=rss&count=100&setmkt={mkt}"
        st, body = get(url); items = rss_items(body) if st == 200 else []
        for it in items: emit(f, {**it, "subject": subject, "collector": "bing-news-rss", "fetched_at": dt.datetime.utcnow().isoformat() + "Z"})
        print(f"bing-more {subject} {q[:30]} {mkt} -> {st} {len(items)}", flush=True)
        time.sleep(1.0)
if __name__ == "__main__" and sys.argv[1] == "more":
  for s in ["raj-ganguly", "karan-mohla"]: gnews_simple(s, MORE[s], "extra2")
if __name__ == "__main__" and sys.argv[1] == "bingmore":
  for s in ["raj-ganguly", "karan-mohla"]: bing_more(s, MORE[s])
MORE2 = {
  "raj-ganguly": ['Ganguly "B Capital Group"', '"B Capital" Ganguly says', '"B Capital" Ganguly said', '"B Capital" co-founder and co-CEO', '"B Capital" "Raj"', 'Raj Ganguly venture capital Asia', 'Raj Ganguly Southeast Asia startups', 'Raj Ganguly India startups', 'Raj Ganguly China investment', 'Raj Ganguly enterprise software', 'Raj Ganguly insurtech', 'Raj Ganguly digital health', 'Raj Ganguly logistics startup', 'Raj Ganguly Series B led', 'Raj Ganguly funding round', 'Raj Ganguly unicorn', 'Raj Ganguly IPO', 'Raj Ganguly exit', 'Raj Ganguly board', 'Raj Ganguly keynote', 'Raj Ganguly fireside', 'Raj Ganguly Web Summit', 'Raj Ganguly Collision', 'Raj Ganguly Milken', 'Raj Ganguly SuperReturn', 'Raj Ganguly Bloomberg Invest', 'Raj Ganguly Fortune Brainstorm', 'Raj Ganguly Forbes Under 30 Summit', 'Raj Ganguly TechCrunch Disrupt', 'Raj Ganguly Slush'],
  "karan-mohla": ['Mohla "B Capital Group"', '"B Capital" Mohla says', '"B Capital" Mohla said', '"B Capital" India partner', '"B Capital" India general partner', 'Karan Mohla early stage India', 'Karan Mohla Ascent fund', 'Karan Mohla seed investment', 'Karan Mohla Series A India', 'Karan Mohla edtech', 'Karan Mohla healthtech', 'Karan Mohla D2C', 'Karan Mohla SaaS India', 'Karan Mohla logistics', 'Karan Mohla electric vehicles', 'Karan Mohla cleantech', 'Karan Mohla Nikkei', 'Karan Mohla Forbes India', 'Karan Mohla Moneycontrol', 'Karan Mohla Inc42', 'Karan Mohla YourStory', 'Karan Mohla Entrackr', 'Karan Mohla The Ken', 'Karan Mohla ET Now', 'Karan Mohla CNBC-TV18', 'Karan Mohla Business Standard', 'Karan Mohla Hindu BusinessLine', 'Karan Mohla DealStreetAsia', 'Karan Mohla Tech in Asia', 'Karan Mohla e27'],
}
if __name__ == "__main__" and sys.argv[1] == "more2":
  for s in ["raj-ganguly", "karan-mohla"]: gnews_simple(s, MORE2[s], "extra3")
if __name__ == "__main__" and sys.argv[1] == "bingmore2":
  for s in ["raj-ganguly", "karan-mohla"]: bing_more(s, MORE2[s])
