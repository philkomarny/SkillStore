"use client";

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
}

export default function MyContextsList({
  contextProfiles,
  selectedContextId,
  onSelectContext,
  onNewContext,
}: MyContextsListProps) {
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
          const style =
            CTX_STATUS_STYLES[ctx.status] || CTX_STATUS_STYLES.draft;
          return (
            <button
              key={ctx.id}
              onClick={() => onSelectContext(ctx.id)}
              className={`w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left ${
                isSelected ? "bg-blue-50 border-l-2 border-blue-600" : ""
              }`}
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
          );
        })}
      </div>
    </div>
  );
}
