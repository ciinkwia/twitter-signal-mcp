// Smoke test: spawn the MCP server over stdio, list tools, and (if SMOKE_PAY=1)
// make one real paid call to prove the MCP -> x402 -> API -> data loop.
//
// Requires CDP_API_KEY_ID / CDP_API_KEY_SECRET / CDP_WALLET_SECRET in the env.
// Point CDP_ACCOUNT_NAME at a FUNDED account (e.g. clink-test-buyer) for the
// paid leg, since a fresh account has no USDC.
//
//   set -a; source ../clink-wallet/.env; set +a
//   export CDP_ACCOUNT_NAME=clink-test-buyer CDP_NETWORK=base
//   node test/smoke.js              # catalog only, no spend
//   SMOKE_PAY=1 node test/smoke.js  # + one real $0.006 x_search call

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const PAY = process.env.SMOKE_PAY === "1";

// StdioClientTransport does NOT forward arbitrary env by default — pass it explicitly.
const env = {};
for (const k of [
  "PATH",
  "CDP_API_KEY_ID",
  "CDP_API_KEY_SECRET",
  "CDP_WALLET_SECRET",
  "CDP_ACCOUNT_NAME",
  "CDP_NETWORK",
  "X_SIGNAL_BASE_URL",
  "X402_MAX_PRICE",
]) {
  if (process.env[k]) env[k] = process.env[k];
}

const transport = new StdioClientTransport({
  command: "node",
  args: ["src/index.js"],
  env,
});

const client = new Client({ name: "smoke", version: "0.0.0" });
await client.connect(transport);

console.log("connected.\n");

const { tools } = await client.listTools();
console.log(`TOOLS (${tools.length}):`);
for (const t of tools) {
  const props = Object.keys(t.inputSchema?.properties ?? {}).join(", ");
  console.log(`  - ${t.name}  [in: ${props}]`);
  console.log(`      ${t.description.slice(0, 90)}...`);
}

const names = tools.map((t) => t.name).sort();
// Every /x/* route the shop sells (0.3.0 mirrors all of them - see the
// MCP-mirror rule in clink-wallet/CLAUDE.md). Update together with src/tools.js.
const expected = [
  "x_account_verdict", "x_digest", "x_find_accounts", "x_leads", "x_pain_points",
  "x_profile", "x_replies", "x_search", "x_tweet", "x_user_timeline", "x_watch",
].sort();
const ok = JSON.stringify(names) === JSON.stringify(expected);
console.log(`\nTool catalog ${ok ? "OK" : "*** MISMATCH ***"}`);
if (!ok) {
  // Was a print-only warning, so the stale 0.2.0 list survived the bump to
  // 0.3.0 unnoticed. Fail the run instead.
  console.error("  expected:", expected.join(", "));
  console.error("  actual:  ", names.join(", "));
  process.exitCode = 1;
}

if (PAY) {
  console.log('\n--- paid call: x_search { query: "lithium min_faves:20" } ---');
  const res = await client.callTool({
    name: "x_search",
    arguments: { query: "lithium min_faves:20" },
  });
  const text = res.content?.[0]?.text ?? "";
  if (res.isError) {
    console.log("ERROR:", text);
  } else {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    console.log(`SUCCESS — ${text.length} bytes returned.`);
    if (parsed?.meta) console.log("meta:", JSON.stringify(parsed.meta));
    console.log("result_count:", parsed?.result_count);
    console.log("first tweet author:", parsed?.tweets?.[0]?.author);
  }
} else {
  console.log("\n(skipped paid call — set SMOKE_PAY=1 to exercise the full x402 loop)");
}

await client.close();
process.exit(0);
