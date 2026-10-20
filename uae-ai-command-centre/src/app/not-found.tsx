import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div data-testid="not-found" role="status" className="card mx-auto my-8 flex w-full max-w-xl min-w-0 flex-col items-center gap-4 overflow-hidden px-6 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/uae/sections/empty-state.webp" alt="" width={140} height={140} className="rounded-xl" />
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="max-w-md text-sm text-muted">The link may be old, or the page moved. The National Overview is one click away.</p>
      <div className="flex flex-wrap justify-center gap-2"><Button asChild><Link href="/overview">National Overview</Link></Button><Button variant="outline" asChild><Link href="/watchlist">Watchlist</Link></Button></div>
    </div>
  );
}
