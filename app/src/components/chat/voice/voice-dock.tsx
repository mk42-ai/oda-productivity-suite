"use client";
/**
 * Advanced voice mode — full duplex (2026-10-12 rewrite; replaces the basic TTS-only dock).
 *
 *  • Input: live SpeechRecognition (continuous + interimResults) → partial transcript streams into the caption as you speak. Browsers
 *    without it fall back to the MediaRecorder VAD capture (use-voice-capture.ts) → POST /api/voice/stt (server key).
 *  • Output: SpeechOut speaks the answer sentence-by-sentence from the SAME live stream store the OD-style thinking log renders from.
 *  • Full duplex + barge-in: the mic stays open while the assistant speaks; any detected speech (recognition onspeechstart / an interim
 *    result, or the VAD onSpeechStart) stops speech output and cancels the running stream instantly.
 *  • Parity: a voice turn is an ordinary `processMessage` in the SAME thread → identical thinking log, Plan/Run tabs, plugin chips and
 *    citations. Each turn carries the per-turn plugin selection (chips in the panel), and is mirrored to the advanced-voice Flow Builder
 *    workflow (POST /api/voice/workflow, same plugin ids) whose execution logs stream back into the panel. Keys stay server-side.
 *  • Orb: canvas waveform driven by the live mic analyser level (no React re-render per frame), state ring = listening / thinking / speaking.
 */
import "./voice.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useThread } from "@openuidev/react-ui";
import type { UserMessage } from "@openuidev/react-headless";
import { AudioLines, Loader2, Mic, MicOff, Radio, X } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { usePluginSelection, getSelectedPluginIds } from "@/lib/plugin-selection";
import { pluginName } from "@/lib/plugin-catalogue";
import { PluginFavicon } from "@/components/ui/plugin-favicon";
import { useVoiceCapture } from "./use-voice-capture";
import { SpeechOut, type SpeechState } from "./speech-out";
import { markVoiceOrigin, useVoiceOrigin } from "./voice-origin";
import { useComposerSlot } from "@/components/chat/open-intelligent-ui/composer-store";
import { useStreamSelector } from "@/components/chat/open-intelligent-ui/chat-shell";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";
type VoiceError = { code: "denied" | "unsupported" | "upstream" | "device"; message: string } | null;
type WfLog = { at?: number; message: string; status?: string };
const DENIED = "Microphone access is blocked — allow it in the browser's site settings";
const UNSUPPORTED = "Voice input needs a secure (https) context and microphone support in this browser";

type Rec = { start: () => void; stop: () => void; abort: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: any) => void) | null; onerror: ((e: any) => void) | null; onend: (() => void) | null; onspeechstart: (() => void) | null };
const RecognitionCtor = (): (new () => Rec) | null => { if (typeof window === "undefined") return null; const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }; return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null; };

