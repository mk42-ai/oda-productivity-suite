"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
const KEY = "uaecc.theme";
/** Dark theme is feature-flagged OFF (light-only ship). QA 2026-10-21 (Lane C, QA_REPORT.md): with html.dark the page headings stay #0D0D0D on
 *  #2F2F2F cards (1.45:1), eyebrows 2.82:1, ledes 2.03:1, /chat is force-light inside a #212121 shell — 13/13 routes fail AA. The component and the
 *  #212121 token scale are kept; set NEXT_PUBLIC_ENABLE_DARK_THEME=1 to show the toggle again once the dark pairings are fixed. */
export const DARK_THEME_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DARK_THEME === "1";
/** Light/dark switch. The class is applied pre-hydration by THEME_SCRIPT (layout) to avoid a flash; this button just flips + persists it.
 *  With the flag off the script forces light (and clears a stale 'dark' preference) so no visitor lands on the unverified dark pairings. */
export const THEME_SCRIPT = DARK_THEME_ENABLED
  ? `(function(){try{var t=localStorage.getItem('${KEY}');var d=t?t==='dark':false;var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`
  : `(function(){try{var c=document.documentElement.classList;c.remove('dark');c.add('light');document.documentElement.style.colorScheme='light';if(localStorage.getItem('${KEY}')==='dark')localStorage.removeItem('${KEY}');}catch(e){}})();`;
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  if (!DARK_THEME_ENABLED) return null;
  const flip = () => { const d = !document.documentElement.classList.contains("dark"); const c = document.documentElement.classList; c.toggle("dark", d); c.toggle("light", !d); document.documentElement.style.colorScheme = d ? "dark" : "light"; try { localStorage.setItem(KEY, d ? "dark" : "light"); } catch {} setDark(d); };
  return (
    <button type="button" onClick={flip} data-testid="theme-toggle" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted hover:bg-surface-2 hover:text-foreground">
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}{!compact && <span>{dark ? "Light" : "Dark"}</span>}
    </button>
  );
}
