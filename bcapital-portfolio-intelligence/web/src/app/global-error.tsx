"use client";
import { useEffect } from "react";

/**
 * Root crash boundary: catches errors thrown by the root layout / Shell itself
 * (where app/error.tsx cannot render). Navigation out of a poisoned router state
 * uses hard <a> links so recovery does not depend on the client router.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 40, color: "#111" }}>
        <main>
          <h1>Something went wrong</h1>
          <p>{error.message || "Unexpected error"}{error.digest ? ` (ref ${error.digest})` : ""}</p>
          <p style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={reset}>Try again</button>
            <a href="/overview">Go to Overview</a>
            <a href="/companies">Go to Companies</a>
          </p>
        </main>
      </body>
    </html>
  );
}
