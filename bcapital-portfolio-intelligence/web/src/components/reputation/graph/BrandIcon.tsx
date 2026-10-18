/**
 * BrandIcon — every social-platform glyph at an identical box size with equal clear space.
 *
 * Source of the glyphs: `simple-icons` (raw SVG paths, viewBox 0 0 24 24, MIT/CC0) for X, Facebook, TikTok,
 * Instagram, YouTube, Telegram, Reddit, WhatsApp, Snapchat, Threads, Bluesky, Mastodon and Discord.
 * LinkedIn was removed from simple-icons in v14, so it falls back to the official LinkedIn "in" bug from
 * brand.linkedin.com (in-logo.zip → InBug-Black.png, 2025-02-12 build; the official download ships PNG only),
 * rendered through a CSS mask so it is painted in `currentColor` exactly like the SVG paths.
 *
 * Rules: monochrome only (`variant="mono"`), fill = currentColor (black on white); X is forced to pure black
 * (or pure white on a dark ground) per the X brand guidelines; glyph occupies 75 % of the box → 12.5 % clear
 * space on every side; the box itself is a fixed, non-shrinking flex square so a row of icons lines up.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Globe } from 'lucide-react';
import { siBluesky, siDiscord, siFacebook, siInstagram, siMastodon, siReddit, siSnapchat, siTelegram, siThreads, siTiktok, siWhatsapp, siX, siYoutube } from 'simple-icons';
import type { Platform } from '@/lib/reputation/engine/rilian-types';
import { PlatformBadge } from './PlatformBadge';

interface BrandGlyph {
  title: string;
  path: string;
  source: 'simple-icons' | 'brand.linkedin.com';
}

export const BRAND_GLYPHS: Record<Exclude<Platform, 'web' | 'linkedin'>, BrandGlyph> = {
  x: { title: 'X', path: siX.path, source: 'simple-icons' },
  facebook: { title: 'Facebook', path: siFacebook.path, source: 'simple-icons' },
  tiktok: { title: 'TikTok', path: siTiktok.path, source: 'simple-icons' },
  instagram: { title: 'Instagram', path: siInstagram.path, source: 'simple-icons' },
  youtube: { title: 'YouTube', path: siYoutube.path, source: 'simple-icons' },
  telegram: { title: 'Telegram', path: siTelegram.path, source: 'simple-icons' },
  reddit: { title: 'Reddit', path: siReddit.path, source: 'simple-icons' },
  whatsapp: { title: 'WhatsApp', path: siWhatsapp.path, source: 'simple-icons' },
  snapchat: { title: 'Snapchat', path: siSnapchat.path, source: 'simple-icons' },
  threads: { title: 'Threads', path: siThreads.path, source: 'simple-icons' },
  bluesky: { title: 'Bluesky', path: siBluesky.path, source: 'simple-icons' },
  mastodon: { title: 'Mastodon', path: siMastodon.path, source: 'simple-icons' },
  discord: { title: 'Discord', path: siDiscord.path, source: 'simple-icons' },
};

/** Official LinkedIn "in" bug (brand.linkedin.com → in-logo.zip → InBug-Black.png), served from /public. */
export const LINKEDIN_MASK_URL = '/brand/linkedin-inbug-black.png';

export const PLATFORM_LABEL: Record<Platform, string> = {
  x: 'X',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  telegram: 'Telegram',
  reddit: 'Reddit',
  whatsapp: 'WhatsApp',
  snapchat: 'Snapchat',
  threads: 'Threads',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  discord: 'Discord',
  linkedin: 'LinkedIn',
  web: 'Web',
};

interface BrandIconProps {
  platform: Platform;
  /** Outer box size in px (width = height). The glyph is 75 % of it. */
  size?: number;
  /** Monochrome only — kept as a prop so call sites read as intended. */
  variant?: 'mono' | 'badge';
  /** On a black surface X must be pure white instead of pure black. */
  onDark?: boolean;
  className?: string;
  title?: string;
}

export function BrandIcon({ platform, size = 16, variant = 'mono', onDark = false, className, title }: BrandIconProps) {
  const glyph = Math.max(8, Math.round(size * 0.75));
  const label = title ?? PLATFORM_LABEL[platform] ?? platform;
  // v5.0.0 DEF-038 (A4): filled circular platform badge instead of the thin mono ring glyph
  if (variant === 'badge') return <PlatformBadge platform={platform} size={size} title={label} className={className} />;
  const boxStyle: CSSProperties = { width: size, height: size, minWidth: size, minHeight: size };
  if (platform === 'x') boxStyle.color = onDark ? '#FFFFFF' : '#000000';
  let inner: ReactNode;
  if (platform === 'linkedin') {
    const mask: CSSProperties = {
      width: glyph,
      height: glyph,
      backgroundColor: 'currentColor',
      WebkitMaskImage: `url(${LINKEDIN_MASK_URL})`,
      maskImage: `url(${LINKEDIN_MASK_URL})`,
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
    };
    inner = <span aria-hidden="true" style={mask} data-source="brand.linkedin.com" />;
  } else if (platform === 'web') {
    inner = <Globe size={glyph} strokeWidth={1.5} aria-hidden="true" />;
  } else {
    const g = BRAND_GLYPHS[platform];
    inner = (
      <svg viewBox="0 0 24 24" width={glyph} height={glyph} fill="currentColor" aria-hidden="true" focusable="false" data-source={g.source}>
        <path d={g.path} />
      </svg>
    );
  }
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      data-testid="brand-icon"
      data-platform={platform}
      data-variant={variant}
      className={['inline-flex shrink-0 items-center justify-center align-middle leading-none', className].filter(Boolean).join(' ')}
      style={boxStyle}
    >
      {inner}
    </span>
  );
}
