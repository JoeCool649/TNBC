import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Medal, Trophy, Award } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  tier_name?: string
  tier_color?: string
  total_points: number
  total_miles: number
  total_runs: number
  avg_pace: number
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
  showTier?: boolean
}

export function LeaderboardTable({ data, showTier = true }: LeaderboardTableProps) {
  const formatPace = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No runners yet. Be the first to submit a run!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
        <div className="col-span-1">Rank</div>
        <div className="col-span-4">Runner</div>
        {showTier && <div className="col-span-2">Tier</div>}
        <div className={showTier ? "col-span-2" : "col-span-3"}>Points</div>
        <div className={showTier ? "col-span-2" : "col-span-3"}>Miles</div>
        <div className="col-span-1">Runs</div>
      </div>

      {/* Rows */}
      {data.map((entry) => (
        <Link
          key={entry.user_id}
          href={`/profile/${entry.username}`}
          className="block hover:bg-muted/50 transition-colors rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-border rounded-lg md:border-0 md:rounded-none">
            {/* Rank */}
            <div className="col-span-1 flex items-center gap-2">
              {getRankIcon(entry.rank)}
              <span className="font-bold text-lg">{entry.rank}</span>
            </div>

            {/* Runner Info */}
            <div className="col-span-12 md:col-span-4 flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={entry.avatar_url || undefined} alt={entry.display_name} />
                <AvatarFallback>{entry.display_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{entry.display_name}</p>
                <p className="text-sm text-muted-foreground">@{entry.username}</p>
              </div>
            </div>

            {/* Tier */}
            {showTier && entry.tier_name && (
              <div className="col-span-6 md:col-span-2 flex items-center">
                <Badge style={{ backgroundColor: entry.tier_color }} className="text-white">
                  {entry.tier_name}
                </Badge>
              </div>
            )}

            {/* Stats */}
            <div className={`col-span-4 md:col-span-${showTier ? "2" : "3"} flex flex-col justify-center`}>
              <p className="font-bold text-lg">{entry.total_points.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>

            <div className={`col-span-4 md:col-span-${showTier ? "2" : "3"} flex flex-col justify-center`}>
              <p className="font-semibold">{entry.total_miles.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">miles</p>
            </div>

            <div className="col-span-4 md:col-span-1 flex flex-col justify-center">
              <p className="font-semibold">{entry.total_runs}</p>
              <p className="text-xs text-muted-foreground">runs</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
