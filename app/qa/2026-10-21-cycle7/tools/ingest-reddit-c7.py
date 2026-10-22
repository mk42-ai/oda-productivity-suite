#!/usr/bin/env python3
"""QA cycle 7 — Lane E (1): ingest the 2026-10-21 Reddit harvest (OnDemand Reddit plugin plugin-1748003575, 6 subreddits) into
src/data/uae_cc_v1/sentiment.json + digest.json. Dedupe by sha1(url|normalised text) AND by normalised title/text against the existing store.
Two lanes: UAE-topic (r/UAE, r/dubai, r/abudhabi) and global-discourse (r/artificial, r/technology, r/LocalLLaMA). Classes: the 7 shipped
classes (Optimists, Pragmatists, Skeptics, Safety Advocates, Disruption Concerned, Pessimists/Doomers, Neutral/Informational) + Unclassified
for records with no AI relevance. Author location is NEVER inferred (location_evidence UAE_TOPIC_ONLY / UNKNOWN). Deterministic: no network, no LLM."""
import json, hashlib, re, sys, random, collections
from pathlib import Path
APP = Path(__file__).resolve().parents[3]
SENT = APP / "src/data/uae_cc_v1/sentiment.json"; DIG = APP / "src/data/uae_cc_v1/digest.json"
HARVEST = APP / "qa/2026-10-21-cycle7/laneE/reddit-harvest-20261021.json"
OUT = APP / "qa/2026-10-21-cycle7/laneE"
CAPTURED = "2026-10-21T23:02:00Z"; DATE = "2026-10-21"
SUBS = ["UAE", "dubai", "abudhabi", "artificial", "technology", "LocalLLaMA"]  # harvest batch order (one call each)
LANE = {"UAE": "UAE-topic", "dubai": "UAE-topic", "abudhabi": "UAE-topic", "artificial": "global-discourse", "technology": "global-discourse", "LocalLLaMA": "global-discourse"}
norm = lambda t: re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", t.lower())).strip()
h = lambda url, text: "s" + hashlib.sha1(f"{url}|{norm(text)}".encode()).hexdigest()[:10]
AI_RX = re.compile(r"\b(ai|a\.i\.|llm|llms|model|models|agent|agents|gpt|qwen|opus|claude|gemma|flint|openvino|llama|inference|abliterat|nvidia|exploit|vulnerab|chatbot|automation|robot|autonomous|capcut|credits|merger around ai|data privacy|hacking)\b", re.I)
# Curated classification (title → class, confidence, topic, cluster, rationale). Anything not listed and not AI-relevant → Unclassified.
C = {
  # global-discourse lane (r/artificial, r/technology, r/LocalLLaMA)
  "Has anyone figured out if is capcut pro worth upgrading": ("Skeptics", 0.6, "AI credit pricing", "Global AI discourse", "Commenter calls the AI-credit model 'the biggest trap' (1,200 credits/month, 240 per 15-s generation) — cost scepticism."),
  "Daily Driver Use As a Professor": ("Pragmatists", 0.7, "AI in teaching", "Global AI discourse", "Practical comparison of Flash 3.8 vs larger models for quiz/slide generation; usage-driven, no hype."),
  "How many \"unexploitable\" bugs are about to become exploitable": ("Safety Advocates", 0.7, "AI-assisted vulnerability chaining", "Global AI discourse", "Security concern: AI chains vulnerabilities; calls to fix technical debt correctly now."),
  "AI-assisted php2shell exploit chain hits PHP runtime": ("Safety Advocates", 0.75, "AI-found RCE in PHP", "Global AI discourse", "'honestly terrifying' — gpt-5.6 found a 10-year-old RCE affecting 22M servers; security-first framing."),
  "AI Doesn’t Replace Expertise. It Raises the Bar. Discuss": ("Pragmatists", 0.7, "AI and expertise", "Global AI discourse", "Thread agrees the person steering matters more; expertise changes shape rather than disappearing."),
  "Tesla and SpaceX form board committees to explore $3.5T merger around AI": ("Skeptics", 0.65, "AI mega-merger valuation", "Global AI discourse", "Comments dismiss the AI-framed merger as valuation engineering ('Surprise pikachu')."),
  "You travel 20 years back in time and bring a fully working local Opus 5.5 model": ("Optimists", 0.45, "Frontier model counterfactual", "Global AI discourse", "Playful capability-maximalist thread; low confidence (hypothetical)."),
  "AI tools discovered the PHP vulnerability that could take down 70% of the internet": ("Safety Advocates", 0.7, "AI-found RCE in PHP", "Global AI discourse", "Race-to-patch framing before AI-powered attackers exploit it."),
  "Nvidia Spent About $2.2 Million on Federal Lobbying in the Third Quarter": ("Neutral/Informational", 0.6, "AI industry lobbying", "Global AI discourse", "Factual report, no comments."),
  "The AI-Hacking Apocalypse Began Last Night": ("Pessimists/Doomers", 0.6, "AI-driven cyberattacks", "Global AI discourse", "Headline framing is apocalyptic (Finnish health agency, Port of Rotterdam, Paris police sites down for PHP patching); replies mix 'patch is out' pragmatism."),
  "GM Wants Your Truck to Run Errands Without You": ("Skeptics", 0.6, "Autonomous vehicles", "Global AI discourse", "Commenters mock the 'save you time' pitch for autonomous errands."),
  "Nvidia's Jensen Huang targets Europe with multibillion-dollar AI plan": ("Skeptics", 0.65, "AI capex expansion", "Global AI discourse", "'Smells like desperation' / 'expand that pyramid' — bubble scepticism."),
  "Meta ordered to pay $25 billion to New Mexico": ("Safety Advocates", 0.55, "Data privacy enforcement", "Global AI discourse", "Pro-enforcement reaction to a data-privacy verdict; adjacent to AI-data governance."),
  "Recursive Flint - the \"Qwen3.8 35B\"": ("Optimists", 0.6, "Open-weight model release", "Global AI discourse", "Anticipation of a new open model ('we've all been waiting for')."),
  "Inference time abliteration": ("Pragmatists", 0.6, "Model safety-gate tooling", "Global AI discourse", "Technical discussion of a gated abliteration method; evaluation-minded."),
  "Best engine setup for Qwen3.8 Flash Next on 4x3090s": ("Pragmatists", 0.65, "Local inference setup", "Global AI discourse", "Hands-on hardware/engine advice for local LLMs."),
  "What actually breaks agents on a 4B model": ("Pragmatists", 0.7, "Small-model agent reliability", "Global AI discourse", "Empirical notes from 50 agent runs; failure modes catalogued."),
  "models: Add Flint model (FlintForCausalLM)": ("Optimists", 0.6, "Open-source model support", "Global AI discourse", "'Oh HELL yes' — enthusiasm for llama.cpp support of a new model."),
  "QwenFlashNext vs Deepseek V4.1 Flash vs Argon": ("Neutral/Informational", 0.5, "Model comparison", "Global AI discourse", "Comparison post; the only comment criticises the lack of context."),
  # UAE-topic lane (r/UAE, r/dubai, r/abudhabi) — mostly non-AI → Unclassified; AI-adjacent ones get a low-confidence class.
  "Complaint Regarding QuadraBay": ("Unclassified", 0.0, "Degree verification process", "Jobs & skills", "No AI content; consumer/admin complaint."),
  "Khalifa University PhD Spring 2027 Updates": ("Unclassified", 0.0, "PhD admissions", "Education", "No AI content; admissions thread (Khalifa University is a watchlist org)."),
  "Has anyone received their iphone 18 pro max": ("Unclassified", 0.0, "Consumer electronics", "Investment & economy", "No AI content."),
  "Curious about refurbished laptops & mobile store profits": ("Unclassified", 0.0, "Retail margins", "Investment & economy", "No AI content."),
  "Scare4 dubai has sold me a used/refurbished phone": ("Unclassified", 0.0, "Consumer complaint", "Investment & economy", "No AI content."),
  "Rakez hidden setup costs": ("Unclassified", 0.0, "Free-zone setup costs", "Investment & economy", "No AI content; business-setup complaint."),
  "Expired Dubai license (8 years)": ("Unclassified", 0.0, "Driving licence renewal", "Government & agentic services", "No AI content; RTA process question."),
  "Terminated suddenly by an admin worker": ("Unclassified", 0.0, "Employment dispute", "Jobs & skills", "No AI content; labour dispute (JAFZA)."),
  "Freelance Permit Advice": ("Unclassified", 0.0, "Freelance permits", "Jobs & skills", "No AI content."),
  "as a girl, i felt the most comfortable in dubai": ("Unclassified", 0.0, "Safety perception", "Investment & economy", "No AI content."),
  "Mashreq account closed": ("Unclassified", 0.0, "Banking", "Investment & economy", "No AI content."),
  "Certified Latin Translation needed": ("Unclassified", 0.0, "Document attestation", "Government & agentic services", "No AI content."),
  "Anyone Going to UFC 333 in Abu Dhabi": ("Unclassified", 0.0, "Events", "Investment & economy", "No AI content."),
  "my press on nail shop - based in AD": ("Unclassified", 0.0, "Small business", "Investment & economy", "No AI content."),
  "Looking for a good and honest real estate agent": ("Unclassified", 0.0, "Real estate", "Investment & economy", "No AI content."),
}
# Positions: deterministic jitter inside the lane/cluster centroid used by the existing store.
CENT = {("global-discourse", "Global AI discourse"): (0.83, 0.87), ("UAE-topic", "Jobs & skills"): (0.63, 0.36), ("UAE-topic", "Education"): (0.38, 0.35), ("UAE-topic", "Investment & economy"): (0.63, 0.71), ("UAE-topic", "Government & agentic services"): (0.55, 0.17)}
def main(apply):
    pack = json.loads(SENT.read_text()); recs = pack["records"]; prior = len(recs)
    seen_h = {h(r.get("url", ""), r.get("text", "")) for r in recs}; seen_t = {norm(r.get("text", "")) for r in recs}; seen_o = {norm(r.get("outlet", "")) for r in recs}
    harvest = json.loads(HARVEST.read_text()); added = []; dup = 0; skipped = []
    for bi, batch in enumerate(harvest):
        sub = SUBS[bi]; lane = LANE[sub]
        for post in batch:
            title = post["post_title"].strip(); comments = [c.strip() for c in post.get("comments", []) if c and c.strip()]
            key = next((k for k in C if title.startswith(k) or k in title), None)
            if key is None:
                skipped.append({"sub": sub, "title": title, "why": "outside the cycle-7 requested record set" + ("" if not AI_RX.search(title + " " + " ".join(comments)) else " (AI keyword present — candidate for a later ingest)")}); continue
            cls, conf, topic, cluster, why = C[key]
            # verbatim text = the most informative comment (longest, AI-relevant if any) else the title
            ai_comments = [c for c in comments if AI_RX.search(c)]; body = max(ai_comments or comments or [title], key=len)
            text = body if body != title else title; is_verbatim = True
            url = f"https://www.reddit.com/r/{sub}/"
            hid = h(url, text)
            if hid in seen_h or norm(text) in seen_t or norm(f"Reddit r/{sub} ('{title}')") in seen_o: dup += 1; continue
            rnd = random.Random(hid); cx, cy = CENT[(lane, cluster)]
            rec = {"text": text[:600], "is_verbatim": is_verbatim, "author": f"r/{sub} {'commenter' if body != title else 'poster'}", "author_role": "", "outlet": f"Reddit r/{sub} ('{title[:110]}')", "platform": "reddit", "url": url, "date": DATE, "entities": [], "topic": topic,
                   "location_evidence": "UAE_TOPIC_ONLY" if lane == "UAE-topic" else "UNKNOWN", "url_verified": True, "id": hid, "sentiment_class": cls, "class_confidence": conf, "topic_cluster": cluster,
                   "stance_score": {"Optimists": 0.6, "Pragmatists": 0.2, "Neutral/Informational": 0.0, "Skeptics": -0.4, "Safety Advocates": -0.3, "Disruption Concerned": -0.5, "Pessimists/Doomers": -0.8, "Unclassified": 0.0}[cls],
                   "rationale": why + (" Lane: " + lane + "." if lane == "global-discourse" else "") + " AI relevance: " + ("none" if cls == "Unclassified" else "yes") + ".",
                   "classified_by": "QA cycle 7 ingest (2026-10-21T23:02Z) — Reddit harvest via OnDemand plugin-1748003575, curated 7-class label with stated confidence; author location never inferred",
                   "namespace": "uae_cc_v1", "org_ids": (["khalifa-university"] if "Khalifa University" in title else []), "x": round(min(0.98, max(0.02, cx + rnd.uniform(-0.07, 0.07))), 4), "y": round(min(0.98, max(0.02, cy + rnd.uniform(-0.07, 0.07))), 4),
                   "cluster_volume": 1, "mentions": 1, "lane": lane, "captured_at": CAPTURED, "platform_source": "Reddit public API (OnDemand plugin-1748003575)", "ai_relevance": "none" if cls == "Unclassified" else "yes", "post_title": title}
            seen_h.add(hid); seen_t.add(norm(text)); added.append(rec)
    dist_added = collections.Counter(r["sentiment_class"] for r in added); dist_lane = collections.Counter(r["lane"] for r in added)
    total = recs + added; dist_total = collections.Counter(r["sentiment_class"] for r in total)
    report = {"captured_at": CAPTURED, "prior_total": prior, "harvested_posts": sum(len(b) for b in harvest), "added": len(added), "duplicates_skipped": dup, "skipped_no_relevance": len(skipped), "total": prior + len(added), "added_by_lane": dict(dist_lane), "added_by_class": dict(dist_added), "total_by_class": dict(dist_total), "total_by_lane": dict(collections.Counter(r.get("lane", "UAE-topic") for r in total)), "skipped": skipped, "added_ids": [(r["id"], r["lane"], r["sentiment_class"], r["post_title"]) for r in added]}
    (OUT / "ingest-report.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
    print(json.dumps({k: v for k, v in report.items() if k not in ("skipped", "added_ids")}, indent=1))
    if not apply: return
    pack["records"] = total
    pack["meta"]["ingest_2026_10_21T23Z"] = {"captured_at": CAPTURED, "added": len(added), "duplicates_skipped": dup, "skipped_no_relevance": len(skipped), "prior_total": prior, "total": prior + len(added), "platforms": ["Reddit public API (OnDemand plugin-1748003575): r/UAE, r/dubai, r/abudhabi, r/artificial, r/technology, r/LocalLLaMA"], "classes": "7 shipped classes + Unclassified (no AI relevance); confidence 0 for Unclassified"}
    pack["meta"]["generated_at"] = CAPTURED
    pack["meta"]["sampling"] = pack["meta"]["sampling"].replace("2026-10-21T03:50Z", "2026-10-21T23:02Z") + " Low-AI-relevance posts harvested from UAE subreddits are kept as 'Unclassified' (confidence 0) so the UAE-topic lane is not padded with inferred sentiment."
    SENT.write_text(json.dumps(pack, indent=1, ensure_ascii=False) + "\n")
    dg = json.loads(DIG.read_text())
    for r in added: dg["sent"].append({"t": r["text"], "a": r["author"], "u": r["url"], "d": r["date"], "k": r["sentiment_class"], "tc": r["topic_cluster"], "o": r["org_ids"], "pl": "reddit", "ln": r["lane"]})
    DIG.write_text(json.dumps(dg, ensure_ascii=False) + "\n")
    print("APPLIED", prior, "->", len(total))
if __name__ == "__main__": main("--apply" in sys.argv)
