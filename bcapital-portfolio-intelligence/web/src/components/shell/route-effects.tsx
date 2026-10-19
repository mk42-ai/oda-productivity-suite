"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

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
 *     it exists and the page stayed at the top (stress-harness finding 2026-10-16). We poll per animation frame (≤ 20 s — a cold server streams the section after its backend fetches) until
 *     the element exists and the layout has settled, then scrollIntoView once; user scroll/keys cancel the wait.
 * Scroll-to-top on push and scroll restoration on back/forward are left to the App Router — nothing here touches window scroll
 * unless a hash is present.
 */
/** Scroll to the current #hash target once it exists (rAF polling, ≤ 20 s, cancelled by user input). Returns a canceller. */
function scrollToHash(): () => void {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (!hash) return () => {};
  let raf = 0; let lastTop = NaN; let stable = 0; const t0 = performance.now(); let landedAt = 0;
  const stop = () => { cancelAnimationFrame(raf); window.removeEventListener("wheel", stop); window.removeEventListener("touchmove", stop); window.removeEventListener("keydown", stop); };
  // Phase 1: wait until the target exists and its document offset is stable for 3 frames, then scroll to it.
  // Phase 2 (guard, 4 s): hydration / the router's own scroll handling can reset window scroll to 0 AFTER our jump (seen live on
  // /company/<slug>#news: ~1 in 3 cold loads ended at scrollY 0). Re-apply while the target is out of view and the user has not
  // scrolled or typed (any wheel / touch / key input stops the effect immediately).
  const tick = () => {
    const el = document.getElementById(hash);
    const now = performance.now();
    if (el && landedAt) {
      const r = el.getBoundingClientRect();
      if (r.top < -4 || r.top >= window.innerHeight) el.scrollIntoView({ block: "start", behavior: "instant" });
      if (now - landedAt > 4000) { stop(); return; }
    } else if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      stable = Math.abs(top - lastTop) < 1 ? stable + 1 : 0; lastTop = top;
      if (stable >= 3) { el.scrollIntoView({ block: "start", behavior: "instant" }); landedAt = now; }
    }
    if (!landedAt && now - t0 > 20000) { if (el) el.scrollIntoView({ block: "start", behavior: "instant" }); stop(); return; }
    raf = requestAnimationFrame(tick);
  };
  window.addEventListener("wheel", stop, { passive: true }); window.addEventListener("touchmove", stop, { passive: true }); window.addEventListener("keydown", stop);
  raf = requestAnimationFrame(tick);
  return stop;
}

export function RouteEffects() {
  const path = usePathname();
  const first = useRef(true);
  // Hydration finished (this is a root-level client effect): release the back/forward guard (components/shell/popstate-guard.tsx) so the
  // App Router's client-side popstate restore takes over again.
  useEffect(() => { (window as Window & { __bcapMarkHydrated?: () => void }).__bcapMarkHydrated?.(); }, []);
  // bfcache: a fully hydrated page restored from the back/forward cache (pageshow persisted=true) can hold server data that is hours old;
  // refresh the RSC payload in place (no full reload). Half-streamed restores are handled earlier by the inline popstate guard.
  const router = useRouter();
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) router.refresh(); };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [router]);
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
