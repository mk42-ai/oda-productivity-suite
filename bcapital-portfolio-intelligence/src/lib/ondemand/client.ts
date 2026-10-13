/**
 * Thin typed OnDemand client — built ONLY from the live public docs fetched on 2026-10-13
 * (GET https://api.on-demand.io/config/v1/public/docs/reference/api/{createchatsession,submitquery,getchatmessages,getchatsession}
 *  + https://docs.on-demand.io/reference/{rate-limits,how-to-paginate,errors}.md). See docs/ondemand-api-contract.md.
 *
 * Documented surface used here (host from the spec's servers[].url = https://api.on-demand.io, auth = `apikey` header):
 *   POST /chat/v1/sessions                       body {externalUserId (req), pluginIds?[≤20]}           → 201 {message, data: ChatSession{id,…}}
 *   POST /chat/v1/sessions/{sessionId}/query     body {query, endpointId, responseMode: sync|stream|webhook, pluginIds?, fulfillmentOnly?, modelConfigs?}
 *                                                 → 200 {message, data:{sessionId, messageId, answer, status: processing|completed|failed, metrics}}
 *   GET  /chat/v1/sessions/{sessionId}/messages  query externalUserId?, sort?, cursor?, limit?           → {message, data: ChatMessage[], pagination}
 *   GET  /chat/v1/sessions/{sessionId}/messages/{messageId}                                               → {message, data: ChatMessage}
 *   GET  /chat/v1/batches  (exists on the host, returns {message:"Chat batches fetched successfully", data:[], pagination:{next,limit}});
 *        POST /chat/v1/batches currently answers 405 {"errorCode":"method_not_allowed","message":"Chat batch creation is currently unavailable"}
 *        and the Chat Batches operations are NOT in the public docs categories index — so this client exposes listChatBatches() for
 *        detection only and runs batches as bounded-concurrency sets of documented single queries (see src/pitchbook-batch.ts).
 * Errors: 4xx/5xx bodies are {errorCode, message} (ClientErrorResponse / ServerErrorResponse). Rate limit: 10,000 req/min per origin IP
 * (reference/rate-limits); RAG calls 100/min (docs/rate-limiting) — the batch runner stays far below both.
 */
export type OdConfig = { baseUrl?: string; apiKey: string; userAgent?: string };
export type OdError = { errorCode: string; message: string };
export type ChatSession = { id: string; companyId?: string; externalUserId: string; pluginIds?: string[]; agentIds?: string[]; status?: string; createdAt?: string };
export type QueryStatus = "processing" | "completed" | "failed";
export type QueryMetrics = { inputTokens?: number; outputTokens?: number; totalTokens?: number; ragTimeSec?: number; fulfillmentTimeSec?: number; totalTimeSec?: number };
export type SubmitQueryResult = { sessionId: string; messageId: string; answer: string; status: QueryStatus; metrics?: QueryMetrics };
export type ChatMessage = { id: string; sessionId: string; query: string; answer: string; status: QueryStatus; endpointId?: string; pluginIds?: string[]; createdAt?: string; updatedAt?: string; publicMetrics?: QueryMetrics };
export type Pagination = { next?: string; limit?: number };
export type ModelConfigs = { fulfillmentPrompt?: string; stopSequences?: string[]; temperature?: number; topP?: number; presencePenalty?: number; frequencyPenalty?: number };
export type SubmitQueryBody = { query: string; endpointId: string; responseMode: "sync" | "stream" | "webhook"; pluginIds?: string[]; fulfillmentOnly?: boolean; modelConfigs?: ModelConfigs };

export class OnDemandHttpError extends Error {
  constructor(public status: number, public body: OdError | string, public path: string) { super(`OnDemand ${path} → HTTP ${status}: ${typeof body === "string" ? body.slice(0, 200) : `${body.errorCode}: ${body.message}`}`); }
}

