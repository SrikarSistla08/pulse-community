"use client"

import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { homeForRole, isRole, type Role } from "@/lib/auth"
import type { SupabaseClient, User } from "@supabase/supabase-js"

export { isSupabaseConfigured }

export interface SignUpInput {
  fullName: string
  email: string
  password: string
  role: Role
}

export async function signUpWithPassword(input: SignUpInput) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        role: input.role,
      },
    },
  })

  if (!error && data.user) {
    await ensureProfile(supabase, data.user, input)
  }

  return {
    user: data.user,
    session: data.session,
    needsConfirmation: !data.session,
    error,
  }
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithGoogle() {
  const supabase = createClient()
  const redirectTo = `${window.location.origin}/api/auth/callback`
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  })
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
  input: SignUpInput
) {
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: input.fullName,
      email: user.email ?? input.email,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: input.role,
    },
    { onConflict: "id" }
  )
}

export async function resolveRoleHome(): Promise<string> {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return homeForRole(null)

  const metadataRole = user.user_metadata?.role
  if (isRole(metadataRole)) {
    if (metadataRole === "business") {
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle()
      return business ? "/business/dashboard" : "/business/onboarding"
    }
    return homeForRole(metadataRole)
  }

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = isRole(data?.role) ? data!.role : null
  if (role === "business") {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle()
    return business ? "/business/dashboard" : "/business/onboarding"
  }
  return homeForRole(role)
}

export async function getProfileRole(): Promise<Role> {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return "student"

  const metadataRole = user.user_metadata?.role
  if (isRole(metadataRole)) return metadataRole

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  return isRole(data?.role) ? data!.role : "student"
}
