-- ============================================================================
-- 016_tasks_no_ai_assignee.sql   (applied live as "tasks_no_ai_assignee")
--
-- A task assigned to an AI employee is a task nobody ever does.
--
-- role='ai' profiles are `is_active = true` (createAiEmployee sets that), so
-- they matched the assignee dropdown's only filter and appeared next to the
-- humans. Pick one and the insert succeeds — `tasks.assigned_to` is a plain FK
-- to profiles(id) — but that account has no browser session (middleware bounces
-- role 'ai'), no dashboard, and no code path anywhere reads `tasks` on its
-- behalf. The task drops out of every human queue while the detail page shows a
-- plausible human-looking name as its owner.
--
-- The dropdowns now filter on role, but task rows are written straight from the
-- browser with no server action in between, so there is no application-layer
-- choke point to rely on. This trigger is the durable rule: it holds for every
-- future screen, script and API route without any of them having to remember.
--
-- Not a CHECK constraint, because the condition depends on another table.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_ai_task_assignee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = NEW.assigned_to AND role = 'ai'
     )
  THEN
    RAISE EXCEPTION 'Tasks cannot be assigned to an AI employee'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_no_ai_assignee ON public.tasks;

CREATE TRIGGER tasks_no_ai_assignee
  BEFORE INSERT OR UPDATE OF assigned_to ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_ai_task_assignee();
