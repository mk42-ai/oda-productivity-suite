"use client";
import { RouteError } from "@/components/ui/route-error";
/** Segment boundary for /social: a crash here keeps the nav rail + shell alive and shows the discreet recovery UI. */
export default function SocialError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} scope="social" />;
}
