-- Points of Interest: garages, private lots, EV charging stations
create table if not exists public.pois (
  id text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  poi_type text not null check (poi_type in ('garage', 'private_lot', 'ev_charging')),
  address text,
  capacity integer,
  operating_hours text,
  price_info text
);

alter table public.pois enable row level security;
create policy "Anyone can read POIs" on public.pois for select using (true);

-- Seed data: Varna, Bulgaria POIs
-- Coordinates verified via OpenStreetMap Nominatim (April 2026)
insert into public.pois (id, name, lat, lng, poi_type, address, capacity, operating_hours, price_info) values
  -- Official garages
  -- Musala: OSM node at Preslav & Khan Asparuh intersection (43.2024, 27.9152)
  ('poi-garage-1', 'Musala Parking', 43.2024, 27.9152, 'garage', 'ул. Преслав / ул. Хан Аспарух, Варна', 55, '24/7', '1.50 BGN/hour'),
  -- Mall Varna: OSM confirmed 43.2200355, 27.8896525
  ('poi-garage-2', 'Mall Varna Parking', 43.2200, 27.8897, 'garage', 'bul. Vladislav Varnenchik 186, Varna', 600, 'Mon–Sun 09:00–22:00', 'Free with purchase'),
  -- Grand Mall: OSM confirmed 43.2173398, 27.8984633
  ('poi-garage-3', 'Grand Mall Varna Parking', 43.2173, 27.8985, 'garage', 'ul. Andrey Sakharov 2, Varna', 1750, 'Mon–Sun 09:00–22:00', 'Free (2h limit)'),
  ('poi-garage-4', 'City Center Parking Garage', 43.2138, 27.9178, 'garage', 'ul. Tsar Simeon I, Varna', 150, '07:00–23:00', '1.20 BGN/hour'),

  -- Private lots
  ('poi-lot-1', 'Parking Chataldzha', 43.2125, 27.9162, 'private_lot', 'ul. Chataldzha, Varna', 40, '24/7', '1.00 BGN/hour'),
  ('poi-lot-2', 'Private Parking Slivnitsa', 43.2148, 27.9132, 'private_lot', 'bul. Slivnitsa, Varna', 30, '07:00–22:00', '1.00 BGN/hour'),
  -- Primorski: OSM road at 43.2073, 27.9175
  ('poi-lot-3', 'Parking Primorski', 43.2073, 27.9175, 'private_lot', 'bul. Primorski, Varna', 60, '24/7', '1.50 BGN/hour'),

  -- EV charging stations (collocated with respective malls)
  ('poi-ev-1', 'FINES Charging — Mall Varna', 43.2202, 27.8900, 'ev_charging', 'bul. Vladislav Varnenchik 186, Varna', null, 'Mon–Sun 09:00–22:00', '0.45 BGN/kWh'),
  ('poi-ev-2', 'FINES Charging — Grand Mall', 43.2175, 27.8987, 'ev_charging', 'ul. Andrey Sakharov 2, Varna', null, 'Mon–Sun 09:00–22:00', '0.45 BGN/kWh'),
  ('poi-ev-3', 'FINES Charging — Tsar Osvoboditel', 43.2135, 27.9185, 'ev_charging', 'bul. Tsar Osvoboditel, Varna', null, '24/7', '0.50 BGN/kWh')
on conflict (id) do update set
  lat = excluded.lat,
  lng = excluded.lng,
  name = excluded.name,
  address = excluded.address,
  capacity = excluded.capacity,
  operating_hours = excluded.operating_hours,
  price_info = excluded.price_info;
