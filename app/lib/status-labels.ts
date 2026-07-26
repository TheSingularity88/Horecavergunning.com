import type { translations } from '@/app/lib/translations';

type T = (typeof translations)['nl'];

/**
 * Human status labels for the client portal.
 *
 * These live in one place because the same defect kept reappearing: the case
 * detail page translated its statuses while the dashboard and the cases list
 * printed the raw database enum, so a Dutch restaurant owner read "intake",
 * "converted" and "waiting_government" as the status of their own application.
 * Fixing it per page is how it drifted apart in the first place — every surface
 * now goes through these helpers.
 *
 * Each falls back to a de-underscored enum rather than throwing, so a status
 * added to the database later degrades to something readable instead of blank.
 */

export function caseStatusLabel(status: string, t: T): string {
  const map = t.clientPortal?.cases?.status as Record<string, string> | undefined;
  return map?.[status] ?? status.replace(/_/g, ' ');
}

export function docStatusLabel(status: string, t: T): string {
  const map = t.clientPortal?.cases?.docStatus as Record<string, string> | undefined;
  return map?.[status] ?? status.replace(/_/g, ' ');
}

export function requestStatusLabel(status: string, t: T): string {
  const r = t.clientPortal?.requests;
  switch (status) {
    case 'pending':
      return r?.statusPending ?? 'Pending review';
    case 'reviewing':
      return r?.statusReviewing ?? 'Under review';
    case 'approved':
      return r?.statusApproved ?? 'Approved';
    case 'converted':
      return r?.statusConverted ?? 'Converted to case';
    case 'rejected':
      return r?.statusRejected ?? 'Rejected';
    default:
      return status.replace(/_/g, ' ');
  }
}

/**
 * Permit/case TYPE label (exploitatievergunning, bibob, …). Not a status, but
 * it suffers the same "print the raw enum" problem next to the status badges.
 */
export function caseTypeLabel(caseType: string, t: T): string {
  const map = t.clientPortal?.cases?.types as Record<string, string> | undefined;
  return map?.[caseType] ?? caseType.replace(/_/g, ' ');
}

/** Invoice status. The badges printed the raw enum (paid/open/expired/…). */
export function invoiceStatusLabel(status: string, t: T): string {
  const map = t.clientPortal?.invoices as Record<string, string> | undefined;
  return map?.[status] ?? status.replace(/_/g, ' ');
}
