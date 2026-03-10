"use client";

import { useState } from "react";

const CTX_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-terminal-surface", text: "text-muted", label: "Draft" },
  building: { bg: "bg-warning/20", text: "text-yellow-700", label: "Building..." },
  ready: { bg: "bg-success/20", text: "text-green-700", label: "Ready" },
  error: { bg: "bg-red-100", text: "text-red-700", label: "Error" },
};

interface MyContextsListProps {
  contextProfiles: any[];
  selectedContextId: string | null;
  onSelectContext: (id: string) => void;
  onNewContext: () => void;
  onDeleteContext: (id: string) => Promise<void>;
}

export default function MyContextsList({
  contextProfiles,
  selectedContextId,
  onSelectContext,
  onNewContext,
  onDeleteContext,
}: MyContextsListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const ctx = contextProfiles.find((c) => c.id === id);
    console.log("[MyContextsList] Deleting context:", ctx?.name ?? id);
    setDeletingId(id);
    try {
      await onDeleteContext(id);
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  if (contextProfiles.length === 0) {
    return (
      <div className="rounded-xl border border-terminal-border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-terminal-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">My Contexts</h2>
          <button
            onClick={onNewContext}
            className="text-xs text-accent hover:text-accent-hover font-medium"
          >
            + New
          </button>
        </div>
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-tertiary mb-3">
            No context files yet. Create one by uploading your institutional documents.
          </p>
          <button
            onClick={onNewContext}
            className="text-xs text-accent hover:text-accent-hover font-medium"
          >
            + Create Your First Context
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-terminal-border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-terminal-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1a1a1a]">My Contexts</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-tertiary font-mono">
            {contextProfiles.length} context{contextProfiles.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onNewContext}
            className="text-xs text-accent hover:text-accent-hover font-medium"
          >
            + New
          </button>
        </div>
      </div>
      <div className="divide-y divide-terminal-border">
        {contextProfiles.map((ctx) => {
          const isSelected = ctx.id === selectedContextId;
          const isConfirming = confirmingId === ctx.id;
          const isDeleting = deletingId === ctx.id;
          const style =
            CTX_STATUS_STYLES[ctx.status] || CTX_STATUS_STYLES.draft;

          if (isConfirming) {
            return (
              <div
                key={ctx.id}
                className="px-5 py-3.5 flex items-center justify-between bg-red-50"
              >
                <span className="text-xs text-red-700">
                  Delete <strong>{ctx.name}</strong>?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(ctx.id)}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    disabled={isDeleting}
                    className="rounded-lg border border-terminal-border bg-white px-3 py-1 text-xs font-medium text-muted hover:bg-terminal-surface disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={ctx.id}
              className={`flex items-center transition-colors ${
                isSelected ? "bg-accent/5 border-l-2 border-accent" : ""
              }`}
            >
              <button
                onClick={() => { console.log("[MyContextsList] Clicked context:", ctx.name, "(id:", ctx.id + ", status:", ctx.status + ")"); onSelectContext(ctx.id); }}
                className="flex-1 px-5 py-3.5 flex items-center justify-between hover:bg-terminal-surface transition-colors text-left min-w-0 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1a1a1a] truncate">
                      {ctx.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-[10px] text-tertiary font-mono">
                      v{ctx.version}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-tertiary ml-3 whitespace-nowrap font-mono">
                  {new Date(ctx.updated_at).toLocaleDateString()}
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("[MyContextsList] Delete requested for context:", ctx.name);
                  setConfirmingId(ctx.id);
                }}
                className="px-2 pr-4 py-3.5 text-terminal-border hover:text-red-500 transition-colors"
                title="Delete context"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
