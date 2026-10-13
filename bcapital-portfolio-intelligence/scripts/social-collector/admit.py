"""Admission + per-job checkpoints + merge.
For every finished job (raw/<id>.jsonl) writes data/social/verified/<sector>-<source>-<job>.json with admitted posts + rejection counts,
then merges all checkpoints into data/social/verified-posts.json (dedup by native id / canonical URL / content hash, latest-first).
Rules: native id; native permalink (x.com/<user>/status/<id> | reddit.com/r/<sub>/comments/<id>/ | instagram.com/p|reel/<code>); author handle;
timestamp; text; company/founder/B Capital match (+context guard for ambiguous names). X: snowflake time == created_at (±2 s) and oEmbed resolves with same author."""
import json,os,re,glob,html,hashlib,datetime,urllib.request,urllib.parse,concurrent.futures as cf,time
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D=f'{R}/data/social'; now=lambda: datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%SZ')
SRC={c['slug']:c for c in json.load(open(f'{D}/sources.json'))['companies']}
PF={c['slug']:c for c in json.load(open(f'{R}/data/portfolio.json'))['companies']}
def rx(terms): return [re.compile(r'(?<![\w])'+re.escape(t)+r'(?![\w])',re.I) for t in terms if t]
MT={s:rx(c['match_terms']+c['founders']) for s,c in SRC.items()}
CG={s:re.compile(c['context_guard'],re.I) for s,c in SRC.items() if c.get('context_guard')}
BCAP=re.compile(r'\bB Capital\b|@BCapitalGroup',re.I)
def relevant(s,txt): return any(r.search(txt) for r in MT[s]) and (s not in CG or CG[s].search(txt))
iso=lambda ts: datetime.datetime.fromtimestamp(ts,datetime.UTC).strftime('%Y-%m-%dT%H:%M:%SZ')
def ptime(v):
    try: return datetime.datetime.strptime(v,'%a %b %d %H:%M:%S %z %Y').timestamp()
    except Exception:
        try: return datetime.datetime.fromisoformat(str(v).replace('Z','+00:00')).timestamp()
        except Exception: return None
OEC=f'{D}/oembed-cache.json'; oe=json.load(open(OEC)) if os.path.exists(OEC) else {}
def oembed(url,handle):
    if url in oe: return oe[url]
    u=url.replace('https://x.com/','https://twitter.com/')
    for att in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request('https://publish.twitter.com/oembed?omit_script=1&dnt=1&url='+urllib.parse.quote(u,safe=''),headers={'user-agent':'Mozilla/5.0 bcap-verify'}),timeout=15) as f:
                j=json.loads(f.read()); r={'status':200,'author':(j.get('author_url') or '').rstrip('/').split('/')[-1].lower(),'at':now()}; oe[url]=r; return r
        except urllib.error.HTTPError as e:
            if e.code in (429,500,502,503): time.sleep(3*(att+1)); continue
            r={'status':e.code}; oe[url]=r; return r
        except Exception: time.sleep(2)
    return {'status':'error'}
