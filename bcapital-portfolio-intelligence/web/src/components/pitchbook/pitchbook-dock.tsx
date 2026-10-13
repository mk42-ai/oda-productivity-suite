"use client";
/**
 * PitchBook dock — the batch-store sidebar in a fixed panel, mounted once in the Shell (NOT a chat module). On /chat it lets the user
 * drag a company or any field straight into the EXISTING composer (document-level drop target in context-chips-bar) and "ask" injects the
 * question into the CURRENT composer draft (composerStore.append) — no new session, no navigation, no Run button, no on-demand process.
 * Data comes from the same-origin store routes (/pitchbook/store, /pitchbook/store/:slug) which read the server-side libSQL store.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Landmark, X } from "lucide-react";
import type { PbStoreIndex } from "@/lib/pitchbook-store-types";
import { PitchbookSidebar } from "./pitchbook-sidebar";
import "./pitchbook-sidebar.css";

const OPEN_EVENT = "bcap:pitchbook-dock";
export const openPitchbookDock = () => { if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT)); };

export function PitchbookDock() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<PbStoreIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const h = () => setOpen(true); window.addEventListener(OPEN_EVENT, h); return () => window.removeEventListener(OPEN_EVENT, h); }, []);
  useEffect(() => {
    if (!open || index) return;
    let alive = true;
    fetch("/pitchbook/store", { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: PbStoreIndex) => { if (alive) setIndex(d); })
      .catch((e: Error) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [open, index]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  // ≥1024px: reserve the dock's width on the main column (CSS in pitchbook-sidebar.css) so the chat canvas / composer never sit under the dock.
  useEffect(() => {
    if (open) document.body.setAttribute("data-pb-dock", "open"); else document.body.removeAttribute("data-pb-dock");
    return () => document.body.removeAttribute("data-pb-dock");
  }, [open]);
  // The /pitchbook page already IS the sidebar.
  if (!path || path.startsWith("/pitchbook") || path.startsWith("/onboarding")) return null;
  const onChat = path.startsWith("/chat");
  return (
    <>
      {!open && (
        <button type="button" className="pbs-dock-toggle" onClick={() => setOpen(true)} data-testid="pb-dock-toggle" aria-expanded={false} aria-controls="pb-dock" title="PitchBook store — drag companies and fields into the chat">
          <Landmark className="size-3.5" aria-hidden /> PitchBook
        </button>
      )}
      {open && (
        <aside id="pb-dock" className="pbs-dock" data-testid="pb-dock" aria-label="PitchBook batch store" role="complementary">
          <div className="pbs-dock-head">
            <div style={{ minWidth: 0 }}>
              <span>PitchBook store</span>
              <p>{onChat ? "Drag a company or field onto the composer, or press the ask icon — it lands in this chat's draft (no new session)." : "Ask / drag opens the chat with the field queued in the composer."}</p>
            </div>
            <button type="button" className="pbs-dock-close" onClick={() => setOpen(false)} aria-label="Close PitchBook store" data-testid="pb-dock-close"><X className="size-3.5" aria-hidden /></button>
          </div>
          <div className="pbs-dock-body">
            {index ? (
              <PitchbookSidebar companies={index.companies} batch={index.batch} initialSlug={null} initialDetail={null} syncUrl={false} variant="dock" />
            ) : error ? (
              <p className="pbs-muted" data-testid="pb-dock-error">PitchBook store unavailable: {error}</p>
            ) : (
              <p className="pbs-muted" data-testid="pb-dock-loading">Loading the batch store…</p>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
