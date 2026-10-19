"use client";
import { RouteError } from "@/components/ui/route-error";
/** Segment boundary for /reputation: a crash here keeps the nav rail + shell alive and shows the discreet recovery UI. */
export default function ReputationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} scope="reputation" />;
}
