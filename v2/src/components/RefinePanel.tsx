"use client";

import { useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface RefinePanelProps {
  userSkillId: string;
  skillSlug: string;
  skillName: string;
}

interface UploadedFile {
  name: string;
  size: number;
  status: "uploading" | "uploaded" | "error";
}

export default function RefinePanel({
  userSkillId,
  skillSlug,
  skillName,
}: RefinePanelProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [refining, setRefining] = useState(false);
  const [result, setResult] = useState<{
    refinedContent: string;
    contextSummary: string;
    version: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(
    async (fileList: FileList) => {
      if (!session) {
        signIn("google");
        return;
      }

      for (const file of Array.from(fileList)) {
        const entry: UploadedFile = {
          name: file.name,
          size: file.size,
          status: "uploading",
        };
        setFiles((prev) => [...prev, entry]);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("skillSlug", skillSlug);

        try {
          const res = await fetch("/api/context/upload", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            setFiles((prev) =>
              prev.map((f) =>
                f.name === file.name ? { ...f, status: "uploaded" } : f
              )
            );
          } else {
            setFiles((prev) =>
              prev.map((f) =>
                f.name === file.name ? { ...f, status: "error" } : f
              )
            );
          }
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, status: "error" } : f
            )
          );
        }
      }
    },
    [session, skillSlug]
  );

  const handleRefine = async () => {
    setRefining(true);
    setError(null);
    try {
      const res = await fetch("/api/skills/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userSkillId }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setFiles([]);
        // Refresh the page to show updated skill data
        router.refresh();
      } else {
        try {
          const data = await res.json();
          setError(data.error || `Refinement failed (${res.status})`);
        } catch {
          setError(`Server error ${res.status}: ${res.statusText}`);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong during refinement. The request may have timed out.");
    } finally {
      setRefining(false);
    }
  };

  if (!session) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500 mb-2">Sign in to refine skills.</p>
        <button
          onClick={() => signIn("google")}
          className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Refine This Skill
        </h3>
        <p className="text-xs text-gray-500">
          Upload your documents (PDFs, docs, text files). The AI will rewrite
          &ldquo;{skillName}&rdquo; with your specific context baked in.
        </p>
      </div>

      {/* Success result */}
      {result && (
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-3">
            <div className="text-xs font-semibold text-green-700 mb-1">
              Refinement Complete (v{result.version})
            </div>
            <p className="text-xs text-green-600 leading-relaxed">
              {result.contextSummary}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 max-h-48 overflow-y-auto">
            <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
              {result.refinedContent.slice(0, 1500)}
              {result.refinedContent.length > 1500 && "\n\n... (view full content above)"}
            </pre>
          </div>
        </div>
      )}

      {/* Upload area */}
      {!result && (
        <div className="px-4 pb-4">
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
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files.length) {
                handleUpload(e.dataTransfer.files);
              }
            }}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp"
              className="hidden"
              id="refine-upload"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleUpload(e.target.files);
                }
              }}
            />
            <label
              htmlFor="refine-upload"
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
            <div className="mt-3 space-y-1">
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
                      : "Error"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Refine button */}
          {files.some((f) => f.status === "uploaded") && (
            <button
              onClick={handleRefine}
              disabled={refining}
              className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {refining ? (
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
                  Refining with AI...
                </span>
              ) : (
                "Refine Skill"
              )}
            </button>
          )}

          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Refine again after success */}
      {result && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setResult(null)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Upload more documents &amp; refine again
          </button>
        </div>
      )}
    </div>
  );
}
