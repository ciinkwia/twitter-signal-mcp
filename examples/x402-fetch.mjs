// Plain Node, no MCP: call clink's shop with automatic x402 payment.
// Pays from an ordinary private-key wallet holding a little USDC on Base — no CDP account needed.
//
//   npm i @x402/fetch @x402/evm viem
//   BUYER_PK=0x... node x402-fetch.mjs "from:elonmusk starship"
//
// Each call costs a cent or two (x_search is $0.02). Nothing found = nothing charged.
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

if (!process.env.BUYER_PK) throw new Error("Set BUYER_PK to a 0x... private key of a wallet with USDC on Base");
const signer = privateKeyToAccount(process.env.BUYER_PK);

const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(signer));
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const query = process.argv[2] ?? "x402";
const url = `https://clinkagent.com/x/search?query=${encodeURIComponent(query)}`;
const res = await fetchWithPayment(url, { method: "GET" });
const body = await res.json();

console.log("status:", res.status);
if (res.status === 200) {
  console.log("result_count:", body.result_count);
  console.log("receipt:", body.receipt); // per-call receipt: id, price, rail, time
} else {
  console.log(body);
}
