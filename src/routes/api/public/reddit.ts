import { createFileRoute } from "@tanstack/react-router";

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

const UA = "web:peek-image-viewer:v1 (by /u/peek)";
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { at: number; body: string }>();

let token: { value: string; expires: number } | null = null;

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
  token = {
    value: json.access_token,
    expires: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return token.value;
}

function decode(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#32;/g, " ")
    .replace(/&amp;/g, "&");
}

function parseJsonListing(json: any, sub: string) {
  const items: Item[] = [];
  for (const child of json?.data?.children ?? []) {
    const p = child?.data;
    if (!p || p.stickied) continue;

    const push = (url: string, width: number, height: number, suffix = "") =>
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

    if (p.is_gallery && p.media_metadata) {
      const order: string[] =
        p.gallery_data?.items?.map((g: any) => g.media_id) ?? Object.keys(p.media_metadata);
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
  return { items, after: (json?.data?.after as string | null) ?? null };
}

function parseRss(xml: string, sub: string) {
  const items: Item[] = [];
  let lastId: string | null = null;

  for (const raw of xml.split("<entry>").slice(1)) {
    const entry = raw.split("</entry>")[0];
    const id = /<id>([^<]+)<\/id>/.exec(entry)?.[1] ?? "";
    lastId = id || lastId;
    const title = decode(/<title>([\s\S]*?)<\/title>/.exec(entry)?.[1] ?? "");
    const author = (/<name>\/u\/([^<]+)<\/name>/.exec(entry)?.[1] ?? "unknown").trim();
    const permalink = /<link href="([^"]+)"/.exec(entry)?.[1] ?? "";
    const thumb = /<media:thumbnail url="([^"]+)"/.exec(entry)?.[1];
    const content = decode(/<content type="html">([\s\S]*?)<\/content>/.exec(entry)?.[1] ?? "");
    const direct = /<a href="(https:\/\/i\.redd\.it\/[^"]+)"/.exec(content)?.[1];
    const url = direct ?? (thumb ? decode(thumb) : undefined);
    if (!url) continue;

    const dims = /\[(\d{3,5})\s*[x×]\s*(\d{3,5})\]/i.exec(title);
    items.push({
      id: id || url,
      title,
      author,
      subreddit: sub,
      permalink: decode(permalink),
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

export const Route = createFileRoute("/api/public/reddit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const sub = (params.get("subreddit") ?? "").replace(/[^a-zA-Z0-9_]/g, "");
        const sort = ["hot", "new", "top", "rising"].includes(params.get("sort") ?? "")
          ? params.get("sort")!
          : "hot";
        const after = params.get("after") ?? "";
        if (!sub) return Response.json({ error: "Enter a subreddit name." }, { status: 400 });

        const key = `${sub.toLowerCase()}:${sort}:${after}`;
        const hit = cache.get(key);
        if (hit && Date.now() - hit.at < CACHE_TTL) {
          return new Response(hit.body, {
            headers: { "content-type": "application/json", "x-cache": "hit" },
          });
        }

        const qs = new URLSearchParams({ limit: "100", raw_json: "1" });
        if (sort === "top") qs.set("t", "week");
        if (after) {
          qs.set("after", after);
          qs.set("count", "100");
        }

        let payload: { items: Item[]; after: string | null } | null = null;
        let failure = "";

        const accessToken = await getToken().catch(() => null);
        if (accessToken) {
          const res = await fetch(`https://oauth.reddit.com/r/${sub}/${sort}?${qs}`, {
            headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": UA },
          });
          if (res.ok) payload = parseJsonListing(await res.json(), sub);
          else if (res.status === 404) failure = `r/${sub} was not found.`;
          else if (res.status === 403) failure = `r/${sub} is private or restricted.`;
        }

        if (!payload) {
          const res = await fetch(`https://www.reddit.com/r/${sub}/${sort}.rss?${qs}`, {
            headers: { "User-Agent": UA, Accept: "application/atom+xml" },
          });
          if (res.ok) {
            const xml = await res.text();
            const parsed = parseRss(xml, sub);
            if (parsed.items.length) payload = parsed;
            else failure = failure || `No images found in r/${sub}.`;
          } else if (res.status === 404) {
            failure = `r/${sub} was not found.`;
          } else if (res.status === 429) {
            failure = "Reddit is rate limiting this app right now. Try again in a minute.";
          } else {
            failure = failure || `Reddit responded with ${res.status}.`;
          }
        }

        if (!payload) {
          return Response.json(
            { error: failure || "Couldn't reach Reddit." },
            { status: 502 },
          );
        }

        const body = JSON.stringify(payload);
        cache.set(key, { at: Date.now(), body });
        return new Response(body, {
          headers: { "content-type": "application/json", "x-cache": "miss" },
        });
      },
    },
  },
});