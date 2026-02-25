# Communication Style Guide

Use this guide for release notes, issue replies, and changelog entries.

## Rules

1. Keep text technical, concise, and factual.
2. Do not include model/tool credit lines.
3. Do not include co-author trailers from tooling.
4. State exact versions and commands when relevant.
5. Avoid speculative claims.

## Issue Reply Template

```md
Thanks for reporting this.

Status: fixed in `<version>`.

Included:
- `<change 1>`
- `<change 2>`

Install/update:
- `npx -y @jtalk22/slack-mcp`
- `npm i -g @jtalk22/slack-mcp@<version>`
```

## Release Notes Template

````md
## <version> — <short title>

### Fixed
- <item>
- <item>

### Runtime / Security
- <item>

### Verify
```bash
<command>
<command>
```
````

## Changelog Entry Template

```md
## [<version>] - YYYY-MM-DD

### Fixed
- <item>

### Changed
- <item>
```
