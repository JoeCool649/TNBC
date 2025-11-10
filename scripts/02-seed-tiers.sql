-- Seed initial tier data
-- Tiers are based on pace (seconds per mile)

INSERT INTO public.tiers (name, description, min_pace_seconds, max_pace_seconds, color, sort_order) VALUES
  ('Elite Ghouls', 'Sub-7 minute mile pace', NULL, 420, '#FF4500', 1),
  ('Speedy Spirits', '7:00-8:30 pace', 420, 510, '#FF6B35', 2),
  ('Midnight Runners', '8:30-10:00 pace', 510, 600, '#FFA500', 3),
  ('Pumpkin Pacers', '10:00-12:00 pace', 600, 720, '#FFD700', 4),
  ('Festive Walkers', '12:00+ pace', 720, NULL, '#90EE90', 5)
ON CONFLICT DO NOTHING;
