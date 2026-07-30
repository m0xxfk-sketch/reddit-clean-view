const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const ORIGIN = "https://www.redgifs.com";
const RESOLVE_CACHE_TTL = 24 * 60 * 60 * 1000;

type RedgifsUrls = {
  hd?: string;
  sd?: string;
  poster?: string;
  thumbnail?: string;
};

const resolveCache = new Map<string, { at: number; urls: RedgifsUrls }>();
let authToken: { value: string; expires: number } | null = null;

export function extractRedgifsSlug(raw: string): string | null {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (!host.includes("redgifs.com")) return null;
    const parts = new URL(raw).pathname.split("/").filter(Boolean);
    const i = parts.findIndex((p) => p === "watch" || p === "ifr");
    if (i >= 0 && parts[i + 1]) return parts[i + 1].toLowerCase();
    return parts.at(-1)?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export function isRedgifsUrl(raw: string): boolean {
  return extractRedgifsSlug(raw) != null;
}

async function getAuthToken(): Promise<string> {
  if (authToken && authToken.expires > Date.now() + 60_000) return authToken.value;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(500 * 2 ** attempt);
    const res = await fetch("https://api.redgifs.com/v2/auth/temporary", {
      headers: { "User-Agent": UA, Origin: ORIGIN, Referer: `${ORIGIN}/` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) continue;

    const json = (await res.json()) as { token?: string };
    if (!json.token) continue;

    authToken = { value: json.token, expires: Date.now() + 50 * 60 * 1000 };
    return json.token;
  }
  throw new Error("Redgifs auth failed.");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Resolve a redgifs watch URL to direct mp4 URLs (cached). */
export async function resolveRedgifsUrl(raw: string): Promise<RedgifsUrls | null> {
  const slug = extractRedgifsSlug(raw);
  if (!slug) return null;

  const cached = resolveCache.get(slug);
  if (cached && Date.now() - cached.at < RESOLVE_CACHE_TTL) return cached.urls;

  let token = await getAuthToken();

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(400 * 2 ** attempt);
    const res = await fetch(`https://api.redgifs.com/v2/gifs/${slug}`, {
      headers: {
        "User-Agent": UA,
        Origin: ORIGIN,
        Referer: `${ORIGIN}/`,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (res.status === 401) {
      authToken = null;
      const fresh = await getAuthToken();
      if (fresh !== token) {
        token = fresh;
        continue;
      }
    }

    if (res.status === 429 || res.status >= 500) continue;
    if (!res.ok) return null;

    const json = (await res.json()) as { gif?: { urls?: RedgifsUrls } };
    const urls = json.gif?.urls;
    if (!urls?.hd && !urls?.sd) return null;

    resolveCache.set(slug, { at: Date.now(), urls });
    return urls;
  }

  return null;
}

export function pickRedgifsPlayback(
  urls: RedgifsUrls,
  quality: "hd" | "sd" = "sd",
): string | null {
  if (quality === "sd") return urls.sd ?? urls.hd ?? null;
  return urls.hd ?? urls.sd ?? null;
}
