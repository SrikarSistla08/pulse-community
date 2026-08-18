-- Link a business promotion post to the event it promotes.
-- Nullable so regular community and business posts remain supported.
alter table public.posts
  add column if not exists event_id uuid references public.events (id) on delete set null;

create index if not exists idx_posts_event on public.posts (event_id);
