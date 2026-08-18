import type { Metadata } from "next"
import CreatePostForm from "./create-post-form"

export const metadata: Metadata = { title: "Create Post — Pulse" }

export default function CreatePostPage() {
  return <CreatePostForm />
}
