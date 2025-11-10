import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { Trophy } from "lucide-react"

export default async function LeaderboardPage() {
  const supabase = await getSupabaseServerClient()

  // Fetch all tiers
  const { data: tiers } = await supabase.from("tiers").select("*").order("sort_order")

  // Fetch overall leaderboard data
  const { data: overallData } = await supabase.rpc("get_overall_leaderboard")

  // Fetch tier-specific leaderboards
  const tierLeaderboards: Record<string, any[]> = {}
  if (tiers) {
    for (const tier of tiers) {
      const { data } = await supabase.rpc("get_tier_leaderboard", { tier_id_param: tier.id })
      if (data) {
        tierLeaderboards[tier.id] = data
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">See how you stack up against the competition</p>
        </div>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="overall" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            {tiers?.map((tier) => (
              <TabsTrigger key={tier.id} value={tier.id}>
                {tier.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overall Leaderboard */}
          <TabsContent value="overall">
            <Card>
              <CardHeader>
                <CardTitle>Overall Rankings</CardTitle>
                <CardDescription>Top runners across all tiers based on total points</CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardTable data={overallData || []} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tier-specific Leaderboards */}
          {tiers?.map((tier) => (
            <TabsContent key={tier.id} value={tier.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tier.color }}
                      aria-label={`${tier.name} tier color`}
                    />
                    {tier.name}
                  </CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaderboardTable data={tierLeaderboards[tier.id] || []} showTier={false} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Scoring Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Scoring Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Points Breakdown:</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>
                  <strong>Distance Points:</strong> 10 points per mile
                </li>
                <li>
                  <strong>Consistency Bonus:</strong> 50 points for each week with at least 3 runs
                </li>
                <li>
                  <strong>Long Run Bonus:</strong> 25 points for runs over 10 miles
                </li>
                <li>
                  <strong>Participation:</strong> 10 points per verified run
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Tier Assignment:</h4>
              <p className="text-muted-foreground">
                Runners are automatically assigned to tiers based on their average pace across all verified runs. Tiers
                are recalculated weekly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
