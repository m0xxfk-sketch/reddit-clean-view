import type { RedditMedia } from "@/lib/media-types";

export type { RedditMedia, RedditImage, MediaKind } from "@/lib/media-types";

export type Sort = "hot" | "new" | "top" | "rising";

export type FetchArgs = {
  subreddit: string;
  sort: Sort;
  after?: string | null;
};

export type FetchResult = { items: RedditMedia[]; after: string | null };

const CACHE_PREFIX = "peek:page:";
const CACHE_TTL = 15 * 60 * 1000;
const STALE_TTL = 60 * 60 * 1000;

function cacheKey(sub: string, sort: Sort, after?: string | null) {
  return `${CACHE_PREFIX}${sub.toLowerCase()}:${sort}:${after ?? "start"}`;
}

function readCache(key: string, maxAge = CACHE_TTL): FetchResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: FetchResult };
    const age = Date.now() - (parsed?.at ?? 0);
    if (!parsed?.at || age > STALE_TTL) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    if (age > maxAge) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: FetchResult) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // storage full or unavailable — caching is best-effort
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Reddit blocks anonymous browser requests (CORS + bot checks), so all fetching
 * goes through our own same-origin endpoint, which talks to Reddit server-side.
 */
export async function fetchSubredditImages(data: FetchArgs): Promise<FetchResult> {
  const sub = data.subreddit.replace(/[^a-zA-Z0-9_]/g, "");
  if (!sub) throw new Error("Enter a subreddit name.");

  const key = cacheKey(sub, data.sort, data.after);
  const cached = readCache(key);
  if (cached) return cached;

  const params = new URLSearchParams({ subreddit: sub, sort: data.sort });
  if (data.after) params.set("after", data.after);

  let lastError = new Error("Couldn't reach Reddit. Try again in a moment.");

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(800 * 2 ** (attempt - 1) + Math.random() * 400);

    let res: Response;
    try {
      res = await fetch(`/api/public/reddit?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
    } catch {
      lastError = new Error("Network error. Check your connection and try again.");
      continue;
    }

    let json: { items?: RedditMedia[]; after?: string | null; error?: string };
    try {
      json = await res.json();
    } catch {
      lastError = new Error("Reddit returned an unexpected response.");
      continue;
    }

    if (!res.ok) {
      const isRateLimit = res.status === 429 || res.status === 502;
      lastError = new Error(json?.error ?? `Request failed with ${res.status}.`);
      if (res.status === 400 || res.status === 404) throw lastError;
      if (isRateLimit && attempt < 2) {
        await sleep(2000 * (attempt + 1) + Math.random() * 500);
        continue;
      }
      continue;
    }

    const result: FetchResult = {
      items: json.items ?? [],
      after: json.after ?? null,
    };
    writeCache(key, result);
    return result;
  }

  const stale = readCache(key, STALE_TTL);
  if (stale?.items.length) return stale;

  throw lastError;
}
