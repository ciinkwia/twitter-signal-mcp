// Tool catalog — transport- and payment-agnostic.
//
// Two tools, mirroring the two paid tiers of the X Signal API. Kept separate
// (rather than one tool with a `mode` arg) so the price of each is explicit in
// the tool description and the agent must deliberately choose the pricier
// digest tier.

import { z } from "zod";

const QUERY_DESC =
  "X/Twitter advanced-search string. Supports: plain keywords, \"exact phrases\", " +
  "#hashtags, $cashtags, from:user, to:user, @mentions, min_faves:N, min_retweets:N, " +
  "lang:en, since:YYYY-MM-DD, until:YYYY-MM-DD, -exclude, filter:links, and OR grouping. " +
  "Examples: 'from:elonmusk starship' · '#bitcoin min_faves:100' · '\"rate cut\" lang:en since:2026-08-01'.";

const inputShape = {
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
    inputShape,
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
    inputShape,
  },
];

// tier -> API path. Kept next to the catalog so adding a tier is a one-file edit.
export const TIER_PATHS = {
  search: "/x/search",
  digest: "/x/digest",
};
