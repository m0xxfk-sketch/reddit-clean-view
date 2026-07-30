import { createFileRoute } from "@tanstack/react-router";

import { isRequestAuthenticated, isServerPinEnabled } from "@/lib/pin-auth-server";

export const Route = createFileRoute("/api/public/auth/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (isServerPinEnabled()) {
          const unlocked = await isRequestAuthenticated(request);
          return Response.json({
            mode: "server",
            unlocked,
            configured: true,
          });
        }

        return Response.json({
          mode: "client",
          unlocked: false,
          configured: false,
        });
      },
    },
  },
});
