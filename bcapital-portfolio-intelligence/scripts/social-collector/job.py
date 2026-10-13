"""One independent collection job: python3 job.py <job_id> <source> <sector> <slug,slug,...>
Writes raw items to data/social/raw/<job_id>.jsonl and a job record; admission happens in admit.py (checkpointed per job)."""
import json,os,re,sys,time,random,datetime,urllib.request,urllib.parse,xml.etree.ElementTree as ET
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import od
R=od.R; now=lambda: datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%SZ')
jid,source,sector,slugs=sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4].split(',')
SRC={c['slug']:c for c in json.load(open(f'{R}/data/social/sources.json'))['companies']}
RAW=f'{R}/data/social/raw/{jid}.jsonl'; META=f'{R}/data/social/raw/{jid}.job.json'
rec={'job_id':jid,'source':source,'sector':sector,'companies':slugs,'status':'running','started_at':now(),'finished_at':None,'queries':0,'posts_fetched':0,'session_ids':[],'http_calls':0,'errors':[]}
def save(): json.dump(rec,open(META,'w'))
save()
def emit(slug,q,items,extra):
    with open(RAW,'a') as f: f.write(json.dumps({'slug':slug,'query':q,'received_at':now(),'items':items,**extra})+'\n')
    rec['posts_fetched']+=len(items); rec['queries']+=1; save()
XP='plugin-1716326559'
XPROMPT='''Call FetchTweetDetails exactly once with api parameters: query={q}, section={sec}, language=en, limit=50, min_likes=0, min_retweets=0.
Then output ONLY a JSON array (no prose, no markdown) containing EVERY tweet the tool returned, copied verbatim from the tool output, each as:
{{"tweet_id": "<exact id string>", "username": "<screen name without @>", "name": "<display name>", "created_at": "<creation date exactly as returned>", "text": "<full text>", "avatar": "<profile_pic_url or null>", "media": ["<media urls>"], "likes": <int or null>, "retweets": <int or null>, "replies": <int or null>, "views": <int or null>}}
Do not invent, summarize, translate or omit tweets. If the tool returns nothing, output [].'''
def x_job():
    for s in slugs:
        for q in SRC[s]['x_queries']:
            for sec in (['latest','top'] if not q.startswith('"') or len(SRC[s]['x_queries'])<4 else ['top']):
                for att in range(3):
                    try:
                        sid=od.session(f'bsocial-{jid}',[XP]); rec['session_ids'].append(sid)
                        a=od.stream(sid,XPROMPT.format(q=json.dumps(q),sec=sec),[XP],t=200)
                        m=re.search(r'\[[\s\S]*\]',a); arr=json.loads(m.group(0)) if m else []
                        emit(s,q,arr,{'section':sec,'session_id':sid,'plugin_id':XP}); break
                    except Exception as e:
                        if att==2: rec['errors'].append(f'{q}/{sec}: {repr(e)[:140]}')
                        time.sleep(8*(att+1)+random.random()*4)
ns={'a':'http://www.w3.org/2005/Atom','m':'http://search.yahoo.com/mrss/'}
RUA='Mozilla/5.0 (X11; Linux x86_64) bcap-portfolio-intelligence/1.0 social-research'
def fetch(url):
    for att in range(6):
        try:
            rec['http_calls']+=1
            with urllib.request.urlopen(urllib.request.Request(url,headers={'user-agent':RUA}),timeout=20) as f: return f.status,f.read()
        except urllib.error.HTTPError as e:
            if e.code==429: time.sleep(10*(att+1)+random.random()*5); continue
            return e.code,b''
        except Exception: time.sleep(5)
    return 429,b''
def parse(xml):
    t=ET.fromstring(xml); out=[]
    for e in t.findall('a:entry',ns):
        i=(e.find('a:id',ns).text or '')
        if not i.startswith('t3_'): continue
        g=lambda k:e.find(f'a:{k}',ns); a=e.find('a:author/a:name',ns); th=e.find('m:thumbnail',ns); cat=e.find('a:category',ns)
        out.append({'id':i,'title':g('title').text,'link':g('link').attrib.get('href'),'author':a.text if a is not None else None,'published':g('published').text if g('published') is not None else None,'updated':g('updated').text,'subreddit':cat.attrib.get('label') if cat is not None else None,'thumbnail':th.attrib.get('url') if th is not None else None,'content_html':g('content').text})
    return out
def rsearch(q,sub=None,pages=2):
    items=[];after=None;calls=[]
    for p in range(pages):
        base=f'https://www.reddit.com/r/{sub}/search.rss' if sub else 'https://www.reddit.com/search.rss'
        prm={'q':q,'sort':'new','limit':100,'t':'all'}
        if sub: prm['restrict_sr']='on'
        if after: prm['after']=after
        url=base+'?'+urllib.parse.urlencode(prm); st,b=fetch(url); calls.append({'url':url,'status':st,'at':now()})
        if st!=200 or not b: break
        got=parse(b); items+=got
        if len(got)<25: break
        after=got[-1]['id']; time.sleep(3+random.random()*2)
    return items,calls
def reddit_job():
    for s in slugs:
        for q in SRC[s]['reddit_queries']:
            items,calls=rsearch(q); emit(s,q,items,{'endpoint':'reddit.com/search.rss','calls':calls})
            if any(c['status']!=200 for c in calls): rec['errors'].append(f'{q}: HTTP {[c["status"] for c in calls]}')
            time.sleep(3+random.random()*3)
        # subreddit-restricted search for the primary query
        for sub in SRC[s]['subreddits'][:3]:
            items,calls=rsearch(SRC[s]['reddit_queries'][0],sub,pages=1); emit(s,f'r/{sub} {SRC[s]["reddit_queries"][0]}',items,{'endpoint':f'reddit.com/r/{sub}/search.rss','calls':calls}); time.sleep(3+random.random()*3)
IP='plugin-1716164040'
IPROMPT='''Call getUserInfo for Instagram username "{u}", then call getUserPostInfo with its numeric id and count 33.
Output ONLY one JSON object copied verbatim from the tool outputs (no prose):
{{"username": str, "full_name": str, "id": str, "external_url": str|null, "is_verified": bool, "profile_pic_url": str|null,
 "posts": [{{"url": "<post URL exactly as returned or null>", "shortcode": str, "caption": str, "taken_at": "<timestamp exactly as returned>", "image_url": str|null, "video_url": str|null, "likes": int|null, "comments": int|null}}]}}
Include EVERY post returned. Never invent posts or URLs.'''
def insta_job():
    for s in slugs:
        u=SRC[s].get('instagram')
        if not u: continue
        for att in range(3):
            try:
                sid=od.session(f'bsocial-{jid}',[IP]); rec['session_ids'].append(sid)
                a=od.stream(sid,IPROMPT.format(u=u),[IP],t=200)
                m=re.search(r'\{[\s\S]*\}',a); j=json.loads(m.group(0)) if m else {}
                emit(s,u,j.get('posts') or [],{'session_id':sid,'plugin_id':IP,'profile':{k:j.get(k) for k in ('username','full_name','id','external_url','is_verified','profile_pic_url')}}); break
            except Exception as e:
                if att==2: rec['errors'].append(f'{u}: {repr(e)[:140]}')
                time.sleep(10*(att+1))
try:
    {'x':x_job,'reddit':reddit_job,'instagram':insta_job}[source]()
    rec['status']='ok' if not rec['errors'] else ('partial' if rec['queries'] else 'error')
except Exception as e:
    rec['status']='error'; rec['errors'].append(repr(e)[:200])
rec['finished_at']=now(); save()
