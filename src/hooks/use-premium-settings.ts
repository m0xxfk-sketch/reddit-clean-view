import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  type PremiumSettings,
} from "@/lib/premium-store";

export function usePremiumSettings() {
  const [settings, setSettings] = useState<PremiumSettings>(() => getSettings());

  useEffect(() => {
    const sync = () => setSettings(getSettings());
    window.addEventListener("storage", sync);
    window.addEventListener("peek-settings", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("peek-settings", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<PremiumSettings>) => {
    saveSettings(patch);
    setSettings(getSettings());
    window.dispatchEvent(new Event("peek-settings"));
  }, []);

  return { settings, update };
}

export { DEFAULT_SETTINGS };
