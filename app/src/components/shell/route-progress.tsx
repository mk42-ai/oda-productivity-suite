"use client";
import NextTopLoader from "nextjs-toploader";

/** Route progress bar in ink #0D0D0D — client-only, client-side navigations only, no spinner. */
export function RouteProgress() {
  return <NextTopLoader color="#0D0D0D" height={3} showSpinner={false} shadow="0 0 8px #0D0D0D66" zIndex={1600} />;
}
