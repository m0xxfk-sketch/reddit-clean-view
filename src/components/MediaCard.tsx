import { Link } from "@tanstack/react-router";
import { Heart, PictureInPicture2 } from "lucide-react";
import { useRef, useState } from "react";

import { SmartMedia, type SmartMediaHandle } from "@/components/SmartMedia";
import type { RedditMedia } from "@/lib/media-types";
import { isRedgifsUrl } from "@/lib/media-url";
import { isFavorite, toggleFavorite } from "@/lib/premium-store";
import { playTick } from "@/lib/sounds";
import type { VideoQuality } from "@/lib/premium-store";

export function itemMediaKind(item: RedditMedia): "image" | "video" {
  if (/\.gif(\?.*)?$/i.test(item.url)) return "image";
  if (item.mediaKind) return item.mediaKind;
  if (isRedgifsUrl(item.url) || /\.(mp4|webm|gifv)(\?.*)?$/i.test(item.url)) return "video";
  return "image";
}

type Props = {
  item: RedditMedia;
  index: number;
  onOpen: (index: number) => void;
  className?: string;
  mediaClassName?: string;
  overlay?: "hover" | "always" | "none";
  loading?: "lazy" | "eager";
  videoQuality?: VideoQuality;
  sounds?: boolean;
  showPip?: boolean;
  discreetBlur?: boolean;
};

export function MediaCard({
  item,
  index,
  onOpen,
  className,
  mediaClassName,
  overlay = "hover",
  loading = "lazy",
  videoQuality = "sd",
  sounds = true,
  showPip = false,
  discreetBlur = false,
}: Props) {
  const [fav, setFav] = useState(() => isFavorite(item.id));
  const [revealed, setRevealed] = useState(!discreetBlur);
  const videoRef = useRef<SmartMediaHandle>(null);

  const overlayClass =
    overlay === "always"
      ? "opacity-100"
      : overlay === "none"
        ? "opacity-0"
        : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100";

  return (
    <div
      className={`group relative ${className ?? ""}`}
      onMouseEnter={() => discreetBlur && setRevealed(true)}
      onFocus={() => discreetBlur && setRevealed(true)}
    >
      <button
        type="button"
        onClick={() => {
          if (discreetBlur) setRevealed(true);
          onOpen(index);
        }}
        className="block w-full text-left"
        aria-label={item.title}
      >
        <SmartMedia
          ref={videoRef}
          src={item.url}
          poster={item.posterUrl}
          mediaKind={itemMediaKind(item)}
          alt={item.title}
          loading={loading}
          videoQuality={videoQuality}
          width={item.width}
          height={item.height}
          className={`transition-[filter] duration-300 ${discreetBlur && !revealed ? "blur-2xl scale-105" : ""} ${mediaClassName ?? ""}`}
        />
      </button>

      {overlay !== "none" && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4 pt-12 transition duration-300 ${overlayClass}`}
        >
          <p className="line-clamp-2 text-sm text-foreground">{item.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link
              to="/creator/$name"
              params={{ name: item.author }}
              className="pointer-events-auto hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              u/{item.author}
            </Link>
            {" · "}r/{item.subreddit} · {item.score.toLocaleString()} pts
          </p>
        </div>
      )}

      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
        {showPip && itemMediaKind(item) === "video" && (
          <IconBtn
            label="Picture in picture"
            onClick={() => {
              const v = videoRef.current?.video;
              if (v && document.pictureInPictureEnabled) void v.requestPictureInPicture();
              playTick(sounds);
            }}
          >
            <PictureInPicture2 className="size-3.5" />
          </IconBtn>
        )}
        <IconBtn
          label={fav ? "Remove favorite" : "Add favorite"}
          active={fav}
          onClick={() => {
            setFav(toggleFavorite(item));
            playTick(sounds);
          }}
        >
          <Heart className={`size-3.5 ${fav ? "fill-primary text-primary" : ""}`} />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-full border border-border/80 bg-background/80 p-2 backdrop-blur transition hover:bg-surface ${
        active ? "border-primary/50" : ""
      }`}
    >
      {children}
    </button>
  );
}
