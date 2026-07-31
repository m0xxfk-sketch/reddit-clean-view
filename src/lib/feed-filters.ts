import type { RedditMedia } from "@/lib/media-types";
import type { MediaFilter, OrientationFilter, TimeFilter } from "@/lib/premium-store";

const DAY = 86400;

function matchesOrientation(item: RedditMedia, filter: OrientationFilter): boolean {
  if (filter === "all") return true;
  const w = item.width || 1;
  const h = item.height || 1;
  const ratio = w / h;
  if (filter === "portrait") return ratio < 0.95;
  if (filter === "landscape") return ratio > 1.05;
  return ratio >= 0.95 && ratio <= 1.05;
}

export function filterMedia(
  items: RedditMedia[],
  opts: {
    mediaFilter: MediaFilter;
    minScore: number;
    timeFilter: TimeFilter;
    orientationFilter?: OrientationFilter;
  },
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
    if (opts.orientationFilter && !matchesOrientation(item, opts.orientationFilter)) return false;
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
