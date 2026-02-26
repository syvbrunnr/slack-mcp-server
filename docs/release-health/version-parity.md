# Version Parity Report

- Generated: 2026-02-26T12:45:39.684Z
- Local target version: 2.0.0

## Surface Matrix

| Surface | Version | Status | Notes |
|---|---|---|---|
| package.json | 2.0.0 | ok |  |
| server.json (root) | 2.0.0 | ok |  |
| server.json (package entry) | 2.0.0 | ok |  |
| npm dist-tag latest | 1.2.4 | mismatch |  |
| MCP Registry latest | 1.1.8 | mismatch |  |
| Smithery endpoint | n/a | unreachable | check_error: HTTP 401 for https://server.smithery.ai/jtalk22/slack-mcp-server |

## Interpretation

- Local metadata parity: pass.
- External parity mismatch: npm latest, MCP registry latest.
- Propagation mode enabled: external mismatch accepted temporarily.
