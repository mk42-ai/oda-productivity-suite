'use client';
/**
 * Reputation quick-chat — the Rilian "ASK · OnDemand" dock (src/views/chat/OndemandAskPanel.tsx) re-mounted for the four
 * reputation subjects. Same data path: subject (≤ 3 KB on-screen context from the ported buildNodeContext / buildEdgeContext) →
 * assembleAskPrompt (ASK_FULFILLMENT_PROMPT, contextMetadata, pluginIds) → ask() (one attempt + ONE fallback, 45 s per attempt,
 * SSE passthrough) through the server-side route /api/reputation/ondemand. Prompt preview, preset chips, transcript with
 * model / elapsed / tokens / fallback meta and the verbatim HTTP error body are the Rilian behaviours, unchanged.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ChevronDown, ChevronRight, Copy, Eraser, Loader2, Square } from 'lucide-react';
import { ask, describeHttpError, httpErrorDetail, investigationSessionStore } from '@/lib/reputation/ondemand/client';
import { ASK_PLUGIN_IDS, assembleAskPrompt, nextTranscriptId, transcriptTailKey, useAskDock, type TranscriptItem } from '@/lib/reputation/ondemand/askDock';
import { DEFAULT_CHAT_MODEL_ID, chatModelLabel, CHAT_MODELS } from '@/lib/reputation/ondemand/chatModels';
import { STANDING_RULE, utf8Bytes } from '@/lib/reputation/ondemand/context';
import { Badge, cx } from './rilian-ui';

const COMPOSER_MAX_CHARS = 2000;
const fmtMs = (ms: number | null | undefined): string => (ms == null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

function ReplyMeta({ item }: { item: TranscriptItem }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-secondary" data-testid="ask-meta">
      {item.endpointId && <span className="mono" data-testid="ask-meta-model">{chatModelLabel(item.endpointId)}</span>}
      {item.status === 'streaming' && <Loader2 className="h-3 w-3 animate-spin" aria-label="streaming" data-testid="ask-spinner" />}
      <span className="mono" data-testid="ask-elapsed">{fmtMs(item.elapsedMs)}</span>
      {item.tokens != null && <span className="mono">{item.tokens} tok</span>}
      {item.fallbackFrom && <span data-testid="ask-meta-fallback">fallback from {chatModelLabel(item.fallbackFrom)} · {item.fallbackReason}</span>}
    </div>
  );
}

function PromptCard({ item }: { item: TranscriptItem }) {
  const [open, setOpen] = useState(false);
  if (!item.prompt) return null;
  return (
    <div className="mt-1">
      <button type="button" className="inline-flex items-center gap-1 text-[11px] text-secondary hover:text-ink" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-testid="ask-reply-view-prompt">
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} full prompt as sent · {item.prompt.queryBytes} B
      </button>
      {open && <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-hairline bg-surface-2 p-2 text-[11px]" data-testid="ask-reply-prompt-card">{item.prompt.text}</pre>}
    </div>
  );
}

export function ReputationAskPanel({ externalUserId = 'bcapital-reputation' }: { externalUserId?: string }) {
  const subject = useAskDock((s) => s.subject);
  const draft = useAskDock((s) => s.draft);
  const setDraft = useAskDock((s) => s.setDraft);
  const transcript = useAskDock((s) => s.transcript);
  const append = useAskDock((s) => s.append);
  const patch = useAskDock((s) => s.patch);
  const clearTranscript = useAskDock((s) => s.clearTranscript);
  const [endpointId, setEndpointId] = useState<string>(DEFAULT_CHAT_MODEL_ID);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const tailKey = transcriptTailKey(transcript);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [tailKey]);
  const preview = useMemo(() => assembleAskPrompt(subject, draft, endpointId, 0.2, { scope: subject ? 'subject' : 'dataset', investigationId: externalUserId }), [subject, draft, endpointId, externalUserId]);
  const presets = subject?.presets ?? [];
  const canSend = !!subject && draft.trim().length > 0 && !busy;

  async function send(question: string) {
    if (!subject || busy) return;
    const q = question.trim();
    if (!q) return;
    const assembled = assembleAskPrompt(subject, q, endpointId, 0.2, { scope: 'subject' });
    const promptId = nextTranscriptId('p');
    const replyId = nextTranscriptId('r');
    append({ id: promptId, kind: 'ask', role: 'prompt', ts: new Date().toISOString(), text: q, prompt: assembled, subjectTitle: subject.title, endpointId });
    append({ id: replyId, kind: 'ask', role: 'reply', ts: new Date().toISOString(), text: '', endpointId, status: 'streaming', elapsedMs: null, tokens: null });
    setDraft('');
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t0 = performance.now();
    try {
      const r = await ask({
        investigationId: subject.investigationId,
        endpointId,
        query: assembled.query,
        fulfillmentPrompt: assembled.fulfillmentPrompt,
        temperature: assembled.temperature,
        contextMetadata: assembled.contextMetadata,
        pluginIds: [...ASK_PLUGIN_IDS],
        sessionStore: investigationSessionStore(`${externalUserId}:${subject.investigationId}`),
        signal: ctrl.signal,
        onFallback: (info) => patch(replyId, { endpointId: info.to, fallbackFrom: info.from, fallbackReason: info.reason }),
        onChunk: (_t, answerSoFar) => patch(replyId, { text: answerSoFar, elapsedMs: Math.round(performance.now() - t0) }),
      });
      patch(replyId, { text: r.answer, status: 'done', elapsedMs: r.elapsedMs, tokens: r.metrics?.totalTokens ?? r.metrics?.total_tokens ?? null, sessionId: r.sessionId, endpointId: r.endpointId, fallbackFrom: r.fallbackFrom, fallbackReason: r.fallbackReason });
    } catch (err) {
      const d = httpErrorDetail(err);
      patch(replyId, { status: 'error', error: describeHttpError(err), errorStatus: d?.status ?? null, errorBody: d?.body ?? null, elapsedMs: Math.round(performance.now() - t0) });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <section className="card flex min-h-[420px] flex-col" data-testid="ondemand-ask-panel" aria-label="Quick chat · OnDemand">
      <header className="flex flex-wrap items-center gap-2 border-b border-hairline px-3 py-2">
        <span className="text-[12px] font-semibold text-ink">ASK · OnDemand</span>
        <Badge pattern="dashed" className="badge-unproven" title={STANDING_RULE}>CORRELATION ONLY</Badge>
        <label className="ml-auto flex items-center gap-1 text-[11px] text-secondary">
          model
          <select className="input !w-auto !min-h-[24px] !py-0" value={endpointId} onChange={(e) => setEndpointId(e.target.value)} data-testid="ask-model-select" aria-label="Model">
            {CHAT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}{m.role === 'fallback' ? ' (fallback)' : ''}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn !h-6 !px-2 text-[11px]" onClick={clearTranscript} disabled={!transcript.length} title="Clear transcript"><Eraser className="h-3 w-3" /> clear</button>
      </header>
      <div ref={listRef} className="flex-1 overflow-auto px-3 py-2" data-testid="ask-transcript">
        {!transcript.length && (
          <p className="text-[12px] text-secondary" data-testid="ask-empty">
            {subject ? <>Ask about <span className="font-medium text-ink">{subject.title}</span> — pick a starter prompt or type a question. The full prompt is previewed before anything is sent.</> : 'Select an entity card (or a correlation edge) to load its on-screen context here.'}
          </p>
        )}
        {transcript.map((t) => (
          <div key={t.id} className={cx('mb-3', t.role === 'prompt' ? 'text-right' : '')} data-testid={t.role === 'prompt' ? 'ask-turn-prompt' : 'ask-turn-reply'}>
            {t.role === 'prompt' ? (
              <div className="inline-block max-w-[92%] rounded-xl bg-fill-2 px-3 py-2 text-left text-[12px] text-ink">
                {t.subjectTitle && <div className="label-xs mb-0.5">{t.subjectTitle}</div>}
                {t.text}
                <PromptCard item={t} />
              </div>
            ) : (
              <div className="max-w-[96%] rounded-xl border border-hairline bg-surface px-3 py-2 text-[12px] text-ink">
                {t.status === 'error' ? (
                  <div data-testid="ask-error">
                    <div className="rep-risk font-medium">{t.error}</div>
                    {t.errorBody && <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-[11px] text-secondary" data-testid="ask-error-body">{t.errorBody}</pre>}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap" data-testid="ask-answer-text">{t.text || (t.status === 'streaming' ? '…' : '')}</div>
                )}
                <ReplyMeta item={t} />
                {t.text && (
                  <button type="button" className="mt-1 inline-flex items-center gap-1 text-[11px] text-secondary hover:text-ink" onClick={() => void navigator.clipboard?.writeText(t.text)} title="Copy answer"><Copy className="h-3 w-3" /> copy</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-hairline px-3 py-2" data-testid="ask-bottom">
        <div className="mb-1 flex items-center gap-2 text-[11px] text-secondary" data-testid="ask-context-row">
          <span className="label-xs">subject</span>
          <span className="truncate font-medium text-ink" data-testid="ask-subject">{subject?.title ?? 'none yet — click an entity card'}</span>
          {subject && <span className="mono ml-auto">ctx {utf8Bytes(subject.context)} B</span>}
        </div>
        {!!presets.length && (
          <div className="mb-2 flex flex-wrap gap-1" data-testid="ask-presets">
            {presets.map((p) => (
              <button key={p.id} type="button" className="chip" disabled={busy} onClick={() => void send(p.question)} data-testid="ask-preset">{p.label}</button>
            ))}
          </div>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <textarea className="input min-h-[44px] flex-1 resize-y" rows={2} maxLength={COMPOSER_MAX_CHARS} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={subject?.placeholder ?? 'quick query on this entity…'} aria-label="Quick query" data-testid="ask-input" disabled={!subject} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(draft); } }} />
          {busy ? (
            <button type="button" className="btn" onClick={() => abortRef.current?.abort()} title="Stop" data-testid="ask-stop"><Square className="h-3 w-3" /> stop</button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!canSend} title="Send" data-testid="ask-send"><ArrowUp className="h-3 w-3" /> send</button>
          )}
        </form>
        <button type="button" className="mt-2 inline-flex items-center gap-1 text-[11px] text-secondary hover:text-ink" onClick={() => setPreviewOpen((o) => !o)} aria-expanded={previewOpen} data-testid="ask-preview-toggle">
          {previewOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} Prompt preview · {preview.queryBytes} B · responseMode stream · pluginIds {ASK_PLUGIN_IDS.length}
        </button>
        {previewOpen && <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-hairline bg-surface-2 p-2 text-[11px]" data-testid="ask-prompt-preview">{preview.text}</pre>}
      </div>
    </section>
  );
}
