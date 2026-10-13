// PitchBook getCompanyProfile → PbStoredProfile decoder.
// Tolerant of the LLM answer wrapper (``` fences, prose around the JSON), decodes
// codes via src/pitchbook/codes.ts, and marks null / [] values as "Not available in PitchBook".
// Never invents values.

import { ALL_CODES, decodeCode } from "./codes.js";

export const NOT_AVAILABLE = "Not available in PitchBook" as const;
export const UNMATCHED = "Unmatched in PitchBook" as const;
export type PbState = typeof NOT_AVAILABLE | typeof UNMATCHED;

export interface PbProvenance {
  source: "pitchbook";
  batch_id: string;
  query_id: string;
  fetched_at: string;
  /** e.g. the 404 message from `unavailable[]` for a section PitchBook could not return. */
  note?: string;
  /** decode warnings (unknown codes) raised while building this field. */
  warnings?: string[];
}

export interface PbField<T> {
  value: T;
  provenance: PbProvenance;
}
export type PbSlot<T> = PbField<T> | PbState;

export interface PbMeta {
  slug: string;
  batchId: string;
  queryId: string;
  fetchedAt: string;
}

export interface PbCoded {
  code: string;
  description: string;
}
export interface PbDeal {
  dealId: string | null;
  dealDate: string | null;
  dealNumber: number | null;
  dealType1: PbCoded | null;
  dealType2: PbCoded | null;
  dealType3: PbCoded | null;
  /** Convenience: decoded descriptions of dealType1..3 (non-empty only). */
  dealTypes: string[];
}
export interface PbInvestorType {
  primary: boolean;
  code: string;
  description: string;
}
export interface PbInvestor {
  investorId: string | null;
  investorName: string | null;
  investorSince: string | null;
  investorExit: string | null;
  investorStatus: PbCoded | null;
  investorTypes: PbInvestorType[];
}
export interface PbEmployeePoint {
  asOfDate: string | null;
  employeeCount: number | null;
}
export interface PbHqLocation {
  city: string | null;
  country: string | null;
  postCode: string | null;
  stateProvince: string | null;
}
export interface PbMoney {
  amount: number | null;
  currency: string | null;
  native: unknown;
}
export interface PbPerson {
  personId: string | null;
  fullName: string | null;
  title: string | null;
  email?: string | null;
  phone?: string | null;
  positionStart?: string | null;
  role?: string | null;
}
export interface PbNews {
  title: string | null;
  source: string | null;
  publishDate: string | null;
  url: string | null;
  byline: string | null;
}
export interface PbSimilar {
  similarCompanyId: string | null;
  similarCompanyName: string | null;
  similarityScore: number | null;
  competitor: boolean | null;
}
export interface PbUnavailable {
  section: string;
  status: number | null;
  reason: string | null;
  message: string | null;
  path: string | null;
}
export interface PbMatchedOn {
  pbId: string | null;
  score: number | null;
  source: string | null;
  profileLink: string | null;
  type: string | null;
  website: string | null;
}

export interface PbSummary {
  name: PbSlot<string>;
  legalName: PbSlot<string>;
  alsoKnownAs: PbSlot<string | string[]>;
  formerlyKnownAs: PbSlot<string | string[]>;
  description: PbSlot<string>;
  website: PbSlot<string>;
  yearFounded: PbSlot<number>;
  employees: PbSlot<number>;
  hqLocation: PbSlot<PbHqLocation>;
  location: PbSlot<string>;
  ownershipStatus: PbSlot<string>;
  financingStatus: PbSlot<string>;
  financingStatusNote: PbSlot<string>;
  businessStatus: PbSlot<string>;
  universe: PbSlot<string[]>;
  totalMoneyRaised: PbSlot<PbMoney>;
  parentCompany: PbSlot<string>;
}

export interface PbPeople {
  currentTeam: PbSlot<PbPerson[]>;
  boardMembersAndObservers: PbSlot<PbPerson[]>;
  primaryContact: PbSlot<PbPerson>;
}

