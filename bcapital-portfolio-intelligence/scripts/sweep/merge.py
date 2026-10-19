#!/usr/bin/env python3
"""merge.py — coordinator for the 2026-10-19 mass sweep.

Inputs
  web/data/reputation/evidence.json      the committed v3 corpus (7,736 subject items, 2026-10-18 sweep)
  data/correlation/items.jsonl           the batch items incl. the ~10,274 'portfolio-social' rows (X / Reddit / Instagram / LinkedIn)
  data/sweep/<class>.jsonl               this run's staged items from the class (a)–(f) collectors (sweeplib schema)
Outputs
  web/data/reputation/evidence.json      merged corpus in the v3 item schema (+ source_class, origin, text_len, published_at_estimated, sectors)
  data/corpus.json                       committed export for the static build: {meta, items (snippet-level), registers, source_classes}
  data/corpus.sqlite                     tables items (with text ≤ 6,000 chars), entities, item_registers, edges (filled by build-reputation-graph-v4)
  data/sweep/merge-report.json           dedup / noise / reclassification statistics for the run log

Rules (from the brief): dedup by canonical URL (tracking params stripped, https, no trailing slash) AND by SimHash(64) of title + first 300
chars (Hamming ≤ 3); drop Saverin film noise and namesakes; portfolio-social rows count toward a BCAP register ONLY when their text names
that subject, otherwise registers=[] (kept in the corpus, never inflating a subject chip).
"""
from __future__ import annotations
import json, os, re, sqlite3, sys, hashlib, datetime as dt, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sweeplib as S

ROOT = S.ROOT
EVID = os.path.join(ROOT, "web/data/reputation/evidence.json")
ITEMS = os.path.join(ROOT, "data/correlation/items.jsonl")
CORPUS_JSON = os.path.join(ROOT, "data/corpus.json")
CORPUS_DB = os.path.join(ROOT, "data/corpus.sqlite")
REPORT = os.path.join(ROOT, "data/sweep/merge-report.json")
NOW = S.NOW()
REG_HANDLE = {"BCAP-001": "@bcapital", "BCAP-002": "@eduardosaverin", "BCAP-003": "@rajganguly", "BCAP-004": "@karanmohla"}
CLASS_SOURCE_TYPE = {"a": "first_party", "b": "portfolio_news", "c": "press", "d": "video", "e": "social", "f": "press", "g-karan": "press", "g-raj": "press", "g-eduardo": "press", "g-bcapital": "press", "g-portfolio": "portfolio_news"}
SECTOR_OF = {c["slug"]: c["sector"] for c in S.portfolio_companies()}
LINK_NOISE = re.compile(r"fonts\.(gstatic|googleapis)|cdn\.prod\.website-files|\.(png|jpe?g|svg|gif|webp|css|js|woff2?)(\?|$)|facebook\.com/sharer|twitter\.com/(intent|share)|x\.com/intent|linkedin\.com/share|linkedin\.com/sharing|wp-content|gravatar|google\.com/(maps|recaptcha)|schema\.org|w3\.org|creativecommons|apple\.com/app-store|play\.google|youtube\.com/embed|gstatic|googletagmanager|cloudflare|jsdelivr|unpkg|typekit", re.I)

# ---------------------------------------------------------------- simhash ---------------------------------------------------------
def _tokens(s: str) -> list[str]:
  w = re.findall(r"[a-z0-9]+", (s or "").lower())
  return [" ".join(w[i:i + 2]) for i in range(max(1, len(w) - 1))] if len(w) > 1 else w
def simhash64(text: str) -> int:
  v = [0] * 64
  for tok in _tokens(text):
    h = int.from_bytes(hashlib.blake2b(tok.encode(), digest_size=8).digest(), "big")
    for b in range(64): v[b] += 1 if (h >> b) & 1 else -1
  out = 0
  for b in range(64):
    if v[b] > 0: out |= 1 << b
  return out
