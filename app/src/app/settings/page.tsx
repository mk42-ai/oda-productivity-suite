import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsForm } from "@/components/shell/settings-form";
import { ORGS, TYPE_LABEL, logoFor } from "@/lib/uae/data";
export const metadata: Metadata = { title: "Settings", description: "ONDEMAND SETTINGS: OnDemand credentials (browser only), plugins, default chat context organisations." };
export default function SettingsPage() {
  const options = ORGS.map((o) => ({ slug: o.id, name: o.name, sector: TYPE_LABEL[o.type], logo_url: logoFor(o.id) })).sort((a, b) => a.name.localeCompare(b.name));
  return (<><PageHeader title="Settings" lede="ONDEMAND SETTINGS — credentials stay in this browser (localStorage x-ondemand-key, forwarded through /api/ondemand/*). Every AI call goes through the OnDemand API via the same-origin proxy." /><SettingsForm options={options} /></>);
}
