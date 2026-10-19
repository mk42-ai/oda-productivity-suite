/**
 * Rilian types used by the ported correlation engine — copied VERBATIM from gulf-io-light-workbench/src/types.ts
 * (only the Platform / PLATFORMS / BadgePattern / Post declarations the engine imports).
 */
export type Platform =
  | 'tiktok'
  | 'x'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'telegram'
  | 'reddit'
  | 'whatsapp'
  | 'snapchat'
  | 'threads'
  | 'bluesky'
  | 'mastodon'
  | 'discord'
  | 'linkedin'
  | 'web';
export const PLATFORMS: Platform[] = ['tiktok', 'x', 'facebook', 'instagram', 'youtube', 'telegram', 'reddit', 'whatsapp', 'snapchat', 'threads', 'bluesky', 'mastodon', 'discord', 'linkedin', 'web'];

export type BadgePattern = 'solid' | 'dashed' | 'dotted' | 'double' | 'hatched' | 'muted';

export interface Post {
  id: string;
  handle: string;
  platform: Platform;
  ts: string; // ISO datetime
  text: string;
  urls: string[];
  hashtags: string[];
  sharedId: string | null; // shared object (video / clip / article id) → co-share
  replyTo: string | null; // target post id or handle → co-reply
  narrativeId: string | null;
  networkId: string | null;
  templateId: string | null; // caption template family (NET-002 style)
  synthetic: boolean; // false only for posts quoted verbatim from a case file / web item
  evidenceId?: string | null; // EVID row the post is quoted from
  /** v5.2 (fix A): precision of the SOURCE timestamp — date-only rows never satisfy a sub-day window. */
  tsPrecision?: 'second' | 'minute' | 'hour' | 'date';
}
