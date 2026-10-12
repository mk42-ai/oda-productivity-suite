"""Partition: sector × source, large sectors split into company groups. Prints job lines id|source|sector|slugs."""
import json,os,sys
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S=json.load(open(f'{R}/data/social/sources.json'))['companies']
by={}
for c in S: by.setdefault(c['sector'],[]).append(c)
jobs=[]
XG={'ai-enterprise':6,'biotech':5,'fintech':4,'healthtech':3,'robotics':2,'climate':2,'ai-infra':2,'logistics':2,'consumer':2,'edtech':1}
RG={'ai-enterprise':4,'biotech':3,'fintech':3,'healthtech':2,'robotics':1,'climate':1,'ai-infra':1,'logistics':1,'consumer':1,'edtech':1}
for sec,cs in sorted(by.items()):
    cs=sorted(cs,key=lambda c:-len(c['x_queries']))
    for g in range(XG[sec]): jobs.append(('x',sec,[c['slug'] for c in cs[g::XG[sec]]]))
    for g in range(RG[sec]): jobs.append(('reddit',sec,[c['slug'] for c in cs[g::RG[sec]]]))
ig=[c for c in S if c['instagram']]
for g in range(3): jobs.append(('instagram','multi',[c['slug'] for c in ig[g::3]]))
for i,(src,sec,sl) in enumerate(jobs): print(f'J{i+1:02d}|{src}|{sec}|{",".join(sl)}')
