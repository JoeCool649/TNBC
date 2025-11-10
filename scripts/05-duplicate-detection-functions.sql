-- Function to detect potential duplicate runs
-- Checks for runs with same user, similar distance, and same date
CREATE OR REPLACE FUNCTION detect_duplicate_runs(
  user_id_param UUID,
  distance_param DECIMAL,
  run_date_param DATE
)
RETURNS TABLE (
  id UUID,
  distance_miles DECIMAL,
  duration_seconds INTEGER,
  run_date DATE,
  status TEXT,
  proof_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.distance_miles,
    r.duration_seconds,
    r.run_date,
    r.status,
    r.proof_url
  FROM runs r
  WHERE r.user_id = user_id_param
    AND r.run_date = run_date_param
    AND ABS(r.distance_miles - distance_param) < 0.1  -- Within 0.1 miles
    AND r.status IN ('pending', 'verified');
END;
$$ LANGUAGE plpgsql;

-- Function to check for Strava activity ID duplicates
CREATE OR REPLACE FUNCTION check_strava_duplicate(
  strava_activity_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  IF strava_activity_id_param IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO duplicate_count
  FROM runs
  WHERE strava_activity_id = strava_activity_id_param
    AND status IN ('pending', 'verified');

  RETURN duplicate_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign tier based on pace
CREATE OR REPLACE FUNCTION auto_assign_tier(pace_seconds_param INTEGER)
RETURNS UUID AS $$
DECLARE
  tier_id_result UUID;
BEGIN
  SELECT id INTO tier_id_result
  FROM tiers
  WHERE (min_pace_seconds IS NULL OR pace_seconds_param >= min_pace_seconds)
    AND (max_pace_seconds IS NULL OR pace_seconds_param < max_pace_seconds)
  ORDER BY sort_order
  LIMIT 1;

  RETURN tier_id_result;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate user's tier based on average pace
CREATE OR REPLACE FUNCTION recalculate_user_tier(user_id_param UUID)
RETURNS UUID AS $$
DECLARE
  avg_pace INTEGER;
  new_tier_id UUID;
BEGIN
  -- Calculate average pace from verified runs
  SELECT AVG(pace_seconds_per_mile)::INTEGER
  INTO avg_pace
  FROM runs
  WHERE user_id = user_id_param
    AND status = 'verified';

  IF avg_pace IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get appropriate tier
  new_tier_id := auto_assign_tier(avg_pace);

  RETURN new_tier_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign tier on run insert
CREATE OR REPLACE FUNCTION trigger_auto_assign_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tier_id IS NULL THEN
    NEW.tier_id := auto_assign_tier(NEW.pace_seconds_per_mile);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_tier_on_insert
BEFORE INSERT ON runs
FOR EACH ROW
EXECUTE FUNCTION trigger_auto_assign_tier();
