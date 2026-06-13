import type { Components } from "react-markdown";
import type { MarkdownDisplayConfig } from "@/lib/markdown/display-config";

function cn(prefix: string, element: string): string {
  return `${prefix}__${element}`;
}

function textFromChildren(children: unknown): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(textFromChildren).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    const element = children as { props?: { children?: unknown } };
    return textFromChildren(element.props?.children);
  }

  return "";
}

function headingId(children: unknown) {
  return textFromChildren(children)
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function createMarkdownComponents(config: MarkdownDisplayConfig): Components {
  const p = config.classPrefix;

  const externalLinkProps = (href: string | undefined) => {
    if (!config.externalLinksInNewTab || !href?.startsWith("http")) {
      return {};
    }
    return { target: "_blank" as const, rel: "noopener noreferrer" };
  };

  return {
    h1: ({ children }) => <h1 id={headingId(children)} className={cn(p, "h1")}>{children}</h1>,
    h2: ({ children }) => <h2 id={headingId(children)} className={cn(p, "h2")}>{children}</h2>,
    h3: ({ children }) => <h3 id={headingId(children)} className={cn(p, "h3")}>{children}</h3>,
    h4: ({ children }) => <h4 id={headingId(children)} className={cn(p, "h4")}>{children}</h4>,
    p: ({ children }) => <p className={cn(p, "p")}>{children}</p>,
    ul: ({ children }) => <ul className={cn(p, "ul")}>{children}</ul>,
    ol: ({ children }) => <ol className={cn(p, "ol")}>{children}</ol>,
    li: ({ children }) => <li className={cn(p, "li")}>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className={cn(p, "blockquote")}>{children}</blockquote>
    ),
    hr: () => <hr className={cn(p, "hr")} />,
    strong: ({ children }) => <strong className={cn(p, "strong")}>{children}</strong>,
    em: ({ children }) => <em className={cn(p, "em")}>{children}</em>,
    del: ({ children }) => <del className={cn(p, "del")}>{children}</del>,
    a: ({ href, children }) => (
      <a href={href} className={config.linkClassName} {...externalLinkProps(href)}>
        {children}
      </a>
    ),
    img: ({ src, alt }) => (
      // eslint-disable-next-line @next/next/no-img-element -- markdown assets may be local paths
      <img src={src} alt={alt ?? ""} className={cn(p, "img")} loading="lazy" />
    ),
    code: ({ className: codeClassName, children }) => {
      const isBlock = codeClassName?.includes("language-");
      if (isBlock) {
        return <code className={codeClassName}>{children}</code>;
      }
      return <code className={cn(p, "code")}>{children}</code>;
    },
    pre: ({ children }) => <pre className={cn(p, "pre")}>{children}</pre>,
    table: ({ children }) => (
      <div className={cn(p, "table-wrap")}>
        <table className={cn(p, "table")}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className={cn(p, "thead")}>{children}</thead>,
    tbody: ({ children }) => <tbody className={cn(p, "tbody")}>{children}</tbody>,
    tr: ({ children }) => <tr className={cn(p, "tr")}>{children}</tr>,
    th: ({ children }) => <th className={cn(p, "th")}>{children}</th>,
    td: ({ children }) => <td className={cn(p, "td")}>{children}</td>,
  };
}
