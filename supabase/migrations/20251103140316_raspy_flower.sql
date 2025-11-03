/*
  # Fix Database Security Issues

  This migration addresses multiple security and performance issues:

  1. Performance Issues
    - Add missing indexes for foreign keys
    - Remove unused indexes to reduce maintenance overhead

  2. Security Issues  
    - Clean up duplicate RLS policies
    - Enable RLS on public tables
    - Fix function security settings

  3. Database Optimization
    - Optimize policy structure for better performance
*/

-- =====================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

-- Add index for messages.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_messages_user_id 
ON public.messages (user_id);

-- Add index for quest_progress.quest_id foreign key  
CREATE INDEX IF NOT EXISTS idx_quest_progress_quest_id
ON public.quest_progress (quest_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

-- Remove unused indexes to reduce maintenance overhead
DROP INDEX IF EXISTS public.chat_sessions_user_id_created_at_idx;
DROP INDEX IF EXISTS public.messages_session_id_created_at_idx;
DROP INDEX IF EXISTS public.idx_users_name;
DROP INDEX IF EXISTS public.idx_goals_user_id;
DROP INDEX IF EXISTS public.idx_goals_status;
DROP INDEX IF EXISTS public.idx_daily_quests_user_id;
DROP INDEX IF EXISTS public.idx_daily_quests_completed;
DROP INDEX IF EXISTS public.idx_achievements_user_id;
DROP INDEX IF EXISTS public.idx_conversation_history_user_id;
DROP INDEX IF EXISTS public.idx_journey_data_day_number;
DROP INDEX IF EXISTS public.goals_user_id_status_idx;
DROP INDEX IF EXISTS public.quest_progress_user_id_status_idx;
DROP INDEX IF EXISTS public.xp_transactions_user_id_created_at_idx;

-- =====================================================
-- 3. CLEAN UP DUPLICATE RLS POLICIES
-- =====================================================

-- Drop all existing policies and recreate clean ones
-- This eliminates the multiple permissive policies issue

-- ACHIEVEMENTS table
DROP POLICY IF EXISTS "Allow all operations on achievements" ON public.achievements;
DROP POLICY IF EXISTS "p_achievements_cud" ON public.achievements;
DROP POLICY IF EXISTS "p_achievements_sel" ON public.achievements;
DROP POLICY IF EXISTS "achievements_delete_auth" ON public.achievements;
DROP POLICY IF EXISTS "achievements_insert_auth" ON public.achievements;
DROP POLICY IF EXISTS "achievements_select_auth" ON public.achievements;
DROP POLICY IF EXISTS "achievements_update_auth" ON public.achievements;

CREATE POLICY "achievements_policy" ON public.achievements
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- CHAT_SESSIONS table
DROP POLICY IF EXISTS "p_cs_cud" ON public.chat_sessions;
DROP POLICY IF EXISTS "p_cs_sel" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_delete_auth" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_insert_auth" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_select_auth" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_update_auth" ON public.chat_sessions;

CREATE POLICY "chat_sessions_policy" ON public.chat_sessions
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- CONVERSATION_HISTORY table
DROP POLICY IF EXISTS "Allow all operations on conversation_history" ON public.conversation_history;
DROP POLICY IF EXISTS "conversation_history_delete_auth" ON public.conversation_history;
DROP POLICY IF EXISTS "conversation_history_insert_auth" ON public.conversation_history;
DROP POLICY IF EXISTS "conversation_history_select_auth" ON public.conversation_history;
DROP POLICY IF EXISTS "conversation_history_update_auth" ON public.conversation_history;

CREATE POLICY "conversation_history_policy" ON public.conversation_history
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- DAILY_QUESTS table
DROP POLICY IF EXISTS "Allow all operations on daily_quests" ON public.daily_quests;
DROP POLICY IF EXISTS "daily_quests_delete_auth" ON public.daily_quests;
DROP POLICY IF EXISTS "daily_quests_insert_auth" ON public.daily_quests;
DROP POLICY IF EXISTS "daily_quests_select_auth" ON public.daily_quests;
DROP POLICY IF EXISTS "daily_quests_update_auth" ON public.daily_quests;

CREATE POLICY "daily_quests_policy" ON public.daily_quests
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- GOALS table
DROP POLICY IF EXISTS "Allow all operations on goals" ON public.goals;
DROP POLICY IF EXISTS "p_goals_cud" ON public.goals;
DROP POLICY IF EXISTS "p_goals_sel" ON public.goals;
DROP POLICY IF EXISTS "goals_delete_auth" ON public.goals;
DROP POLICY IF EXISTS "goals_insert_auth" ON public.goals;
DROP POLICY IF EXISTS "goals_select_auth" ON public.goals;
DROP POLICY IF EXISTS "goals_update_auth" ON public.goals;

CREATE POLICY "goals_policy" ON public.goals
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- MESSAGES table
DROP POLICY IF EXISTS "p_msg_cud" ON public.messages;
DROP POLICY IF EXISTS "p_msg_sel" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_auth" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_auth" ON public.messages;
DROP POLICY IF EXISTS "messages_select_auth" ON public.messages;
DROP POLICY IF EXISTS "messages_update_auth" ON public.messages;

CREATE POLICY "messages_policy" ON public.messages
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- PROFILES table
DROP POLICY IF EXISTS "p_profiles_ins" ON public.profiles;
DROP POLICY IF EXISTS "p_profiles_sel" ON public.profiles;
DROP POLICY IF EXISTS "p_profiles_upd" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_auth" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_auth" ON public.profiles;

CREATE POLICY "profiles_policy" ON public.profiles
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- QUEST_PROGRESS table
DROP POLICY IF EXISTS "p_qp_cud" ON public.quest_progress;
DROP POLICY IF EXISTS "p_qp_sel" ON public.quest_progress;
DROP POLICY IF EXISTS "quest_progress_delete_auth" ON public.quest_progress;
DROP POLICY IF EXISTS "quest_progress_insert_auth" ON public.quest_progress;
DROP POLICY IF EXISTS "quest_progress_select_auth" ON public.quest_progress;
DROP POLICY IF EXISTS "quest_progress_update_auth" ON public.quest_progress;

CREATE POLICY "quest_progress_policy" ON public.quest_progress
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- SKILLS table
DROP POLICY IF EXISTS "p_skills_cud" ON public.skills;
DROP POLICY IF EXISTS "p_skills_sel" ON public.skills;
DROP POLICY IF EXISTS "skills_delete_auth" ON public.skills;
DROP POLICY IF EXISTS "skills_insert_auth" ON public.skills;
DROP POLICY IF EXISTS "skills_select_auth" ON public.skills;
DROP POLICY IF EXISTS "skills_update_auth" ON public.skills;

CREATE POLICY "skills_policy" ON public.skills
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- USERS table
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;
DROP POLICY IF EXISTS "users_delete_auth" ON public.users;
DROP POLICY IF EXISTS "users_insert_auth" ON public.users;
DROP POLICY IF EXISTS "users_select_auth" ON public.users;
DROP POLICY IF EXISTS "users_update_auth" ON public.users;

CREATE POLICY "users_policy" ON public.users
FOR ALL TO authenticated
USING (auth.uid()::uuid = id)
WITH CHECK (auth.uid()::uuid = id);

-- XP_TRANSACTIONS table
DROP POLICY IF EXISTS "p_xp_sel" ON public.xp_transactions;
DROP POLICY IF EXISTS "xp_transactions_select_auth" ON public.xp_transactions;

CREATE POLICY "xp_transactions_policy" ON public.xp_transactions
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id)
WITH CHECK (auth.uid()::uuid = user_id);

