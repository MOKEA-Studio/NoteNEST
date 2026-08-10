import { useEffect } from "react";

export default function useAppearance(settings) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--editor-font-size", `${settings.fontSize}px`);
    const builtInFonts = {
      system: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
    };
    if (builtInFonts[settings.fontFamily]) {
      root.style.setProperty("--editor-font", builtInFonts[settings.fontFamily]);
      return undefined;
    }

    const customFont = settings.customFonts.find((font) => font.url === settings.fontFamily);
    if (!customFont) {
      root.style.setProperty("--editor-font", builtInFonts.system);
      return undefined;
    }

    let cancelled = false;
    const family = `NoteNestCustom-${settings.customFonts.indexOf(customFont)}`;
    const fontFace = new FontFace(family, `url("${customFont.url}")`);
    fontFace.load().then((loaded) => {
      if (cancelled) return;
      document.fonts.add(loaded);
      root.style.setProperty("--editor-font", `"${family}", sans-serif`);
    }).catch(() => root.style.setProperty("--editor-font", builtInFonts.system));
    return () => {
      cancelled = true;
    };
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applyAppearance = () => {
      root.dataset.theme = settings.theme === "system" ? (systemTheme.matches ? "dark" : "light") : settings.theme;
      root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
      const lineHeights = { compact: 1.55, comfortable: 1.75, relaxed: 2 };
      root.style.setProperty("--editor-line-height", lineHeights[settings.lineSpacing] ?? lineHeights.comfortable);
    };
    applyAppearance();
    systemTheme.addEventListener("change", applyAppearance);
    return () => systemTheme.removeEventListener("change", applyAppearance);
  }, [settings.lineSpacing, settings.reduceMotion, settings.theme]);
}
