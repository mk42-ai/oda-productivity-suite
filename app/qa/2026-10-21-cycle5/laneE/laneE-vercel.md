# Lane E (Part 1) — Vercel Git-Preview Protection & Env-Var Probes for 15305a6

- **Cycle**: QA Closure Cycle 5
- **Lane**: Lane E (Part 1) — Vercel Git-Preview Protection & Environment Configuration
- **Date / Time of Probe**: 2026-10-21T15:33:56Z – 2026-10-21T15:35:13Z
- **Target Commit**: `15305a6` (`15305a633e7e364d9745038eb8fc7b9bafa3cd89`)
- **Target Branch**: `uae-ai-command-centre`
- **Repository**: `/home/appuser/work/6692b763e851d28a036ab30e/6ad835717bb80aa7c2d979d0/oda-productivity-suite` (`app/`)
- **Vercel Project**: `oda-productivity-suite` (`prj_wXz5xY3PNULypuwepaqu1XKa6sP1`)
- **Vercel Team**: `schoolhack-web-team` (`team_oF4l3uI31c1j1o4sO3X2k7uE` / `$VERCEL_TEAM_ID`)
- **Deployment Under Test**: `dpl_7ErgMfaYbi7HDC6TZEyjShiwF5be` (Created: 2026-10-21T14:36:47Z, Ready: 2026-10-21T14:37:56Z)

---

## 1. HTTP Protection Evidence Table

All probes were executed via `curl -m 15 -sS -D - -w '%{http_code} %{redirect_url}\n'`. Raw header captures and responses are saved in `app/qa/2026-10-21-cycle5/laneE/http-probes.txt`.

| Timestamp (UTC) | Method | Target URL / Host | HTTP Status | Redirect Location / Response Summary |
|:---|:---|:---|:---|:---|
| 2026-10-21T15:33:56Z | GET | `https://oda-productivity-suite-l601bv171-schoolhack-web-team.vercel.app/health` | **302** | `https://vercel.com/sso-api?url=https%3A%2F%2Foda-productivity-suite-l601bv171-schoolhack-web-team.vercel.app%2Fhealth&nonce=...`<br>Body: `Protected by Vercel Authentication` |
| 2026-10-21T15:33:56Z | GET | `https://oda-productivity-suite-l601bv171-schoolhack-web-team.vercel.app/api/uae/live` | **302** | `https://vercel.com/sso-api?url=https%3A%2F%2Foda-productivity-suite-l601bv171-schoolhack-web-team.vercel.app%2Fapi%2Fuae%2Flive&nonce=...`<br>Body: `Protected by Vercel Authentication` |
| 2026-10-21T15:33:56Z | POST | `https://oda-productivity-suite-l601bv171-schoolhack-web-team.vercel.app/api/chat` | **401** | Redirect: None<br>JSON: `{"error":{"message":"Protected deployment","code":"401"},"protection":{"vercel_auth_callback":"https://vercel.com/sso-api?...","auto_vercel_auth_redirect":true,"password_enabled":false,"vercel_auth_enabled":true},"access":"vercel curl <deployment-url>"}` |
| 2026-10-21T15:33:56Z | GET | `https://oda-productivity-suite-git-uae-ai-co-869d68-schoolhack-web-team.vercel.app/health` | **302** | `https://vercel.com/sso-api?url=https%3A%2F%2Foda-productivity-suite-git-uae-ai-co-869d68-schoolhack-web-team.vercel.app%2Fhealth&nonce=...`<br>Body: `Protected by Vercel Authentication` |
| 2026-10-21T15:33:56Z | GET | `https://oda-productivity-suite-git-uae-ai-co-869d68-schoolhack-web-team.vercel.app/api/uae/live` | **302** | `https://vercel.com/sso-api?url=https%3A%2F%2Foda-productivity-suite-git-uae-ai-co-869d68-schoolhack-web-team.vercel.app%2Fapi%2Fuae%2Flive&nonce=...`<br>Body: `Protected by Vercel Authentication` |
| 2026-10-21T15:33:56Z | POST | `https://oda-productivity-suite-git-uae-ai-co-869d68-schoolhack-web-team.vercel.app/api/chat` | **401** | Redirect: None<br>JSON: `{"message":"Protected by Vercel Authentication","error":{"message":"Protected deployment","code":"401"},"protection":{"vercel_auth_callback":"https://vercel.com/sso-api?...","auto_vercel_auth_redirect":true,"password_enabled":false,"vercel_auth_enabled":true},"access":"vercel curl <deployment-url>"}` |
| 2026-10-21T15:33:56Z | GET | `https://oda-productivity-suite.vercel.app/` | **200** | Redirect: None<br>Body: Production HTML title `<title>ODA Productivity Suite</title>`, bundle script `index-N81skICp.js`.<br>Matches for `"UAE AI Intelligence"` in body: **0** |

