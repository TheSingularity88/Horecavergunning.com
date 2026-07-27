/**
 * Case status literals, mirroring the cases_status_check constraint.
 *
 * This lives in a plain module rather than beside the case actions because
 * `app/lib/actions/cases.ts` is a `'use server'` file, and such a file may only
 * export async functions. Exporting a const array from it type-checks and even
 * builds, but throws at runtime the moment anything imports it — which took out
 * the entire AI proposal approval path, since proposal-schemas.ts pulled the
 * statuses across that boundary and every module importing IT died with
 * "A 'use server' file can only export async functions, found object."
 */
export const CASE_STATUSES = [
  'intake',
  'in_progress',
  'waiting_client',
  'waiting_government',
  'review',
  'approved',
  'rejected',
  'completed',
  'cancelled',
] as const;
