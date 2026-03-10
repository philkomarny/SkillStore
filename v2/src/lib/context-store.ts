/**
 * context-store.ts — Thin wrapper around the Lambda-backed context APIs.
 *
 * Endpoints (all open, no auth header required):
 *   POST   esm_live_add_context_post     — create context from MD5 array
 *   GET    esm_live_get_context_get      — get context by ID
 *   GET    esm_live_list_contexts_get    — list contexts for a user
 *   DELETE esm_live_delete_context_delete — delete context
 *
 * Related issues: #18 (context APIs), #14 (document APIs that provide MD5s)
 */

const ENDPOINTS = {
  add:    "https://vzy0yc5j2l.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_context_post",
  get:    "https://hgvubq1ga7.execute-api.us-west-2.amazonaws.com/prod/esm_live_get_context_get",
  list:   "https://pr0dbmvk19.execute-api.us-west-2.amazonaws.com/prod/esm_live_list_contexts_get",
  delete: "https://aj8uetqx8e.execute-api.us-west-2.amazonaws.com/prod/esm_live_delete_context_delete",
};

/**
 * Normalize Lambda context shape to what the frontend expects.
 * Lambda returns { contextId, name, status, createdAt, markdown?, documents? }
 * Frontend expects { id, name, status, version, updated_at, context_markdown }
 */
function normalize(ctx: any) {
  return {
    id: ctx.contextId,
    name: ctx.name,
    status: ctx.status,
    version: 1,
    updated_at: ctx.createdAt,
    context_markdown: ctx.markdown ?? null,
    documents: ctx.documents ?? [],
  };
}

/**
 * Create a context from a list of document MD5 hashes.
 * Synthesis is synchronous — Lambda calls Bedrock inline and returns status: "ready" directly.
 * Typical latency: 5–15s depending on total document size.
 *
 * Requires: all MD5s must exist in the document store (#14).
 * user_id: Google OAuth subject ID (session.user.id)
 */
function assertUserId(userId: string): void {
  if (!userId || userId.length === 0) throw new Error("userId is required");
}

export async function createContext(
  name: string,
  documents: string[],
  userId: string
): Promise<{ id: string; status: string }> {
  assertUserId(userId);
  const res = await fetch(ENDPOINTS.add, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, documents, user_id: userId }),
  });
  if (!res.ok) throw new Error(`createContext failed: ${res.status}`);
  const data = await res.json();
  return { id: data.contextId, status: data.status };
}

/**
 * Get a context by ID.
 * Returns normalized context with markdown and source document list when status: "ready".
 * user_id: Google OAuth subject ID (session.user.id) — required for user-scoped S3 path.
 */
export async function getContext(contextId: string, userId: string): Promise<any | null> {
  assertUserId(userId);
  const res = await fetch(
    `${ENDPOINTS.get}?contextId=${encodeURIComponent(contextId)}&user_id=${encodeURIComponent(userId)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getContext failed: ${res.status}`);
  return normalize(await res.json());
}

/**
 * List all contexts for a user.
 * user_id: Google OAuth subject ID (session.user.id)
 */
export async function listContexts(userId: string): Promise<any[]> {
  assertUserId(userId);
  const res = await fetch(`${ENDPOINTS.list}?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`listContexts failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data.map(normalize) : [];
}

/**
 * Delete a context. Does not affect the underlying documents.
 * user_id: Google OAuth subject ID (session.user.id) — required for user-scoped S3 path.
 */
export async function deleteContext(contextId: string, userId: string): Promise<void> {
  assertUserId(userId);
  const res = await fetch(
    `${ENDPOINTS.delete}?contextId=${encodeURIComponent(contextId)}&user_id=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`deleteContext failed: ${res.status}`);
}
