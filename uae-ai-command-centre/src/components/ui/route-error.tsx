"use client";
import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Discreet segment recovery UI shared by app/error.tsx and the /companies, /social, /signals boundaries.
 * It NEVER renders error.message / stack / digest or any upstream text — only generic copy + recovery actions.
 * "Try again" refreshes the server payload (router.refresh) and re-mounts the segment (reset) inside a transition,
 * so a transient fetch failure recovers without a full reload. "Go to Overview" is a hard <a> so it works even
 * when the client router state is poisoned.
 */
export function RouteError({ error, reset, scope }: { error?: Error & { digest?: string }; reset: () => void; scope: string }) {
  const router = useRouter();
  useEffect(() => { console.warn("[route-error]", scope, error?.digest ?? ""); }, [error, scope]);
  const retry = () => { toast("Retrying…", { description: "Reloading this section." }); startTransition(() => { router.refresh(); reset(); }); };
  return (
    <div role="alert" data-testid="route-error" data-scope={scope} className="card mx-auto my-8 flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- self-hosted illustration, fixed box → no CLS */}
      <img src="/illustrations/error-offline.webp" width={160} height={160} alt="" aria-hidden className="h-auto w-40 max-w-full select-none" decoding="async" data-testid="error-illustration" />
      <h2 className="text-lg font-semibold">This section hit a problem</h2>
      <p className="max-w-md text-sm text-muted">Please try again. If it keeps happening, reload the page.</p>
      <span className="inline-flex flex-wrap justify-center gap-2">
        <Button onClick={retry} data-testid="route-error-retry"><RefreshCw className="size-4" aria-hidden />Try again</Button>
        <Button asChild variant="outline"><a href="/overview">Go to Overview</a></Button>
      </span>
    </div>
  );
}
