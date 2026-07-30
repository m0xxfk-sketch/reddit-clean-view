import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, LayoutGrid, Rows3, Monitor } from "lucide-react";

import { FeedPanel } from "@/components/FeedPanel";
import { FocusViewer } from "@/components/FocusViewer";
import { MediaCard } from "@/components/MediaCard";
import { NsfwGenreSelect, NSFW_MIX_VALUE } from "@/components/NsfwGenreSelect";
import { PremiumBar } from "@/components/PremiumBar";
import { AccessGate } from "@/components/AccessGate";
import { useMediaPrefetch } from "@/hooks/use-media-prefetch";
import { usePremiumSettings } from "@/hooks/use-premium-settings";
import { filterMedia } from "@/lib/feed-filters";
import { fetchMixFeed } from "@/lib/nsfw-subreddits";
import { fetchSubredditImages, type RedditMedia } from "@/lib/reddit";
import {
  cacheOfflineItems,
  getFavorites,
  getOfflineItems,
  getRecentGenres,
  recordBrowse,
  type CustomMix,
} from "@/lib/premium-store";
import { playTick } from "@/lib/sounds";

type BrowseMode = "wall" | "feed" | "theater";
type FeedMode = "mix" | "sub" | "discover" | "custom" | "favorites";

const TITLE = "Peek — premium NSFW Reddit viewer";
const DESC =
  "A cinematic, distraction-free viewer for NSFW Reddit. Browse by genre, autoplay GIFs, and explore with wall, feed, or theater modes.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "rating", content: "adult" },
    ],
  }),
  component: Index,
});

const SORTS = ["hot", "new", "top", "rising"] as const;

function Index() {
  return (
    <AccessGate>
      <Viewer />
    </AccessGate>
  );
}

