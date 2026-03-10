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
  errorMsg?: string;
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
        console.log("[RefinePanel] No session — redirecting to sign in");
        signIn("google");
        return;
      }

      const fileArray = Array.from(fileList);
      console.log("[RefinePanel] Uploading", fileArray.length, "file(s):", fileArray.map((f) => f.name));

      for (const file of fileArray) {
        const entry: UploadedFile = {
          name: file.name,
          size: file.size,
          status: "uploading",
        };
        setFiles((prev) => [...prev, entry]);

        const markError = (msg: string) => {
          console.warn("[RefinePanel] Upload failed:", file.name, "—", msg);
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, status: "error", errorMsg: msg } : f
            )
          );
        };

        try {
          // Step 1: Get a signed upload URL from the server (small JSON, no file body)
          console.log("[RefinePanel] Step 1 — signing upload for:", file.name);
          const signRes = await fetch("/api/context/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sign",
              skillSlug,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            }),
          });

          if (!signRes.ok) {
            let errMsg = `Failed to prepare upload (${signRes.status})`;
            try { const d = await signRes.json(); errMsg = d.error || errMsg; } catch {}
            markError(errMsg);
            continue;
          }

          const { signedUrl, storagePath, contentType } = await signRes.json();
          console.log("[RefinePanel] Step 2 — uploading to Supabase Storage:", storagePath);

          // Step 2: Upload file directly to Supabase (bypasses Vercel 4.5MB limit)
          const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
          });

          if (!uploadRes.ok) {
            let errMsg = `Upload to storage failed (${uploadRes.status})`;
            try { const d = await uploadRes.json(); errMsg = d.message || d.error || errMsg; } catch {}
            markError(errMsg);
            continue;
          }

          console.log("[RefinePanel] Step 3 — confirming upload in DB:", file.name);
          // Step 3: Tell the server to record in DB
          const confirmRes = await fetch("/api/context/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "confirm",
              skillSlug,
              fileName: file.name,
              fileType: contentType,
              fileSize: file.size,
              storagePath,
            }),
          });

          if (!confirmRes.ok) {
            let errMsg = `Failed to record upload (${confirmRes.status})`;
            try { const d = await confirmRes.json(); errMsg = d.error || errMsg; } catch {}
            markError(errMsg);
            continue;
          }

          console.log("[RefinePanel] Upload complete:", file.name);
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, status: "uploaded" } : f
            )
          );
        } catch (err: any) {
          markError(err?.message || "Network error");
        }
      }
    },
    [session, skillSlug]
  );

  const handleRefine = async () => {
    console.log("[RefinePanel] Starting refinement for skill:", skillName, "(id:", userSkillId + ")");
    console.log("[RefinePanel] POST /api/skills/refine { userSkillId:", userSkillId, "}");
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
        console.log("[RefinePanel] Refinement complete — version:", data.version, "summary:", data.contextSummary?.slice(0, 80));
        setResult(data);
        setFiles([]);
        // Refresh the page to show updated skill data
        router.refresh();
      } else {
        try {
          const data = await res.json();
          console.warn("[RefinePanel] Refinement failed:", data.error, `(HTTP ${res.status})`);
          setError(data.error || `Refinement failed (${res.status})`);
        } catch {
          console.warn("[RefinePanel] Refinement failed: HTTP", res.status, res.statusText);
          setError(`Server error ${res.status}: ${res.statusText}`);
        }
      }
    } catch (err: any) {
      console.error("[RefinePanel] Refinement error:", err?.message);
      setError(err?.message || "Something went wrong during refinement. The request may have timed out.");
    } finally {
      setRefining(false);
    }
  };

  if (!session) {
    return (
      <div className="rounded-lg border border-terminal-border bg-white p-4">
        <p className="text-xs text-muted mb-2">Sign in to refine skills.</p>
        <button
          onClick={() => signIn("google")}
          className="w-full rounded-lg bg-terminal-dark px-4 py-2 text-sm font-medium text-white hover:bg-terminal-titlebar transition-colors"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-terminal-border bg-white overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-1">
          Refine This Skill
        </h3>
        <p className="text-xs text-muted">
          Upload your documents (PDFs, docs, text files). The AI will rewrite
          &ldquo;{skillName}&rdquo; with your specific context baked in.
        </p>
      </div>

      {/* Success result */}
      {result && (
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-success/10 border border-success/30 p-3 mb-3">
            <div className="text-xs font-semibold text-green-700 mb-1">
              Refinement Complete (v{result.version})
            </div>
            <p className="text-xs text-green-600 leading-relaxed">
              {result.contextSummary}
            </p>
          </div>
          <div className="rounded-lg bg-terminal-surface border border-terminal-border p-3 max-h-48 overflow-y-auto">
            <pre className="text-xs text-muted font-mono whitespace-pre-wrap leading-relaxed">
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
                ? "border-accent bg-accent/5"
                : "border-terminal-border hover:border-accent/30"
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
            <div className="mt-3 space-y-1">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <span className="text-[#1a1a1a] truncate">{file.name}</span>
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

          {/* Refine button */}
          {files.some((f) => f.status === "uploaded") && (
            <button
              onClick={handleRefine}
              disabled={refining}
              className="mt-3 w-full btn-claude justify-center disabled:opacity-50"
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
            className="w-full rounded-lg border border-terminal-border bg-terminal-surface px-4 py-2 text-xs font-medium text-muted hover:bg-terminal-border transition-colors"
          >
            Upload more documents &amp; refine again
          </button>
        </div>
      )}
    </div>
  );
}
