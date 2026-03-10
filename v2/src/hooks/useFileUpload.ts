"use client";

import { useState, useCallback } from "react";

export interface UploadedFile {
  name: string;
  size: number;
  status: "uploading" | "uploaded" | "error";
  md5?: string;
  errorMsg?: string;
}

// [DOCUMENT-STORE] contextProfileId removed — uploads now go to Lambda document store.
// Each file returns an md5 which is collected and passed to POST /contexts at Build Context time.
// Previously: sign → PUT to Supabase Storage → confirm (serial, 3 round-trips per file).
// Now: POST /api/context/upload with FormData → { md5, status } (parallel, 1 round-trip per file).
export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(async (fileList: FileList) => {
    setIsUploading(true);
    const fileArray = Array.from(fileList);

    // Register all files as uploading before any async work
    setFiles((prev) => [
      ...prev,
      ...fileArray.map((f) => ({ name: f.name, size: f.size, status: "uploading" as const })),
    ]);

    // Upload all files in parallel — one round-trip each to Lambda document store
    await Promise.all(
      fileArray.map(async (file) => {
        const markError = (msg: string) =>
          setFiles((prev) =>
            prev.map((f) => (f.name === file.name ? { ...f, status: "error", errorMsg: msg } : f))
          );

        try {
          const form = new FormData();
          form.append("file", file);

          const res = await fetch("/api/context/upload", { method: "POST", body: form });

          if (!res.ok) {
            let errMsg = `Upload failed (${res.status})`;
            try {
              const d = await res.json();
              errMsg = d.error || errMsg;
            } catch {}
            markError(errMsg);
            return;
          }

          const { md5 } = await res.json();
          setFiles((prev) =>
            prev.map((f) => (f.name === file.name ? { ...f, status: "uploaded", md5 } : f))
          );
        } catch (err: any) {
          markError(err?.message || "Network error");
        }
      })
    );

    setIsUploading(false);
  }, []);

  const clearFiles = useCallback(() => setFiles([]), []);

  const hasUploadedFiles = files.some((f) => f.status === "uploaded");
  const md5s = files.filter((f) => f.status === "uploaded" && f.md5).map((f) => f.md5!);

  return { files, uploadFiles, clearFiles, isUploading, hasUploadedFiles, md5s };
}
