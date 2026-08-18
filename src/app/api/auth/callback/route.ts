import { createClient } from "@/lib/supabase/server"
import { homeForRole, isRole } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? ""

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data } = await supabase.auth.getUser()
      const user = data.user

      let role: string | null = user?.user_metadata?.role ?? null
      if (user && !isRole(role)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
        role = profile?.role ?? null
      }

      if (next.startsWith("/") && !next.startsWith("//")) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      return NextResponse.redirect(`${origin}${homeForRole(isRole(role) ? role : null)}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
