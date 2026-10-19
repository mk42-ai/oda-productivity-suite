# PitchBook Investor Finder — exact OnDemand payload

_Reverse-engineered from `src/pitchbook.ts`, `web/src/lib/ondemand/config-public.ts`, `web/src/components/chat/open-intelligent-ui/context-chips.ts`, `web/src/data/plugin-directory.json` and `proof/pitchbook/discovery.json`, then re-verified live on 2026-10-12 (session `6acc537521ae4e9e6997c14e`, message `6acc537593f7b118ad0288c0`, HTTP 200)._

## 1. Plugin identity

| Field | Value | Where it comes from |
|---|---|---|
| Plugin ID | `plugin-1777018662` | `PITCHBOOK_PLUGIN_ID` in `src/pitchbook.ts` and `web/src/lib/ondemand/config-public.ts` |
| Agent ID | `agent-1777018662` | `PITCHBOOK_AGENT_ID` in `src/pitchbook.ts` |
| Name | `Pitchbook Investor Finder` | `plugin-directory.json` (identifier `rest_api`, category `data_and_analytics`, type `chat`, source `external`, `isSubscribed: true`) |
| Operation | `searchInvestors` (the only one) | `proof/pitchbook/discovery.json` |
| Auth | NONE on our side — the PitchBook token is held server-side by the OnDemand account | discovery.json |
| Companion plugins in chat | `plugin-1722260873` (Perplexity, always pinned first) · `plugin-1791713636` (Portfolio Plugin, first for portfolio questions) | `resolvePluginIds()` in config-public.ts |

There is **no company-profile operation**: a company-profile query makes the planner skip the plugin (session `6aca396cf7979c7d562af497`). Only an investor *brief* invokes it.

## 2. Transport (OnDemand Chat API)

All calls are server-side with header `apikey: <ONDEMAND_API_KEY>` (never `NEXT_PUBLIC_*`) and a browser-like `user-agent` (Cloudflare 1010 bans the default Node UA).

### 2a. Create session
```http
POST https://api.on-demand.io/chat/v1/sessions
apikey: <ONDEMAND_API_KEY>
content-type: application/json

{
  "externalUserId": "pitchbook-bot",
  "pluginIds": ["plugin-1777018662"],
  "contextMetadata": [{ "key": "purpose", "value": "pitchbook-investor-finder" }]
}
```
→ `data.id` = sessionId

### 2b. Submit query
```http
POST https://api.on-demand.io/chat/v1/sessions/{sessionId}/query
apikey: <ONDEMAND_API_KEY>
accept: text/event-stream

{
  "query": "<brief — see §3>",
  "endpointId": "predefined-deepseek-flash",
  "responseMode": "stream",            // "sync" also works (used for the B Capital portfolio query)
  "pluginIds": ["plugin-1777018662"],
  "reasoningMode": "medium",
  "modelConfigs": { "temperature": 0.1 }
}
```

### 2c. In-chat variant (composer PitchBook chips)
`web/src/components/chat/open-intelligent-ui/chat-shell.tsx` adds `plugin-1777018662` to the turn's `pluginIds` **only for the turn that carries PitchBook context chips**, and prepends `chipsBlock(chips)` (one `Context: <company> · <field>: <value> (source …)` line per chip) to the user text. The thread and session are reused — no new chat is created. The browser sends `x-ondemand-key` only when the user supplied a personal key; otherwise `/api/chat` uses the server `ONDEMAND_API_KEY`.

## 3. Request fields — the investor brief (`buildInvestorBrief()`)

The plugin reads a plain-text brief with these exact labels, one per line:

| Label | Type | Built from |
|---|---|---|
| `Stage:` | text | `stageFrom(company.stage \| last round)` → Seed / Series A / B / C / Growth / Public |
| `Raise Size (USD):` | range text | last-round amount × 0.8–1.5, else a stage default (`$50-150M`) |
| `Investor types:` | CSV | sector hint table (`SECTOR_HINTS`) |
| `Target geographies:` | text | `region` → HQ country → `Global` |
| `Ticket size range:` | range text | B Capital ticket estimate × 0.5–2 |
| `Industry / verticals:` | CSV | sector hint table |
| `What the company does:` | text | `<name> — <description>; based in <hq>; sector: <sector>` |

