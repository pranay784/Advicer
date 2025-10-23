/*
  # Hunter Transformation System Database Schema

  1. New Tables
    - `users` - Hunter profiles with stats and progression
    - `goals` - User goals and objectives
    - `daily_quests` - Daily tasks and habits
    - `achievements` - Unlocked achievements and badges
    - `conversation_history` - Chat history with Sung Jin Woo
    - `journey_data` - Structured journey content by day

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access based on IP identification
    - Allow all operations for now (using IP-based auth)

  3. Relationships
    - Users have many goals, quests, achievements, conversations
    - All user data is linked via user_id foreign keys
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text,
  level integer DEFAULT 1,
  experience integer DEFAULT 0,
  strength integer DEFAULT 10,
  endurance integer DEFAULT 10,
  agility integer DEFAULT 10,
  intelligence integer DEFAULT 10,
  willpower integer DEFAULT 10,
  current_day_id integer DEFAULT 1,
  setup_completed boolean DEFAULT false,
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  target_date timestamptz,
  progress integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create daily_quests table
CREATE TABLE IF NOT EXISTS daily_quests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  difficulty text DEFAULT 'medium',
  experience_reward integer DEFAULT 20,
  completed boolean DEFAULT false,
  streak integer DEFAULT 0,
  last_completed timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text,
  unlocked_at timestamptz DEFAULT now()
);

-- Create conversation_history table
CREATE TABLE IF NOT EXISTS conversation_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user_message text NOT NULL,
  sjw_response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create journey_data table for structured content
CREATE TABLE IF NOT EXISTS journey_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_number integer NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_data ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now since we're using IP-based identification)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on goals" ON goals FOR ALL USING (true);
CREATE POLICY "Allow all operations on daily_quests" ON daily_quests FOR ALL USING (true);
CREATE POLICY "Allow all operations on achievements" ON achievements FOR ALL USING (true);
CREATE POLICY "Allow all operations on conversation_history" ON conversation_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on journey_data" ON journey_data FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_id ON daily_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_completed ON daily_quests(completed);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id ON conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_data_day_number ON journey_data(day_number);