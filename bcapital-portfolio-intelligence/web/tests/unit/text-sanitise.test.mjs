import test from "node:test";
import assert from "node:assert/strict";
import { sanitiseTitle, sanitiseSummary } from "../../src/lib/text-sanitise.ts";

test("empty and null titles", () => {
  assert.equal(sanitiseTitle(""), "");
  assert.equal(sanitiseTitle(null), "");
  assert.equal(sanitiseTitle(undefined), "");
  assert.equal(sanitiseTitle("   "), "");
});

test("strips Chinese 领英 suffix", () => {
  assert.equal(
    sanitiseTitle("Anthropic signs cloud compute partnership | 领英"),
    "Anthropic signs cloud compute partnership"
  );
  assert.equal(
    sanitiseTitle("Startup updates product line … | 领英"),
    "Startup updates product line …"
  );
});

test("strips - X suffix", () => {
  assert.equal(
    sanitiseTitle("OpenAI announces latest benchmark results - X"),
    "OpenAI announces latest benchmark results"
  );
});

test("strips • Reddit suffix", () => {
  assert.equal(
    sanitiseTitle("Community discussion on new LLM release • Reddit"),
    "Community discussion on new LLM release"
  );
});

test("strips standard news suffixes (| Reuters, - YouTube, | Bloomberg, — TechCrunch)", () => {
  assert.equal(
    sanitiseTitle("Federal Reserve signals rate hold decision | Reuters"),
    "Federal Reserve signals rate hold decision"
  );
  assert.equal(
    sanitiseTitle("Founders interview live at TechCrunch Disrupt - YouTube"),
    "Founders interview live at TechCrunch Disrupt"
  );
  assert.equal(
    sanitiseTitle("Global venture capital flows slow in Q3 | Bloomberg"),
    "Global venture capital flows slow in Q3"
  );
  assert.equal(
    sanitiseTitle("Enterprise AI software adoption surges — TechCrunch"),
    "Enterprise AI software adoption surges"
  );
});

test("preserves title with legitimate hyphen in the middle", () => {
  assert.equal(
    sanitiseTitle("Co-founder and CEO talks pre-seed funding strategy"),
    "Co-founder and CEO talks pre-seed funding strategy"
  );
  assert.equal(
    sanitiseTitle("State-of-the-art vision models in autonomous driving"),
    "State-of-the-art vision models in autonomous driving"
  );
});

test("collapses multiple whitespaces", () => {
  assert.equal(
    sanitiseTitle("  Big   tech   merger   approved  |  Reuters  "),
    "Big tech merger approved"
  );
});

test("strips surrounding quotes", () => {
  assert.equal(
    sanitiseTitle('"Exclusive: Unicorn startup raises Series B | Forbes"'),
    "Exclusive: Unicorn startup raises Series B"
  );
  assert.equal(
    sanitiseTitle('“New valuation benchmark established” - X'),
    "New valuation benchmark established"
  );
});

test("does not strip down to empty when title is only the suffix", () => {
  assert.equal(sanitiseTitle("- X"), "- X");
  assert.equal(sanitiseTitle("| 领英"), "| 领英");
  assert.equal(sanitiseTitle("• Reddit"), "• Reddit");
});

test("unknown suffix only stripped if remaining title is >= 12 chars", () => {
  // remaining is 5 chars (< 12) with unknown suffix -> preserved
  assert.equal(sanitiseTitle("Short - CustomBlog"), "Short - CustomBlog");
  // remaining is >= 12 chars with uppercase suffix -> stripped
  assert.equal(
    sanitiseTitle("A Very Long Story About Startups - CustomBlog"),
    "A Very Long Story About Startups"
  );
});

test("sanitiseSummary collapses whitespace and strips trailing suffix", () => {
  assert.equal(
    sanitiseSummary("Summary of recent quarterly performance   data  | Reuters"),
    "Summary of recent quarterly performance data"
  );
  assert.equal(sanitiseSummary(""), "");
  assert.equal(sanitiseSummary(null), "");
});
