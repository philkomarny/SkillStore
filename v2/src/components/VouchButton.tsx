"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface VouchButtonProps {
  skillSlug: string;
  initialCount: number;
}

export default function VouchButton({
  skillSlug,
  initialCount,
}: VouchButtonProps) {
  const { data: session } = useSession();
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  const handleClap = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    // Optimistic update
    setCount((n) => n + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    await fetch(`/api/skills/${skillSlug}/vouch`, { method: "POST" });
  };

  return (
    <button
      onClick={handleClap}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors bg-terminal-surface text-muted hover:bg-terminal-border border border-transparent`}
      title={session ? "Clap for this skill" : "Sign in to clap"}
    >
      <span
        className={`text-base leading-none transition-transform ${animating ? "scale-125" : "scale-100"}`}
        style={{ display: "inline-block" }}
      >
        👏
      </span>
      <span>{count}</span>
    </button>
  );
}
