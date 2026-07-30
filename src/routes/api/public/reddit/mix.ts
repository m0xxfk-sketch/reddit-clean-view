import { createFileRoute } from "@tanstack/react-router";

import { fetchRedditMix, ListingError } from "@/lib/reddit-server";
import { getNsfwTopSubreddits, pickDiscoverSubs } from "@/lib/nsfw-subreddits";

export const Route = createFileRoute("/api/public/reddit/mix")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const sort = ["hot", "new", "top", "rising"].includes(params.get("sort") ?? "")
          ? params.get("sort")!
          : "top";
        const subLimit = Math.min(Math.max(Number(params.get("subLimit") ?? 4), 1), 8);
        const imageLimit = Math.min(Math.max(Number(params.get("imageLimit") ?? 60), 10), 100);
        const discover = params.get("discover") === "1";
        const exclude = (params.get("exclude") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const custom = (params.get("subs") ?? "")
          .split(",")
          .map((s) => s.replace(/[^a-zA-Z0-9_]/g, ""))
          .filter(Boolean)
          .slice(0, 10);

        let subs = custom;
        if (!subs.length) {
          subs = discover
            ? pickDiscoverSubs(subLimit, exclude)
            : getNsfwTopSubreddits({ limit: subLimit }).map((s) => s.name);
        }

        if (!subs.length) {
          return Response.json({ error: "No subreddits configured." }, { status: 400 });
        }

        try {
          const result = await fetchRedditMix(subs, sort, imageLimit);
          return Response.json(result, {
            headers: { "content-type": "application/json", "x-cache": discover ? "discover" : "miss" },
          });
        } catch (err) {
          if (err instanceof ListingError) {
            return Response.json({ error: err.message }, { status: err.status });
          }
          return Response.json({ error: "Couldn't build the mix feed." }, { status: 502 });
        }
      },
    },
  },
});
