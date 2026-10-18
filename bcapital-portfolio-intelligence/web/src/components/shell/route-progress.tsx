"use client";
import NextTopLoader from "nextjs-toploader";

/** Route progress bar in Caribbean Green #0AC985 — client-only, client-side navigations only, no spinner. */
export function RouteProgress() {
  return <NextTopLoader color="#0AC985" height={3} showSpinner={false} shadow="0 0 8px #0AC98566" zIndex={1600} />;
}
