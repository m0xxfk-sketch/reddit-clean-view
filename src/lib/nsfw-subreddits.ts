import type { FetchResult } from "@/lib/reddit";

export type NsfwCategory =
  | "general"
  | "amateur"
  | "body-type"
  | "ethnicity"
  | "theme"
  | "couples"
  | "celeb"
  | "cosplay"
  | "alt";

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
  { rank: 31, name: "celebnsfw", category: "celeb", label: "Celeb NSFW" },
  { rank: 32, name: "Celebs", category: "celeb", label: "Celebs" },
  { rank: 33, name: "CelebHub", category: "celeb", label: "Celeb Hub" },
  { rank: 34, name: "celebsnaked", category: "celeb", label: "Celebs Naked" },
  { rank: 35, name: "CelebrityButts", category: "celeb", label: "Celebrity Butts" },
  { rank: 36, name: "WatchItForThePlot", category: "celeb", label: "Plot" },
  { rank: 37, name: "Ohlympics", category: "celeb", label: "Ohlympics" },
  { rank: 38, name: "NSFW_GIF", category: "general", label: "NSFW GIF" },
  { rank: 39, name: "adorableporn", category: "general", label: "Adorable" },
  { rank: 40, name: "Sexy", category: "general", label: "Sexy" },
  { rank: 41, name: "gonewildcurvy", category: "amateur", label: "GW Curvy" },
  { rank: 42, name: "VerifiedAmateurs", category: "amateur", label: "Verified" },
  { rank: 43, name: "workgonewild", category: "amateur", label: "Work GW" },
  { rank: 44, name: "gonewildcolor", category: "amateur", label: "GW Color" },
  { rank: 45, name: "Amateur", category: "amateur", label: "Amateur" },
  { rank: 46, name: "Slut", category: "amateur", label: "Slut" },
  { rank: 47, name: "bigboobs", category: "body-type", label: "Big Boobs" },
  { rank: 48, name: "smallboobs", category: "body-type", label: "Small Boobs" },
  { rank: 49, name: "TinyTits", category: "body-type", label: "Tiny Tits" },
  { rank: 50, name: "hugeboobs", category: "body-type", label: "Huge Boobs" },
  { rank: 51, name: "pawg", category: "body-type", label: "PAWG" },
  { rank: 52, name: "bubblebutt", category: "body-type", label: "Bubble Butt" },
  { rank: 53, name: "UnderwearGW", category: "body-type", label: "Underwear GW" },
  { rank: 54, name: "braless", category: "body-type", label: "Braless" },
  { rank: 55, name: "datgap", category: "body-type", label: "Dat Gap" },
  { rank: 56, name: "hipcleavage", category: "body-type", label: "Hip Cleavage" },
  { rank: 57, name: "legs", category: "body-type", label: "Legs" },
  { rank: 58, name: "palegirls", category: "ethnicity", label: "Pale Girls" },
  { rank: 59, name: "ginger", category: "ethnicity", label: "Ginger" },
  { rank: 60, name: "redheads", category: "ethnicity", label: "Redheads" },
  { rank: 61, name: "whitegirls", category: "ethnicity", label: "White Girls" },
  { rank: 62, name: "ArabGirls", category: "ethnicity", label: "Arab Girls" },
  { rank: 63, name: "EasternEuropeanGirls", category: "ethnicity", label: "Eastern European" },
  { rank: 64, name: "publicflashing", category: "theme", label: "Public Flashing" },
  { rank: 65, name: "FlashingGirls", category: "theme", label: "Flashing Girls" },
  { rank: 66, name: "girlsinyogapants", category: "theme", label: "Yoga Pants" },
  { rank: 67, name: "Upskirt", category: "theme", label: "Upskirt" },
  { rank: 68, name: "thong", category: "theme", label: "Thong" },
  { rank: 69, name: "SheLikesItRough", category: "theme", label: "Rough" },
  { rank: 70, name: "cumsluts", category: "theme", label: "Cumsluts" },
  { rank: 71, name: "grool", category: "theme", label: "Grool" },
  { rank: 72, name: "cuckold", category: "couples", label: "Cuckold" },
  { rank: 73, name: "wifesharing", category: "couples", label: "Wife Sharing" },
  { rank: 74, name: "WouldYouFuckMyWife", category: "couples", label: "WYFMW" },
  { rank: 75, name: "CelebrityPussy", category: "celeb", label: "Celebrity Pussy" },
  { rank: 76, name: "CelebSexScenes", category: "celeb", label: "Sex Scenes" },
  { rank: 77, name: "nsfwcosplay", category: "cosplay", label: "NSFW Cosplay" },
  { rank: 78, name: "cosplaygirls", category: "cosplay", label: "Cosplay Girls" },
  { rank: 79, name: "CosplayBoobs", category: "cosplay", label: "Cosplay Boobs" },
  { rank: 80, name: "cosplaybabes", category: "cosplay", label: "Cosplay Babes" },
  { rank: 81, name: "RealAhegao", category: "cosplay", label: "Ahegao" },
  { rank: 82, name: "lewd", category: "cosplay", label: "Lewd" },
  { rank: 83, name: "nsfwhardcore", category: "general", label: "Hardcore" },
  { rank: 84, name: "randomsexiness", category: "general", label: "Random Sexiness" },
  { rank: 85, name: "trashyboners", category: "general", label: "Trashy" },
  { rank: 86, name: "TooCuteForPorn", category: "general", label: "Too Cute" },
  { rank: 87, name: "HappyEmbarrassedGirls", category: "general", label: "Happy & Embarrassed" },
  { rank: 88, name: "GirlsFinishingTheJob", category: "general", label: "Finishing" },
  { rank: 89, name: "gonewild18", category: "amateur", label: "GW 18" },
  { rank: 90, name: "gonewildplus", category: "amateur", label: "GW Plus" },
  { rank: 91, name: "GoneWildTube", category: "amateur", label: "GW Tube" },
  { rank: 92, name: "GoneWildScrubs", category: "amateur", label: "GW Scrubs" },
  { rank: 93, name: "Asstastic", category: "body-type", label: "Asstastic" },
  { rank: 94, name: "Stacked", category: "body-type", label: "Stacked" },
  { rank: 95, name: "homegrowntits", category: "body-type", label: "Homegrown" },
  { rank: 96, name: "torpedotits", category: "body-type", label: "Torpedo Tits" },
  { rank: 97, name: "ghostnipples", category: "body-type", label: "Ghost Nipples" },
  { rank: 98, name: "aa_cups", category: "body-type", label: "AA Cups" },
  { rank: 99, name: "FortyFiveFiftyFive", category: "body-type", label: "45/55" },
  { rank: 100, name: "MiddleEasternHotties", category: "ethnicity", label: "Middle Eastern" },
  { rank: 101, name: "AfriGoneWild", category: "ethnicity", label: "Afri GW" },
  { rank: 102, name: "LatinasGW", category: "ethnicity", label: "Latinas GW" },
  { rank: 103, name: "JewishBabes", category: "ethnicity", label: "Jewish" },
  { rank: 104, name: "Mexicana", category: "ethnicity", label: "Mexicana" },
  { rank: 105, name: "dressedandundressed", category: "theme", label: "Dressed & Undressed" },
  { rank: 106, name: "stripgirls", category: "theme", label: "Strip" },
  { rank: 107, name: "FaceAndTits", category: "theme", label: "Face & Tits" },
  { rank: 108, name: "cleavage", category: "theme", label: "Cleavage" },
  { rank: 109, name: "GirlsInLeggings", category: "theme", label: "Leggings" },
  { rank: 110, name: "pussy", category: "theme", label: "Pussy" },
  { rank: 111, name: "ButtsAndBareFeet", category: "theme", label: "Butts & Feet" },
  { rank: 112, name: "Threesome", category: "couples", label: "Threesome" },
  { rank: 113, name: "Polyamory", category: "couples", label: "Polyamory" },
  { rank: 114, name: "HotWifeLifestyle", category: "couples", label: "Hotwife Life" },
  { rank: 115, name: "CelebrityNipples", category: "celeb", label: "Celebrity Nipples" },
  { rank: 116, name: "CelebsBR", category: "celeb", label: "Celebs BR" },
  { rank: 117, name: "rule34", category: "cosplay", label: "Rule 34" },
  { rank: 118, name: "gothsluts", category: "alt", label: "Goth Sluts" },
  { rank: 119, name: "altgonewild", category: "alt", label: "Alt GW" },
  { rank: 120, name: "EmoGirls", category: "alt", label: "Emo Girls" },
  { rank: 121, name: "PunkGirls", category: "alt", label: "Punk Girls" },
  { rank: 122, name: "HotTubGirls", category: "alt", label: "Hot Tub" },
  { rank: 123, name: "TattoosPorn", category: "alt", label: "Tattoos" },
  { rank: 124, name: "PiercedNSFW", category: "alt", label: "Pierced" },
  { rank: 125, name: "GoneWildTrans", category: "alt", label: "Trans GW" },
  { rank: 126, name: "trapsgonewild", category: "alt", label: "Traps GW" },
  { rank: 127, name: "FemBoys", category: "alt", label: "Femboys" },
] as const;

