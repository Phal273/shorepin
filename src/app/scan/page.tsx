"use client";

import { useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PinDialog, type PinDraft } from "@/components/pin-dialog";
import { CoverageBadge, KindBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { filesFromFileList, parsePastedSources } from "@/lib/parse-paste";
import { filterFindings, scanFiles, type SourceFile } from "@/lib/scanner";
import { SAMPLE_NOTE, loadSampleWorkspace } from "@/lib/sample-workspace";
import { matchScan } from "@/lib/match";
import { useStore, type PinInput } from "@/lib/store";
import type { FindingCoverage, ScanResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const COVERAGE_FILTERS: { id: "all" | FindingCoverage; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unregistered", label: "Unregistered" },
  { id: "covered", label: "Covered" },
  { id: "expired", label: "Expired" },
];

export default function ScanPage() {
  const { pins, settings, lastScan, saveScan, upsertPin } = useStore();
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof COVERAGE_FILTERS)[number]["id"]>(
    "all",
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PinDraft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const matched = useMemo(() => {
    if (!lastScan) return [];
    const findings = filterFindings(lastScan.findings, settings.patterns);
    return matchScan(findings, pins);
  }, [lastScan, pins, settings.patterns]);

  const visible = matched.filter(
    (item) => filter === "all" || item.coverage === filter,
  );

  const counts = {
    unregistered: matched.filter((item) => item.coverage === "unregistered").length,
    covered: matched.filter((item) => item.coverage === "covered").length,
    expired: matched.filter((item) => item.coverage === "expired").length,
  };

  function runScan(files: SourceFile[], source: ScanResult["source"]) {
    if (files.length === 0) {
      setError("No file contents to scan.");
      return;
    }
    const findings = scanFiles(files, settings.patterns);
    saveScan({
      scannedAt: new Date().toISOString(),
      source,
      fileCount: files.length,
      findings,
    });
    setError(null);
  }

  async function onUpload(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = await filesFromFileList(list);
    runScan(files, "upload");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Detection"
        title="Scan"
        description="Client-side only. Paste multi-file text, upload files, or load the sample workspace. Findings match registered pins by path, kind, and nearby line fingerprint."
      />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-border bg-card p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Paste sources
          </div>
          <Textarea
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            placeholder={`--- src/legacy.ts ---
const row = payload
--- tests/legacy.test.ts ---
pending case`}
            className="min-h-44 font-mono text-xs"
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Separate files with a header line:{" "}
            <code className="font-mono text-foreground">--- path ---</code>,{" "}
            <code className="font-mono text-foreground">=== path ===</code>, or{" "}
            <code className="font-mono text-foreground">{"// FILE: path"}</code>.
          </p>
        </div>

        <div className="flex flex-col gap-3 border border-border bg-card p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Sources
          </div>
          <Button onClick={() => runScan(parsePastedSources(paste), "paste")}>
            Scan pasted text
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Upload files
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => onUpload(event.target.files)}
          />
          <Button
            variant="secondary"
            onClick={() => {
              void loadSampleWorkspace()
                .then((files) => runScan(files, "sample"))
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : "Sample load failed"),
                );
            }}
          >
            Load sample workspace
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">{SAMPLE_NOTE}</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </section>

      {!lastScan ? (
        <EmptyState
          title="No scan on record"
          body="Load the sample workspace to see real escapes from fixtures/sample-repo, or paste your own files. Results stay in this browser until you scan again."
          action={
            <Button
              onClick={() => {
                void loadSampleWorkspace()
                  .then((files) => runScan(files, "sample"))
                  .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : "Sample load failed"),
                  );
              }}
            >
              Load sample workspace
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-mono text-xs text-muted-foreground">
              {lastScan.fileCount} files · {matched.length} findings ·{" "}
              {counts.unregistered} unregistered · {counts.covered} covered ·{" "}
              {counts.expired} expired
            </div>
            <div className="flex flex-wrap gap-1">
              {COVERAGE_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "h-7 rounded-sm border px-2.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                    filter === item.id
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No findings in this filter. If you expected hits, check pattern
              toggles in Settings.
            </p>
          ) : (
            <div className="overflow-hidden border border-border bg-card">
              <div className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:grid-cols-[minmax(0,1.3fr)_110px_90px_1fr_auto]">
                <span>Path</span>
                <span className="hidden sm:inline">Kind</span>
                <span className="hidden sm:inline">Coverage</span>
                <span className="hidden sm:inline">Snippet</span>
                <span className="text-right">Action</span>
              </div>
              {visible.map((finding) => (
                <div
                  key={`${finding.path}:${finding.line}:${finding.kind}:${finding.fingerprint}`}
                  className="grid grid-cols-[1fr_auto] items-start gap-x-3 border-b border-border px-3 py-2.5 last:border-0 sm:grid-cols-[minmax(0,1.3fr)_110px_90px_1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs">
                      {finding.path}:{finding.line}
                    </div>
                    <div className="mt-1 flex gap-1 sm:hidden">
                      <KindBadge kind={finding.kind} />
                      <CoverageBadge coverage={finding.coverage} />
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <KindBadge kind={finding.kind} />
                  </div>
                  <div className="hidden sm:block">
                    <CoverageBadge coverage={finding.coverage} />
                  </div>
                  <div className="hidden truncate font-mono text-[11px] text-muted-foreground sm:block">
                    {finding.snippet}
                  </div>
                  <div className="text-right">
                    {finding.coverage === "covered" ? (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {finding.pin?.owner}
                      </span>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setDraft({
                            path: finding.path,
                            kind: finding.kind,
                            line: finding.line,
                            fingerprint: finding.fingerprint,
                            reason:
                              finding.coverage === "expired"
                                ? finding.pin?.reason ?? ""
                                : "",
                            owner: finding.pin?.owner ?? "",
                          });
                          setOpen(true);
                        }}
                      >
                        {finding.coverage === "expired" ? "Renew" : "Register"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PinDialog
        open={open}
        onOpenChange={setOpen}
        draft={draft}
        maxDays={settings.defaultMaxPinDays}
        onSubmit={(input: PinInput, id?: string) => upsertPin(input, id)}
      />
    </div>
  );
}
