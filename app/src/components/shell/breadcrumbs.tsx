"use client";
/**
 * Breadcrumbs (QA cycle 9 — Lane A owns this file). `nav[aria-label="Breadcrumb"]` on every route; the dossier page passes an explicit
 * trail (Watchlist › {org}). Stub returns null until Lane A fills it; the signature is frozen so other lanes can mount it.
 */
export type Crumb = { href?: string; label: string };
export function Breadcrumbs({ trail }: { trail?: Crumb[] }) { void trail; return null; }
