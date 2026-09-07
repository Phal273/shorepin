#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { buildReport, loadFindings, loadPins } from "./lib/detect.mjs";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function flag(name) {
  return process.argv.includes(name);
}

if (flag("--help") || flag("-h")) {
  console.log(`Usage: node scripts/check.mjs --pins pins.json --scan shorepin-scan.json

Exits 1 when any finding is unregistered or covered by an overdue pin.
`);
  process.exit(0);
}

const pinsPath = arg("--pins");
const scanPath = arg("--scan");

if (!pinsPath || !scanPath) {
  console.error("shorepin check: --pins and --scan are required");
  process.exit(2);
}

const pins = loadPins(JSON.parse(await readFile(pinsPath, "utf8")));
const findings = loadFindings(JSON.parse(await readFile(scanPath, "utf8")));
const report = buildReport(findings, pins);

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error(
    `shorepin check FAIL: ${report.summary.unregistered} unregistered, ${report.summary.expired} expired`,
  );
  process.exit(1);
}

console.error(
  `shorepin check PASS: ${report.summary.findings} findings, ${report.summary.covered} covered`,
);
