# Launch Copy (v2.0.0)

Use this file for channel-specific copy with consistent technical claims.

## Short Release Summary (150 words)

`@jtalk22/slack-mcp v2.0.0` is out with a focus on deterministic diagnostics and clean operator workflows. This release enforces read-only `--status` behavior in install-path verification, expands `--doctor` coverage to a strict `0/1/2/3` exit matrix, and standardizes structured error envelopes across MCP tool failures and web API validation/runtime paths. Token health handling now reports explicit unknown-age semantics when timestamps are missing, so operators do not get false critical warnings. Metadata is aligned for distribution parity with updated registry-facing server metadata and a new parity checker (`npm run verify:version-parity`) that reports local/npm/registry alignment. MCP tool contracts stay compatible: no renames, no removals. If you use Claude Desktop, Claude Code, or local web mode, this is a drop-in upgrade focused on faster triage and fewer install surprises.

## X Thread (7 posts)

1. `Slack MCP Server v2.0.0 is live.`
   `Focus: deterministic diagnostics + install reliability.`
2. `No MCP tool renames/removals in this release.`
   `Compatibility stays stable.`
3. `Install-path checks now enforce read-only --status behavior.`
   `No token extraction side effects during status checks.`
4. `--doctor now enforces deterministic exits:`
   `0 ready / 1 missing creds / 2 invalid creds / 3 runtime issue.`
5. `Token health now reports unknown-age semantics when timestamp is missing.`
   `No false critical warning from missing metadata.`
6. `Parity checker added: npm/local/registry view in one report.`
   `npm run verify:version-parity`
7. `Try it:`
   `npx -y @jtalk22/slack-mcp --version`
   `npx -y @jtalk22/slack-mcp --doctor`
   `Repo: https://github.com/jtalk22/slack-mcp-server`

## Reddit Post (Technical Variant)

Title:
- `Slack MCP Server v2.0.0: deterministic install diagnostics, stable tool contracts`

Body:
```md
Released `@jtalk22/slack-mcp@2.0.0` today.

Main changes are reliability-focused:
- install-path verification enforces read-only `--status`
- `--doctor` exit matrix enforced (`0/1/2/3`)
- standardized structured error payloads for MCP tool failures and web API errors
- token health handles missing timestamp as unknown age (no false critical)
- new version parity report script for npm/local/registry checks

No MCP tool renames or removals in this release.

Verify:
`npx -y @jtalk22/slack-mcp --version`
`npx -y @jtalk22/slack-mcp --doctor`
`npx -y @jtalk22/slack-mcp --status`

Repo: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp
```

## Registry Propagation Note

If registry versions are still syncing right after publish, use this sentence:

`Release is published; registry metadata is propagating. Timestamp: <UTC timestamp>.`
