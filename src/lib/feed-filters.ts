import type { RedditMedia } from "@/lib/media-types";
import type { MediaFilter, TimeFilter } from "@/lib/premium-store";

const DAY = 86400;

export function filterMedia(
  items: RedditMedia[],
  opts: { mediaFilter: MediaFilter; minScore: number; timeFilter: TimeFilter },
): RedditMedia[] {
  const now = Date.now() / 1000;
  const maxAge =
    opts.timeFilter === "day"
      ? DAY
      : opts.timeFilter === "week"
        ? DAY * 7
        : opts.timeFilter === "month"
          ? DAY * 30
          : Infinity;

  return items.filter((item) => {
    if (opts.mediaFilter === "image" && item.mediaKind === "video") return false;
    if (opts.mediaFilter === "video" && item.mediaKind !== "video") return false;
    if (item.score < opts.minScore) return false;
    if (item.created && now - item.created > maxAge) return false;
    return true;
  });
}

export function shuffleItems<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
