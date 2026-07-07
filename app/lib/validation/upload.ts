// Shared file-upload validation. The Supabase bucket enforces the same
// limits server-side (see supabase/migrations/003_storage_policies.sql);
// this exists so users get a friendly error before the upload starts.

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE_LABEL = '10MB';

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
};

export const ALLOWED_EXTENSIONS_LABEL = 'PDF, JPG, PNG, WEBP, DOC(X), XLS(X)';

/** File-input accept attribute matching the allowlist. */
export const FILE_INPUT_ACCEPT = Object.keys(ALLOWED_MIME_TYPES).join(',');

export function validateUploadFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_MIME_TYPES[file.type]) {
    return {
      ok: false,
      error: `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS_LABEL}.`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `File is too large. Maximum size is ${MAX_FILE_SIZE_LABEL}.`,
    };
  }
  return { ok: true };
}
