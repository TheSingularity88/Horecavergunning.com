-- ============================================================================
-- 002_security_fixes.sql
-- Fixes the security defects documented in 000_baseline.sql:
--   1. handle_new_user() trusted client-supplied role metadata  → privilege
--      escalation to admin via public signUp. Now hardcodes 'employee' and
--      creates new staff as INACTIVE (admin must activate).
--   2. profiles_update_own allowed users to set their own role/is_active
--      → second escalation path. Fixed with column-level UPDATE grants.
--   3. Duplicate docs-era + 001-era policies coexisted (permissive union),
--      including broken recursive profiles policies. All dropped; one clean
--      coherent set per table below.
--   4. INSERT policies were `auth.uid() IS NOT NULL` on clients/cases/tasks/
--      documents → any authenticated user could insert rows for any client.
--      Tightened to staff / ownership checks.
--   5. profiles had no admin SELECT/UPDATE policy → admin user management
--      was silently broken. Restored via is_admin().
--   6. Adds is_staff() helper (role check + is_active) and a Postgres-based
--      rate limiter for public endpoints.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- is_admin now also requires the account to be active.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND COALESCE(is_active, true)
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Active staff member (employee or admin).
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('employee', 'admin')
      AND COALESCE(is_active, true)
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Re-pin existing helpers with a fixed search_path (defense in depth).
CREATE OR REPLACE FUNCTION public.get_client_id()
RETURNS UUID AS $$
  SELECT id FROM public.clients WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 2. FIX PRIVILEGE ESCALATION IN handle_new_user()
--    Role is NEVER read from client-supplied metadata anymore.
--    New (non-client) signups become INACTIVE employees; an admin must
--    activate them. Staff accounts are normally created server-side via
--    auth.admin.createUser.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Clients get a record in the clients table (handle_client_signup), not profiles
  IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'employee',   -- SECURITY: hardcoded; never trust metadata for role
    false         -- SECURITY: staff must be activated by an admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 3. PROFILES — drop all old policies, recreate clean set
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (public.is_admin());

-- No INSERT policy: profile rows are created by the SECURITY DEFINER trigger
-- or by the service role (both bypass RLS).

-- SECURITY: column-level grants so users cannot change their own role or
-- is_active through profiles_update_own. Role/activation changes go through
-- the service role (server actions) only.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url, phone) ON public.profiles TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. CLIENTS — single clean set; staff manage, clients see/update own
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "View clients policy" ON clients;
DROP POLICY IF EXISTS "Insert clients policy" ON clients;
DROP POLICY IF EXISTS "Update clients policy" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;
DROP POLICY IF EXISTS "clients_select_own" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;

-- Staff see all clients (small office; employees handle any incoming request).
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (public.is_staff() OR user_id = auth.uid());

CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (public.is_staff());

-- Clients can update their own company details but can never re-point user_id.
CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "clients_delete" ON clients
  FOR DELETE USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. CASES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "View cases policy" ON cases;
DROP POLICY IF EXISTS "Insert cases policy" ON cases;
DROP POLICY IF EXISTS "Update cases policy" ON cases;
DROP POLICY IF EXISTS "Admins can delete cases" ON cases;
DROP POLICY IF EXISTS "cases_select" ON cases;
DROP POLICY IF EXISTS "cases_insert" ON cases;
DROP POLICY IF EXISTS "cases_update" ON cases;
DROP POLICY IF EXISTS "cases_delete" ON cases;
DROP POLICY IF EXISTS "cases_select_client" ON cases;

CREATE POLICY "cases_select" ON cases
  FOR SELECT USING (public.is_staff());

CREATE POLICY "cases_select_client" ON cases
  FOR SELECT USING (client_id = public.get_client_id());

CREATE POLICY "cases_insert" ON cases
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "cases_update" ON cases
  FOR UPDATE USING (public.is_staff());

CREATE POLICY "cases_delete" ON cases
  FOR DELETE USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. TASKS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "View tasks policy" ON tasks;
