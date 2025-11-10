import { getSupabaseServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, Zap, Award } from "lucide-react"

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await getSupabaseServerClient()

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single()

  if (!profile) {
    notFound()
  }

  // Fetch user's runs
  const { data: runs } = await supabase
    .from("runs")
    .select("*, tiers(name, color)")
    .eq("user_id", profile.id)
    .eq("status", "verified")
    .order("run_date", { ascending: false })

  // Calculate stats
  const totalRuns = runs?.length || 0
  const totalMiles = runs?.reduce((sum, run) => sum + Number(run.distance_miles), 0) || 0
  const avgPace = runs?.length ? runs.reduce((sum, run) => sum + run.pace_seconds_per_mile, 0) / runs.length : 0

  const formatPace = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                <AvatarFallback className="text-2xl">{profile.display_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
                {profile.strava_connected && (
                  <Badge variant="secondary" className="mt-2">
                    Strava Connected
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Total Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalRuns}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Total Miles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalMiles.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Avg Pace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{avgPace > 0 ? formatPace(avgPace) : "--"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Runs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {runs && runs.length > 0 ? (
              <div className="space-y-4">
                {runs.slice(0, 10).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{Number(run.distance_miles).toFixed(2)} miles</p>
                        {run.tiers && (
                          <Badge style={{ backgroundColor: run.tiers.color }} className="text-white">
                            {run.tiers.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatPace(run.pace_seconds_per_mile)} pace • {new Date(run.run_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No runs yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
