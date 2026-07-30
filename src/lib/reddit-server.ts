type Item = {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  permalink: string;
  url: string;
  posterUrl?: string;
  mediaKind: "image" | "video";
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

/** Serialize Reddit fetches so parallel mix workers don't stampede. */
let throttleChain: Promise<void> = Promise.resolve();

async function throttle() {
  const run = throttleChain.then(async () => {
    const wait = MIN_GAP_MS - (Date.now() - lastRedditFetch);
    if (wait > 0) await sleep(wait);
    lastRedditFetch = Date.now();
  });
  throttleChain = run.catch(() => {});
  await run;
}

import { decodeHtmlEntities, normalizeImageUrl } from "@/lib/image-url";
import { isDirectVideoUrl, isRedgifsUrl, normalizePosterUrl } from "@/lib/media-url";

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

    const pushImage = (url: string, width: number, height: number, suffix = "") =>
      items.push({
        id: `${p.id}${suffix}`,
        title: (p.title as string) ?? "",
        author: (p.author as string) ?? "unknown",
        subreddit: (p.subreddit as string) ?? sub,
        permalink: `https://reddit.com${p.permalink as string}`,
        url: normalizeImageUrl(decodeHtmlEntities(url)),
        mediaKind: "image",
        width: width || 800,
        height: height || 1000,
        isGallery: Boolean(suffix),
        score: (p.score as number) ?? 0,
        created: (p.created_utc as number) ?? 0,
      });

    const pushVideo = (
      url: string,
      poster: string | undefined,
      width: number,
      height: number,
      suffix = "",
    ) =>
      items.push({
        id: `${p.id}${suffix}`,
        title: (p.title as string) ?? "",
        author: (p.author as string) ?? "unknown",
        subreddit: (p.subreddit as string) ?? sub,
        permalink: `https://reddit.com${p.permalink as string}`,
        url: isDirectVideoUrl(url) ? normalizeImageUrl(decodeHtmlEntities(url)) : url,
        posterUrl: normalizePosterUrl(poster),
        mediaKind: "video",
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
        const asset = m.s.u ?? m.s.gif ?? "";
        if (/\.gif$/i.test(asset)) pushVideo(asset, undefined, m.s.x, m.s.y, `-${i}`);
        else pushImage(asset, m.s.x, m.s.y, `-${i}`);
      });
      continue;
    }

    type PreviewImage = {
      source?: { url: string; width: number; height: number };
      variants?: { mp4?: { source?: { url: string; width: number; height: number } } };
    };
    type Preview = {
      images?: PreviewImage[];
      reddit_video_preview?: { fallback_url?: string; width?: number; height?: number };
    };

    const preview = p.preview as Preview | undefined;
    const previewImage = preview?.images?.[0];
    const poster = previewImage?.source?.url;
    const dest =
      (typeof p.url_overridden_by_dest === "string" && p.url_overridden_by_dest) ||
      (typeof p.url === "string" ? p.url : "");

    const redditVideo =
      (
        p.media as { reddit_video?: { fallback_url?: string; width?: number; height?: number } }
      )?.reddit_video?.fallback_url ??
      (
        p.secure_media as {
          reddit_video?: { fallback_url?: string; width?: number; height?: number };
        }
      )?.reddit_video?.fallback_url ??
      preview?.reddit_video_preview?.fallback_url;

    if (redditVideo) {
      pushVideo(
        redditVideo,
        poster,
        previewImage?.source?.width ?? 800,
        previewImage?.source?.height ?? 1000,
      );
      continue;
    }

    const previewMp4 = previewImage?.variants?.mp4?.source;
    if (previewMp4?.url) {
      pushVideo(previewMp4.url, poster, previewMp4.width, previewMp4.height);
      continue;
    }

    if (isRedgifsUrl(dest) || (dest && isDirectVideoUrl(dest))) {
      pushVideo(
        dest,
        poster,
        previewImage?.source?.width ?? 800,
        previewImage?.source?.height ?? 1000,
      );
      continue;
    }

    if (previewImage?.source?.url) {
      pushImage(previewImage.source.url, previewImage.source.width, previewImage.source.height);
      continue;
    }

    if (typeof p.url === "string" && /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(p.url)) {
      if (/\.gif$/i.test(p.url)) {
        pushVideo(p.url, undefined, (p.thumbnail_width as number) ?? 800, (p.thumbnail_height as number) ?? 1000);
      } else {
        pushImage(p.url, (p.thumbnail_width as number) ?? 800, (p.thumbnail_height as number) ?? 1000);
      }
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

    const redgifs =
      /href="(https:\/\/(?:www\.)?redgifs\.com\/watch\/[^"]+)"/i.exec(content)?.[1] ??
      /href="(https:\/\/(?:www\.)?redgifs\.com\/ifr\/[^"]+)"/i.exec(content)?.[1];
    const vreddit = /href="(https:\/\/v\.redd\.it\/[^"]+\.mp4[^"]*)"/i.exec(content)?.[1]
      ?? /href="(https:\/\/v\.redd\.it\/[^"]+)"/i.exec(content)?.[1];
    const ireddit =
      /href="(https:\/\/i\.redd\.it\/[^"]+)"/i.exec(content)?.[1];
    const imgSrc =
      /src="(https:\/\/external-preview\.redd\.it\/[^"]+)"/.exec(content)?.[1] ??
      /src="(https:\/\/preview\.redd\.it\/[^"]+)"/.exec(content)?.[1] ??
      /src="(https:\/\/i\.redd\.it\/[^"]+)"/.exec(content)?.[1];
    const direct =
      ireddit ??
      /href="(https:\/\/preview\.redd\.it\/[^"]+)"/.exec(content)?.[1] ??
      /src="(https:\/\/i\.redd\.it\/[^"]+)"/.exec(content)?.[1] ??
      /src="(https:\/\/preview\.redd\.it\/[^"]+)"/.exec(content)?.[1] ??
      /<a href="(https:\/\/i\.redd\.it\/[^"]+)"/.exec(content)?.[1];

    const dims = /\[(\d{3,5})\s*[x×]\s*(\d{3,5})\]/i.exec(title);
    const width = dims ? Number(dims[1]) : 1200;
    const height = dims ? Number(dims[2]) : 1500;

    if (redgifs || vreddit) {
      items.push({
        id: id || redgifs || vreddit || title,
        title,
        author,
        subreddit: sub,
        permalink: decodeHtmlEntities(permalink),
        url: redgifs ?? vreddit!,
        posterUrl: normalizePosterUrl(imgSrc ?? thumb),
        mediaKind: "video",
        width,
        height,
        isGallery: false,
        score: 0,
        created: Date.parse(/<published>([^<]+)<\/published>/.exec(entry)?.[1] ?? "") / 1000 || 0,
      });
      continue;
    }

    const rawUrl = direct ?? thumb;
    const url = rawUrl ? normalizeImageUrl(decodeHtmlEntities(rawUrl)) : undefined;
    if (!url) continue;

    items.push({
      id: id || url,
      title,
      author,
      subreddit: sub,
      permalink: decodeHtmlEntities(permalink),
      url,
      mediaKind: /\.gif(\?.*)?$/i.test(url) ? "video" : "image",
      width,
      height,
      isGallery: false,
      score: 0,
      created: Date.parse(/<published>([^<]+)<\/published>/.exec(entry)?.[1] ?? "") / 1000 || 0,
    });
  }

  return { items, after: items.length >= 20 ? lastId : null };
}

