import type { Metadata } from "next";
import { META, ORGS, SENTIMENT, NEWS, GRAPH, HF, RADAR, coverageStats, countBy, classCounts, SENT_CLASSES } from "@/lib/uae/data";
import { SectionHeader, Panel } from "@/components/uae/bits";
export const metadata: Metadata = { title: "Methodology & limitations" };
export default function MethodologyPage() {
  const cov = coverageStats(); const types = countBy(ORGS, (o) => o.type); const cc = classCounts(); const plat = countBy(SENTIMENT, (r) => r.platform);
  return (
    <>
      <SectionHeader eyebrow="Methodology" title="How this concept was built — and what it cannot tell you" lede={META.disclaimer} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Identity & disclaimer" testId="m-identity"><ul className="ml-4 list-disc space-y-1 text-sm text-muted">
          <li>{META.identity_check}</li><li data-testid="engine-credit">Intelligence engine: OnDemand (AIREV) — chat sessions, the 06:30 GST briefing and the 2-hourly ingest run through the OnDemand Chat and Agents Flow Builder APIs; every answer is split into Verified (cited) and Interpretation, and API failures are shown as an unavailable state, never substituted.</li><li>Concept identity only (neural lattice + dune contours; monochrome / clean white). No falcon, emblem or government mark.</li>
          <li>Persistent disclaimer on every route and in every generated briefing: “{META.disclaimer}”.</li>
          <li>Organisation logos: only icons fetched from each organisation’s own official domain; government entities and all others use a monogram.</li></ul></Panel>
        <Panel title="Data namespace" testId="m-namespace"><dl className="grid grid-cols-[150px_1fr] gap-y-1 text-sm"><dt className="text-muted">Namespace</dt><dd><code>{META.namespace}</code> (fresh; no records from any previous build)</dd><dt className="text-muted">Generated</dt><dd>{META.generated_at}</dd><dt className="text-muted">As of</dt><dd>{META.as_of}</dd><dt className="text-muted">Demo window</dt><dd>{META.demo_window}</dd>
          <dt className="text-muted">Organisations</dt><dd>{ORGS.length} — {Object.entries(types).map(([k, v]) => `${v} ${k}`).join(", ")}</dd><dt className="text-muted">Coverage</dt><dd>{Math.round(cov.meanCoverage * 100)}% mean field coverage · {cov.withVerifiedSource}/{ORGS.length} with ≥1 verified source URL · {cov.highConfidence} ≥75% confidence</dd>
          <dt className="text-muted">Statements</dt><dd>{SENTIMENT.length} · {SENT_CLASSES.map((k) => `${k} ${cc[k]}`).join(" · ")}</dd><dt className="text-muted">Platforms</dt><dd>{Object.entries(plat).map(([k, v]) => `${k} ${v}`).join(" · ")}</dd>
          <dt className="text-muted">News / graph / HF / radar</dt><dd>{NEWS.length} events · {GRAPH.edges.length} edges · {HF.models.length} models · {RADAR.length} radar blips</dd></dl></Panel>
        <Panel title="Pipeline (all AI steps via OnDemand)" testId="m-pipeline"><ol className="ml-4 list-decimal space-y-1 text-sm text-muted">
          <li>Research: OnDemand plugins — Perplexity, GPT Search, Internet search, Wikipedia, HuggingFace — 125 calls captured in the step 1–8 plugin payload.</li>
          <li>Org intel + source verification: one OnDemand chat session per organisation (POST /chat/v1/sessions/&#123;id&#125;/query, predefined-gpt-5.6-luna) structures a dossier from research snippets + mission-brief seed facts; every cited URL is then checked against the research corpus and removed if absent.</li>
          <li>Sentiment ingestion + entity extraction: OnDemand agent extracts attributable statements and location evidence; de-duplicated; then topic classification into 7 classes + topic clusters with confidence.</li>
          <li>News retrieval + relationship mapping: OnDemand agent extracts dated events, radar rings and org-to-org edges; ownership edges from the mission brief.</li>
          <li>Briefings and executive chat: live OnDemand sessions at request time, grounded on this namespace, with the Perplexity plugin for fresh web research.</li></ol></Panel>
        <Panel title="Limitations" testId="m-limits"><ul className="ml-4 list-disc space-y-1 text-sm text-muted">
          <li>{META.sampling}</li><li>Native X, TikTok, YouTube and Instagram ingestion was not run for this namespace (those platforms appear only when quoted in reporting).</li>
          <li>Some leaders, dates and ownership splits conflict between sources (e.g. TII CEO: Dr Ray O. Johnson named Sep 2026 vs earlier sources citing Najwa Aaraj). Conflicts are flagged on the dossier, not resolved silently.</li>
          <li>HuggingFace search results for inception42 and IFM do not return download/like counts; shown as n/a. The inceptionai, LLM360, core42 and g42 HF orgs returned 0 models.</li>
          <li>Lucidya (Riyadh HQ) is excluded; “AIREV / airev.aero / Rani Plaut” is a different entity and was rejected.</li>
          <li>No live data is fabricated: where a value is missing the UI says “unavailable”.</li></ul></Panel>
      </div>
    </>
  );
}
