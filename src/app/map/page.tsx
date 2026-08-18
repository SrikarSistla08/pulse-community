import type { Metadata } from "next"
import MapClient from "@/components/map-client"

export const metadata: Metadata = {
  title: "Map — Pulse",
  description: "Explore Arbutus on the interactive map.",
}

export default function MapPage() {
  return <MapClient />
}
