"""Build a versioned, self-contained B Social snapshot from the RUNNING backend (/data/social-feed) + repo data files.
Outputs (to argv[1] dir): b-social-snapshot-<ts>.sqlite, .posts.ndjson, .posts.csv, manifest.json (row counts + SHA-256).
Tables: posts (verified | unverified | hidden), companies, people, takeaways, worker_runs, ingestion_receipts, sources, meta."""
import json,os,sys,sqlite3,csv,hashlib,datetime,urllib.request,re
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out=sys.argv[1]; be=sys.argv[2] if len(sys.argv)>2 else None
os.makedirs(out,exist_ok=True)
ts=datetime.datetime.now(datetime.UTC).strftime('%Y%m%dT%H%M%SZ'); base=f'{out}/b-social-snapshot-{ts}'
live=json.loads(urllib.request.urlopen(f'{be}/data/social-feed',timeout=120).read()) if be else json.load(open('/tmp/snap/live-feed.json'))
V=json.load(open(f'{R}/data/social/verified-posts.json'))
def nid(p): return f"{p.get('platform')}:{p.get('provider_native_id') or (p.get('provenance') or {}).get('native_id') or (p.get('source_evidence') or {}).get('native_id')}"
vby={}
for _p in V['posts']: vby[_p['url']]=_p; vby[nid(_p)]=_p
legacy=json.load(open(f'{R}/data/social-feed.json'))['posts']
rec={}
try: rec=json.load(open(f'{R}/data/social/legacy-reddit-recovered.json'))
except Exception: pass
PF=json.load(open(f'{R}/data/portfolio.json')); PPL=json.load(open(f'{R}/data/people.json'))
SRC=json.load(open(f'{R}/data/social/sources.json'))
db=sqlite3.connect(base+'.sqlite')
db.executescript(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'schema.sql')).read())
visible_urls=set(); unverified_urls=set(); rows=[]
for p in live['posts']:
    v=p.get('verification','verified'); full=vby.get(p['url']) or vby.get(nid(p)) or {}
    # carry the newest Qwen takeaway / sentiment from the merged verified dataset into the public row (the live process may predate the backfill)
    if (full.get('agent_takeaway') or {}).get('text') and not (p.get('agent_takeaway') or {}).get('text'): p['agent_takeaway']=full['agent_takeaway']
    if isinstance(full.get('sentiment'),dict) and not p.get('sentiment'): p['sentiment']=full['sentiment']
    ev=full.get('source_evidence') or p.get('source_evidence') or p.get('provenance')
    rows.append((p['platform'],str(p.get('provider_native_id') or (p.get('provenance') or {}).get('native_id')),p['url'],v,p.get('author'),p.get('author_handle'),p.get('author_avatar'),p.get('text'),p.get('posted_at'),
      p.get('company_slug'),p.get('company'),p.get('sector'),json.dumps(p.get('media') or []),json.dumps(p.get('engagement')) if p.get('engagement') is not None else None,
      (p.get('sentiment') or {}).get('score') if isinstance(p.get('sentiment'),dict) else None,json.dumps(ev) if ev else None,json.dumps(p.get('provenance')),p.get('subreddit'),p.get('title'),None,json.dumps(p,ensure_ascii=False)))
    visible_urls.add(p['url'])
    if v=='unverified': unverified_urls.add(p['url'])
from urllib.parse import urlsplit
def canon(u):
    if not u: return None
    s=urlsplit(u); return f'{s.scheme}://{s.netloc}{s.path}'.rstrip('/')
for lp in legacy:
    u=lp.get('url') or (rec.get(lp['id']) or {}).get('url')
    if canon(u) in unverified_urls: continue   # restored as unverified (one row per post); every other legacy row is preserved as hidden
    reason='duplicate of a verified post' if canon(u) in visible_urls else 'not a native social post permalink (web/news/company/profile page or no recoverable permalink)'
    rows.append((lp['platform'],'legacy:'+lp['id'],u or f'legacy:{lp["id"]}','hidden',lp.get('author'),None,None,lp.get('text'),lp.get('posted_at'),lp.get('company_slug'),lp.get('company'),lp.get('sector'),'[]',None,None,None,None,None,None,
      reason,json.dumps(lp,ensure_ascii=False)))
db.executemany('INSERT OR REPLACE INTO posts (platform,native_id,url,status,author,author_handle,author_avatar,text,posted_at,company_slug,company,sector,media_json,engagement_json,sentiment_score,evidence_json,provenance_json,subreddit,title,hidden_reason,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',rows)
tk=[]
for p in live['posts']:
    t=(p.get('agent_takeaway') or {})
    full=vby.get(p['url']) or vby.get(nid(p)) or {}; t2=(full.get('agent_takeaway') or {})
    tt=t2 if t2.get('text') else t
    if tt.get('text'): tk.append((p['platform'],str(p.get('provider_native_id') or (p.get('provenance') or {}).get('native_id')),tt['text'],tt.get('model'),(full.get('sentiment') or {}).get('score') if isinstance(full.get('sentiment'),dict) else None))
