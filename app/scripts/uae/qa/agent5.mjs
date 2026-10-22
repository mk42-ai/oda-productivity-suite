// Agent 5 — OnDemand contract tests (status, schema, latency), loading/error/empty states, perf (LCP, TTI, bundle), original 816aaae unchanged
import { harness, withBrowser, ctx, go, VPS, BASE, APP, sleep } from "./lib.mjs";
import fs from "node:fs";
import { execSync } from "node:child_process";
const H = harness("agent5-contracts");
const OD = (process.env.ON_DEMAND_BASE_URL || "https://api.on-demand.io").replace(/\/$/, ""); const KEY = process.env.ON_DEMAND_API_KEY;
const S = { name: "server" };
const typeOk = (o, spec) => Object.entries(spec).every(([k, t]) => (t === "array" ? Array.isArray(o?.[k]) : typeof o?.[k] === t));
async function call(method, url, { headers = {}, body, timeout = 120000 } = {}) {
  const t0 = Date.now(); const r = await fetch(url, { method, headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 uae-cc-qa", ...headers }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeout) });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {} return { status: r.status, ms: Date.now() - t0, json, text };
}
const A = { apikey: KEY };
const contracts = [];
async function contract(name, fn) { try { const { pass, detail, status, ms } = await fn(); contracts.push({ name, status, ms, pass }); await H.record(`contract:${name}`, S, pass, `HTTP ${status} · ${ms} ms · ${detail}`, null); } catch (e) { contracts.push({ name, pass: false, error: e.message }); await H.record(`contract:${name}`, S, false, `exception ${e.message}`, null); } }
// --- direct OnDemand (live docs shapes) ---
await contract("docs-categories", async () => { const r = await call("GET", `${OD}/config/v1/public/docs/categories`, { headers: A }); const svc = (r.json?.data ?? []).map((s) => s.service); return { status: r.status, ms: r.ms, pass: r.status === 200 && svc.includes("Agents Flow Builder API") && svc.includes("Chat API") && svc.includes("Media API"), detail: `services: ${svc.join(", ")}` }; });
let sid;
await contract("chat-createchatsession", async () => { const r = await call("POST", `${OD}/chat/v1/sessions`, { headers: A, body: { externalUserId: "uae-cc-qa", pluginIds: [] } }); sid = r.json?.data?.id; return { status: r.status, ms: r.ms, pass: r.status === 201 && typeof sid === "string", detail: `data.id=${sid}` }; });
await contract("chat-submitquery-sync", async () => { const r = await call("POST", `${OD}/chat/v1/sessions/${sid}/query`, { headers: A, body: { endpointId: "predefined-gpt-6-luna", query: "Reply with the single word: ok", responseMode: "sync", pluginIds: [] } }); return { status: r.status, ms: r.ms, pass: r.status === 200 && typeof r.json?.data?.answer === "string" && typeof r.json?.data?.sessionId === "string", detail: `data.answer="${(r.json?.data?.answer || "").slice(0, 30)}", keys=${Object.keys(r.json?.data || {}).slice(0, 8)}` }; });
await contract("chat-getchatmessages", async () => { const r = await call("GET", `${OD}/chat/v1/sessions/${sid}/messages`, { headers: A }); return { status: r.status, ms: r.ms, pass: r.status === 200 && Array.isArray(r.json?.data), detail: `${r.json?.data?.length} messages` }; });
await contract("media-fetchmedia", async () => { const r = await call("GET", `${OD}/media/v1/public/file?limit=1`, { headers: A }); return { status: r.status, ms: r.ms, pass: r.status === 200, detail: `keys=${Object.keys(r.json || {}).join(",")}` }; });
const wf = JSON.parse(fs.readFileSync(`${APP}/mission/workflows.json`, "utf8")).workflows;
for (const [k, w] of Object.entries(wf)) await contract(`afb-get-workflow-${k}`, async () => { const r = await call("GET", `${OD}/automation/api/workflow/${w.id}`, { headers: A }); const d = r.json?.data; return { status: r.status, ms: r.ms, pass: r.status === 200 && d?.isActive === true && d?.trigger?.type === "cron" && d?.trigger?.cron?.expression === w.cron6, detail: `isActive=${d?.isActive} cron=${d?.trigger?.cron?.expression}` }; });
await contract("afb-execution-list+logs+outputs", async () => { const l = await call("GET", `${OD}/automation/api/execution/list?workflowID=${wf.checkpoint.id}`, { headers: A }); const e = l.json?.data?.[0]; const lg = await call("GET", `${OD}/automation/api/execution/${e.id}/logs`, { headers: A }); const o = await call("GET", `${OD}/automation/api/execution/${e.id}/node/outputs`, { headers: A }); const ok = l.status === 200 && typeOk(e, { id: "string", status: "string", startedAtInMilliseconds: "number" }) && lg.status === 200 && Array.isArray(lg.json?.data) && typeOk(lg.json.data[0], { message: "string" }) && o.status === 200 && typeof o.json?.data?.outputs === "object"; return { status: l.status, ms: l.ms + lg.ms + o.ms, pass: ok, detail: `latest exec ${e.id} status=${e.status} trigger=${e.trigger?.type}; ${lg.json?.data?.length} log lines; outputs keys=${Object.keys(o.json?.data?.outputs || {})}` }; });
// --- app server routes (proxy contracts) ---
await contract("app-health", async () => { const r = await call("GET", `${BASE}/health`); return { status: r.status, ms: r.ms, pass: r.status === 200, detail: r.text.slice(0, 120) }; });
await contract("app-uae-orgs", async () => { const r = await call("GET", `${BASE}/api/uae/orgs`); return { status: r.status, ms: r.ms, pass: r.status === 200 && r.json?.namespace === "uae_cc_v1" && r.json?.data?.length === 50 && typeOk(r.json.data[0], { slug: "string", name: "string" }), detail: `${r.json?.data?.length} orgs` }; });
await contract("app-uae-live", async () => { const r = await call("GET", `${BASE}/api/uae/live`); const j = r.json; const prov = j?.ingest?.news?.[0]?.provenance; return { status: r.status, ms: r.ms, pass: r.status === 200 && j?.ok && j.workflows.length === 3 && (!prov || typeOk(prov, { source_url: "string", timestamp: "string", plugin: "string", execution_id: "string" })), detail: `workflows=${j?.workflows?.map((w) => `${w.kind}:${w.last?.status}`)}; news=${j?.ingest?.news?.length} statements=${j?.ingest?.statements?.length} signals=${j?.ingest?.org_signals?.length}; provenance keys=${prov ? Object.keys(prov) : "-"}; briefing=${!!j?.briefing?.markdown}` }; });
await contract("app-chat-proxy-stream", async () => { const t0 = Date.now(); const r = await fetch(`${BASE}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "Reply with: ok" }], threadId: "qa-" + Date.now() }), signal: AbortSignal.timeout(150000) }); const rd = r.body.getReader(); let first = null, txt = ""; for (;;) { const { value, done } = await rd.read(); if (done) break; if (first == null) first = Date.now() - t0; txt += new TextDecoder().decode(value); if (txt.length > 400000) break; } return { status: r.status, ms: Date.now() - t0, pass: r.status === 200 && first != null && first < 2000 && /RUN_FINISHED|TEXT_MESSAGE|\[DONE\]/.test(txt), detail: `content-type=${r.headers.get("content-type")}, first byte ${first} ms, ${txt.length} bytes, run finished=${/RUN_FINISHED/.test(txt)}` }; });
await contract("app-briefing-bad-key-error", async () => { const r = await call("POST", `${BASE}/api/briefing`, { headers: { "x-ondemand-key": "invalid-key-for-qa" }, body: { focus: "x" } }); return { status: r.status, ms: r.ms, pass: r.status === 502 && r.json?.ok === false && typeof r.json?.error === "string", detail: `honest error: stage=${r.json?.stage} upstream=${r.json?.status} "${(r.json?.error || "").slice(0, 80)}"` }; });
await contract("app-artifacts-empty", async () => { const r = await call("GET", `${BASE}/api/artifacts`); return { status: r.status, ms: r.ms, pass: r.status < 500, detail: r.text.slice(0, 140) }; });
fs.writeFileSync("/tmp/contracts.json", JSON.stringify(contracts, null, 1));

await withBrowser(async (b) => {
  for (const vp of VPS) {
    // loading + error states (injected via request interception — the real network is untouched)
    let c = await ctx(b, vp); let page = await c.newPage();
    await page.route("**/api/uae/live", async (r) => { await sleep(4000); await r.continue(); });
    await page.goto(BASE + "/overview", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('[data-testid="live-pipeline"]', { timeout: 15000 }).catch(() => {});
    await page.locator('[data-testid="live-pipeline"]').scrollIntoViewIfNeeded().catch(() => {});
    const loading = await page.locator('[data-testid="live-loading"]').isVisible().catch(() => false);
    await H.record("state-loading-live-pipeline", vp, loading, `live-loading visible while /api/uae/live is delayed: ${loading}`, page);
    await c.close();
    c = await ctx(b, vp); page = await c.newPage();
    await page.route("**/api/uae/live", (r) => r.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ ok: false, error: "GET /execution/list → HTTP 500 (injected)" }) }));
    await go(page, "/overview"); await page.locator('[data-testid="live-pipeline"]').scrollIntoViewIfNeeded().catch(() => {}); await sleep(500);
    const err = await page.locator('[data-testid="live-error"]').innerText().catch(() => "");
    await H.record("state-error-live-pipeline", vp, /unavailable/.test(err), `error state: "${err.slice(0, 120)}"`, page);
    await c.close();
    c = await ctx(b, vp); page = await c.newPage();
    await page.route("**/api/chat", (r) => r.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "upstream_unavailable", message: "OnDemand unavailable (injected)" } }) }));
    await go(page, "/chat"); await page.fill('[data-testid="composer-input"]', "test error state"); await page.click('[data-testid="composer-send"]');
    await page.waitForSelector('[data-testid="chat-error"]', { timeout: 30000 }).catch(() => {});
    const ce = await page.locator('[data-testid="chat-error"]').count(); const retry = await page.locator('[data-testid="chat-error-retry"]').count();
    await H.record("state-error-chat", vp, ce > 0, `chat-error rendered=${ce > 0}, retry button=${retry > 0}`, page);
    await c.close();
    c = await ctx(b, vp); page = await c.newPage();
    await go(page, "/briefing"); const emp = await page.getByText("Your briefing will appear here.").isVisible().catch(() => false);
    await H.record("state-empty-briefing", vp, emp, `empty state visible=${emp}`, page);
    await c.close();
    // perf: LCP + approx TTI (last long task end after FCP, 5 s quiet window) + JS bytes for /overview and /chat
    for (const route of ["/overview", "/chat", "/sentiment"]) {
      c = await ctx(b, vp); page = await c.newPage();
      await page.addInitScript(() => { window.__lcp = 0; window.__lt = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.startTime + e.duration); }).observe({ type: "longtask", buffered: true }); });
      let js = 0, total = 0; page.on("response", async (r) => { try { const len = Number(r.headers()["content-length"] || 0) || (await r.body()).length; total += len; if (/javascript/.test(r.headers()["content-type"] || "")) js += len; } catch {} });
      await page.goto(BASE + route, { waitUntil: "load", timeout: 60000 }); await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}); await sleep(5000);
      const m = await page.evaluate(() => { const nav = performance.getEntriesByType("navigation")[0]; const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0; const lastLt = Math.max(0, ...window.__lt); return { lcp: Math.round(window.__lcp), fcp: Math.round(fcp), tti: Math.round(Math.max(fcp, nav.domContentLoadedEventEnd, lastLt)), ttfb: Math.round(nav.responseStart), longTasks: window.__lt.length }; });
      await H.record(`perf${route.replace("/", "-")}`, vp, m.lcp > 0 && m.lcp < 4000 && m.tti < 7300, `LCP ${m.lcp} ms · FCP ${m.fcp} ms · TTI≈${m.tti} ms (${m.longTasks} long tasks) · TTFB ${m.ttfb} ms · JS ${(js / 1024).toFixed(0)} KiB (wire) · total ${(total / 1024).toFixed(0)} KiB`, page);
      await c.close();
    }
  }
});
// original previous tenant project / branch / deployment at 816aaae unchanged
const vpS = S; const T = process.env.GITHUB_TOKEN; const V = process.env.VERCEL_TOKEN; const TEAM = process.env.VERCEL_TEAM_ID;
const gh = async (p) => (await fetch(`https://api.github.com/repos/mk42-ai/oda-productivity-suite${p}`, { headers: { ...(T ? { authorization: `Bearer ${T}` } : {}), "user-agent": "qa" } })).json();
const br = await gh("/branches/fix%2Fnews-summary-rewrite-live-verify-20261020");
const tagRemote = await gh("/git/ref/tags/bcap-pre-uae-20261020T2130Z");
await H.record("original-branch-unchanged", vpS, br?.commit?.sha === "816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d", `GitHub fix/news-summary-rewrite-live-verify-20261020 → ${br?.commit?.sha}; remote rollback tag object=${tagRemote?.object?.sha ?? "not pushed yet"}`, null);
const local = execSync(`git -C ${APP}/.. rev-parse 'bcap-pre-uae-20261020T2130Z^{}' && git -C ${APP}/.. diff --stat 816aaae HEAD -- the original project | tail -1`).toString().trim().split("\n");
await H.record("original-rollback-tag", vpS, local[0] === "816aaaed9c3aa8fa37fbad31d3bd3f7491b3de9d", `local tag → ${local[0]}; work branch removes the old app dir only on the new branch (${local[1] || "no diff"}) — the original branch is untouched`, null);
const pj = await (await fetch(`https://api.vercel.com/v9/projects/prj_OGWzvDKrp97MDz28cfd7yE86EcBq?teamId=${TEAM}`, { headers: { authorization: `Bearer ${V}` } })).json();
const deps = await (await fetch(`https://api.vercel.com/v6/deployments?teamId=${TEAM}&projectId=prj_OGWzvDKrp97MDz28cfd7yE86EcBq&limit=3`, { headers: { authorization: `Bearer ${V}` } })).json();
// Vercel auto-builds every pushed branch of the linked repo (incl. our work branch → ERROR MISSING_SERVICES there); only deployments of the ORIGINAL branches count as "touched".
const newest = (deps.deployments ?? []).find((d) => d.meta?.githubCommitRef !== "uae-ai-command-centre"); const newestTs = newest ? new Date(newest.createdAt).toISOString() : null;
await H.record("original-vercel-project-unchanged", vpS, pj?.id === "prj_OGWzvDKrp97MDz28cfd7yE86EcBq" && (!newest || newest.createdAt < Date.parse("2026-10-20T21:30:00Z")), `project ${pj?.name} framework=${pj?.framework} updatedAt=${pj?.updatedAt ? new Date(pj.updatedAt).toISOString() : "?"}; newest deployment ${newest?.url} ${newestTs} ${newest?.state} (sha ${newest?.meta?.githubCommitSha?.slice(0, 7)}) — no deployment created since the 21:30Z rollback point`, null);
H.save();
