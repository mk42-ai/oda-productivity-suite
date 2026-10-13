import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Linkedin, Building2, ArrowLeft } from "lucide-react";
import { getFeed, getPeople, getPortfolioData } from "@/lib/social";
import { Avatar, PostCard } from "@/components/social/social-feed";
import { sectorTheme, faviconUrl } from "@/lib/social-sectors";
import "@/components/social/social.css";

export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params; const p = (await getPeople()).people.find((x) => x.id === decodeURIComponent(id));
  return { title: p ? `${p.name} · ${p.company}` : "Profile" };
}

/** Founder / employee profile: plain initials, bio, company + role, and the company's latest social posts. */
export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const key = decodeURIComponent(id);
  const [ppl, feed, pf] = await Promise.all([getPeople(), getFeed(), getPortfolioData()]);
  const p = ppl.people.find((x) => x.id === key); if (!p) notFound();
  const co = pf.companies.find((c) => c.slug === p.company_slug); const t = sectorTheme(p.sector);
  const posts = feed.posts.filter((x) => x.company_slug === p.company_slug).slice(0, 6);
  const team = ppl.people.filter((x) => x.company_slug === p.company_slug && x.id !== p.id).slice(0, 10);
  return (
    <div data-testid="founder-profile" data-person={p.id}>
      <Link href="/social" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground"><ArrowLeft className="size-4" aria-hidden /> B Social</Link>
      <div className="bs-profile__head">
        <Avatar name={p.name} sector={p.sector} size={128} />
        <div className="pb-2">
          <h1 className="bs-profile__name">{p.name}</h1>
          <p className="bs-profile__role">{p.role} · <Link href={`/company/${p.company_slug}`} className="font-semibold" style={{ color: t.ink }}>{p.company}</Link> · <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: t.soft, color: t.ink }}>{t.label}</span></p>
          <div className="bs-profile__links">
            {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="size-3.5" aria-hidden /> LinkedIn</a>}
            {p.x && <a href={p.x} target="_blank" rel="noopener noreferrer">X profile</a>}
            {co?.website && <a href={co.website} target="_blank" rel="noopener noreferrer">{co.domain && <img src={faviconUrl(co.domain)!} alt="" width={14} height={14} />} {co.domain}</a>}
          </div>
        </div>
      </div>
      <div className="bs-profile__grid">
        <aside className="flex flex-col gap-3">
          <section className="bs-card" data-testid="profile-bio"><h2 className="bs-card__title">About</h2><p className="text-xs text-muted">Research profile — not a verified social account.</p><p className="text-sm leading-relaxed">{p.bio ?? `${p.role} at ${p.company}. No public bio was returned by the research batch.`}</p><p className="mt-2 text-[11px] text-muted">Source: {p.source}</p></section>
          {co && <section className="bs-card"><h2 className="bs-card__title"><Building2 className="size-4" aria-hidden /> {co.name}</h2><p className="text-sm leading-relaxed">{co.description ?? "—"}</p>
            <p className="mt-2 text-xs text-muted">{[co.hq, co.founded ? `founded ${co.founded}` : null, co.last_round ? `last round ${[co.last_round.round, co.last_round.date].filter(Boolean).join(" · ")}` : null].filter(Boolean).join(" · ")}</p></section>}
          {team.length > 0 && <section className="bs-card" data-testid="profile-team"><h2 className="bs-card__title">Team at {p.company}</h2><ul className="bs-follow-list">{team.map((m) => <li key={m.id} className="bs-follow"><Avatar name={m.name} sector={m.sector} size={32} /><div className="min-w-0"><Link href={`/social/people/${encodeURIComponent(m.id)}`} className="bs-follow__name">{m.name}</Link><p className="bs-follow__role">{m.role}</p></div></li>)}</ul></section>}
        </aside>
        <div className="bs-feed">{posts.length ? posts.map((x) => <PostCard key={x.id} p={x} />) : <p className="text-sm text-muted">No verified social posts for {p.company} yet.</p>}</div>
      </div>
    </div>
  );
}
