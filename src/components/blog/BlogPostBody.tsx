import MarkdownBody from "@/components/markdown/MarkdownBody";

type BlogPostBodyProps = {
  content: string;
};

export default function BlogPostBody({ content }: BlogPostBodyProps) {
  return <MarkdownBody content={content} variant="blog" />;
}
