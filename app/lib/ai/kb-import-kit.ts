import { bibleJsonSchema } from '@/app/lib/ai/bible-schema';

/**
 * The brief an admin downloads and hands to Claude Code (or any model) to
 * generate a rulebook offline.
 *
 * No 'server-only': the admin page builds this in the browser, the same way it
 * already imports bible-schema.ts directly.
 *
 * It is one self-contained markdown file rather than a schema download plus
 * instructions, because the whole point is that the operator hands over ONE
 * thing. The schema is embedded rather than linked so the file keeps working
 * offline, which is where it is meant to be used.
 */

/** Bumped when the instructions change in a way a regenerated file must follow. */
export const KB_IMPORT_KIT_VERSION = '1';

export function buildKbImportKit(previousRuleIds: string[] = []): string {
  const schema = JSON.stringify(bibleJsonSchema(), null, 2);

  const idSection = previousRuleIds.length
    ? `The active rulebook uses these ruleset ids. **Reuse them where the subject
matches** — see "Keep ids stable" below:

${previousRuleIds.map((id) => `- \`${id}\``).join('\n')}`
    : `There is no active rulebook yet, so you are choosing the ids. Pick short,
descriptive, stable slugs (\`exploitatie_nieuw\`, \`levensgedrag_antecedenten\`)
— every future version will be diffed against these.`;

  return `# Rulebook generation brief

You are producing the **rulebook** for HorecaVergunning.com: the machine-readable
distillation of the municipality's permit assessment documents, which an AI
employee reads when it checks a case.

Generate it here, on this machine. The source documents are confidential and
must not be uploaded anywhere — only the finished JSON is.

## What to do

1. Read every document in the folder the operator points you at.
2. Produce a single file, \`rulebook.json\`, in the envelope below.
3. Validate it against the JSON Schema at the end of this brief before you hand
   it over. The import rejects the whole file on one wrong key, so check rather
   than hope.

## The envelope

\`\`\`json
{
  "manifest_version": "1",
  "generated": {
    "provider": "anthropic",
    "model": "<the model you actually are>",
    "prompt_version": "offline-${KB_IMPORT_KIT_VERSION}.0",
    "generated_at": "<ISO 8601 timestamp>"
  },
  "source_documents": [
    { "filename": "<exact filename>", "sha256": "<sha256 of the file's bytes>" }
  ],
  "rules": { "...": "the rulebook itself, matching the schema below" }
}
\`\`\`

\`generated\` is provenance shown to whoever reviews this later — state what
truly produced the file. \`source_documents\` records which documents it came
from **without** the documents leaving this machine: hash each file's bytes
(\`shasum -a 256 <file>\`) so anyone can later prove which revision of the
matrix produced which rule.

## Six things that will reject the whole file

These are the ways a generated rulebook usually fails. Each rejects everything,
not just the offending rule.

1. **Nothing is optional.** A field that may be empty is *nullable*, not
   optional — the key must still be present with an explicit \`null\`. This
   catches \`notes_nl\`, \`enum_values\` and \`escalate_if_nl\` every time.
2. **No extra keys, anywhere.** Every object is closed. One helpful addition
   like \`"confidence": 0.9\` rejects the document.
3. **\`schema_version\` is the string \`"1"\`**, not the number \`1\`.
4. **The enums are closed.** \`case_types\`, \`scenario\`, \`document_category\`,
   \`verification\`, \`answer_type\`, \`severity\` and \`comparator\` accept only the
   values in the schema. Do not invent \`"critical"\` for a severity.
5. **Keep ids stable.** Versions are compared on \`ruleset.id\` and
   \`ruleset.id/child.id\`. If you re-slug ids between runs, the reviewer sees
   "everything removed, everything added" instead of what actually changed, and
   loses the ability to review the difference at all.

${idSection}

6. **\`source.document\` must name a file** that appears in
   \`source_documents\`. It is how a criterion is traced back to the paragraph
   it came from.

## What good output looks like

- **Ground every criterion and threshold.** \`source.reference\` should quote or
  cite the specific article, table row or cell — not just the document name.
  A rule nobody can trace is a rule nobody can defend to an applicant.
- **Write the prose in Dutch.** Every \`*_nl\` field is read by Dutch staff and
  feeds a Dutch-language assistant.
- **Use \`open_questions\` honestly.** Where the documents are ambiguous or
  contradict each other, say so there instead of inventing a rule. That list is
  read by a human before the rulebook goes live, and it is the main reason this
  step has a human in it.
- **Distinguish blocking from advisory.** \`blocking\` means an application
  cannot proceed. Do not mark preferences as blocking.

## JSON Schema for \`rules\`

\`\`\`json
${schema}
\`\`\`
`;
}
