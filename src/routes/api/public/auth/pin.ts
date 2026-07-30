import { createFileRoute } from "@tanstack/react-router";

import {
  authCookieHeader,
  createAuthToken,
  isServerPinEnabled,
  verifyServerPin,
} from "@/lib/pin-auth-server";

export const Route = createFileRoute("/api/public/auth/pin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isServerPinEnabled()) {
          return Response.json(
            { error: "Server PIN is not configured. Use local PIN setup." },
            { status: 400 },
          );
        }

        let body: { pin?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request body." }, { status: 400 });
        }

        const pin = String(body.pin ?? "").trim();
        if (!pin) {
          return Response.json({ error: "Enter your PIN." }, { status: 400 });
        }

        if (!verifyServerPin(pin)) {
          return Response.json({ error: "Wrong PIN." }, { status: 401 });
        }

        const token = await createAuthToken();
        if (!token) {
          return Response.json({ error: "Could not create session." }, { status: 500 });
        }

        return Response.json(
          { ok: true },
          { headers: { "Set-Cookie": authCookieHeader(token) } },
        );
      },
    },
  },
});
