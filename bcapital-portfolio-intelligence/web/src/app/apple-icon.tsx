import { ImageResponse } from "next/og";
export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
/** Brand monogram: Caribbean Green rounded square with a bold white "B". */
export default function AppleIcon() {
  const s = size.width;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0AC985", borderRadius: Math.round(s * 0.22), color: "#ffffff", fontSize: Math.round(s * 0.68), fontWeight: 800, fontFamily: "sans-serif", lineHeight: 1 }}>
        B
      </div>
    ),
    { ...size },
  );
}
