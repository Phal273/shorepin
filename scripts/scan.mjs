#!/usr/bin/env node
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { scanText } from "./lib/detect.mjs";

async function loadIgnoreFile() {
  try {
    const raw = await readFile(path.resolve(".shorepinignore"), "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch {
    return [];
  }
}

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".php",
  ".cs",
  ".vue",
  ".svelte",
]);

const DEFAULT_IGNORE = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo",
]);

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function flag(name) {
  return process.argv.includes(name);
}

const dir = path.resolve(arg("--dir", "."));
const out = arg("--out");
const ignore = new Set([
  ...DEFAULT_IGNORE,
  ...(arg("--ignore", "") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
]);
const ignoredPaths = new Set(
  (await loadIgnoreFile()).map((item) => item.replace(/\\/g, "/")),
);
if (process.env.SHOREPIN_DEBUG) {
  console.error("ignoredPaths", [...ignoredPaths]);
}

function isIgnoredPath(rel) {
  const normalized = rel.replace(/\\/g, "/");
  if (ignoredPaths.has(normalized)) return true;
  for (const rule of ignoredPaths) {
    if (normalized === rule || normalized.startsWith(`${rule}/`)) return true;
  }
  return false;
}

if (flag("--help") || flag("-h")) {
  console.log(`Usage: node scripts/scan.mjs --dir <path> [--out file] [--ignore a,b]

Walks text files and prints Shorepin findings as JSON.
`);
  process.exit(0);
}

async function walk(current, files) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (ignore.has(entry.name)) continue;
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
      continue;
    }
    if (!TEXT_EXT.has(path.extname(entry.name))) continue;
    files.push(full);
  }
}

const files = [];
const info = await stat(dir);
if (info.isDirectory()) {
  await walk(dir, files);
} else {
  files.push(dir);
}

const findings = [];
for (const file of files) {
  const content = await readFile(file, "utf8");
  const rel = path.relative(process.cwd(), file) || file;
  if (isIgnoredPath(rel)) {
    if (process.env.SHOREPIN_DEBUG) console.error("skip", rel);
    continue;
  }
  const hits = scanText(rel, content);
  if (process.env.SHOREPIN_DEBUG) console.error("scan", rel, hits.length);
  findings.push(...hits);
}

const report = {
  scannedAt: new Date().toISOString(),
  source: "cli",
  fileCount: files.length,
  findings,
};

const json = JSON.stringify(report, null, 2);
if (out) {
  await writeFile(out, json);
  console.error(`Wrote ${findings.length} findings from ${files.length} files to ${out}`);
} else {
  console.log(json);
}
