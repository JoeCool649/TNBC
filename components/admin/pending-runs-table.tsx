"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, ExternalLink, Flag } from "lucide-react"
import { formatPace, formatDuration } from "@/lib/utils/tier-calculator"
import Image from "next/image"

interface Run {
  id: string
  user_id: string
  distance_miles: number
  duration_seconds: number
  pace_seconds_per_mile: number
  run_date: string
  proof_type: string
  proof_url: string
  notes: string | null
  status: string
  flagged_reason: string | null
  profiles: {
    username: string
    display_name: string
    avatar_url: string | null
  }
}

interface Tier {
  id: string
  name: string
  color: string
}

interface PendingRunsTableProps {
  runs: Run[]
  tiers: Tier[]
  isFlagged?: boolean
}

export function PendingRunsTable({ runs, tiers, isFlagged = false }: PendingRunsTableProps) {
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)
  const [selectedTier, setSelectedTier] = useState<string>("")
  const [flagReason, setFlagReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleVerify = async (runId: string, tierId: string) => {
    if (!tierId) {
      toast({
        title: "Error",
        description: "Please select a tier",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/runs/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          status: "verified",
          tierId,
        }),
      })

      if (!response.ok) throw new Error("Failed to verify run")

      toast({
        title: "Success",
        description: "Run verified successfully",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify run",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async (runId: string) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/runs/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          status: "rejected",
          tierId: null,
        }),
      })

      if (!response.ok) throw new Error("Failed to reject run")

      toast({
        title: "Success",
        description: "Run rejected",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject run",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFlag = async (runId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for flagging",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/runs/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          reason,
        }),
      })

      if (!response.ok) throw new Error("Failed to flag run")

      toast({
        title: "Success",
        description: "Run flagged for review",
      })

      setFlagReason("")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to flag run",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (runs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No {isFlagged ? "flagged" : "pending"} runs</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {runs.map((run) => (
        <div key={run.id} className="border border-border rounded-lg p-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={run.profiles.avatar_url || undefined} alt={run.profiles.display_name} />
                <AvatarFallback>{run.profiles.display_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{run.profiles.display_name}</p>
                <p className="text-sm text-muted-foreground">@{run.profiles.username}</p>
              </div>
            </div>
            <Badge variant={isFlagged ? "destructive" : "secondary"}>{run.status}</Badge>
          </div>

          {/* Run Details */}
          <div className="grid sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Distance</p>
              <p className="font-semibold">{Number(run.distance_miles).toFixed(2)} mi</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-semibold">{formatDuration(run.duration_seconds)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pace</p>
              <p className="font-semibold">{formatPace(run.pace_seconds_per_mile)}/mi</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-semibold">{new Date(run.run_date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Notes */}
          {run.notes && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Notes:</p>
              <p>{run.notes}</p>
            </div>
          )}

          {/* Flagged Reason */}
          {run.flagged_reason && (
            <div className="text-sm bg-destructive/10 p-3 rounded-lg">
              <p className="text-destructive font-semibold mb-1">Flagged Reason:</p>
              <p>{run.flagged_reason}</p>
            </div>
          )}

          {/* Proof */}
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  View Proof
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Run Proof</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {run.proof_type === "screenshot" ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={run.proof_url || "/placeholder.svg"}
                        alt="Run proof"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="p-4 border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Strava Activity Link:</p>
                      <a
                        href={run.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        {run.proof_url}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                      {tier.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button size="sm" onClick={() => handleVerify(run.id, selectedTier)} disabled={isLoading || !selectedTier}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify
            </Button>

            <Button size="sm" variant="destructive" onClick={() => handleReject(run.id)} disabled={isLoading}>
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>

            {!isFlagged && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isLoading}>
                    <Flag className="w-4 h-4 mr-2" />
                    Flag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Flag Run</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for flagging</Label>
                      <Textarea
                        id="reason"
                        placeholder="Describe the issue..."
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button onClick={() => handleFlag(run.id, flagReason)} disabled={isLoading} className="w-full">
                      Submit Flag
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
