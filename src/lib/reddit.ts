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

export async function fetchSubredditImages(data: FetchArgs) {
    const sub = data.subreddit.replace(/[^a-zA-Z0-9_]/g, "");
    if (!sub) throw new Error("Enter a subreddit name.");
    const params = new URLSearchParams({ limit: "50", raw_json: "1" });
    if (data.sort === "top") params.set("t", "week");
    if (data.after) params.set("after", data.after);

    const res = await fetch(
      `https://www.reddit.com/r/${sub}/${data.sort}.json?${params.toString()}`,
      { headers: { Accept: "application/json" } },
    ).catch(() => {
      throw new Error("Couldn't reach Reddit. Check your connection or any content blockers.");
    });

    if (res.status === 404) throw new Error(`r/${sub} was not found.`);
    if (res.status === 403)
      throw new Error(`r/${sub} is private, quarantined, or blocking anonymous access.`);
    if (res.status === 429) throw new Error("Reddit is rate limiting. Wait a moment and retry.");
    if (!res.ok) throw new Error(`Reddit responded with ${res.status}. Try again in a moment.`);

    const json = (await res.json()) as any;
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

    return { items, after: (json?.data?.after as string | null) ?? null };
}