import Link from "next/link";
import airevData from "@/data/uae_cc_v1/airev.json";

function StatusChip({ status }: { status: string }) {
  const isVerified = status.toLowerCase() === "verified";
  if (isVerified) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#F0F0F0] px-2 py-0.5 text-[11px] font-medium text-[#0D0D0D]">
        verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-2 py-0.5 text-[11px] font-medium text-[#5D5D5D]">
      {status}
    </span>
  );
}

export function AirevDossier() {
  const {
    identity,
    leadership,
    disambiguation,
    platform,
    funding_and_valuation,
    partnerships,
    announcements,
    latest_linkedin_posts,
    sources,
  } = airevData;

  return (
    <div className="space-y-4" data-testid="airev-dossier-root">
      {/* Intro Section */}
      <section className="card p-4 sm:p-5" data-testid="airev-intro">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#0D0D0D]">
              Reference dossier — AIREV (deep profile)
            </h2>
            <span
              className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F0F0F0] px-2 py-0.5 text-[11px] font-medium text-[#0D0D0D]"
              data-testid="pinned-chip"
            >
              Reference dossier
            </span>
          </div>
          <span className="text-xs text-muted">
            Vendor Reference Architecture & Ecosystem Deep Profile
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">
          Provenance legend: Verified · company-reported · reported/unconfirmed · internal (unverified) · dead link → archive
        </p>
      </section>

      {/* Identity & Offices */}
      <section className="card p-4 sm:p-5" data-testid="airev-identity">
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Identity & offices</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted">Legal Name</dt>
            <dd className="font-medium text-[#0D0D0D]">
              {identity.legal_name}{" "}
              <a
                href="https://www.linkedin.com/company/airev-holding-limited/"
                target="_blank"
                rel="noopener"
                className="underline hover:text-[#2563EB]"
              >
                (LinkedIn ID: 101034758)
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Brand & Entity Type</dt>
            <dd className="font-medium text-[#0D0D0D]">
              {identity.brand} · Privately held enterprise software company
            </dd>
          </div>
          <div>
            <dt className="text-muted">Headquarters</dt>
            <dd className="font-medium text-[#0D0D0D]">
              {identity.hq}{" "}
              <span className="text-muted">({identity.hq_source})</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Founded</dt>
            <dd className="font-medium text-[#0D0D0D]">
              {identity.founded}{" "}
              <span className="text-muted">({identity.founded_source})</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Chairman</dt>
            <dd className="font-medium text-[#0D0D0D]">
              {identity.chairman.name},{" "}
              <span className="text-muted">{identity.chairman.role}</span>{" "}
              <span className="text-[11px] text-muted">({identity.chairman.source})</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Headcount & Followers (LinkedIn)</dt>
            <dd className="space-y-0.5 font-medium text-[#0D0D0D]">
              <div>
                AIREV: {identity.headcount.airev.employees} employees ({identity.headcount.airev.band}), {identity.headcount.airev.followers} followers
              </div>
              <div>
                OnDemand: {identity.headcount.ondemand.employees} employees, {identity.headcount.ondemand.followers} followers (HQ Dubai, founded 2024)
              </div>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Offices</dt>
            <dd className="font-medium text-[#0D0D0D]">
              {identity.offices.map((o) => `${o.location} (${o.entity} — ${o.type})`).join("; ")}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Official Websites</dt>
            <dd className="space-x-2 font-medium">
              {identity.websites.map((w) => (
                <a
                  key={w.url}
                  href={w.url}
                  target="_blank"
                  rel="noopener"
                  className="underline hover:text-[#2563EB]"
                >
                  {w.label}
                </a>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Contact Emails</dt>
            <dd className="font-medium text-[#0D0D0D]">
              {identity.emails.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="text-muted">GitHub Organisations</dt>
            <dd className="space-x-2 font-medium">
              {identity.github.map((g) => (
                <a
                  key={g.url}
                  href={g.url}
                  target="_blank"
                  rel="noopener"
                  className="underline hover:text-[#2563EB]"
                >
                  {g.label}
                </a>
              ))}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">Social Channels</dt>
            <dd className="flex flex-wrap gap-x-3 gap-y-1 font-medium">
              {identity.social.map((s) => (
                <a
                  key={s.platform}
                  href={s.url}
                  target="_blank"
                  rel="noopener"
                  className="underline hover:text-[#2563EB]"
                >
                  {s.platform}
                </a>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      {/* Leadership */}
      <section className="card p-4 sm:p-5" data-testid="airev-leadership">
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Leadership</h2>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {leadership.map((l) => (
            <div
              key={l.name}
              className="rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] p-3 text-xs"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-semibold text-[#0D0D0D]">{l.name}</span>
                <span className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-1.5 py-0.5 text-[10px] text-[#5D5D5D]">
                  {l.linkedin_url}
                </span>
              </div>
              <p className="mt-1 font-medium text-muted">{l.role}</p>
              <p className="mt-1 text-[11px] text-muted">Source: {l.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OnDemand Platform */}
      <section className="card p-4 sm:p-5" data-testid="airev-platform">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#0D0D0D]">OnDemand platform</h2>
          <span className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-2 py-0.5 text-[11px] text-[#5D5D5D]">
            API Base: {platform.api_base}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">{platform.description}</p>
        <p className="mt-1 text-xs font-medium text-[#0D0D0D]">
          {platform.engine_credit}
        </p>

        <div className="mt-3">
          <h3 className="text-xs font-semibold text-[#0D0D0D]">Core APIs</h3>
          <ul className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs">
            {platform.apis.map((a) => (
              <li
                key={a.name}
                className="flex items-center justify-between rounded border border-[#E5E5E5] bg-white px-2.5 py-1.5"
              >
                <span className="font-medium text-[#0D0D0D]">{a.name}</span>
                <span className="text-[11px] text-muted">{a.scope}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-[#0D0D0D]">Platform Metrics</h3>
            <span className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-1.5 py-0.5 text-[10px] text-[#5D5D5D]">
              company-reported
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {platform.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] p-2.5 text-center"
              >
                <div className="text-lg font-bold tabular-nums text-[#0D0D0D]">
                  {m.value}
                </div>
                <div className="mt-0.5 text-[11px] text-muted">{m.label}</div>
                <div className="mt-1 text-[10px] text-muted">
                  ({m.provenance})
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding & Valuation */}
      <section className="card p-4 sm:p-5" data-testid="airev-funding">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#0D0D0D]">Funding & valuation</h2>
          <span className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-[#F9F9F9] px-2 py-0.5 text-[11px] text-[#5D5D5D]">
            Status: {funding_and_valuation.status}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">{funding_and_valuation.valuation}</p>

        <h3 className="mt-3 text-xs font-semibold text-[#0D0D0D]">Publicly announced rounds</h3>
        <ul className="mt-1.5 space-y-1.5 text-xs">
          {funding_and_valuation.public_rounds.map((r, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#E5E5E5] bg-white p-2"
            >
              <div>
                <span className="font-semibold text-[#0D0D0D]">{r.stage}</span>{" "}
                <span className="text-muted">({r.date})</span>: {r.investor}
                {r.note && <p className="mt-0.5 text-[11px] text-muted">{r.note}</p>}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted">{r.source}</span>
                <StatusChip status={r.provenance} />
              </div>
            </li>
          ))}
        </ul>

        <h3 className="mt-4 text-xs font-semibold text-[#0D0D0D]">
          Internal materials in media library (existence noted; figures withheld)
        </h3>
        <ul className="mt-1.5 space-y-1 text-xs text-muted">
          {funding_and_valuation.internal_documents.map((doc, idx) => (
            <li
              key={idx}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#E5E5E5] bg-[#F9F9F9] px-2.5 py-1"
            >
              <span className="font-mono text-[11px] text-[#0D0D0D]">{doc.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted">Confidence: {doc.confidence}</span>
                <StatusChip status={doc.provenance} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Partnerships */}
      <section className="card p-4 sm:p-5" data-testid="airev-partnerships">
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Partnerships & alliances</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] text-muted">
                <th className="pb-2 font-medium">Partner</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Role / Scope</th>
                <th className="pb-2 font-medium">Status & Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]/50">
              {partnerships.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#F9F9F9]/50">
                  <td className="py-2 pr-3 font-semibold text-[#0D0D0D]">
                    {p.partner}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-muted">{p.date}</td>
                  <td className="py-2 pr-3 text-muted">
                    {p.role}
                    {p.source_url && (
                      <span className="ml-1">
                        ·{" "}
                        <a
                          href={p.source_url}
                          target="_blank"
                          rel="noopener"
                          className="underline hover:text-[#2563EB]"
                        >
                          source
                        </a>
                      </span>
                    )}
                    {p.source_doc && (
                      <span className="ml-1 text-[11px] text-muted">
                        · doc: {p.source_doc}
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <StatusChip status={p.status} />
                      {p.provenance !== p.status && (
                        <span className="text-[10px] text-muted">({p.provenance})</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Announcements Timeline */}
      <section className="card p-4 sm:p-5" data-testid="airev-announcements">
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Announcements timeline</h2>
        <ol className="mt-3 space-y-2 text-xs">
          {announcements.map((a, i) => (
            <li
              key={i}
              className="flex flex-wrap items-start justify-between gap-2 rounded border border-[#E5E5E5] bg-white p-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <time className="font-mono text-[11px] tabular-nums text-muted">
                    {a.date}
                  </time>
                  <span className="font-semibold text-[#0D0D0D]">{a.headline}</span>
                </div>
                <p className="mt-1 text-muted">{a.event}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {a.source_url && (
                  <a
                    href={a.source_url}
                    target="_blank"
                    rel="noopener"
                    className="underline hover:text-[#2563EB]"
                  >
                    source
                  </a>
                )}
                <StatusChip status={a.provenance} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Latest LinkedIn Posts */}
      <section className="card p-4 sm:p-5" data-testid="airev-linkedin">
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Latest LinkedIn posts</h2>
        <div
          className="mt-3 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] p-3 text-xs"
          data-testid="airev-linkedin-unavailable"
        >
          <p className="text-muted">{latest_linkedin_posts.message}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {latest_linkedin_posts.company_pages.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noopener"
                className="font-medium underline hover:text-[#2563EB]"
              >
                {p.name} company page →
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Disambiguation */}
      <section className="card p-4 sm:p-5" data-testid="airev-disambiguation">
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Disambiguation</h2>
        <div className="mt-2 rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] p-3 text-xs">
          <p className="font-medium text-[#0D0D0D]">{disambiguation.summary}</p>
          <div className="mt-2.5 space-y-2">
            {disambiguation.entities.map((e) => (
              <div key={e.name} className="border-t border-[#E5E5E5] pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#0D0D0D]">{e.name}</span>
                  <span className="inline-flex items-center rounded-full border border-[#E5E5E5] bg-white px-1.5 py-0.2 text-[10px] text-[#5D5D5D]">
                    {e.relationship}
                  </span>
                </div>
                <p className="mt-0.5 text-muted">{e.description}</p>
                <div className="mt-1 flex gap-2">
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener"
                    className="underline hover:text-[#2563EB]"
                  >
                    {e.url}
                  </a>
                  {e.linkedin_url && (
                    <a
                      href={e.linkedin_url}
                      target="_blank"
                      rel="noopener"
                      className="underline hover:text-[#2563EB]"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="card p-4 sm:p-5" data-testid="airev-sources">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#0D0D0D]">
            Sources ({sources.length})
          </h2>
          <span className="text-xs text-muted">
            {sources.filter((s) => s.status === "verified").length} verified ·{" "}
            {sources.filter((s) => s.status.includes("archive")).length} archive fallbacks ·{" "}
            {sources.filter((s) => s.status === "unverified").length} internal/unverified
          </span>
        </div>
        <ol className="mt-3 space-y-2 text-xs divide-y divide-[#E5E5E5]/50">
          {sources.map((s) => (
            <li key={s.n} className="pt-2 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-muted">[{s.n}] </span>
                {"archive_url" in s && s.archive_url ? (
                  <>
                    <a
                      href={s.archive_url}
                      target="_blank"
                      rel="noopener"
                      className="underline hover:text-[#2563EB]"
                    >
                      {s.title}
                    </a>{" "}
                    <sup className="ml-1 text-[10px] text-muted">archived</sup>
                  </>
                ) : s.url.startsWith("http") ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener"
                    className="underline hover:text-[#2563EB]"
                  >
                    {s.title}
                  </a>
                ) : (
                  <span className="font-medium text-[#0D0D0D]">{s.title}</span>
                )}
                <span className="text-muted">
                  {" "}· {s.publisher}
                  {s.published_at ? ` · ${s.published_at}` : ""}
                  {" · checked " + s.retrieved_at}
                </span>
              </div>
              <div className="shrink-0">
                <StatusChip status={s.status} />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
