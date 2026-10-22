"use client";

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** shadcn/ui sonner (CLI v4), adapted: neutral styling. */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4 text-foreground" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    style={{ "--normal-bg": "var(--surface, #ffffff)", "--normal-text": "var(--foreground)", "--normal-border": "var(--border)", "--border-radius": "var(--radius-lg, 12px)" } as React.CSSProperties}
    {...props}
  />
);

export { Toaster };
