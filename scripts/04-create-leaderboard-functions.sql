-- Function to calculate points for a user
CREATE OR REPLACE FUNCTION calculate_user_points(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER := 0;
  distance_points INTEGER := 0;
  consistency_bonus INTEGER := 0;
  long_run_bonus INTEGER := 0;
  participation_points INTEGER := 0;
BEGIN
  -- Distance points: 10 points per mile
  SELECT COALESCE(SUM(distance_miles * 10), 0)::INTEGER
  INTO distance_points
  FROM runs
  WHERE user_id = user_id_param AND status = 'verified';

  -- Participation points: 10 points per verified run
  SELECT COALESCE(COUNT(*) * 10, 0)::INTEGER
  INTO participation_points
  FROM runs
  WHERE user_id = user_id_param AND status = 'verified';

  -- Long run bonus: 25 points for runs over 10 miles
  SELECT COALESCE(COUNT(*) * 25, 0)::INTEGER
  INTO long_run_bonus
  FROM runs
  WHERE user_id = user_id_param AND status = 'verified' AND distance_miles > 10;

  -- Consistency bonus: 50 points for each week with at least 3 runs
  SELECT COALESCE(COUNT(*) * 50, 0)::INTEGER
  INTO consistency_bonus
  FROM (
    SELECT DATE_TRUNC('week', run_date) as week
    FROM runs
    WHERE user_id = user_id_param AND status = 'verified'
    GROUP BY week
    HAVING COUNT(*) >= 3
  ) weeks;

  total_points := distance_points + participation_points + long_run_bonus + consistency_bonus;

  RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Function to get overall leaderboard
CREATE OR REPLACE FUNCTION get_overall_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  tier_name TEXT,
  tier_color TEXT,
  total_points INTEGER,
  total_miles NUMERIC,
  total_runs BIGINT,
  avg_pace INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      r.user_id,
      COUNT(*)::BIGINT as run_count,
      SUM(r.distance_miles) as miles,
      AVG(r.pace_seconds_per_mile)::INTEGER as pace,
      calculate_user_points(r.user_id) as points
    FROM runs r
    WHERE r.status = 'verified'
    GROUP BY r.user_id
  ),
  user_tiers AS (
    SELECT DISTINCT ON (r.user_id)
      r.user_id,
      t.name as tier_name,
      t.color as tier_color
    FROM runs r
    JOIN tiers t ON r.tier_id = t.id
    WHERE r.status = 'verified'
    ORDER BY r.user_id, r.created_at DESC
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY us.points DESC, us.miles DESC) as rank,
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    ut.tier_name,
    ut.tier_color,
    us.points as total_points,
    us.miles as total_miles,
    us.run_count as total_runs,
    us.pace as avg_pace
  FROM profiles p
  JOIN user_stats us ON p.id = us.user_id
  LEFT JOIN user_tiers ut ON p.id = ut.user_id
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- Function to get tier-specific leaderboard
CREATE OR REPLACE FUNCTION get_tier_leaderboard(tier_id_param UUID)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  total_miles NUMERIC,
  total_runs BIGINT,
  avg_pace INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      r.user_id,
      COUNT(*)::BIGINT as run_count,
      SUM(r.distance_miles) as miles,
      AVG(r.pace_seconds_per_mile)::INTEGER as pace,
      calculate_user_points(r.user_id) as points
    FROM runs r
    WHERE r.status = 'verified' AND r.tier_id = tier_id_param
    GROUP BY r.user_id
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY us.points DESC, us.miles DESC) as rank,
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    us.points as total_points,
    us.miles as total_miles,
    us.run_count as total_runs,
    us.pace as avg_pace
  FROM profiles p
  JOIN user_stats us ON p.id = us.user_id
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;
