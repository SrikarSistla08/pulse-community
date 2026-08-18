-- Add lat/lng to businesses for map display.
-- Existing seed data will be backfilled in app code.

alter table public.businesses
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists idx_businesses_coords on public.businesses (latitude, longitude)
  where latitude is not null and longitude is not null;
