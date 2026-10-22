"use client";
import { useEffect } from "react";

/**
 * Root crash boundary: catches errors thrown by the root layout / Shell itself (where app/error.tsx cannot render).
 * Self-contained: renders its own <html>/<body> with inline styles only (no Tailwind, no app-shell imports).
 * Discreet by design: no error.message, stack or digest is ever rendered. Navigation out of a poisoned router state
 * uses hard <a> links so recovery does not depend on the client router.
 */
const link: React.CSSProperties = { color: "#2563EB", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3, padding: "10px 4px" };
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.warn("[global-error]", error?.digest ?? ""); }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", margin: 0, padding: "40px 20px", color: "#0D0D0D", background: "#ffffff" }}>
        <main role="alert" data-testid="global-error" style={{ maxWidth: 480, margin: "40px auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- self-hosted illustration, fixed box → no CLS */}
          <img src="/illustrations/error-offline.webp" width={160} height={160} alt="" aria-hidden data-testid="error-illustration" style={{ width: 160, maxWidth: "100%", height: "auto" }} />
          <h1 style={{ fontSize: 20, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#5D5D5D", margin: 0, lineHeight: 1.5 }}>Please try again. If it keeps happening, reload the page.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginTop: 8 }}>
            <button type="button" onClick={reset} style={{ background: "#0D0D0D", color: "#ffffff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Try again</button>
            <a href="/overview" style={link}>Go to Overview</a>
            <a href="/companies" style={link}>Go to Companies</a>
          </div>
        </main>
      </body>
    </html>
  );
}
