type ResolveResult = { url: string; poster?: string | null };

const CACHE_PREFIX = "peek:resolve:v1:";
const CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_CONCURRENT = 6;

const memory = new Map<string, ResolveResult>();
const inflight = new Map<string, Promise<ResolveResult | null>>();
let active = 0;
const highWaiters: Array<() => void> = [];
const normalWaiters: Array<() => void> = [];

function cacheKey(url: string, quality: string) {
  return `${url}|${quality}`;
}

function readStorage(key: string): ResolveResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: ResolveResult };
    if (Date.now() - parsed.at > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeStorage(key: string, data: ResolveResult) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // best-effort
  }
}

async function acquireSlot(priority = true) {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => {
    (priority ? highWaiters : normalWaiters).push(resolve);
  });
  active++;
}

function releaseSlot() {
  active--;
  const next = highWaiters.shift() ?? normalWaiters.shift();
  if (next) next();
}

async function fetchResolve(url: string, quality: "hd" | "sd", attempt = 0): Promise<ResolveResult | null> {
  const params = new URLSearchParams({ url, quality });
  try {
    const res = await fetch(`/api/public/media/resolve?${params}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        await sleep(600 * 2 ** attempt + Math.random() * 300);
        return fetchResolve(url, quality, attempt + 1);
      }
      return null;
    }
    const json = (await res.json()) as { url?: string; poster?: string | null };
    if (!json.url) return null;
    return { url: json.url, poster: json.poster ?? null };
  } catch {
    if (attempt < 2) {
      await sleep(600 * 2 ** attempt);
      return fetchResolve(url, quality, attempt + 1);
    }
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ResolveOptions = {
  /** Visible/on-screen items should use high priority (default true). */
  priority?: boolean;
};

/** Resolve Redgifs/external video URLs with cache, dedup, and concurrency limits. */
export async function resolveVideoUrl(
  url: string,
  quality: "hd" | "sd" = "sd",
  options: ResolveOptions = {},
): Promise<ResolveResult | null> {
  const priority = options.priority !== false;
  const key = cacheKey(url, quality);

  const mem = memory.get(key);
  if (mem) return mem;

  const stored = readStorage(key);
  if (stored) {
    memory.set(key, stored);
    return stored;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    await acquireSlot(priority);
    try {
      const result = await fetchResolve(url, quality);
      if (result) {
        memory.set(key, result);
        writeStorage(key, result);
      }
      return result;
    } finally {
      inflight.delete(key);
      releaseSlot();
    }
  })();

  inflight.set(key, task);
  return task;
}

export function isAnimatedGifUrl(raw: string): boolean {
  try {
    return /\.gif(\?.*)?$/i.test(new URL(raw).pathname);
  } catch {
    return /\.gif(\?.*)?$/i.test(raw);
  }
}
