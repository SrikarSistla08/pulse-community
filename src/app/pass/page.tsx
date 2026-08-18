import type { Metadata } from "next"
import CommunityPass from "./community-pass"

export const metadata: Metadata = { title: "Community Pass — Pulse" }

export default function PassPage() {
  return <CommunityPass />
}
