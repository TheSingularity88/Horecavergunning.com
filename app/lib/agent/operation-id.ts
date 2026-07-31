/**
 * A tool's registry name -> the identifier an external agent calls it by.
 *
 *   list_leads -> listLeads
 *
 * ChatGPT requires operationIds to be unique and identifier-safe, so the
 * OpenAPI document cannot simply use the snake_case registry name. That leaves
 * two names for one tool, and THREE places have to agree on the mapping: the
 * schema that declares the operation, the catalogue an agent reads to see what
 * it may do, and the prompt that tells it how to choose. When this lived as a
 * private copy in each, an agent could read `list_leads` from the catalogue and
 * have no way to know the operation it can invoke is `listLeads`.
 *
 * No 'server-only': this is a pure string function, and keeping it importable
 * anywhere is the point — a second copy is exactly the failure it prevents.
 */
export function toOperationId(registryName: string): string {
  return registryName.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
