import { useEffect } from "react";

import { imageCandidates } from "@/lib/image-fallbacks";
import type { RedditMedia } from "@/lib/media-types";
import { isDirectVideoUrl, needsVideoResolve } from "@/lib/media-url";
import type { VideoQuality } from "@/lib/premium-store";
import { isAnimatedGifUrl, resolveVideoUrl } from "@/lib/video-resolve";

/** Preload upcoming images and warm the Redgifs resolve cache (low priority). */
export function useMediaPrefetch(
  items: RedditMedia[],
  centerIndex: number | null,
  count = 3,
  videoQuality: VideoQuality = "sd",
) {
  useEffect(() => {
    if (centerIndex == null || !items.length) return;

    const slice = items.slice(centerIndex + 1, centerIndex + 1 + count);
    const links: HTMLLinkElement[] = [];
    const imgs: HTMLImageElement[] = [];

    for (const item of slice) {
      const isVideo =
        item.mediaKind === "video" && !isAnimatedGifUrl(item.url);

      if (isVideo) {
        if (isDirectVideoUrl(item.url)) {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "video";
          link.href = item.url;
          document.head.appendChild(link);
          links.push(link);
        } else if (needsVideoResolve(item.url)) {
          void resolveVideoUrl(item.url, videoQuality, { priority: false });
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
  }, [items, centerIndex, count, videoQuality]);
}
