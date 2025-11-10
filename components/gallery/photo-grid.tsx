"use client"

import { useState } from "react"
import { PhotoCard } from "./photo-card"
import { PhotoModal } from "./photo-modal"

interface Photo {
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

interface PhotoGridProps {
  photos: Photo[]
  currentUserId?: string
}

export function PhotoGrid({ photos, currentUserId }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No photos yet. Be the first to share!</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            currentUserId={currentUserId}
            onPhotoClick={() => setSelectedPhoto(photo)}
          />
        ))}
      </div>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          currentUserId={currentUserId}
          onClose={() => setSelectedPhoto(null)}
          onVoteUpdate={(photoId, newVoteCount, hasVoted) => {
            // Update the photo in the list
            const updatedPhotos = photos.map((p) => {
              if (p.id === photoId) {
                return {
                  ...p,
                  vote_count: newVoteCount,
                  photo_votes: hasVoted
                    ? [...p.photo_votes, { user_id: currentUserId! }]
                    : p.photo_votes.filter((v) => v.user_id !== currentUserId),
                }
              }
              return p
            })
            setSelectedPhoto(updatedPhotos.find((p) => p.id === photoId) || null)
          }}
        />
      )}
    </>
  )
}
