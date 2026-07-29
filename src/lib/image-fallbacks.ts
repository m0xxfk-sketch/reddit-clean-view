/**
 * Reddit serves the same asset from several hosts, and any one of them can fail
 * transiently (expired preview signature, CDN hiccup, blocked host). Build an
 * ordered list of equivalent URLs to try before giving up on an image.
 */
export function imageCandidates(url: string): string[] {
  const out: string[] = [];
  const add = (u?: string | null) => {
    if (u && !out.includes(u)) out.push(u);
  };

  add(url);

  let parsed: URL | null = null;
  try {
    parsed = new URL(url, typeof window === "undefined" ? "https://reddit.com" : window.location.href);
  } catch {
    return out;
  }

  const file = parsed.pathname.replace(/^\//, "");

  if (parsed.hostname === "preview.redd.it" || parsed.hostname.endsWith("external-preview.redd.it")) {
    // Signed preview URLs expire; the raw asset does not.
    if (parsed.hostname === "preview.redd.it") add(`https://i.redd.it/${file}`);
    // Smaller, cheaper rendition of the same preview.
    const smaller = new URL(parsed.toString());
    smaller.searchParams.set("width", "1080");
    smaller.searchParams.set("auto", "webp");
    add(smaller.toString());
  }

  if (parsed.hostname === "i.redd.it") {
    add(`https://preview.redd.it/${file}?width=1080&auto=webp`);
  }

  // Last resort: drop query params entirely.
  if (parsed.search) add(`${parsed.origin}${parsed.pathname}`);

  return out;
}

/** Adds a cache-busting param so a retry actually re-requests the asset. */
export function withRetryParam(url: string, attempt: number): string {
  if (attempt === 0) return url;
  return `${url}${url.includes("?") ? "&" : "?"}_r=${attempt}`;
}