import { masterFor } from "@/lib/uae/master";

function renderValue(val: string | undefined | null) {
  if (!val || val.startsWith("unverified") || val === "unavailable" || val === "unknown") {
    return (
      <span data-testid="unverified-field" className="italic text-muted">
        {val || "unverified — no official source found"}
      </span>
    );
  }
  return <span>{val}</span>;
}

function renderLink(url: string | undefined | null, label?: string) {
  if (!url || url.startsWith("unverified") || url === "unavailable" || url === "unknown") {
    return (
      <span data-testid="unverified-field" className="italic text-muted">
        {url || "unverified — lookup rate-limited"}
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#2563EB] hover:underline focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
    >
      {label || url}
    </a>
  );
}

export function OrgProfile({ id }: { id: string }) {
  const org = masterFor(id);
  if (!org) return null;

  return (
    <section data-testid="org-profile" className="card p-4 sm:p-5 text-sm">
      <header className="mb-4 border-b border-border pb-3">
        <h2 className="text-base font-semibold text-foreground">Organisation profile (master record)</h2>
        <p className="mt-0.5 text-xs text-muted">
          Unified intelligence record verified under QA cycle 9 provenance standard.
        </p>
      </header>

      {/* 2-column definition list of scalar fields */}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted">Legal Name</dt>
          <dd className="mt-0.5 font-medium text-foreground">{renderValue(org.legal_name)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">Brand Name</dt>
          <dd className="mt-0.5 text-foreground">{renderValue(org.brand_name)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">Organisation Type</dt>
          <dd className="mt-0.5 text-foreground capitalize">{renderValue(org.type)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">Sector / AI Focus</dt>
          <dd className="mt-0.5 text-foreground">{renderValue(org.sector)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">HQ City · Emirate · Free Zone</dt>
          <dd className="mt-0.5 text-foreground">
            {renderValue(org.hq_city)} · {renderValue(org.emirate)} ·{" "}
            {org.free_zone && !org.free_zone.startsWith("unverified") ? (
              <span>{org.free_zone}</span>
            ) : (
              <span data-testid="unverified-field" className="italic text-muted">
                {org.free_zone || "unverified — no official source found"}
              </span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">Founded</dt>
          <dd className="mt-0.5 text-foreground">{renderValue(org.founded)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">CEO / Executive Lead</dt>
          <dd className="mt-0.5 text-foreground">{renderValue(org.ceo)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">Ownership / Parent</dt>
          <dd className="mt-0.5 text-foreground">{renderValue(org.ownership_parent)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">Headcount Band</dt>
          <dd className="mt-0.5 text-foreground">{renderValue(org.headcount_band)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">Official Website</dt>
          <dd className="mt-0.5 truncate">{renderLink(org.website)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">LinkedIn Company</dt>
          <dd className="mt-0.5 truncate">{renderLink(org.linkedin_url)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">X (Twitter)</dt>
          <dd className="mt-0.5 truncate">{renderLink(org.x_url)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">YouTube</dt>
          <dd className="mt-0.5 truncate">{renderLink(org.youtube_url)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">GitHub</dt>
          <dd className="mt-0.5 truncate">{renderLink(org.github_url)}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">Official Emails</dt>
          <dd className="mt-0.5">
            {org.emails && org.emails.length > 0 ? (
              <span>{org.emails.join(", ")}</span>
            ) : (
              <span data-testid="unverified-field" className="italic text-muted">
                unverified — no official source found
              </span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted">Official Phones</dt>
          <dd className="mt-0.5">
            {org.phones && org.phones.length > 0 ? (
              <span>{org.phones.join(", ")}</span>
            ) : (
              <span data-testid="unverified-field" className="italic text-muted">
                unverified — no official source found
              </span>
            )}
          </dd>
        </div>
      </dl>

      {/* Disambiguation note if present */}
      {org.disambiguation && (
        <div className="mt-4 rounded border border-border bg-[#F9F9F9] p-3 text-xs text-muted">
          <span className="font-semibold text-foreground">Entity Disambiguation: </span>
          {org.disambiguation}
        </div>
      )}

      {/* Compact list: Founders */}
      <div className="mt-4 border-t border-border pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Founders</h3>
        {org.founders && org.founders.length > 0 ? (
          <p className="mt-1 text-sm text-foreground">{org.founders.join(", ")}</p>
        ) : (
          <p data-testid="unverified-field" className="mt-1 text-xs italic text-muted">
            unverified — no official source found
          </p>
        )}
      </div>

      {/* Compact list: Products */}
      <div className="mt-4 border-t border-border pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Products & Platforms</h3>
        {org.products && org.products.length > 0 ? (
          <ul className="mt-1 flex flex-wrap gap-1.5 text-xs">
            {org.products.map((p, i) => (
              <li key={i} className="rounded border border-border bg-[#F9F9F9] px-2 py-0.5 text-foreground">
                {p}
              </li>
            ))}
          </ul>
        ) : (
          <p data-testid="unverified-field" className="mt-1 text-xs italic text-muted">
            unverified — no official source found
          </p>
        )}
      </div>

      {/* Compact list: Funding rounds */}
      <div className="mt-4 border-t border-border pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Funding Rounds</h3>
        {org.funding_rounds && org.funding_rounds.length > 0 ? (
          <ul className="mt-1 space-y-1 text-xs">
            {org.funding_rounds.map((r, i) => (
              <li key={i} className="text-foreground">
                <span className="font-medium">{r.round}</span> ·{" "}
                <span>
                  {typeof r.amount === "number" ? r.amount.toLocaleString() : r.amount} {r.currency}
                </span>{" "}
                · <time className="tabular-nums text-muted">{r.date}</time> ·{" "}
                <span>{r.investors && r.investors.length > 0 ? r.investors.join(", ") : "undisclosed investors"}</span>{" "}
                · <span className="uppercase text-muted text-[11px]">{r.status}</span>
                {r.source_url && (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline"
                    >
                      source
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted">
            No external venture funding rounds recorded (privately held or government/institutional entity).
          </p>
        )}
      </div>

      {/* Compact list: Partnerships */}
      <div className="mt-4 border-t border-border pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Key Partnerships</h3>
        {org.partnerships && org.partnerships.length > 0 ? (
          <ul className="mt-1 grid gap-1.5 sm:grid-cols-2 text-xs">
            {org.partnerships.slice(0, 10).map((p, i) => (
              <li key={i} className="truncate text-foreground">
                <span className="font-medium">{p.partner}</span>{" "}
                {p.date && <span className="text-muted tabular-nums">({p.date})</span>} ·{" "}
                <span className="text-muted">{p.status}</span>
                {p.source && p.source.startsWith("http") && (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={p.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline"
                    >
                      source
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted">No external partnerships verified in current corpus.</p>
        )}
      </div>

      {/* Footer line */}
      <footer className="mt-5 border-t border-border pt-3 text-xs text-muted">
        Coverage {org.coverage_pct}% · confidence {org.confidence} · last verified {org.last_verified_at} ·
        provenance: official site &gt; regulator/WAM &gt; LinkedIn &gt; press &gt; aggregator &gt; internal doc
      </footer>
    </section>
  );
}
