# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chat.spec.ts >> Analyst chat — streaming >> answer streams incrementally via SSE with plugin activity and sources
- Location: e2e/chat.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator: locator('img[data-testid="brand-logo"]').first()
Expected: attached
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeAttached" locator('img[data-testid="brand-logo"]').first() with timeout 15000ms
  - waiting for locator('img[data-testid="brand-logo"]').first()

```

```yaml
- link "Skip to main content":
  - /url: "#main"
- note "Disclaimer": UAE AI Intelligence — Concept Demonstration Not an official government system · Public-source data, as of 21 Oct 2026 · No government logo or endorsement implied
- complementary "Primary navigation":
  - button "Expand navigation"
  - navigation "Primary":
    - link "National Overview":
      - /url: /overview
    - link "Watchlist":
      - /url: /watchlist
    - link "Sentiment Universe":
      - /url: /sentiment
    - link "News Intelligence":
      - /url: /news
    - link "Tech Radar":
      - /url: /radar
    - link "Ecosystem Graph":
      - /url: /graph
    - link "Executive Chat":
      - /url: /chat
    - link "National Briefing":
      - /url: /briefing
    - link "Artifacts":
      - /url: /artifacts
    - link "Methodology":
      - /url: /methodology
    - link "Settings":
      - /url: /settings
  - button "New chat"
  - button "Search organisations (Ctrl or Cmd + K)": Search ⌘K
  - button "Switch to dark mode"
