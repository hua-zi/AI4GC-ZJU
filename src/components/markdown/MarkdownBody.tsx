import ReactMarkdown from "react-markdown";
import {
  markdownRemarkPluginList,
  resolveMarkdownDisplayConfig,
  type MarkdownDisplayConfig,
  type MarkdownDisplayVariant,
} from "@/lib/markdown/display-config";
import { createMarkdownComponents } from "@/lib/markdown/markdown-components";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";

type MarkdownBodyProps = {
  content: string;
  variant?: MarkdownDisplayVariant;
  className?: string;
  /** Merge overrides onto the variant preset (classPrefix, link style, plugins, …). */
  display?: Partial<MarkdownDisplayConfig>;
};

export default function MarkdownBody({
  content,
  variant = "blog",
  className,
  display,
}: MarkdownBodyProps) {
  const config = resolveMarkdownDisplayConfig(variant, display);
  const components = createMarkdownComponents(config);

  return (
    <div className={cn("markdown-body", config.classPrefix, className)}>
      <ReactMarkdown
        remarkPlugins={markdownRemarkPluginList}
        rehypePlugins={config.rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
