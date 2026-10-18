import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div data-testid="not-found" role="status" className="card mx-auto my-8 flex w-full max-w-xl min-w-0 flex-col items-center gap-4 overflow-hidden px-5 py-10 text-center sm:px-8">
      {/* eslint-disable-next-line @next/next/no-img-element -- self-hosted illustration, fixed aspect → no CLS */}
      <img src="/illustrations/not-found.webp" width={384} height={256} alt="" aria-hidden className="h-auto w-[384px] max-w-full select-none" decoding="async" data-testid="not-found-illustration" />
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#067a52]">404 · Page not found</p>
      <h1 className="inline-flex items-center justify-center gap-2 text-xl font-semibold text-[#1F2328]">
        <Compass className="size-5 shrink-0 text-[#067a52]" strokeWidth={2} aria-hidden />
        We couldn&apos;t find that page
      </h1>
      <p className="max-w-md text-sm text-muted">The link may be old, or the page moved. Everything in the portfolio is still one click away.</p>
      <div className="flex w-full flex-wrap justify-center gap-2">
        <Button asChild><Link href="/overview">Back to portfolio</Link></Button>
        <Button asChild variant="outline"><Link href="/companies">Browse companies</Link></Button>
      </div>
    </div>
  );
}
