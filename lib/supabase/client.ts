import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase not configured. Please add your Supabase URL and anon key via the Connect tab to enable authentication features.",
    )
  }

  if (client) {
    return client
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return client
}
