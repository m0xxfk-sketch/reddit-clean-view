import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { AccessGate } from "@/components/AccessGate";
import { FocusViewer } from "@/components/FocusViewer";
import { MediaCard } from "@/components/MediaCard";
import { usePremiumSettings } from "@/hooks/use-premium-settings";
import { filterMedia } from "@/lib/feed-filters";
import { fetchUserPosts, type RedditMedia } from "@/lib/reddit";

export const Route = createFileRoute("/creator/$name")({
  component: CreatorPage,
});

function CreatorPage() {
  return (
    <AccessGate>
      <CreatorProfile />
    </AccessGate>
  );
}

function CreatorProfile() {
  const { name } = Route.useParams();
  const { settings } = usePremiumSettings();
  const [active, setActive] = useState<number | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["creator", name],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchUserPosts({ user: name, sort: "new", after: pageParam }),
    getNextPageParam: (last) => last.after,
    staleTime: 10 * 60 * 1000,
  });

  const items: RedditMedia[] = useMemo(() => {
    const raw = query.data?.pages.flatMap((p) => p.items) ?? [];
    return filterMedia(raw, {
      mediaFilter: settings.mediaFilter,
      minScore: settings.minScore,
      timeFilter: settings.timeFilter,
    });
  }, [query.data, settings]);

  return (
    <div className="grain min-h-screen">
      <header className="border-b border-border bg-background/80 px-5 py-6 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <div>
            <h1 className="font-display text-3xl text-glow">u/{name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Creator profile · submitted posts</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-8">
        {query.isPending && <p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>}
        {query.isError && (
          <p className="py-20 text-center text-sm text-destructive">{(query.error as Error).message}</p>
        )}

        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {items.map((item, i) => (
            <MediaCard
              key={item.id + i}
              item={item}
              index={i}
              onOpen={setActive}
              videoQuality={settings.videoQuality}
              sounds={settings.sounds}
              className="break-inside-avoid overflow-hidden rounded-xl border border-border bg-surface"
              mediaClassName="w-full"
            />
          ))}
        </div>

        {query.hasNextPage && (
          <div className="flex justify-center py-10">
            <button
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm"
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
        />
      )}
    </div>
  );
}
