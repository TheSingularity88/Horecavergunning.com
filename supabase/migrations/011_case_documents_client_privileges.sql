-- ---------------------------------------------------------------------------
-- 011  Stop clients approving their own document checklist.
--
-- case_documents_update_client scoped updates to the caller's own cases, which
-- is the right ROW filter — but RLS says nothing about columns or values, and
-- `authenticated` held blanket UPDATE on every column. A client could therefore
-- update their own checklist row to:
--   * status = 'approved'          (approve their own documents)
--   * reviewed_by = <any staff id> (forge who signed it off)
--   * reviewed_at / review_note    (fabricate a review trail)
--   * name                         (rewrite what was even asked for)
--   * case_id                      (move the row onto another of their cases)
--
-- Same fix as migration 002 used for profiles: column-level grants for the
-- columns a client may legitimately touch, plus value limits in the policy.
--
-- Staff are unaffected: every staff write to this table goes through the
-- service-role client (snapshotChecklist, review actions), which bypasses both
-- RLS and column grants.
-- ---------------------------------------------------------------------------

-- anon has no policy on this table, so RLS already denies it; revoking the
-- inherited write privileges as well is defence in depth.
revoke insert, update, delete on public.case_documents from anon;

-- A client may attach an uploaded file and say "here it is". Nothing else.
revoke update on public.case_documents from authenticated;
grant update (document_id, status) on public.case_documents to authenticated;

-- Clients never insert or delete checklist rows — staff snapshot them.
revoke insert, delete on public.case_documents from authenticated;

drop policy if exists "case_documents_update_client" on public.case_documents;

create policy "case_documents_update_client" on public.case_documents
  for update
  using (
    case_id in (select id from public.cases where client_id = public.get_client_id())
    -- Only items still with the customer: awaiting supply, already supplied,
    -- or bounced back for correction. Never one under review or approved.
    and status in ('pending', 'uploaded', 'rejected')
  )
  with check (
    case_id in (select id from public.cases where client_id = public.get_client_id())
    -- The resulting status must remain a customer-side state, so 'approved',
    -- 'in_review' and 'rejected' stay staff-only outcomes.
    and status in ('pending', 'uploaded')
  );

comment on policy "case_documents_update_client" on public.case_documents is
  'Clients may attach a document and mark it supplied on their own open checklist items. Approval, review notes and the reviewer are staff-only (enforced by column grants + this policy''s value limits).';
