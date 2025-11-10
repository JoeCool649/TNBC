-- Nightmare Before Christmas Run League Database Schema
-- This script creates all necessary tables for the run league app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  strava_connected BOOLEAN DEFAULT FALSE,
  strava_athlete_id TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tiers table
CREATE TABLE IF NOT EXISTS public.tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  min_pace_seconds INTEGER, -- minimum pace in seconds per mile (slower)
  max_pace_seconds INTEGER, -- maximum pace in seconds per mile (faster)
  color TEXT DEFAULT '#666666',
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Runs table
CREATE TABLE IF NOT EXISTS public.runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  distance_miles DECIMAL(5,2) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  pace_seconds_per_mile INTEGER NOT NULL,
  run_date DATE NOT NULL,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('screenshot', 'strava_url')),
  proof_url TEXT NOT NULL,
  strava_activity_id TEXT,
  notes TEXT,
  tier_id UUID REFERENCES public.tiers(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'flagged', 'rejected')),
  flagged_reason TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.runs(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo votes table
CREATE TABLE IF NOT EXISTS public.photo_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tagged runners table (for photo tagging)
CREATE TABLE IF NOT EXISTS public.photo_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id)
);

-- Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON public.runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_tier_id ON public.runs(tier_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON public.runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_run_date ON public.runs(run_date);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_votes_photo_id ON public.photo_votes(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON public.comments(photo_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_runs_updated_at BEFORE UPDATE ON public.runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
