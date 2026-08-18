-- Comments on posts.

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_post_comments_post on public.post_comments (post_id, created_at asc);
create index idx_post_comments_user on public.post_comments (user_id);

alter table public.post_comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.post_comments for select
  using (true);

create policy "Users can insert comments"
  on public.post_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own comments"
  on public.post_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.post_comments for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.post_comments to authenticated;

create trigger set_updated_at
  before update on public.post_comments
  for each row execute function public.set_updated_at();
