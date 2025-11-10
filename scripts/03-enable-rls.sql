-- Enable Row Level Security (RLS) on all tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tiers policies (read-only for users)
CREATE POLICY "Tiers are viewable by everyone" ON public.tiers
  FOR SELECT USING (true);

-- Runs policies
CREATE POLICY "Runs are viewable by everyone" ON public.runs
  FOR SELECT USING (status = 'verified' OR user_id = auth.uid());

CREATE POLICY "Users can insert own runs" ON public.runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own runs" ON public.runs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any run" ON public.runs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Photos policies
CREATE POLICY "Photos are viewable by everyone" ON public.photos
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own photos" ON public.photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON public.photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON public.photos
  FOR DELETE USING (auth.uid() = user_id);

-- Photo votes policies
CREATE POLICY "Photo votes are viewable by everyone" ON public.photo_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own votes" ON public.photo_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON public.photo_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Photo tags policies
CREATE POLICY "Photo tags are viewable by everyone" ON public.photo_tags
  FOR SELECT USING (true);

CREATE POLICY "Users can insert photo tags" ON public.photo_tags
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.photos WHERE id = photo_id
  ));

-- Badges policies
CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);
