interface TagProps {
  label: string;
  className?: string;
}

export default function Tag({ label, className = "site-tag" }: TagProps) {
  return <span className={className}>{label}</span>;
}
