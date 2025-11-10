"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

export function TierRecalculationButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleRecalculate = async () => {
    if (!window.confirm("This will recalculate tiers for all users based on their average pace. Continue?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/runs/recalculate-tiers", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: "Success",
        description: `Tiers recalculated for ${data.updatedUsers} users`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate tiers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleRecalculate} disabled={isLoading} variant="outline" size="sm">
      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
      Recalculate All Tiers
    </Button>
  )
}
