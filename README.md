# Pulse

Heartbeat of your community. A Next.js 16 + Supabase platform for local businesses, events, and community engagement.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Supabase (PostgreSQL, Auth, RLS)
- **Styling:** Tailwind CSS v4
- **PWA:** Service worker, offline support, installable

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key |
| `NEXT_PUBLIC_VAPID_KEY` | No | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY` | No | VAPID private key for push notifications |

## Database Migrations

Run these in the Supabase SQL Editor:

```
supabase/migrations/009_post_likes.sql
supabase/migrations/010_event_rsvps.sql
supabase/migrations/011_post_comments.sql
supabase/migrations/012_push_subscriptions.sql
```

## Architecture

```
src/
  app/              # Next.js App Router pages
    businesses/     # Business directory + detail pages
    events/         # Event listing + detail pages
    check-in/       # QR check-in + rewards
    dashboard/      # Role-based dashboards
    admin/          # Admin overview
    map/            # Interactive SVG map
    account/        # User profile + activity
  components/       # Shared React components
  lib/
    supabase/       # Client/server Supabase setup, queries, auth
    auth.ts         # Role helpers
    notifications.ts # Push notification sender
  types/            # TypeScript type definitions
public/
  icons/            # PWA icons (192px, 512px)
  sw.js             # Service worker
  manifest.json     # PWA manifest
```

## Features

- **Community Feed** — Posts from businesses and members (announcements, hiring, volunteer, promotions)
- **Business Directory** — Search, filter, follow local businesses
- **Events** — RSVP to upcoming community events
- **Check-In** — QR-based check-ins with rewards system
- **Map** — Interactive SVG map of Arbutus, MD
- **Push Notifications** — Subscribe to updates from followed businesses
- **PWA** — Installable, works offline, app shortcuts
- **Role-Based Access** — Student, Business, Organization, Admin roles
