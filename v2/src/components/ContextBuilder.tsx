"use client";

import { useState, useCallback } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";

interface ContextBuilderProps {
  onCreated: (profile: any) => void;
  onCancel: () => void;
}

export default function ContextBuilder({ onCreated, onCancel }: ContextBuilderProps) {
  const [name, setName] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Upload hook — only active once profileId is set
  const { files, uploadFiles, hasUploadedFiles } = useFileUpload({
    contextProfileId: profileId || "",
  });

  const handleCreateProfile = async () => {
    if (!name.trim()) return;
    setError(null);

    try {
      const res = await fetch("/api/context/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to create profile");
        return;
      }

      const { profile } = await res.json();
      setProfileId(profile.id);
    } catch (err: any) {
      setError(err?.message || "Network error");
    }
  };

  const handleBuildContext = async () => {
    if (!profileId) return;
    setBuilding(true);
    setError(null);

    try {
      const res = await fetch("/api/context/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextProfileId: profileId }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to build context");
        setBuilding(false);
        return;
      }

      const data = await res.json();
      // Return the completed profile to the parent
      onCreated({
        id: profileId,
        name: name.trim(),
        status: "ready",
        version: data.version || 1,
        context_markdown: data.context,
      });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. The request may have timed out.");
    } finally {
      setBuilding(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length && profileId) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [profileId, uploadFiles]
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          New Context File
        </h3>
        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Step 1: Name the context */}
        {!profileId && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Name your context file
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "Admissions 2024" or "Brand Guide"'
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) handleCreateProfile();
                }}
              />
              <button
                onClick={handleCreateProfile}
                disabled={!name.trim()}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload documents */}
        {profileId && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-gray-700">
                {name}
              </span>
              <span className="text-[10px] text-gray-400">created</span>
            </div>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
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
                className="cursor-pointer text-xs text-gray-500"
              >
                <span className="text-blue-600 font-medium">Click to upload</span>{" "}
                or drag and drop
                <br />
                <span className="text-[11px] text-gray-400">
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
                    <span className="text-gray-700 truncate">{file.name}</span>
                    <span
                      className={`text-[11px] ${
                        file.status === "uploaded"
                          ? "text-green-600"
                          : file.status === "error"
                          ? "text-red-500"
                          : "text-gray-400"
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
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