The fetcher appends: _"Use the PitchBook investor finder (searchInvestors) with this brief and list every matched investor as a numbered markdown block …"_.

**B Capital portfolio query used this run (2026-10-12):**
```text
Stage: Growth / Late Stage
Raise Size (USD): $50-500M
Investor types: Venture Capital, Growth Equity
Target geographies: North America, Asia, Europe
Ticket size range: $10-100M
Industry / verticals: Software, AI/ML, Fintech, HealthTech, Climate Tech
What the company does: Find the investor "B Capital" (B Capital Group, Los Angeles; co-founded by Eduardo Saverin and Raj Ganguly). Return its full PitchBook investor profile …
```

## 4. Response schema

The plugin answers as **markdown inside the `fulfillment` stream** (`eventType: "fulfillment"`, `answer` deltas). Invocation is proven by `step_output` frames containing `"pluginId": "plugin-1777018662"`. Terminal frame `data:[DONE]`; errors `data:[ERROR]:{…}`.

### 4a. Investor search answer → `PitchbookInvestor[]` (`parseInvestorAnswer()`)
```text
1. **Name** — City, ST (Type) — *Status: X*
- AUM: $12,000M | Dry powder: $1,839.8M
- Founded 2015
- Investment range: $10M–$50M | Deal types: Early Stage VC, Later Stage VC
- Industries: … | Verticals: … | Geographies: … | Preferences: …
- Website: b.capital
```
```ts
type PitchbookInvestor = {
  name: string; website: string|null; location: string|null; year_founded: number|null; status: string|null; type: string|null;
  aum_musd: number|null; dry_powder_musd: number|null; team_size: number|null; investment_range: string|null;
  deal_types: string[]; industries: string[]; verticals: string[]; geographies: string[]; preferences: string[];
}
```
`parseTotalReported()` reads "N total results".

### 4b. Stored record (`PitchbookRecord`, backend `GET /pitchbook/{slug}`)
```ts
{ slug, overview: Sourced|null, last_round: Sourced|null, valuation_history: Sourced[],
  investors: { matched: PitchbookInvestor[], brief: string, total_reported: number|null },
  financials: Sourced|null, comparables: Sourced[],
  provenance: { plugin_id: "plugin-1777018662", session_id, fetched_at, source: "pitchbook-investor-finder", note?, plugin_calls?, errors? },
  availability: { overview|last_round|valuation_history|financials|comparables|investors: "VERIFIED"|"NOT_AVAILABLE_FROM_PLUGIN"|"FROM_ENRICHMENT" } }
// Sourced = { value, source_url, published_date, fetched_at, plugin_id }
```
Only `investors` is `VERIFIED`. `overview` and `last_round` can be back-filled `FROM_ENRICHMENT` and are never labelled PitchBook.

### 4c. Investor-profile answer (B Capital query, live 2026-10-12)
The investor-profile prompt returned these sections: Profile (legal name, HQ, team size 55, founded 2015), Financials (AUM $12,000M, dry powder $1,839.8M, 18 closed / 2 open funds), Preferences (investment range $10–50M, deal types, verticals), Offices (HQ + 7), Funds (20), **Recent Investment Activity** (260 active / 337 total; a markdown table `| Company | Investment Date | Investor Since |`, 50 rows shown), Former investments, Recent deals, Board seats, Service providers. `scripts/…`/merge parses that table into `portfolio.json → companies[].pitchbook = {investment_date, investor_since, source, session_id}`. That matched **39** of 136 roster companies by name. The rest are `null`, because the plugin listed only 50 of 260 active rows.

## 5. Daily refresh
OnDemand workflow `bcap-social-daily-chatbatch-refresh` (cron `0 0 6 * * *`, created and activated 2026-10-12) chains two chat-batch LLM nodes: Perplexity + Reddit, then PitchBook Investor Finder `plugin-1777018662`, with email delivery.
