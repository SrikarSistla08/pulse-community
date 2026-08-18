import webPush from "web-push"

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    "mailto:hello@pulse.app",
    vapidPublicKey,
    vapidPrivateKey
  )
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  // Import supabase admin client for server-side operations
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId)

  if (!subs || subs.length === 0) return

  const payload = JSON.stringify({ title, body, url: url || "/" })

  await Promise.allSettled(
    subs.map((sub) =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err: any) => {
        if (err.statusCode === 410) {
          // Subscription expired, remove it
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint)
        }
      })
    )
  )
}