class NearDupIndex:
  """4 × 16-bit band LSH over the 64-bit SimHash; a candidate is a near-dup when Hamming distance ≤ 3."""
  def __init__(self): self.bands: list[dict[int, list[int]]] = [collections.defaultdict(list) for _ in range(4)]; self.sigs: list[int] = []
  def _bands(self, h: int): return [(h >> (16 * i)) & 0xFFFF for i in range(4)]
  def find(self, h: int, max_dist: int = 3) -> int | None:
    seen = set()
    for i, b in enumerate(self._bands(h)):
      for idx in self.bands[i].get(b, ()):
        if idx in seen: continue
        seen.add(idx)
        if bin(self.sigs[idx] ^ h).count("1") <= max_dist: return idx
    return None
  def add(self, h: int) -> int:
    idx = len(self.sigs); self.sigs.append(h)
    for i, b in enumerate(self._bands(h)): self.bands[i][b].append(idx)
    return idx

def sig_text(title: str, text: str | None) -> str: return f"{title or ''} {(text or '')[:300]}"

# ---------------------------------------------------------------- load base corpus ------------------------------------------------
def main():
  stats: dict = {"run_at": NOW, "raw_fetched": {}, "canonical_dup_removed": 0, "near_dup_removed": 0, "film_noise_dropped": 0, "namesake_dropped": 0,
                 "off_subject_dropped": 0, "undated_dropped": 0, "base_noise_dropped": {"film-noise": 0, "namesake": 0}, "portfolio_social": {}}
  # the merge is idempotent: the FROZEN v3 base (data/sweep/base-evidence.json, copied from the committed evidence.json on the first run) is the input,
  # so re-running after another class lands never double-counts the previous merge's rows as duplicates.
  base_p = os.path.join(S.STAGE, "base-evidence.json")
  if not os.path.exists(base_p):
    import shutil; shutil.copyfile(EVID, base_p)
  base: list[dict] = json.load(open(base_p, encoding="utf-8"))
  stats["base_items"] = len(base)
  by_canon: dict[str, dict] = {}
  nd = NearDupIndex()
  merged: list[dict] = []
  # 1) existing v3 corpus — re-canonicalise, apply the noise rules retroactively, index for dedup
  for it in base:
    reason = S.noise_reason(it["title"], it.get("snippet") or "", it["registers"])
    if reason in ("film-noise", "namesake"):
      stats["base_noise_dropped"][reason] += 1; continue
    canon = S.canonical(it["canonical_url"]) or it["canonical_url"]
    if canon in by_canon:
      stats["canonical_dup_removed"] += 1; continue
    h = simhash64(sig_text(it["title"], it.get("snippet")))
    if nd.find(h) is not None:
      stats["near_dup_removed"] += 1; continue
    it["canonical_url"] = canon
    it.setdefault("source_class", "prior"); it.setdefault("origin", "v3-corpus-2026-10-18"); it.setdefault("published_at_estimated", False); it["_text"] = None; it["text_len"] = 0
    it["sectors"] = sorted({SECTOR_OF[c] for c in (it.get("companies") or []) if c in SECTOR_OF})
    by_canon[canon] = it; nd.add(h); merged.append(it)
  stats["base_kept"] = len(merged)

  # 2) this run's staged classes (a)–(f)
  per_class: dict[str, dict] = {}
  next_id = len(base) + 1
  for cls in list("abcdef") + ["g-karan", "g-raj", "g-eduardo", "g-bcapital", "g-portfolio"]:
    p = os.path.join(S.STAGE, f"{cls}.jsonl")
    pc = per_class[cls] = {"staged": 0, "kept": 0, "canonical_dup": 0, "near_dup": 0, "film_noise": 0, "namesake": 0, "off_subject": 0, "undated": 0, "estimated_dates": 0}
    if not os.path.exists(p): continue
    for line in open(p, encoding="utf-8"):
      try: r = json.loads(line)
      except Exception: continue
      pc["staged"] += 1
      regs = list(r.get("registers") or [])
      reason = S.noise_reason(r["title"], r.get("text") or "", regs)
      if reason == "film-noise": pc["film_noise"] += 1; continue
      if reason == "namesake": pc["namesake"] += 1; continue
      first_party = cls == "a" or (cls == "g-bcapital" and "b.capital" in S.host_of(r["canonical_url"]))
      if reason == "off-subject" and not first_party: pc["off_subject"] += 1; continue
      if first_party and "BCAP-001" not in regs: regs = sorted(set(regs) | {"BCAP-001"})
      if not r.get("published_at"): pc["undated"] += 1; continue
      canon = S.canonical(r["canonical_url"]) or r["canonical_url"]
      if canon in by_canon:
        # same URL already in the corpus (most of classes b/c/f re-found yesterday's Google-News rows): keep ONE item, but ENRICH it with this
        # run's full text / author / sectors / provenance — the v3 row only carried a snippet.
        pc["canonical_dup"] += 1
        prev = by_canon[canon]; txt = (r.get("text") or "").strip()
        if txt and len(txt) > max(400, prev.get("text_len") or 0):
          prev["_text"] = txt[:6000]; prev["text_len"] = len(txt); pc["enriched"] = pc.get("enriched", 0) + 1
          if not prev.get("snippet") or len(prev["snippet"]) < 120: prev["snippet"] = re.sub(r"\s+", " ", txt)[:400]
        if r.get("author") and not prev.get("author"): prev["author"] = r["author"]
        comps0 = [c for c in (r.get("companies") or []) if len(r.get("companies") or []) <= 8]
        if comps0: prev["companies"] = sorted(set(prev.get("companies") or []) | set(comps0)); prev["sectors"] = sorted({SECTOR_OF[c] for c in prev["companies"] if c in SECTOR_OF})
        prev.setdefault("provenance", []).append({"source_url": r.get("original_url") or canon, "http_status": r.get("http_status"), "fetched_at": r.get("fetched_at"), "collector": f"sweep-2026-10-19/{cls}", "subagent": f"class-{cls}", "query": None})
        prev["also_in_classes"] = sorted(set(prev.get("also_in_classes") or []) | {cls})
        continue
      h = simhash64(sig_text(r["title"], r.get("text")))
      if nd.find(h) is not None: pc["near_dup"] += 1; continue
      text = (r.get("text") or "").strip()
      # listing / index pages (b.capital/portfolio, news hubs) name dozens of companies — they are kept as evidence but must not fan out into
      # an N² co-link clique of company bubbles, so a page naming > 8 portfolio companies carries no company attribution for the graph.
      comps = list(r.get("companies") or [])
      if len(comps) > 8: comps = []
      links = [u for u in (r.get("outbound_links") or []) if not LINK_NOISE.search(u)][:25]
      snippet = re.sub(r"\s+", " ", text)[:400] if text else None
      glyph = r.get("platform_glyph") or "web"
      if glyph == "news": glyph = "web"
      it = {
        "id": f"ev-{next_id:05d}", "registers": regs, "subject_handles": [REG_HANDLE[x] for x in regs], "title": r["title"], "canonical_url": canon,
        "publisher": r.get("outlet") or S.host_of(canon), "platform_glyph": glyph, "source_type": ("press_release" if glyph == "pr" else "podcast" if glyph == "podcast" else CLASS_SOURCE_TYPE[cls]),
        "published_at": r["published_at"], "published_at_estimated": bool(r.get("published_at_estimated")), "date_source": r.get("date_source"),
        "snippet": snippet, "hashtags": r.get("hashtags") or [], "mentions": r.get("mentions") or [], "outbound_links": links, "reply_to": r.get("reply_to"),
        "text_hash": S.sha(text or r["title"]), "companies": comps, "author": r.get("author"), "sentiment": None,
        "match_basis": "text" if S.registers_for(f"{r['title']} {text}") else ("publisher-scope" if cls == "a" else "author"),
        "provenance": [{"source_url": r.get("original_url") or canon, "http_status": r.get("http_status"), "fetched_at": r.get("fetched_at"), "collector": f"sweep-2026-10-19/{cls}", "subagent": f"class-{cls}", "query": None}],
        "source_class": cls, "origin": "sweep-2026-10-19", "named_entities": (r.get("named_entities") or [])[:20], "text_len": len(text), "provider_receipt": bool(r.get("provider_receipt")),
        "sectors": sorted({SECTOR_OF[c] for c in comps if c in SECTOR_OF}), "_text": text[:6000],
      }
      if r.get("verification"): it["page_verification"] = r["verification"]
      if it["published_at_estimated"]: pc["estimated_dates"] += 1
      by_canon[canon] = it; nd.add(h); merged.append(it); next_id += 1; pc["kept"] += 1
  stats["per_class"] = per_class

  # 3) portfolio-social rows → corpus with STRICT register tagging (registers=[] unless the text names a subject)
  ps = stats["portfolio_social"] = {"rows": 0, "kept": 0, "tagged_in": 0, "tagged_out": 0, "by_register": collections.Counter(), "by_platform": collections.Counter(), "canonical_dup": 0, "near_dup": 0, "undated": 0}
  for line in open(ITEMS, encoding="utf-8"):
    d = json.loads(line)
    if d.get("category") != "portfolio-social": continue
    ps["rows"] += 1
    if not d.get("published_date"): ps["undated"] += 1; continue
    canon = S.canonical(d["source_url"]) or d["source_url"]
    if canon in by_canon: ps["canonical_dup"] += 1; continue
    text = d.get("headline") or ""
    h = simhash64(sig_text(text, ""))
    if nd.find(h) is not None: ps["near_dup"] += 1; continue
    regs = S.registers_for(text)
    if regs: ps["tagged_in"] += 1
    else: ps["tagged_out"] += 1
    for x in regs: ps["by_register"][x] += 1
    plat = d.get("source_name") or S.glyph_for(canon, "web"); ps["by_platform"][plat] += 1
    u = canon
    author = (re.search(r"x\.com/([^/]+)/status", u) or re.search(r"instagram\.com/([^/]+)", u) or re.search(r"linkedin\.com/(?:in|company|posts)/([^/_?]+)", u) or [None, None])[1]
    sub = (re.search(r"reddit\.com/r/([^/]+)", u) or [None, None])[1]
    it = {
      "id": f"ev-{next_id:05d}", "registers": regs, "subject_handles": [REG_HANDLE[x] for x in regs], "title": text[:300], "canonical_url": canon,
      "publisher": (f"r/{sub}" if sub else {"x": "X", "reddit": "Reddit", "instagram": "Instagram", "linkedin": "LinkedIn"}.get(plat, plat)), "platform_glyph": plat, "source_type": "social",
      "published_at": S.iso_date(d["published_date"]) or d["published_date"], "published_at_estimated": False, "date_source": "api",
      "snippet": text[:400], "hashtags": S.hashtags_in(text), "mentions": S.mentions_in(text), "outbound_links": [], "reply_to": None,
      "text_hash": S.sha(text), "companies": [d["company_slug"]] if d.get("company_slug") else [], "author": author and f"@{author}", "sentiment": d.get("sentiment"),
      "match_basis": "text" if regs else "portfolio-only", "provenance": [{"source_url": d["source_url"], "http_status": 200, "fetched_at": d.get("retrieved_at"), "collector": d.get("collector") or "portfolio-social", "subagent": d.get("origin") or "portfolio/social-feed", "query": None}],
      "source_class": "portfolio-social", "origin": "portfolio-social-reclassified", "text_len": len(text), "provider_receipt": False,
      "sectors": sorted({SECTOR_OF[c] for c in ([d["company_slug"]] if d.get("company_slug") else []) if c in SECTOR_OF}), "_text": text,
    }
    by_canon[canon] = it; nd.add(h); merged.append(it); next_id += 1; ps["kept"] += 1
  ps["by_register"] = dict(ps["by_register"]); ps["by_platform"] = dict(ps["by_platform"])

  # 4) sort newest-first (stable), write evidence.json (snippet-level) + corpus.json + corpus.sqlite (with text)
  merged.sort(key=lambda x: x["published_at"], reverse=True)
  texts = {it["id"]: it.pop("_text", None) for it in merged}
  json.dump(merged, open(EVID, "w", encoding="utf-8"), ensure_ascii=False)
  per_reg = collections.Counter(r for it in merged for r in it["registers"])
  per_reg_text = collections.Counter(r for it in merged if it.get("match_basis") == "text" for r in it["registers"])
  per_cls = collections.Counter(it.get("source_class") for it in merged)
  per_glyph = collections.Counter(it["platform_glyph"] for it in merged)
  per_sector = collections.Counter(s for it in merged for s in it.get("sectors", []))
  subject_items = sum(1 for it in merged if it["registers"])
  meta = {"generated_at": NOW, "run": "sweep-2026-10-19", "items": len(merged), "subject_items": subject_items, "portfolio_only_items": len(merged) - subject_items,
          "registers": {k: {"items": per_reg.get(k, 0), "items_named_in_text": per_reg_text.get(k, 0), "target": {"BCAP-001": 2000, "BCAP-002": 800, "BCAP-003": 600, "BCAP-004": 500}[k]} for k in REG_HANDLE},
          "source_classes": dict(per_cls), "platforms": dict(per_glyph), "sectors": dict(per_sector), "sources": {"evidence": "web/data/reputation/evidence.json", "sqlite": "data/corpus.sqlite"}}
  json.dump({"meta": meta, "items": merged}, open(CORPUS_JSON, "w", encoding="utf-8"), ensure_ascii=False)
  if os.path.exists(CORPUS_DB): os.remove(CORPUS_DB)
  db = sqlite3.connect(CORPUS_DB)
  db.executescript("""
    create table items (id text primary key, title text, canonical_url text unique, outlet text, author text, published_at text, published_at_estimated integer, platform_glyph text,
                        source_type text, source_class text, origin text, match_basis text, snippet text, text text, text_hash text, provider_receipt integer, sentiment real);
    create table entities (item_id text references items(id), kind text, value text);
    create table item_registers (item_id text references items(id), register text, basis text, primary key (item_id, register));
    create table edges (id text primary key, source text, target text, type text, weight real, co_occurrence_count integer, event_count integer, syndication_share real, evidence_ids text, by_mode text);
    create index ix_items_pub on items(published_at); create index ix_items_class on items(source_class); create index ix_ent on entities(item_id); create index ix_reg on item_registers(register);
  """)
  db.executemany("insert into items values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
    (it["id"], it["title"], it["canonical_url"], it["publisher"], it.get("author"), it["published_at"], int(bool(it.get("published_at_estimated"))), it["platform_glyph"], it["source_type"],
     it.get("source_class"), it.get("origin"), it.get("match_basis"), it.get("snippet"), texts.get(it["id"]), it.get("text_hash"), int(bool(it.get("provider_receipt"))), it.get("sentiment")) for it in merged])
  ents = []
  for it in merged:
    for c in it.get("companies") or []: ents.append((it["id"], "company", c))
    for s in it.get("sectors") or []: ents.append((it["id"], "sector", s))
    for n in (it.get("named_entities") or [])[:20]: ents.append((it["id"], "named_entity", n))
    for hsh in it.get("hashtags") or []: ents.append((it["id"], "hashtag", hsh))
  db.executemany("insert into entities values (?,?,?)", ents)
  db.executemany("insert or ignore into item_registers values (?,?,?)", [(it["id"], r, it.get("match_basis")) for it in merged for r in it["registers"]])
  db.execute("create table meta (key text primary key, value text)"); db.executemany("insert into meta values (?,?)", [(k, json.dumps(v)) for k, v in meta.items()])
  db.commit(); db.close()
  stats["merged"] = meta; stats["sizes"] = {"evidence_json": os.path.getsize(EVID), "corpus_json": os.path.getsize(CORPUS_JSON), "corpus_sqlite": os.path.getsize(CORPUS_DB)}
  json.dump(stats, open(REPORT, "w", encoding="utf-8"), indent=1, default=str)
  print(json.dumps({"items": len(merged), "subject_items": subject_items, "registers": meta["registers"], "source_classes": meta["source_classes"], "per_class": per_class, "portfolio_social": {k: v for k, v in ps.items() if k != "by_platform"}, "base_noise_dropped": stats["base_noise_dropped"], "canonical_dup_removed": stats["canonical_dup_removed"], "near_dup_removed": stats["near_dup_removed"], "sizes": stats["sizes"]}, indent=1))

if __name__ == "__main__":
  main()
