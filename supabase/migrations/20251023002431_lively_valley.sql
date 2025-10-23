/*
  # Hunter Transformation Journey Database Schema

  1. New Tables
    - `users` - Core user profile data with stats and journey progress
    - `goals` - Individual goals set by or for users
    - `daily_quests` - Daily tasks assigned to users
    - `achievements` - Unlocked achievements for users
    - `conversation_history` - Chat logs between user and Sung Jin Woo
    - `journey_data` - Structured content from doc.txt defining the 24-week journey rules

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Users table: Core profile information
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_auth_id uuid UNIQUE REFERENCES auth.users(id),
  name text,
  level integer DEFAULT 1,
  experience integer DEFAULT 0,
  strength integer DEFAULT 10,
  endurance integer DEFAULT 10,
  agility integer DEFAULT 10,
  intelligence integer DEFAULT 10,
  willpower integer DEFAULT 10,
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  current_day_id integer DEFAULT 1,
  setup_completed boolean DEFAULT false
);

-- Goals table: Individual goals for users
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  target_date date,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at timestamptz DEFAULT now()
);

-- Daily quests table: Daily tasks for users
CREATE TABLE IF NOT EXISTS daily_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  experience_reward integer DEFAULT 10,
  completed boolean DEFAULT false,
  streak integer DEFAULT 0,
  last_completed timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Achievements table: Unlocked achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text,
  unlocked_at timestamptz DEFAULT now()
);

-- Conversation history table: Chat logs
CREATE TABLE IF NOT EXISTS conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_message text NOT NULL,
  sjw_response text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Journey data table: System rules from doc.txt
CREATE TABLE IF NOT EXISTS journey_data (
  id serial PRIMARY KEY,
  day_number integer UNIQUE NOT NULL,
  week_number integer NOT NULL,
  type text NOT NULL,
  title text,
  description text,
  exp_reward integer DEFAULT 0,
  str_bonus integer DEFAULT 0,
  vit_bonus integer DEFAULT 0,
  agi_bonus integer DEFAULT 0,
  int_bonus integer DEFAULT 0,
  wis_bonus integer DEFAULT 0,
  category text,
  is_daily_quest boolean DEFAULT false,
  is_bonus boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (supabase_auth_id = auth.uid());

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (supabase_auth_id = auth.uid());

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (supabase_auth_id = auth.uid());

-- RLS Policies for goals table
CREATE POLICY "Users can read own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can insert own goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can update own goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can delete own goals"
  ON goals
  FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

-- RLS Policies for daily_quests table
CREATE POLICY "Users can read own quests"
  ON daily_quests
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can insert own quests"
  ON daily_quests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can update own quests"
  ON daily_quests
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can delete own quests"
  ON daily_quests
  FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

-- RLS Policies for achievements table
CREATE POLICY "Users can read own achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can insert own achievements"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

-- RLS Policies for conversation_history table
CREATE POLICY "Users can read own conversations"
  ON conversation_history
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can insert own conversations"
  ON conversation_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()));

-- RLS Policies for journey_data table (read-only for all authenticated users)
CREATE POLICY "All users can read journey data"
  ON journey_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_id ON users(supabase_auth_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_id ON daily_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_completed ON daily_quests(completed);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id ON conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_data_day_number ON journey_data(day_number);
CREATE INDEX IF NOT EXISTS idx_journey_data_week_number ON journey_data(week_number);