/**
 * PlatformBadge — filled circular platform node badges (v5 "friendlier palette" pass, A4).
 *
 * Used for node badges in the correlation/bubble graph legend and for platform glyphs in DOM
 * lists/cards (routed through `BrandIcon` via its `variant="badge"` prop). Inline SVGs only, no
 * external icon CDN. Sizes are the design's 20/28/40 px scale (any positive number also works).
 *
 * `platformBadgeColors` is exported so the canvas sprite painter (BubbleGraph.tsx, owned by another
 * agent — see docs/agent-proofs/A4.md TODOs) can later paint matching filled node sprites instead of
 * the current grayscale rings.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Globe } from 'lucide-react';
import { cx } from '../rilian-ui';

export interface PlatformBadgeColor {
  bg: string;
  fg: string;
  border?: string;
  /** TikTok-style offset accent copies (neutralised — no cyan). */
  accent?: string;
  /** TikTok-style offset accent copies (pink). */
  accent2?: string;
}

/** The platform kinds this badge knows a dedicated glyph for; anything else renders as `unknown`. */
export type KnownPlatformBadge = 'tiktok' | 'x' | 'telegram' | 'reddit' | 'web' | 'medium';
export type PlatformBadgeKind = KnownPlatformBadge | 'unknown' | (string & {});

const KNOWN: ReadonlySet<string> = new Set<KnownPlatformBadge>(['tiktok', 'x', 'telegram', 'reddit', 'web', 'medium']);

/** Fill colours per platform, shared with the canvas sprite painter so DOM badges and canvas nodes match. */
export const platformBadgeColors: Record<KnownPlatformBadge | 'unknown', PlatformBadgeColor> = {
  // B Capital port: the filled badge variant is NOT used on /reputation (canvas glyphs are monochrome); brand fills that were blue/cyan
  // (Telegram sky, TikTok cyan offset) are neutralised to charcoal so no blue token ships in this tree.
  tiktok: { bg: '#000000', fg: '#ffffff', accent: '#8e8c85', accent2: '#fe2c55' },
  x: { bg: '#000000', fg: '#ffffff' },
  telegram: { bg: '#141413', fg: '#ffffff' },
  reddit: { bg: '#ff4500', fg: '#ffffff' },
  web: { bg: '#ffffff', fg: '#8e8c85', border: '#d9d7ce' },
  medium: { bg: '#ffffff', fg: '#141413', border: '#e8e6dc' },
  unknown: { bg: '#8e8c85', fg: '#ffffff' },
};

export const PLATFORM_BADGE_LABEL: Record<KnownPlatformBadge | 'unknown', string> = {
  tiktok: 'TikTok',
  x: 'X',
  telegram: 'Telegram',
  reddit: 'Reddit',
  web: 'Web / news',
  medium: 'Medium',
  unknown: 'Unknown platform',
};

function resolveKey(platform: string): KnownPlatformBadge | 'unknown' {
  return KNOWN.has(platform) ? (platform as KnownPlatformBadge) : 'unknown';
}

function Note({ fill, offset }: { fill: string; offset?: string }): ReactNode {
  return (
    <g transform={offset} fill={fill}>
      <circle cx="9.2" cy="16" r="3.2" />
      <path d="M12 4h2.6c.3 1.9 1.7 3.3 3.6 3.6V10a6.7 6.7 0 0 1-3.6-1.1V16a5.6 5.6 0 1 1-2.6-4.7V4Z" />
    </g>
  );
}

function glyphFor(key: KnownPlatformBadge | 'unknown', platform: string, colors: PlatformBadgeColor): ReactNode {
  switch (key) {
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" width="62%" height="62%" aria-hidden="true">
          {colors.accent2 && <Note fill={colors.accent2} offset="translate(-1.1,0.9)" />}
          {colors.accent && <Note fill={colors.accent} offset="translate(1.1,-0.9)" />}
          <Note fill={colors.fg} />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" width="52%" height="52%" aria-hidden="true">
          <path d="M5 5L19 19M19 5L5 19" stroke={colors.fg} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true">
          <path d="M20.4 4.4 3.3 11.2c-1.1.45-1.1 1.08-.2 1.36l4.4 1.37 1.7 5.2c.2.56.36.78.73.78.32 0 .47-.15.66-.33l1.86-1.8 4.1 3.03c.75.42 1.3.2 1.5-.7l2.7-13.03c.3-1.15-.4-1.62-1.35-1.3Z" fill={colors.fg} />
        </svg>
      );
    case 'reddit':
      return (
        <svg viewBox="0 0 24 24" width="66%" height="66%" aria-hidden="true">
          <circle cx="12" cy="9.5" r="1.6" fill="none" stroke={colors.fg} strokeWidth={1.4} />
          <line x1="12" y1="7.9" x2="12" y2="4.6" stroke={colors.fg} strokeWidth={1.3} />
          <ellipse cx="12" cy="14.6" rx="6.4" ry="4.6" fill={colors.fg} />
          <circle cx="9.2" cy="14.2" r="1.05" fill={colors.bg} />
          <circle cx="14.8" cy="14.2" r="1.05" fill={colors.bg} />
          <path d="M9 17c1 .8 4.9.8 6 0" stroke={colors.bg} strokeWidth={0.9} fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'web':
      return <Globe size="58%" strokeWidth={1.6} color={colors.fg} aria-hidden="true" />;
    case 'medium':
      return (
        <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden="true">
          <text x="12" y="16.5" textAnchor="middle" fontFamily="Georgia, serif" fontSize="15" fontWeight="700" fill={colors.fg}>
            M
          </text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width="58%" height="58%" aria-hidden="true">
          <text x="12" y="16.5" textAnchor="middle" fontFamily="var(--font-sans, sans-serif)" fontSize="13" fontWeight="600" fill={colors.fg}>
            {(platform || '?').charAt(0).toUpperCase()}
          </text>
        </svg>
      );
  }
}

export interface PlatformBadgeProps {
  /** Any platform string; unrecognised values fall back to a grey initial-letter badge. */
  platform: PlatformBadgeKind;
  /** Outer diameter in px. Design scale is 20 / 28 / 40. */
  size?: number;
  /** 2px brand-green ring — the node is the active/inspected selection. */
  selected?: boolean;
  /** 60% opacity — the node is filtered out / not in the current focus set. */
  dimmed?: boolean;
  className?: string;
  title?: string;
}

export function PlatformBadge({ platform, size = 28, selected = false, dimmed = false, className, title }: PlatformBadgeProps) {
  const key = resolveKey(platform);
  const colors = platformBadgeColors[key];
  const label = title ?? (key === 'unknown' && platform ? String(platform) : PLATFORM_BADGE_LABEL[key]);
  const style: CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    background: colors.bg,
    border: colors.border ? `1px solid ${colors.border}` : '1px solid transparent',
  };
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      data-testid="platform-badge"
      data-platform={platform}
      data-size={size}
      data-selected={selected ? '1' : '0'}
      data-dimmed={dimmed ? '1' : '0'}
      className={cx('platform-badge', selected && 'platform-badge-selected', dimmed && 'platform-badge-dimmed', className)}
      style={style}
    >
      {glyphFor(key, String(platform), colors)}
    </span>
  );
}
