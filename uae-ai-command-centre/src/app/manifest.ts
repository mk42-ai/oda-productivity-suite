import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UAE AI National Intelligence Command Centre — Concept Demonstration",
    short_name: "UAE AI Command Centre",
    description: "Concept demonstration of a UAE AI ecosystem intelligence command centre — not an official government system.",
    start_url: "/overview", scope: "/", display: "standalone", background_color: "#12171D", theme_color: "#147B58",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
