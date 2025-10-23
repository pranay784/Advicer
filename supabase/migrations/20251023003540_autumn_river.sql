/*
  # Hunter Transformation System Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text, nullable)
      - `level` (integer, default 1)
      - `experience` (integer, default 0)
      - `strength` (integer, default 10)
      - `endurance` (integer, default 10)
      - `agility` (integer, default 10)
      - `intelligence` (integer, default 10)
      - `willpower` (integer, default 10)
      - `last_login` (timestamp with time zone)
      - `created_at` (timestamp with time zone)
      - `current_day_id` (integer, default 1)
      - `setup_completed` (boolean, default false)

    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, not null)
      - `description` (text, nullable)
      - `category` (text)
      - `target_date` (timestamp with time zone, nullable)
      - `progress` (integer, default 0)
      - `status` (text, default 'active')
      - `created_at` (timestamp with time zone)

    - `daily_quests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, not null)
      - `description` (text, nullable)
      - `category` (text)
      - `difficulty` (text)
      - `experience_reward` (integer, default 10)
      - `completed` (boolean, default false)
      - `streak` (integer, default 0)
      - `last_completed` (timestamp with time zone, nullable)
      - `created_at` (timestamp with time zone)

    - `achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, not null)
      - `description` (text, nullable)
      - `icon` (text, nullable)
      - `unlocked_at` (timestamp with time zone)

    - `conversation_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `user_message` (text, not null)
      - `sjw_response` (text, not null)
      - `timestamp` (timestamp with time zone)

    - `journey_data`
      - `id` (serial, primary key)
      - `day_number` (integer, unique, not null)
      - `week_number` (integer, not null)
      - `type` (text, not null)
      - `title` (text, nullable)
      - `description` (text, nullable)
      - `exp_reward` (integer, default 0)
      - `str_bonus` (integer, default 0)
      - `vit_bonus` (integer, default 0)
      - `agi_bonus` (integer, default 0)
      - `int_bonus` (integer, default 0)
      - `wis_bonus` (integer, default 0)
      - `category` (text, nullable)
      - `is_daily_quest` (boolean, default false)
      - `is_bonus` (boolean, default false)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
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
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  current_day_id integer DEFAULT 1,
  setup_completed boolean DEFAULT false
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
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
  category text,
  difficulty text,
  experience_reward integer DEFAULT 10,
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
  timestamp timestamptz DEFAULT now()
);

-- Create journey_data table
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

-- Create policies for users table (allow all operations for now since we're using IP-based identification)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

-- Create policies for goals table
CREATE POLICY "Allow all operations on goals" ON goals FOR ALL USING (true);

-- Create policies for daily_quests table
CREATE POLICY "Allow all operations on daily_quests" ON daily_quests FOR ALL USING (true);

-- Create policies for achievements table
CREATE POLICY "Allow all operations on achievements" ON achievements FOR ALL USING (true);

-- Create policies for conversation_history table
CREATE POLICY "Allow all operations on conversation_history" ON conversation_history FOR ALL USING (true);

-- Create policies for journey_data table (read-only for all users)
CREATE POLICY "Allow read access to journey_data" ON journey_data FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_id ON daily_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id ON conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_data_day_number ON journey_data(day_number);
CREATE INDEX IF NOT EXISTS idx_journey_data_week_number ON journey_data(week_number);