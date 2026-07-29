import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export type FitMode = "contain" | "cover";

export type ZoomableImageHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

type Props = {
  src: string;
  alt: string;
  className?: string;
  fit?: FitMode;
  onZoomChange?: (scale: number) => void;
  onSwipe?: (direction: "left" | "right") => void;
};

/** Pan/zoom image surface — wheel, drag, double-click, pinch, and swipe navigation. */
export const ZoomableImage = forwardRef<ZoomableImageHandle, Props>(function ZoomableImage(
  { src, alt, className, fit = "contain", onZoomChange, onSwipe },
  ref,
) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);

  const applyScale = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
      setScale(clamped);
      onZoomChange?.(clamped);
      if (clamped === 1) setOffset({ x: 0, y: 0 });
    },
    [onZoomChange],
  );

  const reset = useCallback(() => applyScale(1), [applyScale]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = surfaceRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left - rect.width / 2;
      const py = clientY - rect.top - rect.height / 2;

      setScale((prev) => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
        onZoomChange?.(next);
        if (next === 1) {
          setOffset({ x: 0, y: 0 });
          return next;
        }
        const ratio = next / prev;
        setOffset((o) => ({
          x: o.x - px * (ratio - 1),
          y: o.y - py * (ratio - 1),
        }));
        return next;
      });
    },
    [onZoomChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => {
        const el = surfaceRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.25);
      },
      zoomOut: () => {
        const el = surfaceRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.25);
      },
      reset,
    }),
    [reset, zoomAt],
  );

  useEffect(() => {
    reset();
  }, [src, reset]);

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) {
      swipe.current = { x: e.clientX, y: e.clientY, t: Date.now() };
      return;
    }
    drag.current = { active: true, x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    drag.current.active = false;

    if (scale <= 1 && swipe.current && onSwipe) {
      const dx = e.clientX - swipe.current.x;
      const dy = e.clientY - swipe.current.y;
      const dt = Date.now() - swipe.current.t;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
        onSwipe(dx < 0 ? "left" : "right");
      }
    }
    swipe.current = null;
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (scale > 1.05) reset();
    else zoomAt(e.clientX, e.clientY, 2.2);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinch.current = {
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        scale,
      };
    } else if (e.touches.length === 1 && scale <= 1) {
      swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      applyScale((dist / pinch.current.dist) * pinch.current.scale);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (scale <= 1 && swipe.current && onSwipe && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const dx = t.clientX - swipe.current.x;
      const dy = t.clientY - swipe.current.y;
      const dt = Date.now() - swipe.current.t;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
        onSwipe(dx < 0 ? "left" : "right");
      }
    }
    pinch.current = null;
    swipe.current = null;
  };

  const objectClass = fit === "cover" ? "object-cover" : "object-contain";
  const sizeClass = fit === "cover" ? "h-full w-full" : "max-h-full max-w-full";

  return (
    <div
      ref={surfaceRef}
      className={`relative flex h-full w-full touch-none items-center justify-center overflow-hidden ${className ?? ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: scale > 1 ? "grab" : "zoom-in" }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`select-none ${sizeClass} ${objectClass} will-change-transform transition-opacity duration-200`}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      />
    </div>
  );
});

export { MIN_SCALE, MAX_SCALE };
