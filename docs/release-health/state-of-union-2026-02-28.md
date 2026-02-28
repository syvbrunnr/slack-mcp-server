# State of Union — 2026-02-28

## Scope

Public surface update on `v3.0.0` (no semver bump, no runtime behavior changes).

## What Changed

- Added deterministic social preview builder: `scripts/build-social-preview.js`.
- Generated `docs/images/social-preview-v3.png` (`1280x640`, `<1 MB`).
- Tightened README hero to a proof-first ladder:
  - one-line value proposition
  - canonical links (`Live demo`, `Latest release`, `npm`)
  - 3-command verify block
  - balanced star/support CTA
- Added reusable quick-proof comment template in `docs/LAUNCH-COPY-v3.0.0.md`.
- Normalized discussion/release sync automation in `scripts/impact-push-v3.js`:
  - one shared verify block
  - one shared hosted migration snippet
  - migrated awesome PR tracking from `#2429` to `#2511`
- Legacy reroute applied:
  - `v2.0.0` release body has superseded banner to `releases/latest`
  - `v1.2.4` release body has superseded banner to `releases/latest`
- Closed stale listing PR and opened clean replacement:
  - closed: `punkpeye/awesome-mcp-servers#2429`
  - opened: `punkpeye/awesome-mcp-servers#2511`

## Validation

- `node scripts/verify-core.js` passed.
- `node scripts/verify-web.js` passed.
- `node scripts/verify-install-flow.js --strict-published` passed.
- `npm pack --dry-run` produced `jtalk22-slack-mcp-3.0.0.tgz` (~3.49 MB).

## Notes

- Discussion pinning remains a manual GitHub UI step for `#12` (Announcements).
- Render artifacts were captured locally for internal review and intentionally kept private.
- HEAD link checks returned `200` for GitHub/docs/discussion URLs; npm package URL returned `403` on HEAD due anti-bot controls while `npm view` confirms published `3.0.0`.
