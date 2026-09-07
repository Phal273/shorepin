export const PATTERNS = [
  { kind: "eslint-disable-next-line", group: "eslint", test: /eslint-disable-next-line/ },
  { kind: "eslint-disable-line", group: "eslint", test: /eslint-disable-line/ },
  { kind: "eslint-disable", group: "eslint", test: /eslint-disable(?!-)/ },
  { kind: "ts-expect-error", group: "typescript", test: /@ts-expect-error/ },
  { kind: "ts-ignore", group: "typescript", test: /@ts-ignore/ },
  { kind: "ts-nocheck", group: "typescript", test: /@ts-nocheck/ },
  { kind: "as-unknown-as", group: "cast", test: /\bas\s+unknown\s+as\b/ },
  { kind: "as-any", group: "cast", test: /\bas\s+any\b/ },
  { kind: "it-skip", group: "test-skip", test: /\bit\.skip\b/ },
  { kind: "describe-skip", group: "test-skip", test: /\bdescribe\.skip\b/ },
  { kind: "test-skip", group: "test-skip", test: /\btest\.skip\b/ },
  { kind: "xit", group: "test-skip", test: /\bxit\s*\(/ },
  { kind: "xdescribe", group: "test-skip", test: /\bxdescribe\s*\(/ },
  { kind: "noqa", group: "linter", test: /#\s*noqa\b/i },
  { kind: "nosec", group: "linter", test: /#\s*nosec\b/i },
  { kind: "nosemgrep", group: "linter", test: /\/\/\s*nosemgrep\b/i },
  { kind: "hack", group: "marker", test: /\bHACK:/ },
  { kind: "fixme", group: "marker", test: /\bFIXME:/ },
];

export function normalizePath(path) {
  return path.trim().replace(/\\/g, "/").replace(/^\.?\//, "");
}

export function normalizeSnippet(line) {
  return line.replace(/\s+/g, " ").trim().slice(0, 160);
}

export function makeFingerprint(kind, line) {
  return `${kind}::${normalizeSnippet(line)}`;
}

export function scanText(path, content, disabled = new Set()) {
  const findings = [];
  const lines = content.split(/\r?\n/);
  const normalizedPath = normalizePath(path);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const matchedGroups = new Set();
    for (const pattern of PATTERNS) {
      if (disabled.has(pattern.kind)) continue;
      if (matchedGroups.has(pattern.group)) continue;
      if (!pattern.test.test(line)) continue;
      matchedGroups.add(pattern.group);
      findings.push({
        path: normalizedPath,
        line: i + 1,
        kind: pattern.kind,
        snippet: normalizeSnippet(line),
        fingerprint: makeFingerprint(pattern.kind, line),
      });
    }
  }
  return findings;
}

export function startOfDayMs(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).getTime();
}

export function todayISO() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

export function isOpen(pin) {
  return pin.closedAt == null;
}

export function isOverdue(pin, today = todayISO()) {
  return isOpen(pin) && startOfDayMs(pin.expiresAt) < startOfDayMs(today);
}

export function matchPin(finding, pins) {
  const open = pins.filter(
    (pin) =>
      isOpen(pin) &&
      normalizePath(pin.path) === normalizePath(finding.path) &&
      pin.kind === finding.kind,
  );
  if (open.length === 0) return null;
  const exact = open.find((pin) => pin.fingerprint === finding.fingerprint);
  if (exact) return exact;
  const nearby = open.find(
    (pin) => pin.line != null && Math.abs(pin.line - finding.line) <= 8,
  );
  if (nearby) return nearby;
  if (open.length === 1) return open[0];
  return null;
}

export function buildReport(findings, pins, today = todayISO()) {
  const matched = findings.map((finding) => {
    const pin = matchPin(finding, pins);
    let coverage = "unregistered";
    if (pin) coverage = isOverdue(pin, today) ? "expired" : "covered";
    return { ...finding, coverage, pin };
  });
  const unregistered = matched.filter((item) => item.coverage === "unregistered");
  const expired = matched.filter((item) => item.coverage === "expired");
  const covered = matched.filter((item) => item.coverage === "covered");
  return {
    ok: unregistered.length === 0 && expired.length === 0,
    checkedAt: new Date().toISOString(),
    summary: {
      findings: matched.length,
      covered: covered.length,
      unregistered: unregistered.length,
      expired: expired.length,
      closedPins: pins.filter((pin) => !isOpen(pin)).length,
      activePins: pins.filter((pin) => isOpen(pin)).length,
    },
    failures: [...unregistered, ...expired].map((item) => ({
      coverage: item.coverage,
      path: item.path,
      line: item.line,
      kind: item.kind,
      snippet: item.snippet,
      pinId: item.pin?.id,
      owner: item.pin?.owner,
      expiresAt: item.pin?.expiresAt,
    })),
    findings: matched,
  };
}

export function loadPins(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.pins)) return raw.pins;
  throw new Error("pins.json must be an array or { pins: [] }");
}

export function loadFindings(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.findings)) return raw.findings;
  throw new Error("scan JSON must be an array or { findings: [] }");
}
