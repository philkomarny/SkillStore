"use client";

import { useState, useCallback } from "react";

export interface UploadedFile {
  name: string;
  size: number;
  status: "uploading" | "uploaded" | "error";
  errorMsg?: string;
}

interface UseFileUploadOptions {
  contextProfileId: string;
}

export function useFileUpload({ contextProfileId }: UseFileUploadOptions) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(
    async (fileList: FileList) => {
      setIsUploading(true);

      for (const file of Array.from(fileList)) {
        const entry: UploadedFile = {
          name: file.name,
          size: file.size,
          status: "uploading",
        };
        setFiles((prev) => [...prev, entry]);

        const markError = (msg: string) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, status: "error", errorMsg: msg } : f
            )
          );
        };

        try {
          // Step 1: Get a signed upload URL from the server
          const signRes = await fetch("/api/context/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sign",
              contextProfileId,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            }),
          });

          if (!signRes.ok) {
            let errMsg = `Failed to prepare upload (${signRes.status})`;
            try {
              const d = await signRes.json();
              errMsg = d.error || errMsg;
            } catch {}
            markError(errMsg);
            continue;
          }

          const { signedUrl, storagePath, contentType } = await signRes.json();

          // Step 2: Upload file directly to Supabase (bypasses Vercel 4.5MB limit)
          const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
          });

          if (!uploadRes.ok) {
            let errMsg = `Upload to storage failed (${uploadRes.status})`;
            try {
              const d = await uploadRes.json();
              errMsg = d.message || d.error || errMsg;
            } catch {}
            markError(errMsg);
            continue;
          }

          // Step 3: Tell the server to record in DB
          const confirmRes = await fetch("/api/context/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "confirm",
              contextProfileId,
              fileName: file.name,
              fileType: contentType,
              fileSize: file.size,
              storagePath,
            }),
          });

          if (!confirmRes.ok) {
            let errMsg = `Failed to record upload (${confirmRes.status})`;
            try {
              const d = await confirmRes.json();
              errMsg = d.error || errMsg;
            } catch {}
            markError(errMsg);
            continue;
          }

          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, status: "uploaded" } : f
            )
          );
        } catch (err: any) {
          markError(err?.message || "Network error");
        }
      }

      setIsUploading(false);
    },
    [contextProfileId]
  );

  const clearFiles = useCallback(() => setFiles([]), []);

  const hasUploadedFiles = files.some((f) => f.status === "uploaded");

  return { files, uploadFiles, clearFiles, isUploading, hasUploadedFiles };
}
