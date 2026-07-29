export type RedditImage = {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  permalink: string;
  url: string;
  width: number;
  height: number;
  isGallery: boolean;
  score: number;
  created: number;
};

export type Sort = "hot" | "new" | "top" | "rising";

export type FetchArgs = {
  subreddit: string;
  sort: Sort;
  after?: string | null;
};

function decode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

export type FetchResult = { items: RedditImage[]; after: string | null };

const CACHE_PREFIX = "peek:page:";
const CACHE_TTL = 10 * 60 * 1000;

function cacheKey(sub: string, sort: Sort, after?: string | null) {
  return `${CACHE_PREFIX}${sub.toLowerCase()}:${sort}:${after ?? "start"}`;
}

function readCache(key: string): FetchResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: FetchResult };
    if (!parsed?.at || Date.now() - parsed.at > CACHE_TTL) {
      window.sessionStorage.removeItem(key);
      return null;
    }
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

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(500 * 2 ** (attempt - 1) + Math.random() * 250);

    let res: Response;
    try {
      res = await fetch(`/api/public/reddit?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
    } catch {
      lastError = new Error("Network error. Check your connection and try again.");
      continue;
    }

    let json: any;
    try {
      json = await res.json();
    } catch {
      lastError = new Error("Reddit returned an unexpected response.");
      continue;
    }

    if (!res.ok) {
      lastError = new Error(json?.error ?? `Request failed with ${res.status}.`);
      if (res.status === 400 || res.status === 404) throw lastError;
      continue;
    }

    const result: FetchResult = {
      items: (json.items ?? []) as RedditImage[],
      after: (json.after ?? null) as string | null,
    };
    writeCache(key, result);
    return result;
  }

  throw lastError;
}