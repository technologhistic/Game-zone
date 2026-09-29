-- Migration for Catch Me 😂 game
-- Creates profiles, game_scores tables with Row Level Security (RLS), indexes, and constraints.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Game Scores Table
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 2000),
  difficulty INTEGER NOT NULL DEFAULT 1,
  duration INTEGER NOT NULL DEFAULT 30,
  catches INTEGER NOT NULL DEFAULT 0 CHECK (catches >= 0 AND catches <= 50),
  max_combo INTEGER NOT NULL DEFAULT 0 CHECK (max_combo >= 0),
  session_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for fast leaderboard querying
CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard 
  ON public.game_scores (score DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_game_scores_daily 
  ON public.game_scores (created_at DESC, score DESC);

CREATE INDEX IF NOT EXISTS idx_game_scores_user 
  ON public.game_scores (user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_username 
  ON public.profiles (username);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- 5. Profiles RLS Policies
-- Allow anyone to read profiles (needed for public leaderboard display)
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can create their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Game Scores RLS Policies
-- Allow anyone to read the leaderboard scores
CREATE POLICY "Game scores are viewable by everyone" 
  ON public.game_scores 
  FOR SELECT 
  USING (true);

-- Allow authenticated/anon users to insert their own score with anti-cheat checks
CREATE POLICY "Users can insert their verified scores" 
  ON public.game_scores 
  FOR INSERT 
  WITH CHECK (
    score >= 0 
    AND score <= 2000 
    AND duration >= 15
    AND catches >= 0
    AND (auth.uid() = user_id OR user_id IS NULL)
  );

-- Do not allow users to modify or delete existing scores
-- (No UPDATE or DELETE policy granted to public)
