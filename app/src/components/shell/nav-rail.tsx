"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Menu, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { Nav } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useThreadNav } from "@/components/chat/open-intelligent-ui/thread-nav-store";
import { cn } from "@/lib/utils";

const KEY = "uaecc.nav.rail";
/** Expanded width (px), exposed as CSS var `--rail-w`. Hard cap: ≤ 224 px when expanded; 64 px icon-only when collapsed, persisted in localStorage. */
export const NAV_EXPANDED_PX = 224;
export const NAV_COLLAPSED_PX = 64;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

/**
 * The ONE primary navigation rail:
 * - Desktop (≥ lg): 224px expanded / 64px collapsed, persisted in localStorage.
 *   On /chat, lists recent threads below the primary nav.
 * - Mobile (< lg): sticky 52px top bar with hamburger button opening an off-canvas drawer (280px max 85vw).
 */
export function NavRail({ status }: { status?: React.ReactNode }) {
  const path = usePathname();
  const onChat = path?.startsWith("/chat") ?? false;
  const isDesktop = useIsDesktop();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { threads, selectedId, select, newThread } = useThreadNav();
  const recentThreads = threads.filter((t) => !t.isPending).slice(0, 12);
  const activeThread = threads.find((t) => t.id === selectedId);

  useEffect(() => {
    let v: string | null = null;
    try {
      v = window.localStorage.getItem(KEY);
    } catch {
      /* ignore */
    }
    setCollapsed(v ? v === "collapsed" : onChat);
    setMounted(true);
  }, [onChat]);

  // Close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  // Lock body scroll and listen for Escape key when mobile drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const toggle = () =>
    setCollapsed((c) => {
      const n = !c;
      try {
        window.localStorage.setItem(KEY, n ? "collapsed" : "expanded");
      } catch {
        /* ignore */
      }
      return n;
    });

  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <>
      {/* Mobile top bar (< lg) — 52px, white, border-bottom #E5E5E5 */}
      <nav
        aria-label="Mobile navigation"
        className="sticky top-[var(--disc-h)] z-40 flex h-[52px] w-full items-center justify-between border-b border-[#E5E5E5] bg-white px-3 dark:border-neutral-800 dark:bg-background lg:hidden"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            data-testid="rail-drawer-toggle"
            aria-expanded={drawerOpen}
            aria-controls="rail-drawer"
            aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
            title="Open navigation"
            className="inline-flex size-8 items-center justify-center rounded-md text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Link href="/overview" className="flex items-center gap-2 rounded-lg px-1 py-1" data-testid="brand-home">
            <BrandLogo height={26} />
            <span className="sr-only">Home</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {onChat && recentThreads.length > 0 && (
            <div className="relative">
              <details className="oiu-threads" data-testid="rail-mobile-threads">
                <summary className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-2 text-xs font-medium text-[#0D0D0D]">
                  <MessageSquare className="size-3.5 text-[#5D5D5D]" aria-hidden />
                  <span className="max-w-[120px] truncate">{activeThread?.title || "Chats"}</span>
                </summary>
                <ul className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-lg border border-[#E5E5E5] bg-white p-1 shadow-sm">
                  {recentThreads.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={(e) => {
                          select(t.id);
                          (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left",
                          t.id === selectedId ? "bg-[#ECECEC] text-[#0D0D0D]" : "hover:bg-[#F0F0F0] text-[#0D0D0D]"
                        )}
                      >
                        <span className="truncate">{t.title || "Untitled thread"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
          <ThemeToggle compact />
        </div>
      </nav>

      {/* Mobile off-canvas drawer (< lg) */}
      {!isDesktop && (
        <>
          {drawerOpen && (
            <div
              data-testid="rail-overlay"
              aria-hidden="true"
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 transition-opacity"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            />
          )}
          <aside
            id="rail-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
            data-testid="rail-drawer"
            aria-hidden={!drawerOpen}
            inert={!drawerOpen || undefined}
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex h-dvh w-[280px] max-w-[85vw] flex-col border-r border-[#E5E5E5] bg-[#F9F9F9] p-3 shadow-lg transition-transform duration-200 ease-out",
              drawerOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
            )}
          >
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <Link
                href="/overview"
                className="flex items-center gap-2 rounded-lg px-1 py-1"
                data-testid="brand-home"
                onClick={() => setDrawerOpen(false)}
              >
                <BrandLogo height={26} />
                <span className="sr-only">Home</span>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="inline-flex size-8 items-center justify-center rounded-md text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D]"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-2">
              <Nav collapsed={false} />

              {onChat && (
                <div className="mt-4 flex flex-col border-t border-[#E5E5E5] pt-3" data-testid="rail-chats-section">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-semibold text-[#5D5D5D]">Chats</span>
                    <button
                      type="button"
                      onClick={() => {
                        newThread();
                        setDrawerOpen(false);
                      }}
                      data-testid="rail-new-chat"
                      aria-label="New chat"
                      title="New chat"
                      className="inline-flex size-7 items-center justify-center rounded-md text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D]"
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </div>
                  <div className="mt-1 space-y-0.5" data-testid="rail-chats-list">
                    {recentThreads.length === 0 && (
                      <p className="px-2 py-2 text-xs text-[#8E8E8E]">No chats yet</p>
                    )}
                    {recentThreads.map((t) => {
                      const active = t.id === selectedId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            select(t.id);
                            setDrawerOpen(false);
                          }}
                          data-testid="rail-chat-item"
                          data-thread-id={t.id}
                          title={t.title || "Untitled thread"}
                          className={cn(
                            "flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-xs font-medium transition-colors",
                            active ? "bg-[#ECECEC] text-[#0D0D0D]" : "text-[#0D0D0D] hover:bg-[#F0F0F0]"
                          )}
                        >
                          <MessageSquare className="size-4 shrink-0 text-[#5D5D5D]" aria-hidden />
                          <span className="truncate flex-1" data-testid="thread-title">
                            {t.title || "Untitled thread"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto border-t border-[#E5E5E5] pt-2 flex items-center justify-between">
              <ThemeToggle compact={false} />
              <Suspense fallback={null}>{status}</Suspense>
            </div>
          </aside>
        </>
      )}

      {/* Desktop navigation rail (≥ lg) */}
      <aside
        data-testid="nav-rail"
        data-collapsed={collapsed ? "true" : "false"}
        data-mounted={mounted ? "true" : "false"}
        style={{
          ["--rail-w" as string]: `${NAV_EXPANDED_PX}px`,
          ["--rail-w-collapsed" as string]: `${NAV_COLLAPSED_PX}px`,
          ["--nav-w" as string]: collapsed ? "var(--rail-w-collapsed)" : "var(--rail-w)",
        }}
        className={cn(
          "hidden lg:flex lg:h-[calc(100dvh-var(--disc-h))] lg:w-[var(--nav-w)] lg:shrink-0 lg:flex-col lg:items-stretch lg:justify-start lg:border-r lg:border-[#E5E5E5] lg:bg-[#F9F9F9] lg:px-2 lg:py-3 lg:transition-[width] z-40 sticky top-[var(--disc-h)]",
        )}
        aria-label="Primary navigation"
      >
        <div className={cn("flex items-center", collapsed ? "lg:justify-center" : "lg:justify-between lg:px-1")}>
          <Link
            href="/overview"
            className={cn("flex items-center gap-2 rounded-lg px-1 py-1", collapsed && "lg:hidden")}
            data-testid="brand-home"
          >
            <BrandLogo height={26} />
            <span className="sr-only">Home</span>
          </Link>
          <span data-testid="nav-toggle" className="hidden shrink-0 lg:inline-flex">
            <button
              type="button"
              onClick={toggle}
              data-testid="rail-toggle"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              title={collapsed ? "Expand navigation" : "Collapse navigation"}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Icon className="size-4" aria-hidden />
            </button>
          </span>
        </div>

        {isDesktop && <Nav collapsed={collapsed} />}

        {/* On /chat: recent threads in rail */}
        {onChat && isDesktop && (
          !collapsed ? (
            <div className="mt-3 flex flex-1 flex-col min-h-0 border-t border-[#E5E5E5] pt-2" data-testid="rail-chats-section">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-semibold text-[#5D5D5D]">Chats</span>
                <button
                  type="button"
                  onClick={() => newThread()}
                  data-testid="rail-new-chat"
                  aria-label="New chat"
                  title="New chat"
                  className="inline-flex size-7 items-center justify-center rounded-md text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D]"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-0.5 px-1 min-h-0" data-testid="rail-chats-list">
                {recentThreads.length === 0 && (
                  <p className="px-2 py-2 text-xs text-[#8E8E8E]">No chats yet</p>
                )}
                {recentThreads.map((t) => {
                  const active = t.id === selectedId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => select(t.id)}
                      data-testid="rail-chat-item"
                      data-thread-id={t.id}
                      title={t.title || "Untitled thread"}
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-xs font-medium transition-colors",
                        active ? "bg-[#ECECEC] text-[#0D0D0D]" : "text-[#0D0D0D] hover:bg-[#F0F0F0]"
                      )}
                    >
                      <MessageSquare className="size-4 shrink-0 text-[#5D5D5D]" aria-hidden />
                      <span className="truncate flex-1" data-testid="thread-title">
                        {t.title || "Untitled thread"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-center gap-1 border-t border-[#E5E5E5] pt-2" data-testid="rail-chats-collapsed">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => newThread()}
                    data-testid="rail-new-chat"
                    aria-label="New chat"
                    className="flex size-9 items-center justify-center rounded-lg text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D]"
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">New chat</TooltipContent>
              </Tooltip>
              {recentThreads.slice(0, 5).map((t) => {
                const active = t.id === selectedId;
                return (
                  <Tooltip key={t.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => select(t.id)}
                        data-testid="rail-chat-item"
                        data-thread-id={t.id}
                        aria-label={t.title || "Untitled thread"}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          active ? "bg-[#ECECEC] text-[#0D0D0D]" : "text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D]"
                        )}
                      >
                        <MessageSquare className="size-4 shrink-0" aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{t.title || "Untitled thread"}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )
        )}

        {/* ⌘K hint */}
        <button
          type="button"
          data-testid="cmdk-hint"
          onClick={() => window.dispatchEvent(new Event("uaecc:cmdk"))}
          aria-label="Search organisations (Ctrl or Cmd + K)"
          title="Search organisations (⌘K / Ctrl+K)"
          className={cn(
            "mt-1 hidden items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#5D5D5D] hover:bg-[#F0F0F0] hover:text-[#0D0D0D] focus-visible:outline-2 focus-visible:outline-ring lg:inline-flex",
            collapsed && "lg:justify-center lg:px-0"
          )}
        >
          <Command className="size-4 shrink-0" aria-hidden />
          <span className={cn(collapsed && "lg:sr-only")}>
            Search <kbd className="ml-1 rounded border border-[#E5E5E5] bg-surface-2 px-1 font-mono text-[10px]">⌘K</kbd>
          </span>
        </button>

        <div className={cn("flex items-center gap-2 lg:mt-auto lg:flex-col lg:items-start", collapsed ? "lg:items-center" : "lg:px-2")}>
          <ThemeToggle compact={collapsed} />
          <span className={cn("hidden lg:block", collapsed && "lg:hidden")}>
            <Suspense fallback={null}>{status}</Suspense>
          </span>
        </div>
      </aside>
    </>
  );
}
