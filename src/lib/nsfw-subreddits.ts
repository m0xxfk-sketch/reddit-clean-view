import type { FetchResult } from "@/lib/reddit";

export type NsfwCategory = "general" | "amateur" | "body-type" | "ethnicity" | "theme" | "couples";

export type NsfwSubreddit = {
  name: string;
  rank: number;
  category: NsfwCategory;
  label: string;
};

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
  { rank: 21, name: "GoneWildSmiles", category: "amateur", label: "GW Smiles" },
  { rank: 22, name: "Nudes", category: "general", label: "Nudes" },
  { rank: 23, name: "Ebony", category: "ethnicity", label: "Ebony" },
  { rank: 24, name: "IndianBabes", category: "ethnicity", label: "Indian" },
  { rank: 25, name: "GoneWildCouples", category: "couples", label: "GW Couples" },
  { rank: 26, name: "Swingersgw", category: "couples", label: "Swingers" },
  { rank: 27, name: "Hotwife", category: "couples", label: "Hotwife" },
  { rank: 28, name: "BiggerThanYouThought", category: "theme", label: "BTYT" },
  { rank: 29, name: "BreedingMaterial", category: "body-type", label: "Breeding Material" },
  { rank: 30, name: "FitNakedGirls", category: "body-type", label: "Fit Girls" },
] as const;

export const NSFW_GENRE_LABELS: Record<NsfwCategory, string> = {
  general: "General",
  amateur: "Amateur",
  "body-type": "Body Type",
  ethnicity: "Ethnicity",
  theme: "Themes",
  couples: "Couples",
};

const GENRE_ORDER: NsfwCategory[] = [
  "general",
  "amateur",
  "body-type",
  "ethnicity",
  "theme",
  "couples",
];

export type NsfwGenreGroup = {
  genre: NsfwCategory;
  label: string;
  subs: NsfwSubreddit[];
};

/** NSFW subs grouped by genre for dropdown menus. */
export function getNsfwSubredditsByGenre(): NsfwGenreGroup[] {
  return GENRE_ORDER.map((genre) => ({
    genre,
    label: NSFW_GENRE_LABELS[genre],
    subs: getNsfwTopSubreddits({ category: genre }),
  })).filter((g) => g.subs.length > 0);
}

export type NsfwTopListOptions = {
  limit?: number;
  category?: NsfwCategory;
};

export function getNsfwTopSubreddits(options: NsfwTopListOptions = {}): NsfwSubreddit[] {
  const { limit, category } = options;
  let list = [...NSFW_TOP_SUBREDDITS];
  if (category) list = list.filter((s) => s.category === category);
  list.sort((a, b) => a.rank - b.rank);
  if (limit != null && limit > 0) list = list.slice(0, limit);
  return list;
}

export type NsfwTopFeedResult = FetchResult & {
  sources: string[];
};

/** Fetches a throttled NSFW top mix from the server (one request, sequential Reddit calls). */
export async function fetchNsfwTopFeed(
  options: { subLimit?: number; imageLimit?: number } = {},
): Promise<NsfwTopFeedResult> {
  const params = new URLSearchParams({
    sort: "top",
    subLimit: String(options.subLimit ?? 6),
    imageLimit: String(options.imageLimit ?? 80),
  });

  const res = await fetch(`/api/public/reddit/mix?${params}`, {
    headers: { Accept: "application/json" },
  });

  const json = (await res.json()) as NsfwTopFeedResult & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Mix feed failed (${res.status}).`);

  return {
    items: json.items ?? [],
    after: json.after ?? null,
    sources: json.sources ?? [],
  };
}
