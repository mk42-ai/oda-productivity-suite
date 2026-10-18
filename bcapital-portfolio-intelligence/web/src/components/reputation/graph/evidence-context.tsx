'use client';
/**
 * Evidence lookup shared by the ported graph panels (LinkWhyPanel, GraphTooltip hosts). The rows come from /api/reputation/graph
 * (`evidence` map: the trail refs of every edge + the newest rows of every node). Replaces the Rilian per-investigation ledger
 * (`resolveEvidenceRef`) with a plain id → row map — the chip / context markup is unchanged.
 */
import { createContext, useCallback, useContext, type ReactNode } from 'react';

export type EvidenceRow = { id: string; title: string; url?: string | null; source?: string | null; publishedAt?: string | null; excerpt?: string | null; claimStatus?: string | null; reliability?: string | null; entity?: string; category?: string; sentiment?: number };
export const REPUTATION_INVESTIGATION = { id: 'BCAP-REP', cycle: 1, baseline: '2026-10-18' } as const;

const Ctx = createContext<Record<string, EvidenceRow>>({});
export function EvidenceProvider({ rows, children }: { rows: Record<string, EvidenceRow>; children: ReactNode }) {
  return <Ctx.Provider value={rows}>{children}</Ctx.Provider>;
}
export function useEvidenceLookup(): (id: string) => EvidenceRow | undefined {
  const rows = useContext(Ctx);
  return useCallback((id: string) => rows[id], [rows]);
}
