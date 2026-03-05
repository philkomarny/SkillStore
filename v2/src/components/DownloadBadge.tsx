"use client";

import { useEffect, useState } from "react";

interface DownloadBadgeProps {
  count: number;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function DownloadBadge({ count }: DownloadBadgeProps) {
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    const handler = () => setDisplayCount((n) => n + 1);
    window.addEventListener("skill-downloaded", handler);
    return () => window.removeEventListener("skill-downloaded", handler);
  }, []);

  return (
    <span className="inline-flex items-stretch rounded overflow-hidden text-xs font-medium font-mono leading-none border border-terminal-border">
      <span className="bg-terminal-dark text-white px-2 py-1">downloads</span>
      <span className="bg-accent text-white px-2 py-1">{formatCount(displayCount)}</span>
    </span>
  );
}