function Viewer() {
  const { settings } = usePremiumSettings();
  const [subreddit, setSubreddit] = useState("gonewild");
  const [draft, setDraft] = useState("gonewild");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("top");
  const [feedMode, setFeedMode] = useState<FeedMode>("sub");
  const [customMix, setCustomMix] = useState<CustomMix | null>(null);
  const [browseMode, setBrowseMode] = useState<BrowseMode>("wall");
  const [active, setActive] = useState<number | null>(null);
  const [headerHidden, setHeaderHidden] = useState(false);

  const query = useInfiniteQuery({
    queryKey:
      feedMode === "favorites"
        ? ["favorites"]
        : feedMode === "discover"
          ? ["discover", sort]
          : feedMode === "custom" && customMix
            ? ["custom-mix", customMix.id, sort]
            : feedMode === "mix"
              ? ["nsfw-top-mix", sort]
              : ["sub", subreddit, sort],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      if (feedMode === "favorites") {
        return Promise.resolve({ items: getFavorites(), after: null });
      }
      if (feedMode === "mix") {
        return pageParam
          ? Promise.resolve({ items: [], after: null, sources: [] })
          : fetchMixFeed({ subLimit: 4, imageLimit: 60 });
      }
      if (feedMode === "discover") {
        return pageParam
          ? Promise.resolve({ items: [], after: null, sources: [] })
          : fetchMixFeed({
              subLimit: 5,
              imageLimit: 60,
              discover: true,
              excludeGenres: getRecentGenres(),
            });
      }
      if (feedMode === "custom" && customMix) {
        return pageParam
          ? Promise.resolve({ items: [], after: null, sources: [] })
          : fetchMixFeed({ subs: customMix.subs, imageLimit: 60 });
      }
      return fetchSubredditImages({ subreddit, sort, after: pageParam });
    },
    getNextPageParam: (last) =>
      feedMode === "sub" ? last.after : undefined,
    retry: 1,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rawItems: RedditMedia[] = useMemo(() => {
    const fetched = query.data?.pages.flatMap((p) => p.items) ?? [];
    if (fetched.length) return fetched;
    return getOfflineItems();
  }, [query.data]);

  const items = useMemo(
    () =>
      filterMedia(rawItems, {
        mediaFilter: settings.mediaFilter,
        minScore: settings.minScore,
        timeFilter: settings.timeFilter,
      }),
    [rawItems, settings.mediaFilter, settings.minScore, settings.timeFilter],
  );

  useMediaPrefetch(items, active, settings.prefetchCount);

  useEffect(() => {
    if (rawItems.length) cacheOfflineItems(rawItems);
  }, [rawItems]);

  useEffect(() => {
    document.documentElement.classList.toggle("feed-scroll", browseMode === "feed");
    document.documentElement.classList.toggle("peek-immersive", settings.immersive);
    return () => {
      document.documentElement.classList.remove("feed-scroll", "peek-immersive");
    };
  }, [browseMode, settings.immersive]);

  useEffect(() => {
    if (!settings.immersive) {
      setHeaderHidden(false);
      return;
    }
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHeaderHidden(y > 80 && y > lastY);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [settings.immersive]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim().replace(/^\/?r\//i, "");
    if (clean) {
      setFeedMode("sub");
      setSubreddit(clean);
      recordBrowse(clean);
      playTick(settings.sounds);
    }
  };

  const pickSub = (name: string, topSort = false) => {
    setFeedMode("sub");
    setDraft(name);
    setSubreddit(name);
    recordBrowse(name);
    if (topSort) setSort("top");
    playTick(settings.sounds);
  };

  const scrollToFeed = (i: number) => {
    document.querySelector(`[data-feed-index="${i}"]`)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="grain min-h-screen">
      <header
        className={`sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl transition-transform duration-300 ${
          settings.immersive && headerHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          <h1 className="font-display text-2xl leading-none text-glow">
            Peek<span className="text-primary">.</span>
            <span className="ml-2 align-middle text-[10px] font-sans uppercase tracking-[0.2em] text-primary/70">
              Premium
            </span>
          </h1>

          <form onSubmit={submit} className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="subreddit name…"
              aria-label="Subreddit"
              className="h-11 w-full rounded-full border border-input bg-surface pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </form>

          <div className="browse-modes flex items-center gap-1 rounded-full border border-border bg-surface p-1">
            {(
              [
                { mode: "wall" as const, icon: LayoutGrid, label: "Wall" },
                { mode: "feed" as const, icon: Rows3, label: "Feed" },
                { mode: "theater" as const, icon: Monitor, label: "Theater" },
              ] as const
            ).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                aria-label={`${label} view`}
                aria-pressed={browseMode === mode}
                onClick={() => {
                  setBrowseMode(mode);
                  playTick(settings.sounds);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
                  browseMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (feedMode === "sub") setSort(s);
                  playTick(settings.sounds);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs capitalize transition ${
                  feedMode === "sub" && sort === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-5 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Browse</span>
            <NsfwGenreSelect
              value={
                feedMode === "mix"
                  ? NSFW_MIX_VALUE
                  : feedMode === "discover"
                    ? "__discover__"
                    : feedMode === "favorites"
                      ? "__favorites__"
                      : subreddit
              }
              onPickSub={(name) => pickSub(name, true)}
              onPickMix={() => {
                setFeedMode("mix");
                setSort("top");
                playTick(settings.sounds);
              }}
            />
          </div>
          <PremiumBar
            showingFavorites={feedMode === "favorites"}
            onDiscover={() => {
              setFeedMode("discover");
              query.refetch();
              playTick(settings.sounds);
            }}
            onCustomMix={(mix) => {
              setCustomMix(mix);
              setFeedMode("custom");
              query.refetch();
            }}
            onShowFavorites={() => setFeedMode("favorites")}
          />
        </div>
      </header>

      <main className={`mx-auto max-w-[1600px] px-5 py-8 layout-${browseMode}`}>
        {query.isError && (
          <div className="mx-auto max-w-md rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-center text-sm text-foreground">
            <p>{(query.error as Error).message}</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-3 rounded-full border border-border bg-surface px-4 py-1.5 text-xs transition hover:bg-surface-raised"
            >
              Try again
            </button>
          </div>
        )}

        {query.isFetching && !query.isPending && (
          <div className="mb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Refreshing…
          </div>
        )}

        {query.isPending && items.length === 0 && <SkeletonWall />}

        {!query.isPending && !query.isError && items.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-sm text-muted-foreground">
              {rawItems.length > 0
                ? "No media matches your filters. Try adjusting score or media type."
                : "Nothing loaded yet. Check your connection or pick a subreddit."}
            </p>
            {rawItems.length === 0 && (
              <button
                type="button"
                onClick={() => query.refetch()}
                className="mt-4 rounded-full border border-border bg-surface px-4 py-1.5 text-xs transition hover:bg-surface-raised"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {items.length > 0 && browseMode === "wall" && (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-4">
            {items.map((item, i) => (
              <MediaCard
                key={item.id + i}
                item={item}
                index={i}
                onOpen={setActive}
                videoQuality={settings.videoQuality}
                sounds={settings.sounds}
                showPip
                className="break-inside-avoid overflow-hidden rounded-xl border border-border bg-surface"
                mediaClassName="w-full transition duration-500 group-hover:scale-[1.03]"
              />
            ))}
          </div>
        )}

        {items.length > 0 && browseMode === "feed" && (
          <div className="flex flex-col">
            {items.map((item, i) => (
              <FeedPanel
                key={item.id + i}
                onSwipeUp={() => scrollToFeed(i + 1)}
              >
                <div data-feed-index={i} className="flex w-full flex-col items-center">
                  <MediaCard
                    item={item}
                    index={i}
                    onOpen={setActive}
                    videoQuality={settings.videoQuality}
                    sounds={settings.sounds}
                    overlay="always"
                    loading={i < 3 ? "eager" : "lazy"}
                    className="w-full max-w-4xl"
                    mediaClassName="max-h-[min(78vh,820px)] max-w-full rounded-lg object-contain shadow-lg"
                  />
                </div>
              </FeedPanel>
            ))}
          </div>
        )}

        {items.length > 0 && browseMode === "theater" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {items.map((item, i) => (
              <MediaCard
                key={item.id + i}
                item={item}
                index={i}
                onOpen={setActive}
                videoQuality={settings.videoQuality}
                sounds={settings.sounds}
                showPip
                overlay="always"
                loading={i < 4 ? "eager" : "lazy"}
                className="aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-black/40 shadow-lg transition hover:border-primary/40"
                mediaClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              />
            ))}
          </div>
        )}

        {query.hasNextPage && feedMode === "sub" && (
          <div className="flex justify-center py-12">
            <button
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm transition hover:bg-surface-raised disabled:opacity-60"
            >
              {query.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
              Load more
            </button>
          </div>
        )}
      </main>

      {active !== null && (
        <FocusViewer
          items={items}
          index={active}
          onClose={() => setActive(null)}
          onNavigate={setActive}
          videoQuality={settings.videoQuality}
          sounds={settings.sounds}
          immersive={settings.immersive}
          prefetchCount={settings.prefetchCount}
        />
      )}
    </div>
  );
}

function SkeletonWall() {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-4">
      {[320, 460, 260, 400, 350, 500, 280, 420, 300, 380, 460, 320].map((h, i) => (
        <div
          key={i}
          style={{ height: h }}
          className="w-full animate-pulse break-inside-avoid rounded-xl bg-surface"
        />
      ))}
    </div>
  );
}
