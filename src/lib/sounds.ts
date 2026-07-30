let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx && typeof window !== "undefined") {
    ctx = new AudioContext();
  }
  return ctx;
}

/** Soft UI tick — navigation, toggle, favorite. */
export function playTick(enabled: boolean) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.value = 0.04;
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
  osc.stop(ac.currentTime + 0.07);
}

export function playNav(enabled: boolean) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.value = 520;
  gain.gain.value = 0.035;
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
  osc.stop(ac.currentTime + 0.09);
}
