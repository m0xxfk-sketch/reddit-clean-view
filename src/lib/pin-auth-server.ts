const COOKIE_NAME = "peek-auth";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export function getServerPin(): string | null {
  const pin = process.env.PEEK_PIN?.trim();
  return pin || null;
}

export function isServerPinEnabled(): boolean {
  return Boolean(getServerPin());
}

export function verifyServerPin(input: string): boolean {
  const pin = getServerPin();
  if (!pin) return false;
  return input === pin;
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function createAuthToken(): Promise<string | null> {
  const secret = getServerPin();
  if (!secret) return null;
  const exp = Date.now() + COOKIE_MAX_AGE * 1000;
  const payload = String(exp);
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifyAuthToken(token: string): Promise<boolean> {
  const secret = getServerPin();
  if (!secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(payload);
  if (!exp || Date.now() > exp) return false;
  const expected = await hmacSign(payload, secret);
  return timingSafeEqual(sig, expected);
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((part) => {
      const i = part.indexOf("=");
      if (i <= 0) return ["", ""];
      return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
    }),
  );
}

export function authCookieHeader(token: string): string {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`;
}

export function clearAuthCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isRequestAuthenticated(request: Request): Promise<boolean> {
  if (!isServerPinEnabled()) return true;
  const token = parseCookies(request.headers.get("cookie"))[COOKIE_NAME];
  if (!token) return false;
  return verifyAuthToken(token);
}

/** Returns a 401 response when server PIN is enabled and the request is not authenticated. */
export async function requirePinAuth(request: Request): Promise<Response | null> {
  if (!isServerPinEnabled()) return null;
  if (await isRequestAuthenticated(request)) return null;
  return Response.json({ error: "PIN required." }, { status: 401 });
}
