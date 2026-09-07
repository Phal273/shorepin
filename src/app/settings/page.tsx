"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { patternGroups } from "@/lib/patterns";
import {
  DEFAULT_SETTINGS,
  exportPinsJson,
  useStore,
} from "@/lib/store";
import type { PinKind, Settings, ShorePin } from "@/lib/types";

export default function SettingsPage() {
  const { settings, saveSettings, pins, replacePins, resetAll } =
    useStore();
  const [notice, setNotice] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<Settings>) {
    saveSettings({ ...settings, ...patch });
  }

  function toggleKind(kind: PinKind, on: boolean) {
    saveSettings({
      ...settings,
      patterns: { ...settings.patterns, [kind]: on },
    });
  }

  async function importPins(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as
        | ShorePin[]
        | { pins: ShorePin[] };
      const next = Array.isArray(parsed) ? parsed : parsed.pins;
      if (!Array.isArray(next)) throw new Error("Expected a pins array");
      replacePins(next);
      setNotice(`Imported ${next.length} pins.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not import pins.json",
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Workspace"
        title="Settings"
        description="Local only. Org name is a display label for this browser. Pattern toggles hide kinds from scans and from the last-scan counts."
      />

      <section className="grid gap-4 border border-border bg-card p-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Org display name
          </Label>
          <Input
            value={settings.orgName}
            onChange={(event) => update({ orgName: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Default max pin days
          </Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={settings.defaultMaxPinDays}
            onChange={(event) =>
              update({
                defaultMaxPinDays: Math.max(
                  1,
                  Math.min(365, Number(event.target.value) || 1),
                ),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Used as the default expiry and as the maximum allowed when
            registering or editing a pin.
          </p>
        </div>
      </section>

      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-2xl">Patterns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            HACK and FIXME are optional markers. The rest are the usual
            temporary escapes.
          </p>
        </div>
        <div className="divide-y divide-border">
          {patternGroups().map((group) => (
            <div key={group.id} className="grid gap-2 px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass">
                {group.label}
              </div>
              {group.patterns.map((pattern) => (
                <label
                  key={pattern.kind}
                  className="flex items-center justify-between gap-4 py-1"
                >
                  <span>
                    <span className="block font-mono text-xs">
                      {pattern.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {pattern.description}
                    </span>
                  </span>
                  <Switch
                    checked={settings.patterns[pattern.kind]}
                    onCheckedChange={(checked) =>
                      toggleKind(pattern.kind, Boolean(checked))
                    }
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="border border-border bg-card p-4">
        <h2 className="font-display text-2xl">Data</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pins, settings, and the last scan live in localStorage. Export if you
          want the CLI to use the same ledger.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([exportPinsJson(pins)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = "pins.json";
              anchor.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export pins.json
          </Button>
          <Button variant="outline" onClick={() => importRef.current?.click()}>
            Import pins.json
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => importPins(event.target.files?.[0])}
          />
          <Button
            variant="outline"
            onClick={() => {
              saveSettings(DEFAULT_SETTINGS);
              setNotice("Settings reset to defaults.");
            }}
          >
            Reset settings
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (
                window.confirm(
                  "Clear pins, settings, and last scan from this browser?",
                )
              ) {
                resetAll();
                setNotice("Local ledger cleared.");
              }
            }}
          >
            Clear local ledger
          </Button>
        </div>
        {notice ? (
          <p className="mt-3 text-sm text-muted-foreground">{notice}</p>
        ) : null}
      </section>
    </div>
  );
}
