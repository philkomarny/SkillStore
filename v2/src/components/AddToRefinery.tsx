"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AddToRefineryProps {
  skillSlug: string;
}

export default function AddToRefinery({ skillSlug }: AddToRefineryProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/skills/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillSlug }),
      });

      if (res.ok) {
        const data = await res.json();
        // Navigate to the dashboard with skill selected
        router.push(`/dashboard?skill=${data.userSkill.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add skill");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        Personalize This Skill
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Import this skill into Your Refinery to customize it with your
        documents, language, and processes.
      </p>
      <button
        onClick={handleAdd}
        disabled={loading}
        className="btn-claude block w-full"
      >
        {!session
          ? "Sign in to Add"
          : loading
          ? "Adding..."
          : "Add to Your Refinery"}
      </button>
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