function cacheKey(sub: string, sort: string, after: string) {
  return `v2:${sub.toLowerCase()}:${sort}:${after || "start"}`;
}

function normalizeListing(payload: RedditListingResult): RedditListingResult {
  return {
    ...payload,
    items: payload.items.map((item) => ({
      ...item,
      url:
        item.mediaKind === "video" && isRedgifsUrl(item.url)
          ? item.url
          : item.mediaKind === "video" && isDirectVideoUrl(item.url)
            ? normalizeImageUrl(decodeHtmlEntities(item.url))
            : normalizeImageUrl(decodeHtmlEntities(item.url)),
      posterUrl: item.posterUrl ? normalizePosterUrl(item.posterUrl) : undefined,
      mediaKind: item.mediaKind ?? "image",
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

export async function fetchRedditListing(opts: FetchListingOptions): Promise<FetchListingResponse> {
  const { sub, sort, after = "" } = opts;
  const key = cacheKey(sub, sort, after);

  const fresh = readCache(key, CACHE_TTL);
  if (fresh) {
    return { body: fresh.body, cache: "hit" };
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
    return { body: stale.body, cache: "stale" };
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

const MIX_CONCURRENCY = 3;

/** Fetch subs in parallel (throttled) for mix feeds. */
async function fetchSubsForMix(
  subs: string[],
  sort: string,
): Promise<{ sub: string; items: Item[] }[]> {
  const batches: { sub: string; items: Item[] }[] = [];
  const queue = [...subs];

  async function worker() {
    while (queue.length) {
      const sub = queue.shift();
      if (!sub) return;
      try {
        const { body } = await fetchRedditListing({ sub, sort });
        const parsed = JSON.parse(body) as RedditListingResult;
        if (parsed.items.length) batches.push({ sub, items: parsed.items });
      } catch {
        // skip subs that fail — partial mix is better than none
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MIX_CONCURRENCY, subs.length) }, () => worker()),
  );
  return batches;
}

export async function fetchRedditMix(
  subs: string[],
  sort = "top",
  imageLimit = 80,
): Promise<RedditListingResult & { sources: string[] }> {
  const mixKey = `v2:mix:${sort}:${subs.join(",")}`;
  const fresh = readCache(mixKey, CACHE_TTL);
  if (fresh) {
    const parsed = JSON.parse(fresh.body) as RedditListingResult & { sources?: string[] };
    return { ...parsed, sources: parsed.sources ?? [] };
  }

  const batches = await fetchSubsForMix(subs, sort);

  const sources = batches.map((b) => b.sub);
  const items = batches
    .flatMap((b) => b.items)
    .sort((a, b) => b.score - a.score)
    .slice(0, imageLimit);

  const result = { items, after: null as string | null, sources };
  cache.set(mixKey, { at: Date.now(), body: JSON.stringify(result) });
  return result;
}

export type FetchUserOptions = {
  user: string;
  sort?: string;
  after?: string;
};

function userCacheKey(user: string, sort: string, after: string) {
  return `v2:user:${user.toLowerCase()}:${sort}:${after || "start"}`;
}

/** Fetch a Reddit user's submitted posts. */
export async function fetchRedditUser(opts: FetchUserOptions): Promise<FetchListingResponse> {
  const user = opts.user.replace(/[^a-zA-Z0-9_-]/g, "");
  const sort = opts.sort ?? "new";
  const after = opts.after ?? "";
  if (!user) throw new ListingError("Enter a username.", 400);

  const key = userCacheKey(user, sort, after);
  const fresh = readCache(key, CACHE_TTL);
  if (fresh) {
    return { body: fresh.body, cache: "hit" };
  }

  let payload: RedditListingResult | null = null;

  const accessToken = await getToken().catch(() => null);
  if (accessToken) {
    const qs = new URLSearchParams({ limit: "50", raw_json: "1", sort });
    if (after) {
      qs.set("after", after);
      qs.set("count", "50");
    }
    await throttle();
    const res = await fetch(`https://oauth.reddit.com/user/${user}/submitted?${qs}`, {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": UA },
      signal: AbortSignal.timeout(12_000),
    });
    if (res.ok) payload = parseJsonListing(await res.json(), user);
  }

  if (!payload) {
    const qs = new URLSearchParams({ limit: "25" });
    if (after) qs.set("after", after);
    const res = await fetchRssUser(user, qs);
    if (res.ok) {
      const parsed = parseRss(await res.text(), user);
      if (parsed.items.length) payload = parsed;
    } else if (res.status === 404) {
      throw new ListingError(`u/${user} was not found.`, 404);
    }
  }

  if (payload) {
    return { body: writeCache(key, payload), cache: "miss" };
  }

  throw new ListingError("Couldn't load this user's posts.", 502);
}

async function fetchRssUser(user: string, qs: URLSearchParams): Promise<Response> {
  const url = `https://www.reddit.com/user/${user}/submitted.rss?${qs}`;
  await throttle();
  return fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/atom+xml" },
    signal: AbortSignal.timeout(12_000),
  });
}
