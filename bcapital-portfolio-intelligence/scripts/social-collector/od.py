import json,os,urllib.request,urllib.error
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KEY=[l.split("=",1)[1].strip() for l in open(os.path.join(R,".env")) if l.startswith("ONDEMAND_API_KEY=")][0]
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36"
B="https://api.on-demand.io"
def post(p,b,t=60,stream=False):
    r=urllib.request.Request(B+p,method="POST",data=json.dumps(b).encode(),headers={"apikey":KEY,"content-type":"application/json","user-agent":UA,**({"accept":"text/event-stream"} if stream else {})})
    return urllib.request.urlopen(r,timeout=t)
def session(uid,plugins):
    return json.loads(post("/chat/v1/sessions",{"externalUserId":uid,"pluginIds":plugins},60).read())["data"]["id"]
def stream(sid,q,plugins,endpoint="predefined-deepseek-flash",t=240):
    f=post(f"/chat/v1/sessions/{sid}/query",{"query":q,"endpointId":endpoint,"responseMode":"stream","pluginIds":plugins,"reasoningMode":"low"},t,True)
    ans=""
    for raw in f:
        line=raw.decode("utf8","replace").strip()
        if not line.startswith("data:"): continue
        p=line[5:].strip()
        if p in("[DONE]",""): continue
        try: d=json.loads(p)
        except Exception: continue
        if d.get("eventType")=="fulfillment": ans+=d.get("answer","") or ""
    return ans
