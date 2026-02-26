#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const serverMeta = JSON.parse(readFileSync(join(repoRoot, "server.json"), "utf8"));

const outputArg = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "docs/release-health/version-parity.md";
const allowPropagation = process.argv.includes("--allow-propagation");

const mcpServerName = serverMeta.name;
const smitheryEndpoint = "https://server.smithery.ai/jtalk22/slack-mcp-server";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

function row(surface, version, status, note = "") {
  return `| ${surface} | ${version || "n/a"} | ${status} | ${note} |`;
}

async function main() {
  const localVersion = pkg.version;
  const localServerVersion = serverMeta.version;
  const localServerPkgVersion = serverMeta.packages?.[0]?.version || null;

  let npmVersion = null;
  let mcpRegistryVersion = null;
  let smitheryReachable = null;
  let npmError = null;
  let mcpError = null;
  let smitheryError = null;

  try {
    const npmMeta = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`);
    npmVersion = npmMeta?.["dist-tags"]?.latest || null;
  } catch (error) {
    npmError = String(error?.message || error);
  }

  try {
    const registry = await fetchJson(
      `https://registry.modelcontextprotocol.io/v0/servers/${encodeURIComponent(mcpServerName)}/versions/latest`
    );
    mcpRegistryVersion = registry?.server?.version || null;
  } catch (error) {
    mcpError = String(error?.message || error);
  }

  try {
    const html = await fetchText(smitheryEndpoint);
    smitheryReachable = html.length > 0;
  } catch (error) {
    smitheryError = String(error?.message || error);
  }

  const parityChecks = [
    { name: "package.json vs server.json", ok: localVersion === localServerVersion },
    { name: "package.json vs server.json package", ok: localVersion === localServerPkgVersion },
    { name: "npm latest", ok: npmVersion === localVersion },
    { name: "MCP registry latest", ok: mcpRegistryVersion === localVersion },
  ];

  const externalMismatches = parityChecks
    .filter((check) => !check.ok && (check.name === "npm latest" || check.name === "MCP registry latest"));
  const hardFailures = parityChecks
    .filter((check) => !check.ok && check.name !== "npm latest" && check.name !== "MCP registry latest");

  const now = new Date().toISOString();
  const lines = [
    "# Version Parity Report",
    "",
    `- Generated: ${now}`,
    `- Local target version: ${localVersion}`,
    "",
    "## Surface Matrix",
    "",
    "| Surface | Version | Status | Notes |",
    "|---|---|---|---|",
    row(
      "package.json",
      localVersion,
      "ok"
    ),
    row(
      "server.json (root)",
      localServerVersion,
      localServerVersion === localVersion ? "ok" : "mismatch"
    ),
    row(
      "server.json (package entry)",
      localServerPkgVersion,
      localServerPkgVersion === localVersion ? "ok" : "mismatch"
    ),
    row(
      "npm dist-tag latest",
      npmVersion,
      npmVersion === localVersion ? "ok" : "mismatch",
      npmError ? `fetch_error: ${npmError}` : ""
    ),
    row(
      "MCP Registry latest",
      mcpRegistryVersion,
      mcpRegistryVersion === localVersion ? "ok" : "mismatch",
      mcpError ? `fetch_error: ${mcpError}` : ""
    ),
    row(
      "Smithery endpoint",
      "n/a",
      smitheryReachable ? "reachable" : "unreachable",
      smitheryError ? `check_error: ${smitheryError}` : "Version check is manual."
    ),
    "",
    "## Interpretation",
    "",
    hardFailures.length === 0
      ? "- Local metadata parity: pass."
      : `- Local metadata parity: fail (${hardFailures.map((f) => f.name).join(", ")}).`,
    externalMismatches.length === 0
      ? "- External parity: pass."
      : `- External parity mismatch: ${externalMismatches.map((f) => f.name).join(", ")}.`,
    allowPropagation && externalMismatches.length > 0
      ? "- Propagation mode enabled: external mismatch accepted temporarily."
      : "- Propagation mode disabled: external mismatch is a release gate failure.",
  ];

  const outPath = join(repoRoot, outputArg);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${outputArg}`);

  if (hardFailures.length > 0) {
    process.exit(1);
  }
  if (!allowPropagation && externalMismatches.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
