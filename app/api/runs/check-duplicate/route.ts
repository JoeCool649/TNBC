import { getSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { distance, runDate, stravaActivityId } = await request.json()

    // Check for Strava duplicate if provided
    if (stravaActivityId) {
      const { data: stravaDuplicate } = await supabase.rpc("check_strava_duplicate", {
        strava_activity_id_param: stravaActivityId,
      })

      if (stravaDuplicate) {
        return NextResponse.json({
          isDuplicate: true,
          reason: "This Strava activity has already been submitted",
        })
      }
    }

    // Check for similar runs on same date
    const { data: duplicates } = await supabase.rpc("detect_duplicate_runs", {
      user_id_param: user.id,
      distance_param: distance,
      run_date_param: runDate,
    })

    if (duplicates && duplicates.length > 0) {
      return NextResponse.json({
        isDuplicate: true,
        reason: "You have already submitted a similar run on this date",
        existingRuns: duplicates,
      })
    }

    return NextResponse.json({ isDuplicate: false })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
