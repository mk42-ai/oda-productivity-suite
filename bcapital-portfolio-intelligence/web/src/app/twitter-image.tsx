import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
export const runtime = "nodejs"; // Vercel services with bindings only run Node functions (no Edge)
export const alt = "B Capital Portfolio Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
/** Twitter card (same design as opengraph-image.tsx; duplicated because segment config like `runtime` must be declared statically, not re-exported).
 *  OG card: self-hosted text-free backdrop + live charcoal text, green "B" monogram and a thin green bottom bar. */
export default async function TwitterImage() {
  const bg = await readFile(path.join(process.cwd(), "public/og/og-backdrop.jpg"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#ffffff", color: "#1F2328", fontFamily: "sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={`data:image/jpeg;base64,${bg.toString("base64")}`} width={1200} height={630} style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", paddingLeft: 80, paddingRight: 80 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: "#0AC985", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 800 }}>B</div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, marginTop: 28, lineHeight: 1.05, letterSpacing: -1 }}>B Capital</div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 600, marginTop: 6, lineHeight: 1.1 }}>Portfolio Intelligence</div>
          <div style={{ display: "flex", fontSize: 26, color: "#3b3f45", marginTop: 24 }}>Portfolio · Signals · News · Reputation</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: "#0AC985", display: "flex" }} />
      </div>
    ),
    { ...size },
  );
}
