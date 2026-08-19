import type { SupabaseClient } from "@supabase/supabase-js"
import type { Business, Post, Event, CheckIn, Reward } from "@/types"

export interface BusinessRow {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  category: string
  hours: string | null
  location: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  cover_url: string | null
  tags: string[] | null
  verified: boolean | null
  student_discount: boolean | null
  qr_token: string | null
}

export interface PostRow {
  id: string
  author_id: string
  business_id: string | null
  type: Post["type"]
  title: string
  content: string
  image_url: string | null
  event_id: string | null
  created_at: string
  profiles?: { id: string; full_name: string | null; avatar_url: string | null } | null
  businesses?: BusinessRow | null
}

export interface EventRow {
  id: string
  organizer_id: string
  business_id: string | null
  title: string
  description: string
  starts_at: string
  ends_at: string | null
  location: string
  image_url: string | null
  category: string
  capacity: number | null
  profiles?: { id: string; full_name: string | null; avatar_url: string | null } | null
  businesses?: BusinessRow | null
}

export interface BusinessPilotPerformance {
  business: Business
  followers: number
  checkIns: number
  promotionPosts: number
  events: Array<{
    id: string
    title: string
    startsAt: string
    endsAt?: string
    promotionPosts: number
  }>
}

export interface FollowedBusiness {
  id: string
  name: string
  category: string
  location: string
}

export interface UserNotification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  createdAt: string
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" })
}

function formatEventDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (sameDay) {
    return `Today, ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}

function formatEventTime(startIso: string, endIso: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  return endIso ? `${fmt(startIso)} – ${fmt(endIso)}` : fmt(startIso)
}

function profileAsBusiness(profile: { id: string; full_name: string | null; avatar_url: string | null }): Business {
  return {
    id: profile.id,
    name: profile.full_name?.trim() || "Community Member",
    slug: profile.id,
    logo: profile.avatar_url ?? "",
    coverImage: "",
    description: "",
    category: "Member",
    hours: "",
    location: "",
    followers: 0,
    isFollowing: false,
  }
}

function mapBusiness(row: BusinessRow, followers: number, isFollowing: boolean): Business {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo_url ?? "",
    coverImage: row.cover_url ?? "",
    description: row.description ?? "",
    category: row.category,
    hours: row.hours ?? "",
    location: row.location ?? "",
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    verified: row.verified ?? false,
    tags: row.tags ?? [],
    studentDiscount: row.student_discount ?? false,
    followers,
    isFollowing,
    qrToken: row.qr_token ?? undefined,
  }
}

function mapPost(row: PostRow, businessesById: Map<string, Business>, followersById: Map<string, number>, userId: string | null, likeCounts: Map<string, number>, commentCounts: Map<string, number>): Post {
  let author: Business
  if (row.business_id && row.businesses) {
    author =
      businessesById.get(row.business_id) ??
      mapBusiness(row.businesses, followersById.get(row.business_id) ?? 0, userId !== null)
  } else if (row.profiles) {
    author = profileAsBusiness(row.profiles)
  } else {
    author = {
      id: row.author_id,
      name: "Community Member",
      slug: row.author_id,
      logo: "",
      coverImage: "",
      description: "",
      category: "Member",
      hours: "",
      location: "",
      followers: 0,
      isFollowing: false,
    }
  }

  return {
    id: row.id,
    author,
    businessId: row.business_id ?? undefined,
    type: row.type,
    title: row.title,
    content: row.content,
    image: row.image_url ?? undefined,
    eventId: row.event_id ?? undefined,
    createdAt: row.created_at,
    likes: likeCounts.get(row.id) ?? 0,
    comments: commentCounts.get(row.id) ?? 0,
  }
}

function mapEvent(row: EventRow, followers = 0, isFollowing = false): Event {
  let organizer: Business
  if (row.business_id && row.businesses) {
    organizer = mapBusiness(row.businesses, followers, isFollowing)
  } else if (row.profiles) {
    organizer = profileAsBusiness(row.profiles)
  } else {
    organizer = {
      id: row.organizer_id,
      name: "Community Member",
      slug: row.organizer_id,
      logo: "",
      coverImage: "",
      description: "",
      category: "Member",
      hours: "",
      location: "",
      followers: 0,
      isFollowing: false,
    }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    organizer,
    businessId: row.business_id ?? undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
    date: formatEventDate(row.starts_at),
    time: formatEventTime(row.starts_at, row.ends_at),
    location: row.location,
    image: row.image_url ?? "",
    category: row.category,
    capacity: row.capacity ?? undefined,
    rsvpCount: 0,
    isRsvped: false,
  }
}

async function fetchLikeCounts(
  supabase: SupabaseClient,
  postIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (postIds.length === 0) return counts
  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .in("post_id", postIds)
  if (error) return counts
  for (const row of data ?? []) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1)
  }
  return counts
}

async function fetchCommentCounts(
  supabase: SupabaseClient,
  postIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (postIds.length === 0) return counts
  const { data, error } = await supabase
    .from("post_comments")
    .select("post_id")
    .in("post_id", postIds)
  if (error) return counts
  for (const row of data ?? []) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1)
  }
  return counts
}

async function fetchFollowCounts(
  supabase: SupabaseClient,
  businessIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (businessIds.length === 0) return counts
  const { data, error } = await supabase
    .from("follows")
    .select("business_id")
    .in("business_id", businessIds)
  if (error) return counts
  for (const row of data ?? []) {
    counts.set(row.business_id, (counts.get(row.business_id) ?? 0) + 1)
  }
  return counts
}

async function fetchFollowedIds(
  supabase: SupabaseClient,
  userId: string | null,
  businessIds: string[]
): Promise<Set<string>> {
  const followed = new Set<string>()
  if (!userId || businessIds.length === 0) return followed
  const { data, error } = await supabase
    .from("follows")
    .select("business_id")
    .eq("user_id", userId)
    .in("business_id", businessIds)
  if (error) return followed
  for (const row of data ?? []) followed.add(row.business_id)
  return followed
}

export async function getBusinesses(
  supabase: SupabaseClient,
  userId: string | null = null
): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("name", { ascending: true })
  if (error) {
    console.warn("getBusinesses:", error.message)
    return []
  }
  const rows = (data ?? []) as BusinessRow[]
  const ids = rows.map((r) => r.id)
  const [counts, followed] = await Promise.all([
    fetchFollowCounts(supabase, ids),
    fetchFollowedIds(supabase, userId, ids),
  ])
  return rows.map((row) => mapBusiness(row, counts.get(row.id) ?? 0, followed.has(row.id)))
}

export async function getBusinessById(
  supabase: SupabaseClient,
  businessId: string,
  userId: string | null = null
): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle()
  if (error || !data) return null

  const [counts, followed] = await Promise.all([
    fetchFollowCounts(supabase, [businessId]),
    fetchFollowedIds(supabase, userId, [businessId]),
  ])
  return mapBusiness(data as BusinessRow, counts.get(businessId) ?? 0, followed.has(businessId))
}

export async function getOwnedBusinesses(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Business[]> {
  if (!userId) return []
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .order("name", { ascending: true })
  if (error) return []

  const rows = (data ?? []) as BusinessRow[]
  const ids = rows.map((row) => row.id)
  const counts = await fetchFollowCounts(supabase, ids)
  return rows.map((row) => mapBusiness(row, counts.get(row.id) ?? 0, false))
}

export async function getBusinessPilotPerformance(
  supabase: SupabaseClient,
  userId: string | null
): Promise<BusinessPilotPerformance[]> {
  const businesses = await getOwnedBusinesses(supabase, userId)
  const businessIds = businesses.map((business) => business.id)
  if (businessIds.length === 0) return []

  const [eventsResult, followsResult, checkInsResult, postsResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, business_id, title, starts_at, ends_at")
      .in("business_id", businessIds)
      .order("starts_at", { ascending: false }),
    supabase.from("follows").select("business_id").in("business_id", businessIds),
    supabase.from("check_ins").select("business_id").in("business_id", businessIds),
    supabase.from("posts").select("business_id, event_id").in("business_id", businessIds),
  ])

  const followerCounts = new Map<string, number>()
  for (const row of followsResult.data ?? []) {
    followerCounts.set(row.business_id, (followerCounts.get(row.business_id) ?? 0) + 1)
  }

  const checkInCounts = new Map<string, number>()
  for (const row of checkInsResult.data ?? []) {
    checkInCounts.set(row.business_id, (checkInCounts.get(row.business_id) ?? 0) + 1)
  }

  const promotionCounts = new Map<string, number>()
  for (const row of postsResult.data ?? []) {
    if (row.event_id) {
      promotionCounts.set(row.event_id, (promotionCounts.get(row.event_id) ?? 0) + 1)
    }
  }

  const eventsByBusiness = new Map<string, BusinessPilotPerformance["events"]>()
  for (const row of eventsResult.data ?? []) {
    if (!row.business_id) continue
    const events = eventsByBusiness.get(row.business_id) ?? []
    events.push({
      id: row.id,
      title: row.title,
      startsAt: row.starts_at,
      endsAt: row.ends_at ?? undefined,
      promotionPosts: promotionCounts.get(row.id) ?? 0,
    })
    eventsByBusiness.set(row.business_id, events)
  }

  return businesses.map((business) => ({
    business,
    followers: followerCounts.get(business.id) ?? 0,
    checkIns: checkInCounts.get(business.id) ?? 0,
    promotionPosts: (postsResult.data ?? []).filter((row) => row.business_id === business.id && row.event_id).length,
    events: eventsByBusiness.get(business.id) ?? [],
  }))
}

export async function getPosts(
  supabase: SupabaseClient,
  userId: string | null = null
): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, profiles!posts_author_id_fkey(id, full_name, avatar_url), businesses!posts_business_id_fkey(*)"
    )
    .order("created_at", { ascending: false })
  if (error) {
    console.warn("getPosts:", error.message)
    return []
  }
  const rows = (data ?? []) as PostRow[]
  const postIds = rows.map((r) => r.id)
  const bizIds = rows.filter((r) => r.business_id).map((r) => r.business_id!) as string[]
  const [counts, followed, likeCounts, commentCounts] = await Promise.all([
    fetchFollowCounts(supabase, bizIds),
    fetchFollowedIds(supabase, userId, bizIds),
    fetchLikeCounts(supabase, postIds),
    fetchCommentCounts(supabase, postIds),
  ])
  const businessesById = new Map<string, Business>()
  for (const row of rows) {
    if (row.business_id && row.businesses) {
      businessesById.set(
        row.business_id,
        mapBusiness(row.businesses, counts.get(row.business_id) ?? 0, followed.has(row.business_id))
      )
    }
  }
  return rows.map((row) => mapPost(row, businessesById, counts, userId, likeCounts, commentCounts))
}

export async function getPostById(
  supabase: SupabaseClient,
  postId: string,
  userId: string | null = null
): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, profiles!posts_author_id_fkey(id, full_name, avatar_url), businesses!posts_business_id_fkey(*)"
    )
    .eq("id", postId)
    .maybeSingle()
  if (error || !data) return null

  const row = data as PostRow
  const businessIds = row.business_id ? [row.business_id] : []
  const [counts, followed, likeCounts, commentCounts] = await Promise.all([
    fetchFollowCounts(supabase, businessIds),
    fetchFollowedIds(supabase, userId, businessIds),
    fetchLikeCounts(supabase, [row.id]),
    fetchCommentCounts(supabase, [row.id]),
  ])
  const businessesById = new Map<string, Business>()
  if (row.business_id && row.businesses) {
    businessesById.set(
      row.business_id,
      mapBusiness(row.businesses, counts.get(row.business_id) ?? 0, followed.has(row.business_id))
    )
  }
  return mapPost(row, businessesById, counts, userId, likeCounts, commentCounts)
}

export async function getEvents(
  supabase: SupabaseClient,
  userId: string | null = null
): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select(
      "*, profiles!events_organizer_id_fkey(id, full_name, avatar_url), businesses!events_business_id_fkey(*)",
      { count: "exact" }
    )
    .order("starts_at", { ascending: true })
  if (error) {
    console.warn("getEvents:", error.message)
    return []
  }
  const rows = (data ?? []) as EventRow[]
  const ids = rows.map((r) => r.id)
  const [counts, rsvped] = await Promise.all([
    fetchRsvpCounts(supabase, ids),
    fetchRsvpedIds(supabase, userId, ids),
  ])
  return rows.map((row) => {
    const event = mapEvent(row)
    event.rsvpCount = counts.get(row.id) ?? 0
    event.isRsvped = rsvped.has(row.id)
    return event
  })
}

export async function getEventById(
  supabase: SupabaseClient,
  eventId: string,
  userId: string | null = null
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*, profiles!events_organizer_id_fkey(id, full_name, avatar_url), businesses!events_business_id_fkey(*)")
    .eq("id", eventId)
    .maybeSingle()
  if (error || !data) return null

  const row = data as EventRow
  const [counts, followed, rsvped] = await Promise.all([
    fetchRsvpCounts(supabase, [eventId]),
    row.business_id ? fetchFollowedIds(supabase, userId, [row.business_id]) : Promise.resolve(new Set<string>()),
    fetchRsvpedIds(supabase, userId, [eventId]),
  ])
  const event = mapEvent(row, row.business_id ? 0 : 0, followed.has(row.business_id ?? ""))
  event.rsvpCount = counts.get(eventId) ?? 0
  event.isRsvped = rsvped.has(eventId)
  return event
}

export async function getUpcomingEvents(
  supabase: SupabaseClient,
  userId: string | null = null
): Promise<Event[]> {
  const now = new Date()
  const { data, error } = await supabase
    .from("events")
    .select(
      "*, profiles!events_organizer_id_fkey(id, full_name, avatar_url), businesses!events_business_id_fkey(*)",
      { count: "exact" }
    )
    .gte("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
  if (error) {
    console.warn("getUpcomingEvents:", error.message)
    return []
  }
  const rows = (data ?? []) as EventRow[]
  const ids = rows.map((r) => r.id)
  const [counts, rsvped] = await Promise.all([
    fetchRsvpCounts(supabase, ids),
    fetchRsvpedIds(supabase, userId, ids),
  ])
  return rows.map((row) => {
    const event = mapEvent(row)
    event.rsvpCount = counts.get(row.id) ?? 0
    event.isRsvped = rsvped.has(row.id)
    return event
  })
}

export async function getHappeningToday(
  supabase: SupabaseClient,
  userId: string | null = null
): Promise<Event[]> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  const { data, error } = await supabase
    .from("events")
    .select("*, profiles!events_organizer_id_fkey(id, full_name, avatar_url), businesses!events_business_id_fkey(*)")
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at", { ascending: true })
  if (error) return []
  const rows = (data ?? []) as EventRow[]
  const ids = rows.map((r) => r.id)
  const [counts, rsvped] = await Promise.all([
    fetchRsvpCounts(supabase, ids),
    fetchRsvpedIds(supabase, userId, ids),
  ])
  return rows.map((row) => {
    const event = mapEvent(row)
    event.rsvpCount = counts.get(row.id) ?? 0
    event.isRsvped = rsvped.has(row.id)
    return event
  })
}

export async function getBusinessCheckIns(
  supabase: SupabaseClient,
  userId: string | null
): Promise<CheckIn[]> {
  if (!userId) return []
  const { data, error } = await supabase
    .from("check_ins")
    .select("id, business_id, created_at, businesses(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) {
    console.warn("getBusinessCheckIns:", error.message)
    return []
  }
  return (data ?? []).map((row) => {
    const business = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses
    return {
      id: row.id,
      businessId: row.business_id,
      businessName: (business as { name: string } | null)?.name ?? "Unknown",
      time: relativeTime(row.created_at),
      createdAt: row.created_at,
    }
  })
}

export async function getRewardsForUser(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Reward[]> {
  if (!userId) return []
  const { data, error } = await supabase
    .from("rewards")
    .select("id, business_id, code, label, discount, redeemed, created_at, businesses(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) {
    console.warn("getRewardsForUser:", error.message ?? "table may not exist")
    return []
  }
  return (data ?? []).map((row) => {
    const business = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses
    return {
      businessId: row.business_id,
      code: row.code,
      label: row.label,
      discount: row.discount,
      unlockedAt: relativeTime(row.created_at),
      businessName: (business as { name: string } | null)?.name ?? "Business",
      redeemed: row.redeemed,
    }
  })
}

export async function getFollowedBusinesses(
  supabase: SupabaseClient,
  userId: string | null
): Promise<FollowedBusiness[]> {
  if (!userId) return []
  const { data, error } = await supabase
    .from("follows")
    .select("created_at, businesses(id, name, category, location)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) return []

  return (data ?? []).flatMap((row) => {
    const business = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses
    if (!business) return []
    return [{
      id: business.id,
      name: business.name,
      category: business.category,
      location: business.location ?? "",
    }]
  })
}

export async function getSavedPosts(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Post[]> {
  if (!userId) return []
  const { data, error } = await supabase
    .from("saved_posts")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error || !data?.length) return []

  const posts = await getPosts(supabase, userId)
  const byId = new Map(posts.map((post) => [post.id, post]))
  return data.flatMap((row) => {
    const post = byId.get(row.post_id)
    return post ? [post] : []
  })
}

export async function getNotificationsForUser(
  supabase: SupabaseClient,
  userId: string | null
): Promise<UserNotification[]> {
  if (!userId) return []
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)
  if (error) return []
  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    createdAt: row.created_at,
  }))
}

export async function followBusiness(
  supabase: SupabaseClient | null,
  userId: string | null,
  businessId: string
): Promise<void> {
  if (!supabase || !userId) return
  await supabase.from("follows").insert({ user_id: userId, business_id: businessId })
}

export async function unfollowBusiness(
  supabase: SupabaseClient | null,
  userId: string | null,
  businessId: string
): Promise<void> {
  if (!supabase || !userId) return
  await supabase.from("follows").delete().eq("user_id", userId).eq("business_id", businessId)
}

export async function rsvpEvent(
  supabase: SupabaseClient | null,
  userId: string | null,
  eventId: string
): Promise<void> {
  if (!supabase || !userId) return
  await supabase.from("event_rsvps").insert({ user_id: userId, event_id: eventId })
}

export async function unrsvpEvent(
  supabase: SupabaseClient | null,
  userId: string | null,
  eventId: string
): Promise<void> {
  if (!supabase || !userId) return
  await supabase.from("event_rsvps").delete().eq("user_id", userId).eq("event_id", eventId)
}

export async function fetchRsvpCounts(
  supabase: SupabaseClient,
  eventIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (eventIds.length === 0) return counts
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .in("event_id", eventIds)
  if (error) return counts
  for (const row of data ?? []) {
    counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1)
  }
  return counts
}

export async function fetchRsvpedIds(
  supabase: SupabaseClient,
  userId: string | null,
  eventIds: string[]
): Promise<Set<string>> {
  const rsvped = new Set<string>()
  if (!userId || eventIds.length === 0) return rsvped
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .eq("user_id", userId)
    .in("event_id", eventIds)
  if (error) return rsvped
  for (const row of data ?? []) rsvped.add(row.event_id)
  return rsvped
}

export interface PostComment {
  id: string
  postId: string
  userId: string
  userName: string
  content: string
  createdAt: string
  likes: number
  likedByUser: boolean
}

export async function getComments(
  supabase: SupabaseClient,
  postId: string,
  userId?: string
): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, post_id, user_id, content, created_at, profiles!post_comments_user_id_fkey(full_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
  if (error) return []

  const commentIds = (data ?? []).map((r) => r.id)
  let likedSet = new Set<string>()
  let likeCounts: Record<string, number> = {}

  if (commentIds.length > 0) {
    const [likesRes, userLikesRes] = await Promise.all([
      supabase.from("comment_likes").select("comment_id").in("comment_id", commentIds),
      userId ? supabase.from("comment_likes").select("comment_id").eq("user_id", userId).in("comment_id", commentIds) : Promise.resolve({ data: [] }),
    ])
    for (const row of likesRes.data ?? []) {
      likeCounts[row.comment_id] = (likeCounts[row.comment_id] ?? 0) + 1
    }
    for (const row of userLikesRes.data ?? []) {
      likedSet.add(row.comment_id)
    }
  }

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      userName: (profile as { full_name: string | null } | null)?.full_name?.trim() || "Member",
      content: row.content,
      createdAt: row.created_at,
      likes: likeCounts[row.id] ?? 0,
      likedByUser: likedSet.has(row.id),
    }
  })
}

export async function toggleCommentLike(
  supabase: SupabaseClient,
  userId: string,
  commentId: string,
  liked: boolean
): Promise<boolean> {
  if (liked) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("user_id", userId)
      .eq("comment_id", commentId)
    return !error
  } else {
    const { error } = await supabase
      .from("comment_likes")
      .insert({ user_id: userId, comment_id: commentId })
    return !error
  }
}

export async function addComment(
  supabase: SupabaseClient | null,
  userId: string | null,
  postId: string,
  content: string
): Promise<PostComment | null> {
  if (!supabase || !userId || !content.trim()) return null
  const { data, error } = await supabase
    .from("post_comments")
    .insert({ user_id: userId, post_id: postId, content: content.trim() })
    .select("id, post_id, user_id, content, created_at")
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    postId: data.post_id,
    userId: data.user_id,
    userName: "You",
    content: data.content,
    createdAt: data.created_at,
    likes: 0,
    likedByUser: false,
  }
}

export async function deleteComment(
  supabase: SupabaseClient | null,
  userId: string | null,
  commentId: string
): Promise<void> {
  if (!supabase || !userId) return
  await supabase.from("post_comments").delete().eq("id", commentId).eq("user_id", userId)
}

export async function getCommentCounts(
  supabase: SupabaseClient,
  postIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (postIds.length === 0) return counts
  const { data, error } = await supabase
    .from("post_comments")
    .select("post_id")
    .in("post_id", postIds)
  if (error) return counts
  for (const row of data ?? []) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1)
  }
  return counts
}

export async function getEventsByBusiness(
  supabase: SupabaseClient,
  businessId: string,
  userId: string | null = null
): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*, profiles!events_organizer_id_fkey(id, full_name, avatar_url), businesses!events_business_id_fkey(*)")
    .eq("business_id", businessId)
    .order("starts_at", { ascending: true })
  if (error) return []
  const rows = (data ?? []) as EventRow[]
  const ids = rows.map((r) => r.id)
  const [counts, rsvped] = await Promise.all([
    fetchRsvpCounts(supabase, ids),
    fetchRsvpedIds(supabase, userId, ids),
  ])
  return rows.map((row) => {
    const event = mapEvent(row)
    event.rsvpCount = counts.get(row.id) ?? 0
    event.isRsvped = rsvped.has(row.id)
    return event
  })
}

export async function getPostsByBusiness(
  supabase: SupabaseClient,
  businessId: string,
  userId: string | null = null
): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(id, full_name, avatar_url), businesses!posts_business_id_fkey(*)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(20)
  if (error) return []
  const rows = (data ?? []) as PostRow[]
  const postIds = rows.map((r) => r.id)
  const bizIds = rows.filter((r) => r.business_id).map((r) => r.business_id!) as string[]
  const [counts, followed, likeCounts, commentCounts] = await Promise.all([
    fetchFollowCounts(supabase, bizIds),
    fetchFollowedIds(supabase, userId, bizIds),
    fetchLikeCounts(supabase, postIds),
    fetchCommentCounts(supabase, postIds),
  ])
  const businessesById = new Map<string, Business>()
  for (const row of rows) {
    if (row.business_id && row.businesses) {
      businessesById.set(
        row.business_id,
        mapBusiness(row.businesses, counts.get(row.business_id) ?? 0, followed.has(row.business_id))
      )
    }
  }
  return rows.map((row) => mapPost(row, businessesById, counts, userId, likeCounts, commentCounts))
}

export async function getUserRsvps(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Event[]> {
  if (!userId) return []
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("event_id, created_at, events(*, profiles!events_organizer_id_fkey(id, full_name, avatar_url), businesses!events_business_id_fkey(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) return []
  return (data ?? []).flatMap((row) => {
    const event = Array.isArray(row.events) ? row.events[0] : row.events
    if (!event) return []
    return [mapEvent(event as EventRow)]
  })
}

export async function getUserComments(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Array<PostComment & { postTitle: string }>> {
  if (!userId) return []
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, post_id, user_id, content, created_at, posts(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)
  if (error) return []
  return (data ?? []).map((row) => {
    const post = Array.isArray(row.posts) ? row.posts[0] : row.posts
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      userName: "You",
      content: row.content,
      createdAt: row.created_at,
      likes: 0,
      likedByUser: false,
      postTitle: (post as { title: string } | null)?.title ?? "Untitled",
    }
  })
}
