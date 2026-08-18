export const POST_TYPES = [
  "announcement",
  "event",
  "promotion",
  "update",
  "volunteer",
  "hiring",
] as const

export type PostType = (typeof POST_TYPES)[number]

export const postTypeLabels: Record<PostType, string> = {
  announcement: "Announcement",
  event: "Event",
  promotion: "Promotion",
  update: "Update",
  volunteer: "Volunteer",
  hiring: "Hiring",
}