export interface PbStoredProfile {
  slug: string;
  companyId: string | null;
  name: string | null;
  entityType: string | null;
  profileLink: string | null;
  /** "matched" when PitchBook returned a profile, otherwise "unmatched". */
  state: "matched" | "unmatched";
  summary: PbSummary | PbState;
  deals: PbSlot<PbDeal[]>;
  dealsMeta: PbSlot<{ returned: number | null; total: number | null }>;
  investors: PbSlot<{ countAllInvestors: number | null; investors: PbInvestor[] }>;
  employeeHistory: PbSlot<PbEmployeePoint[]>;
  offices: PbSlot<{ hqOffice: Record<string, unknown> | null; alternateOffices: Record<string, unknown>[]; alternateOfficesCount: number | null }>;
  people: PbPeople | PbState;
  newsLast30Days: PbSlot<PbNews[]>;
  similarCompanies: PbSlot<PbSimilar[]>;
  affiliates: PbSlot<unknown[]>;
  financialsMostRecent: PbSlot<Record<string, unknown>>;
  exitPredictions: PbSlot<unknown>;
  matchedOn: PbSlot<PbMatchedOn>;
  unavailable: PbUnavailable[];
  warnings: string[];
  provenance: PbProvenance;
}

// ---------------------------------------------------------------------------
// Tolerant parsing of the LLM answer
// ---------------------------------------------------------------------------

/** Accepts an object, or a string containing JSON (possibly wrapped in ```json fences / prose). Returns null if unparseable. */
export function parseAnswerJson(input: unknown): Record<string, unknown> | null {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const o = input as Record<string, unknown>;
    // OnDemand submitquery envelope: { data: { answer: "..." } } or { answer: "..." }
    if (typeof o.answer === "string") return parseAnswerJson(o.answer);
    const data = o.data as Record<string, unknown> | undefined;
    if (data && typeof data === "object" && typeof data.answer === "string") return parseAnswerJson(data.answer);
    return o;
  }
  if (typeof input !== "string") return null;
  let s = input.trim();
  s = s.replace(/```(?:json|JSON)?\s*/g, "").replace(/```/g, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  const candidate = s.slice(first, last + 1);
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    // Try progressively trimming trailing junk after the last balanced brace.
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = 0; i < candidate.length; i++) {
      const ch = candidate[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          try {
            const parsed = JSON.parse(candidate.slice(0, i + 1));
            return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length === 0) return true;
  return false;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.trim() === "" ? null : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}
function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}
function bool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}
function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** Coded value: accepts {code, description} | string | null; decodes via table if description missing. */
function coded(v: unknown, table: Parameters<typeof decodeCode>[0], warnings: string[]): PbCoded | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" || typeof v === "number") {
    const code = String(v);
    // PitchBook summary fields already carry the description (e.g. "Publicly Held"); accept it without warning.
    const byDesc = Object.entries(ALL_CODES[table] ?? {}).find(([, d]) => d === code);
    if (byDesc) return { code: byDesc[0], description: byDesc[1] };
    return { code, description: decodeCode(table, code, warnings) };
  }
  const o = obj(v);
  if (!o) return null;
  const code = str(o.code) ?? "";
  const desc = str(o.description) ?? (code ? decodeCode(table, code, warnings) : "");
  if (!code && !desc) return null;
  return { code, description: desc };
}

function slot<T>(value: T | null | undefined, prov: PbProvenance, warnings?: string[]): PbSlot<T> {
  if (isEmpty(value)) return NOT_AVAILABLE;
  const p: PbProvenance = { ...prov };
  if (warnings && warnings.length) p.warnings = [...warnings];
  return { value: value as T, provenance: p };
}

function unavailableSlot<T>(prov: PbProvenance, u: PbUnavailable | undefined): PbSlot<T> {
  // Spec: sections listed in unavailable[] → the literal state, with the 404 message kept in provenance.note.
  // We keep the state string as the slot value (so UI shows "Not available in PitchBook") and expose the
  // note through deriveFromUnavailable(); callers wanting the note read `unavailableNotes`.
  void prov;
  void u;
  return NOT_AVAILABLE;
}

// ---------------------------------------------------------------------------
// unavailable[] handling
// ---------------------------------------------------------------------------

