# ParkinGo — MVP Scope

## What we're validating
Can a community-driven, crowd-sourced parking app provide enough real-time accuracy to be useful for everyday drivers in Varna, Bulgaria?

## Target user
Everyday drivers in Varna who struggle to find street parking, especially in the city center and busy districts.

## Tech stack
- **Frontend:** React Native with Expo (Expo Go for development)
- **Maps:** react-native-maps (Apple Maps on iOS, Google Maps on Android)
- **Backend:** Firebase (Firestore for real-time data, Firebase Auth for authentication) OR Supabase (Postgres + Realtime + Auth)
- **Map data source:** OpenStreetMap (via Overpass API) for street/parking data
- **State management:** React Context or Zustand (keep it simple)
- **Navigation:** Expo Router

---

## MVP Features — Implementation Order

Each feature below is a self-contained unit. Implement them in this exact order — each builds on the previous.

---

### Feature 1: Project Setup & Map Foundation
**What it does:** Bootstraps the Expo project and displays an interactive map of Varna centered on the user's location.

**Why it's in v1:** Nothing works without the map. This is the foundation.

**Implementation details:**
- Initialize Expo project with TypeScript
- Install and configure `react-native-maps`
- Request and handle location permissions (`expo-location`)
- Display map centered on Varna (43.2141° N, 27.9147° E) with fallback if location denied
- Show user's current location as a blue dot
- Basic app layout: full-screen map with a bottom sheet/panel placeholder
- Set up the navigation structure (Expo Router) with screens: Map (home), Profile, Settings

**Done when:** App launches, shows a map of Varna, and displays the user's current GPS location.

---

### Feature 2: Backend Setup & Authentication
**What it does:** Sets up the backend (Firebase/Supabase) and lets users create accounts and log in.

**Why it's in v1:** Users must be authenticated to mark spots and access features.

**Implementation details:**
- Set up Firebase project (or Supabase instance) with Firestore/Postgres database
- Configure Firebase Auth (or Supabase Auth) for email/password
- Create auth screens: Sign Up, Log In, Forgot Password
- Auth flow: unauthenticated users see the map (read-only), prompted to sign in to interact
- User profile data model:
  ```
  users/{userId}
    - email: string
    - displayName: string
    - createdAt: timestamp
    - isPremium: boolean (default: false)
    - parkingHistory: array of spot references
  ```
- Persist auth state across app restarts
- Add a simple Profile screen showing user info and logout button

**Done when:** A user can sign up, log in, see their profile, log out, and reopen the app still logged in.

---

### Feature 3: Pre-Mapped Parking Spots
**What it does:** Loads street parking data from OpenStreetMap and renders spots on the map.

**Why it's in v1:** The core of the app — without spots on the map, there's nothing to mark.

**Implementation details:**
- Write a data pipeline script (can be Node.js) that:
  1. Queries the Overpass API for streets in Varna with parking-relevant tags (`parking:lane`, `parking:condition`, etc.)
  2. For streets without explicit parking data: takes street geometry, divides into ~5m segments (standard parking spot width) along the curb
  3. Generates spot objects with: `id`, `lat`, `lng`, `streetName`, `zoneType` (none/blue/green), `segmentIndex`
  4. Outputs the data as a JSON file or seeds the database
- Spot data model in Firestore/Supabase:
  ```
  spots/{spotId}
    - lat: number
    - lng: number
    - streetName: string
    - zoneType: "none" | "blue" | "green"
    - status: "free" | "occupied" | "reserved"
    - occupiedBy: userId | null
    - occupiedAt: timestamp | null
    - expectedFreeAt: timestamp | null (for blue/green zones)
  ```
- Render spots on the map as small colored markers/circles:
  - Green = free
  - Red = occupied
  - Blue = reserved
