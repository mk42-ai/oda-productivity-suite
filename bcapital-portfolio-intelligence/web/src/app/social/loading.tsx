import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streaming fallback for /social. Without a segment `loading.tsx`, a client-side
 * navigation to /social (force-dynamic server render + a 25s-timeout feed fetch)
 * kept showing the previous page with no feedback for seconds — users re-clicked
 * other nav items mid-flight, cancelling the RSC request (net::ERR_ABORTED spam
 * in the console) and perceiving the app as frozen/crashed. Mirrors the other
 * segments (news, companies): fixed-height skeleton inside PageFrame.
 */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading B Social" data-testid="social-loading">
      <div className="mb-6 flex h-10 items-center gap-3">
        <Skeleton w={28} h={28} shape="circle" />
        <div className="space-y-2">
          <Skeleton w={160} h={20} />
          <Skeleton w={320} h={14} />
        </div>
      </div>
      <Skeleton className="mb-4 w-full" h={96} />
      <Skeleton className="mb-4 w-full" h={48} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full" h={180} />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="w-full" h={240} />
          <Skeleton className="w-full" h={200} />
        </div>
      </div>
    </div>
  );
}
