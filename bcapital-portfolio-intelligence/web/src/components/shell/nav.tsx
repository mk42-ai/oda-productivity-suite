"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Newspaper, MessageSquare, Settings, Building2, Archive, Users, Landmark, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useArtifacts } from "@/lib/artifacts/store";
import { useEffect, useRef, type KeyboardEvent } from "react";

/** a33: arrow-key roving between nav items (ArrowDown/Right → next, ArrowUp/Left → prev, Home/End; wraps). Tab order is untouched. */
function onNavKeyDown(e: KeyboardEvent<HTMLElement>) {
  const links = Array.from(e.currentTarget.querySelectorAll<HTMLAnchorElement>("a[data-testid^='nav-']"));
  const cur = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (cur < 0 || links.length === 0) return;
  const last = links.length - 1;
  let next: number | null = null;
  switch (e.key) {
    case "ArrowDown": case "ArrowRight": next = cur === last ? 0 : cur + 1; break;
    case "ArrowUp": case "ArrowLeft": next = cur === 0 ? last : cur - 1; break;
    case "Home": next = 0; break;
    case "End": next = last; break;
  }
  if (next == null) return;
  e.preventDefault();
  links[next]?.focus();
}
const ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2, match: "/compan" },
  { href: "/news", label: "News Pulse", icon: Newspaper },
  { href: "/signals", label: "Signals", icon: Activity },
  { href: "/social", label: "B Social", icon: Users, match: "/social" },
  { href: "/pitchbook", label: "PitchBook", icon: Landmark },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/artifacts", label: "Artifacts", icon: Archive },
  { href: "/settings", label: "Settings", icon: Settings },
];
/** Active-route rule: exact match, the item's `match` prefix (/company/* → Companies, /social/people/* → B Social), and `/` → Overview. */
export function isActive(path: string | null, href: string, match?: string) {
  const p = path ?? "";
  if (p === href || (href === "/overview" && p === "/")) return true;
  return !!match && (p === match || p.startsWith(`${match}/`) || (match === "/compan" && p.startsWith(match)));
}
/**
 * Primary nav items. `collapsed` (desktop) shows icons only with a title tooltip; labels stay in the accessibility tree.
 * Prefetch: every link uses Next's default prefetch. For dynamic routes (/social, /chat …) Next 15 only prefetches up to the
 * nearest loading.tsx boundary — a cheap static shell — so there is no full server render to cancel (the earlier ERR_ABORTED noise).
 */
export function Nav({ collapsed = false }: { collapsed?: boolean }) {
  const path = usePathname();
  const { items: artifacts } = useArtifacts();
  const artifactCount = artifacts.length;
  const navRef = useRef<HTMLElement>(null);
  // < lg the nav is a horizontally scrolling row: keep the active item visible after each route change. Scrolls ONLY the row
  // (container.scrollTo), never the window, so it cannot fight Next's scroll-to-top / back-forward scroll restoration.
  useEffect(() => {
    const nav = navRef.current; if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const el = nav.querySelector<HTMLElement>("a[aria-current='page']"); if (!el) return;
    const left = el.offsetLeft - nav.offsetLeft; const right = left + el.offsetWidth;
    if (left < nav.scrollLeft || right > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: Math.max(0, left - 16), behavior: "auto" });
  }, [path]);
  return (
    <nav ref={navRef} aria-label="Primary" className={cn("flex min-w-0 max-w-full items-center gap-1 overflow-x-auto lg:mt-3 lg:flex-col lg:items-stretch lg:gap-1", collapsed && "lg:items-center")} data-testid="primary-nav" onKeyDown={onNavKeyDown}>
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = isActive(path, href, match);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} aria-label={label} title={collapsed ? label : undefined} data-testid={`nav-${href.slice(1)}`}
            className={cn("relative flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring", active ? "bg-surface-3 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground", collapsed && "lg:size-10 lg:justify-center lg:px-0")}>
            <Icon className="size-4 shrink-0" aria-hidden /><span className={cn("hidden sm:inline", collapsed && "lg:sr-only")}>{label}</span><span className="sr-only sm:hidden">{label}</span>
            {href === "/artifacts" && artifactCount > 0 && <ArtifactsCount count={artifactCount} collapsed={collapsed} />}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Artifact count merged INTO the Artifacts nav item (no floating badge anywhere in the rail): a small charcoal pill at the right end of the
 * link; icon-only collapsed rail → a green dot with the count in `title`. Hidden when there are no artifacts.
 */
function ArtifactsCount({ count, collapsed }: { count: number; collapsed: boolean }) {
  const text = count > 99 ? "99+" : String(count);
  const label = `${count} artifact${count === 1 ? "" : "s"}`;
  return (
    <>
      <span data-testid="nav-artifacts-count" data-count={count} title={label} aria-label={label}
        className={cn("ml-auto hidden min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold leading-5 text-background tabular-nums sm:inline-flex", collapsed && "lg:hidden")}>{text}</span>
      {collapsed && <span data-testid="nav-artifacts-dot" title={label} aria-hidden className="absolute right-1.5 top-1.5 hidden size-2 rounded-full bg-[#0AC985] ring-2 ring-background lg:block" />}
    </>
  );
}