### Observations:
- Both the specific preview deployment URL (`oda-productivity-suite-l601bv171-schoolhack-web-team.vercel.app`) and the branch alias URL (`oda-productivity-suite-git-uae-ai-co-869d68-schoolhack-web-team.vercel.app`) enforce Vercel SSO authentication.
- Unauthenticated GET requests receive HTTP `302` redirecting to `https://vercel.com/sso-api`.
- Unauthenticated POST requests receive HTTP `401 Unauthorized` with JSON payload confirming `{"error":{"message":"Protected deployment","code":"401"}, "protection":{"vercel_auth_enabled":true}}`.
- Production (`https://oda-productivity-suite.vercel.app/`) serves HTTP `200` and is completely separate and untouched.

---

## 2. Vercel Project Settings Excerpt

Extracted from `GET https://api.vercel.com/v9/projects/prj_wXz5xY3PNULypuwepaqu1XKa6sP1?teamId=$VERCEL_TEAM_ID` (saved as `app/qa/2026-10-21-cycle5/laneE/project.json`):

- **rootDirectory**: `"app"`
- **framework**: `"vite"`
- **ssoProtection**: `{"deploymentType": "all_except_custom_domains"}`
- **passwordProtection**: `null`
- **protectionBypass**: `null` (no bypass keys configured)
- **link.productionBranch**: `"main"`

This configuration verifies why all preview deployments redirect to SSO: `ssoProtection` is set to `"all_except_custom_domains"`, protecting all preview deployment URLs and git branch alias URLs while leaving custom domains (production) public.

---

## 3. Environment Variables Status

Extracted from `GET https://api.vercel.com/v9/projects/prj_wXz5xY3PNULypuwepaqu1XKa6sP1/env?teamId=$VERCEL_TEAM_ID` (saved as `app/qa/2026-10-21-cycle5/laneE/env.json`):

- **Total configured environment variables**: `0`
- **Configured key names**: *None*

### Assessment & Blocker:
> **0 variables on oda-productivity-suite — blocker: preview cannot reach OnDemand; keys to copy from sibling project ondemand-hq: ONDEMAND_API_KEY, ONDEMAND_BASE_URL (preview-scoped, branch uae-ai-command-centre only; never production)**

Because there are zero environment variables set in the Vercel project, preview deployments cannot communicate with live upstream OnDemand services unless configured. When configuring, these variables must be scoped specifically to `preview` environments for the `uae-ai-command-centre` branch, and never applied to `production`.

---

## 4. Deployments Table (Branch `uae-ai-command-centre`)

Extracted from `GET https://api.vercel.com/v6/deployments?projectId=prj_wXz5xY3PNULypuwepaqu1XKa6sP1&limit=20&teamId=$VERCEL_TEAM_ID` (saved as `app/qa/2026-10-21-cycle5/laneE/deployments.json`).

Filtered for all deployments whose `meta.githubCommitRef == "uae-ai-command-centre"`:

