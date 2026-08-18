import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const business_id = typeof body.business_id === "string" ? body.business_id : ""
  if (!business_id) return NextResponse.json({ error: "business_id is required" }, { status: 400 })

  const { data: priorReward } = await supabase
    .from("rewards")
    .select("id")
    .eq("user_id", user.id)
    .eq("business_id", business_id)
    .limit(1)
    .maybeSingle()

  const { data: checkIn, error } = await supabase
    .from("check_ins")
    .insert({ user_id: user.id, business_id })
    .select("id, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  let reward = null
  if (!priorReward) {
    const { data: createdReward, error: rewardError } = await supabase
      .from("rewards")
      .insert({
        user_id: user.id,
        business_id,
        code: `PULSE-${randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase()}`,
        label: "10% off your first visit",
        discount: "10% off",
      })
      .select("id, business_id, code, label, discount, redeemed, created_at")
      .single()

    if (!rewardError) {
      reward = {
        businessId: createdReward.business_id,
        code: createdReward.code,
        label: createdReward.label,
        discount: createdReward.discount,
        redeemed: createdReward.redeemed,
        unlockedAt: createdReward.created_at,
      }
    } else {
      const { data: existingReward } = await supabase
        .from("rewards")
        .select("id, business_id, code, label, discount, redeemed, created_at")
        .eq("user_id", user.id)
        .eq("business_id", business_id)
        .limit(1)
        .maybeSingle()
      if (existingReward) {
        reward = {
          businessId: existingReward.business_id,
          code: existingReward.code,
          label: existingReward.label,
          discount: existingReward.discount,
          redeemed: existingReward.redeemed,
          unlockedAt: existingReward.created_at,
        }
      }
    }
  }

  const { count } = await supabase
    .from("check_ins")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("business_id", business_id)

  return NextResponse.json({
    success: true,
    checkIn,
    reward,
    isFirstVisit: !priorReward,
    visitCount: count ?? 1,
  })
}