export function VoiceDock() {
  const [settings] = useSettings();
  const [selected] = usePluginSelection();
  const processMessage = useThread((s) => s.processMessage); const cancelMessage = useThread((s) => s.cancelMessage); const isRunning = useThread((s) => s.isRunning);
  const phase = useStreamSelector((s) => s.phase); const sessionId = useStreamSelector((s) => s.sessionId); const threadId = useStreamSelector((s) => s.lastThreadId);
  const [open, setOpen] = useState(false);
  const [duplex, setDuplex] = useState(false); // conversation running (mic open across turns)
  const [error, setError] = useState<VoiceError>(null);
  const [partial, setPartial] = useState(""); const [finalText, setFinalText] = useState(""); const [speaking, setSpeaking] = useState("");
  const [speech, setSpeech] = useState<SpeechState>("idle");
  const [turnPlugins, setTurnPlugins] = useState<string[]>([]);
  const [wf, setWf] = useState<{ executionId: string | null; status: string; logs: WfLog[] }>({ executionId: null, status: "", logs: [] });
  const [bargeCount, setBargeCount] = useState(0);
  const micRef = useRef<HTMLButtonElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null);
  const headersRef = useRef<Record<string, string>>({}); headersRef.current = settings.apikey ? { "x-ondemand-key": settings.apikey } : {};
  const duplexRef = useRef(duplex); duplexRef.current = duplex;
  const isRunningRef = useRef(isRunning); isRunningRef.current = isRunning;
  const levelRef = useRef(0);
  const recRef = useRef<Rec | null>(null);
  const live = useMemo(() => !!RecognitionCtor(), []);

  const out = useMemo(() => new SpeechOut({
    onState: setSpeech, onSentence: (t) => setSpeaking(t), voice: () => null,
    onFinished: () => { setSpeaking(""); },
  }), []);
  useEffect(() => () => out.destroy(), [out]);

  /** Barge-in: user speech while the assistant speaks or streams → stop output + cancel the stream immediately. */
  const bargeIn = useCallback(() => {
    if (out.active || out.state === "speaking") { out.stop(); setBargeCount((n) => n + 1); if (isRunningRef.current) cancelMessage(); }
  }, [out, cancelMessage]);

  /** Mirror the turn to the advanced-voice workflow (same plugin ids) and stream its execution logs into the panel. */
  const mirrorToWorkflow = useCallback(async (text: string, pluginIds: string[]) => {
    setWf({ executionId: null, status: "starting", logs: [] });
    try {
      const r = await fetch("/api/voice/workflow", { method: "POST", headers: { "content-type": "application/json", ...headersRef.current }, body: JSON.stringify({ transcript: text, pluginIds, threadId, sessionId }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; executionId?: string; message?: string };
      if (!j.ok || !j.executionId) { setWf({ executionId: null, status: j.message ? `unavailable: ${j.message}` : `HTTP ${r.status}`, logs: [] }); return; }
      setWf({ executionId: j.executionId, status: "running", logs: [] });
      const es = await fetch(`/api/voice/workflow?executionId=${j.executionId}`, { headers: headersRef.current });
      const reader = es.body?.getReader(); if (!reader) return; const dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true });
        let i: number; while ((i = buf.indexOf("\n\n")) >= 0) { const line = buf.slice(0, i).replace(/^data:\s*/, ""); buf = buf.slice(i + 2);
          try { const f = JSON.parse(line) as { type: string; status?: string; message?: string; at?: number };
            if (f.type === "log" && f.message) setWf((w) => ({ ...w, logs: [...w.logs, { at: f.at, message: f.message!, status: f.status }].slice(-6) }));
            if (f.type === "status" && f.status) setWf((w) => ({ ...w, status: f.status! }));
          } catch { /* partial */ } }
      }
    } catch (e) { setWf((w) => ({ ...w, status: `unavailable: ${(e as Error).message}` })); }
  }, [threadId, sessionId]);

  /** One voice turn = ordinary user message in the same thread, with the per-turn plugin selection. */
  const sendTurn = useCallback(async (text: string) => {
    const t = text.trim(); if (!t) return;
    const pluginIds = getSelectedPluginIds(); setTurnPlugins(pluginIds);
    setFinalText(t); setPartial(""); setError(null);
    markVoiceOrigin(t);
    if (SpeechOut.supported()) out.follow();
    void mirrorToWorkflow(t, pluginIds);
    await processMessage({ role: "user", content: t });
  }, [out, processMessage, mirrorToWorkflow]);

  // ---------- live recognition (partial transcript, continuous, barge-in) ----------
  const startRecognition = useCallback(() => {
    const C = RecognitionCtor(); if (!C) return false;
    const rec = new C(); rec.continuous = true; rec.interimResults = true; rec.lang = navigator.language || "en-US";
    rec.onspeechstart = () => bargeIn();
    rec.onresult = (e: any) => {
      let interim = ""; let fin = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript; }
      if (interim) { setPartial(interim); bargeIn(); }
      if (fin.trim()) void sendTurn(fin);
    };
    rec.onerror = (e: any) => { const c = String(e?.error ?? ""); if (c === "not-allowed" || c === "service-not-allowed") { setError({ code: "denied", message: DENIED }); setDuplex(false); } else if (c !== "no-speech" && c !== "aborted") setError({ code: "upstream", message: `Speech recognition: ${c}` }); };
    rec.onend = () => { if (duplexRef.current && recRef.current === rec) { try { rec.start(); } catch { /* already started */ } } };
    recRef.current = rec; try { rec.start(); } catch { /* noop */ }
    return true;
  }, [bargeIn, sendTurn]);

  // ---------- fallback: VAD capture + server STT ----------
  const submitAudio = useCallback(async (blob: Blob, mimeType: string) => {
    setPartial("Transcribing…");
    const ext = /mp4|m4a/.test(mimeType) ? "m4a" : /ogg/.test(mimeType) ? "ogg" : /wav/.test(mimeType) ? "wav" : /mpeg|mp3/.test(mimeType) ? "mp3" : "webm";
    const fd = new FormData(); fd.append("audio", blob, `utterance.${ext}`);
    try {
      const r = await fetch("/api/voice/stt", { method: "POST", body: fd, headers: headersRef.current });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; text?: string; message?: string };
      if (!j.ok) { setError({ code: "upstream", message: j.message ?? `Transcription failed (HTTP ${r.status})` }); setPartial(""); return; }
      await sendTurn(j.text ?? "");
    } catch (e) { setError({ code: "upstream", message: (e as Error).message }); }
  }, [sendTurn]);
  const capture = useVoiceCapture({
    mode: "hands-free",
    onUtterance: (u) => { void submitAudio(u.blob, u.mimeType); },
    onSpeechStart: () => { setPartial("Listening…"); bargeIn(); },
    onError: (code, message) => { setError({ code, message: code === "denied" ? DENIED : code === "unsupported" ? UNSUPPORTED : message }); setDuplex(false); },
  });
  const captureRef = useRef(capture); captureRef.current = capture;
  useEffect(() => capture.subscribeLevel((v) => { levelRef.current = v; micRef.current?.style.setProperty("--voice-level", v.toFixed(3)); }), [capture.subscribeLevel]); // eslint-disable-line react-hooks/exhaustive-deps
  // keep VAD capture open across turns in duplex (it ends after each utterance in hands-free mode)
  useEffect(() => { if (duplex && capture.status === "idle") void capture.start(); }, [duplex, capture.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDuplex = useCallback(async () => {
    setOpen(true); setError(null); setDuplex(true); setPartial("");
    // The analyser drives the waveform + VAD barge-in in both paths; recognition adds the live partial transcript where available.
    const ok = await captureRef.current.start();
    if (ok && live) { captureRef.current.cancel(); startRecognition(); void captureRef.current.start(); }
  }, [live, startRecognition]);
  const stopDuplex = useCallback(() => {
    setDuplex(false); const r = recRef.current; recRef.current = null; try { r?.abort(); } catch {} captureRef.current.cancel(); out.stop(); setPartial("");
  }, [out]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape" && (duplexRef.current || out.active)) stopDuplex(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [stopDuplex, out]);

  // ---------- waveform orb (canvas, own rAF; reads levelRef — no React commit per frame) ----------
  const stateRef = useRef<VoiceState>("idle");
  useEffect(() => {
    if (!open) return; let raf = 0; const hist = new Array(48).fill(0); let tPhase = 0;
    const draw = () => {
      const cv = canvasRef.current; const ctx = cv?.getContext("2d"); if (!cv || !ctx) { raf = requestAnimationFrame(draw); return; }
      const st = stateRef.current; tPhase += 0.08;
      const synth = st === "speaking" ? 0.35 + 0.25 * Math.abs(Math.sin(tPhase * 1.7)) : st === "thinking" ? 0.12 + 0.08 * Math.sin(tPhase) : 0;
      hist.push(Math.max(levelRef.current, synth)); hist.shift();
      const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.28; ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.6);
      const [a, b] = st === "speaking" ? ["#0D0D0D", "#5D5D5D"] : st === "thinking" ? ["#5D5D5D", "#0D0D0D"] : st === "error" ? ["#737373", "#5D5D5D"] : st === "listening" ? ["#5D5D5D", "#0D0D0D"] : ["#D4D4D4", "#A3A3A3"];
      g.addColorStop(0, a); g.addColorStop(1, b + "00"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = a; ctx.beginPath(); ctx.arc(cx, cy, R * (0.85 + hist[hist.length - 1] * 0.5), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 2; ctx.beginPath();
      hist.forEach((v, i) => { const x = cx - R * 0.8 + (i / (hist.length - 1)) * R * 1.6; const y = cy + Math.sin(i * 0.6 + tPhase * 2) * v * R * 0.9; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [open]);

  const unsupported = capture.permission === "unsupported" && !live;
  const state: VoiceState = error && (error.code === "denied" || error.code === "unsupported") ? "error"
    : speech === "speaking" ? "speaking"
    : isRunning || phase !== "idle" ? "thinking"
    : duplex ? "listening" : "idle";
  stateRef.current = state;

  // QA hooks: drive the REAL path without a microphone (headless browsers have none): transcript → sendTurn, or audio → /api/voice/stt.
  useEffect(() => {
    const w = window as unknown as { __uaeccVoice?: Record<string, unknown> };
    w.__uaeccVoice = {
      injectTranscript: async (text: string, partialFirst = true) => { setOpen(true); setDuplex(true); if (partialFirst) { for (const word of text.split(" ")) { setPartial((p) => (p ? `${p} ${word}` : word)); levelRef.current = 0.4 + Math.random() * 0.4; await new Promise((r) => setTimeout(r, 90)); } } levelRef.current = 0; await sendTurn(text); },
      injectAudio: async (blob: Blob, mimeType = blob.type || "audio/mpeg") => { setOpen(true); await submitAudio(blob, mimeType); },
      bargeIn: () => bargeIn(),
      state: () => stateRef.current,
    };
    return () => { delete w.__uaeccVoice; };
  }, [sendTurn, submitAudio, bargeIn]);

  // Deep link: /chat?voice=<utterance> runs ONE voice turn on load through the real path (same as /chat?q= for text) — lets a headless
  // browser (no microphone) exercise voice streaming end-to-end.
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current) return; const v = new URLSearchParams(window.location.search).get("voice")?.trim(); if (!v) return;
    deepLinked.current = true; const t = setTimeout(() => { void (window as unknown as { __uaeccVoice?: { injectTranscript: (s: string) => Promise<void> } }).__uaeccVoice?.injectTranscript(v.slice(0, 500)); }, 600);
    return () => clearTimeout(t);
  }, []);
  const barHost = useComposerSlot("mic"); const panelHost = useComposerSlot("panel");
  const label = unsupported ? "Voice mode is not supported here" : duplex ? "End voice mode" : "Start voice mode (full duplex)";
  const chips = turnPlugins.length ? turnPlugins : selected;
  const caption = partial || (state === "speaking" ? speaking : finalText) || (duplex ? "Listening — just talk. Interrupt any time." : "Tap the mic to start a full-duplex voice conversation.");
  return (
    <>
      {barHost && createPortal(
        <button ref={micRef} type="button" className="voice-mic" data-testid="voice-mic" data-state={state} aria-label={label} title={label} aria-pressed={duplex} disabled={unsupported}
          onClick={() => (duplex ? stopDuplex() : void startDuplex())}>
          {state === "thinking" ? <Loader2 className="size-4 oiu-spin" aria-hidden /> : state === "speaking" ? <AudioLines className="size-4" aria-hidden /> : unsupported || capture.permission === "denied" ? <MicOff className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
        </button>, barHost)}
      {panelHost && (open || !!error) && createPortal(
        <section className="voice-panel voice-panel--duplex" data-testid="voice-panel" data-state={state} data-duplex={duplex ? "1" : "0"} data-transport={live ? "live-recognition" : "vad+stt"} aria-label="Voice mode">
          <canvas ref={canvasRef} className="voice-orb-canvas" data-testid="voice-orb" data-state={state} width={112} height={112} aria-hidden />
          <div className="voice-panel__body">
            <p className="voice-panel__state" data-testid="voice-state"><Radio className="size-3" aria-hidden /> {state === "listening" ? "Listening" : state === "thinking" ? "Thinking — same run log below" : state === "speaking" ? "Speaking — talk to interrupt" : state === "error" ? "Voice unavailable" : "Voice mode"}{bargeCount > 0 && <span className="voice-panel__barge" data-testid="voice-barge-count"> · {bargeCount} interruption{bargeCount === 1 ? "" : "s"}</span>}</p>
            <p className="voice-caption" data-testid="voice-caption" data-kind={partial ? "interim" : state === "speaking" ? "speaking" : "final"} aria-live="polite" aria-atomic="true">{caption}</p>
            <ul className="voice-plugins" aria-label="Plugins for this voice turn" data-testid="voice-plugins">
              {chips.map((id) => <li key={id} className="voice-plugin-chip" data-plugin-id={id}><PluginFavicon id={id} size={14} /> {pluginName(id)}</li>)}
            </ul>
            {wf.status && <p className="voice-wf" data-testid="voice-workflow" data-status={wf.status} title={wf.executionId ?? ""}>Voice workflow: {wf.status}{wf.logs.length ? ` · ${wf.logs[wf.logs.length - 1].message}` : ""}</p>}
            {error && <p className="voice-error" data-testid="voice-error" data-code={error.code} role="alert"><span>{error.message}</span><button type="button" onClick={() => setError(null)}>Dismiss</button></p>}
          </div>
          <div className="voice-panel__controls">
            <button type="button" className="voice-cta" data-testid="voice-toggle" aria-pressed={duplex} onClick={() => (duplex ? stopDuplex() : void startDuplex())}>{duplex ? "End" : "Start"}</button>
            <button type="button" className="voice-panel__close" aria-label="Close voice panel" onClick={() => { stopDuplex(); setOpen(false); setError(null); }}><X className="size-4" aria-hidden /></button>
          </div>
        </section>, panelHost)}
    </>
  );
}

const textOf = (m: UserMessage): string => (typeof m.content === "string" ? m.content : Array.isArray(m.content) ? (m.content as { type?: string; text?: string }[]).map((p) => (p?.type === "text" ? p.text ?? "" : "")).join("") : "");
/** Default-looking user bubble + the 'via voice' chip when the message originated from the voice dock. */
export function VoiceUserMessage({ message }: { message: UserMessage }) {
  const text = textOf(message); const viaVoice = useVoiceOrigin(message.id, text);
  return (
    <div className="openui-agent-thread-message-user">
      <div className="voice-user-message">
        <div className="openui-agent-thread-message-user__content">{text}</div>
        {viaVoice && <span className="voice-origin" data-testid="voice-origin"><Mic className="size-3" aria-hidden /> via voice</span>}
      </div>
    </div>
  );
}