def company(s): c=PF[s]; return {'company_slug':s,'company':c['name'],'sector':c['sector'],'company_domain':c.get('domain')}
def admit_job(meta):
    jid=meta['job_id']; src=meta['source']; rej={}; posts=[]; fetched=0
    def R_(k): rej[k]=rej.get(k,0)+1
    raw=f'{D}/raw/{jid}.jsonl'
    lines=[json.loads(l) for l in open(raw)] if os.path.exists(raw) else []
    for L in lines:
        s=L['slug']
        for it in L['items']:
            fetched+=1
            if src=='x':
                tid=str(it.get('tweet_id') or ''); u=str(it.get('username') or '').lstrip('@')
                if not re.fullmatch(r'\d{15,20}',tid) or not re.fullmatch(r'[A-Za-z0-9_]{1,15}',u): R_('missing_native_id_or_handle'); continue
                ts=ptime(str(it.get('created_at') or ''))
                if ts is None or abs(((int(tid)>>22)+1288834974657)/1000-ts)>2: R_('snowflake_timestamp_mismatch'); continue
                txt=str(it.get('text') or '').strip()
                if not txt: R_('empty_text'); continue
                if not (relevant(s,txt+' @'+u+' '+str(it.get('name') or '')) or BCAP.search(txt)): R_('not_relevant'); continue
                media=[m for m in (it.get('media') or []) if isinstance(m,str) and m.startswith('https://')]
                posts.append({'id':f'x:{tid}','platform':'x','provider_native_id':tid,'url':f'https://x.com/{u}/status/{tid}','source_domain':'x.com','author':str(it.get('name') or u),'author_handle':u,
                  'author_avatar':it.get('avatar') if str(it.get('avatar') or '').startswith('https://') else None,'text':txt,'posted_at':iso(ts),'image':media[0] if media else None,
                  'media':[{'type':'video' if 'video' in m else 'image','url':m} for m in media],'engagement':{k:it.get(k2) for k,k2 in (('likes','likes'),('reposts','retweets'),('replies','replies'),('views','views'))},**company(s),
                  'source_evidence':{'kind':'provider-response','provider':'x','transport':'server','authenticated':True,'plugin_id':L.get('plugin_id'),'tool':'FetchTweetDetails','native_id':tid,'session_id':L.get('session_id'),'job_id':jid,'query':L['query'],'section':L.get('section'),'fetched_at':L['received_at'],'snowflake_check':'pass'}})
            elif src=='reddit':
                link=it.get('link') or ''
                m=re.fullmatch(r'https://www\.reddit\.com/r/([A-Za-z0-9_]+)/comments/([a-z0-9]+)/[^/]*/?',link)
                if not m or it['id']!=f't3_{m.group(2)}': R_('not_native_permalink'); continue
                if not it.get('author') or not (it.get('published') or it.get('updated')): R_('missing_author_or_time'); continue
                body=re.sub(r'<[^>]+>',' ',html.unescape(it.get('content_html') or '')); body=re.sub(r'\s+',' ',body).strip(); body=re.sub(r'\s*submitted by\s*/u/\S+.*$','',body).strip()
                title=html.unescape(it.get('title') or '').strip()
                if not title: R_('empty_text'); continue
                if not (relevant(s,title) or (len(body)<1500 and relevant(s,title+' '+body[:600]))): R_('not_relevant'); continue
                th=it.get('thumbnail') if str(it.get('thumbnail') or '').startswith('https://') else None
                txt=title+(('\n\n'+body[:600]) if body and body!=title else '')
                posts.append({'id':f'reddit:{m.group(2)}','platform':'reddit','provider_native_id':m.group(2),'url':link.rstrip('/'),'source_domain':'reddit.com','author':it['author'].replace('/u/','u/'),'author_handle':it['author'].replace('/u/',''),'author_avatar':None,
                  'text':txt,'title':title,'subreddit':m.group(1),'posted_at':(it.get('published') or it['updated']).replace('+00:00','Z'),'image':th,'media':[{'type':'image','url':th}] if th else [],'engagement':None,**company(s),
                  'source_evidence':{'kind':'provider-response','provider':'reddit','transport':'server','authenticated':False,'endpoint':L.get('endpoint'),'native_id':m.group(2),'job_id':jid,'query':L['query'],'fetched_at':L['received_at'],'http_status':[c['status'] for c in L.get('calls',[])]}})
            else:
                sc=str(it.get('shortcode') or '')
                if not sc and it.get('url'): mm=re.search(r'instagram\.com/(?:p|reel)/([A-Za-z0-9_-]+)',str(it['url'])); sc=mm.group(1) if mm else ''
                prof=L.get('profile') or {}
                if not re.fullmatch(r'[A-Za-z0-9_-]{6,20}',sc) or not str(it.get('taken_at') or '').isdigit(): R_('missing_native_id_or_time'); continue
                if not (it.get('caption') or '').strip(): R_('empty_text'); continue
                if not prof.get('username') or str(prof.get('username')).lower()!=str(SRC[s]['instagram']).lower(): R_('account_mismatch'); continue
                kind='reel' if it.get('video_url') else 'p'
                media=[{'type':'image','url':it['image_url']}] if str(it.get('image_url') or '').startswith('https://') else []
                posts.append({'id':f'instagram:{sc}','platform':'instagram','provider_native_id':sc,'url':f'https://www.instagram.com/{kind}/{sc}','source_domain':'instagram.com','author':prof.get('full_name') or prof['username'],'author_handle':prof['username'],
                  'author_avatar':prof.get('profile_pic_url') if str(prof.get('profile_pic_url') or '').startswith('https://') else None,'text':it['caption'].strip(),'posted_at':iso(int(it['taken_at'])),'image':media[0]['url'] if media else None,'media':media,
                  'engagement':{'likes':it.get('likes'),'comments':it.get('comments')},**company(s),
                  'source_evidence':{'kind':'provider-response','provider':'instagram','transport':'server','authenticated':True,'plugin_id':L.get('plugin_id'),'tool':'getUserPostInfo','native_id':sc,'session_id':L.get('session_id'),'job_id':jid,'fetched_at':L['received_at'],'account':prof.get('username'),'account_external_url':prof.get('external_url')}})
    # X: oEmbed verification (parallel)
    xs=[p for p in posts if p['platform']=='x']
    with cf.ThreadPoolExecutor(10) as ex: res=list(ex.map(lambda p:oembed(p['url'],p['author_handle']),xs))
    keep=[]; bad=set()
    for p,r in zip(xs,res):
        if r.get('status')!=200: R_('x_oembed_unresolved'); bad.add(p['id']); continue
        if r.get('author')!=p['author_handle'].lower(): R_('x_oembed_author_mismatch'); bad.add(p['id']); continue
        p['source_evidence']['oembed_verified']={'status':200,'at':r.get('at')}
    posts=[p for p in posts if p['id'] not in bad]
    # in-job dedupe
    seen=set(); out=[]
    for p in posts:
        if p['id'] in seen: R_('duplicate_in_job'); continue
        seen.add(p['id']); out.append(p)
    ck={'job_id':jid,'sector':meta['sector'],'source':src,'companies':meta['companies'],'status':meta['status'],'started_at':meta['started_at'],'finished_at':meta['finished_at'],'checkpointed_at':now(),
        'posts_fetched':fetched,'posts_admitted':len(out),'posts_rejected':fetched-len(out),'rejections':rej,'errors':meta['errors'],'session_ids':meta.get('session_ids',[]),'http_calls':meta.get('http_calls',0),'posts':out}
    json.dump(ck,open(f"{D}/verified/{meta['sector']}-{src}-{jid}.json",'w'))
    return ck
