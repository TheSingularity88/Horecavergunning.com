import { z } from 'zod';

// Knowledge-base upload validation. Narrower than the general upload
// allowlist on purpose: the KB holds policy/instruction documents, so images
// are not accepted as source documents (embedded images inside a .docx are a
// separate, opt-in concern handled at analysis time).

export const KB_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // matches the bucket cap
export const KB_MAX_FILE_SIZE_LABEL = '10MB';

export const KB_ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
};

export const KB_ALLOWED_EXTENSIONS_LABEL = 'PDF, DOC(X), XLS(X)';
export const KB_FILE_INPUT_ACCEPT = Object.keys(KB_ALLOWED_MIME_TYPES).join(',');

export function validateKbFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!KB_ALLOWED_MIME_TYPES[file.type]) {
    return {
      ok: false,
      error: `File type not allowed. Allowed: ${KB_ALLOWED_EXTENSIONS_LABEL}.`,
    };
  }
  if (file.size > KB_MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `File is too large. Maximum size is ${KB_MAX_FILE_SIZE_LABEL}.`,
    };
  }
  return { ok: true };
}

/**
 * Registers a row for a file the browser already uploaded to the kb bucket.
 * storage_path is the object path INSIDE bucket 'kb' (the bucket name is not
 * part of it): {uuid}/{filename}. Anything else is rejected so the action can
 * never be talked into registering (and later deleting) an object elsewhere.
 */
export const insertKbDocumentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1).max(200),
  storage_path: z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[^/\\]{1,200}$/i),
  mime_type: z.enum(Object.keys(KB_ALLOWED_MIME_TYPES) as [string, ...string[]]),
  file_size: z.number().int().positive().max(KB_MAX_FILE_SIZE_BYTES),
  sha256: z.string().regex(/^[0-9a-f]{64}$/i),
});
export type InsertKbDocumentInput = z.infer<typeof insertKbDocumentSchema>;

export const updateKbDocumentFlagsSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(2000).nullable(),
  contains_pii: z.boolean(),
  // Each term is a literal string scrubbed from the text before it is sent to
  // an AI provider. Length-capped so a stray paste cannot balloon the row.
  redaction_terms: z.array(z.string().min(2).max(100)).max(50),
  include_images: z.boolean(),
});
export type UpdateKbDocumentFlagsInput = z.infer<typeof updateKbDocumentFlagsSchema>;

export const kbDocumentIdSchema = z.object({ id: z.string().uuid() });

export const kbVersionIdSchema = z.object({ id: z.string().uuid() });