| UID | State | ReadySubstate | Target | SHA | Ref | Created At (UTC) | URL |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `dpl_7ErgMfaYbi7HDC6TZEyjShiwF5be` | **READY** | STAGED | None (preview) | `15305a6` | `uae-ai-command-centre` | 2026-10-21T14:36:47Z | `oda-productivity-suite-l601bv171-schoolhack-web-team.vercel.app` |
| `dpl_7sWkXnZfX8r7DHcVBjz1YDNBXyyo` | **READY** | STAGED | None (preview) | `c005420` | `uae-ai-command-centre` | 2026-10-21T13:03:41Z | `oda-productivity-suite-k3ir5hhnj-schoolhack-web-team.vercel.app` |
| `dpl_FzNPBuqfvZu4Sc3R39iMsJDyjiJT` | **READY** | STAGED | None (preview) | `a6daaf3` | `uae-ai-command-centre` | 2026-10-21T12:42:24Z | `oda-productivity-suite-8m5ds7p6c-schoolhack-web-team.vercel.app` |
| `dpl_8KRafSw1uxmodMzFEVQborwk7wHT` | **READY** | STAGED | None (preview) | `60e604c` | `uae-ai-command-centre` | 2026-10-21T11:46:00Z | `oda-productivity-suite-e7w933rhs-schoolhack-web-team.vercel.app` |
| `dpl_8RvgGVLcxvJtVgDCvW4EANVaC72B` | **READY** | STAGED | None (preview) | `d32b691` | `uae-ai-command-centre` | 2026-10-21T11:23:12Z | `oda-productivity-suite-5sqwlm7xy-schoolhack-web-team.vercel.app` |
| `dpl_r4qGtYU1B3c3QLUhGowjECMyW7Vv` | **READY** | STAGED | None (preview) | `dd8f056` | `uae-ai-command-centre` | 2026-10-21T11:18:17Z | `oda-productivity-suite-gkbr82ka5-schoolhack-web-team.vercel.app` |
| `dpl_6mSwFCHYFCGcUtACzFNKfteHcJzS` | **READY** | STAGED | None (preview) | `5b6a994` | `uae-ai-command-centre` | 2026-10-21T11:16:31Z | `oda-productivity-suite-j7aquixwn-schoolhack-web-team.vercel.app` |
| `dpl_Ga19v74DiAHLkG3xjMQC3xJVVdez` | **READY** | STAGED | None (preview) | `0aa7eb2` | `uae-ai-command-centre` | 2026-10-21T09:57:27Z | `oda-productivity-suite-9h8g5yik4-schoolhack-web-team.vercel.app` |
| `dpl_hNggcBDep1Twcp7ycWHksT7FUtSv` | **READY** | STAGED | None (preview) | `eeba60b` | `uae-ai-command-centre` | 2026-10-21T09:47:51Z | `oda-productivity-suite-k5ykmksyn-schoolhack-web-team.vercel.app` |
| `dpl_4kp8ZTwCquMjUuTeT4HtAr5tQyC7` | **READY** | STAGED | None (preview) | `2008923` | `uae-ai-command-centre` | 2026-10-21T04:24:22Z | `oda-productivity-suite-3kdb4ehd6-schoolhack-web-team.vercel.app` |
| `dpl_3pjQG3w7AQcPpULDNGC1HVERLbD7` | **ERROR** | None | None (preview) | `2008923` | `uae-ai-command-centre` | 2026-10-20T23:50:25Z | `oda-productivity-suite-565kbh6wa-schoolhack-web-team.vercel.app` |
| `dpl_Cq4SZZXARYSmADNT7GYc2iX2JiDc` | **ERROR** | None | None (preview) | `3944fce` | `uae-ai-command-centre` | 2026-10-20T23:47:21Z | `oda-productivity-suite-r9xlzkrjn-schoolhack-web-team.vercel.app` |
| `dpl_BZGVSd5xb6y3SkT6FeLXuBbEFTVJ` | **ERROR** | None | None (preview) | `30cce79` | `uae-ai-command-centre` | 2026-10-20T23:47:10Z | `oda-productivity-suite-mgy7au2rg-schoolhack-web-team.vercel.app` |
| `dpl_8WJZK9SfA8zpGVDS5PcTMiGDQDcu` | **ERROR** | None | None (preview) | `6f39f7d` | `uae-ai-command-centre` | 2026-10-20T23:46:39Z | `oda-productivity-suite-ophe2zsee-schoolhack-web-team.vercel.app` |

### New Deployment Check:
- Deployments newer than `2026-10-21T14:36:47Z`: **0**
- Confirmation: `dpl_7ErgMfaYbi7HDC6TZEyjShiwF5be` is the latest preview deployment for `uae-ai-command-centre`, built from commit `15305a6` and in status **READY** (readySubstate: `STAGED`).

---

