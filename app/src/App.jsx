import React, { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Composer from './components/Composer.jsx';
import PreviewPane from './components/PreviewPane.jsx';
import { AssistantMessage, UserMessage } from './components/Messages.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { jget, jpost, streamChat, normalizeError } from './api.js';
import { dissect } from './markdown.jsx';
import { t, isRTL } from './i18n.js';

// Debug mode: append ?debug=1 to the URL (or set localStorage.odaDebug='1').
// In debug mode, error toasts show the errorCode + full debugDetails.
const DEBUG_INITIAL = (typeof window !== 'undefined') &&
  (new URLSearchParams(window.location.search).has('debug') || window.localStorage?.getItem('odaDebug') === '1');

const CHIPS = [
  { label: 'Summarise this deck', feature: 'summary', text: 'Summarise the attached deck into a five-zone executive one-pager.' },
  { label: 'Benchmark cash-transfer programmes', feature: 'benchmark', text: 'Benchmark cash-transfer programmes in developing countries — what has worked elsewhere and what should the UAE take from it?' },
  { label: 'Translate for the Chairman', feature: 'translate', text: 'Translate the following note into Emirati-register Arabic suitable for the Chairman: ' },
  { label: 'Build a briefing deck', feature: 'design', text: 'Build a 6-page ODA briefing deck on our development partnership priorities for 2026.', wizard: true },
  { label: 'Fast facts on Kenya', feature: 'country-data', text: 'Fast facts on Kenya — population, GDP, life expectancy, poverty, with sources.' },
  { label: 'Draft a WAM press release', feature: 'media', text: 'Draft a bilingual WAM-style press release announcing a new ODA health partnership in East Africa.' },
  { label: 'Title these slides', feature: 'action-titles', text: 'Give me 3 ranked action titles for this slide: ' },
  { label: 'Structure a problem', feature: 'problem-solve', text: 'What should we do about slow disbursement of our development commitments?' },
];

const WIZARD_FEATURES = new Set(['design', 'summary', 'media']);

export default function App() {
  const [convs, setConvs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);        // {message, retry}
  const [offline, setOffline] = useState(false);
  const [pendingTool, setPendingTool] = useState(null); // feature key selected from sidebar
  const [wizard, setWizard] = useState({ active: false, step: 0 });
  const [artifacts, setArtifacts] = useState({});
  const [exportBusy, setExportBusy] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [sidebarOpen] = useState(false);
  // STEP 2: Standard vs Debug display mode — toggleable in the UI, persisted.
  const [DEBUG, setDebug] = useState(DEBUG_INITIAL);
  const toggleDebug = () => {
    setDebug(d => {
      const next = !d;
      try { window.localStorage.setItem('odaDebug', next ? '1' : '0'); } catch { /* private mode */ }
      return next;
    });
  };

  const streamRef = useRef(null);
  const draftRef = useRef(null);   // keeps the in-flight user text so an error never loses it
  const liveMsgRef = useRef(null);

  /* ---------- data loading ---------- */
  const refreshConvs = useCallback(async () => {
    try { setConvs((await jget('/api/conversations')).conversations); } catch { /* non-fatal */ }
  }, []);
  useEffect(() => { refreshConvs(); }, [refreshConvs]);

  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const loadConversation = async (id) => {
    try {
      const { conversation } = await jget(`/api/conversations/${id}`);
      setActiveId(id);
      setMessages(conversation.messages.map(m => ({ ...m, live: false })));
      setWizard({ active: false, step: 0 });
    } catch (e) { setToast({ message: e.message }); }
  };

  const newChat = async (feature = 'chat', opts = {}) => {
    try {
      const { conversation } = await jpost('/api/conversations', { feature });
      setActiveId(conversation.id);
      setMessages([]);
      setArtifacts({});
      setPendingTool(feature !== 'chat' ? feature : null);
      setWizard(opts.wizard ? { active: true, step: 0 } : { active: false, step: 0 });
      await refreshConvs();
      return conversation.id;
    } catch (e) { setToast({ message: e.message }); return null; }
  };

  /* ---------- autoscroll ---------- */
  const onScroll = (e) => {
    const el = e.target;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  };
  useEffect(() => {
    if (atBottom && streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages, atBottom]);

  /* ---------- send ---------- */
  const send = async (text, fileId = null, fileName = null, extra = {}) => {
    let convId = activeId;
    if (!convId) convId = await newChat(pendingTool || 'chat');
    if (!convId) return;

    draftRef.current = { text, fileId, fileName, extra };
    const userMsg = { id: `u-${Date.now()}`, role: 'user', text, fileName };
    const liveMsg = {
      id: `a-${Date.now()}`, role: 'assistant', text: '', thinking: '',
      routing: null, pluginStatus: null, answerStarted: false, artifactIds: [], live: true,
      phase: null, tools: [], tasks: {},
    };
    liveMsgRef.current = liveMsg;
    setMessages(m => [...m, userMsg, liveMsg]);
    setBusy(true);
    setToast(null);

    const patchLive = (patch) => {
      Object.assign(liveMsgRef.current, typeof patch === 'function' ? patch(liveMsgRef.current) : patch);
      setMessages(m => m.map(x => x.id === liveMsgRef.current.id ? { ...liveMsgRef.current } : x));
    };

    // one automatic reconnect for transient stream drops (safe: SSE is read-only
    // client-side; the server continues the same conversation + partial text is kept)
    let autoRetried = false;

    const runStream = async () => streamChat({
      conversationId: convId,
      text,
      fileId,
      feature: extra.feature || pendingTool || undefined,
      wizard: wizard.active ? { active: true, step: wizard.step } : undefined,
      editTarget: extra.editTarget || undefined,
      resumeFrom: liveMsgRef.current.text ? liveMsgRef.current.text.length : 0,
    }, (type, evt) => {
      if (type === 'routing') patchLive({ routing: evt });
      else if (type === 'phase') { if (!liveMsgRef.current.answerStarted) patchLive({ phase: evt.phase }); }
      else if (type === 'tool_start') patchLive(prev => ({
        tools: [...(prev.tools || []), { tool: evt.tool, purpose: evt.purpose, status: 'running', startedAt: evt.startedAt, debug: evt.debug }],
      }));
      else if (type === 'tool_end') patchLive(prev => ({
        tools: (prev.tools || []).map(x => x.tool === evt.tool && x.status === 'running'
          ? { ...x, status: evt.status === 'failed' ? 'failed' : 'done', summary: evt.summary, elapsedMs: evt.elapsedMs, debug: { ...x.debug, ...evt.debug } }
          : x),
      }));
      else if (type === 'task') patchLive(prev => ({
        tasks: { ...(prev.tasks || {}), [evt.taskId]: { ...(prev.tasks || {})[evt.taskId], ...evt } },
      }));
      else if (type === 'plugin_status') patchLive({ pluginStatus: typeof evt.message === 'string' ? evt.message : JSON.stringify(evt.message) });
      else if (type === 'status') { if (!liveMsgRef.current.answerStarted) patchLive({ pluginStatus: typeof evt.message === 'string' ? evt.message : '' }); }
      else if (type === 'thinking') patchLive(prev => ({ thinking: (prev.thinking || '') + evt.delta }));
      else if (type === 'answer') patchLive(prev => ({ text: (prev.text || '') + evt.delta, answerStarted: true, pluginStatus: null, phase: null }));
      else if (type === 'error') throw normalizeError(evt, evt.errorCode || 'SERVER_ERROR'); // structured server frame
    });

    try {
      try {
        await runStream();
      } catch (first) {
        const e1 = normalizeError(first);
        // AUTOMATIC RECOVERY: one silent reconnect on transient transport drops,
        // never on server-reported errors or aborts. Partial text is preserved.
        if (!autoRetried && (e1.errorCode === 'STREAM_DROPPED' || e1.errorCode === 'NETWORK')) {
          autoRetried = true;
          patchLive({ pluginStatus: 'Connection dropped — reconnecting…' });
          await new Promise(r2 => setTimeout(r2, 1200));
          await runStream();
        } else {
          throw e1;
        }
      }
      patchLive({ live: false });
      // advance wizard on success
      if (wizard.active && wizard.step < 4) setWizard(w => ({ ...w, step: Math.min(w.step + 1, 4) }));
      draftRef.current = null;
      await refreshConvs();
    } catch (raw) {
      // STEP 8: graceful error — normalize into {userMessage, errorCode, debugDetails};
      // NEVER render a raw object. Conversation history + partial streamed output are kept.
      const e = normalizeError(raw);
      const note = `> ⚠ The stream stopped (${e.errorCode}): ${e.userMessage}` +
        (liveMsgRef.current.text ? '\n> Partial output above is preserved.' : '') +
        (DEBUG ? `\n> debug: ${e.debugDetails}` : '');
      patchLive({ live: false, text: (liveMsgRef.current.text || '') + (liveMsgRef.current.text ? '\n\n' : '') + note });
      const draft = draftRef.current;
      setToast({
        message: (/rate|429/i.test(e.userMessage) ? 'Rate limited by the model service — your draft is preserved. ' : '') +
          `${e.userMessage} [${e.errorCode}]` + (DEBUG ? ` — ${e.debugDetails.slice(0, 300)}` : ''),
        retry: draft ? () => { setMessages(m => m.slice(0, -2)); send(draft.text, draft.fileId, draft.fileName, draft.extra); } : null,
      });
    } finally {
      setBusy(false);
    }
  };

  /* ---------- wizard option tap ---------- */
  const onOption = (optionText) => {
    if (/export as (pptx|docx|pdf|xlsx)/i.test(optionText)) {
      const fmt = optionText.match(/pptx|docx|pdf|xlsx/i)[0].toLowerCase();
      const lastAsst = [...messages].reverse().find(m => m.role === 'assistant' && !m.live && (m.text || '').length > 120);
      if (lastAsst) { doExport(lastAsst.id, fmt); if (wizard.active) setWizard(w => ({ ...w, step: 4 })); return; }
    }
    send(optionText);
  };

  /* ---------- exports (STEP 7) ---------- */
  const doExport = async (messageId, format) => {
    setExportBusy(true);
    try {
      // server messages have real ids; live client ids need the latest server message — fall back to server fetch
      let msgId = messageId;
      if (String(messageId).startsWith('a-')) {
        const { conversation } = await jget(`/api/conversations/${activeId}`);
        const lastAsst = [...conversation.messages].reverse().find(m => m.role === 'assistant');
        msgId = lastAsst?.id;
      }
      const { artifact } = await jpost('/api/export', { conversationId: activeId, messageId: msgId, format });
      setArtifacts(a => ({ ...a, [artifact.id]: artifact }));
      setMessages(m => m.map(x => x.id === messageId ? { ...x, artifactIds: [...(x.artifactIds || []), artifact.id] } : x));
    } catch (e) {
      setToast({ message: `Export failed: ${e.message}`, retry: () => doExport(messageId, format) });
    } finally { setExportBusy(false); }
  };

  /* ---------- preview edit click (STEP 6) ---------- */
  const onEditRequest = (sectionHeading) => {
    const note = prompt(`Edit "${sectionHeading}" — what should change?`);
    if (note) send(`In the section/slide "${sectionHeading}": ${note}`, null, null, { editTarget: sectionHeading });
  };

  /* ---------- derived ---------- */
  const latestDraftMsg = [...messages].reverse().find(m => m.role === 'assistant' && (m.text || '').length > 0);
  const latestDraft = latestDraftMsg ? dissect(latestDraftMsg.text) : null;
  const isEmpty = messages.length === 0;
  const activeFeature = pendingTool;

  const startTool = (key) => {
    newChat(key, { wizard: WIZARD_FEATURES.has(key) });
  };

  return (
    <div className="app">
      <Sidebar conversations={convs} activeId={activeId} onSelect={loadConversation} onNew={() => newChat('chat')} onTool={startTool} open={sidebarOpen} />
      <div className="main">
        {offline && <div className="banner">{t('offline')}</div>}
        {/* STEP 2 — Standard/Debug display-mode toggle */}
        <button className={`modetoggle${DEBUG ? ' on' : ''}`} onClick={toggleDebug}
          title={DEBUG ? 'Debug mode: exact plugins, timings, ids' : 'Standard mode: clean progress'}
          aria-pressed={DEBUG} aria-label="Toggle debug display mode">
          {DEBUG ? `⌗ ${t('debugMode')}` : `◦ ${t('standardMode')}`}
        </button>
        <div className="canvas-row">
          <div className="chatcol">
            {isEmpty ? (
              /* STEP 3 — empty state */
              <div className="empty">
                <h1>What are we producing today?</h1>
                <div style={{ width: 'min(720px, 92%)' }}>
                  <ComposerInline onSend={send} busy={busy} onError={(m) => setToast({ message: m })} activeFeature={activeFeature} />
                </div>
                <div className="chips">
                  {CHIPS.map(c => (
                    <button key={c.label} className="chip" onClick={async () => {
                      await newChat(c.feature, { wizard: Boolean(c.wizard) });
                      if (!c.text.endsWith(' ')) send(c.text, null, null, { feature: c.feature });
                    }}>{c.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="stream" ref={streamRef} onScroll={onScroll}>
                  <div className="stream__inner">
                    <ErrorBoundary name="message stream">
                      {messages.map(m => m.role === 'user'
                        ? <UserMessage key={m.id} msg={m} />
                        : <AssistantMessage key={m.id} msg={m} live={m.live} onOption={onOption} onExport={doExport} exportBusy={exportBusy} artifacts={artifacts} debugMode={DEBUG} />)}
                    </ErrorBoundary>
                  </div>
                </div>
                {!atBottom && (
                  <button className="jump" onClick={() => { streamRef.current.scrollTop = streamRef.current.scrollHeight; setAtBottom(true); }}>
                    ↓ Jump to bottom
                  </button>
                )}
                <div className="composer-wrap">
                  <Composer onSend={send} busy={busy} onError={(m) => setToast({ message: m })}
                    placeholder={activeFeature ? placeholderFor(activeFeature) : 'Message the ODA suite…'} />
                  <div className="composer-hint">gpt-5.6-sol-medium · every figure sourced or flagged · one verified deliverable per run</div>
                </div>
              </>
            )}
          </div>
          {/* STEP 6 — wizard + live preview (boundary-wrapped) */}
          <ErrorBoundary name="wizard panel">
            <PreviewPane wizard={wizard} latestDraft={latestDraft} onEditRequest={onEditRequest}
              onCloseWizard={() => setWizard({ active: false, step: 0 })} />
          </ErrorBoundary>
        </div>
      </div>

      {/* STEP 8 — error toast with retry */}
      {toast && (
        <div className="toast">
          <span className="dot" />
          <span>{toast.message}</span>
          {toast.retry && <button onClick={() => { const r = toast.retry; setToast(null); r(); }}>Retry</button>}
          <button className="x" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </div>
  );
}

function placeholderFor(f) {
  return {
    design: 'Describe the deck or one-pager to build…',
    summary: 'Attach a deck/doc and ask for the five-zone one-pager…',
    'problem-solve': 'State the problem to work…',
    benchmark: 'What programmes should we benchmark?',
    translate: 'Paste the English text to render in Emirati-register Arabic…',
    media: 'Describe the announcement or communications need…',
    'action-titles': 'Paste the slide content to title…',
    'country-data': 'Which country and which indicators?',
  }[f] || 'Message the ODA suite…';
}

/* Slim composer reused inside the empty state (no border box duplication) */
function ComposerInline({ onSend, busy, onError, activeFeature }) {
  // Reuse the standard Composer but style-flattened: simplest is to render it directly.
  return (
    <div style={{ width: '100%' }}>
      <Composer onSend={onSend} busy={busy} onError={onError}
        placeholder={activeFeature ? placeholderFor(activeFeature) : 'Describe the deliverable — a deck, a one-pager, a benchmark, a translation…'} />
    </div>
  );
}