-- =====================================================
-- 4. ENABLE RLS ON PUBLIC TABLES
-- =====================================================

-- Enable RLS on quests table
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Create policy for quests table (public read, no user-specific data)
CREATE POLICY "quests_public_read" ON public.quests
FOR SELECT TO authenticated
USING (true);

-- Only allow admins to modify quests
CREATE POLICY "quests_admin_write" ON public.quests
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Enable RLS on journey_data table
ALTER TABLE public.journey_data ENABLE ROW LEVEL SECURITY;

-- Create policy for journey_data (public read, no user-specific data)
CREATE POLICY "journey_data_public_read" ON public.journey_data
FOR SELECT TO authenticated
USING (true);

-- Only allow admins to modify journey data
CREATE POLICY "journey_data_admin_write" ON public.journey_data
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5. FIX FUNCTION SECURITY SETTINGS
-- =====================================================

-- Fix the rpc_award_xp function security
DROP FUNCTION IF EXISTS public.rpc_award_xp(uuid, integer);

-- Recreate with proper security settings
CREATE OR REPLACE FUNCTION public.rpc_award_xp(
  p_user_id uuid,
  p_amount integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record record;
  v_new_experience integer;
  v_new_level integer;
BEGIN
  -- Verify the user exists and the caller has permission
  SELECT * INTO v_user_record
  FROM public.users
  WHERE id = p_user_id AND id = auth.uid()::uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or access denied';
  END IF;
  
  -- Calculate new experience and level
  v_new_experience := v_user_record.experience + p_amount;
  v_new_level := FLOOR(v_new_experience / 100) + 1;
  
  -- Update the user
  UPDATE public.users
  SET 
    experience = v_new_experience,
    level = v_new_level,
    last_login = now()
  WHERE id = p_user_id;
  
  -- Insert XP transaction record
  INSERT INTO public.xp_transactions (
    user_id,
    delta,
    source,
    reason,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    'system',
    'XP awarded via RPC function',
    now()
  );
  
  -- Return updated user data
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_experience', v_user_record.experience,
    'new_experience', v_new_experience,
    'old_level', v_user_record.level,
    'new_level', v_new_level,
    'xp_awarded', p_amount
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.rpc_award_xp(uuid, integer) TO authenticated;

-- =====================================================
-- 6. CREATE OPTIMIZED INDEXES FOR COMMON QUERIES
-- =====================================================

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_goals_user_status_created 
ON public.goals (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_quests_user_completed_created
ON public.daily_quests (user_id, completed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_achievements_user_unlocked
ON public.achievements (user_id, unlocked_date DESC);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_created
ON public.xp_transactions (user_id, created_at DESC);

-- =====================================================
-- 7. ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON TABLE public.quests IS 'Master quest templates - public read-only data';
COMMENT ON TABLE public.journey_data IS 'Journey content data - public read-only data';
COMMENT ON FUNCTION public.rpc_award_xp(uuid, integer) IS 'Securely award XP to authenticated users';