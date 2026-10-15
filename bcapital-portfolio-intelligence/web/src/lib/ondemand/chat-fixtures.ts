import { SSE_HEADERS } from "./chat-bridge";

/**
 * Deterministic AG-UI SSE fixture streams for vigorous multi-payload testing of `/api/chat` and `/chat`.
 * Activated ONLY when an explicit `x-chat-fixture` request header or `body.context.fixture` is passed.
 * Default live traffic (`runChatBridge`) is 100% untouched.
 */
export function buildFixtureStream(fixtureName: string): Response | null {
  const mode = fixtureName.trim().toLowerCase();
  if (!mode) return null;

  const enc = new TextEncoder();
  let seq = 0;
  const frame = (obj: Record<string, unknown>) =>
    `data: ${JSON.stringify({ seq: ++seq, ...obj })}\n\n`;

  const makeResponse = (frames: string[]) => {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const f of frames) {
          controller.enqueue(enc.encode(f));
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
          "Comparing **Lambda**, **HavocAI**, and **TRM Labs** across funding momentum and multi-source sentiment [1] [2] [3] [4] [5]:\n\n- **Lambda** (AI Infrastructure): $2.4B raised, sentiment **+0.80**.\n- **HavocAI** (Robotics & Space): $100M raised ($85M Venture round), sentiment **+0.80**.\n- **TRM Labs** (Fintech & Crypto): $136M raised (Series C+), sentiment **+0.32** with cross-channel divergence between press and Reddit threads.",
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
      frame({
        type: "CUSTOM",
        name: "ondemand.require_creds",
        value: {
          pluginId: "plugin-1777018662",
          service: "PitchBook Data Room",
          fields: [{ key: "api_token", label: "PitchBook Partner Token", type: "password" }],
        },
      }),
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

  return null;
}
