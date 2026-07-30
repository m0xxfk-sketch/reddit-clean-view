import { decodeHtmlEntities, normalizeImageUrl } from "@/lib/image-url";
export { isRedgifsUrl, extractRedgifsSlug } from "@/lib/redgifs-server";
import { isRedgifsUrl } from "@/lib/redgifs-server";

const VIDEO_HOSTS = new Set([
  "v.redd.it",
  "media.redgifs.com",
  "thumbs2.redgifs.com",
  "thumbs.redgifs.com",
]);

const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;

export function isDirectVideoUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (VIDEO_HOSTS.has(parsed.hostname.toLowerCase())) return true;
    return VIDEO_EXT.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isExternalVideoPage(raw: string): boolean {
  if (isRedgifsUrl(raw)) return true;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return host.includes("gfycat.com") || host.includes("imgur.com") && raw.includes(".gifv");
  } catch {
    return false;
  }
}

export function needsVideoResolve(raw: string): boolean {
  return isRedgifsUrl(raw) || isExternalVideoPage(raw);
}

export function isAllowedMediaUrl(raw: string): boolean {
  if (isDirectVideoUrl(raw)) return true;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return (
      host.endsWith(".redd.it") ||
      host === "i.imgur.com" ||
      host === "media.redgifs.com" ||
      host.endsWith(".redgifs.com")
    );
  } catch {
    return false;
  }
}

export function mediaProxyUrl(raw: string): string {
  return `/api/public/media?url=${encodeURIComponent(raw)}`;
}

export function resolveMediaUrl(raw: string): string {
  return `/api/public/media/resolve?url=${encodeURIComponent(raw)}`;
}

export function normalizePosterUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  return normalizeImageUrl(decodeHtmlEntities(raw));
}

/** Playback candidates for a resolved or direct video URL. */
export function videoLoadCandidates(raw: string): string[] {
  const out: string[] = [];
  const add = (u?: string | null) => {
    if (!u || out.includes(u)) return;
    out.push(u);
  };

  add(raw);
  if (isAllowedMediaUrl(raw)) add(mediaProxyUrl(raw));
  return out;
}
