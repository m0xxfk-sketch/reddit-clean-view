import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Minus, Plus, RotateCcw, X } from "lucide-react";

import type { RedditImage } from "@/lib/reddit";
import { SmartImage } from "@/components/SmartImage";
import { ZoomableImage, type ZoomableImageHandle } from "@/components/ZoomableImage";

type Props = {
  items: RedditImage[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
};

/** Cinema-style focus viewer with zoom, pan, filmstrip, and keyboard controls. */
export function FocusViewer({ items, index, onClose, onNavigate }: Props) {
  const item = items[index];
  const [zoom, setZoom] = useState(1);
  const [chrome, setChrome] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomRef = useRef<ZoomableImageHandle>(null);

  const bumpChrome = useCallback(() => {
    setChrome(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChrome(false), 3200);
  }, []);

  useEffect(() => {
    setZoom(1);
    bumpChrome();
  }, [index, bumpChrome]);

  useEffect(() => {
    bumpChrome();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(Math.min(index + 1, items.length - 1));
      if (e.key === "ArrowLeft") onNavigate(Math.max(index - 1, 0));
      if (e.key === "+" || e.key === "=") zoomRef.current?.zoomIn();
      if (e.key === "-") zoomRef.current?.zoomOut();
      if (e.key === "0") zoomRef.current?.reset();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [index, items.length, onClose, onNavigate, bumpChrome]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" onMouseMove={bumpChrome}>
      <header
        className={`flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-3 transition-opacity duration-300 sm:px-6 ${
          chrome ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm text-white/90">{item.title}</p>
          <p className="mt-1 text-xs text-white/50">
            u/{item.author} · r/{item.subreddit} · {item.score.toLocaleString()} pts · {index + 1}/
            {items.length}
            {zoom > 1 && ` · ${Math.round(zoom * 100)}%`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn label="Zoom out" onClick={() => zoomRef.current?.zoomOut()}>
            <Minus className="size-4" />
          </IconBtn>
          <IconBtn label="Zoom in" onClick={() => zoomRef.current?.zoomIn()}>
            <Plus className="size-4" />
          </IconBtn>
          <IconBtn label="Reset zoom" onClick={() => zoomRef.current?.reset()}>
            <RotateCcw className="size-3.5" />
          </IconBtn>
          <a
            href={item.permalink}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Open on Reddit"
          >
            <ExternalLink className="size-4" />
          </a>
          <IconBtn label="Close" onClick={onClose}>
            <X className="size-4" />
          </IconBtn>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <ZoomableImage
          ref={zoomRef}
          src={item.url}
          alt={item.title}
          onZoomChange={setZoom}
          className="h-full"
        />
        {index > 0 && <Nav side="left" onClick={() => onNavigate(index - 1)} visible={chrome} />}
        {index < items.length - 1 && (
          <Nav side="right" onClick={() => onNavigate(index + 1)} visible={chrome} />
        )}
      </div>

      <Filmstrip items={items} index={index} onPick={onNavigate} visible={chrome} />

      <p
        className={`pointer-events-none pb-3 text-center text-[10px] text-white/35 transition-opacity duration-300 ${
          chrome ? "opacity-100" : "opacity-0"
        }`}
      >
        Scroll or pinch to zoom · double-click to toggle · +/- keys · ← → navigate
      </p>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function Nav({
  side,
  onClick,
  visible,
}: {
  side: "left" | "right";
  onClick: () => void;
  visible: boolean;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous" : "Next"}
      onClick={onClick}
      className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-3 text-white backdrop-blur transition hover:bg-black/70 ${
        side === "left" ? "left-3 sm:left-5" : "right-3 sm:right-5"
      } ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <Icon className="size-5" />
    </button>
  );
}

function Filmstrip({
  items,
  index,
  onPick,
  visible,
}: {
  items: RedditImage[];
  index: number;
  onPick: (i: number) => void;
  visible: boolean;
}) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stripRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index]);

  return (
    <div
      className={`shrink-0 border-t border-white/10 px-3 py-2 transition-opacity duration-300 sm:px-4 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:thin]"
      >
        {items.map((thumb, i) => (
          <button
            key={thumb.id + i}
            type="button"
            onClick={() => onPick(i)}
            className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-16 sm:w-16 ${
              i === index
                ? "border-primary opacity-100"
                : "border-transparent opacity-50 hover:opacity-80"
            }`}
          >
            <SmartImage
              src={thumb.url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** @deprecated Use FocusViewer */
export const Lightbox = FocusViewer;
