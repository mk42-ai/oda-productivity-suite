import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Shell } from "@/components/shell/shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PopstateGuardScript } from "@/components/shell/popstate-guard";
import { RouteProgress } from "@/components/shell/route-progress";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { THEME_SCRIPT } from "@/components/shell/theme-toggle";

const display = localFont({ src: "../fonts/inter-latin.woff2", variable: "--font-display", display: "swap", preload: true, weight: "400 700", fallback: ["Inter", "system-ui", "sans-serif"], adjustFontFallback: "Arial" });
const body = localFont({ src: "../fonts/inter-latin.woff2", variable: "--font-body", display: "swap", preload: true, weight: "400 700", fallback: ["Inter", "system-ui", "sans-serif"], adjustFontFallback: "Arial" });

const TITLE = "UAE AI National Intelligence Command Centre — Concept Demonstration";
const DESC = "Concept demonstration (not an official government system): UAE AI ecosystem watchlist of 50 organisations, public-discourse Sentiment Universe, news intelligence, technology radar, relationship graph and an OnDemand-powered executive chat with citations.";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://uae-ai-command-centre.vercel.run"),
  title: { default: TITLE, template: "%s · UAE AI Command Centre (concept)" },
  description: DESC, applicationName: "UAE AI Command Centre (concept)",
  openGraph: { title: TITLE, description: DESC, type: "website", images: [{ url: "/brand/uae/og-card.png", width: 1200, height: 675, alt: "UAE AI National Intelligence Command Centre — Concept Demonstration" }] },
  twitter: { card: "summary_large_image", images: ["/brand/uae/og-card.png"] },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#12171D" }, { color: "#FBFAF7" }], width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head><script id="uaecc-theme" dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>
        <RouteProgress />
        <PopstateGuardScript />
        <a href="#main" className="sr-only sr-only-focusable fixed left-2 top-2 z-[100] rounded-md bg-primary px-3 py-2 text-primary-foreground">Skip to main content</a>
        <TooltipProvider delayDuration={150}>
          <Shell>{children}</Shell>
        </TooltipProvider>
        <Toaster position="bottom-right" closeButton />
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
