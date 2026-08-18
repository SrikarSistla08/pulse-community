import Link from "next/link"
import SectionHeader from "@/components/section-header"
import BusinessImage from "@/components/business-image"
import type { Business } from "@/types"

export default function ExploreCommunity({ businesses }: { businesses: Business[] }) {
  return (
    <section>
      <SectionHeader label="explore community" count={businesses.length} plain />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {businesses.map((biz) => (
          <Link
            key={biz.id}
            href={`/businesses/${biz.id}`}
            className="block pulse-card overflow-hidden no-underline hover:bg-[var(--fg)] hover:text-[var(--bg)] group"
          >
            <BusinessImage name={biz.name} category={biz.category} logoUrl={biz.logo} coverUrl={biz.coverImage} variant="cover" className="h-20 w-full object-cover duotone sm:h-24" />
            <div className="p-2.5">
              <h3 className="text-xs font-bold truncate">{biz.name}</h3>
              <p className="text-[10px] text-[var(--muted)] group-hover:text-[var(--bg)]/70 truncate">
                {biz.category}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
