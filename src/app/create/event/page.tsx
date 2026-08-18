import type { Metadata } from "next"
import CreateEventForm from "./create-event-form"

export const metadata: Metadata = { title: "Create Event — Pulse" }

export default function CreateEventPage() {
  return <CreateEventForm />
}
