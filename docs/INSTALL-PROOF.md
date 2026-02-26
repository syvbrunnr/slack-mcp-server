# Install Proof Block (v2.0.0)

Use this command block in release notes, HN/X/Reddit follow-ups, and issue replies.

```bash
npx -y @jtalk22/slack-mcp --version
npx -y @jtalk22/slack-mcp --doctor
npx -y @jtalk22/slack-mcp --status
```

Expected:
- `--version` prints `slack-mcp-server v2.0.0`
- `--doctor` exits with:
  - `0` ready
  - `1` missing credentials
  - `2` invalid or expired credentials
  - `3` runtime or connectivity issue
- `--status` is read-only and does not trigger Chrome extraction.
