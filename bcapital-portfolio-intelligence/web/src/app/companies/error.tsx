"use client";
import { RouteError } from "@/components/ui/route-error";
/** Segment boundary for /companies: a crash here keeps the nav rail + shell alive and shows the discreet recovery UI. */
export default function CompaniesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} scope="companies" />;
}
