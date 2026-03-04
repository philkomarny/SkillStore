"use client";

import { VERIFICATION_BADGES } from "@/lib/types";

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

  const colorClasses =
    level === 2
      ? "bg-green-50 text-green-700 border-green-200"
      : level === 1
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses} ${colorClasses}`}
      title={badge.description}
    >
      <span>{badge.emoji}</span>
      <span>{badge.label}</span>
    </span>
  );
}
