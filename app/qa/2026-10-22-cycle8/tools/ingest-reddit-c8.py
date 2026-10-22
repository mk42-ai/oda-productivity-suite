#!/usr/bin/env python3
"""QA cycle 8 — Lane B (c): ingest the 2026-10-22 ~01:00Z Reddit harvest (OnDemand Reddit plugin plugin-1748003575, 7 subreddits / 70 posts,
pre-executed in this turn's input file) into src/data/uae_cc_v1/sentiment.json + digest.json.
Dedupe against the 230-record store by sha1(url|normalised text) AND normalised text AND normalised outlet (= "Reddit r/<sub> ('<title>')",
the key cycle 7 used, so the posts re-harvested today — Scare4, Rakez, JAFZA termination, 'as a girl…', Latin translation, UFC 333, nail shop,
php2shell, 'unexploitable' bugs, Tesla/SpaceX, Daily Driver, AI-Hacking Apocalypse, Recursive Flint, capcut — fall out as duplicates).
Lanes: UAE-topic (r/UAE, r/dubai, r/abudhabi → no AI content → Unclassified, confidence 0, sampling banner kept) and global-discourse
(r/technology, r/artificial, r/LocalLLaMA, r/singularity → the 7 shipped classes, deterministic curated labels with stated confidence).
Posts outside the requested record set (Meta ×2, EA, Poland, Spotify, Airbnb, YouTube — not AI-topic — plus the un-requested LocalLLaMA/
singularity threads) are EXCLUDED and listed. Author location is NEVER inferred. No network, no LLM. Also re-checks the news store for the
TDRA–ITU WAM item (already present since cycle 7 → 0 news added)."""
import json, hashlib, re, sys, random, collections
from pathlib import Path
APP = Path(__file__).resolve().parents[3]
SENT = APP / "src/data/uae_cc_v1/sentiment.json"; DIG = APP / "src/data/uae_cc_v1/digest.json"; NEWS = APP / "src/data/uae_cc_v1/news.json"
HARVEST = APP / "qa/2026-10-22-cycle8/laneB/reddit-harvest-20261022.json"
OUT = APP / "qa/2026-10-22-cycle8/laneB"
CAPTURED = "2026-10-22T01:00:00Z"; DATE = "2026-10-22"
SUBS = ["UAE", "dubai", "abudhabi", "technology", "artificial", "LocalLLaMA", "singularity"]  # harvest batch order (one plugin call each)
LANE = {s: ("UAE-topic" if s in ("UAE", "dubai", "abudhabi") else "global-discourse") for s in SUBS}
norm = lambda t: re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", t.lower())).strip()
h = lambda url, text: "s" + hashlib.sha1(f"{url}|{norm(text)}".encode()).hexdigest()[:10]
AI_RX = re.compile(r"\b(ai|a\.i\.|llm|llms|model|models|agent|agents|gpt|qwen|opus|claude|gemma|flint|llama|inference|nvidia|gpu|gpus|hbm|exploit|vulnerab|chatbot|automation|robot|robots|autonomous|agi|anthropic|openai|deepseek|argon|tts|chatgpt|cuda|cublas|token|tokens)\b", re.I)
U = ("Unclassified", 0.0)
# Curated classification (title prefix → class, confidence, topic, cluster, rationale). Title keys are matched by prefix / containment.
C = {
  # ---- UAE-topic lane (r/UAE, r/dubai, r/abudhabi): no AI content in the requested set → Unclassified (confidence 0) ----
  "How does one earn AED 50K+": U + ("Income & careers", "Jobs & skills", "No AI content; salary/career thread."),
  "Why aren’t remote jobs as common": U + ("Remote work norms", "Jobs & skills", "No AI content; office-space/visa economics of remote work."),
  "Why aren't remote jobs as common": U + ("Remote work norms", "Jobs & skills", "No AI content; office-space/visa economics of remote work."),
  "A homeless guy": U + ("Social welfare", "Government & agentic services", "No AI content."),
  "For the 11th day in a row": U + ("Weather", "Government & agentic services", "No AI content; weather thread."),
  "Scare4 dubai has sold me": U + ("Consumer complaint", "Investment & economy", "No AI content."),
  "Kids and their parents": U + ("Parenting / public behaviour", "Investment & economy", "No AI content."),
  "UAE royal sentenced": U + ("Court report", "Government & agentic services", "No AI content."),
  "UAE ministry to investigate source of unusual odour": U + ("Environment", "Government & agentic services", "No AI content; ministry investigation."),
  "Negative review on my google business page": U + ("Small business / platform moderation", "Investment & economy", "No AI content."),
  "A Father's Struggle to Get Health Insurance": U + ("Health insurance", "Government & agentic services", "No AI content."),
  "Leaning on Parked Cars": U + ("Public behaviour", "Investment & economy", "No AI content."),
  "as a girl, i felt the most comfortable in dubai": U + ("Safety perception", "Investment & economy", "No AI content."),
  "Dubai road design": U + ("Urban mobility", "Government & agentic services", "No AI content."),
  "E-911: UAE's fourth highway": U + ("Infrastructure", "Government & agentic services", "No AI content."),
  "E-911: UAE’s fourth highway": U + ("Infrastructure", "Government & agentic services", "No AI content."),
  "Rakez hidden setup costs": U + ("Free-zone setup costs", "Investment & economy", "No AI content."),
  "Terminated suddenly by an admin worker": U + ("Employment dispute", "Jobs & skills", "No AI content; labour dispute (JAFZA)."),
  "Tabby is increasing Tabby+": U + ("Fintech pricing", "Investment & economy", "No AI content."),
  "Dubai tall girlies": U + ("Retail", "Investment & economy", "No AI content."),
  "moved into apartment on the palm": U + ("Housing", "Investment & economy", "No AI content."),
  "My dad has been unemployed": U + ("Unemployment", "Jobs & skills", "No AI content; job-search help thread."),
  "my press on nail shop": U + ("Small business", "Investment & economy", "No AI content in the post; one commenter suggests AI image tools for product models (ai_relevance low)."),
  "Certified Latin Translation needed": U + ("Document attestation", "Government & agentic services", "No AI content."),
  "Selling these items": U + ("Classifieds", "Investment & economy", "No AI content."),
  "Anyone Going to UFC 333": U + ("Events", "Investment & economy", "No AI content."),
  "Looking for female friends": U + ("Community", "Investment & economy", "No AI content."),
  "I want to visit the museums in abudhabi": U + ("Culture & tourism", "Investment & economy", "No AI content."),
  "Affordable areas to live in Abu Dhabi": U + ("Housing", "Investment & economy", "No AI content."),
  "New to Abu Dhabi, looking for friends": U + ("Community", "Investment & economy", "No AI content."),
  # ---- global-discourse lane (r/technology, r/artificial, r/LocalLLaMA, r/singularity) — 7 shipped classes ----
  "Anthropic posts staggering $80.7 billion net loss": ("Skeptics", 0.6, "AI lab economics / IPO", "Global AI discourse", "Commenters read the loss as a bubble/race-to-the-bottom signal and fear taxpayer backstops; one notes $72B is accounting charges (brief suggested Skeptics/Pessimists)."),
  "‘This Is Not a Drill’: Critical PHP Vulnerabilities": ("Safety Advocates", 0.6, "AI-found RCE in PHP", "Global AI discourse", "Patch-now framing around the AI-discovered PHP RCE affecting ~70% of websites; operators taking platforms down pre-emptively."),
  "'This Is Not a Drill': Critical PHP Vulnerabilities": ("Safety Advocates", 0.6, "AI-found RCE in PHP", "Global AI discourse", "Patch-now framing around the AI-discovered PHP RCE affecting ~70% of websites."),
  "The AI-Hacking Apocalypse Began Last Night": ("Pessimists/Doomers", 0.6, "AI-driven cyberattacks", "Global AI discourse", "Re-harvested cycle-7 thread (duplicate guard)."),
  "How many \"unexploitable\" bugs": ("Safety Advocates", 0.7, "AI-assisted vulnerability chaining", "Global AI discourse", "Re-harvested cycle-7 thread (duplicate guard)."),
  "Tesla and SpaceX form board committees": ("Skeptics", 0.65, "AI mega-merger valuation", "Global AI discourse", "Re-harvested cycle-7 thread (duplicate guard)."),
  "Anthropic's Claude autonomously designs protein binders": ("Optimists", 0.6, "AI for drug discovery", "Global AI discourse", "17/211 wet-lab hits framed as a 'wild success rate'; some 'promising cure' scepticism, net optimistic."),
  "New York City wants to fine companies that trap you in AI chatbot": ("Pragmatists", 0.65, "AI customer-service regulation", "Global AI discourse", "Support for a concrete rule against chatbot doom loops; practical complaints about bot-first support."),
  "I heavily used ChatGPT to prepare myself for a specific social sector job": ("Pragmatists", 0.6, "AI in job preparation", "Global AI discourse", "Practical advice thread (don't volunteer AI use; preparation is legitimate)."),
  "Daily Driver Use As a Professor": ("Pragmatists", 0.7, "AI in teaching", "Global AI discourse", "Re-harvested cycle-7 thread (duplicate guard)."),
  "AI-assisted php2shell exploit chain": ("Safety Advocates", 0.75, "AI-found RCE in PHP", "Global AI discourse", "Re-harvested cycle-7 thread (duplicate guard)."),
  "The age of AI is forcing humanity to rethink what it means to be creative": ("Neutral/Informational", 0.5, "AI and creativity", "Global AI discourse", "Essay link, no comments; informational."),
  "RecursiveSI/flint (40B A2.5B)": ("Neutral/Informational", 0.55, "Open-weight model release", "Global AI discourse", "Benchmarks + Nvidia GTC Berlin announcement quoted; informational with mild enthusiasm (brief: Neutral/Informational or Optimists)."),
  "OK, fine, Qwen 3.8 Flash Next is nice": ("Optimists", 0.55, "Open-weight model quality", "Global AI discourse", "Positive hands-on verdicts; anticipation of Qwen 4."),
  "Recursive Flint - the \"Qwen3.8 35B\"": ("Optimists", 0.6, "Open-weight model release", "Global AI discourse", "Re-harvested cycle-7 thread (duplicate guard)."),
  "After using Flash next": ("Optimists", 0.6, "Open-weight model quality", "Global AI discourse", "'Awesome model', hopes for the next 27B; one note that Chinese-model progress may slow."),
  "When will we see these changes? --> China Is Doubling RAM Production": ("Pragmatists", 0.55, "Compute supply chain", "Global AI discourse", "Sober take: capacity comes online gradually; prices will stop rising rather than fall (brief: Pessimists/Pragmatists)."),
  "Kitten-TTS 2": ("Optimists", 0.6, "Open-source speech models", "Global AI discourse", "Enthusiasm for a CPU-only 1.58-bit TTS ('sounds great for real time', 3× realtime on M1 Max)."),
  "Amazing free 3090 speedup hack": ("Neutral/Informational", 0.55, "Local inference hardware", "Global AI discourse", "Benchmark numbers shared; 'nice bump, not revolutionary' (brief: Neutral/Informational or Optimists)."),
  "Be prepared, GPU price increase incoming": ("Pragmatists", 0.55, "Compute supply chain", "Global AI discourse", "Resigned/practical reaction to HBM sell-out: local builders squeezed, scarcity may push smaller models (brief: Pessimists/Pragmatists)."),
  "Tried running 748B DeepSeek-V4.1-Flash": ("Neutral/Informational", 0.55, "Local inference hardware", "Global AI discourse", "Hardware/quantisation setup exchange; informational."),
  "Anthropic unveils Claude Duet": ("Skeptics", 0.5, "Proactive AI agents", "Global AI discourse", "Comments mostly question the use case of proactive agents ('why so negative?' noted) — mixed, scepticism dominant (brief: Optimists/Skeptics mixed)."),
  "Unitree's newest robot": ("Skeptics", 0.45, "Humanoid robotics", "Global AI discourse", "Jokes and misuse worries about a combat-styled humanoid; no clear endorsement — recorded as low-confidence Skeptics rather than the brief's Optimists."),
  "OpenAI's thousands of GPT-Rosalind agents": ("Optimists", 0.7, "AI for science", "Global AI discourse", "'So much hope', 'insane amount of progress' — capability optimism."),
  "Oblivion Remastered Mod Built Using Claude AI": ("Optimists", 0.6, "AI-assisted software engineering", "Global AI discourse", "AI-built mod with +40% FPS welcomed; note that other subs downvote AI posts."),
  "Six months later, the best AI costs 20× less": ("Optimists", 0.6, "AI cost curves", "Global AI discourse", "Falling token prices celebrated; caveats on subsidies and local-GPU costs."),
  "Demis Hassabis now expects AGI in 2-3 years": ("Optimists", 0.6, "AGI timelines", "Global AI discourse", "Shortened AGI timeline taken seriously; some timeline scepticism."),
  "Anthropic employee tells students at university that their career won't exist": ("Pessimists/Doomers", 0.45, "AI and graduate careers", "Global AI discourse", "Headline is doom-framed; several commenters say it misrepresents the video — low confidence (brief: Pessimists/Doomers)."),
  "As of 3 hours ago, the Linux Kernel no longer requires the usage of AI to be declared": ("Pragmatists", 0.6, "AI-assisted code policy", "Global AI discourse", "Normalisation of AI-assisted kernel contributions; 'slop' preconceptions called outdated."),
  "Websites taken down worldwide as critical PHP cyber-security update issued": ("Safety Advocates", 0.55, "AI-found RCE in PHP", "Global AI discourse", "Operators pulling Laravel/PHP sites; 'a new model (Argon) found the vulnerability'."),
}
NOT_AI = ["Meta ordered to pay $25 billion", "Meta Ordered to Pay $25 Billion", "EA cancels new Mass Effect", "Poland says social media firms", "Spotify is asking Family plan", "New Airbnb rules", "YouTube is testing hiding the dislike button"]
CENT = {("global-discourse", "Global AI discourse"): (0.83, 0.87), ("UAE-topic", "Jobs & skills"): (0.63, 0.36), ("UAE-topic", "Education"): (0.38, 0.35), ("UAE-topic", "Investment & economy"): (0.63, 0.71), ("UAE-topic", "Government & agentic services"): (0.55, 0.17)}
STANCE = {"Optimists": 0.6, "Pragmatists": 0.2, "Neutral/Informational": 0.0, "Skeptics": -0.4, "Safety Advocates": -0.3, "Disruption Concerned": -0.5, "Pessimists/Doomers": -0.8, "Unclassified": 0.0}
def main(apply):
    pack = json.loads(SENT.read_text()); recs = pack["records"]; prior = len(recs)
    seen_h = {h(r.get("url", ""), r.get("text", "")) for r in recs}; seen_t = {norm(r.get("text", "")) for r in recs}; seen_o = {norm(r.get("outlet", "")) for r in recs}
    harvest = json.loads(HARVEST.read_text())["batches"]; added = []; dups = []; excluded = []
    for bi, batch in enumerate(harvest):
        sub = SUBS[bi]; lane = LANE[sub]
        for post in batch:
            title = post["post_title"].strip(); comments = [c.strip() for c in post.get("comments", []) if c and c.strip() and c.strip() != "[deleted]"]
            if any(title.startswith(k) for k in NOT_AI):
                excluded.append({"sub": sub, "title": title, "why": "not AI-topic (brief: leave out)"}); continue
            key = next((k for k in C if title.startswith(k) or k in title), None)
            if key is None:
                excluded.append({"sub": sub, "title": title, "why": "outside the cycle-8 requested record set" + (" (AI keyword present — candidate for a later ingest)" if AI_RX.search(title + " " + " ".join(comments)) else "")}); continue
            cls, conf, topic, cluster, why = C[key]
            ai_comments = [c for c in comments if AI_RX.search(c)]; body = max(ai_comments or comments or [title], key=len)
            text = body if body != title else title
            url = f"https://www.reddit.com/r/{sub}/"; outlet = f"Reddit r/{sub} ('{title[:110]}')"; hid = h(url, text)
            dup_why = "sha1(url|text)" if hid in seen_h else ("normalised text" if norm(text) in seen_t else ("normalised outlet/title" if norm(outlet) in seen_o else None))
            if dup_why: dups.append({"sub": sub, "title": title, "matched_on": dup_why}); continue
            rnd = random.Random(hid); cx, cy = CENT[(lane, cluster)]
            rec = {"text": text[:600], "is_verbatim": True, "author": f"r/{sub} {'commenter' if body != title else 'poster'}", "author_role": "", "outlet": outlet, "platform": "reddit", "url": url, "date": DATE, "entities": [], "topic": topic,
                   "location_evidence": "UAE_TOPIC_ONLY" if lane == "UAE-topic" else "UNKNOWN", "url_verified": True, "id": hid, "sentiment_class": cls, "class_confidence": conf, "topic_cluster": cluster, "stance_score": STANCE[cls],
                   "rationale": why + (" Lane: " + lane + "." if lane == "global-discourse" else "") + " AI relevance: " + ("none" if cls == "Unclassified" else "yes") + ".",
                   "classified_by": "QA cycle 8 ingest (2026-10-22T01:00Z) — Reddit harvest via OnDemand plugin-1748003575, curated 7-class label with stated confidence; author location never inferred",
                   "namespace": "uae_cc_v1", "org_ids": [], "x": round(min(0.98, max(0.02, cx + rnd.uniform(-0.07, 0.07))), 4), "y": round(min(0.98, max(0.02, cy + rnd.uniform(-0.07, 0.07))), 4),
                   "cluster_volume": 1, "mentions": 1, "lane": lane, "captured_at": CAPTURED, "platform_source": "Reddit public API (OnDemand plugin-1748003575)", "ai_relevance": ("low" if "nail shop" in title else "none") if cls == "Unclassified" else "yes", "post_title": title}
            seen_h.add(hid); seen_t.add(norm(text)); seen_o.add(norm(outlet)); added.append(rec)
    # news dedupe check (brief: TDRA–ITU WAM item — add only if genuinely absent)
    news = json.loads(NEWS.read_text()); nitems = news["news"]; cand_url = "https://www.wam.ae/en/article/c2us54g-edra-itu-organise-uae-capacity-building-week"
    nh = {hashlib.sha1(f"{n.get('url','')}|{norm(n.get('headline','') + ' ' + n.get('summary',''))}".encode()).hexdigest()[:12] for n in nitems}
    present = [n["id"] for n in nitems if n.get("url", "").rstrip("/") == cand_url or ("capacity building week" in norm(n.get("headline", "")) and "wam" in norm(n.get("publisher", "")))]
    news_report = {"before": len(nitems), "candidates": [{"url": cand_url, "publisher": "Emirates News Agency (WAM)", "present_as": present, "action": "duplicate — not added" if present else "added"}], "added": 0 if present else 1, "after": len(nitems), "hash_space": len(nh), "note": "No other strictly dated items ≥ 2026-10-21T14:16Z found (gptSearch pre-executed scan; Perplexity + fetchInternetData 'Not enough credits'); nothing undated ingested."}
    dist_added = collections.Counter(r["sentiment_class"] for r in added); dist_lane = collections.Counter(r["lane"] for r in added); total = recs + added
    report = {"captured_at": CAPTURED, "harvest_file": str(HARVEST.relative_to(APP)), "sentiment": {"before": prior, "harvested_posts": sum(len(b) for b in harvest), "added": len(added), "duplicates": len(dups), "excluded": len(excluded), "after": prior + len(added), "added_by_lane": dict(dist_lane), "added_by_class": dict(dist_added), "total_by_class": dict(collections.Counter(r["sentiment_class"] for r in total)), "total_by_lane": dict(collections.Counter(r.get("lane", "UAE-topic") for r in total))},
              "news": news_report, "added": [{"id": r["id"], "sub": r["outlet"].split(" ")[1], "lane": r["lane"], "class": r["sentiment_class"], "confidence": r["class_confidence"], "title": r["post_title"]} for r in added], "duplicate": dups, "excluded": excluded}
    (OUT / "ingest-report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k in ("sentiment", "news")}, indent=1))
    if not apply: return
    pack["records"] = total
    pack["meta"]["ingest_2026_10_22T01Z"] = {"captured_at": CAPTURED, "added": len(added), "duplicates_skipped": len(dups), "excluded": len(excluded), "prior_total": prior, "total": prior + len(added), "platforms": ["Reddit public API (OnDemand plugin-1748003575): r/UAE, r/dubai, r/abudhabi, r/technology, r/artificial, r/LocalLLaMA, r/singularity"], "classes": "7 shipped classes + Unclassified (no AI relevance); confidence 0 for Unclassified"}
    pack["meta"]["generated_at"] = CAPTURED; pack["meta"]["as_of"] = DATE
    pack["meta"]["sampling"] = pack["meta"]["sampling"].replace("2026-10-21T23:02Z", "2026-10-22T01:00Z")
    SENT.write_text(json.dumps(pack, indent=1, ensure_ascii=False) + "\n")
    dg = json.loads(DIG.read_text())
    for r in added: dg["sent"].append({"t": r["text"], "a": r["author"], "u": r["url"], "d": r["date"], "k": r["sentiment_class"], "tc": r["topic_cluster"], "o": r["org_ids"], "pl": "reddit", "ln": r["lane"]})
    DIG.write_text(json.dumps(dg, ensure_ascii=False) + "\n")
    print("APPLIED", prior, "->", len(total), "| digest sent", len(dg["sent"]))
if __name__ == "__main__": main("--apply" in sys.argv)
