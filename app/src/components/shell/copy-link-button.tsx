"use client";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

/** Copies the current page URL to the clipboard and confirms with a toast. */
export function CopyLinkButton() {
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };
  return (
    <button type="button" onClick={onClick} aria-label="Copy link to this page" title="Copy link to this page" data-testid="copy-link"
      className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-transparent text-muted transition-colors hover:border-[#147B58] hover:text-[#0F6447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147B58] focus-visible:ring-offset-2">
      <Link2 className="size-4" aria-hidden="true" />
    </button>
  );
}
