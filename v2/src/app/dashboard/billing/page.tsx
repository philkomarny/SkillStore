"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";

export default function BillingPage() {
  const { status } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/api/auth/signin");
    }
    if (status === "authenticated") {
      fetch("/api/user")
        .then((r) => r.json())
        .then((d) => {
          setProfile(d.profile);
          setLoading(false);
        });
    }
  }, [status]);

  const openPortal = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const startSubscription = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "level2" }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-terminal-surface rounded w-48" />
          <div className="h-32 bg-terminal-surface rounded-xl" />
        </div>
      </div>
    );
  }

  const isSubscribed =
    profile?.subscription_tier === "level2" &&
    profile?.subscription_status === "active";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a] mb-6">
        <span className="text-accent">#</span> Billing
      </h1>

      <div className="rounded-xl border border-terminal-border bg-white p-6 mb-6">
        <h2 className="text-sm font-semibold font-mono text-[#1a1a1a] mb-4">
          Current Plan
        </h2>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-[#1a1a1a]">
              {isSubscribed ? "Level 2 — Unlimited" : "Free"}
            </p>
            <p className="text-sm text-muted">
              {isSubscribed
                ? "$50/month — Unlimited expert-verified skills"
                : "Community skills only"}
            </p>
          </div>
          {isSubscribed && (
            <span className="rounded-full bg-success/20 text-green-700 px-3 py-1 text-xs font-medium font-mono">
              Active
            </span>
          )}
        </div>

        {isSubscribed ? (
          <button
            onClick={openPortal}
            className="rounded-lg border border-terminal-border bg-white px-4 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-terminal-surface transition-colors"
          >
            Manage Subscription
          </button>
        ) : (
          <button
            onClick={startSubscription}
            className="btn-claude"
          >
            Upgrade to Level 2 — $50/month
          </button>
        )}
      </div>

      {profile?.trial_started_at && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
          <h3 className="text-sm font-semibold font-mono text-[#1a1a1a] mb-1">
            Trial Status
          </h3>
          <p className="text-xs text-muted">
            Trial started{" "}
            {new Date(profile.trial_started_at).toLocaleDateString()}. You have
            access to all verified skills for 30 days.
          </p>
        </div>
      )}
    </div>
  );
}
