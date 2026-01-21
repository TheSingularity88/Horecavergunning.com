-- =====================================================
-- CLIENT PORTAL DATABASE MIGRATION
-- Execute this SQL in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ADD USER_ID TO CLIENTS TABLE
-- Links client records to auth.users for login
-- =====================================================
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- =====================================================
-- 2. HELPER FUNCTION: GET CURRENT USER'S CLIENT_ID
-- Used in RLS policies for client access control
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_client_id()
RETURNS UUID AS $$
  SELECT id FROM public.clients WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- 3. HELPER FUNCTION: CHECK IF USER IS A CLIENT
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- 4. RLS POLICIES FOR CLIENTS TABLE
-- Clients can view and update their own record
-- =====================================================
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
CREATE POLICY "clients_select_own" ON public.clients
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
CREATE POLICY "clients_update_own" ON public.clients
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. RLS POLICIES FOR CASES TABLE
-- Clients can only view cases belonging to them
-- =====================================================
DROP POLICY IF EXISTS "cases_select_client" ON public.cases;
CREATE POLICY "cases_select_client" ON public.cases
  FOR SELECT USING (client_id = public.get_client_id());

-- =====================================================
-- 6. RLS POLICIES FOR DOCUMENTS TABLE
-- Clients can view/upload documents for their cases
-- =====================================================
DROP POLICY IF EXISTS "documents_select_client" ON public.documents;
CREATE POLICY "documents_select_client" ON public.documents
  FOR SELECT USING (
    client_id = public.get_client_id()
    OR case_id IN (
      SELECT id FROM public.cases WHERE client_id = public.get_client_id()
    )
  );

DROP POLICY IF EXISTS "documents_insert_client" ON public.documents;
CREATE POLICY "documents_insert_client" ON public.documents
  FOR INSERT WITH CHECK (
    client_id = public.get_client_id()
    OR case_id IN (
      SELECT id FROM public.cases WHERE client_id = public.get_client_id()
    )
  );

-- =====================================================
-- 7. RLS POLICIES FOR TASKS TABLE
-- Clients can view tasks for their cases (read-only)
-- =====================================================
DROP POLICY IF EXISTS "tasks_select_client" ON public.tasks;
CREATE POLICY "tasks_select_client" ON public.tasks
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM public.cases WHERE client_id = public.get_client_id()
    )
  );

-- =====================================================
-- 8. CLIENT REQUESTS TABLE
-- For clients to submit new permit application requests
-- =====================================================
CREATE TABLE IF NOT EXISTS public.client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'exploitatievergunning',
    'alcoholvergunning',
    'terrasvergunning',
    'bibob',
    'overname',
    'verbouwing',
    'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'reviewing',
    'approved',
    'converted',
    'rejected'
  )),
  municipality TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),
  notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  converted_to_case_id UUID REFERENCES public.cases(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on client_requests
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_requests_client ON public.client_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON public.client_requests(status);

-- Updated_at trigger for client_requests
DROP TRIGGER IF EXISTS update_client_requests_updated_at ON public.client_requests;
CREATE TRIGGER update_client_requests_updated_at
  BEFORE UPDATE ON public.client_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 9. RLS POLICIES FOR CLIENT_REQUESTS TABLE
-- =====================================================

-- Clients can view their own requests
DROP POLICY IF EXISTS "client_requests_select_own" ON public.client_requests;
CREATE POLICY "client_requests_select_own" ON public.client_requests
  FOR SELECT USING (client_id = public.get_client_id());

-- Clients can insert new requests
DROP POLICY IF EXISTS "client_requests_insert_own" ON public.client_requests;
CREATE POLICY "client_requests_insert_own" ON public.client_requests
  FOR INSERT WITH CHECK (client_id = public.get_client_id());

-- Employees/admins can view all requests
DROP POLICY IF EXISTS "client_requests_select_employee" ON public.client_requests;
CREATE POLICY "client_requests_select_employee" ON public.client_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('employee', 'admin')
    )
  );

-- Employees/admins can update requests (for review process)
DROP POLICY IF EXISTS "client_requests_update_employee" ON public.client_requests;
CREATE POLICY "client_requests_update_employee" ON public.client_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('employee', 'admin')
    )
  );

-- =====================================================
-- 10. UPDATE EXISTING handle_new_user() TO SKIP CLIENTS
-- IMPORTANT: This replaces the original trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- SKIP profile creation for client registrations
  -- Clients get a record in the clients table, not profiles
  IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
    RETURN NEW;
  END IF;

  -- For employees/admins, create profile as before
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. CLIENT SELF-REGISTRATION TRIGGER
-- Creates client record when user signs up as client
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_client_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create client record if user_metadata indicates client registration
  IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
    INSERT INTO public.clients (
      user_id,
      company_name,
      contact_name,
      email,
      kvk_number,
      phone,
      status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unknown Company'),
      COALESCE(NEW.raw_user_meta_data->>'contact_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      NEW.raw_user_meta_data->>'kvk_number',
      NEW.raw_user_meta_data->>'phone',
      'active'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists to avoid duplicates)
DROP TRIGGER IF EXISTS on_client_signup ON auth.users;
CREATE TRIGGER on_client_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_client_signup();

-- =====================================================
-- 12. CLEANUP: REMOVE EMPLOYEE PROFILES FOR CLIENT USERS
-- Run this if clients were registered before migration
-- =====================================================
-- Delete profiles for users who are clients (have a record in clients table)
DELETE FROM public.profiles
WHERE id IN (
  SELECT user_id FROM public.clients WHERE user_id IS NOT NULL
);

-- =====================================================
-- NOTES FOR MANUAL SETUP:
-- =====================================================
-- After running this migration:
-- 1. Test by creating a client account via the registration page
-- 2. Verify RLS policies work by querying as a client user
-- 3. Link existing clients to user accounts if needed:
--    UPDATE clients SET user_id = 'uuid-of-auth-user' WHERE id = 'client-id';
--
-- IMPORTANT: If you registered clients BEFORE running this migration,
-- they may have employee profiles. The cleanup query above removes them.
-- You may need to re-run registration for affected users.
