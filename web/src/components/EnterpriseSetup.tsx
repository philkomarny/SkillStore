"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

interface EnterpriseStatus {
  configured: boolean;
  authenticated: boolean;
  owner?: string;
  repo?: string;
}

export default function EnterpriseSetup() {
  const { data: session, status: authStatus } = useSession();
  const [status, setStatus] = useState<EnterpriseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields — no token needed (comes from OAuth session)
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");

  useEffect(() => {
    if (authStatus === "loading") return;
    if (!session) {
      setLoading(false);
      return;
    }
    fetch("/api/enterprise")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, authStatus]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      setStatus(data);
      setOwner("");
      setRepo("");
    } catch {
      setError("Network error. Try again.");
    }
    setSubmitting(false);
  };

  const handleDisconnect = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/enterprise", { method: "DELETE" });
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to disconnect.");
    }
    setSubmitting(false);
  };

  if (loading || authStatus === "loading") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  // Not signed in
  if (!session) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          Sign in to get started
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Connect your GitHub account to set up your enterprise context
          repository. Your GitHub OAuth token provides secure access to your
          private repos.
        </p>
        <button
          onClick={() => signIn("github")}
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </button>
      </div>
    );
  }

  // Connected state
  if (status?.configured) {
    return (
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <svg
              className="h-5 w-5 text-white"
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
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Enterprise context connected
            </p>
            <p className="text-xs text-gray-500">
              Reading context from{" "}
              <code className="bg-green-100 px-1 rounded font-mono">
                {status.owner}/{status.repo}
              </code>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-4">
          When you view a skill, the catalog will check your context repo for a
          matching{" "}
          <code className="bg-green-100 px-1 rounded">context.md</code> and
          display it alongside the skill. You can also add context directly from
          any skill page.
        </p>

        <button
          onClick={handleDisconnect}
          disabled={submitting}
          className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
        >
          {submitting ? "Disconnecting..." : "Disconnect enterprise context"}
        </button>
      </div>
    );
  }

  // Setup form — just owner + repo (token comes from OAuth)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-2">
        Connect your context repo
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Enter your GitHub context repository details. Your GitHub OAuth token
        (from signing in) provides access — no personal access token needed.
      </p>

      <form onSubmit={handleConnect} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            GitHub owner or organization
          </label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="my-university"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Repository name
          </label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="skillstore-context"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !owner || !repo}
          className="w-full bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Verifying..." : "Connect context repo"}
        </button>
      </form>
    </div>
  );
}
