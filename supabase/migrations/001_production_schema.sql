-- =============================================================================
-- Pulse — Production Database Schema
-- =============================================================================
-- Authoritative schema for the Pulse community platform.
-- Runs standalone against an empty database (the connected Supabase project has
-- NO tables yet). Supersedes the placeholder migrations 001/002 — do NOT apply
-- them first (their tables would conflict with the CREATE TABLE statements below).
--
-- Conventions:
--   * UUID primary keys via gen_random_uuid() (Postgres 13+, no extension needed)
--   * snake_case, plural table names
--   * created_at / updated_at as timestamptz, maintained by a trigger
--   * Row Level Security (RLS) enabled on every table with starter policies
--   * auth.uid() is the current user's id (auth.users.id)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Shared: updated_at trigger function
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Table: profiles
-- One row per auth user (1:1 with auth.users). Anchor for every other table.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  role text not null default 'student'
    check (role in ('student', 'business', 'organization', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles (role);
create index idx_profiles_email on public.profiles (email);

alter table public.profiles enable row level security;

-- Signed-in users can browse the community directory; rows are own-only for writes.
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Table: businesses
-- Merchant / campus business listings. The core public directory content.
-- -----------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  category text not null,
  hours text,
  location text,
  phone text,
  email text,
  website text,
  logo_url text,
  cover_url text,
  tags text[] not null default '{}',
  verified boolean not null default false,
  student_discount boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_businesses_owner on public.businesses (owner_id);
create index idx_businesses_category on public.businesses (category);

alter table public.businesses enable row level security;

-- Listings are public; only the owning profile can manage them.
create policy "Businesses are viewable by everyone"
  on public.businesses for select
  using (true);

create policy "Owners can insert their business"
  on public.businesses for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their business"
  on public.businesses for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete their business"
  on public.businesses for delete
  using (auth.uid() = owner_id);

-- -----------------------------------------------------------------------------
-- Table: organizations
-- Campus groups / clubs (e.g. Arbutus Volunteers). Mirrors businesses.
-- -----------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  category text not null default 'Community',
  email text,
  website text,
  logo_url text,
  cover_url text,
  tags text[] not null default '{}',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_organizations_owner on public.organizations (owner_id);
create index idx_organizations_category on public.organizations (category);

alter table public.organizations enable row level security;

create policy "Organizations are viewable by everyone"
  on public.organizations for select
  using (true);

create policy "Owners can insert their organization"
  on public.organizations for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their organization"
  on public.organizations for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete their organization"
  on public.organizations for delete
  using (auth.uid() = owner_id);

-- -----------------------------------------------------------------------------
-- Table: posts
-- Feed content: announcements, promotions, updates, volunteering, hiring.
-- -----------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete set null,
  type text not null
    check (type in ('announcement', 'event', 'promotion', 'update', 'volunteer', 'hiring')),
  title text not null,
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_posts_author on public.posts (author_id);
create index idx_posts_business on public.posts (business_id);
create index idx_posts_type on public.posts (type);
create index idx_posts_created on public.posts (created_at desc);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

create policy "Authors can insert posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own posts"
  on public.posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors can delete own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- Table: events
-- Community / business events with proper timestamp range.
-- -----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete set null,
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null,
  image_url text,
  category text not null default 'Social',
  capacity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_times_check check (ends_at is null or ends_at > starts_at)
);

create index idx_events_organizer on public.events (organizer_id);
create index idx_events_business on public.events (business_id);
create index idx_events_category on public.events (category);
create index idx_events_starts on public.events (starts_at asc);

alter table public.events enable row level security;

create policy "Events are viewable by everyone"
  on public.events for select
  using (true);

create policy "Organizers can insert events"
  on public.events for insert
  with check (auth.uid() = organizer_id);

create policy "Organizers can update own events"
  on public.events for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

create policy "Organizers can delete own events"
  on public.events for delete
  using (auth.uid() = organizer_id);

-- -----------------------------------------------------------------------------
-- Table: follows
-- A user following a business. Unique per (user, business) pair.
-- -----------------------------------------------------------------------------
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_user_business_unique unique (user_id, business_id)
);

create index idx_follows_business on public.follows (business_id);

alter table public.follows enable row level security;

-- Follow relationships are public so follower counts can be displayed; only the
-- user themselves can create or remove their follows.
create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

create policy "Users can follow"
  on public.follows for insert
  with check (auth.uid() = user_id);

create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Table: check_ins
-- Audit-log of a user checking in at a business. Append-only.
-- -----------------------------------------------------------------------------
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_check_ins_user on public.check_ins (user_id);
create index idx_check_ins_business on public.check_ins (business_id, created_at desc);

alter table public.check_ins enable row level security;

-- Users see their own history; business owners see check-ins at their venue
-- (needed for rewards/analytics). Inserting is self-only; rows are immutable.
create policy "Users can view own check-ins"
  on public.check_ins for select
  using (auth.uid() = user_id);

create policy "Business owners can view their check-ins"
  on public.check_ins for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = check_ins.business_id and b.owner_id = auth.uid()
    )
  );

create policy "Users can check in"
  on public.check_ins for insert
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Table: rewards
-- Check-in rewards unlocked by a user at a business (e.g. PULSE-XXXX codes).
-- -----------------------------------------------------------------------------
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  code text not null unique,
  label text not null,
  discount text not null,
  redeemed boolean not null default false,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rewards_user on public.rewards (user_id);
create index idx_rewards_business on public.rewards (business_id);

alter table public.rewards enable row level security;

-- Users manage their own rewards; business owners can see rewards they issued.
create policy "Users can view own rewards"
  on public.rewards for select
  using (auth.uid() = user_id);

create policy "Business owners can view their rewards"
  on public.rewards for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = rewards.business_id and b.owner_id = auth.uid()
    )
  );

create policy "Users can unlock rewards"
  on public.rewards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rewards"
  on public.rewards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Table: notifications
-- Per-user in-app notifications. Writes are system-side (service role or
-- security-definer functions), never direct client inserts.
-- -----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'system'
    check (type in ('system', 'follow', 'check_in', 'reward', 'event')),
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id);
create index idx_notifications_read on public.notifications (user_id, read);
create index idx_notifications_created on public.notifications (created_at desc);

alter table public.notifications enable row level security;

-- Users can read and mark-as-read their own notifications only.
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers for mutable tables
-- -----------------------------------------------------------------------------
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_businesses_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();
create trigger trg_organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger trg_posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create trigger trg_events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger trg_rewards_updated_at before update on public.rewards
  for each row execute function public.set_updated_at();
create trigger trg_notifications_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Profile bootstrap on auth signup
-- Creates the profiles row whenever a new auth user is created so that every
-- FK-referencing table has a valid anchor. SECURITY DEFINER bypasses RLS.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Privileges
-- anon: read access to publicly-viewable tables (RLS still applies).
-- authenticated: full DML on all app tables (RLS policies gate the rows).
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.businesses, public.organizations, public.posts,
  public.events, public.follows to anon;

grant select, insert, update, delete on public.profiles, public.businesses,
  public.organizations, public.posts, public.events, public.follows,
  public.check_ins, public.rewards, public.notifications to authenticated;
