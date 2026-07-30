import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  type PremiumSettings,
} from "@/lib/premium-store";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("peek-settings", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("peek-settings", cb);
  };
}

function notify() {
  window.dispatchEvent(new Event("peek-settings"));
}

export function usePremiumSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    () => getSettings(),
    () => DEFAULT_SETTINGS,
  );

  const update = useCallback((patch: Partial<PremiumSettings>) => {
    saveSettings(patch);
    notify();
  }, []);

  return { settings, update };
}
