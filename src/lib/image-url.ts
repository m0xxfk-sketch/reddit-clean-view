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
 * Normalize Reddit image URLs: fix entities and upgrade native preview hosts to
 * i.redd.it. external-preview.redd.it must stay as-is — those paths do not
 * exist on i.redd.it and return Reddit's "deleted image" placeholder.
 */
export function normalizeImageUrl(raw: string): string {
  if (!raw) return raw;
  const url = decodeHtmlEntities(raw.trim());

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const file = parsed.pathname.replace(/^\//, "");

    if (host === "external-preview.redd.it") {
      return url;
    }

    if (host === "preview.redd.it" && /\.(jpe?g|png|gif|webp)$/i.test(file)) {
      return `https://i.redd.it/${file}`;
    }

    if (host === "i.redd.it") {
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
  return `/api/public/image?url=${encodeURIComponent(decodeHtmlEntities(raw.trim()))}`;
}

/** Ordered sources to try when loading an image in the browser. */
export function imageLoadCandidates(raw: string): string[] {
  const out: string[] = [];
  const add = (u?: string | null) => {
    if (!u || out.includes(u)) return;
    out.push(u);
  };

  const decoded = decodeHtmlEntities(raw.trim());
  add(decoded);

  const normalized = normalizeImageUrl(decoded);
  if (normalized !== decoded) add(normalized);

  try {
    const parsed = new URL(decoded);
    const host = parsed.hostname.toLowerCase();
    const file = parsed.pathname.replace(/^\//, "");

    if (host === "i.redd.it") {
      add(`https://preview.redd.it/${file}?width=1080&auto=webp`);
    }

    if (host === "external-preview.redd.it" && parsed.search) {
      add(`${parsed.origin}${parsed.pathname}${parsed.search}`);
    }
  } catch {
    // ignore
  }

  if (isAllowedImageUrl(decoded)) add(imageProxyUrl(decoded));

  return out;
}
