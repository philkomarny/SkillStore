/**
 * document-store.ts — Thin wrapper around the Lambda-backed document APIs.
 *
 * Endpoints (all open, no auth header required):
 *   POST   esm_live_upload_document_post    — upload a file; returns { md5, status }
 *   GET    esm_live_get_document_get        — get document metadata + plain text by MD5
 *   GET    esm_live_list_documents_get      — list documents in a user's library
 *   DELETE esm_live_delete_document_delete  — remove from user's library (does not delete global record)
 *
 * Text extraction (PDF, DOCX, images) is handled internally by Lambda-to-Lambda invocation.
 * No public endpoint for extraction — it is triggered automatically by upload.
 *
 * Canonical endpoint inventory: https://github.com/philkomarny/SkillStore/issues/28
 * Related issues: #14 (document APIs), #15 (text extraction), #18 (context APIs that consume MD5s), #35 (multipart upload)
 */

const ENDPOINTS = {
  upload: "https://plvh12o05c.execute-api.us-west-2.amazonaws.com/prod/esm_live_upload_document_post",
  get:    "https://ikt0pbkcx1.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_document_get",
  list:   "https://durik7cyze.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_documents_get",
  delete: "https://l9h3c7vji5.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_document_delete",
};

function assertUserId(userId: string): void {
  if (!userId || userId.length === 0) throw new Error("userId is required");
}

/**
 * Upload a document to the global content-addressable store.
 * If the same file content (by MD5) was previously uploaded by any user,
 * returns the existing record immediately with no reprocessing.
 *
 * user_id: Google OAuth subject ID (session.user.id)
 */
export async function uploadDocument(
  buffer: Buffer,
  fileName: string,
  fileType: string,
  userId: string
): Promise<{ md5: string; status: string }> {
  assertUserId(userId);
  console.log("[document-store] uploadDocument →", ENDPOINTS.upload, "file:", fileName, "user:", userId);
  const form = new FormData();
  form.append("file", new Blob([buffer as unknown as ArrayBuffer], { type: fileType }), fileName);
  form.append("user_id", userId);
  const res = await fetch(ENDPOINTS.upload, { method: "POST", body: form });
  if (!res.ok) throw new Error(`uploadDocument failed: ${res.status}`);
  const data = await res.json();
  console.log("[document-store] uploadDocument ← md5:", data.md5, "status:", data.status);
  return data;
}

/**
 * Get document metadata and extracted plain text by MD5 hash.
 * Returns null if not found.
 * Plain text is only available when status: "ready".
 */
export async function getDocument(md5: string): Promise<any | null> {
  console.log("[document-store] getDocument → md5:", md5);
  const res = await fetch(`${ENDPOINTS.get}?md5=${encodeURIComponent(md5)}`);
  if (res.status === 404) { console.log("[document-store] getDocument ← 404 (not found)"); return null; }
  if (!res.ok) throw new Error(`getDocument failed: ${res.status}`);
  const data = await res.json();
  console.log("[document-store] getDocument ← status:", data.status);
  return data;
}

/**
 * List all documents in a user's library.
 * user_id: Google OAuth subject ID (session.user.id)
 */
export async function listDocuments(userId: string): Promise<any[]> {
  assertUserId(userId);
  console.log("[document-store] listDocuments → user:", userId);
  const res = await fetch(`${ENDPOINTS.list}?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`listDocuments failed: ${res.status}`);
  const data = await res.json();
  const result = Array.isArray(data) ? data : [];
  console.log("[document-store] listDocuments ←", result.length, "documents");
  return result;
}

/**
 * Remove a document from a user's library.
 * Does not delete the global record — other users sharing the same file are unaffected.
 * user_id: Google OAuth subject ID (session.user.id)
 */
export async function deleteDocument(md5: string, userId: string): Promise<void> {
  assertUserId(userId);
  const res = await fetch(
    `${ENDPOINTS.delete}?md5=${encodeURIComponent(md5)}&user_id=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`deleteDocument failed: ${res.status}`);
}
