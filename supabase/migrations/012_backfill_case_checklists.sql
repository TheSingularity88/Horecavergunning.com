-- ---------------------------------------------------------------------------
-- 012  Backfill the document checklist for cases that predate it.
--
-- Why: snapshotChecklist() only runs inside approveClientRequest, so a case is
-- only given a checklist at the moment a request is approved. Every case that
-- already existed — including ones created directly by staff for a customer who
-- phoned — therefore has zero checklist rows, and the customer sees the empty
-- state ("wij hebben nog geen documentenlijst klaargezet") no matter which
-- permit they applied for. Migration 009 seeded the templates; without this
-- backfill those templates only ever reach NEW cases.
--
-- Safe by construction:
--   * only cases that have a permit_type_id (nothing to copy otherwise);
--   * only cases with NO existing checklist rows, so a case staff have already
--     worked on is never touched or duplicated;
--   * only cases that are still live — a completed, rejected or cancelled case
--     does not need a document list;
--   * idempotent: re-running inserts nothing, because the NOT EXISTS is
--     evaluated against the pre-statement snapshot.
--
-- Status is 'pending' for every row: this reconstructs what the customer still
-- owes us, and we cannot infer from here which documents were already supplied
-- by other means. Staff can mark them off in the normal flow.
-- ---------------------------------------------------------------------------

insert into public.case_documents
  (case_id, required_document_id, name, status, sort_order)
select
  c.id,
  rd.id,
  rd.name_nl,
  'pending',
  rd.sort_order
from public.cases c
join public.required_documents rd on rd.permit_type_id = c.permit_type_id
where c.permit_type_id is not null
  and c.status not in ('completed', 'rejected', 'cancelled')
  and not exists (
    select 1
    from public.case_documents cd
    where cd.case_id = c.id
  );
