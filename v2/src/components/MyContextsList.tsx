"use client";

import { useState } from "react";

const CTX_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  building: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Building..." },
  ready: { bg: "bg-green-100", text: "text-green-700", label: "Ready" },
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
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">My Contexts</h2>
          <button
            onClick={onNewContext}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + New
          </button>
        </div>
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-gray-400 mb-3">
            No context files yet. Create one by uploading your institutional documents.
          </p>
          <button
            onClick={onNewContext}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Create Your First Context
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">My Contexts</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {contextProfiles.length} context{contextProfiles.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onNewContext}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + New
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
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
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
                isSelected ? "bg-blue-50 border-l-2 border-blue-600" : ""
              }`}
            >
              {/* Clickable context row — toggles selection for refinement */}
              <button
                onClick={() => onSelectContext(ctx.id)}
                className="flex-1 px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left min-w-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {ctx.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      v{ctx.version}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 ml-3 whitespace-nowrap">
                  {new Date(ctx.updated_at).toLocaleDateString()}
                </span>
              </button>

              {/* Delete icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingId(ctx.id);
                }}
                className="px-2 pr-4 py-3.5 text-gray-300 hover:text-red-500 transition-colors"
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
