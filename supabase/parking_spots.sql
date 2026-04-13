-- =============================================================
-- parking_spots table
-- Run this in your Supabase project → SQL Editor
-- =============================================================

create table if not exists public.parking_spots (
  id             text primary key,
  lat            double precision not null,
  lng            double precision not null,
  street_name    text not null default 'Unknown Street',
  zone_type      text not null default 'none'
                   check (zone_type in ('none', 'blue', 'green')),
  status         text not null default 'free'
                   check (status in ('free', 'occupied', 'reserved')),
  occupied_by    uuid references auth.users(id) on delete set null,
  occupied_at    timestamptz,
  expected_free_at timestamptz
);

-- Enable Row Level Security
alter table public.parking_spots enable row level security;

-- Anyone (including unauthenticated) can read spots
create policy "read_spots"
  on public.parking_spots for select
  using (true);

-- Only authenticated users can update spots
create policy "update_spots"
  on public.parking_spots for update
  to authenticated
  using (true)
  with check (true);

-- =============================================================
-- Seed: current spots from parking-spots.geojson
-- All on bul. Osmi Primorski Polk, blue zone
-- =============================================================

insert into public.parking_spots
  (id, lat, lng, street_name, zone_type, status, occupied_by, occupied_at, expected_free_at)
values
  ('spot-1', 43.210476, 27.924639, 'bul. Osmi Primorski Polk', 'blue', 'free', null, null, null),
  ('spot-2', 43.210484, 27.924693, 'bul. Osmi Primorski Polk', 'blue', 'free', null, null, null),
  ('spot-3', 43.210489, 27.924744, 'bul. Osmi Primorski Polk', 'blue', 'free', null, null, null),
  ('spot-4', 43.210495, 27.924795, 'bul. Osmi Primorski Polk', 'blue', 'free', null, null, null),
  ('spot-5', 43.210503, 27.924843, 'bul. Osmi Primorski Polk', 'blue', 'free', null, null, null),
  ('spot-7', 43.210509, 27.924891, 'bul. Osmi Primorski Polk', 'blue', 'free', null, null, null)
on conflict (id) do nothing;

-- =============================================================
-- When you have more spots, append them here like:
--
-- insert into public.parking_spots
--   (id, lat, lng, street_name, zone_type, status, occupied_by, occupied_at, expected_free_at)
-- values
--   ('spot-8', <lat>, <lng>, '<street>', '<zone>', 'free', null, null, null);
-- =============================================================
