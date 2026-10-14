"""Mass pull via OnDemand Chat API (documented: POST /chat/v1/sessions -> POST /chat/v1/sessions/{id}/query, apikey header).
Chat Batch endpoint POST /chat/v1/batches returns 405 method_not_allowed (verified 2026-10-14), so batches = parallel Chat API jobs.
TikTok plugin-1716372717 is quota-blocked; TikTok/Reddit items are sourced via Internet plugin-1713924030 (web search) and
Perplexity plugin-1722260873, extracting ONLY canonical URLs present in answers (no invented URLs). Missing fields = null.
Output: /tmp/masspull/items.jsonl + stats.json. Key read from web/.env.local, never printed."""
import pathlib, requests, concurrent.futures, re, json, hashlib, time, sys
BASE="https://api.on-demand.io"; ROOT=pathlib.Path(__file__).resolve().parent.parent
key=None
for l in (ROOT/"web/.env.local").read_text().splitlines():
    if l.startswith("ONDEMAND_API_KEY="): key=l.split("=",1)[1].strip()
H={"apikey":key,"content-type":"application/json"}
OUT=pathlib.Path("/tmp/masspull"); OUT.mkdir(parents=True,exist_ok=True)
TK=re.compile(r"https://www\.tiktok\.com/@([A-Za-z0-9_.]+)/video/(\d+)")
RD=re.compile(r"https://www\.reddit\.com/r/([A-Za-z0-9_]+)/comments/([A-Za-z0-9]+)(?:/[^)\s\"']*)?/?")
def ask(plugin, query):
    s=requests.post(f"{BASE}/chat/v1/sessions",headers=H,json={"externalUserId":"masspull-batch","pluginIds":[plugin]},timeout=60); s.raise_for_status()
    sid=s.json()["data"]["id"]
    r=requests.post(f"{BASE}/chat/v1/sessions/{sid}/query",headers=H,json={"query":query,"endpointId":"predefined-deepseek-flash","responseMode":"sync","pluginIds":[plugin],"reasoningMode":"low"},timeout=240)
    r.raise_for_status(); return sid,str(r.json().get("data",{}).get("answer",""))
def title_near(text,url):
    lines_all=text.splitlines()
    for idx,line in enumerate(lines_all):
        if url in line:
            for back in range(idx-1, max(-1, idx-8), -1):
                b=lines_all[back].strip()
                import re as _re
                m=_re.search(r"\*\*([^*]+)\*\*", b)
                if m and "reddit" not in m.group(1).lower() and "tiktok" not in m.group(1).lower(): return m.group(1).strip()[:220]
                if b.startswith("#") and len(b)>4: return b.lstrip("# ").strip()[:220]
            break
    for line in text.splitlines():
        if url not in line: continue
        if line.strip().startswith("|"):
            cells=[re.sub(r"[*#>`]","",c).strip() for c in line.strip().strip("|").split("|")]
            cells=[c for c in cells if c and url not in c and not c.lower().startswith("http")]
            if cells: return cells[0][:220]
        m=re.search(r"\[([^\]]+)\]\("+re.escape(url),line)
        if m: return m.group(1)[:220]
        m=re.search(r"\*\*([^*]+)\*\*",line)
        if m: return m.group(1)[:220]
        clean=re.sub(r"https?://\S+","",line); clean=re.sub(r"[*#>|`]","",clean).strip(" -0123456789.")
        if clean and clean.lower() not in ("url:","url"): return clean[:220]
    i=text.find(url); seg=text[max(0,i-500):i]
    lines=[re.sub(r"[*#>|`]","",l).strip(" -0123456789.") for l in seg.splitlines() if l.strip() and "http" not in l and l.strip().lower() not in ("url:","url")]
    return (lines[-1][:220] if lines else None)
def work(job):
    kind,topic=job; items=[]; sid=None; status="ok"
    try:
        if kind=="tiktok":
            sid,ans=ask("plugin-1713924030",f"Find TikTok videos about {topic}. List up to 10 videos. For each give: title/caption, creator handle, direct TikTok URL (tiktok.com/@user/video/<id>), and date if known. Only list videos with a real direct TikTok URL from your sources.")
            for m in TK.finditer(ans):
                u=f"https://www.tiktok.com/@{m.group(1)}/video/{m.group(2)}"
                items.append({"source":"TikTok","title":title_near(ans,u),"text":title_near(ans,u),"author":f"@{m.group(1)}","handle":f"@{m.group(1)}","subreddit":None,"url":u,"timestamp":None,"company_tags":[],"topic_tags":[topic],"sentiment":None,"engagement":None,"session_id":sid,"plugin_id":"plugin-1713924030"})
        else:
            sid,ans=ask("plugin-1713924030",f"List Reddit posts about {topic}. For each give: title, subreddit, author if known, and direct reddit.com/r/<subreddit>/comments/<id> URL. Only URLs from your sources.")
            for m in RD.finditer(ans):
                u=f"https://www.reddit.com/r/{m.group(1)}/comments/{m.group(2)}"
                items.append({"source":"Reddit","title":title_near(ans,u),"text":title_near(ans,u),"author":None,"handle":None,"subreddit":f"r/{m.group(1)}","url":u,"timestamp":None,"company_tags":[],"topic_tags":[topic],"sentiment":None,"engagement":None,"session_id":sid,"plugin_id":"plugin-1713924030"})
    except Exception as e: status=f"error:{type(e).__name__}"
    return {"kind":kind,"topic":topic,"status":status,"session_id":sid,"items":items}
TOPICS_TK=["geothermal energy startups","fintech startups India","AI marketing trends","climate tech innovation","robotics startups Boston Dynamics","health tech startups","edtech startups","logistics supply chain startups","consumer fintech apps","AI enterprise software","biotech startups","solar energy startups","EV battery startups","cybersecurity startups","food delivery startups","ecommerce startups Southeast Asia","mental health apps","wearable health tech","AI video generation","creator economy tools","payments startups","insurtech startups","agritech startups","space tech startups","quantum computing startups","semiconductor startups","real estate proptech","travel tech startups","gaming startups","social media marketing tips small business"]
TOPICS_RD=["geothermal energy startups Fervo Energy","fintech startups","AI marketing trends","climate tech startups","robotics startups","health tech startups","edtech startups","cybersecurity startups","startup fundraising venture capital","AI enterprise software startups"]
jobs=[("tiktok",t) for t in TOPICS_TK]+[("reddit",t) for t in TOPICS_RD]
t0=time.time(); results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    for r in ex.map(work,jobs): results.append(r); print(r["kind"],r["topic"][:40],r["status"],len(r["items"]),flush=True)
seen={}; out=[]
for r in results:
    for it in r["items"]:
        h=hashlib.sha256(it["url"].encode()).hexdigest()
        if h in seen: continue
        seen[h]=1; it["content_hash"]=h; out.append(it)
(OUT/"items.jsonl").write_text("\n".join(json.dumps(x) for x in out))
import collections
stats={"jobs":len(jobs),"ok":sum(1 for r in results if r["status"]=="ok"),"elapsed_s":round(time.time()-t0,1),"unique_items":len(out),"by_source":dict(collections.Counter(x["source"] for x in out)),"sessions":[r["session_id"] for r in results if r["session_id"]]}
(OUT/"stats.json").write_text(json.dumps(stats,indent=1)); print(json.dumps(stats))
