type Props = {
  src?: string;
  poster?: string;
};

/** Blurred ambient backdrop from current media. */
export function AmbientBackdrop({ src, poster }: Props) {
  const bg = poster ?? src;
  if (!bg) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-3xl saturate-150"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
    </div>
  );
}
