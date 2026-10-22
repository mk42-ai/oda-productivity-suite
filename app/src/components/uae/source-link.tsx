import { cn } from "@/lib/utils";
import linkHealthData from "@/data/uae_cc_v1/link-health.json";

interface DeadLinkEntry {
  status: number;
  checked_at: string;
  replacement?: string;
  archive?: string;
  archive_verified?: boolean;
}

const deadLinks: Record<string, DeadLinkEntry> = (linkHealthData as { dead?: Record<string, DeadLinkEntry> }).dead || {};

export function SourceLink({ url, children, className }: { url?: string | null; children: React.ReactNode; className?: string }) {
  if (!url) {
    return (
      <span className={cn("text-muted", className)} title="source URL not verified in the research corpus — link disabled">
        {children}
        <sup className="ml-0.5 text-[9px]">unverified</sup>
      </span>
    );
  }

  const deadEntry = deadLinks[url];
  if (deadEntry) {
    if (deadEntry.replacement) {
      return (
        <a
          href={deadEntry.replacement}
          target="_blank"
          rel="noopener noreferrer"
          title="original link dead — replaced with canonical URL"
          className={cn("underline decoration-[#D4D4D4] underline-offset-2 hover:text-[#2563EB]", className)}
        >
          {children}
        </a>
      );
    }
    if (deadEntry.archive) {
      return (
        <a
          href={deadEntry.archive}
          target="_blank"
          rel="noopener noreferrer"
          title="archived source via Wayback Machine"
          className={cn("underline decoration-[#D4D4D4] underline-offset-2 hover:text-[#2563EB]", className)}
        >
          {children}
          <sup className="ml-0.5 text-[9px] text-[#737373]">archived</sup>
        </a>
      );
    }
    return (
      <span
        data-testid="source-dead"
        className={cn("text-muted", className)}
        title="original citation dead (HTTP 404)"
      >
        {children}
        <sup className="ml-0.5 text-[9px]">link broken</sup>
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("underline decoration-[#D4D4D4] underline-offset-2 hover:text-[#2563EB]", className)}
    >
      {children}
    </a>
  );
}
