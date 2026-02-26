# Launch Copy (v2.0.0)

Use this file for channel-specific copy with consistent technical claims.

## Short Release Summary (150 words)

`@jtalk22/slack-mcp v2.0.0` is now live. This release is a reliability pass focused on install confidence, deterministic diagnostics, and stable contracts. `--status` is enforced as read-only in install-path checks, `--doctor` is standardized to strict `0/1/2/3` exits, and MCP/web error payloads are normalized for faster triage. Token health now handles missing timestamps as explicit unknown-age state, avoiding false critical warnings. Metadata and distribution parity were tightened for npm and registry consistency, including a parity check script (`npm run verify:version-parity`) for one-command validation across local/npm/registry surfaces. No MCP tools were renamed or removed in this release. If you run Claude Desktop, Claude Code, or web mode, `v2.0.0` is a drop-in upgrade designed to reduce operational noise while keeping the current integration contract intact. Built and operated by `jtalk22`.

## X Thread (7 posts)

1. `Slack MCP Server v2.0.0 is live.`
   `This wave is about operational reliability, not feature churn.`
2. `Install checks now enforce read-only --status.`
   `No refresh side effects during status validation.`
3. `--doctor exits are deterministic now: 0/1/2/3.`
   `Ready, missing creds, invalid creds, runtime issue.`
4. `Diagnostics are normalized across CLI/MCP/Web payloads.`
   `Fewer ambiguous errors when triaging installs.`
5. `Missing token timestamps now map to unknown age.`
   `No false critical warnings from absent metadata.`
6. `Compatibility stayed stable in v2.0.0.`
   `No MCP tool rename/removal in this cut.`
7. `Install proof:`
   `npx -y @jtalk22/slack-mcp@latest --version`
   `npx -y @jtalk22/slack-mcp@latest --doctor`
   `npx -y @jtalk22/slack-mcp@latest --status`
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
`npx -y @jtalk22/slack-mcp@latest --version`
`npx -y @jtalk22/slack-mcp@latest --doctor`
`npx -y @jtalk22/slack-mcp@latest --status`

Repo: https://github.com/jtalk22/slack-mcp-server
npm: https://www.npmjs.com/package/@jtalk22/slack-mcp

Maintainer/operator: `jtalk22` (`james@revasser.nyc`)
```

## Registry Propagation Note

If registry versions are still syncing right after publish, use this sentence:

`Release is published; registry metadata is propagating. Timestamp: <UTC timestamp>.`
