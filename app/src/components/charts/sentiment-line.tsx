"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid } from "recharts";
export default function SentimentLine({ data, ariaLabel }: { data: { t: string; score: number; model?: string | null }[]; ariaLabel: string }) {
  return (
    <div className="h-56 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
          <CartesianGrid stroke="#E5E5E5" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: "#0D0D0D", fontSize: 12 }} tickLine={{ stroke: "#E5E5E5" }} tickFormatter={(v) => String(v).slice(5, 16).replace("T", " ")} stroke="#E5E5E5" />
          <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} tick={{ fill: "#0D0D0D", fontSize: 12 }} tickLine={{ stroke: "#E5E5E5" }} stroke="#E5E5E5" />
          <ReferenceLine y={0} stroke="#E5E5E5" />
          <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E5E5", borderRadius: 8, color: "#0D0D0D", fontSize: 12, boxShadow: "0 1px 2px rgba(0,0,0,.05)" }} formatter={(v) => [(Number(v) > 0 ? "+" : "") + Number(v).toFixed(2), "score"]} labelFormatter={(l) => `${l}`} />
          <Line type="monotone" dataKey="score" stroke="#737373" strokeWidth={2.5} dot={{ r: 4, fill: "#737373" }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
