import { useSyncExternalStore } from "react";
import { DEFAULT_FEATURES, DEFAULT_TAB_COLOR, slugify, type AppType, type Features } from "./buildPrompt.ts";

export type HistoryEntry = {
  name: string;
  description: string;
  features: Features;
  appType: AppType;
  tabColor: string;
  at: number;
};

export const HISTORY_KEY = "launchkit.history.v1";
export const HISTORY_MAX = 10;

// Anything can be in localStorage: another tab's write, a half-written value, an
// older shape. Read it defensively and fall back to no history rather than
// throwing on mount.
const isEntry = (v: unknown): v is HistoryEntry =>
  typeof v === "object" && v !== null &&
  typeof (v as HistoryEntry).name === "string" &&
  typeof (v as HistoryEntry).description === "string";

const normalize = (e: HistoryEntry): HistoryEntry => ({
  ...e,
  features: { ...DEFAULT_FEATURES, ...e.features },
  appType: e.appType ?? "web",
  tabColor: /^#[0-9a-f]{6}$/i.test(e.tabColor ?? "") ? e.tabColor : DEFAULT_TAB_COLOR,
  at: typeof e.at === "number" ? e.at : 0,
});

export function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry).map(normalize).slice(0, HISTORY_MAX) : EMPTY;
  } catch {
    return EMPTY;
  }
}

// Regenerating the same app should move it back to the front, not fill the list
// with 10 copies of itself, so the slug is the identity.
export function addToHistory(entries: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const id = slugify(entry.name);
  return [entry, ...entries.filter((e) => slugify(e.name) !== id)].slice(0, HISTORY_MAX);
}

const EMPTY: HistoryEntry[] = [];
const listeners = new Set<() => void>();
// useSyncExternalStore compares snapshots by identity, so parsing on every read
// would loop forever. Re-parse only when the stored string actually changed.
let lastRaw: string | null = null;
let lastParsed: HistoryEntry[] = EMPTY;

const read = () => {
  try {
    return window.localStorage.getItem(HISTORY_KEY);
  } catch {
    return null;
  }
};

const getSnapshot = () => {
  const raw = read();
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastParsed = parseHistory(raw);
  }
  return lastParsed;
};

// Prerendering has no localStorage, so the server snapshot is empty and the list
// appears on hydration.
const getServerSnapshot = () => EMPTY;

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  // A storage event fires in the OTHER tabs only; the writing tab notifies itself
  // through the listener set.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

export const useHistory = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export function writeHistory(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Private mode and a full quota both throw. History is a convenience, so
    // losing it must never break the generate it was recorded from.
  }
  listeners.forEach((l) => l());
}
