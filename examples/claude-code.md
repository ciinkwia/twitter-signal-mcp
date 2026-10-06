# Claude Code and Cursor

## Claude Code

```bash
claude mcp add twitter-signal \
  -e CDP_API_KEY_ID=your-key-id \
  -e CDP_API_KEY_SECRET=your-key-secret \
  -e CDP_WALLET_SECRET=your-wallet-secret \
  -e X402_MAX_PRICE=0.25 \
  -- npx -y twitter-signal-mcp
```

`X402_MAX_PRICE` is a hard per-call ceiling in USD. The default is `0.05`, which covers most tools. Set `0.25` to also unlock the pricier ones (`x_person` at $0.15 and `x_leads_deep` at $0.20, in version 0.6.0 and later).

## Cursor

Add to `.cursor/mcp.json` (or `~/.cursor/mcp.json`):

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
        "X402_MAX_PRICE": "0.25"
      }
    }
  }
}
```
