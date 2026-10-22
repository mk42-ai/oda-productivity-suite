import { cn } from "@/lib/utils";

export function SourceLink({ url, children, className }: { url?: string | null; children: React.ReactNode; className?: string }) {
  if (!url) return <span className={cn("text-muted", className)} title="source URL not verified in the research corpus — link disabled">{children}<sup className="ml-0.5 text-[9px]">unverified</sup></span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" className={cn("underline decoration-[#D4D4D4] underline-offset-2 hover:text-[#2563EB]", className)}>{children}</a>;
}
