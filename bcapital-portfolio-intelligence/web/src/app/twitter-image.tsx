import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
export const runtime = "nodejs"; // Vercel services with bindings only run Node functions (no Edge)
export const alt = "B Capital Portfolio Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
/** Twitter card (same design as opengraph-image.tsx; duplicated because segment config like `runtime` must be declared statically, not re-exported).
 *  OG card: self-hosted text-free backdrop (artwork on the right) + live charcoal text in the empty left area, small green accent bar. */
export default async function TwitterImage() {
  const bg = await readFile(path.join(process.cwd(), "public/og/og-backdrop.jpg"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#ffffff", color: "#1F2328", fontFamily: "sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={`data:image/jpeg;base64,${bg.toString("base64")}`} width={1200} height={630} style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630 }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 704, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", paddingLeft: 84 }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
            <div style={{ display: "flex", width: 64, height: 6, borderRadius: 3, background: "#0AC985", marginBottom: 28 }} />
            <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1, color: "#1F2328" }}>B Capital</div>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 600, marginTop: 8, lineHeight: 1.1, color: "#1F2328" }}>Portfolio Intelligence</div>
            <div style={{ display: "flex", fontSize: 26, color: "#3b3f45", marginTop: 26, lineHeight: 1.35 }}>Signals, news and reputation across the B Capital portfolio</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
