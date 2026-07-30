import { useEffect } from "react";

import { imageCandidates } from "@/lib/image-fallbacks";
import type { RedditMedia } from "@/lib/media-types";
import { isDirectVideoUrl, needsVideoResolve } from "@/lib/media-url";

/** Preload upcoming images and resolve upcoming Redgifs URLs. */
export function useMediaPrefetch(
  items: RedditMedia[],
  centerIndex: number | null,
  count = 3,
) {
  useEffect(() => {
    if (centerIndex == null || !items.length) return;

    const slice = items.slice(centerIndex + 1, centerIndex + 1 + count);
    const links: HTMLLinkElement[] = [];
    const imgs: HTMLImageElement[] = [];

    for (const item of slice) {
      if (item.mediaKind === "video") {
        if (isDirectVideoUrl(item.url)) {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "video";
          link.href = item.url;
          document.head.appendChild(link);
          links.push(link);
        } else if (needsVideoResolve(item.url)) {
          fetch(`/api/public/media/resolve?url=${encodeURIComponent(item.url)}`).catch(() => {});
        }
        continue;
      }

      for (const src of imageCandidates(item.url).slice(0, 2)) {
        const img = new Image();
        img.src = src;
        imgs.push(img);
      }
    }

    return () => {
      links.forEach((l) => l.remove());
    };
  }, [items, centerIndex, count]);
}
