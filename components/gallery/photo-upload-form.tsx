"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

interface PhotoUploadFormProps {
  userId: string
  runs: Array<{ id: string; distance_miles: number; run_date: string }>
  users: Array<{ id: string; username: string; display_name: string }>
}

export function PhotoUploadForm({ userId, runs, users }: PhotoUploadFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [runId, setRunId] = useState<string>("")
  const [taggedUsers, setTaggedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!photoFile) {
      toast({
        title: "Error",
        description: "Please select a photo to upload",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      // Upload photo to storage
      const fileExt = photoFile.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("photos").upload(fileName, photoFile)

      if (uploadError) {
        toast({
          title: "Error",
          description: "Failed to upload photo",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(fileName)

      // Insert photo record
      const { data: photo, error: insertError } = await supabase
        .from("photos")
        .insert({
          user_id: userId,
          run_id: runId || null,
          image_url: publicUrl,
          caption: caption || null,
        })
        .select()
        .single()

      if (insertError) {
        toast({
          title: "Error",
          description: insertError.message,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Add tagged users
      if (taggedUsers.length > 0 && photo) {
        const tags = taggedUsers.map((taggedUserId) => ({
          photo_id: photo.id,
          user_id: taggedUserId,
        }))

        await supabase.from("photo_tags").insert(tags)
      }

      toast({
        title: "Success",
        description: "Photo uploaded successfully!",
      })

      router.push("/gallery")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div className="space-y-2">
        <Label htmlFor="photo">Photo</Label>
        <div className="flex items-center gap-2">
          <Input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            disabled={isLoading}
            className="cursor-pointer"
          />
          <Upload className="w-5 h-5 text-muted-foreground" />
        </div>
        {photoFile && <p className="text-sm text-muted-foreground">{photoFile.name}</p>}
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <Label htmlFor="caption">Caption (optional)</Label>
        <Textarea
          id="caption"
          placeholder="Share something about this moment..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* Link to Run */}
      {runs.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="run">Link to Run (optional)</Label>
          <Select value={runId} onValueChange={setRunId} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select a run" />
            </SelectTrigger>
            <SelectContent>
              {runs.map((run) => (
                <SelectItem key={run.id} value={run.id}>
                  {Number(run.distance_miles).toFixed(2)} miles - {new Date(run.run_date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tag Runners */}
      <div className="space-y-2">
        <Label>Tag Runners (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {users.slice(0, 10).map((user) => (
            <Button
              key={user.id}
              type="button"
              variant={taggedUsers.includes(user.id) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (taggedUsers.includes(user.id)) {
                  setTaggedUsers(taggedUsers.filter((id) => id !== user.id))
                } else {
                  setTaggedUsers([...taggedUsers, user.id])
                }
              }}
              disabled={isLoading}
            >
              {user.display_name}
            </Button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Uploading..." : "Upload Photo"}
      </Button>
    </form>
  )
}