export class OnDemandClient {
  private base: string; private key: string; private ua: string;
  constructor(cfg: OdConfig) { this.base = (cfg.baseUrl || "https://api.on-demand.io").replace(/\/$/, ""); this.key = cfg.apiKey; this.ua = cfg.userAgent || "bcapital-portfolio-intelligence/pitchbook-batch"; }
  private headers(extra: Record<string, string> = {}) { return { apikey: this.key, "content-type": "application/json", "user-agent": this.ua, ...extra }; }
  private async call<T>(method: string, path: string, body?: unknown, timeoutMs = 60_000): Promise<{ status: number; json: T }> {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(`${this.base}${path}`, { method, headers: this.headers(), body: body === undefined ? undefined : JSON.stringify(body), signal: ctl.signal });
      const text = await r.text(); let json: any = null; try { json = JSON.parse(text); } catch { json = text; }
      if (!r.ok) throw new OnDemandHttpError(r.status, json && typeof json === "object" ? json : String(text), path);
      return { status: r.status, json };
    } finally { clearTimeout(t); }
  }
  /** POST /chat/v1/sessions (documented: createchatsession). */
  async createSession(externalUserId: string, pluginIds: string[] = []): Promise<ChatSession> {
    const { json } = await this.call<{ message: string; data: ChatSession }>("POST", "/chat/v1/sessions", { externalUserId, pluginIds }); return json.data;
  }
  /** POST /chat/v1/sessions/{sessionId}/query with responseMode "sync" (documented: submitquery). */
  async submitQuerySync(sessionId: string, body: Omit<SubmitQueryBody, "responseMode">, timeoutMs = 240_000): Promise<SubmitQueryResult> {
    const { json } = await this.call<{ message: string; data: SubmitQueryResult }>("POST", `/chat/v1/sessions/${encodeURIComponent(sessionId)}/query`, { ...body, responseMode: "sync" }, timeoutMs); return json.data;
  }
  /** GET /chat/v1/sessions/{sessionId}/messages/{messageId} (documented: getchatmessage). */
  async getMessage(sessionId: string, messageId: string): Promise<ChatMessage> {
    const { json } = await this.call<{ message: string; data: ChatMessage }>("GET", `/chat/v1/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}`); return json.data;
  }
  /** GET /chat/v1/sessions/{sessionId}/messages — cursor pagination (documented: getchatmessages). */
  async listMessages(sessionId: string, q: { externalUserId?: string; sort?: string; cursor?: string; limit?: number } = {}): Promise<{ data: ChatMessage[]; pagination?: Pagination }> {
    const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();
    const { json } = await this.call<{ message: string; data: ChatMessage[]; pagination?: Pagination }>("GET", `/chat/v1/sessions/${encodeURIComponent(sessionId)}/messages${qs ? `?${qs}` : ""}`); return { data: json.data, pagination: json.pagination };
  }
  /** GET /chat/v1/batches — undocumented in the public categories index; used only to detect whether server-side batches are available. */
  async listChatBatches(limit = 10): Promise<{ status: number; data: unknown[]; pagination?: Pagination } | { status: number; error: OdError | string }> {
    try { const { status, json } = await this.call<{ message: string; data: unknown[]; pagination?: Pagination }>("GET", `/chat/v1/batches?limit=${limit}`); return { status, data: json.data ?? [], pagination: json.pagination }; }
    catch (e) { if (e instanceof OnDemandHttpError) return { status: e.status, error: e.body }; throw e; }
  }
  /** POST /chat/v1/batches probe — returns the server's answer (currently 405 method_not_allowed "Chat batch creation is currently unavailable"). */
  async probeCreateChatBatch(): Promise<{ status: number; body: unknown }> {
    try { const { status, json } = await this.call<unknown>("POST", "/chat/v1/batches", {}); return { status, body: json }; }
    catch (e) { if (e instanceof OnDemandHttpError) return { status: e.status, body: e.body }; throw e; }
  }
}
export const odFromEnv = () => new OnDemandClient({ baseUrl: process.env.ONDEMAND_BASE_URL, apiKey: process.env.ONDEMAND_API_KEY || "" });
