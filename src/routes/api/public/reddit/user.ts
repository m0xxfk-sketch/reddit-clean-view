import { createFileRoute } from "@tanstack/react-router";

import { fetchRedditUser, ListingError } from "@/lib/reddit-server";

export const Route = createFileRoute("/api/public/reddit/user")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const user = (params.get("user") ?? "").replace(/[^a-zA-Z0-9_-]/g, "");
        const sort = ["hot", "new", "top", "rising"].includes(params.get("sort") ?? "")
          ? params.get("sort")!
          : "new";
        const after = params.get("after") ?? "";
        if (!user) return Response.json({ error: "Enter a username." }, { status: 400 });

        try {
          const { body, cache } = await fetchRedditUser({ user, sort, after });
          return new Response(body, {
            headers: { "content-type": "application/json", "x-cache": cache },
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
