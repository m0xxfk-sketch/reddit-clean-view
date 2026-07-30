const PIN_HASH_KEY = "peek.pin-hash";
const UNLOCK_UNTIL_KEY = "peek.pin-unlock-until";
const UNLOCK_DAYS = 7;

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`peek:pin:${pin}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hasLocalPin(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(PIN_HASH_KEY));
}

export async function setLocalPin(pin: string) {
  const hash = await hashPin(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export async function verifyLocalPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

export function isLocallyUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  const until = Number(localStorage.getItem(UNLOCK_UNTIL_KEY) ?? 0);
  return until > Date.now();
}

export function unlockLocally(remember = true) {
  if (!remember) return;
  localStorage.setItem(UNLOCK_UNTIL_KEY, String(Date.now() + UNLOCK_DAYS * 86400_000));
}

export function lockLocally() {
  localStorage.removeItem(UNLOCK_UNTIL_KEY);
}

export async function lockApp() {
  lockLocally();
  try {
    await fetch("/api/public/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // best-effort
  }
  window.location.reload();
}

export type PinAuthStatus = {
  mode: "server" | "client";
  unlocked: boolean;
  configured: boolean;
};

export async function fetchPinStatus(): Promise<PinAuthStatus> {
  try {
    const res = await fetch("/api/public/auth/status", { credentials: "include" });
    if (!res.ok) throw new Error("status failed");
    return (await res.json()) as PinAuthStatus;
  } catch {
    return {
      mode: "client",
      unlocked: isLocallyUnlocked(),
      configured: hasLocalPin(),
    };
  }
}

export async function verifyPinWithServer(pin: string): Promise<boolean> {
  const res = await fetch("/api/public/auth/pin", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { ok?: boolean };
  return Boolean(json.ok);
}
