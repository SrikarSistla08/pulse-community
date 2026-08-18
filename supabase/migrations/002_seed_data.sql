-- =============================================================================
-- Pulse — Seed Data
-- =============================================================================
-- Demo content for the Pulse community platform. Run this in the Supabase
-- dashboard SQL editor (or any privileged psql session) AFTER applying
-- 001_production_schema.sql.
--
-- What this creates:
--   * Demo auth users (confirmed, so they can log in immediately) + profiles
--   * Businesses (Fish Head Cantina, Arbutus Coffee Co., ...)
--   * An organization (Arbutus Volunteers)
--   * Posts, events, follows, check-ins, rewards, notifications
--
-- Passwords (all demo users): Pulse123!
-- Login emails:
--   sofia@pulse.demo   (business owner — Fish Head Cantina)
--   lena@pulse.demo    (business owner — Arbutus Coffee Co.)
--   priya@pulse.demo   (organization owner — Arbutus Volunteers)
--   maya@pulse.demo    (student)
--   marcus@pulse.demo  (student)
--   dev@pulse.demo     (student)
--
-- Idempotent: safe to run more than once (auth.users/profiles use
-- on conflict do nothing; the rest only insert if their tables are empty).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Demo auth users + profiles
-- -----------------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'sofia@pulse.demo', crypt('Pulse123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sofia Reyes","role":"business"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated',
   'lena@pulse.demo', crypt('Pulse123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lena Torres","role":"business"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated',
   'priya@pulse.demo', crypt('Pulse123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Sharma","role":"organization"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'maya@pulse.demo', crypt('Pulse123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maya Chen","role":"student"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated',
   'marcus@pulse.demo', crypt('Pulse123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Webb","role":"student"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated',
   'dev@pulse.demo', crypt('Pulse123!', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dev Patel","role":"student"}', now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, full_name, email, role)
values
  ('11111111-1111-4111-8111-111111111111', 'Sofia Reyes', 'sofia@pulse.demo', 'business'),
  ('66666666-6666-4666-8666-666666666666', 'Lena Torres', 'lena@pulse.demo', 'business'),
  ('33333333-3333-4333-8333-333333333333', 'Priya Sharma', 'priya@pulse.demo', 'organization'),
  ('22222222-2222-4222-8222-222222222222', 'Maya Chen', 'maya@pulse.demo', 'student'),
  ('44444444-4444-4444-8444-444444444444', 'Marcus Webb', 'marcus@pulse.demo', 'student'),
  ('55555555-5555-4555-8555-555555555555', 'Dev Patel', 'dev@pulse.demo', 'student')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Businesses
-- -----------------------------------------------------------------------------
insert into public.businesses (id, owner_id, name, slug, description, category, hours,
  location, phone, email, website, tags, verified, student_discount)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111',
   'Fish Head Cantina', 'fish-head-cantina',
   'Coastal kitchen and craft bar two blocks from campus. Known for fresh-catch tacos, local brews, and late-night bites.',
   'Restaurant', 'Mon–Thu 11am–11pm, Fri–Sat 11am–1am, Sun 12pm–10pm',
   '2144 Arbutus St, Vancouver', '(604) 555-0142', 'hello@fishheadcantina.com', 'https://fishheadcantina.example.com',
   array['tacos', 'craft-beer', 'live-music', 'patio'], true, true),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '66666666-6666-4666-8666-666666666666',
   'Arbutus Coffee Co.', 'arbutus-coffee-co',
   'Third-wave coffee, pastries from a local bakery, and a sun-drenched study loft. Student cups are 10% off every day.',
   'Cafe', 'Mon–Fri 7am–9pm, Sat–Sun 8am–7pm',
   '3302 W Broadway, Vancouver', '(604) 555-0176', 'hi@arbutuscoffee.co', 'https://arbutuscoffee.example.com',
   array['coffee', 'study-spot', 'pastries', 'wifi'], true, true),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111',
   'Trailside Books', 'trailside-books',
   'Independent bookstore with a curated campus section, zines, and a weekly poetry reading by the fireplace.',
   'Books', 'Mon–Sat 10am–8pm, Sun 11am–6pm',
   '4500 W 10th Ave, Vancouver', '(604) 555-0131', 'books@trailside.example.com', 'https://trailside.example.com',
   array['books', 'poetry', 'secondhand', 'cozy'], true, false),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '66666666-6666-4666-8666-666666666666',
   'Campus Bikes & Repair', 'campus-bikes-repair',
   'New and used bikes, same-day tune-ups, and a student workshop night every Tuesday.',
   'Services', 'Mon–Fri 9am–7pm, Sat 10am–5pm, Sun closed',
   '2710 Alma St, Vancouver', '(604) 555-0188', 'ride@campusbikes.example.com', 'https://campusbikes.example.com',
   array['bikes', 'repair', 'workshop'], true, true),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '66666666-6666-4666-8666-666666666666',
   'The Green Bean Market', 'green-bean-market',
   'Neighborhood grocery with bulk bins, grab-and-go lunches, and a wall of local sauces and jams.',
   'Groceries', 'Daily 8am–10pm',
   '1855 W 4th Ave, Vancouver', '(604) 555-0153', 'store@greenbean.example.com', 'https://greenbean.example.com',
   array['groceries', 'bulk', 'local', 'lunch'], true, false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Organization
-- -----------------------------------------------------------------------------
insert into public.organizations (id, owner_id, name, slug, description, category,
  email, website, tags, verified)
values
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', '33333333-3333-4333-8333-333333333333',
   'Arbutus Volunteers', 'arbutus-volunteers',
   'Campus-run volunteer collective organizing beach cleanups, food drives, and mentorship programs across the West Side.',
   'Community', 'volunteer@arbutus.example.com', 'https://arbutusvolunteers.example.com',
   array['volunteering', 'cleanup', 'food-drive', 'mentorship'], true)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Posts
