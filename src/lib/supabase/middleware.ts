import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseEnv } from "@/lib/supabase/config"
import { homeForRole, isRole } from "@/lib/auth"

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/business",
  "/organization",
  "/admin",
  "/check-in",
  "/pass",
  "/create",
  "/profile",
  "/account",
]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function roleScopeFor(pathname: string): "admin" | "business" | "organization" | null {
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/business")) return "business"
  if (pathname.startsWith("/organization")) return "organization"
  return null
}

export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv()

  if (!url || !key) {
    return NextResponse.next({ request })
  }

  const { pathname } = request.nextUrl
  if (!isProtected(pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const scope = roleScopeFor(pathname)
  if (scope) {
    let role = user.user_metadata?.role
    if (!isRole(role)) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
      role = data?.role ?? null
    }

    if (!isRole(role) || role !== scope) {
      const target = new URL(homeForRole(isRole(role) ? role : null), request.url)
      target.searchParams.set("next", pathname)
      return NextResponse.redirect(target)
    }
  }

  return supabaseResponse
}
