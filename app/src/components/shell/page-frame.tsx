"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";

/**
 * Chooses the page frame by route: /chat gets the full-bleed canvas (the thread owns the whole main column, no footer, no 1400 px cap);
 * every other route keeps the centred column + footer. Children are server-rendered and passed through untouched.
 */
export function PageFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/chat" || path?.startsWith("/chat/")) return <main id="main" tabIndex={-1} className="chat-main force-light flex min-h-0 flex-1 flex-col" data-testid="chat-main">{children}</main>;
  return (
    <>
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8" style={{ minHeight: "calc(100dvh - 120px)" }}>
        <Breadcrumbs />
        {children}
      </main>
      {/* a16/Lighthouse: the footer was the dominant CLS source (0.129 desktop / 0.255 mobile) — main reserves the viewport height and the footer
          is fixed-height + contain:layout so hydration never moves it. */}
      <footer className="border-t border-border px-4 py-4 text-xs text-muted sm:px-6 lg:px-8" style={{ minHeight: 56, contain: "layout" }}>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2">
          <span data-testid="footer-disclaimer"><strong>Concept Demonstration — not an official government system.</strong> Public sources only · no government logo or endorsement implied.</span>
          <span>Data namespace uae_cc_v1 · as of 2026-10-21 · <Link href="/methodology" className="underline underline-offset-2">Methodology & limitations</Link></span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="inline-flex items-center gap-1.5" data-testid="engine-credit"><img src="/plugins/ondemand.svg" width={14} height={14} alt="" aria-hidden /><span>Intelligence engine: OnDemand (AIREV)</span></span>
          {/* NEXT_PUBLIC_* are inlined at build (next.config.ts env), so server and client render identical text. */}
          <span data-testid="build-stamp">v{process.env.NEXT_PUBLIC_APP_VERSION} · {process.env.NEXT_PUBLIC_BUILD_COMMIT} · last updated <time dateTime={process.env.NEXT_PUBLIC_BUILD_TIME}>{process.env.NEXT_PUBLIC_BUILD_TIME_LABEL}</time></span>
        </div>
      </footer>
    </>
  );
}
