import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Camera, Users, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-balance">
              Nightmare Before Christmas <span className="text-primary">Run League</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty">
              Join the spookiest, most festive running competition of the season. Submit your runs, climb the
              leaderboards, and share your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/leaderboard">View Leaderboard</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/submit">Submit a Run</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 space-y-3 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Tiered Competition</h3>
            <p className="text-muted-foreground text-sm">
              Compete against runners of similar ability. Auto-tiering based on your pace.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:border-secondary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Custom Scoring</h3>
            <p className="text-muted-foreground text-sm">
              Points for distance, consistency, and participation. Multiple ways to win.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:border-accent/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Camera className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Photo Gallery</h3>
            <p className="text-muted-foreground text-sm">
              Share your running moments. Vote on favorites and tag fellow runners.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Community</h3>
            <p className="text-muted-foreground text-sm">
              Connect with local runners. Comment, encourage, and celebrate together.
            </p>
          </Card>
        </div>

        {/* Season Info */}
        <div className="mt-16 max-w-2xl mx-auto">
          <Card className="p-8 text-center space-y-4 bg-gradient-to-br from-card to-muted/20">
            <h2 className="text-2xl md:text-3xl font-bold">Season: October - December 2024</h2>
            <p className="text-muted-foreground">
              Submit runs with proof (screenshots or Strava links). Get verified, earn points, and climb the
              leaderboards. May the fastest ghoul win!
            </p>
            <Button size="lg" className="mt-4" asChild>
              <Link href="/auth/signup">Join the League</Link>
            </Button>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Nightmare Before Christmas Run League &copy; 2025</p>
          <p className="mt-2">Built with spooky spirit and festive cheer</p>
        </div>
      </footer>
    </div>
  )
}
