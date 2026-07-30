import type { RedditMedia } from "@/lib/media-types";
import { isSeen } from "@/lib/premium-store";

function hashStr(raw: string): number {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable pseudo-random order per feed session. */
export function shuffleItems(items: RedditMedia[], seed: string): RedditMedia[] {
  return [...items].sort(
    (a, b) => hashStr(`${seed}:${a.id}`) - hashStr(`${seed}:${b.id}`),
  );
}

export function applyDisplayFilters(
  items: RedditMedia[],
  opts: { hideSeen?: boolean; shuffle?: boolean; seed?: string },
): RedditMedia[] {
  let out = items;
  if (opts.hideSeen) out = out.filter((item) => !isSeen(item.id));
  if (opts.shuffle && opts.seed) out = shuffleItems(out, opts.seed);
  return out;
}
