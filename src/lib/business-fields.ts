export interface BusinessFields {
  name: string
  category: string
  location: string
  description: string | null
  phone: string | null
  email: string | null
  website: string | null
  hours: string | null
  logo_url: string | null
  cover_url: string | null
  tags: string[]
  student_discount: boolean
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value: string): boolean {
  return /^[+()\d\s.-]{7,25}$/.test(value)
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
}

export function parseBusinessFields(body: unknown): { data?: BusinessFields; error?: string } {
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {}
  const name = typeof input.name === "string" ? input.name.trim() : ""
  const category = typeof input.category === "string" ? input.category.trim() : ""
  const location = typeof input.location === "string" ? input.location.trim() : ""
  const description = typeof input.description === "string" ? input.description.trim() : null
  const phone = typeof input.phone === "string" ? input.phone.trim() : null
  const email = typeof input.email === "string" ? input.email.trim() : null
  const website = typeof input.website === "string" ? input.website.trim() : null
  const hours = typeof input.hours === "string" ? input.hours.trim() : null
  const logoUrl = typeof input.logo_url === "string" ? input.logo_url.trim() : null
  const coverUrl = typeof input.cover_url === "string" ? input.cover_url.trim() : null
  const tags = Array.isArray(input.tags)
    ? input.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
    : typeof input.tags === "string"
      ? input.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : []

  if (!name) return { error: "business name is required" }
  if (!category) return { error: "category is required" }
  if (!location) return { error: "location is required" }
  if (email && !isValidEmail(email)) return { error: "enter a valid business email" }
  if (phone && !isValidPhone(phone)) return { error: "enter a valid business phone number" }
  if (website && !isValidUrl(website)) return { error: "website must start with http:// or https://" }
  if (logoUrl && !isValidUrl(logoUrl)) return { error: "logo URL must start with http:// or https://" }
  if (coverUrl && !isValidUrl(coverUrl)) return { error: "cover image URL must start with http:// or https://" }
  if (tags.length > 12 || tags.some((tag) => tag.length > 40)) return { error: "use up to 12 tags, each under 40 characters" }

  return {
    data: {
      name,
      category,
      location,
      description,
      phone,
      email,
      website,
      hours,
      logo_url: logoUrl,
      cover_url: coverUrl,
      tags,
      student_discount: Boolean(input.student_discount),
    },
  }
}
