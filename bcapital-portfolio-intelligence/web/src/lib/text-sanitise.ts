/**
 * Headline / title and summary sanitiser for news and feed cards (owner: A3).
 * Strips trailing site suffixes such as "| 领英", "| LinkedIn", "- X", "• Reddit".
 */

export const KNOWN_SITE_SUFFIXES = new Set([
  "领英",
  "LinkedIn",
  "X",
  "Twitter",
  "Reddit",
  "YouTube",
  "Facebook",
  "Instagram",
  "Medium",
  "Substack",
  "Reuters",
  "Bloomberg",
  "TechCrunch",
  "Forbes",
  "The Verge",
  "Crunchbase",
  "PitchBook",
]);

// Suffix pattern: separator [|•–—-] followed by known site name or uppercase site name
const SUFFIX_RE =
  /(?:\s+[|•–—\-]\s*|\s*[|•]\s*)(领英|LinkedIn|X|Twitter|Reddit|YouTube|Facebook|Instagram|Medium|Substack|Reuters|Bloomberg|TechCrunch|Forbes|The Verge|Crunchbase|PitchBook|[A-Z][\w .&'-]{1,40})$/;

function stripQuotes(str: string): string {
  let s = str.trim();
  const pairs: [string, string][] = [
    ['"', '"'],
    ["'", "'"],
    ["“", "”"],
    ["‘", "’"],
  ];
  for (const [start, end] of pairs) {
    if (s.startsWith(start) && s.endsWith(end) && s.length >= 2) {
      s = s.slice(start.length, s.length - end.length).trim();
    }
  }
  return s;
}

export function sanitiseTitle(title: string | null | undefined): string {
  if (!title) return "";
  let clean = title.replace(/\s+/g, " ").trim();
  clean = stripQuotes(clean);
  if (!clean) return "";

  const match = clean.match(SUFFIX_RE);
  if (match && match.index !== undefined) {
    const suffix = match[1].trim();
    const remaining = clean.slice(0, match.index).trim();
    const isKnown = KNOWN_SITE_SUFFIXES.has(suffix);
    // ONLY when suffix is known or remaining title is >= 12 chars (never strip down to nothing)
    if (remaining.length > 0 && (isKnown || remaining.length >= 12)) {
      clean = stripQuotes(remaining);
    }
  }
  return clean.replace(/\s+/g, " ").trim();
}

export function sanitiseSummary(summary: string | null | undefined): string {
  if (!summary) return "";
  return sanitiseTitle(summary);
}
