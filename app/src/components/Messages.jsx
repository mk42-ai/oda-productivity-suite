import React, { useEffect, useRef, useState } from 'react';
import { Markdown, dissect } from '../markdown.jsx';
import SwirlStatus from './SwirlStatus.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import AudioPlayer from './AudioPlayer.jsx';
import { ToolActivityCard, TaskPhaseCard } from './ToolActivity.jsx';

/* ---------- STEP 4: thinking accordion ---------- */
export function ThinkingAccordion({ thinking, live, forceOpenWhileLive }) {
  const [open, setOpen] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const bodyRef = useRef(null);

  // Live-streaming while open by default; auto-collapse when the answer starts (live=false)
  const effectiveOpen = userToggled ? open : (live && forceOpenWhileLive);

  useEffect(() => {
    if (effectiveOpen && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thinking, effectiveOpen]);

  if (!thinking) return null;
  return (
    <div className="think">
      <button className="think__head" onClick={() => { setUserToggled(true); setOpen(!effectiveOpen); }}>
        <span className={`think__dot${live ? '' : ' idle'}`} />
        {live ? 'Thinking…' : 'Thought process'}
        <span style={{ flex: 1 }} />
        <span className={`chev${effectiveOpen ? ' open' : ''}`}>▶</span>
      </button>
      {effectiveOpen && <div className="think__body" ref={bodyRef}>{thinking}</div>}
    </div>
  );
}

/* ---------- STEP 5: routing trace card ---------- */
export function TraceCard({ routing, traceText }) {
  const [open, setOpen] = useState(false);
  if (!routing) return null;
  return (
    <div className="trace">
      <button className="trace__head" onClick={() => setOpen(!open)}>
        <span className="mode">Mode: {routing.mode}</span>
        <span className="arrow">→</span>
        <span>{routing.feature}</span>
        <span className="arrow">→</span>
        <span>{routing.plugins?.length ? `${routing.plugins.length} plugin${routing.plugins.length > 1 ? 's' : ''}` : 'LLM-direct'}</span>
        <span style={{ flex: 1 }} />
        <span className={`chev${open ? ' open' : ''}`}>▶</span>
      </button>
      {open && (
        <div className="trace__body">
          <div><b>Worker:</b> {routing.feature} · <b>Mode:</b> {routing.mode} ({routing.reason})</div>
          <div><b>Model:</b> {routing.model} · <b>Router:</b> {routing.source}</div>
          <div><b>Plugins attached:</b> {routing.plugins?.length
            ? routing.plugins.map(p => <span className="trace__plug" key={p}>{p}</span>)
            : <span className="trace__plug">none — LLM-direct</span>}</div>
          {routing.analysisFirst && <div style={{ color: 'var(--warn)' }}>analysis-first bright line applied</div>}
          {traceText && <div style={{ whiteSpace: 'pre-wrap', marginTop: 6, fontFamily: 'inherit' }}>{traceText}</div>}
        </div>
      )}
    </div>
  );
}

/* ---------- STEP 7: artifact card (download gated on VALIDATED availability) ---------- */
export function ArtifactCard({ artifact }) {
  const fmt = artifact.format?.toUpperCase() || artifact.name.split('.').pop().toUpperCase();
  const href = `/api/export/${artifact.id}/download`;
  // Download stays disabled until a HEAD check confirms the artifact actually exists.
  const [avail, setAvail] = useState('checking'); // checking | ready | gone
  useEffect(() => {
    let alive = true;
    fetch(href, { method: 'HEAD' })
      .then(r => { if (alive) setAvail(r.ok ? 'ready' : 'gone'); })
      .catch(() => { if (alive) setAvail('gone'); });
    return () => { alive = false; };
  }, [artifact.id]);
  return (
    <div className="artifact">
      <div className="artifact__icon">{fmt}</div>
      <div className="artifact__meta">
        <div className="artifact__name">{artifact.name}</div>
        <div className="artifact__sub">{fmt} · {(artifact.size / 1024).toFixed(0)} kB · {new Date(artifact.createdAt).toLocaleTimeString('en-GB')}</div>
        {artifact.citations?.length > 0 && (
          <div className="artifact__cites">Citations: {artifact.citations.slice(0, 3).join(' · ')}{artifact.citations.length > 3 ? ` +${artifact.citations.length - 3} more` : ''}</div>
        )}
        {artifact.gaps?.length > 0 && (
          <div className="artifact__gaps">⚠ Gaps (unverifiable): {artifact.gaps.slice(0, 2).join(' · ')}{artifact.gaps.length > 2 ? '…' : ''}</div>
        )}
        {avail === 'gone' && <div className="artifact__gaps">This artifact expired (server restart) — regenerate it from the export bar.</div>}
      </div>
      <div className="artifact__btns">
        {avail === 'ready'
          ? <a className="primary" href={href} download>Download</a>
          : <button className="primary" disabled aria-disabled="true">{avail === 'checking' ? 'Preparing…' : 'Expired'}</button>}
        {avail === 'ready' && <a href={href} target="_blank" rel="noreferrer">Open preview</a>}
      </div>
    </div>
  );
}

/* ---------- STEP 8: skeleton naming the actual plugin ---------- */
export function PluginSkeleton({ label }) {
  return (
    <div className="skel">
      <span className="spinner" />
      <span>{label}</span>
      <div className="skel__bar" />
    </div>
  );
}

/* ---------- assistant message ---------- */
export function AssistantMessage({ msg, live, onOption, onExport, exportBusy, artifacts, debugMode }) {
  const { body, options, trace } = dissect(msg.text || '');
  const showExports = !live && (msg.text || '').length > 120;
  const tools = msg.tools || [];
  const tasks = Object.values(msg.tasks || {});
  return (
    <div className="msg-asst">
      <ThinkingAccordion thinking={msg.thinking} live={Boolean(live && !msg.answerStarted)} forceOpenWhileLive={true} />
      {/* STEP 1 — first-token swirl with bilingual terms + backend phase line */}
      {live && !msg.answerStarted && <SwirlStatus phase={msg.phase || msg.pluginStatus} />}
      {/* STEP 2 — tool activity cards (shimmer while running → compact card) */}
      {tools.length > 0 && (
        <div className="tools" aria-label="Tool activity">
          {tools.map((a, i) => <ToolActivityCard key={`${a.tool}-${i}`} act={a} debugMode={debugMode} />)}
        </div>
      )}
      {/* STEP 3 — artifact task phase cards (Queued→…→Complete) */}
      {tasks.map(tk => <TaskPhaseCard key={tk.taskId} task={tk} debugMode={debugMode} />)}
      <Markdown text={body} />
      {live && <span className="cursor-blink" />}
      {!live && options.length > 0 && (
        <div className="options">
          {options.map((o, i) => <button key={i} onClick={() => onOption?.(o)}>{o}</button>)}
        </div>
      )}
      {(msg.artifactIds || []).map(id => artifacts[id] && <ArtifactCard key={id} artifact={artifacts[id]} />)}
      {showExports && (
        <div className="exportbar">
          <span>Export:</span>
          {['pptx', 'docx', 'pdf', 'xlsx'].map(f => (
            <button key={f} disabled={exportBusy} onClick={() => onExport?.(msg.id, f)}>{f.toUpperCase()}</button>
          ))}
        </div>
      )}
      {/* STEP 4 — inline TTS player (lazy; boundary-wrapped) */}
      {!live && (msg.text || '').length > 60 && (
        <ErrorBoundary name="audio player">
          <AudioPlayer text={body} />
        </ErrorBoundary>
      )}
      <TraceCard routing={msg.routing} traceText={trace} />
    </div>
  );
}

export function UserMessage({ msg }) {
  return (
    <div className="msg-user">
      <div>
        <div className="bubble" dir="auto">{msg.text}</div>
        {msg.fileName && <div className="fileref">📎 {msg.fileName}</div>}
      </div>
    </div>
  );
}
