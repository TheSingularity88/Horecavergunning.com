-- ---------------------------------------------------------------------------
-- 010  Make duplicate invoices impossible at the database level.
--
-- Why: approving a request is a chain of independent writes fronted by a
-- read-then-write status check, so two concurrent approvals (a double-click, a
-- retried request) both saw status='pending' and both proceeded — producing two
-- cases, two checklists and two invoices for one request. The application-side
-- dedupe in createInvoiceForCase then made it worse: it used .maybeSingle(),
-- which ERRORS once more than one open invoice exists, returning null and
-- sending the code down the "no invoice yet, create one" branch. Every retry
-- added another invoice.
--
-- Application fixes accompany this migration, but the invariant belongs in the
-- database: a case can have at most ONE invoice that is open or paid.
-- Terminal invoices (failed/expired/canceled) are deliberately excluded so a
-- customer whose payment failed can be re-invoiced.
-- ---------------------------------------------------------------------------

create unique index if not exists invoices_one_active_per_case
  on public.invoices (case_id)
  where case_id is not null and status in ('open', 'paid');

comment on index public.invoices_one_active_per_case is
  'At most one open/paid invoice per case. Terminal invoices are excluded so a failed payment can be re-invoiced.';

-- ---------------------------------------------------------------------------
-- Index the foreign keys the performance advisor flagged as uncovered. These
-- are all columns we filter or join on in the portal and dashboard.
-- ---------------------------------------------------------------------------

create index if not exists idx_cases_permit_type on public.cases (permit_type_id);
create index if not exists idx_client_requests_permit_type on public.client_requests (permit_type_id);
create index if not exists idx_client_requests_converted_case on public.client_requests (converted_to_case_id);
create index if not exists idx_client_requests_reviewed_by on public.client_requests (reviewed_by);
create index if not exists idx_case_documents_document on public.case_documents (document_id);
create index if not exists idx_case_documents_required_document on public.case_documents (required_document_id);
create index if not exists idx_case_documents_reviewed_by on public.case_documents (reviewed_by);
create index if not exists idx_documents_uploaded_by on public.documents (uploaded_by);
create index if not exists idx_leads_permit_type on public.leads (permit_type_id);
create index if not exists idx_tasks_client on public.tasks (client_id);
create index if not exists idx_tasks_created_by on public.tasks (created_by);
create index if not exists idx_system_settings_updated_by on public.system_settings (updated_by);
