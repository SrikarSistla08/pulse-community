import Link from "next/link"

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-block text-xl font-bold tracking-wider uppercase border-b border-[var(--fg)] pb-1 no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)]"
        >
          {title}
        </Link>
        <p className="text-xs text-[var(--muted)] mt-2">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
