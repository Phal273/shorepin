"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { addDaysISO, todayISO } from "./dates";
import { newId, normalizePath } from "./fingerprint";
import { defaultPatternToggles } from "./patterns";
import type { PinKind, ScanResult, Settings, ShorePin } from "./types";

const KEYS = {
  pins: "shorepin.v1.pins",
  settings: "shorepin.v1.settings",
  scan: "shorepin.v1.lastScan",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  orgName: "Local workspace",
  defaultMaxPinDays: 30,
  patterns: defaultPatternToggles(),
};

type Snapshot = {
  pins: ShorePin[];
  settings: Settings;
  lastScan: ScanResult | null;
};

export type PinInput = {
  path: string;
  kind: PinKind;
  line: number | null;
  fingerprint: string;
  owner: string;
  reason: string;
  expiresAt: string;
};

type Store = Snapshot & {
  upsertPin: (input: PinInput, id?: string) => ShorePin;
  closePin: (id: string) => void;
  reopenPin: (id: string) => void;
  deletePin: (id: string) => void;
  saveSettings: (next: Settings) => void;
  saveScan: (scan: ScanResult) => void;
  replacePins: (pins: ShorePin[]) => void;
  resetAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

const EMPTY: Snapshot = {
  pins: [],
  settings: DEFAULT_SETTINGS,
  lastScan: null,
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function loadSnapshot(): Snapshot {
  const storedSettings = readJson<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  return {
    pins: readJson<ShorePin[]>(KEYS.pins, []),
    settings: {
      ...DEFAULT_SETTINGS,
      ...storedSettings,
      patterns: {
        ...DEFAULT_SETTINGS.patterns,
        ...storedSettings.patterns,
      },
    },
    lastScan: readJson<ScanResult | null>(KEYS.scan, null),
  };
}

let snapshot: Snapshot =
  typeof window === "undefined" ? EMPTY : loadSnapshot();

function setSnapshot(next: Snapshot) {
  snapshot = next;
  writeJson(KEYS.pins, next.pins);
  writeJson(KEYS.settings, next.settings);
  if (next.lastScan) writeJson(KEYS.scan, next.lastScan);
  else window.localStorage.removeItem(KEYS.scan);
  emit();
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const upsertPin = useCallback((input: PinInput, id?: string) => {
    const now = new Date().toISOString();
    if (id) {
      const existing = snapshot.pins.find((pin) => pin.id === id);
      if (!existing) throw new Error("Pin not found");
      const saved: ShorePin = {
        ...existing,
        ...input,
        path: normalizePath(input.path),
        owner: input.owner.trim(),
        reason: input.reason.trim(),
        updatedAt: now,
      };
      setSnapshot({
        ...snapshot,
        pins: snapshot.pins.map((pin) => (pin.id === id ? saved : pin)),
      });
      return saved;
    }
    const created: ShorePin = {
      id: newId(),
      path: normalizePath(input.path),
      kind: input.kind,
      line: input.line,
      fingerprint: input.fingerprint,
      owner: input.owner.trim(),
      reason: input.reason.trim(),
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };
    setSnapshot({ ...snapshot, pins: [created, ...snapshot.pins] });
    return created;
  }, []);

  const closePin = useCallback((id: string) => {
    const now = new Date().toISOString();
    setSnapshot({
      ...snapshot,
      pins: snapshot.pins.map((pin) =>
        pin.id === id ? { ...pin, closedAt: now, updatedAt: now } : pin,
      ),
    });
  }, []);

  const reopenPin = useCallback((id: string) => {
    const now = new Date().toISOString();
    setSnapshot({
      ...snapshot,
      pins: snapshot.pins.map((pin) =>
        pin.id === id ? { ...pin, closedAt: null, updatedAt: now } : pin,
      ),
    });
  }, []);

  const deletePin = useCallback((id: string) => {
    setSnapshot({
      ...snapshot,
      pins: snapshot.pins.filter((pin) => pin.id !== id),
    });
  }, []);

  const saveSettings = useCallback((next: Settings) => {
    setSnapshot({ ...snapshot, settings: next });
  }, []);

  const saveScan = useCallback((scan: ScanResult) => {
    setSnapshot({ ...snapshot, lastScan: scan });
  }, []);

  const replacePins = useCallback((pins: ShorePin[]) => {
    setSnapshot({ ...snapshot, pins });
  }, []);

  const resetAll = useCallback(() => {
    setSnapshot({
      pins: [],
      settings: DEFAULT_SETTINGS,
      lastScan: null,
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      pins: current.pins,
      settings: current.settings,
      lastScan: current.lastScan,
      upsertPin,
      closePin,
      reopenPin,
      deletePin,
      saveSettings,
      saveScan,
      replacePins,
      resetAll,
    }),
    [
      current,
      upsertPin,
      closePin,
      reopenPin,
      deletePin,
      saveSettings,
      saveScan,
      replacePins,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}

export function defaultExpiry(maxDays: number): string {
  return addDaysISO(todayISO(), maxDays);
}

export function exportPinsJson(pins: ShorePin[]) {
  return JSON.stringify({ version: 1, pins }, null, 2);
}
