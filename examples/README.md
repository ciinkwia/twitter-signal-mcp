# Examples

Copy-paste starting points for using clink's shop (X/Twitter search, profiles, leads and more) from your agent. Pay per call, no X API key, no subscription.

- [`claude-desktop.json`](./claude-desktop.json) — the `mcpServers` block for Claude Desktop (CDP wallet pays per call).
- [`claude-code.md`](./claude-code.md) — one `claude mcp add` command for Claude Code, plus a Cursor `mcp.json` snippet.
- [`x402-fetch.mjs`](./x402-fetch.mjs) — plain Node script, no MCP: pays with `@x402/fetch` from a private-key wallet (no CDP account needed).
- [`credits-curl.sh`](./credits-curl.sh) — no wallet at all: a human buys prepaid credits by card, the agent sends a Bearer key with plain `curl` (or JSON-RPC to `POST /mcp`).
