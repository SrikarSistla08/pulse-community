"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type { User } from "@supabase/supabase-js"

export function useSupabase() {
  const client = useMemo(() => {
    if (!isSupabaseConfigured()) return null
    return createClient()
  }, [])
  return client
}

export function useCurrentUser(): User | null {
  const supabase = useSupabase()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [supabase])

  return user
}
