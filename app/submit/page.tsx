import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RunSubmissionForm } from "@/components/runs/run-submission-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SubmitRunPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Submit a Run</CardTitle>
            <CardDescription>
              Upload proof of your run (screenshot or Strava link) to get verified and earn points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RunSubmissionForm userId={user.id} />
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Submission Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Accepted Proof Types:</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Screenshots from running apps (Strava, Nike Run Club, Garmin, etc.)</li>
                <li>Direct Strava activity links</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Requirements:</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Must show distance, time, and date clearly</li>
                <li>Runs must be completed during the season (Oct-Dec 2024)</li>
                <li>Each run can only be submitted once</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Verification:</h4>
              <p className="text-muted-foreground">
                All runs are reviewed by admins. You'll be notified once your run is verified and added to the
                leaderboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
