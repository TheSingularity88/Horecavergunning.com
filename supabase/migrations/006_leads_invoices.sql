-- ============================================================================
-- 006_leads_invoices.sql
-- Lead capture (marketing forms) + billing (Mollie invoices & payments).
--   * leads    — quiz / contact / newsletter submissions (service-role insert)
--   * invoices — one-time per-permit fees, linked to a case
--   * payments — Mollie payment attempts against an invoice
-- ============================================================================

-- ----------------------------------------------------------------------------
-- leads
-- Inserted ONLY via the service role (public route handlers), so there are no
-- anon/authenticated INSERT policies — prevents scraping/spam via the anon key.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT NOT NULL CHECK (source IN ('quiz','contact','newsletter')),
  name          TEXT,
  email         TEXT NOT NULL,
  phone         TEXT,
  company_name  TEXT,
  message       TEXT,
  permit_type_id UUID REFERENCES public.permit_types(id),
  quiz_answers  JSONB,
  locale        TEXT NOT NULL DEFAULT 'nl' CHECK (locale IN ('nl','en')),
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','contacted','converted','closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Staff read + update (mark contacted/closed). No INSERT policy → service role only.
CREATE POLICY "leads_select_staff" ON public.leads
  FOR SELECT USING (public.is_staff());
CREATE POLICY "leads_update_staff" ON public.leads
  FOR UPDATE USING (public.is_staff());
CREATE POLICY "leads_delete_admin" ON public.leads
  FOR DELETE USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- invoices
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  case_id        UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_cents   INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency       TEXT NOT NULL DEFAULT 'EUR',
  status         TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('draft','open','paid','failed','expired','canceled')),
  mollie_payment_id TEXT,
  description    TEXT,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_client ON public.invoices(client_id);
CREATE INDEX idx_invoices_case ON public.invoices(case_id);
CREATE INDEX idx_invoices_mollie ON public.invoices(mollie_payment_id);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Staff full; clients read their own invoices. Writes happen via service role.
CREATE POLICY "invoices_select_staff" ON public.invoices
  FOR SELECT USING (public.is_staff());
CREATE POLICY "invoices_select_client" ON public.invoices
  FOR SELECT USING (client_id = public.get_client_id());

-- ----------------------------------------------------------------------------
-- payments (Mollie attempts; written by the webhook via service role)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  mollie_payment_id TEXT NOT NULL,
  mollie_status     TEXT NOT NULL,
  amount_cents      INTEGER NOT NULL CHECK (amount_cents >= 0),
  method            TEXT,
  raw               JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_mollie ON public.payments(mollie_payment_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Staff read only; all writes via service role.
CREATE POLICY "payments_select_staff" ON public.payments
  FOR SELECT USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- invoice number generator (per-year sequence: HV-2026-000123)
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS TEXT AS $$
  SELECT 'HV-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$ LANGUAGE sql;

REVOKE EXECUTE ON FUNCTION public.next_invoice_number() FROM anon, authenticated, public;
