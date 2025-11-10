"use client"

import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface PhotoCardProps {
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
  onPhotoClick: () => void
}

export function PhotoCard({ photo, currentUserId, onPhotoClick }: PhotoCardProps) {
  const hasVoted = currentUserId ? photo.photo_votes.some((v) => v.user_id === currentUserId) : false
  const [isVoted, setIsVoted] = useState(hasVoted)
  const [voteCount, setVoteCount] = useState(photo.vote_count)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation()

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
        // Remove vote
        const { error } = await supabase
          .from("photo_votes")
          .delete()
          .eq("photo_id", photo.id)
          .eq("user_id", currentUserId)

        if (error) throw error

        setIsVoted(false)
        setVoteCount((prev) => prev - 1)

        // Update vote count in photos table
        await supabase
          .from("photos")
          .update({ vote_count: voteCount - 1 })
          .eq("id", photo.id)
      } else {
        // Add vote
        const { error } = await supabase.from("photo_votes").insert({
          photo_id: photo.id,
          user_id: currentUserId,
        })

        if (error) throw error

        setIsVoted(true)
        setVoteCount((prev) => prev + 1)

        // Update vote count in photos table
        await supabase
          .from("photos")
          .update({ vote_count: voteCount + 1 })
          .eq("id", photo.id)
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
    <div
      className="group relative overflow-hidden rounded-lg border border-border bg-card cursor-pointer hover:border-primary/50 transition-all"
      onClick={onPhotoClick}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        <Image
          src={photo.image_url || "/placeholder.svg"}
          alt={photo.caption || "Running photo"}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info Overlay */}
      <div className="p-3 space-y-2">
        {/* User Info */}
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={photo.profiles.avatar_url || undefined} alt={photo.profiles.display_name} />
            <AvatarFallback className="text-xs">{photo.profiles.display_name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">{photo.profiles.display_name}</span>
        </div>

        {/* Caption */}
        {photo.caption && <p className="text-sm text-muted-foreground line-clamp-2">{photo.caption}</p>}

        {/* Vote Button */}
        <Button
          variant={isVoted ? "default" : "outline"}
          size="sm"
          className="w-full"
          onClick={handleVote}
          disabled={isLoading}
        >
          <Heart className={`w-4 h-4 mr-2 ${isVoted ? "fill-current" : ""}`} />
          {voteCount} {voteCount === 1 ? "vote" : "votes"}
        </Button>
      </div>
    </div>
  )
}
