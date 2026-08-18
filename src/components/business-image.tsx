import Image from "next/image"

interface BusinessImageProps {
  name: string
  category?: string
  logoUrl?: string | null
  coverUrl?: string | null
  variant?: "logo" | "cover"
  className?: string
  alt?: string
}

const fallbackColors = ["#e8dfd3", "#dfe5df", "#e3e0e8", "#e6e1d5", "#dfe5e8"]

function stableIndex(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash) % fallbackColors.length
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "P"
}

export default function BusinessImage({
  name,
  category = "Local business",
  logoUrl,
  coverUrl,
  variant = "logo",
  className = "",
  alt,
}: BusinessImageProps) {
  const source = variant === "cover" ? coverUrl : logoUrl
  const label = alt ?? (variant === "logo" ? `${name} logo` : name)

  if (source) {
    return <Image src={source} alt={label} width={200} height={200} className={className} />
  }

  const color = fallbackColors[stableIndex(`${name}:${category}:${variant}`)]
  return (
    <div
      role="img"
      aria-label={label}
      className={`business-image-fallback ${variant === "cover" ? "business-image-cover" : "business-image-logo"} ${className}`}
      style={{ backgroundColor: color }}
    >
      <span className="business-image-mark">{initials(name)}</span>
      <span className="business-image-category">{category}</span>
    </div>
  )
}
