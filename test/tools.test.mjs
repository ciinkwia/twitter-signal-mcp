// Pure unit tests — no network, no wallet, no CDP env required.
// Covers: the tool catalog shape (all 12 tools present, priced) and URL
// building for every tier, including the seven endpoints added 2026-09-15
// (x_user_timeline, x_profile, x_tweet, x_replies, x_find_accounts,
// x_account_verdict, x_watch) and x_ticker_pulse added 2026-09-22.
//
// Run: node test/tools.test.mjs  (also `npm test`)
import assert from "node:assert/strict";
import { TOOLS, TIER_PATHS } from "../src/tools.js";
import { buildUrl } from "../src/datasource.js";

// ---- catalog shape -----------------------------------------------------------
const names = TOOLS.map((t) => t.name).sort();
assert.deepEqual(
  names,
  [
    "x_account_verdict",
    "x_digest",
    "x_find_accounts",
    "x_leads",
    "x_pain_points",
    "x_profile",
    "x_replies",
    "x_search",
    "x_ticker_pulse",
    "x_tweet",
    "x_user_timeline",
    "x_watch",
  ],
  "tool catalog should list all 12 tools"
);

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

assert.equal(byName.x_user_timeline.priceUsd, "0.02");
assert.equal(byName.x_profile.priceUsd, "0.02");
assert.equal(byName.x_tweet.priceUsd, "0.01");
assert.equal(byName.x_replies.priceUsd, "0.02");
assert.equal(byName.x_find_accounts.priceUsd, "0.02");
assert.equal(byName.x_account_verdict.priceUsd, "0.02");
assert.equal(byName.x_watch.priceUsd, "0.05");
assert.ok("username" in byName.x_user_timeline.inputShape, "x_user_timeline should declare username");
assert.ok("id" in byName.x_tweet.inputShape, "x_tweet should declare id");
assert.ok("since" in byName.x_watch.inputShape, "x_watch should declare optional since");

assert.equal(byName.x_ticker_pulse.priceUsd, "0.02");
assert.ok("ticker" in byName.x_ticker_pulse.inputShape, "x_ticker_pulse should declare ticker");
assert.ok("window" in byName.x_ticker_pulse.inputShape, "x_ticker_pulse should declare optional window");
assert.equal(TIER_PATHS.ticker_pulse, "/x/ticker-pulse");
assert.equal(buildUrl("https://x.test", TIER_PATHS.ticker_pulse, { ticker: "TSLA", window: "24h" }), "https://x.test/x/ticker-pulse?ticker=TSLA&window=24h");

console.log("tool catalog: OK (12 tools, all priced with an inputShape)");

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

// x_user_timeline / x_profile / x_account_verdict: username
const timelineUrl = new URL(buildUrl(BASE, TIER_PATHS.user, { username: "elonmusk" }));
assert.equal(timelineUrl.pathname, "/x/user");
assert.equal(timelineUrl.searchParams.get("username"), "elonmusk");

const profileUrl = new URL(buildUrl(BASE, TIER_PATHS.profile, { username: "elonmusk" }));
assert.equal(profileUrl.pathname, "/x/profile");

const verdictUrl = new URL(buildUrl(BASE, TIER_PATHS.account_verdict, { username: "elonmusk" }));
assert.equal(verdictUrl.pathname, "/x/account-verdict");

// x_tweet / x_replies: id
const tweetUrl = new URL(buildUrl(BASE, TIER_PATHS.tweet, { id: "1859012345678901234" }));
assert.equal(tweetUrl.pathname, "/x/tweet");
assert.equal(tweetUrl.searchParams.get("id"), "1859012345678901234");

const repliesUrl = new URL(buildUrl(BASE, TIER_PATHS.replies, { id: "1859012345678901234" }));
assert.equal(repliesUrl.pathname, "/x/replies");

// x_find_accounts: query
const findUrl = new URL(buildUrl(BASE, TIER_PATHS.users, { query: "solar tech" }));
assert.equal(findUrl.pathname, "/x/users");
assert.equal(findUrl.searchParams.get("query"), "solar tech");

// x_watch: query + optional since
const watchUrl = new URL(buildUrl(BASE, TIER_PATHS.watch, { query: "$NVDA", since: "1859000000000000000" }));
assert.equal(watchUrl.pathname, "/x/watch");
assert.equal(watchUrl.searchParams.get("since"), "1859000000000000000");

const watchNoSince = new URL(buildUrl(BASE, TIER_PATHS.watch, { query: "$NVDA", since: undefined }));
assert.equal(watchNoSince.searchParams.has("since"), false, "omitted since must not appear in the URL");

console.log("URL building: OK (user, profile, account-verdict, tweet, replies, users, watch)");

// x_search paging: cursor is declared and passed through
{
  const search = TOOLS.find((t) => t.name === "x_search");
  assert.ok(search.inputShape.cursor, "x_search must accept a cursor");
  const u = new URL(buildUrl(BASE, TIER_PATHS.search, { query: "x402", cursor: "abc=/+" }));
  assert.equal(u.searchParams.get("cursor"), "abc=/+");
}

// Empty = free: the shop's 404 no_results is an answer, not an error
{
  const { X402DataSource } = await import("../src/datasource.js");
  const fake = async () => new Response(JSON.stringify({ error: "no_results", message: "not charged", result_count: 0, tweets: [] }), { status: 404, headers: { "content-type": "application/json" } });
  const ds = new X402DataSource({ baseUrl: BASE, paidFetch: fake });
  const r = await ds.fetchTier("search", { query: "zzz" });
  assert.equal(r.ok, true);
  assert.equal(r.data.charged, false);
  assert.equal(r.data.result_count, 0);
  const other = new X402DataSource({ baseUrl: BASE, paidFetch: async () => new Response("{}", { status: 404, headers: { "content-type": "application/json" } }) });
  assert.equal((await other.fetchTier("search", { query: "zzz" })).ok, false);
}
console.log("friction promises: OK (cursor paging, no_results = not charged)");
