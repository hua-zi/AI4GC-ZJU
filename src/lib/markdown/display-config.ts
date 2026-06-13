import type ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import { markdownRemarkPlugins } from "@/lib/content/markdown";

export type MarkdownDisplayVariant = "blog" | "profile" | "home";

type RehypePlugins = NonNullable<React.ComponentProps<typeof ReactMarkdown>["rehypePlugins"]>;

/** Per-variant typography and behavior for rendered Markdown. */
export type MarkdownDisplayConfig = {
  /** BEM prefix for element class names, e.g. `blog-post-body`. */
  classPrefix: string;
  /** Anchor class names applied to inline links. */
  linkClassName: string;
  /** Rehype plugins (math, sanitizers, etc.). */
  rehypePlugins: RehypePlugins;
  /** Open http(s) links in a new tab. */
  externalLinksInNewTab: boolean;
};

export const markdownDisplayPresets: Record<MarkdownDisplayVariant, MarkdownDisplayConfig> = {
  blog: {
    classPrefix: "blog-post-body",
    linkClassName: "site-link site-link--inline",
    rehypePlugins: [rehypeKatex],
    externalLinksInNewTab: true,
  },
  profile: {
    classPrefix: "profile-markdown-body",
    linkClassName: "site-link site-link--inline",
    rehypePlugins: [rehypeKatex],
    externalLinksInNewTab: true,
  },
  home: {
    classPrefix: "home-prose-body",
    linkClassName: "site-link site-link--inline",
    rehypePlugins: [rehypeKatex],
    externalLinksInNewTab: true,
  },
};

export function resolveMarkdownDisplayConfig(
  variant: MarkdownDisplayVariant,
  overrides?: Partial<MarkdownDisplayConfig>,
): MarkdownDisplayConfig {
  return { ...markdownDisplayPresets[variant], ...overrides };
}

export const markdownRemarkPluginList = [...markdownRemarkPlugins];
