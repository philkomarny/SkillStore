"use client";

import { useState, useCallback } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";

interface ContextBuilderProps {
  onCreated: (profile: any) => void;
  onCancel: () => void;
}

export default function ContextBuilder({ onCreated, onCancel }: ContextBuilderProps) {
  const [name, setName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { files, uploadFiles, hasUploadedFiles, md5s } = useFileUpload();

  const handleConfirmName = () => {
    if (!name.trim()) return;
    console.log("[ContextBuilder] Name confirmed:", name.trim());
    setNameConfirmed(true);
  };

  const handleBuildContext = async () => {
    if (!nameConfirmed || md5s.length === 0) return;
    setBuilding(true);
    setError(null);
    console.log("[ContextBuilder] Building context:", { name: name.trim(), documents: md5s });

    try {
      const res = await fetch("/api/context/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), documents: md5s }),
      });

      let data: any;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        console.warn("[ContextBuilder] Build context failed:", data.error);
        setError(data.error || "Failed to build context.");
        setBuilding(false);
        return;
      }

      console.log("[ContextBuilder] Context built:", { id: data.id, status: data.status });
      onCreated({
        id: data.id,
        name: name.trim(),
        status: data.status,
        version: 1,
        context_markdown: null,
      });
    } catch (err: any) {
      console.error("[ContextBuilder] Build context error:", err?.message);
      setError(err?.message || "Something went wrong.");
    } finally {
      setBuilding(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length && nameConfirmed) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [nameConfirmed, uploadFiles]
  );

  return (
    <div className="rounded-lg border border-terminal-border bg-white overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-terminal-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1a1a1a]">
          New Context File
        </h3>
        <button
          onClick={onCancel}
          className="text-xs text-tertiary hover:text-muted"
        >
          Cancel
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Step 1: Name the context */}
        {!nameConfirmed && (
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Name your context file
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "Admissions 2024" or "Brand Guide"'
                className="flex-1 rounded-lg border border-terminal-border px-3 py-2 text-sm text-[#1a1a1a] placeholder-tertiary focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) handleConfirmName();
                }}
              />
              <button
                onClick={handleConfirmName}
                disabled={!name.trim()}
                className="rounded-lg bg-terminal-dark px-4 py-2 text-sm font-medium text-white hover:bg-terminal-titlebar disabled:opacity-40 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload documents */}
        {nameConfirmed && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span className="text-xs font-medium text-muted">
                {name}
              </span>
              <span className="text-[10px] text-tertiary">created</span>
            </div>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
                dragActive
                  ? "border-accent bg-accent/5"
                  : "border-terminal-border hover:border-muted"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp"
                className="hidden"
                id="context-upload"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    uploadFiles(e.target.files);
                  }
                }}
              />
              <label
                htmlFor="context-upload"
                className="cursor-pointer text-xs text-muted"
              >
                <span className="text-accent font-medium">Click to upload</span>{" "}
                or drag and drop
                <br />
                <span className="text-[11px] text-tertiary">
                  PDF, DOCX, TXT, MD, Images (max 10MB each)
                </span>
              </label>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-1">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-muted truncate">{file.name}</span>
                    <span
                      className={`text-[11px] ${
                        file.status === "uploaded"
                          ? "text-green-600"
                          : file.status === "error"
                          ? "text-red-500"
                          : "text-tertiary"
                      }`}
                    >
                      {file.status === "uploading"
                        ? "Uploading..."
                        : file.status === "uploaded"
                        ? "Ready"
                        : file.errorMsg || "Error"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Build context button */}
            {hasUploadedFiles && (
              <button
                onClick={handleBuildContext}
                disabled={building}
                className="w-full btn-claude disabled:opacity-50"
              >
                {building ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                    Building context with AI...
                  </span>
                ) : (
                  "Build Context"
                )}
              </button>
            )}
          </>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
