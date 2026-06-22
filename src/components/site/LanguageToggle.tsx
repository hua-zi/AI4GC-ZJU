"use client";

import { useLang } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

type LanguageToggleProps = {
  className?: string;
  onToggle?: () => void;
};

/** Compact EN / 中文 switch; shows the language you'd switch *to*. */
export default function LanguageToggle({ className, onToggle }: LanguageToggleProps) {
  const { lang, toggle } = useLang();
  const nextIsZh = lang === "en";

  return (
    <button
      type="button"
      className={cn("site-lang-toggle", className)}
      onClick={() => {
        toggle();
        onToggle?.();
      }}
      aria-label={nextIsZh ? "切换到中文" : "Switch to English"}
    >
      <span
        className={cn("site-lang-toggle__option", lang === "en" && "site-lang-toggle__option--active")}
      >
        EN
      </span>
      <span className="site-lang-toggle__divider" aria-hidden="true" />
      <span
        className={cn("site-lang-toggle__option", lang === "zh" && "site-lang-toggle__option--active")}
      >
        中文
      </span>
    </button>
  );
}
