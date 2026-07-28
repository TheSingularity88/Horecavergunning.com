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

/**
 * The wrapper an OFFLINE-generated rulebook arrives in.
 *
 * Only the envelope is validated here — `rules` is left as `unknown` and handed
 * to bibleSchema, which is the single authority on the rulebook's shape and
 * produces the per-field errors the admin needs to fix their file.
 *
 * The envelope exists because kb_versions has three NOT NULL provenance columns
 * — provider, model, prompt_version — that an import cannot honestly invent,
 * and `model` is displayed verbatim on the version row. The generator states
 * what actually produced the file instead of the server making something up.
 */
export const importKbVersionSchema = z.object({
  manifest_version: z.literal('1', {
    message: 'manifest_version must be the string "1".',
  }),
  generated: z.object({
    provider: z.string().trim().min(1, 'generated.provider is required.').max(60),
    model: z.string().trim().min(1, 'generated.model is required.').max(120),
    prompt_version: z.string().trim().min(1, 'generated.prompt_version is required.').max(60),
    /** Informational: recorded in the activity log, not stored on the version. */
    generated_at: z.string().trim().max(40).optional(),
  }),
  /**
   * Provenance without the document. The generator hashes each source file
   * locally, so "which document version produced this rulebook" stays
   * answerable even though the corpus never leaves the admin's machine.
   * `id` is absent by design — an offline run has no kb_documents row.
   */
  source_documents: z
    .array(
      z.object({
        filename: z.string().trim().min(1).max(255),
        sha256: z
          .string()
          .trim()
          .regex(/^[a-f0-9]{64}$/i, 'source_documents[].sha256 must be a 64-character hex digest.'),
      }),
    )
    .min(1, 'List at least one source document, so the rulebook can be traced back to it.')
    .max(100),
  /** Validated by bibleSchema, not here. */
  rules: z.unknown(),
});
export type ImportKbVersionInput = z.infer<typeof importKbVersionSchema>;
