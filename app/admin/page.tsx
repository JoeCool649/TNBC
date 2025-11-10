import { getSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PendingRunsTable } from "@/components/admin/pending-runs-table"
import { UsersTable } from "@/components/admin/users-table"
import { TierRecalculationButton } from "@/components/admin/tier-recalculation-button"
import { Shield, Users, Flag, CheckCircle } from "lucide-react"

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  // Fetch pending runs
  const { data: pendingRuns } = await supabase
    .from("runs")
    .select(
      `
      *,
      profiles:user_id (username, display_name, avatar_url)
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Fetch flagged runs
  const { data: flaggedRuns } = await supabase
    .from("runs")
    .select(
      `
      *,
      profiles:user_id (username, display_name, avatar_url)
    `,
    )
    .eq("status", "flagged")
    .order("created_at", { ascending: false })

  // Fetch all users
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  // Fetch tiers for assignment
  const { data: tiers } = await supabase.from("tiers").select("*").order("sort_order")

  // Stats
  const { count: pendingCount } = await supabase
    .from("runs")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: flaggedCount } = await supabase
    .from("runs")
    .select("*", { count: "exact", head: true })
    .eq("status", "flagged")

  const { count: verifiedCount } = await supabase
    .from("runs")
    .select("*", { count: "exact", head: true })
    .eq("status", "verified")

  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage runs, users, and league settings</p>
          </div>
          {/* Tier Recalculation Button */}
          <TierRecalculationButton />
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Pending Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingCount || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-destructive" />
                Flagged Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{flaggedCount || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Verified Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{verifiedCount || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalUsers || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending Runs {pendingCount ? `(${pendingCount})` : ""}</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Runs {flaggedCount ? `(${flaggedCount})` : ""}</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Pending Runs */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Run Submissions</CardTitle>
                <CardDescription>Review and verify submitted runs</CardDescription>
              </CardHeader>
              <CardContent>
                <PendingRunsTable runs={pendingRuns || []} tiers={tiers || []} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flagged Runs */}
          <TabsContent value="flagged">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Runs</CardTitle>
                <CardDescription>Review runs that have been flagged for issues</CardDescription>
              </CardHeader>
              <CardContent>
                <PendingRunsTable runs={flaggedRuns || []} tiers={tiers || []} isFlagged />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTable users={users || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
