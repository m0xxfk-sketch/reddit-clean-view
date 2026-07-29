import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageOff, RotateCw } from "lucide-react";

import { imageCandidates, withRetryParam } from "@/lib/image-fallbacks";

const RETRIES_PER_SOURCE = 2;
const BASE_DELAY = 600;

type Props = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
};

/**
 * <img> that survives flaky assets: it retries the same URL with backoff, then
 * walks through equivalent Reddit hosts, and finally offers a manual retry.
 */
export function SmartImage({ src, alt, className, width, height, loading = "lazy", onClick }: Props) {
  const sources = useMemo(() => imageCandidates(src), [src]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSourceIndex(0);
    setAttempt(0);
    setFailed(false);
  }, [src]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleError = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        if (attempt < RETRIES_PER_SOURCE) {
          setAttempt((a) => a + 1);
        } else if (sourceIndex < sources.length - 1) {
          setSourceIndex((i) => i + 1);
          setAttempt(0);
        } else {
          setFailed(true);
        }
      },
      BASE_DELAY * 2 ** attempt + Math.random() * 200,
    );
  }, [attempt, sourceIndex, sources.length]);

  const retryManually = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSourceIndex(0);
    setAttempt(1);
    setFailed(false);
  };

  if (failed) {
    return (
      <div
        style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
        className={`flex w-full flex-col items-center justify-center gap-3 bg-surface p-6 text-center ${className ?? ""}`}
      >
        <ImageOff className="size-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">This image didn&apos;t load.</p>
        <button
          onClick={retryManually}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition hover:bg-accent"
        >
          <RotateCw className="size-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <img
      key={`${sourceIndex}-${attempt}`}
      src={withRetryParam(sources[sourceIndex] ?? src, attempt)}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      onError={handleError}
      onClick={onClick}
      className={className}
    />
  );
}