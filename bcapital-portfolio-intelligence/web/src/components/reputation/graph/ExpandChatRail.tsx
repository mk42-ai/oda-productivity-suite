/**
 * v5.0.0 DEF-037 / v5.0.1 (B) — the analyst chat as a docked, resizable RIGHT rail *inside* the correlation canvas wrap while
 * the canvas is expanded (native Fullscreen API or the in-page `.fullscreen-fallback`). The shell's chat dock lives outside the
 * fullscreen element and is therefore invisible in Expand — and since v5.0.1 it is NOT RENDERED at all while the canvas is
 * expanded (`useWorkbench.canvasExpanded`, published by CorrelationGraph): this rail mounts the ONE AND ONLY
 * `<AnalystChat compact />` of the page, so the ASK panel, its subject binding and its transcript are never duplicated.
 *
 * v5.0.1 (B) — the rail no longer draws its own "Chat · Ctrl/Cmd+Shift+U · ×" header: the single `Chat` header (shortcut hint,
 * settings gear, close ×) is the one inside AnalystChat, exactly as in the split layout. Closing it (×, or Ctrl/Cmd+Shift+U)
 * clears the global `chatOpen` flag and the rail disappears; the toolbar `Chat` button / the hotkey bring it back.
 * Resizable 360–720 px by dragging its left edge; the width persists in localStorage.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { create } from 'zustand';
import { ReputationAskPanel } from '../ReputationAskPanel';
import { cx } from '../rilian-ui';

/* Port note (B Capital): the Rilian `useWorkbench.chatOpen` flag becomes a tiny local store; the rail hosts the ported ASK · OnDemand
 * panel (ReputationAskPanel) instead of the workbench Analyst thread. */
interface ChatRailState { chatOpen: boolean; toggleChat: () => void; setChatOpen: (v: boolean) => void }
export const useWorkbench = create<ChatRailState>((set) => ({ chatOpen: false, toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })), setChatOpen: (chatOpen) => set({ chatOpen }) }));

/**
 * v5.1.0 (DEF-047) — the ONE chat toggle of the expanded canvas (toolbar `Chat` button). The top-bar toggle lives outside the
 * fullscreen element and is invisible while expanded; this button and Ctrl/Cmd+Shift+U flip the same `chatOpen` flag that mounts /
 * unmounts the rail below. There is deliberately no second right-edge "Chat · ASK" tab.
 */
export function ExpandChatToggle() {
  const chatOpen = useWorkbench((s) => s.chatOpen);
  const toggleChat = useWorkbench((s) => s.toggleChat);
  return (
    <button type="button" className={cx('btn btn-sm', chatOpen && 'bg-fill-2')} aria-pressed={chatOpen} onClick={toggleChat} title={chatOpen ? 'Close the chat rail' : 'Open the chat rail — ASK · OnDemand'} data-testid="expand-chat-toggle">
      <MessageSquare size={12} />
      Chat
    </button>
  );
}

/** Keeps the rail's pointer / wheel / key events inside the rail — the canvas wrapper and the Expand hook never see them (DEF-047). */
const stop = (e: { stopPropagation(): void }): void => e.stopPropagation();

export const EXPAND_CHAT_RAIL_WIDTH_KEY = 'bcap.reputation.expandChatRailWidth';
export const EXPAND_CHAT_RAIL_MIN = 360;
export const EXPAND_CHAT_RAIL_MAX = 720;
export const EXPAND_CHAT_RAIL_DEFAULT = 420;

export function clampRailWidth(w: number): number {
  if (!Number.isFinite(w)) return EXPAND_CHAT_RAIL_DEFAULT;
  return Math.min(EXPAND_CHAT_RAIL_MAX, Math.max(EXPAND_CHAT_RAIL_MIN, Math.round(w)));
}

function readStoredWidth(): number {
  try {
    const v = Number(globalThis.localStorage?.getItem(EXPAND_CHAT_RAIL_WIDTH_KEY));
    return v >= EXPAND_CHAT_RAIL_MIN && v <= EXPAND_CHAT_RAIL_MAX ? v : EXPAND_CHAT_RAIL_DEFAULT;
  } catch {
    return EXPAND_CHAT_RAIL_DEFAULT;
  }
}

interface ExpandChatRailProps {
  /** True while the canvas is expanded (native fullscreen or in-page fallback). The rail renders nothing otherwise. */
  active: boolean;
}

export function ExpandChatRail({ active }: ExpandChatRailProps) {
  const chatOpen = useWorkbench((s) => s.chatOpen);
  const [width, setWidth] = useState<number>(readStoredWidth);
  const dragging = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(EXPAND_CHAT_RAIL_WIDTH_KEY, String(width));
    } catch {
      /* storage unavailable — width stays in memory */
    }
  }, [width]);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      dragging.current = { startX: e.clientX, startW: width };
      (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    },
    [width],
  );
  const onHandlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragging.current;
    if (!d) return;
    // the handle sits on the LEFT edge: dragging left widens the rail
    setWidth(clampRailWidth(d.startW + (d.startX - e.clientX)));
  }, []);
  const onHandlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  if (!active || !chatOpen) return null;

  return (
    <aside
      className="expand-chat-rail absolute inset-y-0 right-0 z-30 flex flex-col border-l border-hairline bg-surface"
      style={{ width }}
      data-testid="expand-chat-rail"
      data-width={width}
      aria-label="Analyst chat (expanded canvas)"
      onClick={stop}
      onPointerDown={stop}
      onPointerUp={stop}
      onMouseDown={stop}
      onWheel={stop}
      onKeyDown={(e) => {
        // Escape inside the chat (composer, menus) never exits the expanded canvas; the toolbar's Exit button / Esc on the canvas still do
        if (e.key === 'Escape') e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        className="expand-chat-rail-handle absolute inset-y-0 left-0 w-1.5 cursor-col-resize"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat rail"
        aria-valuemin={EXPAND_CHAT_RAIL_MIN}
        aria-valuemax={EXPAND_CHAT_RAIL_MAX}
        aria-valuenow={width}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        data-testid="expand-chat-rail-handle"
      />
      <div className="min-h-0 flex-1 overflow-auto p-2" data-testid="expand-chat-rail-body">
        <ReputationAskPanel />
      </div>
    </aside>
  );
}
