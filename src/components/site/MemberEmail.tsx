import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type MemberEmailProps = {
  email: string;
  className?: string;
};

export default function MemberEmail({ email, className }: MemberEmailProps) {
  return (
    <a href={`mailto:${email}`} className={cn("member-email", className)}>
      <Mail className="member-email__icon" aria-hidden size={16} strokeWidth={2} />
      <span className="member-email__address">{email}</span>
    </a>
  );
}
