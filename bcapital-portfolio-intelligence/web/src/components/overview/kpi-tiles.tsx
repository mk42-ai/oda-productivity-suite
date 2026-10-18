import { Sparkline } from "@/components/charts/sparkline";
import "./kpi-tiles.css";

export type KpiTile = { label: string; value: string; sub?: string; spark?: number[]; sparkLabel?: string; valueColor?: string };

/** Overview stat tiles: brand-green top accent line, green value ink (#067a52, AA), optional real-data sparkline, soft dividers. */
export function KpiTiles({ tiles }: { tiles: KpiTile[] }) {
  return (
    <dl className="kpi-tiles mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7" data-testid="kpi-tiles">
      {tiles.map((t) => (
        <div key={t.label} className="kpi-tile card" data-testid="kpi-tile">
          <dt className="kpi-tile__label">{t.label}</dt>
          <dd className="kpi-tile__value font-display" style={t.valueColor ? { color: t.valueColor } : undefined}>{t.value}</dd>
          {t.spark && t.spark.length > 1 && (
            <dd className="kpi-tile__spark" data-testid="kpi-tile-spark">
              <Sparkline values={t.spark} width={96} height={22} stroke="#0AC985" accent="#067a52" fill ariaLabel={t.sparkLabel} />
            </dd>
          )}
          {t.sub && <dd className="kpi-tile__sub">{t.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}
