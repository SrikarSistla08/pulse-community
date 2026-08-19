create table if not exists comment_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  comment_id uuid references post_comments(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, comment_id)
);

alter table comment_likes enable row level security;

create policy "comment_likes_read_all" on comment_likes
  for select using (true);

create policy "comment_likes_insert_own" on comment_likes
  for insert with check (auth.uid() = user_id);

create policy "comment_likes_delete_own" on comment_likes
  for delete using (auth.uid() = user_id);
