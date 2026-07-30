import { createFileRoute } from "@tanstack/react-router";

import { decodeHtmlEntities, isAllowedImageUrl, normalizeImageUrl } from "@/lib/image-url";
import { isAllowedMediaUrl } from "@/lib/media-url";

const UA = "web:peek-image-viewer:v1 (by /u/peek)";
const CACHE = "public, max-age=86400, stale-while-revalidate=604800";

export const Route = createFileRoute("/api/public/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get("url") ?? "";
        const decoded = decodeHtmlEntities(raw);
        const url = normalizeImageUrl(decoded);

        const allowed = isAllowedMediaUrl(url) || isAllowedImageUrl(url);
        if (!url || !allowed) {
          return Response.json({ error: "Invalid media URL." }, { status: 400 });
        }

        try {
          const res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "video/*,image/*,*/*" },
            redirect: "follow",
            signal: AbortSignal.timeout(20_000),
          });

          if (!res.ok) {
            return Response.json({ error: `Upstream ${res.status}` }, { status: 502 });
          }

          const type = res.headers.get("content-type") ?? "application/octet-stream";
          return new Response(res.body, {
            headers: {
              "content-type": type,
              "cache-control": CACHE,
            },
          });
        } catch {
          return Response.json({ error: "Media fetch failed." }, { status: 502 });
        }
      },
    },
  },
});
