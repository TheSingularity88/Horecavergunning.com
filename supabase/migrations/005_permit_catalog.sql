-- ============================================================================
-- 005_permit_catalog.sql
-- Introduces the permit catalog that drives pricing, intake, invoicing, and
-- (in the future) automated document checking:
--   * permit_types      — catalog of permits with admin-editable fees (NL/EN)
--   * required_documents — the checklist template per permit type
--   * case_documents    — the per-case instance of that checklist
-- Adds nullable permit_type_id to cases + client_requests and backfills from
-- the legacy case_type/request_type enum values.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- permit_types
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permit_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  name_nl       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  description_nl TEXT,
  description_en TEXT,
  base_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (base_fee_cents >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_permit_types_updated_at
  BEFORE UPDATE ON public.permit_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.permit_types ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can read ACTIVE permit types for the pricing
-- page; staff can read all; only admins write.
CREATE POLICY "permit_types_select_public" ON public.permit_types
  FOR SELECT USING (is_active OR public.is_staff());
CREATE POLICY "permit_types_insert_admin" ON public.permit_types
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "permit_types_update_admin" ON public.permit_types
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "permit_types_delete_admin" ON public.permit_types
  FOR DELETE USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- required_documents (checklist template per permit type)
-- auto_check_config is the hook for future automated document checking.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.required_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_type_id  UUID NOT NULL REFERENCES public.permit_types(id) ON DELETE CASCADE,
  name_nl         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  description_nl  TEXT,
  description_en  TEXT,
  is_required     BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  auto_check_config JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_required_documents_permit_type ON public.required_documents(permit_type_id);

CREATE TRIGGER update_required_documents_updated_at
  BEFORE UPDATE ON public.required_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.required_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "required_documents_select_public" ON public.required_documents
  FOR SELECT USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.permit_types pt
      WHERE pt.id = permit_type_id AND pt.is_active
    )
  );
CREATE POLICY "required_documents_insert_admin" ON public.required_documents
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "required_documents_update_admin" ON public.required_documents
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "required_documents_delete_admin" ON public.required_documents
  FOR DELETE USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- case_documents (per-case checklist instance)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_documents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id              UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  required_document_id UUID REFERENCES public.required_documents(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','uploaded','in_review','approved','rejected')),
  document_id          UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  review_note          TEXT,
  reviewed_by          UUID REFERENCES public.profiles(id),
  reviewed_at          TIMESTAMPTZ,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_documents_case ON public.case_documents(case_id);

CREATE TRIGGER update_case_documents_updated_at
  BEFORE UPDATE ON public.case_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

-- Staff manage everything; clients read their own case's checklist and may
-- mark an item uploaded (they cannot approve/reject).
CREATE POLICY "case_documents_select_staff" ON public.case_documents
  FOR SELECT USING (public.is_staff());
CREATE POLICY "case_documents_select_client" ON public.case_documents
  FOR SELECT USING (
    case_id IN (SELECT id FROM public.cases WHERE client_id = public.get_client_id())
  );
CREATE POLICY "case_documents_insert_staff" ON public.case_documents
  FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "case_documents_update_staff" ON public.case_documents
  FOR UPDATE USING (public.is_staff());
CREATE POLICY "case_documents_update_client" ON public.case_documents
  FOR UPDATE USING (
    case_id IN (SELECT id FROM public.cases WHERE client_id = public.get_client_id())
  )
  WITH CHECK (
    case_id IN (SELECT id FROM public.cases WHERE client_id = public.get_client_id())
  );
CREATE POLICY "case_documents_delete_staff" ON public.case_documents
  FOR DELETE USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- Link cases + client_requests to the catalog
-- ----------------------------------------------------------------------------
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS permit_type_id UUID REFERENCES public.permit_types(id);
ALTER TABLE public.client_requests
  ADD COLUMN IF NOT EXISTS permit_type_id UUID REFERENCES public.permit_types(id);

-- ----------------------------------------------------------------------------
-- Seed the 7 existing permit types (placeholder fees — admin edits later).
-- slug matches the legacy enum value so backfill is a straight join.
-- ----------------------------------------------------------------------------
INSERT INTO public.permit_types (slug, name_nl, name_en, description_nl, description_en, base_fee_cents, sort_order)
VALUES
  ('exploitatievergunning',
   'Exploitatievergunning', 'Operating permit',
   'Vergunning om een horecabedrijf te exploiteren in de gemeente.',
   'Permit to operate a hospitality business in the municipality.',
   49500, 1),
  ('alcoholvergunning',
   'Alcoholvergunning (Drank- en Horecawet)', 'Alcohol licence',
   'Vergunning voor het schenken van alcohol (artikel 3 Alcoholwet).',
   'Licence to serve alcohol (article 3 of the Alcohol Act).',
   59500, 2),
  ('terrasvergunning',
   'Terrasvergunning', 'Terrace permit',
   'Vergunning voor een terras bij uw horecazaak.',
   'Permit for a terrace at your venue.',
   34500, 3),
  ('bibob',
   'Bibob-screening', 'Bibob screening',
   'Begeleiding bij de Bibob-toets (integriteitsbeoordeling).',
   'Support with the Bibob integrity screening.',
   75000, 4),
  ('overname',
   'Horeca-overname', 'Business takeover',
   'Begeleiding bij de vergunningen rondom een horeca-overname.',
   'Support with the permits involved in taking over a venue.',
   65000, 5),
  ('verbouwing',
   'Verbouwing / gebruiksvergunning', 'Renovation / use permit',
   'Vergunningen rondom verbouwing en (brandveilig) gebruik.',
   'Permits for renovation and (fire-safe) use of the premises.',
   45000, 6),
  ('other',
   'Overig / advies', 'Other / advice',
   'Een andere vergunning of los adviestraject.',
   'A different permit or a standalone advisory track.',
   0, 7)
ON CONFLICT (slug) DO NOTHING;

-- Backfill the FK on existing cases + requests from the enum value.
UPDATE public.cases c
SET permit_type_id = pt.id
FROM public.permit_types pt
WHERE pt.slug = c.case_type AND c.permit_type_id IS NULL;

UPDATE public.client_requests r
SET permit_type_id = pt.id
FROM public.permit_types pt
WHERE pt.slug = r.request_type AND r.permit_type_id IS NULL;
