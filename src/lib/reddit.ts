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
 * Reddit's own hosts are often blocked (content blockers, corporate DNS, strict
 * CORS), so we try several equivalent sources in order and use whichever answers.
 */
const SOURCES: Array<(path: string) => string> = [
  (path) => `https://www.reddit.com${path}`,
  (path) => `https://api.reddit.com${path}`,
  (path) => `https://old.reddit.com${path}`,
  (path) => `https://corsproxy.io/?url=${encodeURIComponent(`https://www.reddit.com${path}`)}`,
  (path) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.reddit.com${path}`)}`,
];

/** Retries transient failures (429 / 5xx / network) with exponential backoff + jitter. */
async function fetchWithBackoff(path: string, attempts = 3) {
  let lastError: Error = new Error("Couldn't reach Reddit.");

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      const base = 500 * 2 ** (attempt - 1);
      await sleep(base + Math.random() * 250);
    }

    for (const source of SOURCES) {
      let res: Response;
      try {
        res = await fetch(source(path), { headers: { Accept: "application/json" } });
      } catch {
        lastError = new Error(
          "Couldn't reach Reddit. Check your connection or any content blockers.",
        );
        continue;
      }

      if (res.status === 429) {
        lastError = new Error("Reddit is rate limiting. Wait a moment and retry.");
        continue;
      }
      if (res.status === 403 || res.status >= 500) {
        lastError = new Error(`Reddit responded with ${res.status}. Try again in a moment.`);
        continue;
      }
      return res;
    }
  }

  throw lastError;
}

export async function fetchSubredditImages(data: FetchArgs) {
    const sub = data.subreddit.replace(/[^a-zA-Z0-9_]/g, "");
    if (!sub) throw new Error("Enter a subreddit name.");

    const key = cacheKey(sub, data.sort, data.after);
    const cached = readCache(key);
    if (cached) return cached;

    const params = new URLSearchParams({ limit: "50", raw_json: "1" });
    if (data.sort === "top") params.set("t", "week");
    if (data.after) params.set("after", data.after);

    const res = await fetchWithBackoff(`/r/${sub}/${data.sort}.json?${params.toString()}`);

    if (res.status === 404) throw new Error(`r/${sub} was not found.`);
    if (res.status === 403)
      throw new Error(`r/${sub} is private, quarantined, or blocking anonymous access.`);
    if (!res.ok) throw new Error(`Reddit responded with ${res.status}. Try again in a moment.`);

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Reddit returned an unexpected response. Try again in a moment.");
    }
    const children: any[] = json?.data?.children ?? [];
    const items: RedditImage[] = [];

    for (const child of children) {
      const p = child?.data;
      if (!p || p.stickied) continue;

      const push = (url: string, width: number, height: number, suffix = "") => {
        items.push({
          id: `${p.id}${suffix}`,
          title: p.title ?? "",
          author: p.author ?? "unknown",
          subreddit: p.subreddit ?? sub,
          permalink: `https://reddit.com${p.permalink}`,
          url: decode(url),
          width: width || 800,
          height: height || 1000,
          isGallery: Boolean(suffix),
          score: p.score ?? 0,
          created: p.created_utc ?? 0,
        });
      };

      if (p.is_gallery && p.media_metadata) {
        const order: string[] = p.gallery_data?.items?.map((g: any) => g.media_id) ?? Object.keys(p.media_metadata);
        order.forEach((mid, i) => {
          const m = p.media_metadata[mid];
          if (!m || m.status !== "valid" || !m.s) return;
          push(m.s.u ?? m.s.gif, m.s.x, m.s.y, `-${i}`);
        });
        continue;
      }

      const preview = p.preview?.images?.[0];
      if (preview?.source?.url) {
        push(preview.source.url, preview.source.width, preview.source.height);
        continue;
      }

      if (typeof p.url === "string" && /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(p.url)) {
        push(p.url, p.thumbnail_width ?? 800, p.thumbnail_height ?? 1000);
      }
    }

    const result: FetchResult = { items, after: (json?.data?.after as string | null) ?? null };
    writeCache(key, result);
    return result;
}