DROP POLICY IF EXISTS "Insert tasks policy" ON tasks;
DROP POLICY IF EXISTS "Update tasks policy" ON tasks;
DROP POLICY IF EXISTS "Delete tasks policy" ON tasks;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;
DROP POLICY IF EXISTS "tasks_select_client" ON tasks;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (public.is_staff());

-- Clients can see tasks on their own cases (read-only progress view).
CREATE POLICY "tasks_select_client" ON tasks
  FOR SELECT USING (
    case_id IN (SELECT id FROM cases WHERE client_id = public.get_client_id())
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (public.is_staff());

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (created_by = auth.uid() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. DOCUMENTS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "View documents policy" ON documents;
DROP POLICY IF EXISTS "Insert documents policy" ON documents;
DROP POLICY IF EXISTS "Delete documents policy" ON documents;
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;
DROP POLICY IF EXISTS "documents_select_client" ON documents;
DROP POLICY IF EXISTS "documents_insert_client" ON documents;

CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (public.is_staff());

CREATE POLICY "documents_select_client" ON documents
  FOR SELECT USING (
    client_id = public.get_client_id()
    OR case_id IN (SELECT id FROM cases WHERE client_id = public.get_client_id())
  );

-- Staff insert must self-attribute; client insert only against own client/case.
CREATE POLICY "documents_insert" ON documents
  FOR INSERT WITH CHECK (public.is_staff() AND uploaded_by = auth.uid());

CREATE POLICY "documents_insert_client" ON documents
  FOR INSERT WITH CHECK (
    uploaded_by IS NULL
    AND (
      client_id = public.get_client_id()
      OR case_id IN (SELECT id FROM cases WHERE client_id = public.get_client_id())
    )
  );

CREATE POLICY "documents_update" ON documents
  FOR UPDATE USING (uploaded_by = auth.uid() OR public.is_admin());

-- Clients may delete only their own uploads (uploaded_by IS NULL = client upload).
CREATE POLICY "documents_delete" ON documents
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR public.is_admin()
    OR (uploaded_by IS NULL AND client_id = public.get_client_id())
  );

-- ----------------------------------------------------------------------------
-- 8. ACTIVITY LOG — inserts must be self-attributed
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Insert activity policy" ON activity_log;
DROP POLICY IF EXISTS "View activity policy" ON activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
DROP POLICY IF EXISTS "activity_log_select" ON activity_log;

CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "activity_log_select" ON activity_log
  FOR SELECT USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 9. SYSTEM SETTINGS — drop legacy duplicate, keep is_admin() set
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins only settings" ON system_settings;
-- system_settings_select/insert/update/delete (is_admin()) from 001 remain.

-- ----------------------------------------------------------------------------
-- 10. CLIENT REQUESTS — use is_staff() (respects is_active)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "client_requests_select_employee" ON client_requests;
DROP POLICY IF EXISTS "client_requests_update_employee" ON client_requests;

CREATE POLICY "client_requests_select_staff" ON client_requests
  FOR SELECT USING (public.is_staff());

CREATE POLICY "client_requests_update_staff" ON client_requests
  FOR UPDATE USING (public.is_staff());

-- client_requests_select_own / client_requests_insert_own remain unchanged.

-- ----------------------------------------------------------------------------
-- 11. RATE LIMITING (Postgres fixed-window; used by public route handlers
--     via the service role)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (bypasses RLS) touches this table.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window INTERVAL
) RETURNS BOOLEAN AS $$
DECLARE
  v_allowed BOOLEAN;
BEGIN
  INSERT INTO public.rate_limits AS rl (key, count, window_start)
  VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rl.window_start < now() - p_window THEN 1
      ELSE rl.count + 1
    END,
    window_start = CASE
      WHEN rl.window_start < now() - p_window THEN now()
      ELSE rl.window_start
    END
  RETURNING count <= p_max INTO v_allowed;
  RETURN v_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Only the service role may call the limiter.
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTERVAL) FROM anon, authenticated, public;
