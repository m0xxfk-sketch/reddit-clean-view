import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";

import { fetchSubredditImages, type RedditImage } from "@/lib/reddit";
import { fetchNsfwTopFeed } from "@/lib/nsfw-subreddits";
import { AgeGate } from "@/components/AgeGate";
import { Lightbox } from "@/components/Lightbox";
import { NsfwGenreSelect, NSFW_MIX_VALUE } from "@/components/NsfwGenreSelect";
import { SmartImage } from "@/components/SmartImage";

const TITLE = "Peek — a clean image viewer for Reddit";
const DESC =
  "Browse any subreddit as a quiet, full-bleed image wall. No comments, no ads, no clutter — just pictures and a keyboard-driven lightbox.";

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
const PRESETS = ["EarthPorn", "CityPorn", "AnalogCommunity", "Art"];

function Index() {
  return (
    <AgeGate>
      <Viewer />
    </AgeGate>
  );
}

function Viewer() {
  const [subreddit, setSubreddit] = useState("EarthPorn");
  const [draft, setDraft] = useState("EarthPorn");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("hot");
  const [mixTop, setMixTop] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  const query = useInfiniteQuery({
    queryKey: mixTop ? ["nsfw-top-mix"] : ["sub", subreddit, sort],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      mixTop
        ? pageParam
          ? Promise.resolve({ items: [], after: null })
          : fetchNsfwTopFeed({ subLimit: 6, imageLimit: 80 })
        : fetchSubredditImages({ subreddit, sort, after: pageParam }),
    getNextPageParam: (last) => (mixTop ? undefined : last.after),
    retry: false,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const items: RedditImage[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim().replace(/^\/?r\//i, "");
    if (clean) {
      setMixTop(false);
      setSubreddit(clean);
    }
  };

  const pickSub = (name: string, topSort = false) => {
    setMixTop(false);
    setDraft(name);
    setSubreddit(name);
    if (topSort) setSort("top");
  };

  return (
    <div className="grain min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          <h1 className="font-display text-2xl leading-none text-glow">
            Peek<span className="text-primary">.</span>
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

          <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setMixTop(false);
                  setSort(s);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs capitalize transition ${
                  !mixTop && sort === s
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
            <span className="text-muted-foreground">Try</span>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => pickSub(p)}
                className={`rounded-full border px-3 py-1 transition ${
                  !mixTop && subreddit.toLowerCase() === p.toLowerCase()
                    ? "border-primary/50 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                r/{p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">NSFW</span>
            <NsfwGenreSelect
              value={mixTop ? NSFW_MIX_VALUE : subreddit}
              onPickSub={(name) => pickSub(name, true)}
              onPickMix={() => {
                setMixTop(true);
                setSort("top");
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-8">
        {query.isError && (
          <p className="mx-auto max-w-md rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-center text-sm text-foreground">
            {(query.error as Error).message}
          </p>
        )}

        {query.isPending && <SkeletonWall />}

        {!query.isPending && !query.isError && items.length === 0 && (
          <p className="py-24 text-center text-sm text-muted-foreground">
            {mixTop ? "No images found in the NSFW top mix." : `No images found in r/${subreddit}.`}
          </p>
        )}

        {items.length > 0 && (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-4">
            {items.map((item, i) => (
              <button
                key={item.id + i}
                onClick={() => setActive(i)}
                className="group relative block w-full break-inside-avoid overflow-hidden rounded-xl border border-border bg-surface text-left"
              >
                <SmartImage
                  src={item.url}
                  alt={item.title}
                  loading="lazy"
                  width={item.width}
                  height={item.height}
                  className="w-full transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-background to-transparent p-4 pt-10 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="line-clamp-2 text-sm text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    u/{item.author} · {item.score.toLocaleString()} pts
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.hasNextPage && !mixTop && (
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
        <Lightbox
          items={items}
          index={active}
          onClose={() => setActive(null)}
          onNavigate={setActive}
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
