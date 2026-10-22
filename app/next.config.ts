import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

// Build stamp: computed once at config load and inlined into the bundle, so SSR and hydration render identical text.
const APP_VERSION = (() => { try { return String(JSON.parse(readFileSync(path.join(__dirname, "package.json"), "utf8")).version ?? "0.0.0"); } catch { return "0.0.0"; } })();
const BUILD_COMMIT = process.env.BUILD_COMMIT ?? (() => { try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "local"; } catch { return "local"; } })();
// next build evaluates this config in more than one process (server + client compilations). Computing new Date() in each one let the
// server and client bundles inline different minutes on a slow machine → React #418 on the footer. The first evaluation stores the value
// in process.env, which every worker spawned afterwards inherits, so all bundles share one timestamp (BUILD_TIME can also be set by CI).
const BUILD_TIME = (process.env.BUILD_TIME ||= new Date().toISOString().replace(/\.\d{3}Z$/, "Z"));
const BUILD_TIME_LABEL = `${BUILD_TIME.slice(0, 10)} ${BUILD_TIME.slice(11, 16)} UTC`;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_APP_VERSION: APP_VERSION, NEXT_PUBLIC_BUILD_COMMIT: BUILD_COMMIT, NEXT_PUBLIC_BUILD_TIME: BUILD_TIME, NEXT_PUBLIC_BUILD_TIME_LABEL: BUILD_TIME_LABEL },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }], formats: ["image/avif", "image/webp"] },
  experimental: { optimizePackageImports: ["lucide-react", "recharts"] },
  // 'ai' build warning (QA cycle 7, Lane D): @openuidev/react-headless 0.17 ships a Vercel-AI-SDK adapter that `await import("ai")`s its OPTIONAL
  // peer (peerDependenciesMeta.ai.optional = true) inside a try/catch. This app streams AG-UI frames through agUIAdapter and never calls
  // vercelAIAdapter, so 'ai' is intentionally not installed. Webpack still resolves the dynamic import at build time and printed
  // "Module not found: Can't resolve 'ai'" on every build. Aliasing the specifier to `false` makes webpack emit an empty module in its place:
  // the import now resolves to `{}` and the adapter's own `typeof DefaultChatTransport !== "function"` guard throws the same
  // MISSING_AI_SDK_MESSAGE it threw when the module was missing — identical runtime behaviour, zero build warnings.
  webpack: (config) => { config.resolve ??= {}; config.resolve.alias = { ...(config.resolve.alias ?? {}), ai: false }; return config; },
  // Always emit metadata in <head> (no streamed/hoisted <title>/<meta>): our metadata is static per route, so blocking costs nothing,
  // and crawlers / Lighthouse read <meta name="description"> without running JS.
  htmlLimitedBots: /./,
  // Root → /overview as a real HTTP redirect (no client-side redirect() hop, which raised React #310 during the double navigation).
  async redirects() { return [{ source: "/", destination: "/overview", permanent: false }]; },
  async headers() {
    // No X-Frame-Options: the platform shows the preview inside an iframe on another origin; SAMEORIGIN made that iframe render blank
    // even though every route answered HTTP 200. Click-jacking exposure is acceptable for a read-only dashboard whose only secret
    // lives in the user's own localStorage. The CSP below is frame-ancestors ONLY (explicitly allow any embedding origin) — no other
    // directives, so Next's inline bootstrap scripts are unaffected.
    return [{ source: "/(.*)", headers: [
      { key: "Content-Security-Policy", value: "frame-ancestors *;" },
      { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" }, // microphone=(self): voice mode (web/src/components/chat/voice)
    ] }];
  },
};
export default nextConfig;
