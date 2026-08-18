import type { Metadata } from "next"
import CommunityMap from "./community-map"

export const metadata: Metadata = {
  title: "Map — Pulse",
  description: "Explore Arbutus on the interactive map.",
}

export default function MapPage() {
  return <CommunityMap />
}
