import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"

const BUCKET = "pulse"

export async function uploadImage(
  file: File,
  userId: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("storage is not configured")
  }

  const supabase = createClient()
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}