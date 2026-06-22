"use client";

import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";

export type Lang = "en" | "zh";

const STORAGE_KEY = "ai4gc-lang";
const DEFAULT_LANG: Lang = "en";

// Persisted language lives in localStorage and is exposed through an external
// store so components can read it with useSyncExternalStore — no setState-in-effect
// and no hydration mismatch (the server snapshot is always the default).
const listeners = new Set<() => void>();

function readStored(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh") {
      return stored;
    }
  } catch {
    // localStorage unavailable (e.g. private mode) — fall back to default.
  }
  return DEFAULT_LANG;
}

function writeStored(lang: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore write failures.
  }
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Reflect changes made in other tabs.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

type LanguageValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
};

export function useLang(): LanguageValue {
  const lang = useSyncExternalStore(subscribe, readStored, () => DEFAULT_LANG);

  const setLang = useCallback((next: Lang) => writeStored(next), []);
  const toggle = useCallback(
    () => writeStored(readStored() === "en" ? "zh" : "en"),
    [],
  );

  return { lang, setLang, toggle };
}

/** Keeps <html lang> in sync with the active language. Wraps the app once. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { lang } = useLang();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <>{children}</>;
}

/** Pick the Chinese value when in `zh` mode and it exists, otherwise the English fallback. */
export function pick(lang: Lang, en: string, zh?: string | null): string;
export function pick(
  lang: Lang,
  en: string | undefined,
  zh?: string | null,
): string | undefined;
export function pick(
  lang: Lang,
  en: string | undefined,
  zh?: string | null,
): string | undefined {
  if (lang === "zh" && typeof zh === "string" && zh.trim().length > 0) {
    return zh;
  }
  return en;
}
