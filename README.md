# twitter-signal-mcp

Live **X/Twitter search** and **AI trend digests** inside Claude, Cursor, or any MCP client —
**no Twitter/X API key, no subscription, no monthly minimum.** Your agent pays a fraction of a
cent per call in USDC on Base using [x402](https://x402.org).

```
x_search   $0.006/call   up to 20 newest matching tweets + engagement
x_digest   $0.02/call    the same tweets + an AI-written trend summary
```

## Why this exists

The official X API starts at a monthly subscription and a developer-account approval. If an agent
just needs to know *what people are saying right now*, that's a lot of setup for a handful of
queries. This server charges per request instead — a hundred searches costs about sixty cents,
and there is nothing to cancel.

## Tools

### `x_search` — $0.006
Full advanced-search syntax. Returns up to 20 newest matches with author handle, follower count,
text, timestamp, permalink, likes, retweets, replies, and views.

### `x_digest` — $0.02
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

### Query syntax
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
the request is refused **before** anything is signed — no charge.

## Cost & safety

- You are only ever charged for a successful response. Invalid queries are rejected **before**
  payment (HTTP 400, no settlement).
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
