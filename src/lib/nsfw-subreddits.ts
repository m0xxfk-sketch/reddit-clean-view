import { fetchSubredditImages, type FetchResult, type RedditImage } from "@/lib/reddit";

export type NsfwCategory = "general" | "amateur" | "body-type" | "ethnicity" | "theme" | "couples";

export type NsfwSubreddit = {
  /** Subreddit name without r/ prefix */
  name: string;
  /** 1 = most popular in this curated list */
  rank: number;
  category: NsfwCategory;
  /** Short label for UI chips */
  label: string;
};

/** Curated top NSFW image subreddits, ordered by typical popularity. */
export const NSFW_TOP_SUBREDDITS: readonly NsfwSubreddit[] = [
  { rank: 1, name: "gonewild", category: "amateur", label: "GoneWild" },
  { rank: 2, name: "RealGirls", category: "amateur", label: "Real Girls" },
  { rank: 3, name: "nsfw", category: "general", label: "NSFW" },
  { rank: 4, name: "LegalTeens", category: "body-type", label: "Legal Teens" },
  { rank: 5, name: "BustyPetite", category: "body-type", label: "Busty Petite" },
  { rank: 6, name: "ass", category: "body-type", label: "Ass" },
  { rank: 7, name: "Boobs", category: "body-type", label: "Boobs" },
  { rank: 8, name: "collegesluts", category: "amateur", label: "College" },
  { rank: 9, name: "milf", category: "body-type", label: "MILF" },
  { rank: 10, name: "latinas", category: "ethnicity", label: "Latinas" },
  { rank: 11, name: "AsiansGoneWild", category: "ethnicity", label: "Asian GW" },
  { rank: 12, name: "curvy", category: "body-type", label: "Curvy" },
  { rank: 13, name: "thick", category: "body-type", label: "Thick" },
  { rank: 14, name: "GodPussy", category: "body-type", label: "God Pussy" },
  { rank: 15, name: "bodyperfection", category: "body-type", label: "Body Perfection" },
  { rank: 16, name: "OnOff", category: "theme", label: "On/Off" },
  { rank: 17, name: "holdthemoan", category: "theme", label: "Hold the Moan" },
  { rank: 18, name: "gonewild30plus", category: "amateur", label: "GW 30+" },
  { rank: 19, name: "petitegonewild", category: "body-type", label: "Petite GW" },
  { rank: 20, name: "porninfifteenseconds", category: "general", label: "GIFs" },
] as const;

export type NsfwTopListOptions = {
  /** Max entries to return (default: all) */
  limit?: number;
  /** Filter to a single category */
  category?: NsfwCategory;
};

/** Returns the curated NSFW top subreddit list, optionally filtered and truncated. */
export function getNsfwTopSubreddits(options: NsfwTopListOptions = {}): NsfwSubreddit[] {
  const { limit, category } = options;
  let list = [...NSFW_TOP_SUBREDDITS];
  if (category) list = list.filter((s) => s.category === category);
  list.sort((a, b) => a.rank - b.rank);
  if (limit != null && limit > 0) list = list.slice(0, limit);
  return list;
}

export type NsfwTopFeedOptions = {
  /** How many subs from the top list to pull from (default: 8) */
  subLimit?: number;
  /** Max images to return after merging (default: 80) */
  imageLimit?: number;
  /** Only include subs from this category */
  category?: NsfwCategory;
};

export type NsfwTopFeedResult = FetchResult & {
  /** Subs that contributed at least one image */
  sources: string[];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetches top posts from the highest-ranked NSFW subs and merges them into one
 * feed sorted by score (highest first).
 */
export async function fetchNsfwTopFeed(
  options: NsfwTopFeedOptions = {},
): Promise<NsfwTopFeedResult> {
  const { subLimit = 8, imageLimit = 80, category } = options;
  const subs = getNsfwTopSubreddits({ limit: subLimit, category });

  const batches = await Promise.all(
    subs.map(async (sub, index) => {
      // Stagger requests slightly to avoid hammering our proxy
      if (index > 0) await sleep(index * 120);
      try {
        const result = await fetchSubredditImages({ subreddit: sub.name, sort: "top" });
        return { sub: sub.name, items: result.items };
      } catch {
        return { sub: sub.name, items: [] as RedditImage[] };
      }
    }),
  );

  const sources = batches.filter((b) => b.items.length > 0).map((b) => b.sub);
  const merged = batches
    .flatMap((b) => b.items)
    .sort((a, b) => b.score - a.score)
    .slice(0, imageLimit);

  return { items: merged, after: null, sources };
}
