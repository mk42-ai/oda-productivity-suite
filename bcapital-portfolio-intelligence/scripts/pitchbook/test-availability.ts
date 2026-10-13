import assert from "node:assert";
import {
  computeAvailability,
  coverageOf,
  emptyStateCount,
  fieldsPopulated,
  isFieldAvailable,
  NOT_AVAILABLE_LABEL,
  PITCHBOOK_AVAILABILITY_FIELDS,
} from "../../src/pitchbook-availability.js";

console.log("Running pitchbook-availability unit tests...");

// 1. Label check
assert.strictEqual(
  NOT_AVAILABLE_LABEL,
  "Not available in PitchBook",
  "NOT_AVAILABLE_LABEL must match expected literal"
);

// 2. Field count check (20 fields: 18 schema + investments_count + pitchbook_profile_url)
assert.strictEqual(
  PITCHBOOK_AVAILABILITY_FIELDS.length,
  20,
  "Must evaluate exactly 20 fields"
);
assert.ok(
  PITCHBOOK_AVAILABILITY_FIELDS.includes("investments_count"),
  "Must include investments_count"
);
assert.ok(
  PITCHBOOK_AVAILABILITY_FIELDS.includes("pitchbook_profile_url"),
  "Must include pitchbook_profile_url"
);
assert.ok(
  PITCHBOOK_AVAILABILITY_FIELDS.includes("overview"),
  "Must include overview"
);

// 3. Case 1: null field -> not_available
assert.strictEqual(isFieldAvailable(null), false, "null object must be not_available");
assert.strictEqual(
  isFieldAvailable({ value: null, provenance: { source: "PitchBook" } }),
  false,
  "null value with provenance must be not_available"
);
assert.strictEqual(
  isFieldAvailable({ value: undefined, provenance: { source: "PitchBook" } }),
  false,
  "undefined value with provenance must be not_available"
);

// 4. Case 2: empty array -> not_available
assert.strictEqual(
  isFieldAvailable({ value: [], provenance: { source: "PitchBook" } }),
  false,
  "empty array must be not_available"
);

// 5. Case 3: missing provenance -> not_available
assert.strictEqual(
  isFieldAvailable({ value: "San Francisco, CA" }),
  false,
  "missing provenance property must be not_available"
);
assert.strictEqual(
  isFieldAvailable({ value: "San Francisco, CA", provenance: null }),
  false,
  "null provenance must be not_available"
);
assert.strictEqual(
  isFieldAvailable({ value: "San Francisco, CA", provenance: { source: "" } }),
  false,
  "empty source in provenance must be not_available"
);
assert.strictEqual(
  isFieldAvailable({ value: "San Francisco, CA", provenance: { source: "   " } }),
  false,
  "whitespace-only source in provenance must be not_available"
);

// 6. Case 4: populated -> available
assert.strictEqual(
  isFieldAvailable({ value: "Enterprise SaaS platform", provenance: { source: "PitchBook" } }),
  true,
  "populated string with provenance must be available"
);
assert.strictEqual(
  isFieldAvailable({ value: ["Investor A", "Investor B"], provenance: { source: "PitchBook" } }),
  true,
  "non-empty array with provenance must be available"
);
assert.strictEqual(
  isFieldAvailable({ value: 150000000, provenance: { source: "PitchBook" } }),
  true,
  "positive number with provenance must be available"
);
assert.strictEqual(
  isFieldAvailable({ value: 0, provenance: { source: "PitchBook" } }),
  true,
  "numeric 0 with provenance must be available"
);

// Additional edge cases: empty string
assert.strictEqual(
  isFieldAvailable({ value: "", provenance: { source: "PitchBook" } }),
  false,
  "empty string must be not_available"
);
assert.strictEqual(
  isFieldAvailable({ value: "   ", provenance: { source: "PitchBook" } }),
  false,
  "whitespace string must be not_available"
);

