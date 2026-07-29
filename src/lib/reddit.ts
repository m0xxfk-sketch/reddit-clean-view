import { createServerFn } from "@tanstack/react-start";

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

export type FetchResult = { items: RedditImage[]; after: string | null };

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

type RedditPost = {
  id: string;
  stickied?: boolean;
  title?: string;
  author?: string;
  subreddit?: string;
  permalink: string;
  score?: number;
  created_utc?: number;
  url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  is_gallery?: boolean;
  gallery_data?: { items?: { media_id: string }[] };
  media_metadata?: Record<
    string,
    { status?: string; s?: { u?: string; gif?: string; x: number; y: number } }
  >;
  preview?: { images?: { source?: { url: string; width: number; height: number } }[] };
};

type RedditListing = {
  data?: { after?: string | null; children?: { data?: RedditPost }[] };
};

function buildQuery(sort: Sort, after: string | null) {
  const params = new URLSearchParams({ limit: "50", raw_json: "1" });
  if (sort === "top") params.set("t", "week");
  if (after) params.set("after", after);
  return params.toString();
}

/** Turns a raw Reddit listing payload into our image list. Shared by server and client paths. */
function parseListing(json: RedditListing, sub: string): FetchResult {
  const children = json?.data?.children ?? [];
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
      const meta = p.media_metadata;
      const order: string[] = p.gallery_data?.items?.map((g) => g.media_id) ?? Object.keys(meta);
      order.forEach((mid, i) => {
        const m = meta[mid];
        if (!m || m.status !== "valid" || !m.s) return;
        const src = m.s.u ?? m.s.gif;
        if (!src) return;
        push(src, m.s.x, m.s.y, `-${i}`);
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

  return { items, after: (json?.data?.after as string | null) ?? null };
}

// ---------------------------------------------------------------------------
// Client-side session cache
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Server-side proxy
//
// Reddit's .json endpoints don't send CORS headers (and content blockers often
// kill third-party reddit.com requests), so fetching them straight from the
// browser fails with a generic network error. Routing the request through our
// own origin sidesteps both problems.
// ---------------------------------------------------------------------------

const USER_AGENT = "web:peek-image-wall:v1.1 (subreddit image viewer)";

type ProxyFailure = {
  ok: false;
  kind: "not_found" | "forbidden" | "rate_limited" | "upstream" | "unreachable";
  status: number;
};
type ProxyResponse = { ok: true; result: FetchResult } | ProxyFailure;

let oauthToken: { value: string; expiresAt: number } | null = null;

/**
 * Optional authenticated access. Reddit blocks anonymous requests from many
 * datacenter IP ranges, but the official OAuth API is exempt. Set
 * REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET (a "script"/"web" app from
 * https://www.reddit.com/prefs/apps) to make server-side fetching fully reliable.
 */
async function getOAuthToken(): Promise<string | null> {
  const id = typeof process !== "undefined" ? process.env.REDDIT_CLIENT_ID : undefined;
  const secret = typeof process !== "undefined" ? process.env.REDDIT_CLIENT_SECRET : undefined;
  if (!id || !secret) return null;
  if (oauthToken && Date.now() < oauthToken.expiresAt - 60_000) return oauthToken.value;

  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    oauthToken = {
      value: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    };
    return oauthToken.value;
  } catch {
    return null;
  }
}

const fetchViaServer = createServerFn({ method: "GET" })
  .validator((input: { subreddit: string; sort: Sort; after: string | null }) => input)
  .handler(async ({ data }): Promise<ProxyResponse> => {
    const sub = data.subreddit.replace(/[^a-zA-Z0-9_]/g, "");
    if (!sub) return { ok: false, kind: "not_found", status: 404 };

    const query = buildQuery(data.sort, data.after);
    const targets: { url: string; headers: Record<string, string> }[] = [];

    const token = await getOAuthToken();
    if (token) {
      targets.push({
        url: `https://oauth.reddit.com/r/${sub}/${data.sort}?${query}`,
        headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
      });
    }
    for (const host of [
      "https://www.reddit.com",
      "https://old.reddit.com",
      "https://api.reddit.com",
    ]) {
      targets.push({
        url: `${host}/r/${sub}/${data.sort}.json?${query}`,
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
    }

    let failure: ProxyFailure = { ok: false, kind: "unreachable", status: 0 };

    for (const target of targets) {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await sleep(400 + Math.random() * 300);

        let res: Response;
        try {
          res = await fetch(target.url, {
            headers: target.headers,
            redirect: "follow",
            signal: AbortSignal.timeout(10_000),
          });
        } catch {
          failure = { ok: false, kind: "unreachable", status: 0 };
          continue;
        }

        if (res.status === 404) return { ok: false, kind: "not_found", status: 404 };
        if (res.status === 429) {
          failure = { ok: false, kind: "rate_limited", status: 429 };
          continue;
        }
        if (res.status >= 500) {
          failure = { ok: false, kind: "upstream", status: res.status };
          continue;
        }

        const isJson = (res.headers.get("content-type") ?? "").includes("json");
        if (res.status === 403) {
          // A JSON 403 is a real answer (private/quarantined sub); an HTML 403
          // is Reddit's bot wall blocking this host — try the next target.
          if (isJson) return { ok: false, kind: "forbidden", status: 403 };
          failure = { ok: false, kind: "unreachable", status: 403 };
          break;
        }
        if (!res.ok || !isJson) {
          failure = { ok: false, kind: "unreachable", status: res.status };
          break;
        }

        try {
          const json = (await res.json()) as RedditListing;
          return { ok: true, result: parseListing(json, sub) };
        } catch {
          failure = { ok: false, kind: "unreachable", status: res.status };
          break;
        }
      }
    }

    return failure;
  });

// ---------------------------------------------------------------------------
// Browser-direct fallback (used only if our own server can't reach Reddit)
// ---------------------------------------------------------------------------

/** Retries transient failures (429 / 5xx / network) with exponential backoff + jitter. */
async function fetchWithBackoff(url: string, attempts = 3) {
  let lastError: Error = new Error("Couldn't reach Reddit.");

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      const base = 500 * 2 ** (attempt - 1);
      await sleep(base + Math.random() * 250);
    }

    let res: Response;
    try {
      res = await fetch(url, { headers: { Accept: "application/json" } });
    } catch {
      lastError = new Error(
        "Couldn't load posts from Reddit right now. Try again in a moment, or check any content blockers.",
      );
      continue;
    }

    if (res.status === 429) {
      lastError = new Error("Reddit is rate limiting. Wait a moment and retry.");
      continue;
    }
    if (res.status >= 500) {
      lastError = new Error(`Reddit responded with ${res.status}. Try again in a moment.`);
      continue;
    }
    return res;
  }

  throw lastError;
}

