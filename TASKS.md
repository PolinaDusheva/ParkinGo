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
- [ ] Write Overpass API data pipeline script to generate parking spots
- [ ] Create spot data model and seed spots to database (spot location data pending from user)
- [ ] Replace mock spots in useParking.ts with Supabase real-time listener
- [ ] Implement marker clustering (individual at street level, clustered when zoomed out)
- [ ] Load spots dynamically based on visible map region
- [ ] Add real-time listener on visible spots for instant updates

## Feature 4: Spot Marking System
- [x] Build 'I'm parking here' flow (tap free spot → bottom sheet → confirm)
- [x] Add zone duration prompt for blue/green zone spots (30min / 1h / 2h / 3h)
- [x] Build 'Leave parking' flow with confirmation alert
- [x] Render colored markers on map (green=free, red=occupied, blue=reserved)
- [ ] Auto-detect nearby free spot and suggest parking
- [ ] Add data validation (only owner unmarks, stale spot expiry, zone auto-free)

## Feature 5: Blue/Green Zone Display & Timer
- [ ] Display blue/green zone visual indicators on spots and streets
- [ ] Build countdown timer badge on occupied zone spots
- [ ] Show zone details and time prediction in spot bottom sheet

## Feature 6: Street Congestion Indicator
- [ ] Aggregate spots by street and calculate occupancy rate
- [ ] Render color-coded street congestion polylines (green/yellow/red)
- [ ] Toggle congestion layer visibility based on zoom level and control button

## Feature 7: Points of Interest Overlays
- [ ] Query and seed POI data (garages, private lots, EV charging)
- [ ] Render POI markers with distinct icons and toggle buttons
- [ ] Build POI detail card on tap

## Feature 8: Auto-Reserve (100m Proximity)
- [ ] Implement 'Navigate to spot' flow with background location tracking
- [ ] Auto-reserve spot at 100m proximity with 5-minute expiry
- [ ] Build reservation UI (banner, cancel option, distance/ETA)
- [ ] Handle reservation conflicts and expiry

## Feature 9: Premium Tier (Simulated)
- [ ] Implement free tier limitations (500m radius, 1 auto-reserve/day)
- [ ] Build premium settings screen with simulated 'Activate Premium' toggle
- [ ] Create useIsPremium() hook and feature gating with upgrade prompts
- [ ] Unlock premium features (2km radius, unlimited reserves, pre-reserve)
