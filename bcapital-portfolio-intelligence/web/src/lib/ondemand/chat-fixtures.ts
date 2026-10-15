import { SSE_HEADERS } from "./chat-bridge";

/**
 * Deterministic AG-UI SSE fixture streams for vigorous multi-payload testing of `/api/chat` and `/chat`.
 * Activated ONLY when an explicit `x-chat-fixture` request header or `body.context.fixture` is passed.
 * Default live traffic (`runChatBridge`) is 100% untouched.
 */
export function buildFixtureStream(fixtureName: string, delayMs = 0): Response | null {
  const mode = fixtureName.trim().toLowerCase();
  if (!mode) return null;
  const pace = Math.max(0, Math.min(2000, Number(delayMs) || 0)); // per-frame pacing (ms) — `fxdelay` query param / x-chat-fixture-delay header

  const enc = new TextEncoder();
  let seq = 0;
  const frame = (obj: Record<string, unknown>) =>
    `data: ${JSON.stringify({ seq: ++seq, ...obj })}\n\n`;

  // A number inside the frame list is a pause in ms (pass-2 fixtures use it to hold the stream open while the UI waits for the user).
  const makeResponse = (frames: (string | number)[]) => {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const f of frames) {
          if (typeof f === "number") { await new Promise((r) => setTimeout(r, f)); continue; }
          controller.enqueue(enc.encode(f));
          if (pace) await new Promise((r) => setTimeout(r, pace));
        }
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: SSE_HEADERS("sessfixture20261015"),
    });
  };

  // Scenario 1: Single-company deep-dive query (Lambda)
  if (mode === "single" || mode === "single-company") {
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-single", runId: "r-single" }),
      frame({
        type: "CUSTOM",
        name: "ondemand.session",
        value: { sessionId: "sessfixture20261015", endpointId: "predefined-deepseek-flash", reasoningMode: "medium", pluginIds: ["plugin-1722260873"] },
      }),
      frame({
        type: "CUSTOM",
        name: "ondemand.status",
        value: { phase: "researching", statusMessage: "Searching native sources for Lambda…" },
      }),
      frame({
        type: "CUSTOM",
        name: "ondemand.thinking",
        value: { kind: "planning_thinking", delta: "Evaluating Lambda GPU cloud expansion, $1.0B debt facility, and multi-channel sentiment provenance.\n" },
      }),
      frame({
        type: "TOOL_CALL_START",
        toolCallId: "tc-1",
        toolCallName: "Perplexity",
      }),
      frame({
        type: "TOOL_CALL_ARGS",
        toolCallId: "tc-1",
        delta: JSON.stringify({ plugin: "Perplexity", pluginId: "plugin-1722260873", query: "Lambda AI infrastructure funding and sentiment" }),
      }),
      frame({
        type: "TOOL_CALL_END",
        toolCallId: "tc-1",
      }),
      frame({
        type: "CUSTOM",
        name: "ondemand.sources",
        value: {
          pluginId: "plugin-1722260873",
          pluginName: "Perplexity",
          sources: [
            {
              url: "https://www.reuters.com/technology/artificial-intelligence/lambda-raises-480-mln-ai-cloud-expansion-2026-02-19/",
              title: "Lambda raises capital to expand sovereign AI GPU cloud infrastructure",
              sourceName: "reuters.com",
            },
            {
              url: "https://x.com/LambdaAPI/status/1892341092837410923",
              title: "Lambda on X: Deploying next-generation AI clusters",
              sourceName: "x.com",
            },
            {
              url: "https://www.reddit.com/r/LocalLLaMA/comments/1k8abc2/lambda_cloud_h200_benchmarks/",
              title: "r/LocalLLaMA: Lambda Cloud H200 cluster benchmarks and developer feedback",
              sourceName: "reddit.com",
            },
          ],
        },
      }),
      frame({
        type: "TOOL_CALL_RESULT",
        toolCallId: "tc-1",
        content: JSON.stringify({ status: "ok", sources: 3, durationMs: 420 }),
      }),
      frame({ type: "TEXT_MESSAGE_START", messageId: "m-single" }),
      frame({
        type: "TEXT_MESSAGE_CONTENT",
        messageId: "m-single",
        delta:
          "**Lambda** leads B Capital's AI Infrastructure cohort with **$2.4B** total capital raised and a recent **$1.0B** conventional debt facility [1]. Developer benchmarks on X [2] and community discussions on Reddit [3] confirm strong cluster utilization alongside a **+0.80** composite sentiment score.",
      }),
      frame({ type: "TEXT_MESSAGE_END", messageId: "m-single" }),
      frame({
        type: "CUSTOM",
        name: "ondemand.metrics",
        value: { publicMetrics: { inputTokens: 640, outputTokens: 210, totalTokens: 850, totalTimeSec: 1.2 } },
      }),
      frame({ type: "RUN_FINISHED", threadId: "t-single", runId: "r-single" }),
    ]);
  }

  // Scenario 2: Multi-company comparison query + publisher-first +N overflow citations
  if (mode === "multi" || mode === "multi-company") {
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-multi", runId: "r-multi" }),
      frame({
        type: "CUSTOM",
        name: "ondemand.sources",
        value: {
          pluginId: "plugin-1722260873",
          pluginName: "Perplexity",
          sources: [
            { url: "https://www.reuters.com/technology/lambda-ai-cloud-2026/", title: "Lambda scales AI compute clusters", sourceName: "reuters.com" },
            { url: "https://techcrunch.com/2026/09/30/havocai-autonomous-maritime-85m/", title: "HavocAI secures $85M for autonomous defense vessels", sourceName: "techcrunch.com" },
            { url: "https://www.bloomberg.com/news/articles/2026-09-09/trm-labs-crypto-compliance/", title: "TRM Labs expands blockchain intelligence suite", sourceName: "bloomberg.com" },
            { url: "https://x.com/TRMLabs/status/1889012345678901234", title: "TRM Labs cross-chain analytics announcement", sourceName: "x.com" },
            { url: "https://www.reddit.com/r/venturecapital/comments/1m2def9/ai_defense_and_crypto_compliance_2026/", title: "r/venturecapital: Comparing Lambda, HavocAI, and TRM Labs", sourceName: "reddit.com" },
          ],
        },
      }),
      frame({ type: "TEXT_MESSAGE_START", messageId: "m-multi" }),
      frame({
        type: "TEXT_MESSAGE_CONTENT",
        messageId: "m-multi",
        delta:
          "Comparing **Lambda**, **HavocAI**, and **TRM Labs** across funding momentum and multi-source sentiment [1](https://www.reuters.com/technology/lambda-ai-cloud-2026/) [2](https://techcrunch.com/2026/09/30/havocai-autonomous-maritime-85m/) [3](https://www.bloomberg.com/news/articles/2026-09-09/trm-labs-crypto-compliance/) [4](https://x.com/TRMLabs/status/1889012345678901234) [5](https://www.reddit.com/r/venturecapital/comments/1m2def9/ai_defense_and_crypto_compliance_2026/):\n\n- **Lambda** (AI Infrastructure): $2.4B raised, sentiment **+0.80**.\n- **HavocAI** (Robotics & Space): $100M raised ($85M Venture round), sentiment **+0.80**.\n- **TRM Labs** (Fintech & Crypto): $136M raised (Series C+), sentiment **+0.32** with cross-channel divergence between press and Reddit threads.",
      }),
      frame({ type: "TEXT_MESSAGE_END", messageId: "m-multi" }),
      frame({
        type: "CUSTOM",
        name: "ondemand.metrics",
        value: { publicMetrics: { inputTokens: 820, outputTokens: 310, totalTokens: 1130, totalTimeSec: 1.5 } },
      }),
      frame({ type: "RUN_FINISHED", threadId: "t-multi", runId: "r-multi" }),
    ]);
  }

  // Scenario 3: Sentiment provenance & conflict-alert query (TRM Labs & Lambda)
  if (mode === "conflict" || mode === "conflict-provenance") {
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-conflict", runId: "r-conflict" }),
      frame({
        type: "CUSTOM",
        name: "ondemand.sources",
        value: {
          pluginId: "plugin-1722260873",
          pluginName: "Perplexity",
          sources: [
            { url: "https://www.bloomberg.com/news/articles/2026-09-09/trm-labs-expansion/", title: "TRM Labs Series C Expansion", sourceName: "bloomberg.com" },
            { url: "https://www.reddit.com/r/cryptocurrency/comments/1n9xyz4/trm_labs_compliance_debate/", title: "r/cryptocurrency: Debate over on-chain compliance analytics", sourceName: "reddit.com" },
          ],
        },
      }),
      frame({ type: "TEXT_MESSAGE_START", messageId: "m-conflict" }),
      frame({
        type: "TEXT_MESSAGE_CONTENT",
        messageId: "m-conflict",
        delta:
          "**TRM Labs** and **Lambda** exhibit distinct multi-source sentiment provenance profiles [1] [2]. Inspect the interactive 4-factor breakdown (Level 45%, Momentum 25%, Log Volume 15%, Wilson Confidence 15%) and click any source filter chip (`X`, `Reddit`, `News`, `LinkedIn`, `TikTok`, `Funding`) below to filter native permalinks.",
      }),
      frame({ type: "TEXT_MESSAGE_END", messageId: "m-conflict" }),
      frame({ type: "RUN_FINISHED", threadId: "t-conflict", runId: "r-conflict" }),
    ]);
  }

  // Scenario 4: Multi-source citation & source-card stepping query
  if (mode === "citations" || mode === "citations-stepping") {
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-cites", runId: "r-cites" }),
      frame({
        type: "CUSTOM",
        name: "ondemand.sources",
        value: {
          pluginId: "plugin-1722260873",
          pluginName: "Perplexity",
          sources: [
            { url: "https://www.reuters.com/business/energy/fervo-energy-geothermal-milestone-2026/", title: "Fervo Energy achieves commercial geothermal milestone", sourceName: "reuters.com" },
            { url: "https://www.bloomberg.com/news/articles/2026-08-14/apptronik-apollo-robotics/", title: "Apptronik scales Apollo humanoid deployments", sourceName: "bloomberg.com" },
            { url: "https://techcrunch.com/2026/07/22/fervo-energy-grid-scale-power/", title: "Fervo Energy signs grid-scale clean power agreements", sourceName: "techcrunch.com" },
            { url: "https://www.wsj.com/articles/industrial-humanoid-robots-apptronik-2026/", title: "WSJ: Humanoid robotics enter logistics warehouses", sourceName: "wsj.com" },
            { url: "https://x.com/FervoEnergy/status/1884512398471238941", title: "Fervo Energy Cape Station drilling update", sourceName: "x.com" },
            { url: "https://www.reddit.com/r/energy/comments/1p4geo8/fervo_enhanced_geothermal_results/", title: "r/energy: Fervo enhanced geothermal field data", sourceName: "reddit.com" },
          ],
        },
      }),
      frame({ type: "TEXT_MESSAGE_START", messageId: "m-cites" }),
      frame({
        type: "TEXT_MESSAGE_CONTENT",
        messageId: "m-cites",
        delta:
          "**Fervo Energy** and **Apptronik** are backed by tier-1 press and native social citations [1] [2] [3] [4] [5] [6]. Every inline citation chip and Sources rail card links directly to its canonical native publisher or social permalink.",
      }),
      frame({ type: "TEXT_MESSAGE_END", messageId: "m-cites" }),
      frame({ type: "RUN_FINISHED", threadId: "t-cites", runId: "r-cites" }),
    ]);
  }

  // Scenario 5: Waiting / credential / browser-action SSE frames & between-step summarization
  if (mode === "creds" || mode === "waiting-creds") {
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-creds", runId: "r-creds" }),
      frame({
        type: "CUSTOM",
        name: "ondemand.session",
        value: { sessionId: "sesscreds20261015", endpointId: "predefined-deepseek-flash", reasoningMode: "medium", pluginIds: ["plugin-1722260873"] },
      }),
      frame({
        type: "CUSTOM",
        name: "ondemand.plan",
        value: {
          objective: "Verify PitchBook investor records and summarize step findings for PaleBlueDot",
          steps: [
            { id: "1", title: "Query portfolio & news signals for PaleBlueDot", plugins: ["plugin-1722260873"] },
            { id: "2", title: "Authenticate external data room connector", plugins: ["plugin-1777018662"] },
          ],
        },
      }),
      frame({
        type: "CUSTOM",
        name: "ondemand.step",
        value: { phase: "done", stepId: "1", index: 1, label: "Query portfolio & news signals for PaleBlueDot" },
      }),
      frame({
        type: "CUSTOM",
        name: "ondemand.summary",
        value: {
          phase: "done",
          index: 1,
          stepId: "1",
          text: "Step 1 verified PaleBlueDot's $200M Series C round and +0.70 positive sentiment across 56 native social posts.",
          at: "2026-10-15T03:00:00Z",
        },
      }),
      frame({ type: "TEXT_MESSAGE_START", messageId: "m-creds" }),
      frame({
        type: "TEXT_MESSAGE_CONTENT",
        messageId: "m-creds",
        delta: "Step 1 completed for **PaleBlueDot**. Supplying or cancelling the credential prompt above uses the server-side `/api/chat/creds` relay.",
      }),
      frame({
        type: "CUSTOM",
        name: "ondemand.require_creds",
        value: {
          pluginId: "plugin-1777018662",
          service: "PitchBook Data Room",
          fields: [{ key: "api_token", label: "PitchBook Partner Token", type: "password" }],
        },
      }),
      frame({ type: "TEXT_MESSAGE_END", messageId: "m-creds" }),
      frame({ type: "RUN_FINISHED", threadId: "t-creds", runId: "r-creds" }),
    ]);
  }

  // Scenario 6: Forced error / retry payload & credits-failure fixture path
  if (mode === "error" || mode === "forced-error") {
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-err", runId: "r-err" }),
      frame({
        type: "RUN_ERROR",
        message: "The answer could not be completed: internal upstream exception",
        code: "upstream_http",
      }),
    ]);
  }

  // Scenario 7: High-frequency token streaming & edge-case markdown payload
  if (mode === "highfreq" || mode === "high-freq-stream") {
    const chunks = [
      "### High-Frequency Streaming Analysis: **PaleBlueDot** & **WRITER**\n\n",
      "Streaming 40 rapid token deltas through the `setStream` ",
      "80 ms / 140 ms `requestAnimationFrame` coalescer ",
      "to verify zero layout thrash and stable `React.memo` ",
      "company provenance cards.\n\n",
      "| Company | Sector | Last Round | Sentiment |\n",
      "| :--- | :--- | :--- | :--- |\n",
      "| **PaleBlueDot** | AI Infrastructure | Series C · $200M | **+0.70** |\n",
      "| **WRITER** | AI & Enterprise | Series C · $200M | **+0.65** |\n\n",
      " Verified native sources: [Reuters Report](https://www.reuters.com/technology/ai-enterprise-2026/) ",
      "and [Bloomberg Analysis](https://www.bloomberg.com/news/articles/2026-10-01/palebluedot-ai-compute/).",
    ];
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-hf", runId: "r-hf" }),
      frame({ type: "TEXT_MESSAGE_START", messageId: "m-hf" }),
      ...chunks.map((delta) => ({
        type: "TEXT_MESSAGE_CONTENT",
        messageId: "m-hf",
        delta,
      })).map((f) => frame(f)),
      frame({ type: "TEXT_MESSAGE_END", messageId: "m-hf" }),
      frame({
        type: "CUSTOM",
        name: "ondemand.metrics",
        value: { publicMetrics: { inputTokens: 512, outputTokens: 480, totalTokens: 992, totalTimeSec: 0.9 } },
      }),
      frame({ type: "RUN_FINISHED", threadId: "t-hf", runId: "r-hf" }),
    ]);
  }

  // Scenario 8 (chat-ui parity pass 1, 2026-10-15): the full run WORKSPACE — active skill + 5-stage pipeline, 6 publisher sources (+N overflow),
  // assumptions, a root-first Intelligent UI statement stream (6 payload types + sandboxed HTML), the answer, and the Verified Deliverables shelf.
  if (mode === "workspace" || mode === "run-workspace") {
    const wbV3 = "## Aid delivery around a blocked Strait of Hormuz — problem-solving workbook\n\n**Status header**\n\n- **Problem one-liner**: aid to Somalia and Yemen must keep flowing while the Strait of Hormuz is closed to commercial traffic.\n- **Decision owner**: regional logistics lead\n- **Deadline**: 14 days\n\n## Issue tree\n\n1. Alternative sea corridors (Red Sea via Bab el-Mandeb)\n2. Overland staging through Oman (Duqm, Salalah)\n3. Air bridge for medical cargo\n";
    const wbV2 = "## Aid delivery around a blocked Strait of Hormuz — problem-solving workbook\n\n**Status header**\n\n- **Problem one-liner**: aid to Somalia must keep flowing while Hormuz is closed.\n\n## Issue tree (draft)\n\n1. Alternative sea corridors\n2. Overland staging through Oman\n";
    const wbV1 = "## Aid delivery around a blocked Strait of Hormuz — problem-solving workbook\n\n_Draft v1 — scope and objective only._\n";
    const synthesis = "Your problem-solving workbook is ready. Here's what it delivers, answer-first. **Bottom line:** the Strait of Hormuz constrains only cargo routed through the Gulf; Somalia- and Yemen-bound aid can be re-staged through Duqm and Salalah with a 4–6 day penalty.";
    const md = (t: string) => `data:text/markdown;charset=utf-8,${encodeURIComponent(t)}`;
    const sources = [
      { url: "https://www.reuters.com/world/middle-east/hormuz-shipping-aid-corridors-2026-10-12/", title: "Hormuz closure forces aid agencies onto Omani ports", sourceName: "reuters.com" },
      { url: "https://www.bloomberg.com/news/articles/2026-10-11/gulf-shipping-insurance-spikes-as-hormuz-stays-shut", title: "Gulf shipping insurance spikes as Hormuz stays shut", sourceName: "bloomberg.com" },
      { url: "https://www.ft.com/content/aid-logistics-oman-duqm-2026", title: "Duqm becomes the Gulf's emergency aid gateway", sourceName: "ft.com" },
      { url: "https://www.unocha.org/publications/report/somalia/hormuz-impact-2026", title: "OCHA situation report: Hormuz impact on Somalia pipeline", sourceName: "unocha.org" },
      { url: "https://www.wfp.org/news/wfp-reroutes-yemen-shipments-salalah", title: "WFP reroutes Yemen shipments through Salalah", sourceName: "wfp.org" },
      { url: "https://www.lloydslist.com/LL1150321/Hormuz-transits-fall-to-zero", title: "Hormuz transits fall to zero for a third week", sourceName: "lloydslist.com" },
    ];
    const stage = (id: string, phase: "start" | "done") => frame({ type: "CUSTOM", name: "ondemand.stage", value: { id, phase } });
    const skill = (label: string | null) => frame({ type: "CUSTOM", name: "ondemand.skill", value: { label } });
    const iui = (statements: unknown[]) => frame({ type: "CUSTOM", name: "ondemand.iui", value: { statements } });
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-ws", runId: "r-ws" }),
      frame({ type: "CUSTOM", name: "ondemand.session", value: { sessionId: "sessworkspace20261015", endpointId: "predefined-deepseek-flash", reasoningMode: "medium", pluginIds: ["plugin-1722260873"] } }),
      frame({ type: "CUSTOM", name: "ondemand.status", value: { phase: "planning", statusMessage: "Planning the problem-solving run…" } }),
      frame({ type: "CUSTOM", name: "ondemand.plan", value: { objective: "Plan aid delivery around a blocked Strait of Hormuz", steps: [
        { id: "1", title: "Scout shipping and port data", plugins: ["plugin-1722260873"] },
        { id: "2", title: "Benchmark alternative corridors", plugins: ["plugin-1722260873"] },
        { id: "3", title: "Solve the staging problem", plugins: [] },
        { id: "4", title: "Write the storyline", plugins: [] },
        { id: "5", title: "Design the workbook", plugins: [] },
      ] } }),
      // ---- root-first Intelligent UI: root + layouts BEFORE any data statement (skeleton mounts on the first rAF commit)
      iui([
        { op: "root", id: "root", title: "Hormuz aid-corridor workspace", children: ["kpis", "grid-a", "grid-b", "wb", "html"] },
        { op: "layout", id: "grid-a", kind: "row", children: ["cmp", "tl"] },
        { op: "layout", id: "grid-b", kind: "row", children: ["sent", "country"] },
      ]),
      skill("Perplexity · web research"),
      stage("data-scout", "start"),
      frame({ type: "CUSTOM", name: "ondemand.thinking", value: { kind: "step_thinking", delta: "Scouting Hormuz transit counts, Omani port capacity and WFP/OCHA rerouting notices.\n" } }),
      frame({ type: "TOOL_CALL_START", toolCallId: "tc-ws-1", toolCallName: "Perplexity" }),
      frame({ type: "TOOL_CALL_ARGS", toolCallId: "tc-ws-1", delta: JSON.stringify({ plugin: "Perplexity", pluginId: "plugin-1722260873", query: "Strait of Hormuz closure aid corridors Oman Duqm Salalah 2026", stepId: "1" }) }),
      frame({ type: "TOOL_CALL_END", toolCallId: "tc-ws-1" }),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "1", index: 1, label: "Scout shipping and port data" } }),
      frame({ type: "CUSTOM", name: "ondemand.sources", value: { pluginId: "plugin-1722260873", pluginName: "Perplexity", sources } }),
      frame({ type: "TOOL_CALL_RESULT", toolCallId: "tc-ws-1", content: JSON.stringify({ status: "ok", sources: sources.length, durationMs: 1340 }) }),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "1", index: 1 } }),
      stage("data-scout", "done"),
      iui([{ op: "data", id: "kpis", payload: { type: "kpi-cards", items: [
        { label: "Hormuz transits / day", value: "0", delta: "−100% vs Sep", tone: "down" },
        { label: "Aid tonnage at risk", value: "18,400 t", delta: "Somalia + Yemen", tone: "flat" },
        { label: "Duqm spare capacity", value: "2,100 TEU/wk", delta: "+35% after surge", tone: "up" },
        { label: "Reroute penalty", value: "4–6 days", delta: "vs Gulf baseline", tone: "flat" },
      ] } }]),
      stage("benchmark", "start"),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "2", index: 2, label: "Benchmark alternative corridors" } }),
      frame({ type: "CUSTOM", name: "ondemand.assumptions", value: { items: [
        "Hormuz stays closed to commercial traffic for at least 14 days.",
        "Omani ports (Duqm, Salalah) keep current berth availability.",
        "Insurance surcharges on Red Sea transits remain below 2% of hull value.",
      ] } }),
      iui([
        { op: "data", id: "cmp", payload: { type: "comparison-table", caption: "Corridor benchmark", columns: ["Corridor", "Transit days", "Cost / t", "Risk"], rows: [["Gulf via Hormuz (baseline)", 6, "$142", "closed"], ["Red Sea via Bab el-Mandeb", 9, "$188", "medium"], ["Duqm overland staging", 10, "$171", "low"], ["Salalah → Berbera air bridge", 2, "$960", "low"]] } },
        { op: "data", id: "tl", payload: { type: "funding-timeline", company: "Duqm port expansion (OPAZ)", rounds: [
          { round: "Phase 1 berths", date: "2024-03-01", amountUsd: 1200000000, sourceUrl: "https://www.ft.com/content/aid-logistics-oman-duqm-2026" },
          { round: "Dry bulk terminal", date: "2025-06-15", amountUsd: 350000000, sourceUrl: null },
          { round: "Emergency aid surge fund", date: "2026-10-10", amountUsd: 40000000, sourceUrl: "https://www.wfp.org/news/wfp-reroutes-yemen-shipments-salalah" },
        ] } },
      ]),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "2", index: 2 } }),
      stage("benchmark", "done"),
      skill("problem-solve · issue tree"),
      stage("problem-solve", "start"),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "3", index: 3, label: "Solve the staging problem" } }),
      iui([
        { op: "data", id: "sent", payload: { type: "sentiment-breakdown", company: "Corridor viability — Duqm staging", score: 0.62, factors: [{ label: "Level", weight: 0.45, value: 0.71 }, { label: "Momentum", weight: 0.25, value: 0.58 }, { label: "Log volume", weight: 0.15, value: 0.44 }, { label: "Wilson confidence", weight: 0.15, value: 0.66 }], sources: [{ channel: "News", count: 14 }, { channel: "X", count: 9 }, { channel: "Reddit", count: 3 }] } },
        { op: "data", id: "country", payload: { type: "country-profile", country: "Oman", flagUrl: "/brand/b-capital-mark.png", imageUrl: "/brand/b-capital-mark.png", imageAlt: "Port of Duqm", facts: [{ label: "Ports in play", value: "Duqm · Salalah · Sohar" }, { label: "Road distance Duqm → Salalah", value: "560 km" }, { label: "Aid staging capacity", value: "2,100 TEU / week" }, { label: "Customs regime", value: "Free-zone, 24 h clearance" }] } },
      ]),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "3", index: 3 } }),
      stage("problem-solve", "done"),
      skill("storyline · answer-first synthesis"),
      stage("storyline", "start"),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "4", index: 4, label: "Write the storyline" } }),
      frame({ type: "TEXT_MESSAGE_START", messageId: "m-ws" }),
      frame({ type: "TEXT_MESSAGE_CONTENT", messageId: "m-ws", delta: "**Bottom line:** the Strait of Hormuz constrains only cargo routed through the Gulf [1] [2]. " }),
      frame({ type: "TEXT_MESSAGE_CONTENT", messageId: "m-ws", delta: "Somalia- and Yemen-bound aid can be re-staged through **Duqm** and **Salalah** with a 4–6 day penalty [3] [4] [5] [6].\n\n" }),
      frame({ type: "TEXT_MESSAGE_CONTENT", messageId: "m-ws", delta: "- **Sea:** Red Sea via Bab el-Mandeb keeps bulk food moving at +32% cost.\n- **Land:** Duqm overland staging is the lowest-risk corridor.\n- **Air:** a Salalah → Berbera bridge covers medical cargo only.\n" }),
      frame({ type: "TEXT_MESSAGE_END", messageId: "m-ws" }),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "4", index: 4 } }),
      stage("storyline", "done"),
      skill("design · workbook"),
      stage("design", "start"),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "5", index: 5, label: "Design the workbook" } }),
      iui([
        { op: "data", id: "wb", payload: { type: "workbook-preview", title: "Problem-solving workbook", version: 3, markdown: wbV3 } },
        { op: "data", id: "html", payload: { type: "html", title: "Corridor map (run-produced HTML)", height: 160, html: "<!doctype html><html><body style=\"margin:0;font:13px/1.4 system-ui;background:#fbf8f1;color:#1f2328;padding:14px\"><strong>Corridor map</strong><p>Duqm → Salalah → Berbera · 560 km road + 1 sea leg.</p><script>document.body.innerHTML='SCRIPT RAN'</script></body></html>" } },
      ]),
      frame({ type: "CUSTOM", name: "ondemand.deliverables", value: {
        durationMs: 452000,
        finalDownloadUrl: md(wbV3), finalDownloadName: "problem-solving-workbook-v3.md",
        items: [
          { id: "d-wb", title: "Problem-solving workbook", format: "workbook-md", version: 3, verified: true, preview: wbV3, downloadUrl: md(wbV3), versions: [
            { version: 1, preview: wbV1, contentUrl: md(wbV1), at: "2026-10-15T05:31:10Z" },
            { version: 2, preview: wbV2, contentUrl: md(wbV2), at: "2026-10-15T05:35:48Z" },
            { version: 3, preview: wbV3, contentUrl: md(wbV3), at: "2026-10-15T05:38:42Z" },
          ] },
          { id: "d-syn", title: "Run synthesis", format: "markdown", version: 1, verified: true, preview: synthesis, downloadUrl: null, versions: [] },
        ],
      } }),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "5", index: 5 } }),
      stage("design", "done"),
      skill(null),
      frame({ type: "CUSTOM", name: "ondemand.metrics", value: { publicMetrics: { inputTokens: 2210, outputTokens: 640, totalTokens: 2850, totalTimeSec: 452 } } }),
      frame({ type: "RUN_FINISHED", threadId: "t-ws", runId: "r-ws" }),
    ]);
  }

  // Scenario 9 (pass 2 — payload B): country profile + 5-stage pipeline + a `Waiting for you` credentials prompt relayed through /api/chat/creds.
  // The stream HOLDS OPEN for ~8 s after the require_creds frame so the paused task timer is observable; submitting the form resumes the run.
  if (mode === "creds-pipeline" || mode === "country-creds") {
    const stage = (id: string, phase: "start" | "done") => frame({ type: "CUSTOM", name: "ondemand.stage", value: { id, phase } });
    const iui = (statements: unknown[]) => frame({ type: "CUSTOM", name: "ondemand.iui", value: { statements } });
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-cp", runId: "r-cp" }),
      frame({ type: "CUSTOM", name: "ondemand.session", value: { sessionId: "sesscreds20261015", endpointId: "predefined-deepseek-flash", reasoningMode: "medium", pluginIds: ["plugin-1722260873", "plugin-1777018662"] } }),
      frame({ type: "CUSTOM", name: "ondemand.status", value: { phase: "planning", statusMessage: "Planning the country profile…" } }),
      frame({ type: "CUSTOM", name: "ondemand.plan", value: { objective: "Profile Oman as an aid-staging country and verify the PitchBook investor record", steps: [
        { id: "1", title: "Scout country data", plugins: ["plugin-1722260873"] }, { id: "2", title: "Benchmark neighbouring hubs", plugins: ["plugin-1722260873"] },
        { id: "3", title: "Verify investor records (PitchBook)", plugins: ["plugin-1777018662"] }, { id: "4", title: "Write the storyline", plugins: [] }, { id: "5", title: "Design the profile card", plugins: [] } ] } }),
      iui([{ op: "root", id: "root", title: "Oman — aid-staging country profile", children: ["country", "kpis"] }]),
      frame({ type: "CUSTOM", name: "ondemand.skill", value: { label: "Perplexity · web research" } }),
      stage("data-scout", "start"),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "1", index: 1, label: "Scout country data" } }),
      frame({ type: "TOOL_CALL_START", toolCallId: "tc-cp-1", toolCallName: "Perplexity" }),
      frame({ type: "TOOL_CALL_ARGS", toolCallId: "tc-cp-1", delta: JSON.stringify({ plugin: "Perplexity", pluginId: "plugin-1722260873", query: "Oman ports Duqm Salalah aid staging capacity 2026", stepId: "1" }) }),
      frame({ type: "TOOL_CALL_END", toolCallId: "tc-cp-1" }),
      frame({ type: "CUSTOM", name: "ondemand.sources", value: { pluginId: "plugin-1722260873", pluginName: "Perplexity", sources: [
        { url: "https://www.reuters.com/world/middle-east/oman-duqm-aid-hub-2026-10-09/", title: "Oman's Duqm emerges as the Gulf's aid hub", sourceName: "reuters.com" },
        { url: "https://www.ft.com/content/oman-logistics-2026", title: "Oman bets on logistics as Hormuz stays shut", sourceName: "ft.com" } ] } }),
      frame({ type: "TOOL_CALL_RESULT", toolCallId: "tc-cp-1", content: JSON.stringify({ status: "ok", sources: 2, durationMs: 980 }) }),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "1", index: 1 } }),
      stage("data-scout", "done"),
      iui([{ op: "data", id: "country", payload: { type: "country-profile", country: "Oman", flagUrl: "/brand/b-capital-mark.png", facts: [{ label: "Ports in play", value: "Duqm · Salalah · Sohar" }, { label: "Road distance Duqm → Salalah", value: "560 km" }, { label: "Aid staging capacity", value: "2,100 TEU / week" }, { label: "Customs regime", value: "Free-zone, 24 h clearance" }] } }]),
      stage("benchmark", "start"),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "2", index: 2, label: "Benchmark neighbouring hubs" } }),
      iui([{ op: "data", id: "kpis", payload: { type: "kpi-cards", items: [{ label: "Duqm spare capacity", value: "2,100 TEU/wk", delta: "+35%", tone: "up" }, { label: "Salalah dwell time", value: "1.8 days", delta: "−0.4 d", tone: "up" }, { label: "Jebel Ali (closed)", value: "0", delta: "Hormuz", tone: "down" }] } }]),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "2", index: 2 } }),
      stage("benchmark", "done"),
      frame({ type: "CUSTOM", name: "ondemand.skill", value: { label: "PitchBook Investor Finder" } }),
      stage("problem-solve", "start"),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "3", index: 3, label: "Verify investor records (PitchBook)" } }),
      frame({ type: "CUSTOM", name: "ondemand.require_creds", value: { pluginId: "plugin-1777018662", service: "PitchBook Investor Finder", fields: [{ key: "api_token", label: "PitchBook Partner Token", type: "password" }] } }),
      20000, // hold the stream open (20 s): the UI shows `Waiting for you`, the task timer pauses, /api/chat/creds resumes it
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "3", index: 3 } }),
      stage("problem-solve", "done"),
      frame({ type: "CUSTOM", name: "ondemand.skill", value: { label: "storyline · synthesis" } }),
      stage("storyline", "start"),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "4", index: 4, label: "Write the storyline" } }),
      frame({ type: "TEXT_MESSAGE_START", messageId: "m-cp" }),
      frame({ type: "TEXT_MESSAGE_CONTENT", messageId: "m-cp", delta: "**Oman** is the only Gulf state with two deep-water ports outside the Strait of Hormuz [1] [2]. Duqm can absorb the Somalia and Yemen aid pipeline at 2,100 TEU a week with a 4–6 day penalty." }),
      frame({ type: "TEXT_MESSAGE_END", messageId: "m-cp" }),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "4", index: 4 } }),
      stage("storyline", "done"),
      stage("design", "start"),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "5", index: 5, label: "Design the profile card" } }),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "5", index: 5 } }),
      stage("design", "done"),
      frame({ type: "CUSTOM", name: "ondemand.skill", value: { label: null } }),
      frame({ type: "CUSTOM", name: "ondemand.metrics", value: { publicMetrics: { inputTokens: 1210, outputTokens: 180, totalTokens: 1390, totalTimeSec: 14 } } }),
      frame({ type: "RUN_FINISHED", threadId: "t-cp", runId: "r-cp" }),
    ]);
  }

  // Scenario 10 (pass 2 — payload E): between-step summarisation. summarize_history.initialized / .completed map (eventMap.ts) to
  // CE.summary {phase:"start"} / {phase:"done"}; the thinking block and the Working list must stay MOUNTED across them (same DOM nodes).
  if (mode === "summarize" || mode === "summarize-history") {
    const think = (kind: string, delta: string) => frame({ type: "CUSTOM", name: "ondemand.thinking", value: { kind, delta } });
    const summary = (index: number, phase: "start" | "done", text?: string) => frame({ type: "CUSTOM", name: "ondemand.summary", value: { phase, index, stepId: String(index), ...(text ? { text, at: new Date().toISOString() } : {}) } });
    const tool = (n: number, q: string) => [
      frame({ type: "TOOL_CALL_START", toolCallId: `tc-sm-${n}`, toolCallName: "Perplexity" }),
      frame({ type: "TOOL_CALL_ARGS", toolCallId: `tc-sm-${n}`, delta: JSON.stringify({ plugin: "Perplexity", pluginId: "plugin-1722260873", query: q, stepId: String(n) }) }),
      frame({ type: "TOOL_CALL_END", toolCallId: `tc-sm-${n}` }),
      frame({ type: "TOOL_CALL_RESULT", toolCallId: `tc-sm-${n}`, content: JSON.stringify({ status: "ok", sources: 2, durationMs: 400 + n * 50 }) }),
    ];
    const lines = Array.from({ length: 24 }, (_, i) => `Reasoning line ${i + 1}: weighing corridor ${["Duqm", "Salalah", "Berbera", "Djibouti"][i % 4]} on cost, dwell time and insurance.\n`);
    return makeResponse([
      frame({ type: "RUN_STARTED", threadId: "t-sm", runId: "r-sm" }),
      frame({ type: "CUSTOM", name: "ondemand.session", value: { sessionId: "sesssummarize20261015", endpointId: "predefined-deepseek-flash", reasoningMode: "medium", pluginIds: ["plugin-1722260873"] } }),
      frame({ type: "CUSTOM", name: "ondemand.status", value: { phase: "planning", statusMessage: "Planning a three-step corridor review…" } }),
      frame({ type: "CUSTOM", name: "ondemand.plan", value: { objective: "Review three aid corridors and summarise between steps", steps: [
        { id: "1", title: "Corridor cost scan", plugins: ["plugin-1722260873"] }, { id: "2", title: "Dwell-time benchmark", plugins: ["plugin-1722260873"] }, { id: "3", title: "Insurance surcharge check", plugins: ["plugin-1722260873"] } ] } }),
      ...lines.slice(0, 8).map((l) => think("planning_thinking", l)),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "1", index: 1, label: "Corridor cost scan" } }),
      ...tool(1, "aid corridor cost per tonne Duqm Salalah 2026"),
      ...lines.slice(8, 14).map((l) => think("step_thinking", l)),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "1", index: 1 } }),
      300,
      summary(1, "start"),                                   // summarize_history.initialized
      300,
      summary(1, "done", "Step 1 — Duqm is the cheapest open corridor at $171/t; Salalah $188/t."),  // summarize_history.completed
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "2", index: 2, label: "Dwell-time benchmark" } }),
      ...tool(2, "port dwell time Duqm Salalah Berbera 2026"),
      ...lines.slice(14, 20).map((l) => think("step_thinking", l)),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "2", index: 2 } }),
      300,
      summary(2, "start"),
      300,
      summary(2, "done", "Step 2 — Salalah dwell 1.8 days beats Duqm 2.6 days; Berbera 4.1 days."),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "start", stepId: "3", index: 3, label: "Insurance surcharge check" } }),
      ...tool(3, "Red Sea war-risk insurance surcharge October 2026"),
      ...lines.slice(20).map((l) => think("step_thinking", l)),
      frame({ type: "CUSTOM", name: "ondemand.step", value: { phase: "done", stepId: "3", index: 3 } }),
      300,
      summary(3, "start"),
      300,
      summary(3, "done", "Step 3 — war-risk surcharge 1.4% of hull value, below the 2% threshold."),
      frame({ type: "TEXT_MESSAGE_START", messageId: "m-sm" }),
      frame({ type: "TEXT_MESSAGE_CONTENT", messageId: "m-sm", delta: "**Recommendation:** stage through **Duqm** (cheapest), overflow via **Salalah** (fastest dwell); Red Sea surcharges stay under the 2% ceiling, so the corridor remains viable.\n\n" }),
      ...Array.from({ length: 12 }, (_, i) => frame({ type: "TEXT_MESSAGE_CONTENT", messageId: "m-sm", delta: `- Detail ${i + 1}: ${["cost", "dwell", "insurance", "capacity"][i % 4]} evidence summarised between steps.\n` })),
      frame({ type: "TEXT_MESSAGE_END", messageId: "m-sm" }),
      frame({ type: "CUSTOM", name: "ondemand.metrics", value: { publicMetrics: { inputTokens: 1800, outputTokens: 320, totalTokens: 2120, totalTimeSec: 6 } } }),
      frame({ type: "RUN_FINISHED", threadId: "t-sm", runId: "r-sm" }),
    ]);
  }

  return null;
}
