/**
 * Background plates for Reputation & Prestige — the four uploaded plates, self-hosted under /public/reputation (never hotlinked:
 * the upload blob URLs expire). Mapping (brief 2026-10-18):
 *   Fkray2Nt1A → section hero (content on the left half) · 3Ha2Gnbdlt → B Capital firm card backdrop
 *   kmAXRIzvSH → leadership cards (headshot sits inside the plate's empty ring) · gNQTYRN0OI → correlation-matrix panel texture.
 * Ring geometry measured on the 1536×1024 master: centre (479.5, 462.5), r ≈ 237 px.
 */
export const PLATES = {
  hero: '/reputation/plate-hero-Fkray2Nt1A.jpg',
  firm: '/reputation/plate-firm-3Ha2Gnbdlt.jpg',
  leader: '/reputation/plate-leadership-kmAXRIzvSH.jpg',
  matrix: '/reputation/plate-matrix-gNQTYRN0OI.jpg',
} as const;
export const LEADER_RING = { cx: 479.5 / 1536, cy: 462.5 / 1024, r: 237 / 1536 } as const;
export type Plates = typeof PLATES;
