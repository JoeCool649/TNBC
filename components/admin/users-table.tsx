"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Shield, ShieldOff } from "lucide-react"

interface User {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  is_admin: boolean
  strava_connected: boolean
  created_at: string
}

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users }: UsersTableProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/toggle-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          isAdmin: !currentStatus,
        }),
      })

      if (!response.ok) throw new Error("Failed to update admin status")

      toast({
        title: "Success",
        description: `Admin status ${!currentStatus ? "granted" : "revoked"}`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No users found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
              <AvatarFallback>{user.display_name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{user.display_name}</p>
                {user.is_admin && (
                  <Badge variant="secondary">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
                {user.strava_connected && <Badge variant="outline">Strava</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          <Button
            size="sm"
            variant={user.is_admin ? "destructive" : "outline"}
            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
            disabled={isLoading}
          >
            {user.is_admin ? (
              <>
                <ShieldOff className="w-4 h-4 mr-2" />
                Revoke Admin
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Make Admin
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}