def merge():
    allp=[]; jobs=[]
    for f in sorted(glob.glob(f'{D}/verified/*.json')):
        ck=json.load(open(f)); jobs.append({k:v for k,v in ck.items() if k not in ('posts','session_ids')}|{'sessions':len(ck.get('session_ids',[])),'first_session_id':(ck.get('session_ids') or [None])[0],'checkpoint':os.path.relpath(f,R)}); allp+=ck['posts']
    allp.sort(key=lambda p:p['posted_at'],reverse=True)
    seen_id=set(); seen_url=set(); seen_h=set(); out=[]; dup=0
    for p in allp:
        h=hashlib.sha1((p['company_slug']+'|'+re.sub(r'\s+',' ',p['text'].lower()).strip()).encode()).hexdigest()
        if p['id'] in seen_id or p['url'] in seen_url or h in seen_h: dup+=1; continue
        seen_id.add(p['id']); seen_url.add(p['url']); seen_h.add(h); p['content_hash']=h; out.append(p)
    byp={};bys={}
    for p in out: byp[p['platform']]=byp.get(p['platform'],0)+1; bys[p['sector']]=bys.get(p['sector'],0)+1
    m={'generated_at':now(),'count':len(out),'by_platform':byp,'by_sector':bys,'duplicates_removed':dup,'jobs':jobs,'posts':out}
    json.dump(m,open(f'{D}/verified-posts.json','w'))
    return m
if __name__=='__main__':
    import sys
    done=set(os.path.basename(f).split('-')[-1][:-5] for f in glob.glob(f'{D}/verified/*.json'))
    for mf in sorted(glob.glob(f'{D}/raw/*.job.json')):
        meta=json.load(open(mf))
        if (meta['status']=='running' and '--partial' not in sys.argv) or (meta['job_id'] in done and meta['status']!='running' and '--all' not in sys.argv): continue
        ck=admit_job(meta); print(ck['job_id'],ck['source'],ck['sector'],ck['posts_fetched'],ck['posts_admitted'],ck['status'])
    json.dump(oe,open(OEC,'w'))
    m=merge(); print('MERGED',m['count'],m['by_platform'],m['by_sector'])