-- -----------------------------------------------------------------------------
insert into public.posts (author_id, business_id, type, title, content, created_at)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'announcement', 'Fresh Catch Fridays are back',
   'Every Friday we haul in a new catch from the coast. Try the halibut taco special before it is gone — students get 15% off with a Pulse check-in.',
   now() - interval '2 hours'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'promotion', 'Late-night kitchen extended to 1am on weekends',
   'Finals season is here. The kitchen now stays open until 1am on Fridays and Saturdays. Bring your study group and a big appetite.',
   now() - interval '1 day'),
  ('66666666-6666-4666-8666-666666666666', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'hiring', 'We are hiring: barista (part-time)',
   'Arbutus Coffee Co. is looking for a friendly part-time barista, 15–20 hrs/week, mornings preferred. Experience not required — attitude is.',
   now() - interval '5 hours'),
  ('33333333-3333-4333-8333-333333333333', null,
   'volunteer', 'Saturday beach cleanup at Spanish Banks',
   'Join Arbutus Volunteers this Saturday for a shoreline cleanup. Gloves, bags, and snacks provided. Meet at the lifeguard station at 10am.',
   now() - interval '1 day'),
  ('22222222-2222-4222-8222-222222222222', null,
   'update', 'Anyone studying for the physics midterm?',
   'Booking the quiet room in the library for Monday evening. Group study, snacks supplied. DM me if you want in!',
   now() - interval '3 hours');

-- -----------------------------------------------------------------------------
-- Events
-- -----------------------------------------------------------------------------
insert into public.events (organizer_id, business_id, title, description, starts_at, ends_at,
  location, category, capacity)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Halibut Taco Night',
   'A tasting menu of our best-selling halibut tacos plus two local craft beers on tap. Students eat for $12 with a Pulse check-in.',
   now() + interval '2 days 18 hours', now() + interval '2 days 21 hours',
   'Fish Head Cantina, 2144 Arbutus St', 'Social', 60),
  ('66666666-6666-4666-8666-666666666666', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'Late-Night Study Hall',
   'The loft stays open late with free drip coffee refills for card-carrying students. Silent-study tables and whiteboards provided.',
   now() + interval '1 day 20 hours', now() + interval '2 days 1 hour',
   'Arbutus Coffee Co., 3302 W Broadway', 'Workshop', 40),
  ('33333333-3333-4333-8333-333333333333', null,
   'Volunteer Orientation & Spring Mixer',
   'New faces welcome. Meet the Arbutus Volunteers coordinators, hear about upcoming projects, and sign up for the spring calendar.',
   now() + interval '5 days 19 hours', now() + interval '5 days 21 hours',
   'Campus Commons Room 112', 'Social', 80),
  ('11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
   'Poetry Night at Trailside',
   'Open-mic poetry by the fireplace. Sign up at the counter, read for five minutes, or just listen with a hot drink.',
   now() + interval '8 days 20 hours', now() + interval '8 days 22 hours',
   'Trailside Books, 4500 W 10th Ave', 'Education', 35),
  ('66666666-6666-4666-8666-666666666666', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
   'Tuesday Bike Workshop',
   'Free beginner tune-up clinic. Learn to fix a flat, adjust brakes, and keep your ride campus-ready. Bring your own bike.',
   now() + interval '6 days 1 hour', now() + interval '6 days 3 hours',
   'Campus Bikes & Repair, 2710 Alma St', 'Workshop', 25);

-- -----------------------------------------------------------------------------
-- Follows
-- -----------------------------------------------------------------------------
insert into public.follows (user_id, business_id)
values
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('44444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('55555555-5555-4555-8555-555555555555', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd')
on conflict (user_id, business_id) do nothing;

-- -----------------------------------------------------------------------------
-- Check-ins
-- -----------------------------------------------------------------------------
insert into public.check_ins (user_id, business_id, created_at)
values
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now() - interval '2 hours'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', now() - interval '1 day'),
  ('44444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', now() - interval '3 hours'),
  ('55555555-5555-4555-8555-555555555555', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', now() - interval '2 days');

-- -----------------------------------------------------------------------------
-- Rewards
-- -----------------------------------------------------------------------------
insert into public.rewards (user_id, business_id, code, label, discount, redeemed)
values
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'PULSE-7F3K',
   'Welcome Check-In', '15% off your next visit', false),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'PULSE-2Q1M',
   'Student Cup', '10% off any drink', true)
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
insert into public.notifications (user_id, type, title, body, link, read, created_at)
values
  ('22222222-2222-4222-8222-222222222222', 'reward',
   'Reward unlocked at Fish Head Cantina',
   'You earned a Welcome Check-In reward: 15% off your next visit. Show the code from your pass to redeem.',
   '/pass', false, now() - interval '2 hours'),
  ('22222222-2222-4222-8222-222222222222', 'event',
   'New event near you',
   'Halibut Taco Night starts in 2 days at Fish Head Cantina.',
   '/events', false, now() - interval '1 day'),
  ('11111111-1111-4111-8111-111111111111', 'check_in',
   'Maya Chen checked in',
   'Maya just checked in at Fish Head Cantina.',
   '/dashboard', false, now() - interval '2 hours'),
  ('66666666-6666-4666-8666-666666666666', 'check_in',
   'New check-in at Arbutus Coffee Co.',
   'Two students checked in today. Rewards are flowing!',
   '/dashboard', false, now() - interval '1 day');