async function fetchDirect(sub: string, sort: Sort, after: string | null): Promise<FetchResult> {
  const res = await fetchWithBackoff(
    `https://www.reddit.com/r/${sub}/${sort}.json?${buildQuery(sort, after)}`,
  );

  if (res.status === 404) throw new Error(`r/${sub} was not found.`);
  if (res.status === 403)
    throw new Error(`r/${sub} is private, quarantined, or blocking anonymous access.`);
  if (!res.ok) throw new Error(`Reddit responded with ${res.status}. Try again in a moment.`);

  return parseListing(await res.json(), sub);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchSubredditImages(data: FetchArgs): Promise<FetchResult> {
  const sub = data.subreddit.replace(/[^a-zA-Z0-9_]/g, "");
  if (!sub) throw new Error("Enter a subreddit name.");

  const key = cacheKey(sub, data.sort, data.after);
  const cached = readCache(key);
  if (cached) return cached;

  // Primary path: same-origin server proxy. No CORS, no content blockers.
  let proxied: ProxyResponse | null = null;
  try {
    proxied = await fetchViaServer({
      data: { subreddit: sub, sort: data.sort, after: data.after ?? null },
    });
  } catch {
    proxied = null;
  }

  if (proxied?.ok) {
    writeCache(key, proxied.result);
    return proxied.result;
  }
  if (proxied?.kind === "not_found") throw new Error(`r/${sub} was not found.`);
  if (proxied?.kind === "forbidden")
    throw new Error(`r/${sub} is private, quarantined, or blocking anonymous access.`);

  // Fallback: fetch straight from the browser. This covers the case where
  // Reddit is blocking our server's IP but still serves the visitor directly.
  try {
    const result = await fetchDirect(sub, data.sort, data.after ?? null);
    writeCache(key, result);
    return result;
  } catch (directError) {
    if (proxied?.kind === "rate_limited")
      throw new Error("Reddit is rate limiting requests right now. Wait a moment and retry.");
    if (proxied?.kind === "upstream")
      throw new Error(`Reddit responded with ${proxied.status}. Try again in a moment.`);
    throw directError instanceof Error
      ? directError
      : new Error("Couldn't load posts from Reddit right now. Try again in a moment.");
  }
}
