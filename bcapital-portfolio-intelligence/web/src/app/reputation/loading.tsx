import { Skeleton, PageHeaderSkeleton } from '@/components/ui/skeleton';

/** CLS-free skeleton for /reputation: PageHeader + four entity cards + the correlation output band (fixed heights, no horizontal overflow). */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading reputation" data-testid="reputation-loading" className="w-full min-w-0">
      <PageHeaderSkeleton titleW={260} ledeLines={1} />
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card w-full min-w-0 overflow-hidden p-4">
            <div className="flex gap-4">
              <Skeleton shape="rect" className="h-[72px] w-[72px] shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <Skeleton shape="text" className="mb-2 w-1/3" h={18} />
                <Skeleton shape="text" className="mb-2 w-1/2" h={12} />
                <Skeleton shape="text" className="w-5/6" h={12} />
              </div>
            </div>
            <ul className="m-0 mt-4 list-none p-0" aria-hidden>
              {Array.from({ length: 4 }).map((_, j) => (
                <li key={j} className="flex h-8 min-w-0 items-center gap-3 border-b border-border last:border-b-0">
                  <Skeleton shape="text" className="w-12" h={12} />
                  <Skeleton shape="text" className="w-1/2" h={12} />
                  <Skeleton shape="text" className="ml-auto w-16" h={12} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="card mt-4 w-full min-w-0 p-4"><Skeleton shape="text" className="mb-3 w-1/4" h={16} /><Skeleton shape="rect" className="h-[240px] w-full" /></div>
    </div>
  );
}
