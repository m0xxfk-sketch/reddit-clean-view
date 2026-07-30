import { useCallback, useEffect, useRef } from "react";

type Options = {
  enabled: boolean;
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNextPage: () => void;
  /** Prefetch when within this many items of the end. */
  itemThreshold?: number;
};

/** Infinite scroll sentinel + helper to prefetch when navigating near the end. */
export function useAutoLoadMore({
  enabled,
  hasNextPage,
  isFetching,
  fetchNextPage,
  itemThreshold = 3,
}: Options) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const maybeLoadMore = useCallback(
    (index: number, total: number) => {
      if (!enabled || !hasNextPage || isFetching || total === 0) return;
      if (index >= total - itemThreshold) fetchNextPage();
    },
    [enabled, hasNextPage, isFetching, fetchNextPage, itemThreshold],
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!enabled || !node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetching) fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, hasNextPage, isFetching, fetchNextPage]);

  return { sentinelRef, maybeLoadMore };
}
