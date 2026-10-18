"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSettings } from "@/lib/settings";
/**
 * First-run redirect to /onboarding (client-only; respects an explicit ?skip=1 and never loops).
 * The redirect waits for the document "load" event: a router.replace fired while a streamed page's Suspense boundaries were still
 * being filled made React hydrate the old route's half-streamed markup against the /onboarding tree (React #418).
 */
export function OnboardingGate() {
  const path = usePathname(); const router = useRouter(); const checked = useRef(false);
  useEffect(() => {
    if (checked.current) return;
    if (path.startsWith("/onboarding") || path.startsWith("/api")) { checked.current = true; return; }
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("skip") === "1" || sp.get("e2e") === "1" || getSettings().onboarded) { checked.current = true; return; }
    const go = () => { checked.current = true; router.replace("/onboarding"); };
    if (document.readyState === "complete") { go(); return; }
    window.addEventListener("load", go, { once: true });
    return () => window.removeEventListener("load", go);
  }, [path, router]);
  return null;
}
