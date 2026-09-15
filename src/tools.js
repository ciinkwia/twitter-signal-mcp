// Tool catalog — transport- and payment-agnostic.
//
// Eleven tools, mirroring the eleven paid tiers of the X Signal API. Kept
// separate (rather than one tool with a `mode` arg) so the price of each is
// explicit in the tool description and the agent must deliberately choose the
// pricier tier. Each tool declares its OWN `inputShape` — the MCP wiring in
// index.js passes whatever params a tool declares straight through to its
// endpoint (see datasource.js `buildUrl`), so adding a tool here never
// requires touching index.js.

import { z } from "zod";

const QUERY_DESC =
  "X/Twitter advanced-search string. Supports: plain keywords, \"exact phrases\", " +
  "#hashtags, $cashtags, from:user, to:user, @mentions, min_faves:N, min_retweets:N, " +
  "lang:en, since:YYYY-MM-DD, until:YYYY-MM-DD, -exclude, filter:links, and OR grouping. " +
  "Examples: 'from:elonmusk starship' · '#bitcoin min_faves:100' · '\"rate cut\" lang:en since:2026-08-01'.";

const searchInputShape = {
  query: z.string().min(1).max(500).describe(QUERY_DESC),
};

const usernameShape = {
  username: z.string().min(1).max(100).describe("X/Twitter handle, with or without the leading @, e.g. \"elonmusk\"."),
};

const tweetIdShape = {
  id: z.string().min(1).max(40).describe("Numeric X/Twitter tweet/post ID, e.g. \"1859012345678901234\" — found at the end of a tweet's permalink."),
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
  {
    name: "x_user_timeline",
    tier: "user",
    priceUsd: "0.02",
    title: "X/Twitter user timeline — recent posts by one account ($0.02)",
    description:
      "Get an account's own recent posts (original tweets, replies, and retweets), newest first, with " +
      "text, timestamp, permalink, and engagement (likes, retweets, replies, views). Use when you already " +
      "know the account you care about and want its own feed rather than a keyword match — tracking a " +
      "competitor, a founder, or a brand's posting activity. No Twitter/X API key required. " +
      "COSTS $0.02 USDC per call, paid from your configured wallet on Base. " +
      "To search across many accounts instead, use x_search with from:username.",
    inputShape: usernameShape,
  },
  {
    name: "x_profile",
    tier: "profile",
    priceUsd: "0.02",
    title: "X/Twitter profile lookup — bio & account stats ($0.02)",
    description:
      "Look up one X/Twitter account's profile: display name, bio, website, location, join date, " +
      "follower/following counts, post count, verified status, and profile/banner images. Use to " +
      "qualify a lead, vet an account before engaging, or pull contact info (website/bio email) for " +
      "someone you already have the handle for. No Twitter/X API key required. " +
      "COSTS $0.02 USDC per call, paid from your configured wallet on Base. " +
      "For a plain-language read on whether the account is worth engaging, use x_account_verdict.",
    inputShape: usernameShape,
  },
  {
    name: "x_tweet",
    tier: "tweet",
    priceUsd: "0.01",
    title: "X/Twitter single tweet lookup — by ID ($0.01)",
    description:
      "Fetch one specific tweet by its numeric ID: full text, author, timestamp, permalink, and " +
      "engagement (likes, retweets, replies, views). Use when you already have a tweet ID or permalink — " +
      "from a search result, a shared link, or a previous call — and want the current numbers or full " +
      "text for just that post, without re-running a search. No Twitter/X API key required. " +
      "COSTS $0.01 USDC per call, paid from your configured wallet on Base — the cheapest tool here. " +
      "To see what people are saying back, use x_replies with the same ID.",
    inputShape: tweetIdShape,
  },
  {
    name: "x_replies",
    tier: "replies",
    priceUsd: "0.02",
    title: "X/Twitter replies — the reply thread under one tweet ($0.02)",
    description:
      "Get the reply thread under one specific tweet, newest first, with each replier's handle, text, " +
      "timestamp, permalink, and engagement. Use to gauge reaction to a specific post, catch pushback " +
      "or support in a thread, or find people already engaging with a topic you care about. No " +
      "Twitter/X API key required. " +
      "COSTS $0.02 USDC per call, paid from your configured wallet on Base. " +
      "For the original post by ID instead of its replies, use x_tweet.",
    inputShape: tweetIdShape,
  },
  {
    name: "x_find_accounts",
    tier: "users",
    priceUsd: "0.02",
    title: "X/Twitter account search — find people, not posts ($0.02)",
    description:
      "Search X/Twitter for ACCOUNTS matching a name, keyword, or topic — not posts. Returns matching " +
      "profiles with handle, display name, bio, and follower count. Use to find who's active in a niche, " +
      "locate a company's or person's real account, or build a shortlist of accounts to follow up on " +
      "with x_profile or x_user_timeline. No Twitter/X API key required. " +
      "COSTS $0.02 USDC per call, paid from your configured wallet on Base. " +
      "For posts matching a topic instead of accounts, use x_search.",
    inputShape: searchInputShape,
  },
  {
    name: "x_account_verdict",
    tier: "account_verdict",
    priceUsd: "0.02",
    title: "X/Twitter account verdict — AI read on one account ($0.02)",
    description:
      "Pass a handle and get a short AI-written read on the account: what it's about, how active and " +
      "engaged it is, and whether it looks like a real/worthwhile account to follow up with versus a " +
      "spam or low-value one — written only from the account's own profile and recent posts. Use to " +
      "triage a lead or a follower list fast without reading the profile yourself. No Twitter/X API key " +
      "required. COSTS $0.02 USDC per call, paid from your configured wallet on Base. " +
      "For the raw profile data behind the verdict, use x_profile.",
    inputShape: usernameShape,
  },
  {
    name: "x_watch",
    tier: "watch",
    priceUsd: "0.05",
    title: "X/Twitter watch — only what's new since your last check ($0.05)",
    description:
      "Run the same advanced-search query as x_search, but only return posts newer than a cursor you " +
      "supply — either an ISO timestamp or a tweet ID from a previous call's `cursor.newest_id`. Returns " +
      "the new matching tweets plus a fresh `cursor.newest_id` to pass next time. Use for polling a query " +
      "on a schedule (a brand, ticker, or hashtag) without re-fetching or re-paying for posts you've " +
      "already seen. No Twitter/X API key required. " +
      "COSTS $0.05 USDC per call, paid from your configured wallet on Base. " +
      "For a one-off search with no cursor, use x_search ($0.02) instead.",
    inputShape: {
      query: z.string().min(1).max(500).describe(QUERY_DESC),
      since: z
        .string()
        .max(40)
        .optional()
        .describe(
          "Only return posts newer than this — an ISO timestamp (e.g. \"2026-09-14T00:00:00Z\") or a " +
            "numeric tweet ID. Pass back the `cursor.newest_id` from the previous x_watch call to pick up " +
            "where you left off. Omit on the first call."
        ),
    },
  },
];

// tier -> API path. Kept next to the catalog so adding a tier is a one-file edit.
export const TIER_PATHS = {
  search: "/x/search",
  digest: "/x/digest",
  leads: "/x/leads",
  pain_points: "/x/pain-points",
  user: "/x/user",
  profile: "/x/profile",
  tweet: "/x/tweet",
  replies: "/x/replies",
  users: "/x/users",
  account_verdict: "/x/account-verdict",
  watch: "/x/watch",
};
