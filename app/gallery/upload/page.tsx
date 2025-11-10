import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PhotoUploadForm } from "@/components/gallery/photo-upload-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function UploadPhotoPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's verified runs for tagging
  const { data: runs } = await supabase
    .from("runs")
    .select("id, distance_miles, run_date")
    .eq("user_id", user.id)
    .eq("status", "verified")
    .order("run_date", { ascending: false })

  // Fetch all users for tagging
  const { data: users } = await supabase.from("profiles").select("id, username, display_name").order("display_name")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Upload Photo</CardTitle>
            <CardDescription>Share a moment from your running journey</CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUploadForm userId={user.id} runs={runs || []} users={users || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
