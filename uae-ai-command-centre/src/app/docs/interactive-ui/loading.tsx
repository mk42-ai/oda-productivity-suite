import { Skeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

/** CLS-free skeleton for /docs/interactive-ui: PageHeader + one card holding a table (fixed row heights, no horizontal overflow). */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading docs" data-testid="docs-loading" className="w-full min-w-0">
      <PageHeaderSkeleton titleW={220} ledeLines={1} />
      <div className="card w-full min-w-0 overflow-hidden p-4">
        <Skeleton shape="text" className="mb-2 w-1/3" h={18} />
        <Skeleton shape="text" className="mb-4 w-2/3" h={12} />
        <ul className="m-0 list-none p-0" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className="flex h-10 min-w-0 items-center gap-3 border-b border-border last:border-b-0">
              <Skeleton shape="text" className={i % 2 ? "w-1/4" : "w-1/3"} h={14} />
              <Skeleton shape="text" className="hidden w-1/5 sm:block" h={12} />
              <Skeleton shape="text" className="ml-auto w-10" h={14} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
