import type { Metadata } from "next";
import catalogueData from "@/data/plugin-catalogue.json";

export const metadata: Metadata = {
  title: "Plugins",
  description: "Catalogue of OnDemand marketplace plugins available to the executive chat intelligence engine.",
};

interface PluginItem {
  id: string;
  name: string;
  domain?: string;
  category?: string;
  identifier?: string;
  pinned?: boolean;
  defaultOn?: boolean;
  description?: string;
}

export default function PluginsPage() {
  const plugins = (catalogueData.plugins || []) as PluginItem[];

  return (
    <div className="space-y-6" data-testid="plugins-page">
      <header className="border-b border-[#E5E5E5] pb-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0D0D0D] sm:text-3xl">
          Plugins
        </h1>
        <p className="mt-2 text-sm text-[#5D5D5D]">
          These are the OnDemand marketplace plugins the executive chat intelligence engine can call to enrich responses with live external tools and datasets.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="plugins-list">
        {plugins.map((plugin) => {
          const initial = plugin.name ? plugin.name.charAt(0).toUpperCase() : "P";
          return (
            <article
              key={plugin.id}
              data-testid="plugin-card"
              className="flex flex-col justify-between rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#E5E5E5] bg-[#F5F5F5] font-mono text-sm font-semibold text-[#0D0D0D]"
                    >
                      {initial}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#0D0D0D]">{plugin.name}</h2>
                      {plugin.domain && (
                        <p className="text-xs text-[#737373]">{plugin.domain}</p>
                      )}
                    </div>
                  </div>

                  {plugin.pinned ? (
                    <span className="inline-flex items-center rounded border border-[#D4D4D4] bg-[#F0F0F0] px-1.5 py-0.5 text-[10px] font-medium text-[#0D0D0D]">
                      Pinned
                    </span>
                  ) : plugin.defaultOn ? (
                    <span className="inline-flex items-center rounded border border-[#E5E5E5] bg-[#F5F5F5] px-1.5 py-0.5 text-[10px] font-medium text-[#5D5D5D]">
                      Default On
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded border border-[#E5E5E5] bg-[#F9F9F9] px-1.5 py-0.5 text-[10px] font-medium text-[#737373]">
                      Available
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#5D5D5D]">
                  {plugin.description || "No description provided."}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#F0F0F0] pt-3 text-[11px] text-[#737373]">
                <span className="font-mono">{plugin.category?.replace(/_/g, " ") || "tool"}</span>
                <span className="font-mono text-[10px] text-[#A3A3A3]">{plugin.id}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
