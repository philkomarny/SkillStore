"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { CATEGORIES } from "@/lib/types";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import TerminalWindow from "@/components/TerminalWindow";

export default function SubmitPage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      signIn("google");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/skills/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          content,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <TerminalWindow title="submission-complete" size="sm">
          <div className="p-6 text-center">
            <p className="text-success font-mono text-sm mb-2">$ submit --status</p>
            <p className="text-white/90 text-sm font-mono">Skill submitted successfully.</p>
          </div>
        </TerminalWindow>
        <h1 className="text-2xl font-bold font-mono text-[#1a1a1a] mt-6 mb-2">
          Skill Submitted!
        </h1>
        <p className="text-muted mb-6">
          Your skill has been submitted for review. Community skills are published
          immediately. Bot verification will run automatically.
        </p>
        <a
          href="/skills"
          className="btn-claude inline-flex"
        >
          <span className="font-mono text-xs opacity-70">$</span> browse --skills
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold font-mono text-[#1a1a1a] mb-2">
        <span className="text-accent">#</span> Submit a Skill
      </h1>
      <p className="text-sm text-muted mb-8">
        Share your Claude skill with the community. All submissions start as
        Community and can be promoted through verification.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Skill Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Grant Writing Assistant"
            className="w-full rounded-lg border border-terminal-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="A short description of what this skill does"
            className="w-full rounded-lg border border-terminal-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full rounded-lg border border-terminal-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          >
            <option value="">Select a category</option>
            {Object.values(CATEGORIES).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Comma-separated tags (e.g., writing, grants, research)"
            className="w-full rounded-lg border border-terminal-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-[#1a1a1a]">
              Skill Content (Markdown)
            </label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-xs text-accent hover:text-accent-hover font-medium"
            >
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="prose-skill rounded-lg border border-terminal-border p-4 min-h-[200px] bg-terminal-surface">
              <MarkdownRenderer content={content} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              placeholder="Write your skill instructions in Markdown..."
              className="w-full rounded-lg border border-terminal-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-claude justify-center disabled:opacity-50"
        >
          {!session
            ? "Sign in to Submit"
            : submitting
            ? "Submitting..."
            : "Submit Skill"}
        </button>
      </form>
    </div>
  );
}
