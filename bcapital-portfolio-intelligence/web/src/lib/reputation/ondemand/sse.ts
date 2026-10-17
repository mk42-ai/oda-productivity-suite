/**
 * OnDemand SSE parser (pure, testable) — the stream format documented on docs.on-demand.io/docs/query-and-responses-modes
 * and captured in ONDEMAND_INTEGRATION_CONTRACT v1 (2026-09-13):
 *
 *   event:message            data:{ sessionId, messageId, eventType: 'statusLog' | 'fulfillment' | 'metricsLog', eventIndex, … }
 *   event:heartbeat          data:{ sessionId, messageId, time }             → ignore
 *   event:message            data:[DONE]                                    → terminal
 *   event:message            data:[ERROR]:{ message, errorCode }            → terminal error
 *
 * `eventIndex` starts at 1 per eventType and may arrive out of order — fulfillment chunks are re-assembled by index.
 * The parser is tolerant: no space after the colon (as in the docs), CRLF, multi-line data, comments (`: …`).
 */
export type SseEvent =
  | { kind: 'status'; eventIndex: number; statusType: string; statusMessage: string; raw: Record<string, unknown> }
  | { kind: 'chunk'; eventIndex: number; answer: string; sessionId: string | null; messageId: string | null }
  | { kind: 'metrics'; eventIndex: number; publicMetrics: Record<string, number> }
  | { kind: 'heartbeat'; time: string | null }
  | { kind: 'thinking'; raw: string }
  | { kind: 'done' }
  | { kind: 'error'; message: string; errorCode: string }
  | { kind: 'unknown'; event: string; raw: string };

interface SseFrame {
  event: string;
  data: string;
}

/** Split raw text into complete frames; returns the unconsumed tail. */
export function splitFrames(buffer: string): { frames: SseFrame[]; rest: string } {
  const normalised = buffer.replace(/\r\n/g, '\n');
  const frames: SseFrame[] = [];
  let rest = normalised;
  let sep: number;
  while ((sep = rest.indexOf('\n\n')) >= 0) {
    const block = rest.slice(0, sep);
    rest = rest.slice(sep + 2);
    const frame = parseFrame(block);
    if (frame) frames.push(frame);
  }
  return { frames, rest };
}

/** One SSE block (lines without the blank terminator) → {event, data} or null for comment-only blocks. */
export function parseFrame(block: string): SseFrame | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }
  if (!data.length) return null;
  return { event, data: data.join('\n') };
}

/** Interpret a frame according to the OnDemand contract. */
export function interpretFrame(frame: SseFrame): SseEvent {
  const { event, data } = frame;
  if (event === 'heartbeat') {
    try {
      const d = JSON.parse(data) as { time?: string };
      return { kind: 'heartbeat', time: d.time ?? null };
    } catch {
      return { kind: 'heartbeat', time: null };
    }
  }
  if (data === '[DONE]') return { kind: 'done' };
  if (data.startsWith('[ERROR]:')) {
    const payload = data.slice(8).trim();
    try {
      const e = JSON.parse(payload) as { message?: string; errorCode?: string };
      return { kind: 'error', message: e.message ?? payload, errorCode: e.errorCode ?? 'stream_error' };
    } catch {
      return { kind: 'error', message: payload, errorCode: 'stream_error' };
    }
  }
  if (event === 'thinking') return { kind: 'thinking', raw: data };
  if (event !== 'message') return { kind: 'unknown', event, raw: data };
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(data) as Record<string, unknown>;
  } catch {
    return { kind: 'unknown', event, raw: data };
  }
  const eventIndex = typeof d.eventIndex === 'number' ? d.eventIndex : 0;
  switch (d.eventType) {
    case 'fulfillment':
      return { kind: 'chunk', eventIndex, answer: typeof d.answer === 'string' ? d.answer : '', sessionId: typeof d.sessionId === 'string' ? d.sessionId : null, messageId: typeof d.messageId === 'string' ? d.messageId : null };
    case 'statusLog': {
      const log = (d.currentStatusLog ?? {}) as { statusType?: string; statusMessage?: string };
      return { kind: 'status', eventIndex, statusType: log.statusType ?? '', statusMessage: log.statusMessage ?? '', raw: d };
    }
    case 'metricsLog':
      return { kind: 'metrics', eventIndex, publicMetrics: (d.publicMetrics ?? {}) as Record<string, number> };
    default:
      return { kind: 'unknown', event, raw: data };
  }
}

/** Async iterator over the interpreted events of a fetch Response body. */
export async function* iterateSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { frames, rest } = splitFrames(buffer);
      buffer = rest;
      for (const f of frames) {
        const ev = interpretFrame(f);
        yield ev;
        if (ev.kind === 'done' || ev.kind === 'error') return;
      }
    }
    const { frames } = splitFrames(buffer + '\n\n');
    for (const f of frames) yield interpretFrame(f);
  } finally {
    reader.releaseLock();
  }
}

/** Order-safe accumulator for fulfillment chunks (eventIndex ascending). */
export class AnswerAssembler {
  private chunks = new Map<number, string>();
  private fallback = 0;
  add(ev: Extract<SseEvent, { kind: 'chunk' }>): void {
    const idx = ev.eventIndex > 0 ? ev.eventIndex : ++this.fallback + 1_000_000;
    this.chunks.set(idx, ev.answer);
  }
  get text(): string {
    return Array.from(this.chunks.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, t]) => t)
      .join('');
  }
  get count(): number {
    return this.chunks.size;
  }
}
