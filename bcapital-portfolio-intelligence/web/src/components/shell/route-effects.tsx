"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** True while a modal/drawer is genuinely open (Radix dialogs, our quick-view drawer, any aria-modal surface). */
function modalOpen() {
  return !!document.querySelector("[role=dialog][data-state=open], [aria-modal=true], [data-testid=company-quick-view-drawer]");
}

/**
 * Route-change housekeeping, mounted once in <Shell>. On every client navigation (pathname change, not the first mount):
 *  1. broadcasts `bcap:route-change` so transient UI (drawers, popovers, the ⌘K palette) can close itself;
 *  2. releases a leftover scroll lock / pointer-events lock (body/html overflow:hidden, body pointer-events:none from Radix)
 *     when no modal is open any more — a drawer unmounted mid-navigation used to leave the next page unscrollable;
 *  3. moves focus to <main id="main"> (tabIndex -1, preventScroll) so keyboard / screen-reader users start at the new content;
 *  4. honours a #hash target — on the FIRST load too (deep link /company/x#news), on client navigation and on `hashchange`.
 *     The target section is server-streamed behind a loading.tsx boundary, so the browser's native anchor jump fires before
 *     it exists and the page stayed at the top (stress-harness finding 2026-10-16). We poll per animation frame (≤ 3 s) until
 *     the element exists and the layout has settled, then scrollIntoView once; user scroll/keys cancel the wait.
 * Scroll-to-top on push and scroll restoration on back/forward are left to the App Router — nothing here touches window scroll
 * unless a hash is present.
 */
/** Scroll to the current #hash target once it exists (rAF polling, ≤ 3 s, cancelled by user input). Returns a canceller. */
function scrollToHash(): () => void {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (!hash) return () => {};
  let raf = 0; let lastTop = NaN; let stable = 0; const t0 = performance.now();
  const stop = () => { cancelAnimationFrame(raf); window.removeEventListener("wheel", stop); window.removeEventListener("touchmove", stop); window.removeEventListener("keydown", stop); };
  const tick = () => {
    const el = document.getElementById(hash);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      stable = Math.abs(top - lastTop) < 1 ? stable + 1 : 0; lastTop = top;
      if (stable >= 3) { el.scrollIntoView({ block: "start", behavior: "instant" }); stop(); return; }
    }
    if (performance.now() - t0 > 3000) { if (el) el.scrollIntoView({ block: "start", behavior: "instant" }); stop(); return; }
    raf = requestAnimationFrame(tick);
  };
  window.addEventListener("wheel", stop, { passive: true }); window.addEventListener("touchmove", stop, { passive: true }); window.addEventListener("keydown", stop);
  raf = requestAnimationFrame(tick);
  return stop;
}

export function RouteEffects() {
  const path = usePathname();
  const first = useRef(true);
  // Hash targets: first load + every path change + in-page hashchange.
  useEffect(() => {
    let cancel = scrollToHash();
    const onHash = () => { cancel(); cancel = scrollToHash(); };
    window.addEventListener("hashchange", onHash);
    return () => { cancel(); window.removeEventListener("hashchange", onHash); };
  }, [path]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.dispatchEvent(new CustomEvent("bcap:route-change", { detail: { path } }));
    let raf1 = 0, raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!modalOpen()) {
          const b = document.body.style, h = document.documentElement.style;
          if (b.overflow === "hidden") b.overflow = "";
          if (h.overflow === "hidden") h.overflow = "";
          if (b.pointerEvents === "none") b.pointerEvents = "";
          document.body.removeAttribute("data-scroll-locked");
        }
        if (window.location.hash.length > 1) return; // the hash effect owns scroll + the target keeps focus context
        const main = document.getElementById("main");
        const active = document.activeElement;
        // Keep focus where the user put it if it is still inside the new page's main content (e.g. an in-page control).
        if (main && !(active && active !== document.body && main.contains(active))) main.focus({ preventScroll: true });
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [path]);
  return null;
}
