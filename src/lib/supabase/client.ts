import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config"

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.")
  }
  const { url, key } = getSupabaseEnv()
  return createBrowserClient(url!, key!)
}
