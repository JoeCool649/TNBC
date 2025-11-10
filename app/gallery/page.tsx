import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PhotoGrid } from "@/components/gallery/photo-grid"
import { Button } from "@/components/ui/button"
import { Camera, Upload } from "lucide-react"
import Link from "next/link"

export default async function GalleryPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch photos with user info and vote counts
  const { data: photos } = await supabase
    .from("photos")
    .select(
      `
      *,
      profiles:user_id (username, display_name, avatar_url),
      photo_votes (user_id)
    `,
    )
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Camera className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Photo Gallery</h1>
            </div>
            <p className="text-muted-foreground">Share your running moments and vote for your favorites</p>
          </div>
          {user && (
            <Button asChild>
              <Link href="/gallery/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Link>
            </Button>
          )}
        </div>

        {/* Photo Grid */}
        <PhotoGrid photos={photos || []} currentUserId={user?.id} />
      </div>
    </div>
  )
}
