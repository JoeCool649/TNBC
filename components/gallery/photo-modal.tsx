"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { CommentSection } from "./comment-section"
import Image from "next/image"

interface PhotoModalProps {
  photo: {
    id: string
    user_id: string
    image_url: string
    caption: string | null
    vote_count: number
    created_at: string
    profiles: {
      username: string
      display_name: string
      avatar_url: string | null
    }
    photo_votes: Array<{ user_id: string }>
  }
  currentUserId?: string
  onClose: () => void
  onVoteUpdate: (photoId: string, newVoteCount: number, hasVoted: boolean) => void
}

export function PhotoModal({ photo, currentUserId, onClose, onVoteUpdate }: PhotoModalProps) {
  const hasVoted = currentUserId ? photo.photo_votes.some((v) => v.user_id === currentUserId) : false
  const [isVoted, setIsVoted] = useState(hasVoted)
  const [voteCount, setVoteCount] = useState(photo.vote_count)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleVote = async () => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on photos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      if (isVoted) {
        const { error } = await supabase
          .from("photo_votes")
          .delete()
          .eq("photo_id", photo.id)
          .eq("user_id", currentUserId)

        if (error) throw error

        const newVoteCount = voteCount - 1
        setIsVoted(false)
        setVoteCount(newVoteCount)
        onVoteUpdate(photo.id, newVoteCount, false)

        await supabase.from("photos").update({ vote_count: newVoteCount }).eq("id", photo.id)
      } else {
        const { error } = await supabase.from("photo_votes").insert({
          photo_id: photo.id,
          user_id: currentUserId,
        })

        if (error) throw error

        const newVoteCount = voteCount + 1
        setIsVoted(true)
        setVoteCount(newVoteCount)
        onVoteUpdate(photo.id, newVoteCount, true)

        await supabase.from("photos").update({ vote_count: newVoteCount }).eq("id", photo.id)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vote",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={photo.profiles.avatar_url || undefined} alt={photo.profiles.display_name} />
              <AvatarFallback>{photo.profiles.display_name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{photo.profiles.display_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={photo.image_url || "/placeholder.svg"}
              alt={photo.caption || "Running photo"}
              fill
              className="object-contain"
            />
          </div>

          {/* Caption */}
          {photo.caption && (
            <div className="space-y-1">
              <h4 className="font-semibold">Caption</h4>
              <p className="text-muted-foreground">{photo.caption}</p>
            </div>
          )}

          {/* Vote Button */}
          <Button
            variant={isVoted ? "default" : "outline"}
            onClick={handleVote}
            disabled={isLoading}
            className="w-full"
          >
            <Heart className={`w-4 h-4 mr-2 ${isVoted ? "fill-current" : ""}`} />
            {voteCount} {voteCount === 1 ? "vote" : "votes"}
          </Button>

          {/* Comments */}
          <CommentSection photoId={photo.id} currentUserId={currentUserId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
