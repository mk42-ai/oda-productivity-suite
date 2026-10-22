/**
 * Organisation logo resolution (QA cycle 9, Lane C owns this file).
 * Stub re-exporting the pre-cycle-9 behaviour so parallel lanes can import a stable interface:
 *   logoFor(id)        → primary <img src> or null (monogram fallback)
 *   logoSrcSet(id)     → optional srcSet string for retina (null when unavailable)
 *   logoProvenance(id) → { status, source?, reason?, ... }
 */
import { logoFor as _logoFor, logoProvenance as _logoProvenance } from "./data";
export const logoFor = (id: string): string | null => _logoFor(id);
export const logoSrcSet = (_id: string): string | null => null;
export const logoProvenance = (id: string) => _logoProvenance(id);
