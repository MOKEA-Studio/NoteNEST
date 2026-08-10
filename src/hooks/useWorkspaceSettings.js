import { useCallback, useState } from "react";
import { settingsApi } from "../api";
import { defaultSettings } from "../app/pageState";
import useAppearance from "./useAppearance";

export default function useWorkspaceSettings({ setError }) {
  const [settings, setSettings] = useState(defaultSettings);

  const loadSettings = useCallback(async () => {
    try {
      const loaded = await settingsApi.get();
      setSettings({
        ...defaultSettings,
        ...loaded,
        customFonts: loaded.customFonts ?? [],
        tagColors: loaded.tagColors ?? {},
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [setError]);

  async function saveSettings(nextSettings) {
    const saved = await settingsApi.update(nextSettings);
    setSettings({ ...defaultSettings, ...saved, tagColors: saved.tagColors ?? {} });
  }

  useAppearance(settings);

  return { settings, loadSettings, saveSettings };
}
