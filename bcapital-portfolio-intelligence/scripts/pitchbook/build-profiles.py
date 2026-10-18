#!/usr/bin/env python3
"""Build the PitchBook company profile store (data/pitchbook/profiles.json + web/src/data/pitchbook-profiles.json).

Sources, in priority order — every value carries {source, url, synced_at, plugin_id, document}; a field with no source stays null
(rendered as "Not available in PitchBook"). Nothing is inferred or invented.
  1. Backend PitchBook Investor Finder records   GET $PORTFOLIO_API_URL/pitchbook/<slug>      (plugin-1777018662)
  2. Committed snapshot                           web/src/data/pitchbook-snapshot.json          (per-field source URL + fetched_at)
  3. Portfolio research batch                     data/portfolio.json + data/people.json        (OnDemand chat-batch research)
  4. B Capital research documents (.docx/.pdf)   attached as excerpts to the companies they name (never used to fill numeric fields)
Usage: python3 scripts/pitchbook/build-profiles.py [--docs-dir /tmp/pbdocs] [--api http://127.0.0.1:4000]
"""
import argparse, json, os, re, sys, time, urllib.request, concurrent.futures as cf
from datetime import datetime, timezone
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIELDS = ["overview","hq","founded","status","employees","website","contact","last_financing_date","last_financing_size_usd","last_financing_type","post_money_valuation_usd","total_raised_usd","investors","deal_history","executives","board_members","competitors","similar_companies"]
PLUGIN = "plugin-1777018662"
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
ap = argparse.ArgumentParser(); ap.add_argument("--docs-dir", default="/tmp/pbdocs"); ap.add_argument("--api", default=os.environ.get("PORTFOLIO_API_URL") or "http://127.0.0.1:4000"); args = ap.parse_args()

def fld(value, source, synced_at, url=None, plugin_id=None, document=None):
    if value is None or value == "" or value == [] or value == "None": return None
    prov = {"source": source, "synced_at": synced_at}
    if url: prov["url"] = url
    if plugin_id: prov["plugin_id"] = plugin_id
    if document: prov["document"] = document
    return {"value": value, "provenance": prov}

portfolio = json.load(open(os.path.join(ROOT, "data/portfolio.json")))
people = json.load(open(os.path.join(ROOT, "data/people.json")))
ppl = people.get("people") if isinstance(people.get("people"), list) else []
snap = json.load(open(os.path.join(ROOT, "web/src/data/pitchbook-snapshot.json")))
snap_cos = snap.get("companies", {})

def get_api(slug):
    try:
        with urllib.request.urlopen(f"{args.api}/pitchbook/{slug}", timeout=20) as r: return json.load(r)
    except Exception as e: return {"_error": str(e)[:120]}
api = {}
with cf.ThreadPoolExecutor(8) as ex:
    for slug, res in zip([c["slug"] for c in portfolio["companies"]], ex.map(get_api, [c["slug"] for c in portfolio["companies"]])): api[slug] = res

# ---- research documents → paragraphs ----
docs = []
doc_urls = {}
try:
    for line in open("/tmp/wt9/tasks/a5-docs.txt"):
        n, u = line.split(None, 1); doc_urls[n] = u.strip().split("?")[0]
except Exception: pass
def paragraphs(path):
    if path.endswith(".docx"):
        import docx
        d = docx.Document(path); out = [p.text.strip() for p in d.paragraphs if p.text.strip()]
        for t in d.tables:
            for row in t.rows: out.append(" | ".join(c.text.strip() for c in row.cells if c.text.strip()))
        return out
    import fitz
    out = []
    with fitz.open(path) as d:
        for pg in d:
            for blk in pg.get_text("blocks"):
                t = re.sub(r"\s+", " ", blk[4]).strip()
                if len(t) > 40: out.append(t)
    return out
if os.path.isdir(args.docs_dir):
    for fn in sorted(os.listdir(args.docs_dir)):
        if fn.endswith((".docx", ".pdf")):
            try: docs.append({"document": fn, "url": doc_urls.get(fn), "paragraphs": paragraphs(os.path.join(args.docs_dir, fn))})
            except Exception as e: docs.append({"document": fn, "url": doc_urls.get(fn), "paragraphs": [], "error": str(e)[:120]})

