"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command as CommandPrimitive } from "cmdk";
import {
  Archive, Award, BookOpen, Building2, Command as CommandIcon, Landmark, LayoutDashboard, MessageSquare,
  Newspaper, Radar, Settings, Sparkles, User, Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { resolveLogo } from "@/lib/local-logos";
import { sectorColor as sharedSectorColor } from "@/lib/sector-color";
import "./command-k.css";

/** Custom event any component can dispatch to open the switcher: `window.dispatchEvent(new Event("bcap:cmdk"))`. */
export const CMDK_OPEN_EVENT = "bcap:cmdk";

type Row = { slug: string; name: string; sector: string; logo_url: string | null; score: number | null };
type Icon = typeof LayoutDashboard;
type Route = { href: string; label: string; icon: Icon };

const PAGES: Route[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/news", label: "News Pulse", icon: Newspaper },
  { href: "/signals", label: "Signals", icon: Radar },
  { href: "/reputation", label: "Reputation & Prestige", icon: Award },
  { href: "/social", label: "B Social", icon: Users },
  { href: "/pitchbook", label: "PitchBook", icon: Landmark },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/artifacts", label: "Artifacts", icon: Archive },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs/interactive-ui", label: "Why the chat is interactive", icon: BookOpen },
];

const REPUTATION: Route[] = [
  { href: "/reputation#b-capital", label: "B Capital", icon: Sparkles },
  { href: "/reputation#eduardo-saverin", label: "Eduardo Saverin", icon: User },
  { href: "/reputation#raj-ganguly", label: "Raj Ganguly", icon: User },
  { href: "/reputation#karan-mohla", label: "Karan Mohla", icon: User },
];

/* ---- sector colour: the shared hue-audited tokens (a18) — ink colour for monograms/pills. ---- */
function sectorColor(sector: string | null | undefined): string { return sharedSectorColor(sector).ink; }

/* ---- module-scope cache: fetched once per page load ---- */
let cache: Row[] | null = null;
let inflight: Promise<Row[]> | null = null;
async function loadCompanies(): Promise<Row[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const parse = async (url: string): Promise<Row[]> => {
      const r = await fetch(url, { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as { data?: Array<{ slug: string; name: string; sector: string; logo_url: string | null; sentiment?: { score?: number | null } | null }> };
      return (j.data ?? []).map((c) => ({ slug: c.slug, name: c.name, sector: c.sector ?? "", logo_url: c.logo_url ?? null, score: typeof c.sentiment?.score === "number" ? c.sentiment.score : null }));
    };
    try { cache = await parse("/api/portfolio/companies?limit=200"); }
    catch { try { cache = await parse("/api/portfolio/companies"); } catch { cache = []; } }
    inflight = null;
    return cache;
  })();
  return inflight;
}

/**
 * Cmd/Ctrl+K palette on cmdk + radix Dialog. Mounted once in the Shell; opens on the shortcut or the `bcap:cmdk`
 * window event, closes on `bcap:route-change` / Escape. The dialog is only mounted while open (never server-rendered).
 */
export function CommandK() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failedLogos, setFailedLogos] = useState<Record<string, true>>({});

  // Lazily load companies the first time the palette opens.
  useEffect(() => {
    if (!open || rows) return;
    let alive = true;
    loadCompanies().then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, [open, rows]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === "k" || e.key === "K")) { e.preventDefault(); setOpen((o) => !o); }
    };
    const onOpen = () => setOpen(true);
    const onRoute = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener(CMDK_OPEN_EVENT, onOpen);
    window.addEventListener("bcap:route-change", onRoute);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(CMDK_OPEN_EVENT, onOpen);
      window.removeEventListener("bcap:route-change", onRoute);
    };
  }, []);

  const go = useCallback((href: string) => { setOpen(false); router.push(href); }, [router]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        data-testid="cmdk"
        showCloseButton={false}
        aria-describedby="cmdk-description"
        className="cmdk-panel top-[12vh] translate-y-0 max-w-[calc(100%-1.5rem)] sm:max-w-[640px] gap-0 overflow-hidden rounded-[14px] p-0"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription id="cmdk-description" className="sr-only">
          Search pages, reputation subjects and portfolio companies. Use the arrow keys to move and Enter to open.
        </DialogDescription>
        <Command className="cmdk-root" loop>
          <div className="cmdk-search">
            <CommandInput placeholder="Search companies, pages or people…" aria-label="Search" data-testid="cmdk-input" className="cmdk-input" autoFocus />
            <kbd className="cmdk-kbd" aria-hidden><CommandIcon className="size-3" aria-hidden />K</kbd>
          </div>
          <CommandList className="cmdk-list" data-testid="cmdk-list">
            {rows !== null && (
              <CommandEmpty className="cmdk-empty" data-testid="cmdk-empty">No matches — try a company, page or person.</CommandEmpty>
            )}

            <CommandGroup heading="Pages" className="cmdk-group">
              {PAGES.map((r) => {
                const I = r.icon;
                return (
                  <CommandItem key={r.href} value={`${r.label} ${r.href}`} onSelect={() => go(r.href)} data-testid="cmdk-route" className="cmdk-row">
                    <span className="cmdk-chip cmdk-chip-route" aria-hidden><I className="size-3.5" /></span>
                    <span className="cmdk-name">{r.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator className="cmdk-sep" />
            <CommandGroup heading="Reputation" className="cmdk-group">
              {REPUTATION.map((r) => {
                const I = r.icon;
                return (
                  <CommandItem key={r.href} value={`${r.label} reputation`} keywords={["prestige", "person"]} onSelect={() => go(r.href)} data-testid="cmdk-reputation" className="cmdk-row">
                    <span className="cmdk-chip cmdk-chip-route" aria-hidden><I className="size-3.5" /></span>
                    <span className="cmdk-name">{r.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator className="cmdk-sep" />
            <CommandGroup heading="Companies" className="cmdk-group">
              {(rows ?? []).map((row) => {
                const color = sectorColor(row.sector);
                const logo = failedLogos[row.slug] ? null : resolveLogo({ slug: row.slug, name: row.name, logoUrl: row.logo_url });
                const href = `/company/${encodeURIComponent(row.slug)}`;
                return (
                  <CommandItem key={row.slug} value={`${row.name} ${row.sector} ${row.slug}`} onSelect={() => go(href)}
                    data-testid="cmdk-company" data-slug={row.slug} className="cmdk-row">
                    <span className="cmdk-chip" style={{ borderColor: color, color }} aria-hidden>
                      {logo
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={logo} alt="" width={20} height={20} loading="lazy" decoding="async" onError={() => setFailedLogos((f) => ({ ...f, [row.slug]: true }))} />
                        : <span className="cmdk-mono" style={{ background: color }}>{row.name.trim().charAt(0).toUpperCase()}</span>}
                    </span>
                    <span className="cmdk-name">{row.name}</span>
                    {row.sector && <span className="cmdk-sector" style={{ color, borderColor: color }}>{row.sector}</span>}
                    {row.score != null && <span className="cmdk-score" data-testid="cmdk-score">{row.score > 0 ? "+" : ""}{row.score.toFixed(2)}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {rows === null && (
              <CommandPrimitive.Loading className="cmdk-empty" data-testid="cmdk-loading" label="Loading companies">Loading companies…</CommandPrimitive.Loading>
            )}
          </CommandList>
          <div className="cmdk-foot" aria-hidden><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
