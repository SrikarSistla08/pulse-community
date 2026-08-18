-- Track who is attending which events.

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint event_rsvps_user_event_unique unique (user_id, event_id)
);

create index idx_event_rsvps_event on public.event_rsvps (event_id);
create index idx_event_rsvps_user on public.event_rsvps (user_id);

alter table public.event_rsvps enable row level security;

create policy "RSVPs are viewable by everyone"
  on public.event_rsvps for select
  using (true);

create policy "Users can RSVP"
  on public.event_rsvps for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel RSVP"
  on public.event_rsvps for delete
  using (auth.uid() = user_id);

grant select, insert, delete on public.event_rsvps to authenticated;