- main:
  - heading "Executive Intelligence Chat" [level=1]
  - text: Concept Demonstration
  - button "New chat"
  - button "Open artifacts"
  - button "Open inspector": Inspector
  - heading "Executive Intelligence Chat" [level=2]
  - paragraph: Concept Demonstration — not an official government system · answers split Verified facts vs Interpretation, with citations
  - list "Context organisations":
    - listitem: G42 Company
    - listitem: Space42 PLC Company
    - listitem: Technology Innovation Institute Research centre
    - listitem: EDGE Group Company
    - listitem: Mohamed bin Zayed University of Artificial Intelligence University
  - button "TII announcements What has TII announced recently?":
    - strong: TII announcements
    - text: What has TII announced recently?
  - button "International acceleration Which UAE AI companies are accelerating internationally?":
    - strong: International acceleration
    - text: Which UAE AI companies are accelerating internationally?
  - button "Employment sentiment What is driving negative sentiment about AI employment?":
    - strong: Employment sentiment
    - text: What is driving negative sentiment about AI employment?
  - button "Compare research Compare G42, EDGE and TII's AI research activity.":
    - strong: Compare research
    - text: Compare G42, EDGE and TII's AI research activity.
  - button "New partnerships Which UAE organizations announced new AI partnerships this month?":
    - strong: New partnerships
    - text: Which UAE organizations announced new AI partnerships this month?
  - button "Attach a file"
  - textbox "Message":
    - /placeholder: Ask about UAE AI organisations, news or sentiment…
  - button "Start voice mode (full duplex)"
  - button "Send message" [disabled]
  - paragraph: GPT-5.6 Luna · Enter to send
  - paragraph: "Context: 5 organisations — Mohamed bin Zayed University of Artificial Intelligence, G42, Technology Innovation Institute, EDGE Group, Space42 PLC"
  - paragraph: "Intelligence engine: OnDemand"
  - status
  - paragraph: GPT-5.6 Luna · Perplexity
  - complementary "Inspector":
    - heading "Inspector" [level=2]
    - button "Close inspector"
    - heading "This run" [level=2]
    - paragraph: GPT-5.6 Luna · reasoning medium
    - list "Plugins in this run":
      - listitem:
        - 'button "Perplexity: queued"':
          - img "Perplexity"
    - group: Developer details
    - heading "Organisation context 5 of 5 selected" [level=2]: Organisation context 5/5
    - group "Mohamed bin Zayed University of Artificial Intelligence, University":
      - img "Mohamed bin Zayed University of Artificial Intelligence": M
      - text: Mohamed bin Zayed University of Artificial Intelligence
      - button "Remove Mohamed bin Zayed University of Artificial Intelligence from context"
    - group "G42, Company":
      - img "G42"
      - text: G42
      - button "Remove G42 from context"
    - group "Technology Innovation Institute, Research centre":
      - img "Technology Innovation Institute": T
      - text: Technology Innovation Institute
      - button "Remove Technology Innovation Institute from context"
    - group "EDGE Group, Company":
      - img "EDGE Group": E
      - text: EDGE Group
      - button "Remove EDGE Group from context"
    - group "Space42 PLC, Company":
      - img "Space42 PLC": S
      - text: Space42 PLC
      - button "Remove Space42 PLC from context"
    - text: Add a company
    - combobox "Add a company" [disabled]
    - status: Remove a company to add another.
    - list:
      - listitem:
        - img "G42"
        - text: G42 29 news · 50 voices
      - listitem:
        - img "Space42 PLC": S
        - text: Space42 PLC 2 news · 5 voices
      - listitem:
        - img "Technology Innovation Institute": T
        - text: Technology Innovation Institute 7 news · 14 voices
      - listitem:
        - img "EDGE Group": E
        - text: EDGE Group 3 news · 0 voices
      - listitem:
        - img "Mohamed bin Zayed University of Artificial Intelligence": M
        - text: Mohamed bin Zayed University of Artificial Intelligence 8 news · 17 voices
    - heading "Model & plugins" [level=2]
    - paragraph: GPT-5.6 Luna · reasoning medium
    - region "Plugins":
      - heading "Plugins (40 available · 1 on this turn)" [level=3]
      - paragraph: live directory · 40 plugins · selection applies per turn
      - searchbox "Search all plugins"
      - paragraph: Showing 40 of 186
      - list:
        - listitem:
          - img "Perplexity"
          - paragraph: Perplexity general locked on invoked
          - switch "Perplexity (locked on)" [checked] [disabled]
        - listitem:
          - img "Internet"
          - paragraph: Internet research connected
          - switch "Use Internet this turn"
        - listitem:
          - img "GPT Search"
          - paragraph: GPT Search research connected
          - switch "Use GPT Search this turn"
        - listitem:
          - img "X Search Agent"
          - paragraph: X Search Agent general connected
          - switch "Use X Search Agent this turn"
        - listitem:
          - paragraph: X general suggested
          - switch "Use X this turn"
        - listitem:
          - paragraph: Tiktok general connected
          - switch "Use Tiktok this turn"
        - listitem:
          - paragraph: Instagram User Info Extracter general connected
          - switch "Use Instagram User Info Extracter this turn"
        - listitem:
          - paragraph: Instagram general suggested
          - switch "Use Instagram this turn"
        - listitem:
          - paragraph: YouTube Data API v3 - Captions general suggested
          - switch "Use YouTube Data API v3 - Captions this turn"
        - listitem:
          - paragraph: Reddit Posts marketing connected
          - switch "Use Reddit Posts this turn"
        - listitem:
          - img "Linkedin Search"
          - paragraph: Linkedin Search research connected
          - switch "Use Linkedin Search this turn"
        - listitem:
          - img "US Stock Fundamental Analysis"
          - paragraph: US Stock Fundamental Analysis general connected
          - switch "Use US Stock Fundamental Analysis this turn"
        - listitem:
          - img "US Stock Technical Analysis"
          - paragraph: US Stock Technical Analysis finance connected
          - switch "Use US Stock Technical Analysis this turn"
        - listitem:
          - img "Quarterly financial report data tool"
          - paragraph: Quarterly financial report data tool data suggested
          - switch "Use Quarterly financial report data tool this turn"
        - listitem:
          - paragraph: Abu Dhabi Business RAG general connected
          - switch "Use Abu Dhabi Business RAG this turn"
        - listitem:
          - img "AI Budget Insight Agent"
          - paragraph: AI Budget Insight Agent finance connected
          - switch "Use AI Budget Insight Agent this turn"
        - listitem:
          - img "AI Search"
          - paragraph: AI Search general connected
          - switch "Use AI Search this turn"
        - listitem:
          - paragraph: Air Quality Tool general connected
          - switch "Use Air Quality Tool this turn"
        - listitem:
          - paragraph: Appeal Document Generation Tool data connected
          - switch "Use Appeal Document Generation Tool this turn"
        - listitem:
          - paragraph: Article-Generator marketing connected
          - switch "Use Article-Generator this turn"
        - listitem:
          - paragraph: AskMira finance connected
          - switch "Use AskMira this turn"
        - listitem:
          - paragraph: Billboard Charts general connected
          - switch "Use Billboard Charts this turn"
        - listitem:
          - paragraph: Blender MCP general connected
          - switch "Use Blender MCP this turn"
        - listitem:
          - paragraph: Bnfits Nearby Benefits data connected
          - switch "Use Bnfits Nearby Benefits this turn"
        - listitem:
          - paragraph: copilot-faq-bot general connected
          - switch "Use copilot-faq-bot this turn"
        - listitem:
          - paragraph: copilot-resume-tester general connected
          - switch "Use copilot-resume-tester this turn"
        - listitem:
          - paragraph: Crop Suggestion general connected
          - switch "Use Crop Suggestion this turn"
        - listitem:
          - paragraph: CropHealthGuard general connected
          - switch "Use CropHealthGuard this turn"
        - listitem:
          - paragraph: Crypto Analytics general connected
          - switch "Use Crypto Analytics this turn"
        - listitem:
          - paragraph: Crypto-Description general connected
          - switch "Use Crypto-Description this turn"
        - listitem:
          - paragraph: Currency Converter general connected
          - switch "Use Currency Converter this turn"
        - listitem:
          - paragraph: Digital Dubai Authority research connected
          - switch "Use Digital Dubai Authority this turn"
        - listitem:
          - paragraph: Docu Sign general connected
          - switch "Use Docu Sign this turn"
        - listitem:
          - paragraph: Document Template Tool general connected
          - switch "Use Document Template Tool this turn"
        - listitem:
          - img "Dubai Courts - Legal Research"
          - paragraph: Dubai Courts - Legal Research research connected
          - switch "Use Dubai Courts - Legal Research this turn"
        - listitem:
          - img "Elevan Labs Agent"
          - paragraph: Elevan Labs Agent general connected
          - switch "Use Elevan Labs Agent this turn"
        - listitem:
          - img "Email"
          - paragraph: Email general connected
          - switch "Use Email this turn"
        - listitem:
          - img "Email Memory"
          - paragraph: Email Memory marketing connected
          - switch "Use Email Memory this turn"
        - listitem:
          - img "Emcan Knowledge Base"
          - paragraph: Emcan Knowledge Base general connected
          - switch "Use Emcan Knowledge Base this turn"
        - listitem:
          - paragraph: EmCan Member Data Salesforce data connected
          - switch "Use EmCan Member Data Salesforce this turn"
      - paragraph: Applies to your next question — nothing is substituted if a plugin fails.
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import { test, expect } from "./helpers";
  2   | 
  3   | const QUESTION = "What did Technology Innovation Institute announce recently?";
  4   | const POLL_MS = 250;
  5   | const MAX_MS = 240_000;
  6   | const FIRST_ACTIVITY_MS = 5_000;
  7   | 
  8   | test.describe("Analyst chat — streaming", () => {
  9   |   test.skip(process.env.SKIP_CHAT === "1", "SKIP_CHAT=1");
  10  | 
  11  |   test("answer streams incrementally via SSE with plugin activity and sources", async ({ page }, testInfo) => {
  12  |     test.setTimeout(MAX_MS + 60_000);
  13  |     // Network-level probe: wrap window.fetch for /api/chat BEFORE the app boots. The response is cloned and the clone's body
  14  |     // is read chunk-by-chunk, recording performance.now() (relative to the fetch call) + the chunk text into window.__chunks.
  15  |     // Playwright's page.route cannot observe a streaming body incrementally, hence the in-page wrapper.
  16  |     await page.addInitScript(() => {
  17  |       const w = window as unknown as { __chunks: { t: number; bytes: number; text: string }[]; __chunkMeta: { fetchAt: number; headersAt: number | null; done: boolean; error: string | null } };
  18  |       w.__chunks = [];
  19  |       w.__chunkMeta = { fetchAt: 0, headersAt: null, done: false, error: null };
  20  |       const orig = window.fetch.bind(window);
  21  |       window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  22  |         const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  23  |         if (!/\/api\/chat(\?|$)/.test(url)) return orig(input, init); // the pre-warm GET (/api/chat/prewarm) is not a turn
  24  |         const t0 = performance.now();
  25  |         w.__chunkMeta.fetchAt = t0;
  26  |         const res = await orig(input, init);
  27  |         w.__chunkMeta.headersAt = performance.now() - t0;
  28  |         if (res.body) {
  29  |           const reader = res.clone().body!.getReader();
  30  |           const dec = new TextDecoder();
  31  |           (async () => {
  32  |             try {
  33  |               for (;;) {
  34  |                 const { value, done } = await reader.read();
  35  |                 if (done) break;
  36  |                 w.__chunks.push({ t: performance.now() - t0, bytes: value.byteLength, text: dec.decode(value, { stream: true }) });
  37  |               }
  38  |               w.__chunkMeta.done = true;
  39  |             } catch (e) {
  40  |               w.__chunkMeta.error = String(e);
  41  |             }
  42  |           })();
  43  |         }
  44  |         return res;
  45  |       };
  46  |     });
  47  |     await page.goto("/chat?skip=1");
  48  |     const textarea = page.locator("textarea").first();
  49  |     await expect(textarea).toBeVisible();
> 50  |     await expect(page.locator('img[data-testid="brand-logo"]').first()).toBeAttached();
      |                                                                         ^ Error: expect(locator).toBeAttached() failed
  51  | 
  52  |     const responseP = page.waitForResponse((r) => /\/api\/chat(\?|$)/.test(r.url()) && r.request().method() === "POST", { timeout: 30_000 }); // not the /api/chat/prewarm GET (JSON)
  53  |     await textarea.fill(QUESTION);
  54  |     const t0 = Date.now();
  55  |     await textarea.press("Enter");
  56  | 
  57  |     // 1. transport: the chat route must be a non-cached SSE stream
  58  |     const res = await responseP;
  59  |     expect(res.status(), "chat route status").toBeLessThan(400);
  60  |     const h = res.headers();
  61  |     expect(h["content-type"] ?? "", "content-type").toContain("text/event-stream");
  62  |     expect((h["cache-control"] ?? "").toLowerCase(), "cache-control").toContain("no-cache");
  63  | 
  64  |     // 2. progressive growth of the assistant text, sampled every 250 ms
  65  |     const growth: { t: number; len: number; plugin: boolean }[] = [];
  66  |     let firstActivityAt: number | null = null;
  67  |     let lastLen = 0;
  68  |     // Product change: a Perplexity upstream failure (currently "Not enough credits" on this account) is surfaced as a
  69  |     // `chat-error` banner with data-error-code="plugin_error" while the answer still streams. That is the designed
  70  |     // behaviour, not a transport failure, so it is recorded instead of failing the spec; any other error code still fails.
  71  |     let pluginErrorCode: string | null = null;
  72  |     const submit = page.locator("button[data-testid=composer-send]");
  73  | 
  74  |     const plugin = page.locator('[data-testid="plugin-activity"]');
  75  |     const errBanner = page.locator('[data-testid="chat-error"]');
  76  | 
  77  |     while (Date.now() - t0 < MAX_MS) {
  78  |       // One cheap DOM read per sample (locators auto-wait and re-resolve, which under streaming re-renders made samples ~1 s apart).
  79  |       const { len, hasPlugin, errCount, errCode, label } = await page.evaluate(() => {
  80  |         const a = document.querySelectorAll(".oiu-assistant"); const last = a[a.length - 1] as HTMLElement | undefined;
  81  |         const errEl = document.querySelector<HTMLElement>('[data-testid="chat-error"]');
  82  |         return {
  83  |           len: last ? last.innerText.length : 0,
  84  |           hasPlugin: !!document.querySelector('[data-testid="plugin-activity"]'),
  85  |           errCount: document.querySelectorAll('[data-testid="chat-error"]').length,
  86  |           errCode: errEl?.dataset.errorCode ?? null,
  87  |           label: document.querySelector("button[data-testid=composer-send]")?.getAttribute("aria-label") ?? null,
  88  |         };
  89  |       });
  90  |       const t = Date.now() - t0;
  91  |       if (errCount > 0 && errCode !== "plugin_error") {
  92  |         const msg = await errBanner.first().innerText().catch(() => "");
  93  |         throw new Error(`chat error banner (${errCode}) appeared at +${t}ms: ${msg}`);
  94  |       }
  95  |       if (errCount > 0 && pluginErrorCode === null) {
  96  |         pluginErrorCode = errCode;
  97  |         testInfo.annotations.push({ type: "plugin-error", description: (await errBanner.first().innerText().catch(() => "")).slice(0, 200) });
  98  |       }
  99  |       if (firstActivityAt === null && (hasPlugin || len > 0)) firstActivityAt = t;
  100 |       if (len > lastLen) {
  101 |         growth.push({ t, len, plugin: hasPlugin });
  102 |         lastLen = len;
  103 |       }
  104 |       // The OnDemand research phase (Perplexity) takes 40–80 s before the first token; keep polling while the composer shows Stop.
  105 |       if (lastLen === 0 && label === "Cancel message") { await page.waitForTimeout(POLL_MS); continue; }
  106 |       if (lastLen > 0 && label === "Send message" && t > 1_500) break; // idle again -> stream finished
  107 |       await page.waitForTimeout(POLL_MS);
  108 |     }
  109 | 
  110 |     console.log(`[chat-stream] firstActivityAt=${firstActivityAt}ms growth=${growth.length} events: ${growth.map((g) => `+${g.t}ms:${g.len}`).join(" ")}`);
  111 |     await testInfo.attach("stream-growth-log.json", {
  112 |       body: JSON.stringify({ question: QUESTION, firstActivityAt, growth }, null, 2),
  113 |       contentType: "application/json",
  114 |     });
  115 | 
  116 |     // 3. responsiveness + incrementality
  117 |     expect(firstActivityAt, "first activity (plugin card or text)").not.toBeNull();
  118 |     expect(firstActivityAt!, "first activity within 5 s").toBeLessThanOrEqual(FIRST_ACTIVITY_MS);
  119 |     expect(growth.length, "number of growth events").toBeGreaterThanOrEqual(3);
  120 |     for (let i = 1; i < growth.length; i++) {
  121 |       expect(growth[i].t, `growth[${i}].t > growth[${i - 1}].t`).toBeGreaterThan(growth[i - 1].t);
  122 |       expect(growth[i].len).toBeGreaterThan(growth[i - 1].len);
  123 |     }
  124 | 
  125 |     // 3b. network level: per-chunk timestamps recorded by the injected fetch wrapper
  126 |     const net = await page.evaluate(() => {
  127 |       const w = window as unknown as { __chunks: { t: number; bytes: number; text: string }[]; __chunkMeta: { fetchAt: number; headersAt: number | null; done: boolean; error: string | null } };
  128 |       return { meta: w.__chunkMeta, chunks: w.__chunks.map((c) => ({ t: c.t, bytes: c.bytes })), text: w.__chunks.map((c) => c.text).join("") };
  129 |     });
  130 |     console.log(`[chat-stream] net: headersAt=${net.meta.headersAt?.toFixed(0)}ms chunks=${net.chunks.length} first=${net.chunks[0]?.t.toFixed(0)}ms last=${net.chunks.at(-1)?.t.toFixed(0)}ms done=${net.meta.done} err=${net.meta.error}`);
  131 |     await testInfo.attach("stream-chunks.json", {
  132 |       body: JSON.stringify({ meta: net.meta, chunks: net.chunks, frameTypes: [...net.text.matchAll(/"type":"([A-Z_]+)"/g)].map((m) => m[1]) }, null, 2),
  133 |       contentType: "application/json",
  134 |     });
  135 |     expect(net.meta.error, "fetch wrapper read error").toBeNull();
  136 |     expect(net.chunks.length, "network chunks received").toBeGreaterThanOrEqual(3);
  137 |     expect(net.chunks[0].t, "first network chunk < 5000 ms after fetch()").toBeLessThan(5_000);
  138 |     for (let i = 1; i < net.chunks.length; i++) {
  139 |       expect(net.chunks[i].t, `chunk[${i}].t >= chunk[${i - 1}].t`).toBeGreaterThanOrEqual(net.chunks[i - 1].t); // two reader.read() resolutions can share a ms tick
  140 |     }
  141 |     const toolArgsFrame = net.text.split("\n").find((l) => l.includes('"type":"TOOL_CALL_ARGS"')) ?? "";
  142 |     expect(toolArgsFrame, "TOOL_CALL_ARGS frame present").not.toBe("");
  143 |     // the delta is a JSON string embedded in JSON, so the inner quotes are escaped on the wire
  144 |     expect(toolArgsFrame.replace(/\\"/g, '"'), 'TOOL_CALL_ARGS carries "query":"What did Fervo').toContain('"query":"What did Fervo');
  145 | 
  146 |     // 4. plugin activity card surfaced the tool call
  147 |     await expect(plugin.first()).toBeAttached();
  148 |     await expect(plugin.first()).toContainText(/Perplexity/i);
  149 |     await expect(plugin.first()).toContainText(/Fervo/i);
  150 | 
```