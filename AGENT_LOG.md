# Agent log

## 2026-10-27 — Exercise 1: Build MCP server by hand

- **Goal:** Build a JSON-RPC over stdio MCP server handling `initialize`, `notifications/initialized`, `tools/list`, `tools/call` (`find_lecture` and `search_lectures`), and error responses.
- **What I asked the agent to do:** Explain `readline` and why logs must go to `stderr`, explain the handshake structure, JSON Schema for tool inputs, and the difference between `isError: true` and protocol error codes `-32601` / `-32602`.
- **Checkpoints used:** Ran `node mcp-server/check.mjs -- node mcp-server/server.js` after each step and `node mcp-server/check.mjs -- npm run --silent mcp` at the end (12/12 checks passed).
- **What went wrong:** Fixed initial `MODULE_NOT_FOUND` path issue, resolved HTTP 503 model high demand in Gemini CLI by switching models with `/model`, and ran `npm init -y` and `npm pkg set` as separate commands.
- **What I changed by hand:** Wrote `mcp-server/server.js`, added the custom `search_lectures` tool, configured the `mcp` script in `package.json`, and documented the session and experiment in `mcp-server/README.md`.
