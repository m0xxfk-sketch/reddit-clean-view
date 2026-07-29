type Item = {
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

export type RedditListingResult = { items: Item[]; after: string | null };

const UA = "web:peek-image-viewer:v1 (by /u/peek)";
const CACHE_TTL = 15 * 60 * 1000;
const STALE_TTL = 60 * 60 * 1000;
const MIN_GAP_MS = 900;

const cache = new Map<string, { at: number; body: string }>();
let lastRedditFetch = 0;
let token: { value: string; expires: number } | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function throttle() {
  const wait = MIN_GAP_MS - (Date.now() - lastRedditFetch);
  if (wait > 0) await sleep(wait);
  lastRedditFetch = Date.now();
}

import { decodeHtmlEntities, normalizeImageUrl } from "@/lib/image-url";

async function getToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (token && token.expires > Date.now() + 30_000) return token.value;
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  token = { value: json.access_token, expires: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return token.value;
}

function parseJsonListing(
  json: { data?: { after?: string | null; children?: { data?: Record<string, unknown> }[] } },
  sub: string,
): RedditListingResult {
  const items: Item[] = [];
  for (const child of json?.data?.children ?? []) {
    const p = child?.data as Record<string, unknown> | undefined;
    if (!p || p.stickied) continue;

    const push = (url: string, width: number, height: number, suffix = "") =>
      items.push({
        id: `${p.id}${suffix}`,
        title: (p.title as string) ?? "",
        author: (p.author as string) ?? "unknown",
        subreddit: (p.subreddit as string) ?? sub,
        permalink: `https://reddit.com${p.permalink as string}`,
        url: normalizeImageUrl(decodeHtmlEntities(url)),
        width: width || 800,
        height: height || 1000,
        isGallery: Boolean(suffix),
        score: (p.score as number) ?? 0,
        created: (p.created_utc as number) ?? 0,
      });

    const mediaMeta = p.media_metadata as
      | Record<string, { status?: string; s?: { u?: string; gif?: string; x: number; y: number } }>
      | undefined;
    if (p.is_gallery && mediaMeta) {
      const galleryItems = (p.gallery_data as { items?: { media_id: string }[] } | undefined)
        ?.items;
      const order = galleryItems?.map((g) => g.media_id) ?? Object.keys(mediaMeta);
      order.forEach((mid, i) => {
        const m = mediaMeta[mid];
        if (!m || m.status !== "valid" || !m.s) return;
        push(m.s.u ?? m.s.gif ?? "", m.s.x, m.s.y, `-${i}`);
      });
      continue;
    }

    const preview = (
      p.preview as
        | { images?: { source?: { url: string; width: number; height: number } }[] }
        | undefined
    )?.images?.[0];
    if (preview?.source?.url) {
      push(preview.source.url, preview.source.width, preview.source.height);
      continue;
    }
    if (typeof p.url === "string" && /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(p.url)) {
      push(p.url, (p.thumbnail_width as number) ?? 800, (p.thumbnail_height as number) ?? 1000);
    }
  }
  return { items, after: json?.data?.after ?? null };
}

function parseRss(xml: string, sub: string): RedditListingResult {
  const items: Item[] = [];
  let lastId: string | null = null;

  for (const raw of xml.split("<entry>").slice(1)) {
    const entry = raw.split("</entry>")[0];
    const id = /<id>([^<]+)<\/id>/.exec(entry)?.[1] ?? "";
    lastId = id || lastId;
    const title = decodeHtmlEntities(/<title>([\s\S]*?)<\/title>/.exec(entry)?.[1] ?? "");
    const author = (/<name>\/u\/([^<]+)<\/name>/.exec(entry)?.[1] ?? "unknown").trim();
    const permalink = /<link href="([^"]+)"/.exec(entry)?.[1] ?? "";
    const thumb = /<media:thumbnail url="([^"]+)"/.exec(entry)?.[1];
    const content = decodeHtmlEntities(
      /<content type="html">([\s\S]*?)<\/content>/.exec(entry)?.[1] ?? "",
    );
    const direct =
      /href="(https:\/\/i\.redd\.it\/[^"]+)"/.exec(content)?.[1] ??
      /href="(https:\/\/preview\.redd\.it\/[^"]+)"/.exec(content)?.[1] ??
      /src="(https:\/\/i\.redd\.it\/[^"]+)"/.exec(content)?.[1] ??
      /src="(https:\/\/preview\.redd\.it\/[^"]+)"/.exec(content)?.[1] ??
      /<a href="(https:\/\/i\.redd\.it\/[^"]+)"/.exec(content)?.[1];
    const rawUrl = direct ?? thumb;
    const url = rawUrl ? normalizeImageUrl(decodeHtmlEntities(rawUrl)) : undefined;
    if (!url) continue;

    const dims = /\[(\d{3,5})\s*[x×]\s*(\d{3,5})\]/i.exec(title);
    items.push({
      id: id || url,
      title,
      author,
      subreddit: sub,
      permalink: decodeHtmlEntities(permalink),
      url,
      width: dims ? Number(dims[1]) : 1200,
      height: dims ? Number(dims[2]) : 1500,
      isGallery: false,
      score: 0,
      created: Date.parse(/<published>([^<]+)<\/published>/.exec(entry)?.[1] ?? "") / 1000 || 0,
    });
  }

  return { items, after: items.length >= 20 ? lastId : null };
}

