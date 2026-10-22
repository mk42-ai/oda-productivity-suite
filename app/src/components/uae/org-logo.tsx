import { logoFor } from "@/lib/uae/logos";
import { cn } from "@/lib/utils";

export function OrgLogo({ id, name, size = 40, className }: { id: string; name: string; size?: number; className?: string }) {
  const src = logoFor(id);
  const initials = name.replace(/\(.*?\)/g, "").split(/[\s&–-]+/).filter((w) => /^[A-Za-z0-9]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  if (src) // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" title={`${name} — icon from official domain`} width={size} height={size} data-testid="org-logo" className={cn("shrink-0 rounded-md border border-[#E5E5E5] bg-white object-contain p-1", className)} style={{ width: size, height: size }} />;
  return <span role="img" aria-label={name} title={`${name} — monogram (no verified official logo)`} data-testid="org-monogram" className={cn("inline-grid shrink-0 place-items-center rounded-md border border-[#E5E5E5] bg-[#F9F9F9] font-semibold text-[#0D0D0D]", className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>{initials}</span>;
}
