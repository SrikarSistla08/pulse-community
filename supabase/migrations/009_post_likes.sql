-- Persist post likes so the heart toggle survives a refresh.

create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_likes_user_post_unique unique (user_id, post_id)
);

create index idx_post_likes_post on public.post_likes (post_id);
create index idx_post_likes_user on public.post_likes (user_id);

alter table public.post_likes enable row level security;

create policy "Users can view own likes"
  on public.post_likes for select
  using (auth.uid() = user_id);

create policy "Users can like posts"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on public.post_likes for delete
  using (auth.uid() = user_id);

grant select, insert, delete on public.post_likes to authenticated;