// 7. Test computeAvailability on a synthetic profile
const testProfile = {
  slug: "test-co",
  name: "Test Co",
  overview: { value: "Test overview", provenance: { source: "PitchBook" } }, // available
  hq: null, // not_available (null)
  founded: { value: "2020", provenance: { source: "PitchBook" } }, // available
  status: { value: "", provenance: { source: "PitchBook" } }, // not_available (empty string)
  employees: { value: "50", provenance: null }, // not_available (missing provenance)
  website: { value: "https://test.co", provenance: { source: "PitchBook" } }, // available
  contact: null, // not_available
  last_financing_date: null,
  last_financing_size_usd: null,
  last_financing_type: null,
  post_money_valuation_usd: { value: 100000000, provenance: { source: "PitchBook" } }, // available
  total_raised_usd: null,
  investors: { value: [], provenance: { source: "PitchBook" } }, // not_available (empty array)
  deal_history: null,
  executives: null,
  board_members: null,
  competitors: null,
  similar_companies: null,
  investments_count: { value: 5, provenance: { source: "PitchBook" } }, // available
  pitchbook_profile_url: null,
};

const availability = computeAvailability(testProfile);

// Verify all 20 fields are present in the returned object
for (const field of PITCHBOOK_AVAILABILITY_FIELDS) {
  assert.ok(field in availability, `Field ${field} must be in computed availability`);
  assert.ok(
    availability[field] === "available" || availability[field] === "not_available",
    `Field ${field} must be "available" or "not_available"`
  );
}

// Verify specific values
assert.strictEqual(availability.overview, "available");
assert.strictEqual(availability.hq, "not_available");
assert.strictEqual(availability.founded, "available");
assert.strictEqual(availability.status, "not_available");
assert.strictEqual(availability.employees, "not_available");
assert.strictEqual(availability.website, "available");
assert.strictEqual(availability.post_money_valuation_usd, "available");
assert.strictEqual(availability.investors, "not_available");
assert.strictEqual(availability.investments_count, "available");
assert.strictEqual(availability.pitchbook_profile_url, "not_available");

// Available fields: overview, founded, website, post_money_valuation_usd, investments_count (5)
// Not available: 15
assert.strictEqual(fieldsPopulated(testProfile), 5, "fieldsPopulated for testProfile must be 5");
assert.strictEqual(emptyStateCount(testProfile), 15, "emptyStateCount for testProfile must be 15");

// 8. Test coverageOf, emptyStateCount, fieldsPopulated across a map of profiles
const profilesMap = {
  "test-1": testProfile,
  "test-2": {
    slug: "test-2",
    name: "Test 2",
    overview: null,
    hq: { value: "New York, NY", provenance: { source: "PitchBook" } },
    founded: null,
    status: null,
    employees: null,
    website: null,
    contact: null,
    last_financing_date: null,
    last_financing_size_usd: null,
    last_financing_type: null,
    post_money_valuation_usd: null,
    total_raised_usd: null,
    investors: null,
    deal_history: null,
    executives: null,
    board_members: null,
    competitors: null,
    similar_companies: null,
    investments_count: null,
    pitchbook_profile_url: { value: "https://pitchbook.com/profiles/test-2", provenance: { source: "PitchBook" } },
  },
};

const coverage = coverageOf(profilesMap);
assert.strictEqual(coverage.overview.populated, 1);
assert.strictEqual(coverage.overview.not_available, 1);
assert.strictEqual(coverage.hq.populated, 1);
assert.strictEqual(coverage.hq.not_available, 1);
assert.strictEqual(coverage.pitchbook_profile_url.populated, 1);
assert.strictEqual(coverage.pitchbook_profile_url.not_available, 1);
assert.strictEqual(coverage.deal_history.populated, 0);
assert.strictEqual(coverage.deal_history.not_available, 2);

const totalPopulated = fieldsPopulated(profilesMap);
const totalEmpty = emptyStateCount(profilesMap);
assert.strictEqual(totalPopulated, 5 + 2, "Total populated should be 7 across both profiles");
assert.strictEqual(totalEmpty, 15 + 18, "Total empty should be 33 across both profiles");
assert.strictEqual(totalPopulated + totalEmpty, 40, "Sum of populated and empty must equal 40 (2 * 20)");

console.log("All unit tests passed successfully!");
