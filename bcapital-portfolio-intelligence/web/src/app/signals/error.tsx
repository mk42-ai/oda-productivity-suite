"use client";
import { RouteError } from "@/components/ui/route-error";
/** Segment boundary for /signals: a crash here keeps the nav rail + shell alive and shows the discreet recovery UI. */
export default function SignalsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} scope="signals" />;
}
