# ParkinGo — Task Tracker

## Feature 1: Project Setup & Map Foundation
- [x] Initialize Expo project with TypeScript template
- [x] Install core dependencies (react-native-maps, expo-location, expo-router)
- [x] Set up Expo Router navigation structure (Map, Profile, Settings tabs)
- [x] Display full-screen map centered on Varna (43.2141°N, 27.9147°E)
- [x] Request location permissions and show user's blue dot on map
- [x] Add bottom sheet placeholder on map screen

## Feature 2: Backend Setup & Authentication
- [x] Set up Supabase project and configure SDK
- [x] Implement Supabase Auth (email/password)
- [x] Create auth screens (Sign Up, Log In, Forgot Password)
- [x] Build auth flow: read-only map for unauthenticated, prompt to sign in for interactions
- [x] Persist auth state across app restarts
- [x] Create Profile screen with user info and logout

## Feature 3: Pre-Mapped Parking Spots
- [x] Load spots from parking-spots.geojson (lib/parkingSpots.ts)
- [x] Create parking_spots Supabase table + seed current 6 spots (supabase/parking_spots.sql)
- [x] Updated parking-spots.geojson with streetName and zoneType for all spots
- [x] Fetch spots from Supabase on mount with real-time UPDATE listener
- [ ] Add more spots to Supabase when user provides new GeoJSON data
- [ ] Implement marker clustering (individual at street level, clustered when zoomed out)
- [ ] Load spots dynamically based on visible map region

## Feature 4: Spot Marking System
- [x] Build 'I'm parking here' flow (tap free spot → bottom sheet → confirm)
- [x] Add zone duration prompt for blue/green zone spots (30min / 1h / 2h / 3h)
- [x] Build 'Leave parking' flow with confirmation alert
- [x] Render colored markers on map (green=free, red=occupied, blue=reserved)
- [x] Auto-detect nearby free spot and suggest parking
- [x] Add data validation (only owner unmarks, stale spot expiry, zone auto-free)

## Feature 5: Blue/Green Zone Display & Timer
- [x] Display blue/green zone visual indicators on spots and streets
- [x] Build countdown timer badge on occupied zone spots
- [x] Show zone details and time prediction in spot bottom sheet

## Feature 6: Street Congestion Indicator
- [x] Enable traffic layer on map (Apple Maps showsTraffic on iOS, Google Maps API key configured for Android)
- [ ] Aggregate spots by street and calculate occupancy rate
- [ ] Render color-coded street congestion polylines (green/yellow/red)
- [ ] Toggle congestion layer visibility based on zoom level and control button

## Profile Screen Customisation
- [x] Edit profile modal (name, avatar color, bio) — saved to Supabase user_metadata
- [x] Parking sessions list (zone, street, duration, date) — mock data, replace with real table in Feature 3
- [x] Car plates FAB (bottom-right) — add/remove plates saved to Supabase user_metadata

## Feature 7: Points of Interest Overlays
- [x] Query and seed POI data (garages, private lots, EV charging)
- [x] Render POI markers with distinct icons and toggle buttons
- [x] Build POI detail card on tap

## Feature 8: Auto-Reserve (100m Proximity)
- [x] Implement 'Navigate to spot' flow with background location tracking
- [x] Auto-reserve spot at 100m proximity with 5-minute expiry
- [x] Build reservation UI (banner, cancel option, distance/ETA)
- [x] Handle reservation conflicts and expiry

## Feature 9: Premium Tier (Simulated)
- [ ] Implement free tier limitations (500m radius, 1 auto-reserve/day)
- [ ] Build premium settings screen with simulated 'Activate Premium' toggle
- [ ] Create useIsPremium() hook and feature gating with upgrade prompts
- [ ] Unlock premium features (2km radius, unlimited reserves, pre-reserve)
