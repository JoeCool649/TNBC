import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trophy, Upload, Camera, User } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch user's recent runs
  const { data: runs } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.display_name || "Runner"}!</h1>
          <p className="text-muted-foreground">Track your progress and compete with the league</p>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button asChild className="h-auto py-6 flex-col gap-2 bg-transparent" variant="outline">
            <Link href="/submit">
              <Upload className="w-6 h-6" />
              <span>Submit Run</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-6 flex-col gap-2 bg-transparent" variant="outline">
            <Link href="/leaderboard">
              <Trophy className="w-6 h-6" />
              <span>Leaderboard</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-6 flex-col gap-2 bg-transparent" variant="outline">
            <Link href="/gallery">
              <Camera className="w-6 h-6" />
              <span>Photo Gallery</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-6 flex-col gap-2 bg-transparent" variant="outline">
            <Link href={`/profile/${profile?.username}`}>
              <User className="w-6 h-6" />
              <span>My Profile</span>
            </Link>
          </Button>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {runs && runs.length > 0 ? (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div key={run.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">{Number(run.distance_miles).toFixed(2)} miles</p>
                      <p className="text-sm text-muted-foreground">{new Date(run.run_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize">{run.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No runs submitted yet</p>
                <Button asChild>
                  <Link href="/submit">Submit Your First Run</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
