import { getSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all users with verified runs
    const { data: users } = await supabase
      .from("runs")
      .select("user_id")
      .eq("status", "verified")
      .not("user_id", "is", null)

    if (!users) {
      return NextResponse.json({ error: "No users found" }, { status: 404 })
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(users.map((u) => u.user_id))]

    // Recalculate tier for each user
    const updates = []
    for (const userId of uniqueUserIds) {
      const { data: newTierId } = await supabase.rpc("recalculate_user_tier", {
        user_id_param: userId,
      })

      if (newTierId) {
        // Update all verified runs for this user with new tier
        const { error } = await supabase
          .from("runs")
          .update({ tier_id: newTierId })
          .eq("user_id", userId)
          .eq("status", "verified")

        if (!error) {
          updates.push(userId)
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedUsers: updates.length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
