#!/bin/bash
# Persistence test: (A) cold restart keeps DB; (B) wiped DB on a fresh boot restores from OnDemand Media. Compares counts + content SHA-256.
cd /vercel/sandbox/app
snap() { curl -s localhost:4000/persistence/status | python3 -c "import json,sys;d=json.load(sys.stdin);print(json.dumps({'action':d['boot']['action'],'restored_from':(d['boot'].get('restored_from') or {}).get('media_id'),'tables':d['counts']['tables'],'by_status':d['counts']['posts_by_status'],'sha':d['content_sha256']}))"; }
feed() { curl -s "localhost:4000/social/feed?limit=1" | python3 -c "import json,sys;d=json.load(sys.stdin);print(json.dumps({'total':d['total'],'verified':d['verified_count'],'unverified':d['unverified_count'],'sectors_nonzero':sum(1 for v in d['by_sector'].values() if v>0),'providers':[p['platform'] for p in d['providers']]}))"; }
restart() { pkill -f "node dist/server.js"; sleep 2; nohup setsid /vercel/sandbox/start-be.sh > /tmp/be.log 2>&1 < /dev/null & for i in $(seq 1 90); do curl -sf -o /dev/null localhost:4000/health && break; sleep 1; done; }
B=$(snap); BF=$(feed); echo "BEFORE $B"; echo "BEFORE_FEED $BF"
restart; A1=$(snap); A1F=$(feed); echo "AFTER_RESTART $A1"; echo "AFTER_RESTART_FEED $A1F"
pkill -f "node dist/server.js"; sleep 1; rm -f data/b-social.db data/b-social.db-*; echo "wiped local DB: $(ls data/b-social.db 2>&1 | head -1)"
restart; A2=$(snap); A2F=$(feed); echo "AFTER_WIPE_RESTART $A2"; echo "AFTER_WIPE_FEED $A2F"
python3 - "$B" "$A1" "$A2" "$BF" "$A1F" "$A2F" <<'PY'
import json,sys
b,a1,a2,bf,a1f,a2f=[json.loads(x) for x in sys.argv[1:]]
strip=lambda t:{k:v for k,v in t.items() if k not in('backups','ingestion_receipts','meta')}
ok=[('restart counts',strip(b['tables'])==strip(a1['tables'])),('restart sha',b['sha']==a1['sha']),('wipe counts',strip(b['tables'])==strip(a2['tables'])),('wipe sha',b['sha']==a2['sha']),
 ('wipe restored from media',a2['action'].startswith('restored-from-ondemand-media')),('feed 10445/221', all(f['verified']==10445 and f['unverified']==221 for f in (bf,a1f,a2f))),('10 sectors populated',all(f['sectors_nonzero']==10 for f in (bf,a1f,a2f))),('no tiktok',all('tiktok' not in f['providers'] for f in (bf,a1f,a2f)))]
for n,v in ok: print(('PASS' if v else 'FAIL'),n)
print('PERSISTENCE_TEST', 'PASS' if all(v for _,v in ok) else 'FAIL', f"{sum(v for _,v in ok)}/{len(ok)}")
PY
