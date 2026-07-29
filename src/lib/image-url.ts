const REDDIT_IMAGE_HOSTS = new Set([
  "i.redd.it",
  "preview.redd.it",
  "external-preview.redd.it",
  "i.imgur.com",
  "imgur.com",
]);

/** Decode HTML entities commonly leaked from RSS/JSON payloads. */
export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#32;/g, " ")
    .replace(/&amp;/g, "&");
}

/**
 * Normalize Reddit image URLs: fix entities and upgrade preview hosts to i.redd.it
 * so images load reliably (preview.redd.it thumbs often 403).
 */
export function normalizeImageUrl(raw: string): string {
  if (!raw) return raw;
  let url = decodeHtmlEntities(raw.trim());

  try {
    const parsed = new URL(url);
    const file = parsed.pathname.replace(/^\//, "");

    if (
      (parsed.hostname === "preview.redd.it" || parsed.hostname === "external-preview.redd.it") &&
      /\.(jpe?g|png|gif|webp)$/i.test(file)
    ) {
      return `https://i.redd.it/${file}`;
    }

    // Drop tiny thumbnail transforms — prefer full asset on i.redd.it
    if (parsed.hostname === "i.redd.it") {
      parsed.search = "";
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}

export function isAllowedImageUrl(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return REDDIT_IMAGE_HOSTS.has(host) || host.endsWith(".redd.it");
  } catch {
    return false;
  }
}

export function imageProxyUrl(raw: string): string {
  const normalized = normalizeImageUrl(raw);
  return `/api/public/image?url=${encodeURIComponent(normalized)}`;
}

/** Ordered sources to try when loading an image in the browser. */
export function imageLoadCandidates(raw: string): string[] {
  const out: string[] = [];
  const add = (u?: string | null) => {
    if (!u || out.includes(u)) return;
    out.push(u);
  };

  const normalized = normalizeImageUrl(raw);
  add(normalized);

  try {
    const parsed = new URL(normalized);
    const file = parsed.pathname.replace(/^\//, "");

    if (parsed.hostname === "i.redd.it") {
      add(`https://preview.redd.it/${file}?width=1080&auto=webp`);
    }

    if (parsed.search) add(`${parsed.origin}${parsed.pathname}`);
  } catch {
    // ignore
  }

  // Same-origin proxy — bypasses hotlink blocks on preview CDN
  if (isAllowedImageUrl(normalized)) add(imageProxyUrl(normalized));

  return out;
}