export const NSFW_GENRE_LABELS: Record<NsfwCategory, string> = {
  general: "General",
  amateur: "Amateur",
  "body-type": "Body Type",
  ethnicity: "Ethnicity",
  theme: "Themes",
  couples: "Couples",
  celeb: "Celebs",
  cosplay: "Cosplay & Hentai",
  alt: "Alt & Niche",
};

const GENRE_ORDER: NsfwCategory[] = [
  "general",
  "amateur",
  "body-type",
  "ethnicity",
  "theme",
  "couples",
  "celeb",
  "cosplay",
  "alt",
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

/** Pick one random sub per genre for discover mode, avoiding recent genres. */
export function pickDiscoverSubs(limit: number, excludeGenres: string[] = []): string[] {
  const groups = getNsfwSubredditsByGenre().filter((g) => !excludeGenres.includes(g.genre));
  const shuffled = [...groups].sort(() => Math.random() - 0.5);
  const picked: string[] = [];

  for (const group of shuffled) {
    if (picked.length >= limit) break;
    const subs = [...group.subs].sort(() => Math.random() - 0.5);
    if (subs[0]) picked.push(subs[0].name);
  }

  if (picked.length < limit) {
    const pool = [...NSFW_TOP_SUBREDDITS]
      .sort(() => Math.random() - 0.5)
      .map((s) => s.name)
      .filter((n) => !picked.includes(n));
    picked.push(...pool.slice(0, limit - picked.length));
  }

  return picked.slice(0, limit);
}

export type NsfwTopFeedResult = FetchResult & {
  sources: string[];
};

export type MixFeedOptions = {
  subLimit?: number;
  imageLimit?: number;
  subs?: string[];
  discover?: boolean;
  excludeGenres?: string[];
};

/** Mix feed — default top subs, custom subs, or discover shuffle. */
export async function fetchMixFeed(options: MixFeedOptions = {}): Promise<NsfwTopFeedResult> {
  const params = new URLSearchParams({
    sort: "top",
    subLimit: String(options.subLimit ?? 4),
    imageLimit: String(options.imageLimit ?? 60),
  });
  if (options.subs?.length) params.set("subs", options.subs.join(","));
  if (options.discover) params.set("discover", "1");
  if (options.excludeGenres?.length) params.set("exclude", options.excludeGenres.join(","));

  const cacheKey = `peek:mix:v2:${params.toString()}`;
  const cached = readMixCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(`/api/public/reddit/mix?${params}`, {
    headers: { Accept: "application/json" },
  });

  const json = (await res.json()) as NsfwTopFeedResult & { error?: string };
  if (!res.ok) {
    const stale = readMixCache(cacheKey, true);
    if (stale?.items.length) return stale;
    throw new Error(json.error ?? `Mix feed failed (${res.status}).`);
  }

  const result: NsfwTopFeedResult = {
    items: json.items ?? [],
    after: json.after ?? null,
    sources: json.sources ?? [],
  };
  writeMixCache(cacheKey, result);
  return result;
}

const MIX_CACHE_TTL = 15 * 60 * 1000;
const MIX_STALE_TTL = 60 * 60 * 1000;

function readMixCache(key: string, allowStale = false): NsfwTopFeedResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: NsfwTopFeedResult };
    const age = Date.now() - (parsed?.at ?? 0);
    if (!parsed?.at || age > MIX_STALE_TTL) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    if (!allowStale && age > MIX_CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeMixCache(key: string, data: NsfwTopFeedResult) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // best-effort
  }
}

/** @deprecated Use fetchMixFeed */
export async function fetchNsfwTopFeed(
  options: { subLimit?: number; imageLimit?: number } = {},
): Promise<NsfwTopFeedResult> {
  return fetchMixFeed(options);
}
