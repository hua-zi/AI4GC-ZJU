"use client";

import Image from "next/image";
import { useState } from "react";
import { getInitials } from "@/lib/initials";

type MemberAvatarProps = {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeMap = {
  sm: { box: 56, className: "member-avatar member-avatar--sm" },
  md: { box: 80, className: "member-avatar" },
  lg: { box: 128, className: "member-avatar member-avatar--lg" },
  xl: { box: 140, className: "member-avatar member-avatar--xl" },
};

export default function MemberAvatar({
  src,
  name,
  size = "md",
  className,
}: MemberAvatarProps) {
  const { box, className: sizeClassName } = sizeMap[size];
  const avatarClassName = className ? `${sizeClassName} ${className}` : sizeClassName;
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div className={`${avatarClassName} member-avatar--fallback`} aria-label={`${name} photo`}>
        <span aria-hidden="true">{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={box}
      height={box}
      className={avatarClassName}
      sizes={`${box}px`}
      onError={() => setFailed(true)}
    />
  );
}
