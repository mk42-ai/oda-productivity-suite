import json, sys, datetime

DIR = "app/qa/2026-10-21-cycle5/laneE"

print("=== 2a: Project Settings Excerpt ===")
with open(f"{DIR}/project.json") as f:
    p = json.load(f)

print("rootDirectory:", p.get("rootDirectory"))
print("framework:", p.get("framework"))
print("ssoProtection:", json.dumps(p.get("ssoProtection")))
print("passwordProtection:", json.dumps(p.get("passwordProtection")))
pb = p.get("protectionBypass")
if isinstance(pb, dict):
    print("protectionBypass keys:", list(pb.keys()))
else:
    print("protectionBypass:", pb)
link = p.get("link", {})
print("link.productionBranch:", link.get("productionBranch") if link else None)

print("\n=== 2b: Environment Variables ===")
with open(f"{DIR}/env.json") as f:
    env_data = json.load(f)
envs = env_data.get("envs", [])
print(f"Total env vars count: {len(envs)}")
if envs:
    for e in envs:
        print(f"  key: {e.get('key')}, target: {e.get('target')}")
else:
    print("  0 variables configured on oda-productivity-suite.")

print("\n=== 2c: Deployments for branch uae-ai-command-centre ===")
with open(f"{DIR}/deployments.json") as f:
    dpls_data = json.load(f)
all_dpls = dpls_data.get("deployments", [])
uae_dpls = [d for d in all_dpls if d.get("meta", {}).get("githubCommitRef") == "uae-ai-command-centre"]

print(f"Total deployments returned: {len(all_dpls)}")
print(f"Deployments on uae-ai-command-centre: {len(uae_dpls)}")

header = f"{'UID':<30} | {'State':<8} | {'ReadySub':<10} | {'Target':<10} | {'SHA':<7} | {'Ref':<22} | {'Created At':<20} | {'URL'}"
print(header)
print("-" * len(header))

newer_than_143647 = []

for d in uae_dpls:
    uid = d.get("uid")
    state = d.get("state")
    readysub = str(d.get("readySubstate"))
    target = str(d.get("target"))
    meta = d.get("meta", {})
    sha = meta.get("githubCommitSha", "")[:7]
    ref = meta.get("githubCommitRef", "")
    created_ms = d.get("createdAt")
    created_iso = datetime.datetime.fromtimestamp(created_ms / 1000.0, tz=datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if created_ms else ""
    url = d.get("url")
    print(f"{uid:<30} | {state:<8} | {readysub:<10} | {target:<10} | {sha:<7} | {ref:<22} | {created_iso:<20} | {url}")
    if created_iso > "2026-10-21T14:36:47Z":
        newer_than_143647.append((uid, sha, created_iso))

print(f"\nDeployments on uae-ai-command-centre newer than 2026-10-21T14:36:47Z: {len(newer_than_143647)}")
for item in newer_than_143647:
    print(f"  {item}")

print("\n=== 2d: dpl_7ErgMfaYbi7HDC6TZEyjShiwF5be Details ===")
with open(f"{DIR}/dpl-7Erg.json") as f:
    d7 = json.load(f)
print("state:", d7.get("state"))
print("readyState:", d7.get("readyState"))
print("readySubstate:", d7.get("readySubstate"))
meta7 = d7.get("meta", {})
print("meta.githubCommitSha:", meta7.get("githubCommitSha"))
msg = meta7.get("githubCommitMessage", "")
print("meta.githubCommitMessage (first 80 chars):", msg[:80])
build = d7.get("build", {})
build_env = build.get("env", {})
if isinstance(build_env, dict):
    print("build.env key NAMES count:", len(build_env.keys()))
    print("build.env key NAMES:", list(build_env.keys()))
elif isinstance(build_env, list):
    print("build.env count:", len(build_env))
else:
    print("build.env type:", type(build_env))
print("alias list:", d7.get("alias"))

print("\n=== 2e: Production Deployment Details ===")
with open(f"{DIR}/production-deployment.json") as f:
    prod_data = json.load(f)
prod_dpls = prod_data.get("deployments", [])
if prod_dpls:
    pd = prod_dpls[0]
    p_meta = pd.get("meta", {})
    p_created = pd.get("createdAt")
    p_iso = datetime.datetime.fromtimestamp(p_created / 1000.0, tz=datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if p_created else ""
    print("Production UID:", pd.get("uid"))
    print("State:", pd.get("state"))
    print("ReadySubstate:", pd.get("readySubstate"))
    print("Target:", pd.get("target"))
    print("Commit SHA:", p_meta.get("githubCommitSha"))
    print("Commit Ref:", p_meta.get("githubCommitRef"))
    print("Created At:", p_iso)
    print("URL:", pd.get("url"))
