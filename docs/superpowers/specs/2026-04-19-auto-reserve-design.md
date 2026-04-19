# Feature 8: Auto-Reserve (100m Proximity) — Design Spec

**Date:** 2026-04-19  
**Status:** Approved

---

## Overview

When a user taps "Navigate to this spot", the app tracks their GPS live and automatically reserves the spot when they are within 100m. The spot stays reserved (blue for all users) until the driver parks, cancels, or a 5-minute safety-net expiry fires. On arrival (~10m), a popup prompts for parking duration and the normal countdown begins.

---

## User Flow

1. User taps a **free** spot → bottom sheet shows two side-by-side buttons:
   - **"I'm parking here"** (existing)
   - **"Navigate to this spot"** (new)
2. User taps **"Navigate to this spot"**:
   - Route polyline drawn on map (blue dashed line via `react-native-maps-directions`)
   - Top banner appears: `"Navigating to [street] — 340m"`
   - Live distance updates as user moves
3. At **100m**:
   - `status → reserved`, `reserved_by → userId` written to Supabase
   - Spot turns blue for all users instantly (real-time listener)
   - Push notification: *"Your spot on [street] is reserved!"*
   - Banner updates: `"Spot reserved! — 45m"`
   - Route polyline disappears
4. At **~10m** (arrival):
   - Push notification: *"You've arrived — tap to confirm your parking duration"*
   - Alert popup: *"You've arrived at [street]. How long are you parking?"* → duration picker
   - User selects duration → `status → occupied`, `reserved_by → null`, countdown starts
   - Banner dismisses
5. **Cancel** (banner button, any time):
   - `status → free`, `reserved_by → null`
   - GPS tracking stops, banner dismisses, route polyline removed

---

## "I'm Parking Here" Button Rules

| Scenario | Behaviour |
|---|---|
| Free spot, no active reservation | Parks normally |
| Free spot, user has active reservation on another spot | Cancels the active reservation first, then parks at new spot |
| Spot reserved by **another** user | Button blocked — *"Reserved by another driver"* |
| Spot reserved by **current** user | Parks normally (same as arrival flow, skips popup) |

The "I'm parking here" button is **never hidden** — it always renders. Blocking only applies to spots reserved by other users.

---

## Architecture

### New files

| File | Purpose |
|---|---|
| `hooks/useReservation.ts` | GPS watching, proximity detection, reservation state machine |
| `components/ReservationBanner.tsx` | Top banner: live distance, reserved state, cancel button |

### Changed files

| File | Change |
|---|---|
| `types/parking.ts` | Add `reservedBy: string \| null` and `reservedAt: string \| null` to `Spot` |
| `supabase/parking_spots.sql` | Migration: add `reserved_by` column |
| `hooks/useParking.ts` | Add `reserveSpot(spotId)`, `cancelReservation(spotId)` |
| `components/SpotDetail.tsx` | Add "Navigate to this spot" button; block "I'm parking here" for others' reservations |
| `app/(tabs)/index.tsx` | Wire `useReservation`, render `ReservationBanner`, render route polyline, handle arrival popup, change `STATUS_FILL.reserved` from `'#FF9500'` to `'#007AFF'` |

### New dependency

`react-native-maps-directions` — for road-following route polyline using Google Directions API.  
Requires enabling the **Directions API** in Google Cloud Console (same project as existing Maps key).

---

## `useReservation` Hook

**State:**
```ts
navigationTarget: Spot | null       // spot being navigated to
distanceToTarget: number | null     // live metres
reservationActive: boolean          // spot is currently reserved by this user
userLocation: LatLng | null         // latest GPS position
```

**API:**
```ts
startNavigation(spot: Spot): void   // begins watchPositionAsync, shows route
cancelNavigation(): void            // clears reservation, stops GPS watch
```

**Internal logic:**
- Uses `Location.watchPositionAsync` with `Accuracy.Balanced` (foreground only)
- On each position update: compute `distanceMetres()` to target
- At ≤ 100m and `!reservationActive`: call `reserveSpot(spotId)`, schedule push notification
- At ≤ 10m and `reservationActive`: trigger arrival popup (via callback to map screen), schedule push notification
- Cleans up watcher on unmount or cancel

**Safety-net expiry:**
- Client-side interval (same pattern as existing stale-spot check in `useParking`)
- If spot has `status === 'reserved'` and `reservedAt` is older than 5 minutes and `reservedBy === currentUserId`: auto-call `cancelReservation()`
- Requires adding `reserved_at: timestamptz` column alongside `reserved_by`

---

## `useParking` additions

```ts
reserveSpot(spotId: string): Promise<void>
// Sets status='reserved', reserved_by=userId, reserved_at=now
// Optimistic local update + Supabase write

cancelReservation(spotId: string): Promise<void>
// Sets status='free', reserved_by=null, reserved_at=null
// Ownership-guarded: .eq('reserved_by', currentUserId)
```

Real-time listener already handles `UPDATE` events — reserved status will propagate to all users automatically via the existing channel.

---

## Database Migration

```sql
ALTER TABLE public.parking_spots
  ADD COLUMN IF NOT EXISTS reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_at timestamptz;
```

`rowToSpot()` in `useParking` needs updating to map these two new columns.

---

## Push Notifications

Uses `expo-notifications` (local notifications — no push server required, works in Expo Go).

| Trigger | Title | Body |
|---|---|---|
| 100m reached | "Spot Reserved" | "Your spot on [street] is reserved! You have 5 minutes to park." |
| 10m reached | "You've Arrived" | "Tap to confirm how long you're parking." |

Notification permissions requested once on first `startNavigation()` call.

---

## `ReservationBanner` Component

Renders above the map, below the safe-area top inset.

**States:**
- **Navigating:** `"Navigating to [street] — 340m"` + Cancel button
- **Reserved:** `"Spot reserved on [street] — 45m"` + Cancel button
- **Hidden:** when `navigationTarget === null`

Dismisses automatically when the user confirms parking duration.

---

## Route Polyline

- Rendered via `MapViewDirections` from `react-native-maps-directions`
- Origin: user's current GPS location (updates as they move)
- Destination: `{ latitude: spot.lat, longitude: spot.lng }`
- Style: blue, dashed, strokeWidth 3
- Hidden once `reservationActive === true` (within 100m, routing no longer needed)
- Origin updates are debounced (only re-render `MapViewDirections` when position changes by ≥ 10m) to avoid excessive Directions API calls

---

## Edge Cases

| Case | Handling |
|---|---|
| Spot becomes occupied/reserved by another user before driver reaches 100m | Real-time listener updates spot status; `useReservation` checks spot status before reserving — if no longer free, show alert "This spot was just taken" and cancel navigation |
| User already has an active reservation and taps "I'm parking here" on a different spot | `parkSpot()` calls `cancelReservation()` on the active reservation first, then parks |
| User kills the app during navigation | No reservation exists yet if < 100m. If reserved, the 5-minute server-side safety net (or client expiry on next open) frees the spot |
| Two users reach 100m simultaneously | Supabase write is first-come-first-served; second writer's update will set `reserved_by` to themselves — needs an atomic check. Mitigate with a DB-level check: only update if `status = 'free'` using `.eq('status', 'free')` in the update query |
