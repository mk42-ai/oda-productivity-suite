/**
 * Rilian UI primitives used by the ported Correlation Engine panels (Communities, Centrality, MatrixHeatmap).
 * `cx`, `Badge`, `Bar` and `EmptyState` are copied VERBATIM from gulf-io-light-workbench/src/ui/index.tsx.
 * `IdChip` keeps the Rilian chip markup but routes its click to the host callback (no workbench inspector here);
 * `BrandIcon` is the Rilian `web` branch (Globe glyph) — the only platform the reputation subjects use.
 */
'use client';
import { type ReactNode } from 'react';
import { Globe } from 'lucide-react';
import type { BadgePattern, Platform } from '@/lib/reputation/engine/rilian-types';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Badge({ pattern = 'solid', children, className, title }: { pattern?: BadgePattern; children: ReactNode; className?: string; title?: string }) {
  return (
    <span className={cx('badge', `badge-${pattern}`, className)} title={title}>
      {children}
    </span>
  );
}

/** Rilian IdChip: same `chip` markup; the inspector is replaced by an optional host callback (`onOpen`). */
export function IdChip({ id, label, className, onOpen }: { id: string; label?: string; className?: string; onOpen?: (id: string) => void }) {
  return (
    <button
      type="button"
      className={cx('chip', className)}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(id);
      }}
      disabled={!onOpen}
      title={onOpen ? `Open ${id}` : id}
    >
      {label ?? id}
    </button>
  );
}

export function Bar({ value, max = 1, className, height = 6 }: { value: number; max?: number; className?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <span className={cx('bar-track block', className)} style={{ height }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span className="bar-fill block" style={{ width: `${pct}%` }} />
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 p-6 text-center">
      <div className="text-[12px] font-medium text-ink">{title}</div>
      {hint && <div className="max-w-[360px] text-[11px] text-secondary">{hint}</div>}
    </div>
  );
}

export function BrandIcon({ platform, size = 16, className, title }: { platform: Platform; size?: number; className?: string; title?: string }) {
  const glyph = Math.max(8, Math.round(size * 0.75));
  return (
    <span role="img" aria-label={title ?? platform} title={title ?? platform} className={cx('inline-flex items-center justify-center', className)} style={{ width: size, height: size, minWidth: size, minHeight: size }}>
      <Globe size={glyph} strokeWidth={1.5} aria-hidden="true" />
    </span>
  );
}
