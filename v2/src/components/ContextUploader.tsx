"use client";

import { useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import MarkdownRenderer from "./MarkdownRenderer";

interface ContextUploaderProps {
  skillSlug: string;
  skillDescription: string;
  existingContext?: string | null;
}

interface UploadedFile {
  name: string;
  size: number;
  status: "uploading" | "uploaded" | "error";
}

export default function ContextUploader({
  skillSlug,
  skillDescription,
  existingContext,
}: ContextUploaderProps) {
  const { data: session } = useSession();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [context, setContext] = useState<string | null>(existingContext || null);
  const [processing, setProcessing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
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

  const handleGenerate = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/context/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillSlug, skillDescription }),
      });
      if (res.ok) {
        const data = await res.json();
        setContext(data.context);
        setFiles([]);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveEdit = async () => {
    const res = await fetch(`/api/context/${skillSlug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contextMarkdown: editText }),
    });
    if (res.ok) {
      setContext(editText);
      setEditing(false);
    }
  };

  if (!session) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Personalize This Skill
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Upload your documents to generate a personalized context file.
        </p>
        <button
          onClick={() => signIn("google")}
          className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Sign in to add context
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-900 px-5 pt-5 pb-3">
        {context ? "Your Context" : "Personalize This Skill"}
      </h3>

      {context && !editing ? (
        <div className="px-5 pb-5">
          <div className="prose-skill text-xs bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto mb-3">
            <MarkdownRenderer content={context} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditText(context);
                setEditing(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                await fetch(`/api/context/${skillSlug}`, { method: "DELETE" });
                setContext(null);
              }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      ) : editing ? (
        <div className="px-5 pb-5">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-48 rounded-lg border border-gray-200 p-3 text-xs font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveEdit}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <p className="text-xs text-gray-500 mb-3">
            Upload PDFs, docs, or text files. AI will generate a personalized
            context file.
          </p>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
              id="context-upload"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleUpload(e.target.files);
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
                PDF, DOCX, TXT, MD, Images (max 10MB)
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

          {/* Generate button */}
          {files.some((f) => f.status === "uploaded") && (
            <button
              onClick={handleGenerate}
              disabled={processing}
              className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {processing ? "Generating context..." : "Generate Context"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
