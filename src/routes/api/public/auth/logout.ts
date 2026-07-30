import { createFileRoute } from "@tanstack/react-router";

import { clearAuthCookieHeader } from "@/lib/pin-auth-server";

export const Route = createFileRoute("/api/public/auth/logout")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          { ok: true },
          { headers: { "Set-Cookie": clearAuthCookieHeader() } },
        ),
    },
  },
});
