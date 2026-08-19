export type UserRole = "student" | "business" | "organization" | "admin"

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: UserRole
}

export interface Business {
  id: string
  name: string
  slug: string
  logo: string
  coverImage: string
  description: string
  category: string
  hours: string
  location: string
  phone?: string
  email?: string
  website?: string
  verified?: boolean
  tags?: string[]
  studentDiscount?: boolean
  followers: number
  isFollowing: boolean
  qrToken?: string
}

import type { PostType } from "@/lib/posts"

export interface Post {
  id: string
  author: Business
  authorRole?: UserRole
  type: PostType
  businessId?: string
  title: string
  content: string
  image?: string
  eventId?: string
  createdAt: string
  likes: number
  comments: number
}

export interface Event {
  id: string
  title: string
  description: string
  organizer: Business
  businessId?: string
  startsAt: string
  endsAt?: string
  date: string
  time: string
  location: string
  image: string
  category: string
  capacity?: number
  rsvpCount: number
  isRsvped: boolean
}

export interface DashboardMetric {
  label: string
  value: string
  change: string
  trend: "up" | "down"
}

export interface Reward {
  businessId: string
  businessName?: string
  code: string
  label: string
  discount: string
  unlockedAt: string
  redeemed?: boolean
}

export interface CheckIn {
  id?: string
  businessId: string
  businessName: string
  time: string
  createdAt?: string
}
