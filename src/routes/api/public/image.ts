import { createFileRoute } from "@tanstack/react-router";

import { decodeHtmlEntities, isAllowedImageUrl, normalizeImageUrl } from "@/lib/image-url";
import { requirePinAuth } from "@/lib/pin-auth-server";

const UA = "web:peek-image-viewer:v1 (by /u/peek)";
const CACHE = "public, max-age=86400, stale-while-revalidate=604800";

export const Route = createFileRoute("/api/public/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await requirePinAuth(request);
        if (denied) return denied;
        const raw = new URL(request.url).searchParams.get("url") ?? "";
        const decoded = decodeHtmlEntities(raw);
        const url = normalizeImageUrl(decoded);

        if (!url || !isAllowedImageUrl(url)) {
          return Response.json({ error: "Invalid image URL." }, { status: 400 });
        }

        try {
          const res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "image/*,*/*" },
            redirect: "follow",
            signal: AbortSignal.timeout(15_000),
          });

          if (!res.ok) {
            return Response.json({ error: `Upstream ${res.status}` }, { status: 502 });
          }

          const type = res.headers.get("content-type") ?? "image/jpeg";
          return new Response(res.body, {
            headers: {
              "content-type": type,
              "cache-control": CACHE,
            },
          });
        } catch {
          return Response.json({ error: "Image fetch failed." }, { status: 502 });
        }
      },
    },
  },
});