db.executemany('INSERT OR REPLACE INTO takeaways (platform,native_id,text,model,sentiment_score) VALUES (?,?,?,?,?)',tk)
db.executemany('INSERT OR REPLACE INTO companies (slug,name,sector,payload_json) VALUES (?,?,?,?)',[(c['slug'],c['name'],c.get('sector'),json.dumps(c,ensure_ascii=False)) for c in PF['companies']])
db.executemany('INSERT OR REPLACE INTO people (id,name,role,kind,company_slug,payload_json) VALUES (?,?,?,?,?,?)',[(x['id'],x['name'],x.get('role'),x.get('kind'),x.get('company_slug'),json.dumps(x,ensure_ascii=False)) for x in PPL['people']])
db.executemany('INSERT OR REPLACE INTO worker_runs (job_id,sector,source,status,started_at,finished_at,posts_fetched,posts_admitted,posts_rejected,payload_json) VALUES (?,?,?,?,?,?,?,?,?,?)',[(j['job_id'],j['sector'],j['source'],j['status'],j['started_at'],j['finished_at'],j['posts_fetched'],j['posts_admitted'],j['posts_rejected'],json.dumps(j,ensure_ascii=False)) for j in V.get('jobs',[])])
secs={}
for c in PF['companies']: secs.setdefault(c['sector'],{'label':c.get('sector_label') or c['sector'],'n':0}); secs[c['sector']]['n']+=1
db.executemany('INSERT OR REPLACE INTO sectors (key,label,company_count) VALUES (?,?,?)',[(k,v['label'],v['n']) for k,v in secs.items()])
db.executemany('INSERT OR REPLACE INTO sources (slug,payload_json) VALUES (?,?)',[(c['slug'],json.dumps(c,ensure_ascii=False)) for c in SRC['companies']])
now=datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%SZ')
db.execute('INSERT INTO ingestion_receipts (receipt_id,kind,received_at,detail_json) VALUES (?,?,?,?)',(f'snapshot-{ts}','snapshot',now,json.dumps({'from_backend':be,'live_generated_at':live.get('generated_at'),'verified':live.get('verified_count'),'unverified':live.get('unverified_count')})))
db.executemany('INSERT OR REPLACE INTO meta (k,v) VALUES (?,?)',[('snapshot_ts',ts),('feed_meta',json.dumps({k:v for k,v in live.items() if k!='posts'},ensure_ascii=False)),('schema_version','1'),('portfolio_json',json.dumps(PF)),('people_meta',json.dumps({k:v for k,v in PPL.items() if k!='people'}))])
db.commit()
def cnt(q): return db.execute(q).fetchall()
counts={'posts_by_status':dict(cnt('select status,count(*) from posts group by 1')),'posts_by_platform_status':{f'{a}/{b}':n for a,b,n in cnt('select platform,status,count(*) from posts group by 1,2')},
 'posts_by_sector_visible':dict(cnt("select sector,count(*) from posts where status!='hidden' group by 1")),
 'takeaways':cnt('select count(*) from takeaways')[0][0],'companies':cnt('select count(*) from companies')[0][0],'people':cnt('select count(*) from people')[0][0],'worker_runs':cnt('select count(*) from worker_runs')[0][0],'sources':cnt('select count(*) from sources')[0][0],'sectors':cnt('select count(*) from sectors')[0][0],'ingestion_receipts':cnt('select count(*) from ingestion_receipts')[0][0]}
cols=[d[1] for d in db.execute('pragma table_info(posts)').fetchall()]
with open(base+'.posts.ndjson','w') as f:
    for r in db.execute('select * from posts order by status, posted_at desc'): f.write(json.dumps(dict(zip(cols,r)),ensure_ascii=False)+'\n')
with open(base+'.posts.csv','w',newline='') as f:
    w=csv.writer(f); cc=[c for c in cols if c not in('raw_json',)]; w.writerow(cc)
    for r in db.execute(f'select {",".join(cc)} from posts order by status, posted_at desc'): w.writerow(r)
db.execute('VACUUM'); db.close()
def sha(p): h=hashlib.sha256(); h.update(open(p,'rb').read()); return h.hexdigest()
files={}
for p in [base+'.sqlite',base+'.posts.ndjson',base+'.posts.csv',f'{R}/data/portfolio.json',f'{R}/data/people.json']:
    files[os.path.basename(p)]={'path':p,'bytes':os.path.getsize(p),'sha256':sha(p)}
man={'snapshot_ts':ts,'created_at':now,'counts':counts,'files':files}
json.dump(man,open(base+'.manifest.json','w'),indent=1)
print(json.dumps(man,indent=1))
