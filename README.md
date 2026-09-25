# twitter-signal-mcp

Live **X/Twitter search** and **AI trend digests** inside Claude, Cursor, or any MCP client —
**no Twitter/X API key, no subscription, no monthly minimum.** Your agent pays a fraction of a
cent per call in USDC on Base using [x402](https://x402.org).

```
x_search           $0.02/call    up to 20 newest matching tweets + engagement
x_digest           $0.05/call    the same tweets + an AI-written trend summary
x_leads            $0.05/call    the people behind matching posts, enriched (bio, website, emails, followers)
x_pain_points      $0.05/call    clustered complaints / feature requests / praise for a product, with quotes
x_user_timeline    $0.02/call    one account's own recent posts
x_profile          $0.02/call    one account's bio, stats, and links
x_tweet            $0.01/call    one tweet by ID, full text + engagement
x_replies          $0.02/call    the reply thread under one tweet
x_find_accounts    $0.02/call    accounts matching a name/topic, not posts
x_account_verdict  $0.02/call    AI read on whether an account is worth engaging
x_watch            $0.05/call    only the posts newer than your last check
x_ticker_pulse     $0.02/call    facts about a US stock ticker's X activity — no sentiment/advice
x_list             $0.05/call    2-50 handles' combined recent posts, one call, no OR-splitting
x_followers        $0.02/call    one page of an account's followers
x_following        $0.02/call    one page of who an account follows
x_mentions         $0.02/call    one page of posts mentioning a handle
x_engagers         $0.05/call    who quoted / who retweeted one post
```

## Why this exists

The official X API starts at a monthly subscription and a developer-account approval. If an agent
just needs to know *what people are saying right now*, that's a lot of setup for a handful of
queries. This server charges per request instead — a hundred searches costs about sixty cents,
and there is nothing to cancel.

## Tools

### `x_search` — $0.02
Full advanced-search syntax. Returns up to 20 newest matches with author handle, follower count,
text, timestamp, permalink, likes, retweets, replies, and views. **Need more than 20?** A full
answer ends with `next.older` — pass its `cursor` value back (same `query`) for the next 20 older
matches, $0.02 a page. No slicing dates by hand.

### `x_digest` — $0.05
Everything above **plus** an AI-written digest generated only from the returned tweets:

```json
{
  "summary": "3-5 sentences on what's actually being said",
  "sentiment": "positive | negative | mixed | neutral",
  "sentiment_note": "why it leans that way",
  "key_themes": ["..."],
  "driving_accounts": ["@handle", "..."],
  "notable_post_urls": ["https://x.com/..."]
}
```

Use `x_digest` when you want the takeaway; `x_search` when you want the raw posts.

### `x_leads` — $0.05
Same advanced-search syntax as `x_search`, but returns the PEOPLE behind the matching posts
instead of the posts themselves — enriched with bio, website, emails found in the bio, follower
count, location, a DM-open flag, and every matching post per person:

```json
{
  "result_count": 20,
  "lead_count": 8,
  "leads": [{ "username": "someone", "followers": 5000, "emails": [], "matched_posts": [] }]
}
```

Inputs: `query` (required, same syntax as `x_search`), `max` (optional, `"20"` or `"40"` — default 20).
Use for recruiting, cofounder search, B2B lead generation, influencer discovery, community sourcing.

### `x_pain_points` — $0.05
Pass a product or brand name/handle, get clustered complaints, feature requests, and praise mined
from live X posts, with verbatim quotes and URLs:

```json
{
  "product": "Cursor",
  "analysis": { "summary": "...", "pain_points": [{ "theme": "...", "count": 4, "severity": "medium" }] }
}
```

Input: `product` (required — a name or an X handle). Use for product research, competitor research,
churn signals, roadmap input.

### `x_user_timeline` — $0.02
An account's own recent posts (originals, replies, retweets), newest first. Input: `username`
(required). Use: `x_user_timeline username="elonmusk"` to track a competitor's or founder's own feed.

### `x_profile` — $0.02
One account's bio, website, location, join date, follower/following counts, and verified status.
Input: `username` (required). Use: `x_profile username="cursor_ai"` to qualify a lead before you
reach out.

### `x_tweet` — $0.01
One tweet by numeric ID: full text, author, timestamp, permalink, engagement. Input: `id` (required).
Use: `x_tweet id="1859012345678901234"` to re-check a specific post you already found.

### `x_replies` — $0.02
The reply thread under one tweet, newest first. Input: `id` (required, same as `x_tweet`). Use:
`x_replies id="1859012345678901234"` to see how people reacted to a specific post.

### `x_find_accounts` — $0.02
Search for ACCOUNTS matching a name, keyword, or topic — not posts. Input: `query` (required, same
syntax as `x_search`). Use: `x_find_accounts query="solar installer hawaii"` to build a shortlist of
accounts to follow up on.

### `x_account_verdict` — $0.02
A short AI-written read on one account: what it's about, how active/engaged it is, and whether it's
worth following up with. Input: `username` (required). Use: `x_account_verdict username="someone"`
to triage a lead fast without reading the profile yourself.

### `x_watch` — $0.05
Same search as `x_search`, but only returns posts newer than a cursor you supply. Inputs: `query`
(required), `since` (optional — an ISO timestamp or the `cursor.newest_id` from your last `x_watch`
call). Use: poll a brand/ticker/hashtag on a schedule without re-paying for posts you've already seen.
**A check that finds nothing new is not charged** — you only pay when there is news.

### `x_ticker_pulse` — $0.02
Facts about one US stock ticker's X/Twitter activity, built for trading agents: post volume vs the
prior window, top posts by likes, most active accounts, and keyword topic flags (earnings,
guidance, lawsuit, SEC investigation, recall, M&A, layoffs, upgrade/downgrade, short report,
dividend, buyback, CEO). Inputs: `ticker` (required, 1-6 letters, with or without a leading `$`),
`window` (optional, `24h` default or `7d`). Use: `x_ticker_pulse ticker="TSLA" window="24h"`.
**FACTS ONLY** — counts and keyword matches, never a sentiment verdict, price target, or
buy/sell/hold signal.

### `x_list` — $0.05
A watchlist of 2-50 handles' combined recent posts in ONE call, newest first, deduped, with a
per-handle post count and a since-cursor for only-what's-new next time — instead of splitting a
watchlist into several `from:a OR from:b` `x_search` calls (X caps how many OR terms one search
can carry):

```json
{
  "handle_count": 3, "result_count": 40, "truncated": true,
  "per_handle_counts": { "elonmusk": 20, "naval": 12, "balajis": 8 },
  "cursor": { "newest_id": "1967000000000000001" },
  "tweets": [{ "author": "elonmusk", "text": "...", "likes": 1234 }]
}
```

Inputs: `handles` (required — comma or space separated, `@` optional, 2-50 handles), `since`
(optional — ISO timestamp or a tweet ID from `cursor.newest_id`), `limit` (optional, 1-100,
default 40). Use: `x_list handles="elonmusk,naval,balajis"` to check a watchlist in one call.

### `x_followers` — $0.02
One page (up to 20 shown) of an account's followers: handle, name, bio, follower/following counts,
verified status, DM-open flag. Inputs: `username` (required), `cursor` (optional, from a prior
call's `next.older`). Use: `x_followers username="elonmusk"` for audience research or lead sourcing.

### `x_following` — $0.02
One page (up to 20 shown) of who an account follows — same shape as `x_followers`. Inputs:
`username` (required), `cursor` (optional). Use: `x_following username="elonmusk"` to map an
account's network.

### `x_mentions` — $0.02
One page (up to 20 shown) of posts mentioning a handle: author, follower count, text, timestamp,
permalink, engagement. Inputs: `username` (required), `cursor` (optional). Use:
`x_mentions username="cursor_ai"` for brand monitoring or reputation tracking.

### `x_engagers` — $0.05
Who quoted and who retweeted one post (up to 20 each): handle, name, bio, follower count, verified
status:

```json
{ "id": "1878000000000000000", "quote_count": 5, "retweeter_count": 40, "quotes": [], "retweeters": [] }
```

Input: `id` (required, same as `x_tweet`). Use: `x_engagers id="1878000000000000000"` to find
amplifiers or source leads from a viral post's audience.

### Query syntax (`x_search`, `x_digest`, `x_leads`, `x_find_accounts`, `x_watch`)
Both tools take one `query` string:

| Pattern | Example |
|---|---|
| Keywords / phrases | `"rate cut" inflation` |
| Account | `from:elonmusk starship` |
| Hashtag / cashtag | `#bitcoin` · `$NVDA` |
| Engagement floor | `min_faves:100` · `min_retweets:50` |
| Language / dates | `lang:en since:2026-08-01 until:2026-08-09` |
| Exclusions | `airdrop -giveaway` |

## Setup

You need a Coinbase CDP wallet funded with a little USDC on Base — that wallet pays per call.
Create one at [portal.cdp.coinbase.com](https://portal.cdp.coinbase.com) (API key + wallet secret).

**Claude Desktop** — add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "twitter-signal": {
      "command": "npx",
      "args": ["-y", "twitter-signal-mcp"],
      "env": {
        "CDP_API_KEY_ID": "your-key-id",
        "CDP_API_KEY_SECRET": "your-key-secret",
        "CDP_WALLET_SECRET": "your-wallet-secret",
        "X402_MAX_PRICE": "0.05"
      }
    }
  }
}
```

`X402_MAX_PRICE` is a hard per-call ceiling in USD. If the endpoint ever quotes more than this,
the request is refused **before** anything is signed — no charge. The default `0.05` already covers
every tool above (the priciest are `x_digest`, `x_leads`, `x_pain_points`, and `x_watch` at $0.05) —
you don't need to raise it.

## Cost & safety

- You are only ever charged for a successful response. Invalid queries are rejected **before**
  payment (HTTP 400, no settlement).
- **Nothing found = nothing charged.** An empty `x_search` / `x_digest` / `x_leads` /
  `x_pain_points` / `x_watch` comes back as `no_results` with `charged: false` — the payment is
  never settled.
- **Same call within 10 minutes = free.** Repeat the exact call from the same wallet and you get
  the saved answer (`meta.charged: false`) at no cost.
- If the upstream tweet source fails after payment, the API returns an explicit `error` and logs
  the call for refund rather than pretending it worked.
- Gas is covered by the facilitator — you spend USDC only.
- Identical queries within 60 seconds are served from cache.

## How it works

```
MCP client → twitter-signal-mcp → 402 challenge → sign USDC authorization
           → facilitator settles on Base → data returned
```

Protocol: **x402 v2** (CAIP-2 networks, `PAYMENT-REQUIRED` challenge header). A v1 client cannot
talk to this API.

## License

MIT