/** Map PitchBook `unavailable[].section` names to PbStoredProfile top-level keys. */
const SECTION_TO_KEY: Record<string, keyof PbStoredProfile> = {
  financials: "financialsMostRecent",
  mostRecentFinancials: "financialsMostRecent",
  "most-recent-financials": "financialsMostRecent",
  deals: "deals",
  investors: "investors",
  news: "newsLast30Days",
  newsLast30Days: "newsLast30Days",
  similarCompanies: "similarCompanies",
  affiliates: "affiliates",
  exitPredictions: "exitPredictions",
  people: "people",
  locations: "offices",
  offices: "offices",
  employeeHistory: "employeeHistory",
  bio: "summary",
  summary: "summary",
};

export function normalizeUnavailable(v: unknown): PbUnavailable[] {
  return arr(v)
    .map((x) => obj(x))
    .filter((x): x is Record<string, unknown> => !!x)
    .map((x) => ({
      section: str(x.section) ?? "unknown",
      status: num(x.status),
      reason: str(x.reason),
      message: str(x.message),
      path: str(x.path),
    }));
}

/**
 * For each section listed in `unavailable[]`, produce the profile key it maps to, the state string, and a
 * provenance carrying the 404 message as `note`. Sections not in the map are returned under their own name.
 */
export function deriveFromUnavailable(
  unavailable: unknown,
  prov?: Partial<PbProvenance>,
): Record<string, { state: typeof NOT_AVAILABLE; provenance: PbProvenance; section: string }> {
  const out: Record<string, { state: typeof NOT_AVAILABLE; provenance: PbProvenance; section: string }> = {};
  const base: PbProvenance = {
    source: "pitchbook",
    batch_id: prov?.batch_id ?? "",
    query_id: prov?.query_id ?? "",
    fetched_at: prov?.fetched_at ?? "",
  };
  for (const u of normalizeUnavailable(unavailable)) {
    const key = (SECTION_TO_KEY[u.section] ?? u.section) as string;
    const noteParts = [u.status ? `HTTP ${u.status}` : null, u.reason, u.message, u.path ? `(${u.path})` : null].filter(Boolean);
    const entry = { state: NOT_AVAILABLE, provenance: { ...base, note: noteParts.join(" ") }, section: u.section };
    if (out[key]) out[key].provenance.note = `${out[key].provenance.note}; ${entry.provenance.note}`;
    else out[key] = entry;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

function unmatchedProfile(meta: PbMeta, prov: PbProvenance, raw: Record<string, unknown> | null, warnings: string[]): PbStoredProfile {
  const matched = raw ? obj(raw.matchedOn) : null;
  return {
    slug: meta.slug,
    companyId: null,
    name: raw ? str(raw.name) : null,
    entityType: null,
    profileLink: null,
    state: "unmatched",
    summary: UNMATCHED,
    deals: UNMATCHED,
    dealsMeta: UNMATCHED,
    investors: UNMATCHED,
    employeeHistory: UNMATCHED,
    offices: UNMATCHED,
    people: UNMATCHED,
    newsLast30Days: UNMATCHED,
    similarCompanies: UNMATCHED,
    affiliates: UNMATCHED,
    financialsMostRecent: UNMATCHED,
    exitPredictions: UNMATCHED,
    matchedOn: matched ? slot(parseMatchedOn(matched), prov) : UNMATCHED,
    unavailable: raw ? normalizeUnavailable(raw.unavailable) : [],
    warnings,
    provenance: prov,
  };
}

function parseMatchedOn(m: Record<string, unknown>): PbMatchedOn {
  return {
    pbId: str(m.pbId) ?? str(m.companyId),
    score: num(m.score),
    source: str(m.source),
    profileLink: str(m.profileLink),
    type: str(m.type),
    website: str(m.website),
  };
}

function parsePerson(p: Record<string, unknown>, role?: string): PbPerson {
  const out: PbPerson = {
    personId: str(p.personId) ?? str(p.id),
    fullName: str(p.fullName) ?? str(p.name),
    title: str(p.title),
  };
  if ("email" in p) out.email = str(p.email);
  if ("phone" in p) out.phone = str(p.phone);
  if ("positionStart" in p) out.positionStart = str(p.positionStart);
  if (role) out.role = role;
  else if (typeof p.role === "string") out.role = p.role;
  return out;
}

function parseMoney(v: unknown): PbMoney | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return { amount: v, currency: null, native: v };
  if (typeof v === "string") {
    const m = v.match(/^([A-Z]{3})?\s*([\d.,]+)\s*([A-Z]{3})?$/);
    const amount = m ? num(m[2].replace(/,/g, "")) : null;
    return { amount, currency: m ? (m[1] ?? m[3] ?? null) : null, native: v };
  }
  const o = obj(v);
  if (!o) return null;
  return {
    amount: num(o.amount) ?? num(o.value) ?? num(o.native),
    currency: str(o.currency) ?? str(o.currencyCode) ?? str(o.nativeCurrency),
    native: o.native ?? o,
  };
}

export function parseCompanyProfile(answerJsonOrObject: unknown, meta: PbMeta): PbStoredProfile {
  const warnings: string[] = [];
  const prov: PbProvenance = {
    source: "pitchbook",
    batch_id: meta.batchId,
    query_id: meta.queryId,
    fetched_at: meta.fetchedAt,
  };
  const raw = parseAnswerJson(answerJsonOrObject);
  if (!raw) {
    warnings.push("answer is not parseable JSON");
    return unmatchedProfile(meta, prov, null, warnings);
  }
  const companyId = str(raw.companyId);
  if (raw.found === false || !companyId) {
    return unmatchedProfile(meta, prov, raw, warnings);
  }

  const unavailable = normalizeUnavailable(raw.unavailable);
  const derived = deriveFromUnavailable(raw.unavailable, prov);
  const unavailableNote = (key: string): string | undefined => derived[key]?.provenance.note;

  // ---- summary --------------------------------------------------------
  const s = obj(raw.summary) ?? {};
  const rawBio = obj(obj(raw.raw)?.bio) ?? {};
  const hq = obj(s.hqLocation);
  const hqLocation: PbHqLocation | null = hq
    ? { city: str(hq.city), country: str(hq.country), postCode: str(hq.postCode), stateProvince: str(hq.stateProvince) }
    : null;
  const codedStr = (v: unknown, table: Parameters<typeof decodeCode>[0]): string | null => {
    const c = coded(v, table, warnings);
    return c ? c.description || c.code : null;
  };
  const financingNoteRaw = s.financingStatusNote ?? rawBio.financingStatusNote;
  const financingStatusNote =
    typeof financingNoteRaw === "string" ? financingNoteRaw : obj(financingNoteRaw) ? str(obj(financingNoteRaw)!.description) ?? str(obj(financingNoteRaw)!.note) : null;
  const universe = arr(s.universe)
    .map((u) => (typeof u === "string" ? u : str(obj(u)?.description) ?? str(obj(u)?.code)))
    .filter((u): u is string => !!u);
  const summary: PbSummary = {
    name: slot(str(s.name) ?? str(raw.name), prov),
    legalName: slot(str(s.legalName), prov),
    alsoKnownAs: slot(Array.isArray(s.alsoKnownAs) ? (s.alsoKnownAs.filter((x) => typeof x === "string") as string[]) : str(s.alsoKnownAs), prov),
    formerlyKnownAs: slot(Array.isArray(s.formerlyKnownAs) ? (s.formerlyKnownAs.filter((x) => typeof x === "string") as string[]) : str(s.formerlyKnownAs), prov),
    description: slot(str(s.description), prov),
    website: slot(str(s.website), prov),
    yearFounded: slot(num(s.yearFounded), prov),
    employees: slot(num(s.employees), prov),
    hqLocation: slot(hqLocation && Object.values(hqLocation).some((x) => x) ? hqLocation : null, prov),
    location: slot(str(s.location), prov),
    ownershipStatus: slot(codedStr(s.ownershipStatus, "OWNERSHIP_STATUS"), prov),
    financingStatus: slot(typeof s.financingStatus === "string" ? s.financingStatus : str(obj(s.financingStatus)?.description), prov),
    financingStatusNote: slot(financingStatusNote, prov),
    businessStatus: slot(codedStr(s.businessStatus, "BUSINESS_STATUS"), prov),
    universe: slot(universe, prov),
    totalMoneyRaised: slot(parseMoney(s.totalMoneyRaised ?? rawBio.totalMoneyRaised), prov),
    parentCompany: slot(str(s.parentCompany) ?? str(obj(s.parentCompany)?.name), prov),
  };

  // ---- deals -----------------------------------------------------------
  const dealWarnings: string[] = [];
  const deals: PbDeal[] = arr(raw.deals)
    .map((d) => obj(d))
    .filter((d): d is Record<string, unknown> => !!d)
    .map((d) => {
      const t1 = coded(d.dealType1, "DEAL_TYPE", dealWarnings);
      const t2 = coded(d.dealType2, "DEAL_TYPE", dealWarnings);
      const t3 = coded(d.dealType3, "DEAL_TYPE", dealWarnings);
      return {
        dealId: str(d.dealId),
        dealDate: str(d.dealDate),
        dealNumber: num(d.dealNumber),
        dealType1: t1,
        dealType2: t2,
        dealType3: t3,
        dealTypes: [t1, t2, t3].map((t) => t?.description ?? "").filter(Boolean),
      };
    });
  warnings.push(...dealWarnings);
  const dm = obj(raw.dealsMeta);

  // ---- investors -------------------------------------------------------
  const invWarnings: string[] = [];
  const invRoot = obj(raw.investors);
  const investorsList: PbInvestor[] = arr(invRoot?.investors ?? (Array.isArray(raw.investors) ? raw.investors : []))
    .map((i) => obj(i))
    .filter((i): i is Record<string, unknown> => !!i)
    .map((i) => ({
      investorId: str(i.investorId),
      investorName: str(i.investorName),
      investorSince: str(i.investorSince),
      investorExit: str(i.investorExit),
      investorStatus: coded(i.investorStatus, "INVESTOR_STATUS", invWarnings),
      investorTypes: arr(i.investorTypes)
        .map((t) => obj(t))
        .filter((t): t is Record<string, unknown> => !!t)
        .map((t) => {
          const c = coded(t.type ?? t.code, "INVESTOR_TYPE", invWarnings);
          return { primary: bool(t.primary) ?? false, code: c?.code ?? "", description: c?.description ?? "" };
        })
        .filter((t) => t.code || t.description),
    }));
  warnings.push(...invWarnings);

  // ---- employee history -----------------------------------------------
  const employeeHistory: PbEmployeePoint[] = arr(raw.employeeHistory)
    .map((e) => obj(e))
    .filter((e): e is Record<string, unknown> => !!e)
    .map((e) => ({ asOfDate: str(e.asOfDate), employeeCount: num(e.employeeCount) }));

  // ---- offices ---------------------------------------------------------
  const off = obj(raw.offices);
  const hqOffice = obj(off?.hqOffice);
  const alternateOffices = arr(off?.alternateOffices).map((o) => obj(o)).filter((o): o is Record<string, unknown> => !!o);
  const offices = off && (hqOffice || alternateOffices.length) ? { hqOffice, alternateOffices, alternateOfficesCount: num(off.alternateOfficesCount) } : null;

  // ---- people ----------------------------------------------------------
  const rawPeople = obj(obj(raw.raw)?.people) ?? obj(raw.people) ?? {};
  const team = obj(raw.team);
  const primaryContactRaw = obj(team?.primaryContact) ?? obj(rawPeople.primaryContact);
  const currentTeam = arr(rawPeople.currentTeam).map((p) => obj(p)).filter((p): p is Record<string, unknown> => !!p).map((p) => parsePerson(p));
  const board = arr(rawPeople.currentBoardMembersAndObservers)
    .map((p) => obj(p))
    .filter((p): p is Record<string, unknown> => !!p)
    .map((p) => parsePerson(p));
  const people: PbPeople | PbState =
    derived.people && !currentTeam.length && !board.length && !primaryContactRaw
      ? NOT_AVAILABLE
      : {
          currentTeam: slot(currentTeam, prov),
          boardMembersAndObservers: slot(board, prov),
          primaryContact: slot(primaryContactRaw ? parsePerson(primaryContactRaw) : null, prov),
        };

  // ---- news / similar / affiliates ------------------------------------
  const news: PbNews[] = arr(raw.newsLast30Days)
    .map((n) => obj(n))
    .filter((n): n is Record<string, unknown> => !!n)
    .map((n) => ({ title: str(n.title), source: str(n.source), publishDate: str(n.publishDate), url: str(n.url), byline: str(n.byline) }));
  const similar: PbSimilar[] = arr(raw.similarCompanies)
    .map((c) => obj(c))
    .filter((c): c is Record<string, unknown> => !!c)
    .map((c) => ({
      similarCompanyId: str(c.similarCompanyId),
      similarCompanyName: str(c.similarCompanyName),
      similarityScore: num(c.similarityScore),
      competitor: bool(c.competitor),
    }));
  const affiliates = arr(raw.affiliates);

  // ---- financials / exit predictions ----------------------------------
  const fin = obj(raw.financials);
  const mostRecent = obj(fin?.mostRecent) ?? obj(obj(raw.raw)?.mostRecentFinancials);
  const exitPredictions = isEmpty(raw.exitPredictions) ? null : raw.exitPredictions;

  // ---- assemble, applying unavailable[] notes --------------------------
  const withNote = <T>(key: string, s: PbSlot<T>): PbSlot<T> => {
    if (typeof s === "string") return s;
    const note = unavailableNote(key);
    return note ? { ...s, provenance: { ...s.provenance, note } } : s;
  };
  const sectionSlot = <T>(key: string, value: T | null | undefined, w?: string[]): PbSlot<T> => {
    if (isEmpty(value)) return unavailableSlot<T>(prov, undefined);
    return withNote(key, slot(value, prov, w));
  };

  const profile: PbStoredProfile = {
    slug: meta.slug,
    companyId,
    name: str(raw.name) ?? str(s.name),
    entityType: str(raw.entityType),
    profileLink: str(raw.profileLink) ?? str(obj(raw.matchedOn)?.profileLink),
    state: "matched",
    summary,
    deals: sectionSlot("deals", deals, dealWarnings),
    dealsMeta: sectionSlot("dealsMeta", dm ? { returned: num(dm.returned), total: num(dm.total) } : null),
    investors: sectionSlot(
      "investors",
      investorsList.length || num(invRoot?.countAllInvestors) ? { countAllInvestors: num(invRoot?.countAllInvestors), investors: investorsList } : null,
      invWarnings,
    ),
    employeeHistory: sectionSlot("employeeHistory", employeeHistory),
    offices: sectionSlot("offices", offices),
    people,
    newsLast30Days: sectionSlot("newsLast30Days", news),
    similarCompanies: sectionSlot("similarCompanies", similar),
    affiliates: sectionSlot("affiliates", affiliates),
    financialsMostRecent: sectionSlot("financialsMostRecent", mostRecent),
    exitPredictions: sectionSlot("exitPredictions", exitPredictions),
    matchedOn: sectionSlot("matchedOn", obj(raw.matchedOn) ? parseMatchedOn(obj(raw.matchedOn)!) : null),
    unavailable,
    warnings,
    provenance: prov,
  };
  return profile;
}

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

export interface PbCoverage {
  populated: number;
  unavailable: number;
  unmatched: number;
  /** keys per bucket, for debugging / UI. */
  keys: { populated: string[]; unavailable: string[]; unmatched: string[] };
  /** notes from unavailable[] keyed by profile key. */
  unavailableNotes: Record<string, string>;
}

const SECTION_KEYS: (keyof PbStoredProfile)[] = [
  "deals",
  "dealsMeta",
  "investors",
  "employeeHistory",
  "offices",
  "newsLast30Days",
  "similarCompanies",
  "affiliates",
  "financialsMostRecent",
  "exitPredictions",
  "matchedOn",
];

export function coverage(profile: PbStoredProfile): PbCoverage {
  const keys = { populated: [] as string[], unavailable: [] as string[], unmatched: [] as string[] };
  const classify = (key: string, v: unknown) => {
    if (v === UNMATCHED) keys.unmatched.push(key);
    else if (v === NOT_AVAILABLE) keys.unavailable.push(key);
    else keys.populated.push(key);
  };
  if (typeof profile.summary === "string") classify("summary", profile.summary);
  else for (const [k, v] of Object.entries(profile.summary)) classify(`summary.${k}`, v);
  if (typeof profile.people === "string") classify("people", profile.people);
  else for (const [k, v] of Object.entries(profile.people)) classify(`people.${k}`, v);
  for (const k of SECTION_KEYS) classify(k, profile[k]);
  const unavailableNotes: Record<string, string> = {};
  for (const [k, v] of Object.entries(deriveFromUnavailable(profile.unavailable, profile.provenance))) unavailableNotes[k] = v.provenance.note ?? "";
  return {
    populated: keys.populated.length,
    unavailable: keys.unavailable.length,
    unmatched: keys.unmatched.length,
    keys,
    unavailableNotes,
  };
}
