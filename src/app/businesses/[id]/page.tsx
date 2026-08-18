import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getBusinessById, getPostsByBusiness, getEventsByBusiness } from "@/lib/supabase/queries"
import BusinessDetailClient from "@/components/business-detail-client"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  if (!isSupabaseConfigured()) return { title: "Business" }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const business = await getBusinessById(supabase, id, user?.id ?? null)
  return { title: business ? `${business.name} — Pulse` : "Business — Pulse" }
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!isSupabaseConfigured()) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [business, businessPosts, businessEvents] = await Promise.all([
    getBusinessById(supabase, id, user?.id ?? null),
    getPostsByBusiness(supabase, id, user?.id ?? null),
    getEventsByBusiness(supabase, id, user?.id ?? null),
  ])

  if (!business) notFound()

  return (
    <BusinessDetailClient
      business={business}
      posts={businessPosts}
      events={businessEvents}
      userId={user?.id ?? null}
    />
  )
}
