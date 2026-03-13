"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface ClapButtonProps {
  skillSlug: string;
  initialCount: number;
}

export default function ClapButton({ skillSlug, initialCount }: ClapButtonProps) {
  const { data: session } = useSession();
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ipRef = useRef<string>("unknown");

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => { ipRef.current = d.ip; console.log("[clap] ip resolved"); })
      .catch(() => console.warn("[clap] ip fetch failed"));

    fetch(`https://iw0ojycun6.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_item_count_get?slug=${skillSlug}&count_type=clap`)
      .then((r) => r.json())
      .then((d) => {
        console.log("[clap] count fetched:", d.total);
        if (typeof d.total === "number") setCount(d.total);
      })
      .catch((err) => console.warn("[clap] count fetch failed:", err));
  }, [skillSlug]);

  const flush = () => {
    const amount = pendingRef.current;
    if (amount === 0) return;
    pendingRef.current = 0;
    console.log("[clap] flushing amount:", amount, "slug:", skillSlug);
    fetch("https://sivvn9tsil.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_item_count_post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: skillSlug,
        count: amount,
        count_type: "clap",
        user_id: session?.user?.id ?? null,
        ip_address: ipRef.current,
      }),
    })
      .then((r) => console.log("[clap] post status:", r.status))
      .catch((err) => console.error("[clap] post failed:", err));
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
      disabled={!session}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors bg-terminal-surface text-muted border border-transparent disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-terminal-border"
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
