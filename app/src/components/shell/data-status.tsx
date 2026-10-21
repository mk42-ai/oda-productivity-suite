import { META, ORGS, SENTIMENT, NEWS } from "@/lib/uae/data";
/** Namespace + record counts badge in the rail (replaces the old backend liveness badge — this build is served from the uae_cc_v1 seed namespace). */
export function DataStatus() {
  return (
    <span data-testid="data-status" className="inline-flex flex-col gap-0.5 text-[10.5px] leading-tight text-muted" title={`namespace ${META.namespace} · generated ${META.generated_at}`}>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden className="inline-block size-1.5 rounded-full bg-foreground" />Namespace <code>{META.namespace}</code></span>
      <span>{ORGS.length} orgs · {SENTIMENT.length} voices · {NEWS.length} news</span>
    </span>
  );
}
