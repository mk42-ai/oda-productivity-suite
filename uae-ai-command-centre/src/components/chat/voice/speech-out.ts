"use client";
/**
 * Speech output for full-duplex voice mode (replaces the removed TTS-only path: /api/voice/tts + tts-queue). Uses the browser's local
 * speechSynthesis — no network call, no key — fed sentence-by-sentence from the SAME live chat stream store the thinking log renders from
 * (subscribeStream). `stop()` is instant, which is what makes barge-in work: the mic VAD / SpeechRecognition onspeechstart calls it.
 */
import { subscribeStream, getStreamSnapshot } from "@/components/chat/open-intelligent-ui/chat-shell";

export type SpeechState = "idle" | "speaking";
const SENTENCE = /[^.!?\n]+[.!?\n]+(\s|$)/g;
const clean = (t: string) => t.replace(/\[(\d+)\]/g, "").replace(/[*_`#>|]/g, "").replace(/\((https?:\/\/[^)]+)\)/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();

export class SpeechOut {
  private unsub: (() => void) | null = null; private spoken = 0; private version = -1; private q: string[] = []; private speakingNow = false;
  state: SpeechState = "idle";
  constructor(private o: { onState: (s: SpeechState) => void; onSentence: (t: string) => void; onFinished: () => void; voice: () => string | null }) {}
  static supported() { return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined"; }
  get active() { return this.speakingNow || this.q.length > 0 || !!this.unsub; }
  /** Follow the next answer stream: speak each completed sentence as it arrives; finish when answerDone. */
  follow() {
    this.stop(); if (!SpeechOut.supported()) return;
    const snap = getStreamSnapshot(); this.version = snap.version; this.spoken = 0; let armed = false;
    this.unsub = subscribeStream((s) => {
      if (s.phase !== "idle" || s.text) armed = true; if (!armed) return;
      const text = s.text ?? ""; SENTENCE.lastIndex = 0; let m: RegExpExecArray | null; let end = 0;
      const tail = text.slice(this.spoken);
      while ((m = SENTENCE.exec(tail))) { const t = clean(m[0]); end = m.index + m[0].length; if (t.length > 1) this.enqueue(t); }
      this.spoken += end;
      if (s.answerDone || s.error) { const rest = clean(text.slice(this.spoken)); if (rest.length > 1) this.enqueue(rest); this.spoken = text.length; this.unsub?.(); this.unsub = null; if (!this.speakingNow && !this.q.length) this.finish(); }
    });
  }
  private enqueue(t: string) { this.q.push(t); if (!this.speakingNow) this.next(); }
  private next() {
    const t = this.q.shift(); if (!t) { this.speakingNow = false; if (!this.unsub) this.finish(); return; }
    this.speakingNow = true; this.set("speaking"); this.o.onSentence(t);
    const u = new SpeechSynthesisUtterance(t); u.rate = 1.05;
    const want = this.o.voice(); if (want) { const v = speechSynthesis.getVoices().find((x) => x.name === want); if (v) u.voice = v; }
    u.onend = () => this.next(); u.onerror = () => this.next();
    speechSynthesis.speak(u);
  }
  private finish() { this.set("idle"); this.o.onFinished(); }
  private set(s: SpeechState) { if (this.state !== s) { this.state = s; this.o.onState(s); } }
  /** Barge-in / Escape: drop the queue, cancel the utterance, stop following the stream. */
  stop() { this.unsub?.(); this.unsub = null; this.q = []; this.speakingNow = false; try { if (SpeechOut.supported()) speechSynthesis.cancel(); } catch {} this.set("idle"); }
  destroy() { this.stop(); }
}