def name_patterns(c):
    names = {c["name"]}
    base = re.sub(r"\s*\((.*?)\)\s*", " ", c["name"]).strip()
    for suf in [" Inc", " Inc.", " Ltd", " Limited", " AI", " Labs", " Technologies", " Health", " Energy"]:
        if base.endswith(suf) and len(base[: -len(suf)]) >= 5: names.add(base[: -len(suf)].strip())
    names.add(base)
    return [re.compile(r"(?<![\w-])" + re.escape(n) + r"(?![\w-])", re.I) for n in names if len(n) >= 4]
GENERIC = {"Forest", "Writer", "Deferred", "Nalu", "Level", "Seltz", "Shift"}  # ambiguous names: require an extra signal word nearby

research_hits = {}
for c in portfolio["companies"]:
    pats = name_patterns(c); hits = []
    for d in docs:
        for p in d["paragraphs"]:
            if any(pt.search(p) for pt in pats):
                if c["name"] in GENERIC and not re.search(r"portfolio|B Capital|invest|fund|round|raise|startup|company", p, re.I): continue
                fields = []
                if re.search(r"\bboard\b", p, re.I): fields.append("board_members")
                if re.search(r"\b(CEO|CTO|COO|CFO|founder|co-founder|president)\b", p, re.I): fields.append("executives")
                if re.search(r"\b(competitor|rival|competes?)\b", p, re.I): fields.append("competitors")
                if re.search(r"\b(valuation|raised|Series [A-H]|funding)\b", p, re.I): fields.append("deal_history")
                hits.append({"document": d["document"], "url": d.get("url"), "excerpt": p[:600], "fields_touched": sorted(set(fields)), "ingested_at": now})
        research_hits[c["slug"]] = hits[:12]

def money(v):
    try: return int(float(v)) if v not in (None, "", "None") else None
    except Exception: return None