function cacheKey(sub: string, sort: string, after: string) {
  return `${sub.toLowerCase()}:${sort}:${after || "start"}`;
}

function normalizeListing(payload: RedditListingResult): RedditListingResult {
  return {
    ...payload,
    items: payload.items.map((item) => ({
      ...item,
      url: normalizeImageUrl(decodeHtmlEntities(item.url)),
    })),
  };
}

function readCache(key: string, maxAge = CACHE_TTL) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > maxAge) return null;
  return hit;
}

function writeCache(key: string, payload: RedditListingResult) {
  const normalized = normalizeListing(payload);
  const body = JSON.stringify(normalized);
  cache.set(key, { at: Date.now(), body });
  return body;
}

async function fetchRss(sub: string, sort: string, after: string): Promise<Response> {
  const qs = new URLSearchParams({ limit: "25" });
  if (sort === "top") qs.set("t", "week");
  if (after) qs.set("after", after);

  const urls = [
    `https://www.reddit.com/r/${sub}/${sort}.rss?${qs}`,
    `https://old.reddit.com/r/${sub}/${sort}.rss?${qs}`,
  ];

  let last: Response | null = null;
  for (const url of urls) {
    await throttle();
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/atom+xml" },
      signal: AbortSignal.timeout(12_000),
    });
    last = res;
    if (res.ok) return res;
    if (res.status === 404) return res;
    if (res.status === 429) await sleep(1500 + Math.random() * 500);
  }
  return last ?? new Response(null, { status: 502 });
}

async function fetchOAuth(
  sub: string,
  sort: string,
  after: string,
): Promise<RedditListingResult | null> {
  const accessToken = await getToken().catch(() => null);
  if (!accessToken) return null;

  const qs = new URLSearchParams({ limit: "50", raw_json: "1" });
  if (sort === "top") qs.set("t", "week");
  if (after) {
    qs.set("after", after);
    qs.set("count", "50");
  }

  await throttle();
  const res = await fetch(`https://oauth.reddit.com/r/${sub}/${sort}?${qs}`, {
    headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": UA },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return null;
  return parseJsonListing(await res.json(), sub);
}

export type FetchListingOptions = {
  sub: string;
  sort: string;
  after?: string;
};

export type FetchListingResponse = {
  body: string;
  cache: "hit" | "miss" | "stale";
};

/** Fetch a subreddit listing with cache, throttle, retry, and stale fallback. */
export async function fetchRedditListing(opts: FetchListingOptions): Promise<FetchListingResponse> {
  const { sub, sort, after = "" } = opts;
  const key = cacheKey(sub, sort, after);

  const fresh = readCache(key, CACHE_TTL);
  if (fresh) {
    const fixed = normalizeListing(JSON.parse(fresh.body) as RedditListingResult);
    return { body: JSON.stringify(fixed), cache: "hit" };
  }

  let payload: RedditListingResult | null = null;
  let rateLimited = false;

  payload = await fetchOAuth(sub, sort, after);

  if (!payload) {
    for (let attempt = 0; attempt < 3 && !payload; attempt++) {
      if (attempt > 0) await sleep(800 * 2 ** attempt);
      const res = await fetchRss(sub, sort, after);
      if (res.ok) {
        const parsed = parseRss(await res.text(), sub);
        if (parsed.items.length) payload = parsed;
      } else if (res.status === 404) {
        throw new ListingError(`r/${sub} was not found.`, 404);
      } else if (res.status === 429) {
        rateLimited = true;
      }
    }
  }

  if (payload) {
    return { body: writeCache(key, payload), cache: "miss" };
  }

  const stale = readCache(key, STALE_TTL);
  if (stale) {
    const fixed = normalizeListing(JSON.parse(stale.body) as RedditListingResult);
    return { body: JSON.stringify(fixed), cache: "stale" };
  }

  if (rateLimited) {
    throw new ListingError("Reddit is rate limiting right now. Try again in a minute.", 429);
  }
  throw new ListingError("Couldn't reach Reddit. Try again in a moment.", 502);
}

export class ListingError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Sequential multi-sub fetch for mix feeds — one Reddit request at a time. */
export async function fetchRedditMix(
  subs: string[],
  sort = "top",
  imageLimit = 80,
): Promise<RedditListingResult & { sources: string[] }> {
  const mixKey = `mix:${sort}:${subs.join(",")}`;
  const fresh = readCache(mixKey, CACHE_TTL);
  if (fresh) {
    const parsed = JSON.parse(fresh.body) as RedditListingResult & { sources?: string[] };
    const fixed = normalizeListing(parsed);
    return { ...fixed, sources: parsed.sources ?? [] };
  }

  const batches: { sub: string; items: Item[] }[] = [];
  for (const sub of subs) {
    try {
      const { body } = await fetchRedditListing({ sub, sort });
      const parsed = JSON.parse(body) as RedditListingResult;
      if (parsed.items.length) batches.push({ sub, items: parsed.items });
    } catch {
      // skip subs that fail — partial mix is better than none
    }
  }

  const sources = batches.map((b) => b.sub);
  const items = batches
    .flatMap((b) => b.items)
    .sort((a, b) => b.score - a.score)
    .slice(0, imageLimit);

  const result = { items, after: null as string | null, sources };
  cache.set(mixKey, { at: Date.now(), body: JSON.stringify(result) });
  return result;
}
