import { useRef } from "react";

/** Feed panel with swipe-up to advance. Keyboard nav is handled by the parent viewer. */
export function FeedPanel({
  children,
  onSwipeUp,
}: {
  children: React.ReactNode;
  onSwipeUp?: () => void;
}) {
  const touch = useRef<{ y: number; t: number } | null>(null);

  return (
    <div
      className="feed-panel group relative flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center border-b border-border/50 bg-surface/20 px-2 py-8 last:border-b-0"
      onTouchStart={(e) => {
        touch.current = { y: e.touches[0].clientY, t: Date.now() };
      }}
      onTouchEnd={(e) => {
        if (!touch.current || !onSwipeUp) return;
        const dy = touch.current.y - e.changedTouches[0].clientY;
        const dt = Date.now() - touch.current.t;
        if (dy > 70 && dt < 500) onSwipeUp();
        touch.current = null;
      }}
    >
      {children}
    </div>
  );
}
