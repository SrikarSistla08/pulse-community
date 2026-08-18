"use client"

import dynamic from "next/dynamic"

const CommunityMap = dynamic(() => import("@/components/community-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100dvh-120px)] flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <div className="pulse-skeleton h-3 w-28 mb-1" />
        <div className="pulse-skeleton h-7 w-56" />
      </div>
      <div className="px-4 pb-2 flex gap-1.5">
        <div className="pulse-skeleton h-7 w-20" />
        <div className="pulse-skeleton h-7 w-20" />
        <div className="pulse-skeleton h-7 w-20" />
      </div>
      <div className="flex-1 border-t border-[var(--hr)]">
        <div className="pulse-skeleton h-full w-full" />
      </div>
    </div>
  ),
})

export default function MapClient() {
  return <CommunityMap />
}
