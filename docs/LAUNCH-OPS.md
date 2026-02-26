# Launch Ops Runbook (v2.0.0)

This runbook defines launch-day monitoring, response rules, and reinforcement loops.

## Same-Day Fanout Order

1. GitHub release publish (`v2.0.0`)
2. npm publish confirm (`@jtalk22/slack-mcp@2.0.0`)
3. MCP registry metadata update
4. Smithery listing metadata parity update
5. `awesome-mcp-servers` version update PR
6. Glama listing refresh/update
7. HN post + first comment
8. X thread
9. Reddit technical post

## Monitoring Cadence

- First 4 hours: every 30 minutes
- Up to 24 hours: every 60 minutes

Track:
- install reports and blocker count
- npm version/install confirmation
- registry parity status
- inbound issue volume and severity

## Triage Rules

P1 install blocker:
- acknowledge within 30-60 minutes
- provide immediate workaround
- add fix to patch queue

Non-blocking request:
- acknowledge and route to issue template
- provide timeline as best effort

## Escalation Triggers

1. If install failures exceed 3 unique reports in 24h:
- pause outbound posting
- prioritize hotfix

2. If support load exceeds 2 hours/day for 2 days:
- move to stability-only mode
- defer non-critical requests

## 24h / 48h / 72h Follow-Up

24h:
- publish release-health delta and short technical update

48h:
- answer top 5 recurring questions in docs

72h:
- publish `v2.0.1` only if launch defects are confirmed

## Evidence Log

Use:
- `docs/release-health/launch-log-template.md`

Capture:
- channel
- UTC timestamp
- URL
- action taken
- observed result
