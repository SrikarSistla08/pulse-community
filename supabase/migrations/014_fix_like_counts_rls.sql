-- Fix RLS so like counts are visible to everyone.
-- Drop the restrictive select policy and replace with a public one.

drop policy if exists "Users can view own likes" on public.post_likes;

create policy "Likes are publicly visible"
  on public.post_likes for select
  using (true);
