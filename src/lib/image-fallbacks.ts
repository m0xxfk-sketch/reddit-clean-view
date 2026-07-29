export {
  decodeHtmlEntities,
  imageLoadCandidates as imageCandidates,
  imageProxyUrl,
  isAllowedImageUrl,
  normalizeImageUrl,
} from "@/lib/image-url";

/** Adds a cache-busting param so a retry actually re-requests the asset. */
export function withRetryParam(url: string, attempt: number): string {
  if (attempt === 0) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_r=${attempt}`;
}
