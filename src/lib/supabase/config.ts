export interface SupabaseEnv {
  url: string | undefined
  key: string | undefined
}

const KEY_PREFIXES = ["sb_publishable_", "eyJ"]

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return {
    url,
    key: publishableKey ?? anonKey,
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseEnv()
  if (!url || !key || !url.startsWith("http")) return false
  return KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
}
