"""Sentiment (-1..1) + one 'B Capital Agent' takeaway per verified post via Cerebras Qwen 3.8 (predefined-cerebras-qwen-3.8-27b). Cached by post id."""
import json,re,os,sys,time,random,concurrent.futures as cf
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); import od
D=f'{od.R}/data/social'; CACHE=f'{D}/scores.json'; QW='predefined-cerebras-qwen-3.8-27b'
cache=json.load(open(CACHE)) if os.path.exists(CACHE) else {}
P=json.load(open(f'{D}/verified-posts.json'))['posts']; todo=[p for p in P if p['id'] not in cache]
chunks=[todo[i:i+25] for i in range(0,len(todo),25)]
def run(ch):
    items=[{'id':p['id'],'company':p['company'],'platform':p['platform'],'text':p['text'][:400]} for p in ch]
    q=("You are the 'B Capital Agent'. For EACH social post return a sentiment score toward the named portfolio company from -1 to 1 (0 if neutral) and ONE takeaway (max 24 words) for a B Capital investor using ONLY facts in the post. Return ONLY JSON mapping id -> {\"s\": number, \"t\": string}.\nPOSTS:\n"+json.dumps(items,ensure_ascii=False))
    for att in range(4):
        try:
            s=od.session('bsocial-score',[]); a=od.stream(s,q,[],endpoint=QW,t=120); m=re.search(r'\{[\s\S]*\}',a); j=json.loads(m.group(0)) if m else {}
            out={k:v for k,v in j.items() if isinstance(v,dict) and isinstance(v.get('t'),str)}
            if out: return s,out
        except Exception: pass
        time.sleep(12*(att+1)+random.random()*4)
    return None,{}
with cf.ThreadPoolExecutor(3) as ex:
    for s,out in ex.map(run,chunks):
        for k,v in out.items():
            try: sc=max(-1.0,min(1.0,float(v.get('s',0))))
            except Exception: sc=0.0
            cache[k]={'score':round(sc,2),'takeaway':v['t'][:240],'session_id':s}
        json.dump(cache,open(CACHE,'w'))
print(len(todo),len(cache))
