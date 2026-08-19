"use client"

import { useEffect, useState } from "react"
import { useSupabase, useCurrentUser } from "@/lib/supabase/hooks"

export default function PushNotifications() {
  const supabase = useSupabase()
  const user = useCurrentUser()
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    setSupported(true)

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub)
      })
    })
  }, [])

  async function subscribe() {
    if (!supabase || !user) return

    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
    })

    const { endpoint, keys } = sub.toJSON()
    if (endpoint && keys) {
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
    }

    setSubscribed(true)
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      setSubscribed(false)
    }
  }

  if (!supported || !user) return null

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      className="text-[11px] text-[var(--dim)] hover:text-[var(--fg)] transition-colors"
    >
      {subscribed ? "notifications on" : "enable notifications"}
    </button>
  )
}
