import { makeFingerprint, normalizePath, normalizeSnippet } from "./fingerprint";
import { PATTERNS } from "./patterns";
import type { PatternToggles, PinKind, ScanFinding } from "./types";

export type SourceFile = {
  path: string;
  content: string;
};

export function scanFiles(
  files: SourceFile[],
  toggles?: Partial<PatternToggles>,
): ScanFinding[] {
  const findings: ScanFinding[] = [];
  for (const file of files) {
    findings.push(...scanFile(file.path, file.content, toggles));
  }
  return findings;
}

export function scanFile(
  path: string,
  content: string,
  toggles?: Partial<PatternToggles>,
): ScanFinding[] {
  const findings: ScanFinding[] = [];
  const lines = content.split(/\r?\n/);
  const normalizedPath = normalizePath(path);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matchedGroups = new Set<string>();

    for (const pattern of PATTERNS) {
      if (toggles && toggles[pattern.kind] === false) continue;
      if (matchedGroups.has(pattern.group)) continue;
      if (!pattern.test.test(line)) continue;

      matchedGroups.add(pattern.group);
      findings.push({
        path: normalizedPath,
        line: index + 1,
        kind: pattern.kind,
        snippet: normalizeSnippet(line),
        fingerprint: makeFingerprint(pattern.kind, line),
      });
    }
  }

  return findings;
}

export function filterFindings(
  findings: ScanFinding[],
  toggles: PatternToggles,
): ScanFinding[] {
  return findings.filter((finding) => toggles[finding.kind] !== false);
}

export function uniqueKinds(findings: ScanFinding[]): PinKind[] {
  return [...new Set(findings.map((finding) => finding.kind))];
}
