import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="text-4xl mb-4">&#9888;</div>
      <h1 className="text-xl font-bold mb-2">404 — not found</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        the page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="text-sm border border-[var(--fg)] px-4 py-2 inline-block hover:bg-[var(--fg)] hover:text-[var(--bg)]"
      >
        &gt; back to feed
      </Link>
    </div>
  )
}
