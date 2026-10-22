import type { Metadata } from "next";
import { GRAPH, countBy } from "@/lib/uae/data";
import { SectionHeader } from "@/components/uae/bits";
import { EcoGraph, type GN } from "@/components/uae/eco-graph";

export const metadata: Metadata = {
  title: "Ecosystem Relationship Graph",
  description: "Ownership, investment, partnership and research links between UAE AI organisations.",
};

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const sp = await searchParams;
  const deg = countBy(
    GRAPH.edges.flatMap((e) => [{ id: e.source }, { id: e.target }]),
    (x) => x.id
  );
  const nodes: GN[] = GRAPH.nodes.map((n) => ({ ...n, degree: deg[n.id] ?? 0 }));
  const verified = GRAPH.edges.filter((e) => e.url).length;
  const initialFocus = sp.focus || "g42";

  return (
    <>
      <SectionHeader
        eyebrow="Ecosystem Relationship Graph"
        title="Who owns, funds and partners with whom"
        lede={`${GRAPH.edges.length} relationships between ${GRAPH.nodes.length} organisations (${verified} with a verified source link). G42 ⊃ Core42 / Inception / Khazna / Presight ⊃ AIQ and ATRC ⊃ TII / AI71 are modelled as ownership edges.`}
      />
      <EcoGraph nodes={nodes} edges={GRAPH.edges} initialFocus={initialFocus} />
    </>
  );
}
