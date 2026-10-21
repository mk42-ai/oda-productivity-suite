"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
const KEY = "uaecc.theme";
/** Light/dark switch. The class is applied pre-hydration by THEME_SCRIPT (layout) to avoid a flash; this button just flips + persists it. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}');var d=t?t==='dark':false;var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const flip = () => { const d = !document.documentElement.classList.contains("dark"); const c = document.documentElement.classList; c.toggle("dark", d); c.toggle("light", !d); document.documentElement.style.colorScheme = d ? "dark" : "light"; try { localStorage.setItem(KEY, d ? "dark" : "light"); } catch {} setDark(d); };
  return (
    <button type="button" onClick={flip} data-testid="theme-toggle" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted hover:bg-surface-2 hover:text-foreground">
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}{!compact && <span>{dark ? "Light" : "Dark"}</span>}
    </button>
  );
}
