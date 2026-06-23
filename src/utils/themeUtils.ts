/**
 * Shared utility for applying theme and language preferences.
 * Used by AccountSettingsPage and App.tsx for consistent behavior.
 */

const PREFS_KEY = "coinloot_user_preferences";

export interface UserPreferences {
  theme: string;
  language: string;
}

/**
 * Apply theme to the document root element.
 * Supports "dark", "light", and "system" values.
 */
export function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light-mode");
    root.classList.remove("dark-mode");
  } else if (theme === "dark") {
    root.classList.add("dark-mode");
    root.classList.remove("light-mode");
  } else {
    // system default — follow OS preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark-mode", prefersDark);
    root.classList.toggle("light-mode", !prefersDark);
  }
}

/**
 * Set the lang attribute on the document root element.
 */
export function applyLanguage(language: string) {
  document.documentElement.lang = language === "bn" ? "bn" : "en";
}

/**
 * Load saved preferences from localStorage.
 */
export function loadPreferences(): UserPreferences {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* */ }
  return { theme: "dark", language: "en" };
}

/**
 * Save preferences to localStorage.
 */
export function savePreferences(theme: string, language: string) {
  localStorage.setItem(PREFS_KEY, JSON.stringify({ theme, language }));
}

/**
 * Set up system theme listener. Call when theme is "system".
 * Returns a cleanup function.
 */
export function listenForSystemTheme(): () => void {
  const root = document.documentElement;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    const prefersDark = mediaQuery.matches;
    root.classList.toggle("dark-mode", prefersDark);
    root.classList.toggle("light-mode", !prefersDark);
  };
  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
}
