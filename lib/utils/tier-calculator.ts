// Calculate which tier a runner belongs to based on their pace
export function calculateTier(paceSecondsPerMile: number): string {
  // Elite Ghouls: Sub-7 minute mile (< 420 seconds)
  if (paceSecondsPerMile < 420) {
    return "Elite Ghouls"
  }
  // Speedy Spirits: 7:00-8:30 pace (420-510 seconds)
  if (paceSecondsPerMile < 510) {
    return "Speedy Spirits"
  }
  // Midnight Runners: 8:30-10:00 pace (510-600 seconds)
  if (paceSecondsPerMile < 600) {
    return "Midnight Runners"
  }
  // Pumpkin Pacers: 10:00-12:00 pace (600-720 seconds)
  if (paceSecondsPerMile < 720) {
    return "Pumpkin Pacers"
  }
  // Festive Walkers: 12:00+ pace (>= 720 seconds)
  return "Festive Walkers"
}

// Format pace from seconds to MM:SS
export function formatPace(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// Format duration from seconds to HH:MM:SS
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}
