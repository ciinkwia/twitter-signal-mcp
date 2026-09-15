// Pure unit tests — no network, no wallet, no CDP env required.
// Covers: the tool catalog shape (all 4 tools present, priced) and URL
// building for every tier, including the two new endpoints added 2026-09-14
// (x_leads -> /x/leads, x_pain_points -> /x/pain-points).
//
// Run: node test/tools.test.mjs  (also `npm test`)
import assert from "node:assert/strict";
import { TOOLS, TIER_PATHS } from "../src/tools.js";
import { buildUrl } from "../src/datasource.js";

// ---- catalog shape -----------------------------------------------------------
const names = TOOLS.map((t) => t.name).sort();
assert.deepEqual(names, ["x_digest", "x_leads", "x_pain_points", "x_search"], "tool catalog should list all 4 tools");

for (const tool of TOOLS) {
  assert.ok(TIER_PATHS[tool.tier], `tool ${tool.name} has no TIER_PATHS entry for tier "${tool.tier}"`);
  assert.ok(tool.priceUsd, `tool ${tool.name} missing priceUsd`);
  assert.ok(tool.inputShape && Object.keys(tool.inputShape).length > 0, `tool ${tool.name} missing inputShape`);
}

const byName = Object.fromEntries(TOOLS.map((t) => [t.name, t]));
assert.equal(byName.x_leads.priceUsd, "0.05");
assert.equal(byName.x_pain_points.priceUsd, "0.05");
assert.ok("max" in byName.x_leads.inputShape, "x_leads inputShape should declare optional max");
assert.ok("product" in byName.x_pain_points.inputShape, "x_pain_points inputShape should declare product");
console.log("tool catalog: OK (4 tools, all priced with an inputShape)");

// ---- URL building --------------------------------------------------------------
const BASE = "https://clink-lithium-vault.fly.dev";

assert.equal(
  buildUrl(BASE, TIER_PATHS.search, { query: "from:elonmusk starship" }),
  "https://clink-lithium-vault.fly.dev/x/search?query=from%3Aelonmusk+starship",
);
assert.equal(
  buildUrl(BASE, TIER_PATHS.digest, { query: "#bitcoin min_faves:100" }),
  "https://clink-lithium-vault.fly.dev/x/digest?query=%23bitcoin+min_faves%3A100",
);

// x_leads: query + optional max — both present
const leadsUrl = new URL(buildUrl(BASE, TIER_PATHS.leads, { query: "\"open to work\" web3", max: "40" }));
assert.equal(leadsUrl.pathname, "/x/leads");
assert.equal(leadsUrl.searchParams.get("query"), '"open to work" web3');
assert.equal(leadsUrl.searchParams.get("max"), "40");

// x_leads: max omitted (undefined) must NOT appear in the query string
const leadsNoMax = new URL(buildUrl(BASE, TIER_PATHS.leads, { query: "cofounder wanted", max: undefined }));
assert.equal(leadsNoMax.searchParams.has("max"), false, "omitted max must not appear in the URL");
assert.equal(leadsNoMax.searchParams.get("query"), "cofounder wanted");

// x_pain_points: product, not query
const painUrl = new URL(buildUrl(BASE, TIER_PATHS.pain_points, { product: "Cursor" }));
assert.equal(painUrl.pathname, "/x/pain-points");
assert.equal(painUrl.searchParams.get("product"), "Cursor");
assert.equal(painUrl.searchParams.has("query"), false, "x_pain_points must not send a query param");

console.log("URL building: OK (search, digest, leads [with/without max], pain-points)");
