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

/** Curated NSFW catalog — dead/banned subs removed Jul 2026; verified via /api/public/reddit. */
export const NSFW_TOP_SUBREDDITS: readonly NsfwSubreddit[] = [
  // General & GIFs
  { rank: 1, name: "gonewild", category: "general", label: "GoneWild" },
  { rank: 2, name: "nsfw", category: "general", label: "NSFW" },
  { rank: 3, name: "RealGirls", category: "general", label: "Real Girls" },
  { rank: 4, name: "Nudes", category: "general", label: "Nudes" },
  { rank: 5, name: "NSFW_GIF", category: "general", label: "NSFW GIF" },
  { rank: 6, name: "nsfw_gifs", category: "general", label: "NSFW GIFs" },
  { rank: 7, name: "porninfifteenseconds", category: "general", label: "15 Sec Porn" },
  { rank: 8, name: "60fpsporn", category: "general", label: "60 FPS Porn" },
  { rank: 9, name: "NSFW_HTML5", category: "general", label: "HTML5" },
  { rank: 10, name: "adultgifs", category: "general", label: "Adult GIFs" },
  { rank: 11, name: "nsfwhardcore", category: "general", label: "Hardcore" },
  { rank: 12, name: "hardcore", category: "general", label: "Hardcore Porn" },
  { rank: 13, name: "passionx", category: "general", label: "Passion" },
  { rank: 14, name: "nsfw_videos", category: "general", label: "NSFW Videos" },
  { rank: 15, name: "adorableporn", category: "general", label: "Adorable" },
  { rank: 16, name: "TooCuteForPorn", category: "general", label: "Too Cute" },
  { rank: 17, name: "HappyEmbarrassedGirls", category: "general", label: "Happy & Embarrassed" },
  { rank: 18, name: "GirlsFinishingTheJob", category: "general", label: "Finishing" },
  { rank: 19, name: "Sexy", category: "general", label: "Sexy" },
  { rank: 20, name: "MotionTrackedPorn", category: "general", label: "Motion Tracked" },

  // Amateur
  { rank: 21, name: "Amateur", category: "amateur", label: "Amateur" },
  { rank: 22, name: "VerifiedAmateurs", category: "amateur", label: "Verified" },
  { rank: 23, name: "homemadexxx", category: "amateur", label: "Homemade XXX" },
  { rank: 24, name: "homemadensfw", category: "amateur", label: "Homemade NSFW" },
  { rank: 25, name: "RealHomePorn", category: "amateur", label: "Real Home Porn" },
  { rank: 26, name: "AmateurPorn", category: "amateur", label: "Amateur Porn" },
  { rank: 27, name: "HomemadeNSFW", category: "amateur", label: "Homemade" },
  { rank: 28, name: "AmateurArchives", category: "amateur", label: "Amateur Archives" },
  { rank: 29, name: "collegesluts", category: "amateur", label: "College" },
  { rank: 30, name: "CollegeAmateurs", category: "amateur", label: "College Amateurs" },
  { rank: 31, name: "CollegeSluts", category: "amateur", label: "College Sluts" },
  { rank: 32, name: "LegalTeens", category: "amateur", label: "Legal Teens" },
  { rank: 33, name: "LegalTeensGW", category: "amateur", label: "Legal Teens GW" },
  { rank: 34, name: "gonewild18", category: "amateur", label: "GW 18" },
  { rank: 35, name: "gonewild30plus", category: "amateur", label: "GW 30+" },
  { rank: 36, name: "gonewildplus", category: "amateur", label: "GW Plus" },
  { rank: 37, name: "GoneWildSmiles", category: "amateur", label: "GW Smiles" },
  { rank: 38, name: "GoneWildCouples", category: "amateur", label: "GW Couples" },
  { rank: 39, name: "GoneWildTube", category: "amateur", label: "GW Tube" },
  { rank: 40, name: "GoneWildScrubs", category: "amateur", label: "GW Scrubs" },
  { rank: 41, name: "gonewildcurvy", category: "amateur", label: "GW Curvy" },
  { rank: 42, name: "workgonewild", category: "amateur", label: "Work GW" },
  { rank: 43, name: "petitegonewild", category: "amateur", label: "Petite GW" },
  { rank: 44, name: "Slut", category: "amateur", label: "Slut" },
  { rank: 45, name: "NormalNudes", category: "amateur", label: "Normal Nudes" },
  { rank: 46, name: "Nude_Selfie", category: "amateur", label: "Nude Selfie" },
  { rank: 47, name: "MirrorSelfie", category: "amateur", label: "Mirror Selfie" },
  { rank: 48, name: "OnlyFans101", category: "amateur", label: "OnlyFans" },
  { rank: 49, name: "OnlyFansPetite", category: "amateur", label: "OF Petite" },
  { rank: 50, name: "OnlyFansFaces", category: "amateur", label: "OF Faces" },

  // Body type
  { rank: 51, name: "BustyPetite", category: "body-type", label: "Busty Petite" },
  { rank: 52, name: "ass", category: "body-type", label: "Ass" },
  { rank: 53, name: "Boobs", category: "body-type", label: "Boobs" },
  { rank: 54, name: "milf", category: "body-type", label: "MILF" },
  { rank: 55, name: "maturemilf", category: "body-type", label: "Mature MILF" },
  { rank: 56, name: "realmilf", category: "body-type", label: "Real MILF" },
  { rank: 57, name: "obsf", category: "body-type", label: "OBSF" },
  { rank: 58, name: "Gilf", category: "body-type", label: "GILF" },
  { rank: 59, name: "Milfie", category: "body-type", label: "Milfie" },
  { rank: 60, name: "40plusGoneWild", category: "body-type", label: "40+ GW" },
  { rank: 61, name: "Cougars", category: "body-type", label: "Cougars" },
  { rank: 62, name: "curvy", category: "body-type", label: "Curvy" },
  { rank: 63, name: "thick", category: "body-type", label: "Thick" },
  { rank: 64, name: "ThickThighs", category: "body-type", label: "Thick Thighs" },
  { rank: 65, name: "bodyperfection", category: "body-type", label: "Body Perfection" },
  { rank: 66, name: "FitNakedGirls", category: "body-type", label: "Fit Girls" },
  { rank: 67, name: "fitgirls", category: "body-type", label: "Fit Girls 2" },
  { rank: 68, name: "AthleticGirls", category: "body-type", label: "Athletic" },
  { rank: 69, name: "BreedingMaterial", category: "body-type", label: "Breeding Material" },
  { rank: 70, name: "smallboobs", category: "body-type", label: "Small Boobs" },
  { rank: 71, name: "TinyTits", category: "body-type", label: "Tiny Tits" },
  { rank: 72, name: "hugeboobs", category: "body-type", label: "Huge Boobs" },
  { rank: 73, name: "TittyDrop", category: "body-type", label: "Titty Drop" },
  { rank: 74, name: "Stacked", category: "body-type", label: "Stacked" },
  { rank: 75, name: "homegrowntits", category: "body-type", label: "Homegrown" },
  { rank: 76, name: "torpedotits", category: "body-type", label: "Torpedo Tits" },
  { rank: 77, name: "ghostnipples", category: "body-type", label: "Ghost Nipples" },
  { rank: 78, name: "aa_cups", category: "body-type", label: "AA Cups" },
  { rank: 79, name: "FortyFiveFiftyFive", category: "body-type", label: "45/55" },
  { rank: 80, name: "pawg", category: "body-type", label: "PAWG" },
  { rank: 81, name: "bigasses", category: "body-type", label: "Big Asses" },
  { rank: 82, name: "booty_queens", category: "body-type", label: "Booty Queens" },
  { rank: 83, name: "Asstastic", category: "body-type", label: "Asstastic" },
  { rank: 84, name: "UnderwearGW", category: "body-type", label: "Underwear GW" },
  { rank: 85, name: "braless", category: "body-type", label: "Braless" },
  { rank: 86, name: "BralessGW", category: "body-type", label: "Braless GW" },
  { rank: 87, name: "datgap", category: "body-type", label: "Dat Gap" },
  { rank: 88, name: "hipcleavage", category: "body-type", label: "Hip Cleavage" },
  { rank: 89, name: "legs", category: "body-type", label: "Legs" },
  { rank: 90, name: "dirtysmall", category: "body-type", label: "Dirty Small" },
  { rank: 91, name: "xsmallgirls", category: "body-type", label: "XSmall Girls" },
  { rank: 92, name: "LabiaGW", category: "body-type", label: "Labia GW" },
  { rank: 93, name: "Innie", category: "body-type", label: "Innie" },
  { rank: 94, name: "AreolasGW", category: "body-type", label: "Areolas" },
  { rank: 95, name: "Underboob", category: "body-type", label: "Underboob" },
  { rank: 96, name: "SideBoob", category: "body-type", label: "Side Boob" },

  // Ethnicity
  { rank: 97, name: "latinas", category: "ethnicity", label: "Latinas" },
  { rank: 98, name: "LatinasGW", category: "ethnicity", label: "Latinas GW" },
  { rank: 99, name: "Mexicana", category: "ethnicity", label: "Mexicana" },
  { rank: 100, name: "Colombianas", category: "ethnicity", label: "Colombianas" },
  { rank: 101, name: "BrazilianNSFW", category: "ethnicity", label: "Brazilian" },
  { rank: 102, name: "AsiansGoneWild", category: "ethnicity", label: "Asian GW" },
  { rank: 103, name: "AsianHotties", category: "ethnicity", label: "Asian Hotties" },
  { rank: 104, name: "juicyasians", category: "ethnicity", label: "Juicy Asians" },
  { rank: 105, name: "AsianNSFW", category: "ethnicity", label: "Asian NSFW" },
  { rank: 106, name: "nextdoorasians", category: "ethnicity", label: "Next Door Asian" },
  { rank: 107, name: "AsianPorn", category: "ethnicity", label: "Asian Porn" },
  { rank: 108, name: "Ebony", category: "ethnicity", label: "Ebony" },
  { rank: 109, name: "DarkAngels", category: "ethnicity", label: "Dark Angels" },
  { rank: 110, name: "WomenOfColor", category: "ethnicity", label: "Women of Color" },
  { rank: 111, name: "AfriGoneWild", category: "ethnicity", label: "Afri GW" },
  { rank: 112, name: "IndianBabes", category: "ethnicity", label: "Indian" },
  { rank: 113, name: "IndianGirls", category: "ethnicity", label: "Indian Girls" },
  { rank: 114, name: "DesiBoners", category: "ethnicity", label: "Desi" },
  { rank: 115, name: "BollywoodNSFW", category: "ethnicity", label: "Bollywood" },
  { rank: 116, name: "PersianGirls", category: "ethnicity", label: "Persian Girls" },
  { rank: 117, name: "PersianBabes", category: "ethnicity", label: "Persian Babes" },
  { rank: 118, name: "IsraeliGirls", category: "ethnicity", label: "Israeli Girls" },
  { rank: 119, name: "TurkishGirls", category: "ethnicity", label: "Turkish Girls" },
  { rank: 120, name: "RussianGirls", category: "ethnicity", label: "Russian Girls" },
  { rank: 121, name: "UkrainianGirls", category: "ethnicity", label: "Ukrainian Girls" },
  { rank: 122, name: "RomanianGirls", category: "ethnicity", label: "Romanian Girls" },
  { rank: 123, name: "PolishGirls", category: "ethnicity", label: "Polish Girls" },
  { rank: 124, name: "palegirls", category: "ethnicity", label: "Pale Girls" },
  { rank: 125, name: "PaleGirls", category: "ethnicity", label: "Pale Girls 2" },
  { rank: 126, name: "ginger", category: "ethnicity", label: "Ginger" },
  { rank: 127, name: "redheads", category: "ethnicity", label: "Redheads" },
  { rank: 128, name: "RedheadGirls", category: "ethnicity", label: "Redhead Girls" },
  { rank: 129, name: "whitegirls", category: "ethnicity", label: "White Girls" },
  { rank: 130, name: "JewishBabes", category: "ethnicity", label: "Jewish" },
  { rank: 131, name: "JewishBabesGW", category: "ethnicity", label: "Jewish GW" },

  // Themes
  { rank: 132, name: "OnOff", category: "theme", label: "On/Off" },
  { rank: 133, name: "dressedandundressed", category: "theme", label: "Dressed & Undressed" },
  { rank: 134, name: "BeforeAndAfter", category: "theme", label: "Before & After" },
  { rank: 135, name: "ClothedAndNaked", category: "theme", label: "Clothed & Naked" },
  { rank: 136, name: "Striptease", category: "theme", label: "Striptease" },
  { rank: 137, name: "stripgirls", category: "theme", label: "Strip" },
  { rank: 138, name: "holdthemoan", category: "theme", label: "Hold the Moan" },
  { rank: 139, name: "publicflashing", category: "theme", label: "Public Flashing" },
  { rank: 140, name: "FlashingGirls", category: "theme", label: "Flashing Girls" },
  { rank: 141, name: "FlashingAndFlaunting", category: "theme", label: "Flashing & Flaunting" },
  { rank: 142, name: "PublicSexPorn", category: "theme", label: "Public Sex" },
  { rank: 143, name: "NSFW_Outdoors", category: "theme", label: "Outdoors" },
  { rank: 144, name: "girlsinyogapants", category: "theme", label: "Yoga Pants" },
  { rank: 145, name: "YogaPants", category: "theme", label: "Yoga Pants 2" },
  { rank: 146, name: "GirlsInLeggings", category: "theme", label: "Leggings" },
  { rank: 147, name: "Upskirt", category: "theme", label: "Upskirt" },
  { rank: 148, name: "UpskirtPanties", category: "theme", label: "Upskirt Panties" },
  { rank: 149, name: "thong", category: "theme", label: "Thong" },
  { rank: 150, name: "AssholeBehindThong", category: "theme", label: "Ass Behind Thong" },
  { rank: 151, name: "LingerieGW", category: "theme", label: "Lingerie GW" },
  { rank: 152, name: "lingerie", category: "theme", label: "Lingerie" },
  { rank: 153, name: "PantyPeel", category: "theme", label: "Panty Peel" },
  { rank: 154, name: "PantiesToTheSide", category: "theme", label: "Panties Aside" },
  { rank: 155, name: "cleavage", category: "theme", label: "Cleavage" },
  { rank: 156, name: "FaceAndTits", category: "theme", label: "Face & Tits" },
  { rank: 157, name: "pussy", category: "theme", label: "Pussy" },
  { rank: 158, name: "Asshole", category: "theme", label: "Asshole" },
  { rank: 159, name: "assholegonewild", category: "theme", label: "Asshole GW" },
  { rank: 160, name: "SpreadEm", category: "theme", label: "Spread Em" },
  { rank: 161, name: "Presenting", category: "theme", label: "Presenting" },
  { rank: 162, name: "ButtsAndBareFeet", category: "theme", label: "Butts & Feet" },
  { rank: 163, name: "Feet_NSFW", category: "theme", label: "Feet NSFW" },
  { rank: 164, name: "FootFetish", category: "theme", label: "Foot Fetish" },
  { rank: 165, name: "Blowjobs", category: "theme", label: "Blowjobs" },
  { rank: 166, name: "deepthroat", category: "theme", label: "Deepthroat" },
  { rank: 167, name: "FaceFuck", category: "theme", label: "Face Fuck" },
  { rank: 168, name: "OralCreampie", category: "theme", label: "Oral Creampie" },
  { rank: 169, name: "Throatpies", category: "theme", label: "Throatpies" },
  { rank: 170, name: "Facials", category: "theme", label: "Facials" },
  { rank: 171, name: "FacialFun", category: "theme", label: "Facial Fun" },
  { rank: 172, name: "cumsluts", category: "theme", label: "Cumsluts" },
  { rank: 173, name: "amateurcumsluts", category: "theme", label: "Amateur Cumsluts" },
  { rank: 174, name: "creampies", category: "theme", label: "Creampies" },
  { rank: 175, name: "CumInside", category: "theme", label: "Cum Inside" },
  { rank: 176, name: "impregnation", category: "theme", label: "Impregnation" },
  { rank: 177, name: "BodyShots", category: "theme", label: "Body Shots" },
  { rank: 178, name: "anal", category: "theme", label: "Anal" },
  { rank: 179, name: "ProneBone", category: "theme", label: "Prone Bone" },
  { rank: 180, name: "Doggystyle_NSFW", category: "theme", label: "Doggystyle" },
  { rank: 181, name: "SheFucksHim", category: "theme", label: "She Fucks Him" },
  { rank: 182, name: "GirlsOnTop", category: "theme", label: "Girls On Top" },
  { rank: 183, name: "SheLikesItRough", category: "theme", label: "Rough" },
  { rank: 184, name: "RoughPorn", category: "theme", label: "Rough Porn" },
  { rank: 185, name: "BDSM", category: "theme", label: "BDSM" },
  { rank: 186, name: "Bondage", category: "theme", label: "Bondage" },
  { rank: 187, name: "collared", category: "theme", label: "Collared" },
  { rank: 188, name: "FreeUse", category: "theme", label: "Free Use" },
  { rank: 189, name: "UseHer", category: "theme", label: "Use Her" },
  { rank: 190, name: "FreeUseMilf", category: "theme", label: "Free Use MILF" },
  { rank: 191, name: "lesbians", category: "theme", label: "Lesbians" },
  { rank: 192, name: "quiver", category: "theme", label: "Quiver" },
  { rank: 193, name: "gettingherselfoff", category: "theme", label: "Getting Off" },
  { rank: 194, name: "GirlsMasturbating", category: "theme", label: "Masturbating" },
  { rank: 195, name: "JOI", category: "theme", label: "JOI" },
  { rank: 196, name: "Squirting", category: "theme", label: "Squirting" },
  { rank: 197, name: "grool", category: "theme", label: "Grool" },
  { rank: 198, name: "WetPussys", category: "theme", label: "Wet Pussy" },
  { rank: 199, name: "PussyGripping", category: "theme", label: "Pussy Grip" },
  { rank: 200, name: "BiggerThanYouThought", category: "theme", label: "BTYT" },
  { rank: 201, name: "SchoolGirlSkirts", category: "theme", label: "Schoolgirl" },
  { rank: 202, name: "Bikini", category: "theme", label: "Bikini" },
  { rank: 203, name: "MicroBikini", category: "theme", label: "Micro Bikini" },
  { rank: 204, name: "BikiniBodies", category: "theme", label: "Bikini Bodies" },
  { rank: 205, name: "BeachGirls", category: "theme", label: "Beach Girls" },
  { rank: 206, name: "PoolGirls", category: "theme", label: "Pool Girls" },
  { rank: 207, name: "ShowerSex", category: "theme", label: "Shower Sex" },
  { rank: 208, name: "BathGW", category: "theme", label: "Bath GW" },
  { rank: 209, name: "ChangingRooms", category: "theme", label: "Changing Room" },
  { rank: 210, name: "LockerRoom", category: "theme", label: "Locker Room" },

  // Couples
  { rank: 211, name: "Swingersgw", category: "couples", label: "Swingers" },
  { rank: 212, name: "Hotwife", category: "couples", label: "Hotwife" },
  { rank: 213, name: "HotWifeLifestyle", category: "couples", label: "Hotwife Life" },
  { rank: 214, name: "cuckold", category: "couples", label: "Cuckold" },
  { rank: 215, name: "wifesharing", category: "couples", label: "Wife Sharing" },
  { rank: 216, name: "WouldYouFuckMyWife", category: "couples", label: "WYFMW" },
  { rank: 217, name: "Threesome", category: "couples", label: "Threesome" },
  { rank: 218, name: "FFM", category: "couples", label: "FFM" },
  { rank: 219, name: "DoublePenetration", category: "couples", label: "DP" },
  { rank: 220, name: "SpitRoast", category: "couples", label: "Spit Roast" },
  { rank: 221, name: "Gangbang", category: "couples", label: "Gangbang" },
  { rank: 222, name: "Bukkake", category: "couples", label: "Bukkake" },
  { rank: 223, name: "Polyamory", category: "couples", label: "Polyamory" },
  { rank: 224, name: "Femdom", category: "couples", label: "Femdom" },
  { rank: 225, name: "Pegging", category: "couples", label: "Pegging" },
  { rank: 226, name: "gentlefemdom", category: "couples", label: "Gentle Femdom" },

  // Celebs
  { rank: 227, name: "celebnsfw", category: "celeb", label: "Celeb NSFW" },
  { rank: 228, name: "Celebs", category: "celeb", label: "Celebs" },
  { rank: 229, name: "celebsnaked", category: "celeb", label: "Celebs Naked" },
  { rank: 230, name: "CelebrityButts", category: "celeb", label: "Celebrity Butts" },
  { rank: 231, name: "CelebrityPlot", category: "celeb", label: "Celebrity Plot" },
  { rank: 232, name: "WatchItForThePlot", category: "celeb", label: "Plot" },
  { rank: 233, name: "MovieNudes", category: "celeb", label: "Movie Nudes" },
  { rank: 234, name: "CelebSexScenes", category: "celeb", label: "Sex Scenes" },
  { rank: 235, name: "CelebrityPussy", category: "celeb", label: "Celebrity Pussy" },
  { rank: 236, name: "CelebsBR", category: "celeb", label: "Celebs BR" },

  // Cosplay & hentai
  { rank: 237, name: "nsfwcosplay", category: "cosplay", label: "NSFW Cosplay" },
  { rank: 238, name: "cosplaygirls", category: "cosplay", label: "Cosplay Girls" },
  { rank: 239, name: "CosplayBoobs", category: "cosplay", label: "Cosplay Boobs" },
  { rank: 240, name: "cosplaybabes", category: "cosplay", label: "Cosplay Babes" },
  { rank: 241, name: "CosplayLewd", category: "cosplay", label: "Cosplay Lewd" },
  { rank: 242, name: "CosplayNation", category: "cosplay", label: "Cosplay Nation" },
  { rank: 243, name: "CosplayPornVideos", category: "cosplay", label: "Cosplay Videos" },
  { rank: 244, name: "CosplayButts", category: "cosplay", label: "Cosplay Butts" },
  { rank: 245, name: "RealAhegao", category: "cosplay", label: "Ahegao" },
  { rank: 246, name: "lewd", category: "cosplay", label: "Lewd" },
  { rank: 247, name: "rule34", category: "cosplay", label: "Rule 34" },
  { rank: 248, name: "Rule34Overwatch", category: "cosplay", label: "R34 Overwatch" },
  { rank: 249, name: "hentai", category: "cosplay", label: "Hentai" },
  { rank: 250, name: "HENTAI_GIF", category: "cosplay", label: "Hentai GIF" },
  { rank: 251, name: "ecchi", category: "cosplay", label: "Ecchi" },
  { rank: 252, name: "AnimeMILFS", category: "cosplay", label: "Anime MILFs" },

  // Alt & niche
  { rank: 253, name: "gothsluts", category: "alt", label: "Goth Sluts" },
  { rank: 254, name: "altgonewild", category: "alt", label: "Alt GW" },
  { rank: 255, name: "EmoGirls", category: "alt", label: "Emo Girls" },
  { rank: 256, name: "PunkGirls", category: "alt", label: "Punk Girls" },
  { rank: 257, name: "SceneGirls", category: "alt", label: "Scene Girls" },
  { rank: 258, name: "AlternativeGirls", category: "alt", label: "Alternative" },
  { rank: 259, name: "HotTubGirls", category: "alt", label: "Hot Tub" },
  { rank: 260, name: "TattoosPorn", category: "alt", label: "Tattoos" },
  { rank: 261, name: "PiercedNSFW", category: "alt", label: "Pierced" },
  { rank: 262, name: "PiercedNipples", category: "alt", label: "Pierced Nipples" },
  { rank: 263, name: "ModifiedGirls", category: "alt", label: "Modified" },
  { rank: 264, name: "Hotchickswithtattoos", category: "alt", label: "Tattoo Chicks" },
  { rank: 265, name: "GlassesGoneWild", category: "alt", label: "Glasses GW" },
  { rank: 266, name: "GirlsWithGlasses", category: "alt", label: "Girls w/ Glasses" },
  { rank: 267, name: "GeekyGoneWild", category: "alt", label: "Geeky GW" },
  { rank: 268, name: "BBW", category: "alt", label: "BBW" },
  { rank: 269, name: "chubby", category: "alt", label: "Chubby" },
  { rank: 270, name: "BBWGW", category: "alt", label: "BBW GW" },
  { rank: 271, name: "ChubbyGW", category: "alt", label: "Chubby GW" },
  { rank: 272, name: "NaturalGirls", category: "alt", label: "Natural Girls" },
  { rank: 273, name: "HairyPussy", category: "alt", label: "Hairy Pussy" },
  { rank: 274, name: "GoneWildHairy", category: "alt", label: "GW Hairy" },
  { rank: 275, name: "GoneWildTrans", category: "alt", label: "Trans GW" },
  { rank: 276, name: "TransGoneWild", category: "alt", label: "Trans GW 2" },
  { rank: 277, name: "Tgirls", category: "alt", label: "Tgirls" },
  { rank: 278, name: "trapsgonewild", category: "alt", label: "Traps GW" },
  { rank: 279, name: "FemBoys", category: "alt", label: "Femboys" },
  { rank: 280, name: "Sissies", category: "alt", label: "Sissies" },
  { rank: 281, name: "Interracial", category: "alt", label: "Interracial" },
  { rank: 282, name: "DamnGoodInterracial", category: "alt", label: "Good Interracial" },
  { rank: 283, name: "JungleFever", category: "alt", label: "Jungle Fever" },
  { rank: 284, name: "BlackWorldOrder", category: "alt", label: "BWO" },
  { rank: 285, name: "MonsterDicks", category: "alt", label: "Monster Dicks" },
  { rank: 286, name: "HugeDickTinyChick", category: "alt", label: "Huge/Tiny" },
  { rank: 287, name: "SizeComparison", category: "alt", label: "Size Compare" },
  { rank: 288, name: "OfficeSexPorn", category: "alt", label: "Office Sex" },
  { rank: 289, name: "NurseGW", category: "alt", label: "Nurse GW" },
  { rank: 290, name: "TeacherGW", category: "alt", label: "Teacher GW" },
  { rank: 291, name: "MedicalGoneWild", category: "alt", label: "Medical GW" },
  { rank: 292, name: "DoctorsGW", category: "alt", label: "Doctors GW" },
  { rank: 293, name: "MilitaryGoneWild", category: "alt", label: "Military GW" },
  { rank: 294, name: "Armpits", category: "alt", label: "Armpits" },
  { rank: 295, name: "trashy", category: "alt", label: "Trashy" },
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

export const GENRE_ORDER: NsfwCategory[] = [
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
    subLimit: String(options.subLimit ?? 3),
    imageLimit: String(options.imageLimit ?? 60),
  });
  if (options.subs?.length) params.set("subs", options.subs.join(","));
  if (options.discover) params.set("discover", "1");
  if (options.excludeGenres?.length) params.set("exclude", options.excludeGenres.join(","));

  const cacheKey = `peek:mix:v2:${params.toString()}`;
  const cached = readMixCache(cacheKey);
  if (cached?.items.length) return cached;

  let lastError = new Error("Mix feed failed.");

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** (attempt - 1) + Math.random() * 400);

    let res: Response;
    try {
      res = await fetch(`/api/public/reddit/mix?${params}`, {
        headers: { Accept: "application/json" },
        credentials: "include",
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      lastError =
        err instanceof DOMException && err.name === "TimeoutError"
          ? new Error("Mix feed timed out. Try again.")
          : new Error("Network error while loading mix feed.");
      continue;
    }

    const json = (await res.json()) as NsfwTopFeedResult & { error?: string };
    if (!res.ok) {
      lastError = new Error(json.error ?? `Mix feed failed (${res.status}).`);
      if (res.status === 429 || res.status === 502) continue;
      break;
    }

    const result: NsfwTopFeedResult = {
      items: json.items ?? [],
      after: json.after ?? null,
      sources: json.sources ?? [],
    };
    if (!result.items.length) {
      lastError = new Error("Mix feed returned no media right now.");
      continue;
    }
    writeMixCache(cacheKey, result);
    return result;
  }

  const stale = readMixCache(cacheKey, true);
  if (stale?.items.length) return stale;

  throw lastError;
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