- Implement marker clustering: show individual spots when zoomed in (street level), cluster them when zoomed out
- Load spots dynamically based on visible map region (don't load all spots at once)
- Real-time listener on visible spots so updates appear instantly

**Done when:** The map shows pre-mapped parking spots along Varna's streets, color-coded by status, with clustering at zoom levels.

---

### Feature 4: Spot Marking System
**What it does:** Lets users mark parking spots as occupied when they park and free when they leave.

**Why it's in v1:** This is the core interaction — the crowd-sourcing mechanism.

**Implementation details:**
- **Parking flow:**
  1. User taps a green (free) spot on the map
  2. Bottom sheet shows spot details (street name, zone type)
  3. "I'm parking here" button
  4. If blue/green zone: prompt "How long are you parking?" (30min, 1h, 2h, 3h, custom)
  5. Spot turns red, `occupiedBy` set to current user, `occupiedAt` set to now
  6. If zone parking: `expectedFreeAt` calculated from duration
- **Leaving flow:**
  1. User taps their own occupied spot (or a "Leave parking" button in the UI)
  2. Confirmation: "Are you leaving this spot?"
  3. Spot turns green, all occupied fields cleared
- **Auto-detect nearby spot:** When user opens app and is within 10m of a free spot, suggest "Are you parking here?"
- **Data validation:**
  - Only the user who marked a spot can unmark it (or it expires)
  - Blue/green zone spots auto-free when `expectedFreeAt` passes
  - Stale spots (occupied for >24h without zone time) auto-free with a Cloud Function/cron
- **Real-time sync:** All changes propagate instantly via Firestore listeners / Supabase Realtime

**Done when:** A user can tap a spot to park, set duration for zone parking, leave the spot, and all other users see the change in real-time.

---

### Feature 5: Blue/Green Zone Display & Timer
**What it does:** Shows which streets are in paid blue/green parking zones and displays countdown timers for occupied zone spots.

**Why it's in v1:** Varna has extensive paid parking zones — showing remaining time is a key differentiator.

**Implementation details:**
- Visually distinguish zone streets on the map (colored street overlays or spot border colors)
- Blue zone spots have a blue border/indicator, green zone spots have a green border
- When a zone spot is occupied with a duration:
  - Show a countdown timer badge on the spot marker
  - Format: "42 min left" or "1h 12m"
  - Timer updates in real-time (client-side countdown, synced with `expectedFreeAt`)
- Spot detail bottom sheet shows:
  - Zone type (blue/green/none)
  - Remaining time if occupied
  - "This spot should be free at [time]" prediction
- Info tooltip/section explaining: "Payment is handled via SMS or ticket — this app only tracks time"

**Done when:** Zone spots are visually distinct, occupied zone spots show countdown timers, and users can see when a zone spot is expected to become free.

---

### Feature 6: Street Congestion Indicator
**What it does:** Shows how busy each street is based on the percentage of occupied parking spots.

**Why it's in v1:** Helps drivers quickly identify which areas to avoid, visible before they zoom in to see individual spots.

**Implementation details:**
- Aggregate spots by street segment
- Calculate occupancy rate: `occupied spots / total spots` per street
- Color-code street overlays (polylines on the map):
  - Green: < 40% occupied
  - Yellow: 40-70% occupied
  - Red: > 70% occupied
- Show congestion layer when zoomed out (city/neighborhood level)
- Hide congestion layer and show individual spots when zoomed in (street level)
- Congestion data updates as spots change status (can debounce to every 30 seconds)
- Toggle congestion layer on/off via a map control button

**Done when:** When zoomed out, streets are color-coded by parking congestion. Zooming in transitions smoothly to individual spots.

---

### Feature 7: Points of Interest Overlays
**What it does:** Shows official parking garages, private parking lots, and EV charging stations on the map.

**Why it's in v1:** Gives users a complete picture of all parking options, not just street parking.

**Implementation details:**
- Three toggleable map layers, each with a distinct icon:
  - **Official garages/lots:** parking icon (blue)
  - **Private parking lots:** parking icon (orange)
  - **EV charging stations:** charging icon (green)
- Data source: OpenStreetMap POI data (query via Overpass API for `amenity=parking`, `amenity=charging_station`)
- Supplement with manually curated data for Varna if OSM coverage is incomplete
- POI data model:
  ```
  pois/{poiId}
    - type: "garage" | "private_lot" | "ev_charging"
    - name: string
    - lat: number
    - lng: number
    - address: string
    - capacity: number | null
    - operatingHours: string | null
    - priceInfo: string | null
  ```
- Tapping a POI opens a detail card showing all available info
- Toggle buttons in the map UI to show/hide each layer
- POI data is mostly static — seed from OSM, allow manual updates later

**Done when:** Users can toggle on/off three POI layers and tap any POI to see its details.

---

### Feature 8: Auto-Reserve (100m Proximity)
**What it does:** When a user is driving to a specific spot, the spot is automatically reserved when they're within 100m.

**Why it's in v1:** Prevents the frustration of losing a spot while driving to it — a key differentiator.

**Implementation details:**
- **Reservation flow:**
  1. User taps a free spot and selects "Navigate to this spot" (or "Reserve when close")
  2. App starts background location tracking (`expo-location` background mode)
  3. When user's GPS position is within 100m of the target spot:
     - Spot status changes to "reserved" with `reservedBy: userId`
     - Spot turns blue on the map for all users
     - User gets a notification: "Your spot has been reserved!"
  4. Reservation expires after 5 minutes if user doesn't mark it as "parked"
  5. If user parks: normal parking flow takes over
  6. If reservation expires: spot returns to "free"
- **Conflict resolution:**
  - First to reserve wins
  - If spot is occupied by the time user is within 100m, notify: "Sorry, this spot was taken"
  - User can only have one active reservation at a time
- **UI:**
  - Active reservation banner at top of map screen
  - "Cancel reservation" option
  - Distance/ETA to reserved spot
- **Battery consideration:** Use significant location change monitoring, not continuous GPS, until within ~500m, then switch to precise tracking

**Done when:** A user can target a spot, have it auto-reserved at 100m, and either park or let the reservation expire. Other users see the reserved spot in blue.

---

### Feature 9: Premium Tier (Simulated)
**What it does:** Implements the premium tier UI and feature gating with simulated (mock) payments.

**Why it's in v1:** Validates the premium model and UX before investing in real payment integration.

**Implementation details:**
- **Free tier limitations:**
  - Can see spots within a 500m radius of current location
  - Basic map features, spot marking, zone timers
  - Can use auto-reserve once per day
- **Premium tier unlocks:**
  - See spots within a 2km radius (or unlimited)
  - Unlimited auto-reserves
  - Preferential pricing display (shows cheapest parking options nearby)
  - Ability to pre-reserve a spot up to 1 hour in advance (minimum 5-hour stay for pre-reserved spots)
- **Simulated payment:**
  - Premium settings screen with "Activate Premium" button
  - Toggling premium is instant — no real payment flow
  - A banner/badge indicates premium status
  - Store `isPremium: boolean` on user profile
- **Feature gating:**
  - Build a `useIsPremium()` hook
  - Free users hitting premium features see an upgrade prompt
  - All premium UI is fully designed and functional

**Done when:** Free users see limited radius and upgrade prompts. Toggling premium unlocks expanded features. No real money changes hands.

---

## Out of v1

| Feature | Why it's deferred |
|---|---|
| **Gamification (rewards/discounts)** | Requires points economy design, reward tiers, and anti-abuse systems. Doesn't help validate the core hypothesis. Add when you have active users needing retention. |
| **Real payment processing** | Simulated payments validate the premium UX. Real Stripe integration adds compliance, refunds, and billing edge cases. |
| **Multi-city expansion** | Prove the model in Varna first. Architecture supports it, but no UI or data for other cities. |
| **Offline mode** | Online-only keeps real-time sync simple. Offline queuing adds conflict resolution complexity. |
| **Private lot booking** | Requires business partnerships and booking systems. Show locations only in v1. |
| **Push notifications** | "Spot expiring" and "reservation confirmed" notifications are valuable but not essential for testing core value. |
| **Social login (Google/Apple)** | Email/password is sufficient for MVP. Social login reduces friction but adds OAuth complexity. |
| **Waze-like road reporting** | Traffic/hazard reporting is a nice-to-have extension of the crowd-sourcing model. Focus on parking first. |

---

## Done means (end-to-end acceptance criteria)

1. App launches on both iOS and Android via Expo Go
2. Map displays Varna with pre-mapped parking spots from OpenStreetMap data
3. Spots are color-coded: green (free), red (occupied), blue (reserved)
4. User can sign up with email/password, log in, and stay logged in across sessions
5. User can tap a free spot and mark it as "I'm parking here"
6. For blue/green zone spots, user sets a parking duration and a countdown timer is visible
7. User can mark their spot as free when leaving
8. All spot changes appear in real-time for all connected users
9. Streets show congestion colors (green/yellow/red) when zoomed out
10. Official garages, private lots, and EV charging stations are visible as toggleable layers
11. User can target a spot and have it auto-reserved when within 100m, with 5-minute expiry
12. Free users have a 500m visibility radius; toggling premium expands to 2km+
13. Premium upgrade prompts appear when free users try to access gated features

## Verification
- Test on iOS simulator and Android emulator via Expo Go
- Test real-time sync by running two instances and marking spots on one
- Verify auto-reserve by simulating location changes
- Verify zone timer countdown accuracy
- Test premium toggle gates features correctly
- Verify spot clustering works at different zoom levels
- Confirm stale spot cleanup works (24h expiry)