## 5. Deployment `dpl_7ErgMfaYbi7HDC6TZEyjShiwF5be` Deep-Dive

Extracted from `GET https://api.vercel.com/v13/deployments/dpl_7ErgMfaYbi7HDC6TZEyjShiwF5be?teamId=$VERCEL_TEAM_ID` (saved as `app/qa/2026-10-21-cycle5/laneE/dpl-7Erg.json`):

- **state**: `None` (Vercel v13 uses `readyState`)
- **readyState**: `"READY"`
- **readySubstate**: `"STAGED"`
- **meta.githubCommitSha**: `15305a633e7e364d9745038eb8fc7b9bafa3cd89`
- **meta.githubCommitMessage (first 80 chars)**: `"docs(uae-cc): QA cycle 4 closure — QA_REPORT (Lane A 14/14, Lane B 145/18/25/4 v"`
- **build.env key NAMES count**: `138` (Vercel standard system/build environment variables; 0 custom/project environment variables configured)
- **alias list**: `['oda-productivity-suite-git-uae-ai-co-869d68-schoolhack-web-team.vercel.app']`

---

## 6. Production-Untouched Confirmation

Extracted from `GET https://api.vercel.com/v6/deployments?projectId=prj_wXz5xY3PNULypuwepaqu1XKa6sP1&target=production&limit=1&teamId=$VERCEL_TEAM_ID` (saved as `app/qa/2026-10-21-cycle5/laneE/production-deployment.json`) and live HTTP probes:

- **Production Deployment UID**: `dpl_GNENDd4ok631zA7U1t6yqpMUXoWp`
- **State**: `READY`
- **ReadySubstate**: `PROMOTED`
- **Target**: `production`
- **Commit SHA**: `be3f7c1df1c04a6c1afcc9dd0b94bf9d03865754` (`be3f7c1`)
- **Commit Ref / Branch**: `main`
- **Created At**: `2026-10-13T03:54:39Z`
- **Production URL**: `https://oda-productivity-suite.vercel.app/`
- **Live HTTP Status**: HTTP `200 OK`
- **Content Verification**: Standard ODA Productivity Suite bundle (`/assets/index-N81skICp.js`, CSS `/assets/index-Dq9YJXR1.css`, title `<title>ODA Productivity Suite</title>`).
- **Isolation Check**: `0` occurrences of `"UAE AI Intelligence"` in the production body.
- **Verdict**: Production remains completely untouched and isolated from the `uae-ai-command-centre` branch.

---

## 7. NOT VERIFIED List

The following items could not be verified during this read-only inspection:

1. **Live runtime connectivity between the Vercel preview deployment and OnDemand backend**:
   - Both `/health`, `/api/uae/live`, and `/api/chat` are locked behind Vercel SSO protection (HTTP 302 / 401).
   - In addition, project environment variable count is 0, so live upstream OnDemand calls cannot succeed until `ONDEMAND_API_KEY` and `ONDEMAND_BASE_URL` are configured on the preview environment.
2. **Behavior of deployment for new commits beyond `15305a6`**:
   - At the time of probing (15:33Z–15:35Z), no deployment newer than `14:36:47Z` (`dpl_7ErgMfaYbi7HDC6TZEyjShiwF5be` @ `15305a6`) existed.
   - Any newer commit pushed by the QA coordinator will require re-probing upon deployment completion.

---

## 8. Artifact Inventory

All raw outputs generated by Lane E (Part 1) are preserved under `app/qa/2026-10-21-cycle5/laneE/`:
- `http-probes.txt`: Raw curl output with full HTTP headers and response bodies for all 7 endpoints.
- `project.json`: Full project JSON response from Vercel REST API (`prj_wXz5xY3PNULypuwepaqu1XKa6sP1`).
- `env.json`: Environment variable list response from Vercel REST API.
- `deployments.json`: Recent deployments list response (limit 20) from Vercel REST API.
- `dpl-7Erg.json`: Complete deployment metadata for `dpl_7ErgMfaYbi7HDC6TZEyjShiwF5be`.
- `production-deployment.json`: Production deployment record for `dpl_GNENDd4ok631zA7U1t6yqpMUXoWp`.
- `extract.py`: Python extraction script for parsing raw JSONs.
- `laneE-vercel.md`: This comprehensive report.
