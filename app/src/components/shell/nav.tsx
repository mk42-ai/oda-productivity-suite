"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Newspaper, MessageSquare, Settings, Building2, Archive, Orbit, Radar, Share2, FileText, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
  { href: "/overview", label: "National Overview", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: Building2, match: "/watchlist" },
  { href: "/sentiment", label: "Sentiment Universe", icon: Orbit },
  { href: "/news", label: "News Intelligence", icon: Newspaper },
  { href: "/radar", label: "Tech Radar", icon: Radar },
  { href: "/graph", label: "Ecosystem Graph", icon: Share2 },
  { href: "/chat", label: "Executive Chat", icon: MessageSquare },
  { href: "/briefing", label: "National Briefing", icon: FileText },
  { href: "/artifacts", label: "Artifacts", icon: Archive },
  { href: "/methodology", label: "Methodology", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];
/** Active-route rule: exact match, the item's `match` prefix (/watchlist/* → Watchlist), and `/` → Overview. */
export function isActive(path: string | null, href: string, match?: string) {
  const p = path ?? "";
  if (p === href || (href === "/overview" && p === "/")) return true;
  return !!match && (p === match || p.startsWith(`${match}/`) || false);
}
/**
 * Primary nav items. `collapsed` (desktop) shows icons only with a title tooltip; labels stay in the accessibility tree.
 * 36px tall, radius 8px, hover #F0F0F0, active #ECECEC, text #0D0D0D, icons #5D5D5D.
 */
export function Nav({ collapsed = false }: { collapsed?: boolean }) {
  const path = usePathname();
  const { items: artifacts } = useArtifacts();
  const artifactCount = artifacts.length;
  const navRef = useRef<HTMLElement>(null);

  return (
    <nav ref={navRef} aria-label="Primary" className={cn("flex min-w-0 max-w-full flex-col items-stretch gap-1 mt-1", collapsed && "lg:items-center")} data-testid="primary-nav" onKeyDown={onNavKeyDown}>
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = isActive(path, href, match);
        return (
          <Tooltip key={href}>
          <TooltipTrigger asChild>
          <Link href={href} aria-current={active ? "page" : undefined} aria-label={label} data-testid={`nav-${href.slice(1)}`}
            className={cn("relative flex h-9 min-h-[36px] shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring", active ? "bg-[#ECECEC] text-[#0D0D0D]" : "text-[#0D0D0D] hover:bg-[#F0F0F0]", collapsed && "lg:size-9 lg:justify-center lg:px-0")}>
            <Icon className="size-4 shrink-0 text-[#5D5D5D]" aria-hidden /><span className={cn(collapsed && "lg:sr-only")}>{label}</span>
            {href === "/artifacts" && artifactCount > 0 && <ArtifactsCount count={artifactCount} collapsed={collapsed} />}
          </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

/**
 * Artifact count merged INTO the Artifacts nav item (no floating badge anywhere in the rail): a small charcoal pill at the right end of the
 * link; icon-only collapsed rail → a neutral dot with the count in `title`. Hidden when there are no artifacts.
 */
function ArtifactsCount({ count, collapsed }: { count: number; collapsed: boolean }) {
  const text = count > 99 ? "99+" : String(count);
  const label = `${count} artifact${count === 1 ? "" : "s"}`;
  return (
    <>
      <span data-testid="nav-artifacts-count" data-count={count} title={label} aria-label={label}
        className={cn("ml-auto hidden min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold leading-5 text-background tabular-nums sm:inline-flex", collapsed && "lg:hidden")}>{text}</span>
      {collapsed && <span data-testid="nav-artifacts-dot" title={label} aria-hidden className="absolute right-1.5 top-1.5 hidden size-2 rounded-full bg-[#0D0D0D] ring-2 ring-background lg:block" />}
    </>
  );
}
