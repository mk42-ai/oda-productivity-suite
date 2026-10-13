"""Attach scores/takeaways to verified posts, write the policy-v3 verified dataset, a public web fallback copy, and the proof log."""
import json,os,datetime
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); D=f'{R}/data/social'
m=json.load(open(f'{D}/verified-posts.json')); S=json.load(open(f'{D}/scores.json')) if os.path.exists(f'{D}/scores.json') else {}
for p in m['posts']:
    s=S.get(p['id'])
    p['sentiment']={'score':s['score'],'model':'predefined-cerebras-qwen-3.8-27b'} if s else None
    p['agent_takeaway']={'author':'B Capital Agent','text':s['takeaway'],'model':'predefined-cerebras-qwen-3.8-27b','pinned':True} if s else None
    ev=p['source_evidence']; ev['raw']={'id':p['provider_native_id'],'url':p['url'],'text':p['text'],'author':p['author'],'posted_at':p['posted_at'],'author_avatar':p.get('author_avatar'),'media':p.get('media',[])}
m['policy_version']='social-native-v3'; m['scored']=sum(1 for p in m['posts'] if p['agent_takeaway'])
json.dump(m,open(f'{D}/verified-posts.json','w'))
keys=["id","platform","source_domain","author","text","image","posted_at","company_slug","company","sector","company_domain","agent_takeaway","media","author_avatar","provider_native_id","author_handle","sentiment","subreddit","title","engagement","url"]
pub=[{**{k:p[k] for k in keys if k in p},'provenance':{'kind':'provider-response','provider':p['platform'],'native_id':p['provider_native_id'],'policy_version':'social-native-v3'}} for p in m['posts']]
json.dump({'generated_at':m['generated_at'],'policy_version':'social-native-v3','count':len(pub),'by_platform':m['by_platform'],'by_sector':m['by_sector'],'posts':pub},open(f'{R}/web/src/data/social/social-feed.json','w'))
proof={'built_at':datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%SZ'),'total_unique_verified_posts':m['count'],'per_source':m['by_platform'],'per_sector':m['by_sector'],'duplicates_removed':m['duplicates_removed'],'scored_posts':m['scored'],
 'workers':{'total':len(m['jobs']),'ok':sum(1 for j in m['jobs'] if j['status']=='ok'),'partial':sum(1 for j in m['jobs'] if j['status']=='partial'),'error':sum(1 for j in m['jobs'] if j['status']=='error')},
 'jobs':[{k:j.get(k) for k in ('job_id','sector','source','companies','status','started_at','finished_at','posts_fetched','posts_admitted','posts_rejected','rejections','errors','sessions','first_session_id','http_calls','checkpoint')} for j in sorted(m['jobs'],key=lambda j:j['job_id'])]}
json.dump(proof,open(f'{D}/proof-log.json','w'),indent=1)
print(m['count'],m['scored'],proof['workers'])
