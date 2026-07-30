import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ImageOff, RotateCw } from "lucide-react";

import type { MediaKind } from "@/lib/media-types";
import { imageCandidates, withRetryParam } from "@/lib/image-fallbacks";
import {
  isDirectVideoUrl,
  needsVideoResolve,
  normalizePosterUrl,
  videoLoadCandidates,
} from "@/lib/media-url";
import type { VideoQuality } from "@/lib/premium-store";
import { isAnimatedGifUrl, resolveVideoUrl } from "@/lib/video-resolve";

const RETRIES_PER_SOURCE = 2;
const BASE_DELAY = 600;

type Props = {
  src: string;
  poster?: string;
  mediaKind?: MediaKind;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  autoPlay?: boolean;
  videoQuality?: VideoQuality;
  onClick?: (e: React.MouseEvent) => void;
};

export type SmartMediaHandle = { video: HTMLVideoElement | null };

export const SmartMedia = forwardRef<SmartMediaHandle, Props>(function SmartMedia(
  {
    src,
    poster,
    mediaKind = "image",
    alt,
    className,
    width,
    height,
    loading = "lazy",
    autoPlay = true,
    videoQuality = "sd",
    onClick,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isGif = isAnimatedGifUrl(src);
  const isVideo = mediaKind === "video" && !isGif;

  const [visible, setVisible] = useState(loading === "eager");
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(
    isVideo && isDirectVideoUrl(src) ? src : null,
  );
  const [resolvedPoster, setResolvedPoster] = useState(normalizePosterUrl(poster));
  const [resolveError, setResolveError] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({ video: videoRef.current }));

  useEffect(() => {
    if (loading === "eager") {
      setVisible(true);
      return;
    }
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    setSourceIndex(0);
    setAttempt(0);
    setFailed(false);
    setResolveError(false);
    setResolvedPoster(normalizePosterUrl(poster));

    if (!isVideo) {
      setResolvedSrc(null);
      return;
    }

    if (isDirectVideoUrl(src)) {
      setResolvedSrc(src);
      return;
    }

    if (!needsVideoResolve(src)) {
      setResolvedSrc(src);
      return;
    }

    if (!visible) return;

    let cancelled = false;
    setResolvedSrc(null);

    const attemptResolve = (retriesLeft: number) => {
      resolveVideoUrl(src, videoQuality, { priority: true })
        .then((result) => {
          if (cancelled) return;
          if (!result?.url) {
            if (retriesLeft > 0) {
              setTimeout(() => attemptResolve(retriesLeft - 1), 800);
              return;
            }
            throw new Error("no url");
          }
          setResolvedSrc(result.url);
          if (result.poster) setResolvedPoster(normalizePosterUrl(result.poster));
        })
        .catch(() => {
          if (!cancelled) setResolveError(true);
        });
    };

    attemptResolve(1);

    return () => {
      cancelled = true;
    };
  }, [src, poster, isVideo, videoQuality, visible]);

  const videoSources = useMemo(
    () => (resolvedSrc ? videoLoadCandidates(resolvedSrc) : []),
    [resolvedSrc],
  );

  const imageSources = useMemo(() => imageCandidates(src), [src]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleError = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);

    if (isVideo) {
      timer.current = setTimeout(() => {
        if (sourceIndex < videoSources.length - 1) {
          setSourceIndex((i) => i + 1);
        } else {
          setFailed(true);
        }
      }, BASE_DELAY);
      return;
    }

    timer.current = setTimeout(
      () => {
        if (attempt < RETRIES_PER_SOURCE) {
          setAttempt((a) => a + 1);
        } else if (sourceIndex < imageSources.length - 1) {
          setSourceIndex((i) => i + 1);
          setAttempt(0);
        } else {
          setFailed(true);
        }
      },
      BASE_DELAY * 2 ** attempt + Math.random() * 200,
    );
  }, [attempt, imageSources.length, isVideo, sourceIndex, videoSources.length]);

  const retryManually = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSourceIndex(0);
    setAttempt(1);
    setFailed(false);
    setResolveError(false);
    if (isVideo && needsVideoResolve(src)) {
      setResolvedSrc(null);
      resolveVideoUrl(src, videoQuality, { priority: true }).then((result) => {
        if (result?.url) {
          setResolvedSrc(result.url);
          if (result.poster) setResolvedPoster(normalizePosterUrl(result.poster));
        } else setResolveError(true);
      });
    }
  };

  const wrap = (content: React.ReactNode) => (
    <div ref={rootRef} className={isVideo || isGif ? "contents" : undefined}>
      {content}
    </div>
  );

  if (isVideo) {
    if (resolveError || failed) {
      return wrap(
        <VideoFallback
          poster={resolvedPoster ?? poster}
          alt={alt}
          className={className}
          width={width}
          height={height}
          onRetry={retryManually}
        />,
      );
    }

    if (!visible || !resolvedSrc) {
      const posterCandidates = resolvedPoster ? imageCandidates(resolvedPoster) : [];
      const posterSrc = posterCandidates[0];

      return wrap(
        <div
          className={`relative flex items-center justify-center overflow-hidden bg-black/40 ${className ?? ""}`}
          style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
        >
          {posterSrc && (
            <img src={posterSrc} alt={alt} className="h-full w-full object-cover opacity-60" loading="lazy" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white/90" />
          </div>
        </div>,
      );
    }

    const videoSrc = videoSources[sourceIndex] ?? resolvedSrc;

    return wrap(
      <video
        ref={videoRef}
        key={`${videoSrc}-${sourceIndex}`}
        src={videoSrc}
        poster={resolvedPoster}
        autoPlay={autoPlay}
        loop
        muted
        playsInline
        preload={loading === "eager" ? "auto" : "metadata"}
        onError={handleError}
        onClick={onClick}
        className={className}
        width={width}
        height={height}
      />,
    );
  }

  if (!visible) {
    return wrap(
      <div
        style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
        className={`animate-pulse bg-surface ${className ?? ""}`}
      />,
    );
  }

  if (failed) {
    return wrap(
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
      </div>,
    );
  }

  return wrap(
    <img
      key={`${sourceIndex}-${attempt}`}
      src={withRetryParam(imageSources[sourceIndex] ?? src, attempt)}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      onError={handleError}
      onClick={onClick}
      className={className}
    />,
  );
});

function VideoFallback({
  poster,
  alt,
  className,
  width,
  height,
  onRetry,
}: {
  poster?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onRetry: (e: React.MouseEvent) => void;
}) {
  const proxiedPoster = poster ? imageCandidates(poster)[0] : undefined;

  return (
    <div
      style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
      className={`relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden bg-surface p-6 text-center ${className ?? ""}`}
    >
      {proxiedPoster && (
        <img src={proxiedPoster} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-30" />
      )}
      <ImageOff className="relative size-5 text-muted-foreground" />
      <p className="relative text-xs text-muted-foreground">This video didn&apos;t load.</p>
      <button
        onClick={onRetry}
        className="relative inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition hover:bg-accent"
      >
        <RotateCw className="size-3.5" />
        Retry
      </button>
    </div>
  );
}
