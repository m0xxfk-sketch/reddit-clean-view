import type { RedditMedia } from "@/lib/media-types";

export type VideoQuality = "hd" | "sd";
export type MediaFilter = "all" | "image" | "video";
export type TimeFilter = "all" | "day" | "week" | "month";

export type PremiumSettings = {
  videoQuality: VideoQuality;
  mediaFilter: MediaFilter;
  minScore: number;
  timeFilter: TimeFilter;
  immersive: boolean;
  sounds: boolean;
  prefetchCount: number;
};

export type CustomMix = {
  id: string;
  name: string;
  subs: string[];
  created: number;
};

export type BrowseRecord = {
  subreddit: string;
  genre?: string;
  at: number;
};

const SETTINGS_KEY = "peek:premium:settings";
const FAVORITES_KEY = "peek:premium:favorites";
const MIXES_KEY = "peek:premium:mixes";
const HISTORY_KEY = "peek:premium:history";
const OFFLINE_KEY = "peek:premium:offline";
const RECENT_GENRES_KEY = "peek:premium:genres";

export const DEFAULT_SETTINGS: PremiumSettings = {
  videoQuality: "hd",
  mediaFilter: "all",
  minScore: 0,
  timeFilter: "all",
  immersive: false,
  sounds: true,
  prefetchCount: 3,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full
  }
}

let settingsCache: PremiumSettings | null = null;
let settingsCacheKey: string | null = null;

function settingsStorageKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SETTINGS_KEY);
}

export function getSettings(): PremiumSettings {
  const raw = settingsStorageKey();
  if (settingsCache && raw === settingsCacheKey) return settingsCache;
  settingsCacheKey = raw;
  settingsCache = { ...DEFAULT_SETTINGS, ...read<Partial<PremiumSettings>>(SETTINGS_KEY, {}) };
  return settingsCache;
}

export function saveSettings(patch: Partial<PremiumSettings>) {
  const next = { ...getSettings(), ...patch };
  write(SETTINGS_KEY, next);
  settingsCache = next;
  settingsCacheKey = settingsStorageKey();
}

export function getFavorites(): RedditMedia[] {
  return read<RedditMedia[]>(FAVORITES_KEY, []);
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id);
}

export function toggleFavorite(item: RedditMedia): boolean {
  const list = getFavorites();
  const i = list.findIndex((f) => f.id === item.id);
  if (i >= 0) {
    list.splice(i, 1);
    write(FAVORITES_KEY, list);
    window.dispatchEvent(new Event("peek-favorites"));
    return false;
  }
  write(FAVORITES_KEY, [item, ...list].slice(0, 500));
  window.dispatchEvent(new Event("peek-favorites"));
  return true;
}

export function getCustomMixes(): CustomMix[] {
  return read<CustomMix[]>(MIXES_KEY, []);
}

export function saveCustomMix(mix: Omit<CustomMix, "id" | "created">): CustomMix {
  const entry: CustomMix = {
    ...mix,
    id: crypto.randomUUID(),
    created: Date.now(),
    subs: mix.subs.slice(0, 10),
  };
  write(MIXES_KEY, [entry, ...getCustomMixes()].slice(0, 20));
  return entry;
}

export function deleteCustomMix(id: string) {
  write(
    MIXES_KEY,
    getCustomMixes().filter((m) => m.id !== id),
  );
}

export function recordBrowse(subreddit: string, genre?: string) {
  const history = read<BrowseRecord[]>(HISTORY_KEY, []);
  history.unshift({ subreddit, genre, at: Date.now() });
  write(HISTORY_KEY, history.slice(0, 100));

  if (genre) {
    const genres = read<string[]>(RECENT_GENRES_KEY, []);
    write(RECENT_GENRES_KEY, [genre, ...genres.filter((g) => g !== genre)].slice(0, 8));
  }
}

export function getRecentGenres(): string[] {
  return read<string[]>(RECENT_GENRES_KEY, []);
}

export function getBrowseHistory(): BrowseRecord[] {
  return read<BrowseRecord[]>(HISTORY_KEY, []);
}

export function cacheOfflineItems(items: RedditMedia[]) {
  const existing = read<RedditMedia[]>(OFFLINE_KEY, []);
  const map = new Map<string, RedditMedia>();
  for (const item of [...items, ...existing]) map.set(item.id, item);
  write(OFFLINE_KEY, [...map.values()].slice(0, 120));
}

export function getOfflineItems(): RedditMedia[] {
  return read<RedditMedia[]>(OFFLINE_KEY, []);
}
