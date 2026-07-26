import 'server-only';

import { createHash } from 'crypto';
import mammoth from 'mammoth';
import ExcelJS from 'exceljs';

/**
 * Document extraction for the knowledge-base analysis.
 *
 * - .docx via mammoth convertToHtml, NOT extractRawText: the assessment
 *   matrices in the corpus are Word tables, and HTML preserves row/column
 *   structure the model needs to reconstruct them. Models parse HTML tables
 *   reliably; flattened raw text turns a matrix into soup.
 * - Embedded images are harvested through mammoth's image handler and only
 *   forwarded to the provider when the document's include_images flag is on.
 * - .xlsx via exceljs. Formula cells render as `=formula → cached result` so
 *   the risk thresholds (which live in formulas) are explicit in the prompt
 *   text rather than hidden behind computed values.
 * - The REDACTION pass runs after extraction, before anything leaves for a
 *   provider: emails and phone numbers are always scrubbed; the document's
 *   redaction_terms (names of individuals) are literal-replaced. What was
 *   removed is reported as counts only — never the original strings.
 */

export interface ExtractedImage {
  contentType: string;
  base64: string;
}

export interface ExtractedDocument {
  /** Text/HTML representation of the document. */
  text: string;
  images: ExtractedImage[];
  warnings: string[];
  /** sha256 of the actual bytes extracted — anchors provenance. */
  sha256: string;
}

export interface RedactionResult {
  text: string;
  /** pattern/term label -> replacement count. Labels only, never originals. */
  applied: Record<string, number>;
}

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function extractDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<ExtractedDocument> {
  const sha256 = sha256Hex(buffer);

  if (mimeType === DOCX_MIME) {
    const images: ExtractedImage[] = [];
    let imageIndex = 0;

    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const contentType = image.contentType ?? 'image/png';
          const base64 = await image.read('base64');
          imageIndex += 1;
          images.push({ contentType, base64 });
          return { src: `embedded-image-${imageIndex}` };
        }),
      },
    );

    return {
      text: result.value,
      images,
      warnings: result.messages
        .filter((m) => m.type === 'warning')
        .map((m) => m.message),
      sha256,
    };
  }

  if (mimeType === XLSX_MIME) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const parts: string[] = [];
    workbook.eachSheet((sheet) => {
      parts.push(`## Sheet: ${sheet.name}\n`);
      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const cells: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          cells.push(`${cell.address}: ${renderCellValue(cell.value)}`);
        });
        if (cells.length > 0) {
          parts.push(`Row ${rowNumber} | ${cells.join(' | ')}`);
        }
      });
      parts.push('');
    });

    return { text: parts.join('\n'), images: [], warnings: [], sha256 };
  }

  // PDF and legacy formats: not supported by this extractor (v1). The upload
  // allowlist admits them for storage, but analysis requires OOXML.
  throw new Error(
    `Extraction not supported for ${filename} (${mimeType}). Convert the document to .docx or .xlsx.`,
  );
}

/** Render an exceljs cell value; formulas show both formula and cached result. */
function renderCellValue(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('formula' in value) {
      const cached = 'result' in value ? renderCellValue(value.result as ExcelJS.CellValue) : '?';
      return `=${value.formula} → ${cached}`;
    }
    if ('richText' in value) {
      return value.richText.map((r) => r.text).join('');
    }
    if ('text' in value && typeof value.text === 'string') {
      return value.text; // hyperlink cells
    }
    if ('error' in value) {
      return String(value.error);
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return JSON.stringify(value);
  }
  return String(value);
}

// Deliberately broad for text: better to redact a false positive than to ship
// a real address to a third party. Dutch phone formats: +31 6 12345678,
// 06-12345678, 020 123 4567, and variants with dashes/spaces.
//
// The lookarounds matter: without them, the digit run inside a financial ratio
// like 0.081967213 matches as a "phone number" and redaction corrupts the
// spreadsheet thresholds the analysis exists to extract. A candidate preceded
// or followed by a digit/decimal separator is data, not a phone number.
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE_RE = /(?<![\d.,])(?:\+31|0031|0)\s?[1-9](?:[\s-]?\d){7,9}(?![\d.,]?\d)/g;

export function redactText(text: string, redactionTerms: string[]): RedactionResult {
  const applied: Record<string, number> = {};
  let out = text;

  const emails = out.match(EMAIL_RE);
  if (emails && emails.length > 0) {
    applied['[email]'] = emails.length;
    out = out.replace(EMAIL_RE, '[email-redacted]');
  }

  const phones = out.match(PHONE_RE);
  if (phones && phones.length > 0) {
    applied['[phone]'] = phones.length;
    out = out.replace(PHONE_RE, '[tel-redacted]');
  }

  redactionTerms.forEach((term, index) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'gi');
    const matches = out.match(re);
    if (matches && matches.length > 0) {
      // Label by position, not by the term itself — the audit record must not
      // itself contain the name it exists to remove.
      applied[`[term-${index + 1}]`] = matches.length;
      out = out.replace(re, '[naam-verwijderd]');
    }
  });

  return { text: out, applied };
}
