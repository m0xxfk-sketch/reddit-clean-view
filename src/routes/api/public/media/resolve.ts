import { createFileRoute } from "@tanstack/react-router";

import { pickRedgifsPlayback, resolveRedgifsUrl } from "@/lib/redgifs-server";
import { isDirectVideoUrl, isRedgifsUrl } from "@/lib/media-url";

export const Route = createFileRoute("/api/public/media/resolve")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const raw = params.get("url") ?? "";
        const quality = params.get("quality") === "hd" ? "hd" : "sd";

        if (!raw) {
          return Response.json({ error: "Missing url parameter." }, { status: 400 });
        }

        if (isDirectVideoUrl(raw)) {
          return Response.json({ url: raw, poster: null });
        }

        if (!isRedgifsUrl(raw)) {
          return Response.json({ error: "Unsupported media URL." }, { status: 400 });
        }

        try {
          const urls = await resolveRedgifsUrl(raw);
          const playback = urls ? pickRedgifsPlayback(urls, quality) : null;
          if (!playback) {
            return Response.json({ error: "Could not resolve Redgifs URL." }, { status: 502 });
          }

          return Response.json(
            {
              url: playback,
              poster: urls?.poster ?? urls?.thumbnail ?? null,
            },
            { headers: { "cache-control": "public, max-age=86400, stale-while-revalidate=604800" } },
          );
        } catch {
          return Response.json({ error: "Redgifs resolution failed." }, { status: 502 });
        }
      },
    },
  },
});
