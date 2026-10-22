"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Crumb = { href?: string; label: string };

const ROUTE_LABELS: Record<string, Crumb[]> = {
  "/overview": [{ href: "/overview", label: "National Overview" }],
  "/watchlist": [{ href: "/overview", label: "Overview" }, { label: "Watchlist" }],
  "/watchlist/compare": [
    { href: "/overview", label: "Overview" },
    { href: "/watchlist", label: "Watchlist" },
    { label: "Compare" },
  ],
  "/news": [{ href: "/overview", label: "Overview" }, { label: "News Intelligence" }],
  "/radar": [{ href: "/overview", label: "Overview" }, { label: "Tech Radar" }],
  "/graph": [{ href: "/overview", label: "Overview" }, { label: "Ecosystem Graph" }],
  "/sentiment": [{ href: "/overview", label: "Overview" }, { label: "Sentiment Universe" }],
  "/chat": [{ href: "/overview", label: "Overview" }, { label: "Executive Chat" }],
  "/briefing": [{ href: "/overview", label: "Overview" }, { label: "National Briefing" }],
  "/methodology": [{ href: "/overview", label: "Overview" }, { label: "Methodology" }],
  "/artifacts": [{ href: "/overview", label: "Overview" }, { label: "Artifacts" }],
  "/settings": [{ href: "/overview", label: "Overview" }, { label: "Settings" }],
  "/plugins": [
    { href: "/overview", label: "Overview" },
    { href: "/settings", label: "Settings" },
    { label: "Plugins" },
  ],
  "/docs/interactive-ui": [
    { href: "/overview", label: "Overview" },
    { href: "/methodology", label: "Methodology" },
    { label: "Interactive UI" },
  ],
};

export function Breadcrumbs({ trail }: { trail?: Crumb[] }) {
  const pathname = usePathname();

  let resolvedTrail: Crumb[] | undefined = trail;

  if (!resolvedTrail) {
    if (!pathname || pathname === "/") return null;

    // Dossier page (/watchlist/[id], but not compare) supplies its own trail
    if (/^\/watchlist\/[^/]+$/.test(pathname) && pathname !== "/watchlist/compare") {
      return null;
    }

    // Only known routes get an auto-derived trail. Unknown paths (incl. the 404 boundary, where the server renders "/_not-found" while the
    // client sees the typed URL) render nothing — deriving a trail from the path segments caused a React #418 hydration mismatch on 404s.
    if (!ROUTE_LABELS[pathname]) return null;
    resolvedTrail = ROUTE_LABELS[pathname];
  }

  if (!resolvedTrail || resolvedTrail.length < 2) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" data-testid="breadcrumbs" className="mb-3 text-[12px] text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {resolvedTrail.map((crumb, idx) => {
          const isLast = idx === resolvedTrail.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span aria-hidden="true" className="text-muted/60 select-none">›</span>}
              {isLast || !crumb.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-foreground font-medium" : "text-muted"}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted hover:text-foreground hover:underline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