profiles = {}; errors = {}
for c in portfolio["companies"]:
    slug = c["slug"]; r = api.get(slug) or {}; rec = r.get("data") if isinstance(r, dict) else None; sn = snap_cos.get(slug) or {}
    rs = c.get("research") or {}; psrc = f"portfolio.json (OnDemand research batch {rs.get('refreshed_at') or portfolio.get('generated_at')})"; pts = rs.get("refreshed_at") or portfolio.get("generated_at") or now
    def snapf(k):
        f = sn.get(k); return fld(f.get("value"), "PitchBook snapshot (web/src/data/pitchbook-snapshot.json)", f.get("fetched_at") or snap.get("fetched_at") or now, url=f.get("source"), plugin_id=f.get("plugin")) if isinstance(f, dict) and f.get("value") else None
    pb_ts = (rec or {}).get("provenance", {}).get("fetched_at") if rec else None
    def pbf(key):
        s = (rec or {}).get(key)
        if isinstance(s, dict) and s.get("value") not in (None, ""): return fld(s["value"], "PitchBook Investor Finder (plugin-1777018662)", s.get("fetched_at") or pb_ts or now, url=s.get("source_url"), plugin_id=PLUGIN)
        return None
    prof = {"slug": slug, "name": c["name"]}
    prof["overview"] = pbf("overview") or fld(c.get("description"), psrc, pts)
    prof["hq"] = snapf("hq") or fld(c.get("hq"), psrc, pts)
    prof["founded"] = snapf("founded") or fld(str(c["founded"]) if c.get("founded") else None, psrc, pts)
    prof["status"] = fld(c.get("status"), psrc, pts)
    prof["employees"] = snapf("employees") or fld(str(c["employees"]) if c.get("employees") else None, psrc, pts)
    prof["website"] = fld(c.get("website"), psrc, pts)
    contact = {k: v for k, v in {"website": c.get("website"), "linkedin": c.get("linkedin"), "x": c.get("x")}.items() if v}
    prof["contact"] = fld(", ".join(f"{k}: {v}" for k, v in contact.items()) if contact else None, psrc, pts)
    lr = c.get("last_round") if isinstance(c.get("last_round"), dict) else None
    prof["last_financing_date"] = fld(lr.get("date") if lr else None, psrc, pts) or snapf("last_deal")
    prof["last_financing_size_usd"] = fld(money(lr.get("amount_usd")) if lr else None, psrc, pts)
    prof["last_financing_type"] = fld(lr.get("round") if lr else None, psrc, pts) or pbf("last_round")
    prof["post_money_valuation_usd"] = fld(money(c.get("valuation_usd")), psrc, pts)
    prof["total_raised_usd"] = fld(money(c.get("total_raised_usd")), psrc, pts)
    inv = []
    if rec and rec.get("investors", {}).get("matched"):
        inv = [{"name": i.get("name"), "website": i.get("website"), "location": i.get("location"), "type": i.get("type"), "aum_musd": i.get("aum_musd")} for i in rec["investors"]["matched"] if i.get("name")]
        prof["investors"] = fld(inv, "PitchBook Investor Finder (plugin-1777018662)", pb_ts or now, plugin_id=PLUGIN)
    elif sn.get("investors"):
        prof["investors"] = fld(sn["investors"], "PitchBook snapshot (web/src/data/pitchbook-snapshot.json)", sn.get("fetched_at") or snap.get("fetched_at") or now, plugin_id=PLUGIN)
    else: prof["investors"] = None
    deals = [{"date": d.get("date"), "type": d.get("round"), "size_usd": money(d.get("amount_usd")), "post_money_usd": money(d.get("post_money_usd")), "lead_investors": d.get("lead_investors") or [], "investors": d.get("investors") or []} for d in (c.get("funding_rounds") or []) if isinstance(d, dict)]
    prof["deal_history"] = fld(deals, psrc, pts)
    execs = [{"name": p["name"], "title": p.get("role"), "role": "executive"} for p in ppl if p.get("company_slug") == slug and re.search(r"\b(CEO|CTO|COO|CFO|President|Founder|Chief)\b", p.get("role") or "", re.I)]
    prof["executives"] = fld(execs[:12], f"people.json (OnDemand research batch {people.get('generated_at')})", people.get("generated_at") or now)
    boards = [{"name": p["name"], "title": p.get("role"), "role": "board"} for p in ppl if p.get("company_slug") == slug and re.search(r"\bboard\b|chairman|director\b", p.get("role") or "", re.I)]
    prof["board_members"] = fld(boards[:12], f"people.json (OnDemand research batch {people.get('generated_at')})", people.get("generated_at") or now)
    prof["competitors"] = None
    prof["similar_companies"] = None
    prof["research_documents"] = research_hits.get(slug, [])
    prof["synced_at"] = pb_ts or snap.get("fetched_at") or now
    prof["next_sync_utc"] = (r.get("next_run_utc") if isinstance(r, dict) else None) or "weekly (Monday 06:00 UTC)"
    prof["sources"] = sorted({f["provenance"]["source"] for k in FIELDS for f in [prof.get(k)] if f} | {h["document"] for h in prof["research_documents"]})
    profiles[slug] = prof
    if isinstance(r, dict) and r.get("_error"): errors[slug] = r["_error"]

coverage = {k: {"populated": sum(1 for p in profiles.values() if p.get(k)), "not_available": sum(1 for p in profiles.values() if not p.get(k))} for k in FIELDS}
out = {"synced_at": now, "api": args.api, "companies": profiles, "coverage": coverage, "research_documents": [{"document": d["document"], "url": d.get("url"), "paragraphs": len(d["paragraphs"]), "companies_matched": sum(1 for s in profiles if any(h["document"] == d["document"] for h in profiles[s]["research_documents"]))} for d in docs], "api_errors": errors}
os.makedirs(os.path.join(ROOT, "data/pitchbook"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "data/pitchbook/profiles.json"), "w"), indent=1)
json.dump({"generated_at": now, "documents": [{"document": d["document"], "url": d.get("url"), "matches": {s: [h["excerpt"][:300] for h in profiles[s]["research_documents"] if h["document"] == d["document"]] for s in profiles if any(h["document"] == d["document"] for h in profiles[s]["research_documents"])}} for d in docs]}, open(os.path.join(ROOT, "data/pitchbook/research-docs.json"), "w"), indent=1)
json.dump(out, open(os.path.join(ROOT, "web/src/data/pitchbook-profiles.json"), "w"))
print(json.dumps({"companies": len(profiles), "coverage": coverage, "docs": out["research_documents"], "api_errors": len(errors)}, indent=1))
