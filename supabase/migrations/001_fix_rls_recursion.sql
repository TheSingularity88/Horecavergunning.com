-- Migration: Fix RLS infinite recursion on profiles table
-- Date: 2026-01-20
-- Description: Fixes the "infinite recursion detected in policy" error by using
--              a SECURITY DEFINER function to check admin status

-- ============================================================================
-- STEP 1: Drop all existing problematic policies on profiles table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- ============================================================================
-- STEP 2: Create simple, non-recursive policies for profiles
-- ============================================================================

-- Users can always read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can always update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- STEP 3: Create a SECURITY DEFINER function to check admin status
-- This function bypasses RLS, preventing infinite recursion
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Fix policies on clients table
-- ============================================================================

DROP POLICY IF EXISTS "Employees can view assigned clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Employees can update assigned clients" ON clients;
DROP POLICY IF EXISTS "Admins can manage all clients" ON clients;
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;

CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (
    assigned_employee_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (
    assigned_employee_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "clients_delete" ON clients
  FOR DELETE USING (
    public.is_admin()
  );

-- ============================================================================
-- STEP 5: Fix policies on cases table
-- ============================================================================

DROP POLICY IF EXISTS "Employees can view assigned cases" ON cases;
DROP POLICY IF EXISTS "Admins can view all cases" ON cases;
DROP POLICY IF EXISTS "Employees can update assigned cases" ON cases;
DROP POLICY IF EXISTS "Admins can manage all cases" ON cases;
DROP POLICY IF EXISTS "cases_select" ON cases;
DROP POLICY IF EXISTS "cases_insert" ON cases;
DROP POLICY IF EXISTS "cases_update" ON cases;
DROP POLICY IF EXISTS "cases_delete" ON cases;

CREATE POLICY "cases_select" ON cases
  FOR SELECT USING (
    assigned_employee_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "cases_insert" ON cases
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "cases_update" ON cases
  FOR UPDATE USING (
    assigned_employee_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "cases_delete" ON cases
  FOR DELETE USING (
    public.is_admin()
  );

-- ============================================================================
-- STEP 6: Fix policies on tasks table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (
    created_by = auth.uid()
    OR public.is_admin()
  );

-- ============================================================================
-- STEP 7: Fix policies on documents table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view related documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;

CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (
    uploaded_by = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "documents_insert" ON documents
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "documents_update" ON documents
  FOR UPDATE USING (
    uploaded_by = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "documents_delete" ON documents
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR public.is_admin()
  );

-- ============================================================================
-- STEP 8: Fix policies on activity_log table
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert activity logs" ON activity_log;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
DROP POLICY IF EXISTS "activity_log_select" ON activity_log;

CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "activity_log_select" ON activity_log
  FOR SELECT USING (
    public.is_admin()
  );

-- ============================================================================
-- STEP 9: Fix policies on system_settings table
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view system settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
DROP POLICY IF EXISTS "system_settings_select" ON system_settings;
DROP POLICY IF EXISTS "system_settings_all" ON system_settings;

CREATE POLICY "system_settings_select" ON system_settings
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "system_settings_insert" ON system_settings
  FOR INSERT WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "system_settings_update" ON system_settings
  FOR UPDATE USING (
    public.is_admin()
  );

CREATE POLICY "system_settings_delete" ON system_settings
  FOR DELETE USING (
    public.is_admin()
  );
