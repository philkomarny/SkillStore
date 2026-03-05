"use client";

import { VERIFICATION_BADGES } from "@/lib/types";
import CategoryIcon from "./CategoryIcon";

interface VerificationBadgeProps {
  level: number;
  size?: "sm" | "md";
}

export default function VerificationBadge({
  level,
  size = "sm",
}: VerificationBadgeProps) {
  const badge = VERIFICATION_BADGES[level] || VERIFICATION_BADGES[0];

  const sizeClasses = size === "md" ? "text-sm px-2.5 py-1" : "text-xs px-2 py-0.5";
  const iconSize = size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";

  const colorClasses =
    level === 2
      ? "bg-success/10 text-green-700 border-success/30"
      : level === 1
      ? "bg-accent/10 text-accent border-accent/30"
      : "bg-terminal-surface text-muted border-terminal-border";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses} ${colorClasses}`}
      title={badge.description}
    >
      <CategoryIcon name={badge.icon} className={iconSize} />
      <span>{badge.label}</span>
    </span>
  );
}
