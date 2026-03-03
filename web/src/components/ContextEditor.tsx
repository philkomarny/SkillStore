"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface ContextEditorProps {
  dept: string;
  skillName: string;
  existingContent?: string | null;
  hasEnterpriseConfig: boolean;
}

function getTemplate(dept: string, skillName: string): string {
  const title = skillName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return `# ${title} — Enterprise Context

## Institution
<!-- Your institution name and relevant details -->
- Name: [Your University]
- Type: [Public/Private, 4-year/2-year]
- Size: [Enrollment size]

## Department-Specific Details
<!-- Add context specific to your ${dept} department -->
- Key programs:
- Target audiences:
- Current tools/systems:

## Voice & Tone
<!-- How should this skill communicate for your institution? -->
- Brand voice:
- Formality level:
- Key phrases to use:
- Phrases to avoid:

## Key Data
<!-- Institution-specific data this skill should reference -->
- Important dates/deadlines:
- Statistics/metrics:
- Contact information:

## Additional Context
<!-- Any other information that helps this skill work better for your institution -->
`;
}

export default function ContextEditor({
  dept,
  skillName,
  existingContent,
  hasEnterpriseConfig,
}: ContextEditorProps) {
  const { data: session } = useSession();
  const [state, setState] = useState<
    "idle" | "editing" | "pushing" | "success"
  >("idle");
  const [content, setContent] = useState(
    existingContent || getTemplate(dept, skillName)
  );
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Not signed in
  if (!session) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
        <p className="text-xs text-gray-600 mb-2 font-medium">
          Add enterprise context
        </p>
        <p className="text-[11px] text-gray-500 mb-3">
          Sign in with GitHub to add your institution&apos;s context to this
          skill.
        </p>
        <button
          onClick={() => signIn("github")}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Sign in to get started
        </button>
      </div>
    );
  }

  // Signed in but no enterprise config
  if (!hasEnterpriseConfig) {
    return (
      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-4">
        <p className="text-xs text-blue-700 mb-1 font-medium">
          Set up your context repo
        </p>
        <p className="text-[11px] text-blue-600 mb-2">
          Connect your enterprise context repository to add and manage context
          for skills.
        </p>
        <a
          href="/enterprise"
          className="text-xs text-blue-700 hover:text-blue-900 font-medium underline"
        >
          Go to Enterprise setup
        </a>
      </div>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="h-4 w-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-xs font-semibold text-green-800">
            Context pushed to your repo
          </p>
        </div>
        {resultUrl && (
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-700 hover:text-green-900 underline"
          >
            View on GitHub
          </a>
        )}
        <button
          onClick={() => setState("idle")}
          className="block text-xs text-gray-500 hover:text-gray-700 mt-2"
        >
          Done
        </button>
      </div>
    );
  }

  // Idle state — show button
  if (state === "idle") {
    return (
      <button
        onClick={() => setState("editing")}
        className="w-full rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4 hover:bg-blue-50 hover:border-blue-400 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span className="text-xs font-medium text-blue-700">
            {existingContent ? "Edit context" : "Add to context repo"}
          </span>
        </div>
      </button>
    );
  }

  // Editing / pushing state
  const handlePush = async () => {
    setError(null);
    setState("pushing");

    try {
      const res = await fetch("/api/context/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dept,
          skillName,
          content,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to push");
        setState("editing");
        return;
      }

      setResultUrl(data.htmlUrl || null);
      setState("success");
    } catch {
      setError("Network error. Try again.");
      setState("editing");
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-900">
          {existingContent ? "Edit Context" : "Add Context"}
        </h4>
        <button
          onClick={() => setState("idle")}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-64 rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        placeholder="Enter your context markdown..."
      />

      <p className="text-[10px] text-gray-400 mt-1 mb-3">
        This will be pushed as{" "}
        <code className="bg-gray-100 px-1 rounded">
          {dept}/{skillName}/context.md
        </code>{" "}
        in your context repo.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
          <p className="text-[11px] text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handlePush}
        disabled={state === "pushing" || !content.trim()}
        className="w-full bg-blue-600 text-white text-xs font-medium rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {state === "pushing" ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Pushing...
          </span>
        ) : (
          "Push to context repo"
        )}
      </button>
    </div>
  );
}
