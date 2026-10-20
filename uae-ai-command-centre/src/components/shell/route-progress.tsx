"use client";
import NextTopLoader from "nextjs-toploader";

/** Route progress bar in Caribbean Green #147B58 — client-only, client-side navigations only, no spinner. */
export function RouteProgress() {
  return <NextTopLoader color="#147B58" height={3} showSpinner={false} shadow="0 0 8px #147B5866" zIndex={1600} />;
}
