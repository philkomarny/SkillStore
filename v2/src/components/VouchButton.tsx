"use client";

import { useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface VouchButtonProps {
  skillSlug: string;
  initialCount: number;
}

export default function VouchButton({ skillSlug, initialCount }: VouchButtonProps) {
  const { data: session } = useSession();
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = () => {
    const amount = pendingRef.current;
    if (amount === 0) return;
    pendingRef.current = 0;
    fetch(`/api/skills/${skillSlug}/vouch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    alert(JSON.stringify({
      slug: skillSlug,
      count: amount,
      count_type: "clap",
      user_id: session?.user?.id ?? null,
      ip_address: "client-side",
    }, null, 2));
  };

  const handleClap = () => {
    if (!session) {
      signIn("google");
      return;
    }

    setCount((n) => n + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    pendingRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 1500);
  };

  return (
    <button
      onClick={handleClap}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors bg-terminal-surface text-muted hover:bg-terminal-border border border-transparent"
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
