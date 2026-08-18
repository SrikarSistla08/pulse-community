-- Persist the existing post save action for each authenticated user.
create table public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_posts_user_post_unique unique (user_id, post_id)
);

create index idx_saved_posts_user on public.saved_posts (user_id, created_at desc);

alter table public.saved_posts enable row level security;

create policy "Users can view own saved posts"
  on public.saved_posts for select
  using (auth.uid() = user_id);

create policy "Users can save posts"
  on public.saved_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave posts"
  on public.saved_posts for delete
  using (auth.uid() = user_id);

grant select, insert, delete on public.saved_posts to authenticated;
