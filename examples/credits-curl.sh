#!/usr/bin/env bash
# No crypto wallet? A human buys prepaid credits by card once, and the agent uses the key.
#
# 1. A human signs in and buys credits ($5 minimum):  https://clinkagent.com/buy/credits
#    That page shows a key like ck_live_... ONCE. Keep it secret.
# 2. Export it:
#      export CLINK_KEY=ck_live_...
# A failed call or an empty result is never charged. Credits work on every flat-price route.

KEY="${CLINK_KEY:-ck_live_your_key_here}"

# Plain HTTP
curl -s -H "Authorization: Bearer $KEY" "https://clinkagent.com/x/search?query=x402"

# The same shop as MCP tools over JSON-RPC (POST /mcp), same Bearer key
curl -s https://clinkagent.com/mcp \
  -H "Authorization: Bearer $KEY" \
  -H "content-type: application/json" \
  -H "accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"x_search","arguments":{"query":"x402"}}}'
