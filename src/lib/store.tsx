"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

function persist(next: Snapshot) {
  writeJson(KEYS.pins, next.pins);
  writeJson(KEYS.settings, next.settings);
  if (next.lastScan) writeJson(KEYS.scan, next.lastScan);
  else window.localStorage.removeItem(KEYS.scan);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Snapshot>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setState(loadSnapshot());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: Snapshot) => {
    persist(next);
    setState(next);
  }, []);

  const upsertPin = useCallback(
    (input: PinInput, id?: string) => {
      const now = new Date().toISOString();
      let saved: ShorePin;
      setState((current) => {
        if (id) {
          const existing = current.pins.find((pin) => pin.id === id);
          if (!existing) throw new Error("Pin not found");
          saved = {
            ...existing,
            ...input,
            path: normalizePath(input.path),
            owner: input.owner.trim(),
            reason: input.reason.trim(),
            updatedAt: now,
          };
          const next = {
            ...current,
            pins: current.pins.map((pin) => (pin.id === id ? saved : pin)),
          };
          persist(next);
          return next;
        }
        saved = {
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
        const next = { ...current, pins: [saved, ...current.pins] };
        persist(next);
        return next;
      });
      return saved!;
    },
    [],
  );

  const closePin = useCallback((id: string) => {
    const now = new Date().toISOString();
    setState((current) => {
      const next = {
        ...current,
        pins: current.pins.map((pin) =>
          pin.id === id ? { ...pin, closedAt: now, updatedAt: now } : pin,
        ),
      };
      persist(next);
      return next;
    });
  }, []);

  const reopenPin = useCallback((id: string) => {
    const now = new Date().toISOString();
    setState((current) => {
      const next = {
        ...current,
        pins: current.pins.map((pin) =>
          pin.id === id ? { ...pin, closedAt: null, updatedAt: now } : pin,
        ),
      };
      persist(next);
      return next;
    });
  }, []);

  const deletePin = useCallback((id: string) => {
    setState((current) => {
      const next = {
        ...current,
        pins: current.pins.filter((pin) => pin.id !== id),
      };
      persist(next);
      return next;
    });
  }, []);

  const saveSettings = useCallback((nextSettings: Settings) => {
    setState((current) => {
      const next = { ...current, settings: nextSettings };
      persist(next);
      return next;
    });
  }, []);

  const saveScan = useCallback((scan: ScanResult) => {
    setState((current) => {
      const next = { ...current, lastScan: scan };
      persist(next);
      return next;
    });
  }, []);

  const replacePins = useCallback((pins: ShorePin[]) => {
    setState((current) => {
      const next = { ...current, pins };
      persist(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    commit({
      pins: [],
      settings: DEFAULT_SETTINGS,
      lastScan: null,
    });
  }, [commit]);

  const value = useMemo<Store>(
    () => ({
      pins: state.pins,
      settings: state.settings,
      lastScan: state.lastScan,
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
      state,
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
