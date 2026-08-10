// DataSource — resolves a (tier, {query}) request into a result:
//   { ok: true, data }                      on success
//   { ok: false, error, status, body }      on a handled failure
//
// X402DataSource pays the X Signal API's x402 endpoint from the caller's wallet
// after a pre-flight price-ceiling check. The seam exists so a future hosted
// variant (server-side wallet, subscription, or free preview tier) can drop in
// without touching tools.js or the MCP wiring.

import { TIER_PATHS } from "./tools.js";

const usd = (atomic) => "$" + (Number(atomic) / 1e6).toFixed(3);

export class X402DataSource {
  /**
   * @param {object} opts
   * @param {string} opts.baseUrl    API origin, e.g. https://clink-lithium-vault.fly.dev
   * @param {typeof fetch} opts.paidFetch  x402-wrapped fetch bound to the caller's wallet.
   * @param {bigint} [opts.maxAtomic] Per-call ceiling in atomic USDC (6 decimals). Omit to disable.
   */
  constructor({ baseUrl, paidFetch, maxAtomic }) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.paidFetch = paidFetch;
    this.maxAtomic = maxAtomic;
  }

  // Pre-flight: read the advertised price from the unpaid 402 WITHOUT paying and
  // refuse if the cheapest option exceeds the ceiling. Gives a clear error without
  // touching the wallet; the requirements selector in x402.js is the backstop.
  //
  // x402 v2 puts the challenge in the base64 PAYMENT-REQUIRED header (the body is
  // empty) and quotes the price as atomic `amount`.
  async _priceGuard(url) {
    if (this.maxAtomic === undefined) return { blocked: false };
    let accepts;
    try {
      const r = await fetch(url, { method: "GET" }); // unpaid -> 402
      const hdr = r.headers.get("payment-required");
      if (!hdr) return { blocked: false };
      const decoded = JSON.parse(Buffer.from(hdr, "base64").toString("utf8"));
      accepts = decoded.accepts || [];
    } catch {
      return { blocked: false };
    }
    const amounts = accepts
      .map((a) => {
        try {
          return BigInt(a.amount ?? a.value ?? a.maxAmountRequired ?? 0);
        } catch {
          return 0n;
        }
      })
      .filter((x) => x > 0n);
    if (!amounts.length) return { blocked: false };
    const cheapest = amounts.reduce((m, x) => (x < m ? x : m));
    if (cheapest > this.maxAtomic) {
      return {
        blocked: true,
        error:
          `Refused to pay: the endpoint asks at least ${usd(cheapest)} USDC, ` +
          `above your X402_MAX_PRICE of ${usd(this.maxAtomic)}. No charge was made.`,
      };
    }
    return { blocked: false };
  }

  async fetchTier(tier, { query }) {
    const path = TIER_PATHS[tier];
    if (!path) return { ok: false, error: `Unknown tier "${tier}".`, status: 0 };

    const url = `${this.baseUrl}${path}?query=${encodeURIComponent(query)}`;

    const guard = await this._priceGuard(url);
    if (guard.blocked) return { ok: false, status: 0, error: guard.error };

    let res;
    try {
      res = await this.paidFetch(url, { method: "GET" });
    } catch (e) {
      return {
        ok: false,
        status: 0,
        error:
          `Payment was not made: ${e?.message || e}. ` +
          `Check the wallet is funded with USDC on Base.`,
      };
    }

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json")
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => "");

    if (res.status === 200) {
      // The API never 500s after payment: an upstream failure returns 200 with an
      // `error` field so the buyer knows a refund was logged. Surface that plainly
      // instead of pretending it's data.
      if (body && body.error) {
        return { ok: false, status: 200, error: `${body.error}: ${body.message ?? ""}`.trim(), body };
      }
      return { ok: true, data: body };
    }

    if (res.status === 400) {
      return {
        ok: false,
        status: 400,
        error: `Invalid query (no payment was charged): ${body?.message ?? "check the search syntax"}`,
        body,
      };
    }
    if (res.status === 402) {
      return {
        ok: false,
        status: 402,
        error: "Payment did not settle (wallet likely unfunded). No data returned, no charge made.",
        body,
      };
    }
    return { ok: false, status: res.status, error: `API returned HTTP ${res.status}.`, body };
  }
}
