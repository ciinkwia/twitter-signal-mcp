// Tool catalog — transport- and payment-agnostic.
//
// Four tools, mirroring the four paid tiers of the X Signal API. Kept separate
// (rather than one tool with a `mode` arg) so the price of each is explicit in
// the tool description and the agent must deliberately choose the pricier
// tier. Each tool declares its OWN `inputShape` — the MCP wiring in index.js
// passes whatever params a tool declares straight through to its endpoint
// (see datasource.js `buildUrl`), so adding a tool here never requires
// touching index.js.

import { z } from "zod";

const QUERY_DESC =
  "X/Twitter advanced-search string. Supports: plain keywords, \"exact phrases\", " +
  "#hashtags, $cashtags, from:user, to:user, @mentions, min_faves:N, min_retweets:N, " +
  "lang:en, since:YYYY-MM-DD, until:YYYY-MM-DD, -exclude, filter:links, and OR grouping. " +
  "Examples: 'from:elonmusk starship' · '#bitcoin min_faves:100' · '\"rate cut\" lang:en since:2026-08-01'.";

const searchInputShape = {
  query: z.string().min(1).max(500).describe(QUERY_DESC),
};

export const TOOLS = [
  {
    name: "x_search",
    tier: "search",
    priceUsd: "0.02",
    title: "X/Twitter search — live tweets ($0.02)",
    description:
      "Search X/Twitter for live posts using full advanced-search syntax. Returns up to 20 of the " +
      "newest matching tweets with author handle, follower count, text, timestamp, permalink, and " +
      "engagement (likes, retweets, replies, views). Use for real-time social monitoring, breaking " +
      "news, crypto/stock chatter, brand mentions, competitor tracking, or checking what a specific " +
      "account just posted. No Twitter/X API key required. " +
      "COSTS $0.02 USDC per call, paid from your configured wallet on Base. " +
      "For an AI-written trend summary of the same results, use x_digest instead.",
    inputShape: searchInputShape,
  },
  {
    name: "x_digest",
    tier: "digest",
    priceUsd: "0.05",
    title: "X/Twitter trend digest — tweets + AI summary ($0.05)",
    description:
      "Search X/Twitter AND get an AI-written digest of what the results actually say: a 3-5 sentence " +
      "trend summary, overall sentiment (positive/negative/mixed/neutral) with the reason behind it, " +
      "key themes, the accounts driving the conversation, and the most notable post URLs. The raw " +
      "tweets are included too. The digest is written only from the returned tweets — nothing invented. " +
      "Use when you want the takeaway rather than 20 raw posts to read. No Twitter/X API key required. " +
      "COSTS $0.05 USDC per call, paid from your configured wallet on Base. " +
      "For raw tweets only at less than half the price, use x_search.",
    inputShape: searchInputShape,
  },
  {
    name: "x_leads",
    tier: "leads",
    priceUsd: "0.05",
    title: "X/Twitter lead finder — people behind matching posts ($0.05)",
    description:
      "Search X/Twitter and get the PEOPLE behind the matching posts, enriched: bio, website, emails " +
      "found in the bio, follower count, location, DM-open flag, and every matching post per person. " +
      "Use for recruiting, cofounder search, B2B lead generation, influencer discovery, or community " +
      "sourcing — when you want contactable people, not raw tweets. No Twitter/X API key required. " +
      "COSTS $0.05 USDC per call, paid from your configured wallet on Base. " +
      "For raw tweets instead, use x_search ($0.02).",
    inputShape: {
      query: z.string().min(1).max(500).describe(QUERY_DESC),
      max: z
        .enum(["20", "40"])
        .optional()
        .describe("Max matching posts to mine for leads — \"20\" (default) or \"40\"."),
    },
  },
  {
    name: "x_pain_points",
    tier: "pain_points",
    priceUsd: "0.05",
    title: "X/Twitter voice-of-customer digest — pain points & praise ($0.05)",
    description:
      "Pass a product or brand name/handle and get clustered complaints, feature requests, and praise " +
      "mined from live X posts, with verbatim quotes and URLs. Use for product research, competitor " +
      "research, churn signals, or roadmap input. No Twitter/X API key required. " +
      "COSTS $0.05 USDC per call, paid from your configured wallet on Base. " +
      "For a general trend summary instead, use x_digest.",
    inputShape: {
      product: z.string().min(1).max(200).describe("Product or brand name, or an X handle, e.g. \"Cursor\" or \"@cursor_ai\"."),
    },
  },
];

// tier -> API path. Kept next to the catalog so adding a tier is a one-file edit.
export const TIER_PATHS = {
  search: "/x/search",
  digest: "/x/digest",
  leads: "/x/leads",
  pain_points: "/x/pain-points",
};
