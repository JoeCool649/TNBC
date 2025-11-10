"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Upload, LinkIcon, AlertTriangle } from "lucide-react"

interface RunSubmissionFormProps {
  userId: string
}

export function RunSubmissionForm({ userId }: RunSubmissionFormProps) {
  const [proofType, setProofType] = useState<"screenshot" | "strava_url">("screenshot")
  const [distance, setDistance] = useState("")
  const [hours, setHours] = useState("")
  const [minutes, setMinutes] = useState("")
  const [seconds, setSeconds] = useState("")
  const [runDate, setRunDate] = useState("")
  const [proofUrl, setProofUrl] = useState("")
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0])
    }
  }

  const checkForDuplicates = async () => {
    if (!distance || !runDate) return

    try {
      const response = await fetch("/api/runs/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distance: Number.parseFloat(distance),
          runDate,
          stravaActivityId: proofType === "strava_url" ? extractStravaId(proofUrl) : null,
        }),
      })

      const data = await response.json()

      if (data.isDuplicate) {
        setDuplicateWarning(data.reason)
        setShowDuplicateWarning(true)
        return true
      }

      setShowDuplicateWarning(false)
      return false
    } catch (error) {
      console.error("Error checking duplicates:", error)
      return false
    }
  }

  const extractStravaId = (url: string): string | null => {
    const match = url.match(/activities\/(\d+)/)
    return match ? match[1] : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const hasDuplicate = await checkForDuplicates()
    if (hasDuplicate && !window.confirm("This appears to be a duplicate run. Do you want to submit anyway?")) {
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()

      // Calculate total duration in seconds
      const totalSeconds =
        (Number.parseInt(hours) || 0) * 3600 + (Number.parseInt(minutes) || 0) * 60 + (Number.parseInt(seconds) || 0)

      if (totalSeconds === 0) {
        toast({
          title: "Error",
          description: "Please enter a valid duration",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const distanceMiles = Number.parseFloat(distance)
      if (distanceMiles <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid distance",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Calculate pace (seconds per mile)
      const paceSecondsPerMile = Math.round(totalSeconds / distanceMiles)

      let finalProofUrl = proofUrl
      let stravaActivityId = null

      if (proofType === "strava_url") {
        stravaActivityId = extractStravaId(proofUrl)
      }

      // Upload screenshot if provided
      if (proofType === "screenshot" && proofFile) {
        const fileExt = proofFile.name.split(".").pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`

        const { error: uploadError, data } = await supabase.storage.from("run-proofs").upload(fileName, proofFile)

        if (uploadError) {
          toast({
            title: "Error",
            description: "Failed to upload screenshot",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("run-proofs").getPublicUrl(fileName)

        finalProofUrl = publicUrl
      }

      // Insert run into database
      const { error: insertError } = await supabase.from("runs").insert({
        user_id: userId,
        distance_miles: distanceMiles,
        duration_seconds: totalSeconds,
        pace_seconds_per_mile: paceSecondsPerMile,
        run_date: runDate,
        proof_type: proofType,
        proof_url: finalProofUrl,
        strava_activity_id: stravaActivityId,
        notes,
        status: "pending",
      })

      if (insertError) {
        toast({
          title: "Error",
          description: insertError.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Run submitted successfully! It will be reviewed by an admin.",
        })
        router.push("/dashboard")
        router.refresh()
      }
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
      {showDuplicateWarning && duplicateWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Potential Duplicate Detected</AlertTitle>
          <AlertDescription>{duplicateWarning}</AlertDescription>
        </Alert>
      )}

      {/* Proof Type Selection */}
      <div className="space-y-3">
        <Label>Proof Type</Label>
        <RadioGroup value={proofType} onValueChange={(value) => setProofType(value as "screenshot" | "strava_url")}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="screenshot" id="screenshot" />
            <Label htmlFor="screenshot" className="font-normal cursor-pointer">
              Upload Screenshot
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="strava_url" id="strava_url" />
            <Label htmlFor="strava_url" className="font-normal cursor-pointer">
              Strava Activity Link
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Proof Upload/URL */}
      {proofType === "screenshot" ? (
        <div className="space-y-2">
          <Label htmlFor="proof-file">Screenshot</Label>
          <div className="flex items-center gap-2">
            <Input
              id="proof-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              disabled={isLoading}
              className="cursor-pointer"
            />
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          {proofFile && <p className="text-sm text-muted-foreground">{proofFile.name}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="proof-url">Strava Activity URL</Label>
          <div className="flex items-center gap-2">
            <Input
              id="proof-url"
              type="url"
              placeholder="https://www.strava.com/activities/..."
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              required
              disabled={isLoading}
            />
            <LinkIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Run Details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distance">Distance (miles)</Label>
          <Input
            id="distance"
            type="number"
            step="0.01"
            placeholder="3.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            onBlur={checkForDuplicates}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="run-date">Run Date</Label>
          <Input
            id="run-date"
            type="date"
            value={runDate}
            onChange={(e) => setRunDate(e.target.value)}
            onBlur={checkForDuplicates}
            required
            disabled={isLoading}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label>Duration</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">Hours</p>
          </div>
          <div>
            <Input
              type="number"
              placeholder="Minutes"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              min="0"
              max="59"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">Minutes</p>
          </div>
          <div>
            <Input
              type="number"
              placeholder="Seconds"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              min="0"
              max="59"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">Seconds</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional details about your run..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Submitting..." : "Submit Run"}
      </Button>
    </form>
  )
}
