import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/auth/status")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          mode: "client",
          unlocked: false,
          configured: false,
        }),
    },
  },
});
