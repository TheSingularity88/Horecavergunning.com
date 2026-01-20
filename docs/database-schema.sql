-- =====================================================
-- HORECAVERGUNNING DASHBOARD DATABASE SCHEMA
-- Execute this SQL in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  kvk_number TEXT,
  notes TEXT,
  assigned_employee_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CASES TABLE (Permit applications, projects)
-- =====================================================
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  case_type TEXT NOT NULL CHECK (case_type IN (
    'exploitatievergunning',
    'alcoholvergunning',
    'terrasvergunning',
    'bibob',
    'overname',
    'verbouwing',
    'other'
  )),
  status TEXT DEFAULT 'intake' CHECK (status IN (
    'intake',
    'in_progress',
    'waiting_client',
    'waiting_government',
    'review',
    'approved',
    'rejected',
    'completed',
    'cancelled'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_employee_id UUID REFERENCES public.profiles(id),
  deadline DATE,
  municipality TEXT,
  reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TASKS TABLE
-- =====================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'contract',
    'permit',
    'identification',
    'financial',
    'correspondence',
    'bibob',
    'general'
  )),
  uploaded_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SYSTEM SETTINGS TABLE (Admin only)
-- =====================================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can insert profiles (for creating new users)
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- CLIENTS POLICIES
-- =====================================================

-- Employees see only their assigned clients, admins see all
CREATE POLICY "View clients policy" ON public.clients
  FOR SELECT USING (
    assigned_employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can insert clients
CREATE POLICY "Insert clients policy" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Employees can update assigned clients, admins can update all
CREATE POLICY "Update clients policy" ON public.clients
  FOR UPDATE USING (
    assigned_employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete clients
CREATE POLICY "Admins can delete clients" ON public.clients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- CASES POLICIES
-- =====================================================

-- Employees see assigned cases or cases of assigned clients, admins see all
CREATE POLICY "View cases policy" ON public.cases
  FOR SELECT USING (
    assigned_employee_id = auth.uid() OR
    client_id IN (
      SELECT id FROM public.clients WHERE assigned_employee_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can insert cases
CREATE POLICY "Insert cases policy" ON public.cases
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Employees can update assigned cases, admins can update all
CREATE POLICY "Update cases policy" ON public.cases
  FOR UPDATE USING (
    assigned_employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete cases
CREATE POLICY "Admins can delete cases" ON public.cases
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- TASKS POLICIES
-- =====================================================

-- Users see their assigned tasks or tasks they created, admins see all
CREATE POLICY "View tasks policy" ON public.tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can create tasks
CREATE POLICY "Insert tasks policy" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update assigned tasks, admins can update all
CREATE POLICY "Update tasks policy" ON public.tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete any task, creators can delete their own
CREATE POLICY "Delete tasks policy" ON public.tasks
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================

-- View documents based on case/client access
CREATE POLICY "View documents policy" ON public.documents
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    case_id IN (
      SELECT id FROM public.cases WHERE assigned_employee_id = auth.uid()
    ) OR
    client_id IN (
      SELECT id FROM public.clients WHERE assigned_employee_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can upload documents
CREATE POLICY "Insert documents policy" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only uploaders and admins can delete
CREATE POLICY "Delete documents policy" ON public.documents
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- ACTIVITY LOG POLICIES
-- =====================================================

-- Users see their own activity, admins see all
CREATE POLICY "View activity policy" ON public.activity_log
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can insert activity
CREATE POLICY "Insert activity policy" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- SYSTEM SETTINGS POLICIES
-- =====================================================

-- Only admins can view/modify system settings
CREATE POLICY "Admins only settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_cases_updated_at ON public.cases;
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- STORAGE BUCKET FOR DOCUMENTS
-- =====================================================

-- Create storage bucket for documents (run separately in Storage section)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', false);

-- Storage policies (run in Storage section)
-- CREATE POLICY "Authenticated users can upload" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'documents' AND
--     auth.uid() IS NOT NULL
--   );

-- CREATE POLICY "Users can view documents" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'documents' AND
--     auth.uid() IS NOT NULL
--   );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_clients_assigned_employee ON public.clients(assigned_employee_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_cases_client ON public.cases(client_id);
CREATE INDEX idx_cases_assigned_employee ON public.cases(assigned_employee_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_case ON public.tasks(case_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_documents_case ON public.documents(case_id);
CREATE INDEX idx_documents_client ON public.documents(client_id);
CREATE INDEX idx_activity_user ON public.activity_log(user_id);
CREATE INDEX idx_activity_entity ON public.activity_log(entity_type, entity_id);
