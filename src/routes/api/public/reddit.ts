import { createFileRoute } from "@tanstack/react-router";

import { fetchRedditListing, ListingError } from "@/lib/reddit-server";

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

        try {
          const { body, cache } = await fetchRedditListing({ sub, sort, after });
          return new Response(body, {
            headers: {
              "content-type": "application/json",
              "x-cache": cache,
              "cache-control":
                cache === "hit"
                  ? "public, max-age=300, stale-while-revalidate=900"
                  : "public, max-age=60, stale-while-revalidate=600",
            },
          });
        } catch (err) {
          if (err instanceof ListingError) {
            return Response.json({ error: err.message }, { status: err.status });
          }
          return Response.json({ error: "Couldn't reach Reddit." }, { status: 502 });
        }
      },
    },
  },
});
