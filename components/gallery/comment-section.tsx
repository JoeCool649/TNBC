"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    display_name: string
    avatar_url: string | null
  }
}

interface CommentSectionProps {
  photoId: string
  currentUserId?: string
}

export function CommentSection({ photoId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchComments()
  }, [photoId])

  const fetchComments = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          profiles:user_id (username, display_name, avatar_url)
        `,
        )
        .eq("photo_id", photoId)
        .order("created_at", { ascending: true })

      if (error) throw error

      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("comments").insert({
        photo_id: photoId,
        user_id: currentUserId,
        content: newComment.trim(),
      })

      if (error) throw error

      setNewComment("")
      await fetchComments()

      toast({
        title: "Success",
        description: "Comment added",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h4 className="font-semibold">Comments</h4>

      {/* Comment List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={comment.profiles.avatar_url || undefined} alt={comment.profiles.display_name} />
                <AvatarFallback className="text-xs">
                  {comment.profiles.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{comment.profiles.display_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
      )}

      {/* Comment Form */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
            rows={2}
          />
          <Button type="submit" disabled={isSubmitting || !newComment.trim()} size="sm">
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      )}
    </div>
  )
}
