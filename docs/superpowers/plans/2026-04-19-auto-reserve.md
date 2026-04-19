# Feature 8: Auto-Reserve (100m Proximity) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user taps "Navigate to this spot", GPS is tracked live; at 100m the spot auto-reserves (turns blue for all users), and at ~10m an arrival popup prompts for parking duration to start the countdown.

**Architecture:** A new `useReservation` hook owns GPS watching, proximity detection, push notifications, and safety-net expiry. A `ReservationBanner` component renders above the map with live distance and a cancel button. `useParking` gains `reserveSpot` and `cancelReservation`. The map screen wires everything and renders a road-following route polyline via `MapViewDirections`.

**Tech Stack:** expo-location (watchPositionAsync), expo-notifications (local push — works in Expo Go), react-native-maps-directions (Google Directions road routing, same API key as existing Maps key), Supabase Realtime (existing channel), TypeScript strict.

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Modify | `app.json` | Add `expo-notifications` plugin |
| Modify | `app/_layout.tsx` | Set notification handler at app root |
| Run SQL | Supabase SQL Editor | Add `reserved_by`, `reserved_at` columns |
| Modify | `types/parking.ts` | Add `reservedBy`, `reservedAt` to `Spot` |
| Modify | `hooks/useParking.ts` | Update `rowToSpot`; add `reserveSpot`, `cancelReservation` |
| Create | `hooks/useReservation.ts` | GPS state machine, proximity checks, notifications |
| Create | `components/ReservationBanner.tsx` | Top banner: distance + cancel |
| Modify | `components/SpotDetail.tsx` | Navigate button, reserved-by-other block, color fix |
| Modify | `app/(tabs)/index.tsx` | Wire all new pieces, route polyline, arrival popup |

---

### Task 1: Install dependencies and configure notifications

**Files:**
- Modify: `package.json` (via npm/expo install)
- Modify: `app.json`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Install expo-notifications**

```bash
npx expo install expo-notifications
```

Expected: package added to `package.json` under dependencies.

- [ ] **Step 2: Install react-native-maps-directions**

```bash
npm install react-native-maps-directions
```

Expected: package added to `package.json`.

- [ ] **Step 3: Add expo-notifications plugin to app.json**

In `app.json`, add `"expo-notifications"` to the `plugins` array:

```json
"plugins": [
  "expo-router",
  [
    "expo-location",
    {
      "locationAlwaysAndWhenInUsePermission": "ParkinGo uses background location to auto-reserve parking spots as you approach."
    }
  ],
  [
    "expo-notifications",
    {
      "icon": "./assets/icon.png",
      "color": "#007AFF"
    }
  ]
]
```

- [ ] **Step 4: Set notification handler in app/_layout.tsx**

Add the import and handler call so local notifications show alerts while the app is foregrounded:

```typescript
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import AuthProvider, { useAuth } from '../context/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app.json app/_layout.tsx package.json package-lock.json
git commit -m "feat: install expo-notifications and react-native-maps-directions"
```

---

### Task 2: Database migration

**Files:**
- Run in Supabase SQL Editor (not committed — schema change applies to live DB)
- Modify: `supabase/parking_spots.sql` (document the migration)

- [ ] **Step 1: Run migration in Supabase SQL Editor**

Open Supabase → SQL Editor and run:

```sql
ALTER TABLE public.parking_spots
  ADD COLUMN IF NOT EXISTS reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_at timestamptz;
```

Expected: query executes with no errors. You can verify with:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'parking_spots'
  AND column_name IN ('reserved_by', 'reserved_at');
```
Expected result: 2 rows returned.

- [ ] **Step 2: Document migration in supabase/parking_spots.sql**

At the end of `supabase/parking_spots.sql`, add:

```sql
-- =============================================================
-- Migration: Feature 8 — Auto-Reserve
-- Run once in Supabase SQL Editor
-- =============================================================
-- ALTER TABLE public.parking_spots
--   ADD COLUMN IF NOT EXISTS reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
--   ADD COLUMN IF NOT EXISTS reserved_at timestamptz;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/parking_spots.sql
git commit -m "docs: document auto-reserve DB migration"
```

---

### Task 3: Update types/parking.ts

**Files:**
- Modify: `types/parking.ts`

- [ ] **Step 1: Add reservedBy and reservedAt to the Spot interface**

Replace the current `Spot` interface in `types/parking.ts`:

```typescript
export type ZoneType = 'none' | 'blue' | 'green';
export type SpotStatus = 'free' | 'occupied' | 'reserved';

export interface Spot {
  id: string;
  lat: number;
  lng: number;
  streetName: string;
  zoneType: ZoneType;
  status: SpotStatus;
  occupiedBy: string | null;
  occupiedAt: string | null;       // ISO timestamp
  expectedFreeAt: string | null;   // ISO timestamp
  reservedBy: string | null;       // userId who reserved
  reservedAt: string | null;       // ISO timestamp when reserved
}
```

(Leave `ParkingDuration`, `DURATION_OPTIONS`, `POIType`, and `POI` unchanged.)

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: errors about `rowToSpot` missing the new fields — that's intentional, fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add types/parking.ts
git commit -m "feat: add reservedBy and reservedAt to Spot type"
```

---

### Task 4: Update hooks/useParking.ts

**Files:**
- Modify: `hooks/useParking.ts`

- [ ] **Step 1: Update rowToSpot to map new columns**

Replace the `rowToSpot` function:

```typescript
function rowToSpot(row: Record<string, unknown>): Spot {
  return {
    id: row.id as string,
    lat: row.lat as number,
    lng: row.lng as number,
    streetName: row.street_name as string,
    zoneType: row.zone_type as Spot['zoneType'],
    status: row.status as Spot['status'],
    occupiedBy: (row.occupied_by as string | null) ?? null,
    occupiedAt: (row.occupied_at as string | null) ?? null,
    expectedFreeAt: (row.expected_free_at as string | null) ?? null,
    reservedBy: (row.reserved_by as string | null) ?? null,
    reservedAt: (row.reserved_at as string | null) ?? null,
  };
}
```

- [ ] **Step 2: Update freeSpot helper to clear reservation fields**

Replace the `freeSpot` function:

```typescript
function freeSpot(s: Spot): Spot {
  return {
    ...s,
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
    reservedBy: null,
    reservedAt: null,
  };
}
```

- [ ] **Step 3: Add reserveSpot and cancelReservation inside useParking**

Add these two functions after the `leaveSpot` definition (before the `return`):

```typescript
const reserveSpot = useCallback(
  async (spotId: string) => {
    if (!currentUserId) return;
    const reservedAt = new Date().toISOString();

    // Optimistic local update
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId
          ? { ...s, status: 'reserved', reservedBy: currentUserId, reservedAt }
          : s,
      ),
    );

    // Atomic write: only succeeds if spot is still free (race-condition guard)
    await supabase
      .from('parking_spots')
      .update({ status: 'reserved', reserved_by: currentUserId, reserved_at: reservedAt })
      .eq('id', spotId)
      .eq('status', 'free');
  },
  [currentUserId],
);

const cancelReservation = useCallback(
  async (spotId: string) => {
    if (!currentUserId) return;

    // Optimistic local update
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId ? { ...s, status: 'free', reservedBy: null, reservedAt: null } : s,
      ),
    );

    // Ownership-guarded write
    await supabase
      .from('parking_spots')
      .update({ status: 'free', reserved_by: null, reserved_at: null })
      .eq('id', spotId)
      .eq('reserved_by', currentUserId);
  },
  [currentUserId],
);
```

- [ ] **Step 4: Export the new functions from the hook**

Replace the return statement:

```typescript
return { spots, spotsLoading, parkSpot, leaveSpot, reserveSpot, cancelReservation };
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add hooks/useParking.ts
git commit -m "feat: add reserveSpot and cancelReservation to useParking"
```

---

### Task 5: Create hooks/useReservation.ts

**Files:**
- Create: `hooks/useReservation.ts`

- [ ] **Step 1: Create the file**

```typescript
import { useState, useCallback, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Spot } from '../types/parking';

const RESERVE_THRESHOLD_M = 100;
const ARRIVAL_THRESHOLD_M = 10;
const SAFETY_NET_MS = 5 * 60 * 1000;     // 5 minutes
const SAFETY_NET_CHECK_MS = 30_000;       // 30 seconds
const ROUTE_UPDATE_THRESHOLD_M = 10;      // debounce route origin updates

// Haversine distance in metres
function distanceMetres(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function scheduleLocalNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // fire immediately
  });
}

interface UseReservationOptions {
  currentUserId: string | null;
  spots: Spot[];
  reserveSpot: (spotId: string) => Promise<void>;
  cancelReservation: (spotId: string) => Promise<void>;
  // confirmParking is passed as second arg so onArrival doesn't need to close over it
  onArrival: (spot: Spot, confirmParking: () => void) => void;
  onSpotTaken: () => void;
}

export interface UseReservationResult {
  navigationTarget: Spot | null;
  distanceToTarget: number | null;
  reservationActive: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  startNavigation: (spot: Spot) => Promise<void>;
  cancelNavigation: () => Promise<void>;
  confirmParking: () => void;
}

export function useReservation({
  currentUserId,
  spots,
  reserveSpot,
  cancelReservation,
  onArrival,
  onSpotTaken,
}: UseReservationOptions): UseReservationResult {
  const [navigationTarget, setNavigationTarget] = useState<Spot | null>(null);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [reservationActive, setReservationActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Refs hold current values so async callbacks (watchPositionAsync) never see stale closures
  const navigationTargetRef = useRef<Spot | null>(null);
  const reservationActiveRef = useRef(false);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const arrivalFiredRef = useRef(false);
  const reservationFiredRef = useRef(false);
  const permissionRequestedRef = useRef(false);
  const lastRouteLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // confirmParking: stop GPS and clear navigation state WITHOUT cancelling Supabase reservation.
  // Called when the user parks on their reserved spot — parkSpot() will overwrite to 'occupied'.
  const confirmParking = useCallback(() => {
    watcherRef.current?.remove();
    watcherRef.current = null;
    navigationTargetRef.current = null;
    reservationActiveRef.current = false;
    setNavigationTarget(null);
    setDistanceToTarget(null);
    setReservationActive(false);
    setUserLocation(null);
    arrivalFiredRef.current = false;
    reservationFiredRef.current = false;
    lastRouteLocationRef.current = null;
  }, []);

  // cancelNavigation: stop GPS, clear state, AND cancel Supabase reservation.
  // Called when user taps Cancel, or parks on a different spot.
  const cancelNavigation = useCallback(async () => {
    watcherRef.current?.remove();
    watcherRef.current = null;

    const target = navigationTargetRef.current;
    const wasReserved = reservationActiveRef.current;

    navigationTargetRef.current = null;
    reservationActiveRef.current = false;
    setNavigationTarget(null);
    setDistanceToTarget(null);
    setReservationActive(false);
    setUserLocation(null);
    arrivalFiredRef.current = false;
    reservationFiredRef.current = false;
    lastRouteLocationRef.current = null;

    if (wasReserved && target) {
      await cancelReservation(target.id);
    }
  }, [cancelReservation]);

  const startNavigation = useCallback(
    async (spot: Spot) => {
      if (!currentUserId) return;

      // Request notification permission once per session
      if (!permissionRequestedRef.current) {
        permissionRequestedRef.current = true;
        const { status } = await Notifications.requestPermissionsAsync();
        // Proceed regardless — notifications are non-critical
        void status;
      }

      // Cancel any prior navigation/reservation
      await cancelNavigation();

      // Set up state for new navigation
      navigationTargetRef.current = spot;
      reservationActiveRef.current = false;
      arrivalFiredRef.current = false;
      reservationFiredRef.current = false;
      lastRouteLocationRef.current = null;

      setNavigationTarget(spot);
      setDistanceToTarget(null);
      setReservationActive(false);

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
        (location) => {
          const { latitude, longitude } = location.coords;

          // Debounce route origin: only update when moved ≥ ROUTE_UPDATE_THRESHOLD_M
          const last = lastRouteLocationRef.current;
          if (
            !last ||
            distanceMetres(last.latitude, last.longitude, latitude, longitude) >= ROUTE_UPDATE_THRESHOLD_M
          ) {
            setUserLocation({ latitude, longitude });
            lastRouteLocationRef.current = { latitude, longitude };
          }

          const dist = distanceMetres(latitude, longitude, spot.lat, spot.lng);
          setDistanceToTarget(Math.round(dist));

          // At ≤ 100m: reserve
          if (dist <= RESERVE_THRESHOLD_M && !reservationFiredRef.current) {
            reservationFiredRef.current = true;
            reservationActiveRef.current = true;
            setReservationActive(true);
            void reserveSpot(spot.id);
            void scheduleLocalNotification(
              'Spot Reserved',
              `Your spot on ${spot.streetName} is reserved! You have 5 minutes to park.`,
            );
          }

          // At ≤ 10m and after reservation: arrival
          if (
            dist <= ARRIVAL_THRESHOLD_M &&
            reservationFiredRef.current &&
            !arrivalFiredRef.current
          ) {
            arrivalFiredRef.current = true;
            void scheduleLocalNotification(
              "You've Arrived",
              'Tap to confirm how long you are parking.',
            );
            onArrival(spot, confirmParking);
          }
        },
      );

      watcherRef.current = sub;
    },
    [currentUserId, cancelNavigation, reserveSpot, onArrival],
  );

  // Safety-net: auto-cancel if reservation is older than 5 minutes
  useEffect(() => {
    if (!currentUserId || !reservationActive || !navigationTarget) return;

    const check = () => {
      const target = spots.find((s) => s.id === navigationTarget.id);
      if (!target || target.status !== 'reserved' || target.reservedBy !== currentUserId) return;
      if (!target.reservedAt) return;
      if (Date.now() - new Date(target.reservedAt).getTime() > SAFETY_NET_MS) {
        void cancelNavigation();
      }
    };

    check();
    const id = setInterval(check, SAFETY_NET_CHECK_MS);
    return () => clearInterval(id);
  }, [currentUserId, reservationActive, navigationTarget, spots, cancelNavigation]);

  // Spot taken by another user before we could reserve: cancel navigation and alert
  useEffect(() => {
    if (!navigationTarget || reservationActive) return;
    const target = spots.find((s) => s.id === navigationTarget.id);
    if (target && target.status !== 'free') {
      void cancelNavigation();
      onSpotTaken();
    }
  }, [spots, navigationTarget, reservationActive, cancelNavigation, onSpotTaken]);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      watcherRef.current?.remove();
    };
  }, []);

  return {
    navigationTarget,
    distanceToTarget,
    reservationActive,
    userLocation,
    startNavigation,
    cancelNavigation,
    confirmParking,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useReservation.ts
git commit -m "feat: add useReservation hook with GPS proximity detection"
```

---

### Task 6: Create components/ReservationBanner.tsx

**Files:**
- Create: `components/ReservationBanner.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spot } from '../types/parking';

interface Props {
  navigationTarget: Spot | null;
  distanceToTarget: number | null;
  reservationActive: boolean;
  onCancel: () => void;
}

export function ReservationBanner({
  navigationTarget,
  distanceToTarget,
  reservationActive,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();

  if (!navigationTarget) return null;

  const distanceText = distanceToTarget !== null ? ` — ${distanceToTarget}m` : '';
  const message = reservationActive
    ? `Spot reserved on ${navigationTarget.streetName}${distanceText}`
    : `Navigating to ${navigationTarget.streetName}${distanceText}`;

  const bannerColor = reservationActive ? '#007AFF' : '#1C1C1E';

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8, backgroundColor: bannerColor }]}>
      <Text style={styles.message} numberOfLines={1}>
        {message}
      </Text>
      <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cancelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ReservationBanner.tsx
git commit -m "feat: add ReservationBanner component"
```

---

### Task 7: Update components/SpotDetail.tsx

**Files:**
- Modify: `components/SpotDetail.tsx`

Changes: add `onNavigate` prop, two-button layout on free spots, block "I'm parking here" for spots reserved by another user, show it for own reserved spot, fix reserved status color from orange to blue.

- [ ] **Step 1: Update Props interface and derived booleans**

Replace the `Props` interface and the boolean derivations inside `SpotDetail`:

```typescript
interface Props {
  spot: Spot;
  currentUserId: string | null;
  onPark: (spotId: string, duration: ParkingDuration | null) => void;
  onLeave: (spotId: string) => void;
  onNavigate: (spot: Spot) => void;
  onDismiss: () => void;
}
```

Replace the four boolean constants (lines 62–65) with:

```typescript
const isOwnSpot = spot.status === 'occupied' && spot.occupiedBy === currentUserId;
const isOtherSpot = spot.status === 'occupied' && spot.occupiedBy !== currentUserId;
const isReservedByMe = spot.status === 'reserved' && spot.reservedBy === currentUserId;
const isReservedByOther = spot.status === 'reserved' && spot.reservedBy !== currentUserId;
const isFree = spot.status === 'free';
```

- [ ] **Step 2: Update status labels to handle reservation cases**

Replace the status label block (the four `{isFree && ...}` / `{isOwnSpot && ...}` / `{isOtherSpot && ...}` / `{isReserved && ...}` lines):

```typescript
{isFree && <Text style={styles.statusFree}>Free</Text>}
{isOwnSpot && <Text style={styles.statusOwn}>You're parked here</Text>}
{isOtherSpot && <Text style={styles.statusTaken}>Occupied</Text>}
{isReservedByMe && <Text style={styles.statusReservedMine}>Your reservation is active</Text>}
{isReservedByOther && <Text style={styles.statusReservedOther}>Reserved by another driver</Text>}
```

- [ ] **Step 3: Replace the Actions section**

Replace the entire Actions comment block (from `{/* Actions */}` to the end of the `isOwnSpot` button) with:

```typescript
{/* Actions */}
{isFree && !showDurationPicker && (
  <View style={styles.buttonRow}>
    <TouchableOpacity
      style={[styles.primaryButton, styles.buttonFlex, styles.navigateButton]}
      onPress={() => onNavigate(spot)}
    >
      <Text style={styles.navigateButtonText}>Navigate</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.primaryButton, styles.buttonFlex]}
      onPress={handleParkPress}
    >
      <Text style={styles.primaryButtonText}>I'm parking here</Text>
    </TouchableOpacity>
  </View>
)}

{isReservedByOther && (
  <View style={[styles.primaryButton, styles.primaryButtonDisabled]}>
    <Text style={styles.primaryButtonTextDisabled}>Reserved by another driver</Text>
  </View>
)}

{isReservedByMe && (
  <TouchableOpacity style={styles.primaryButton} onPress={handleParkPress}>
    <Text style={styles.primaryButtonText}>I'm parking here</Text>
  </TouchableOpacity>
)}

{isOwnSpot && (
  <TouchableOpacity style={styles.destructiveButton} onPress={handleLeavePress}>
    <Text style={styles.destructiveButtonText}>Leave parking</Text>
  </TouchableOpacity>
)}
```

- [ ] **Step 4: Update styles**

Add new style entries and update the `statusReserved` color. Add these to the `StyleSheet.create({...})` call, and replace `statusReserved` with two variants:

```typescript
// Replace statusReserved with:
statusReservedMine: {
  fontSize: 15,
  color: '#007AFF',
  fontWeight: '500',
},
statusReservedOther: {
  fontSize: 15,
  color: '#8E8E93',
},
// Add:
buttonRow: {
  flexDirection: 'row',
  gap: 8,
},
buttonFlex: {
  flex: 1,
},
navigateButton: {
  backgroundColor: '#F2F2F7',
},
navigateButtonText: {
  color: '#007AFF',
  fontSize: 16,
  fontWeight: '600',
},
primaryButtonDisabled: {
  backgroundColor: '#F2F2F7',
},
primaryButtonTextDisabled: {
  color: '#8E8E93',
  fontSize: 16,
  fontWeight: '600',
},
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: errors in `app/(tabs)/index.tsx` about missing `onNavigate` prop — fixed in Task 8.

- [ ] **Step 6: Commit**

```bash
git add components/SpotDetail.tsx
git commit -m "feat: add Navigate button and reservation state to SpotDetail"
```

---

### Task 8: Update app/(tabs)/index.tsx

**Files:**
- Modify: `app/(tabs)/index.tsx`

This is the final wiring task: change reserved color, import new hooks/components, wire `useReservation`, render `ReservationBanner` and `MapViewDirections`, handle arrival popup, update `onPark`.

- [ ] **Step 1: Update imports**

Replace the import block at the top of the file:

```typescript
import MapView, { Marker, Polygon, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { BottomSheet } from '../../components/BottomSheet';
import { SpotDetail } from '../../components/SpotDetail';
import { POIDetail } from '../../components/POIDetail';
import { ReservationBanner } from '../../components/ReservationBanner';
import { useParking } from '../../hooks/useParking';
import { usePOIs } from '../../hooks/usePOIs';
import { useReservation } from '../../hooks/useReservation';
import { useAuth } from '../../context/AuthContext';
import { Spot, POI, POIType, DURATION_OPTIONS, ParkingDuration } from '../../types/parking';
import { BLUE_ZONE_POLYGONS } from '../../lib/zones';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBZ6_IwKvnINioda3w7s-DRNQZHLv-V2M0';
```

- [ ] **Step 2: Change reserved marker color**

Replace:
```typescript
const STATUS_FILL: Record<Spot['status'], string> = {
  free: '#34C759',
  occupied: '#FF3B30',
  reserved: '#FF9500',
};
```

With:
```typescript
const STATUS_FILL: Record<Spot['status'], string> = {
  free: '#34C759',
  occupied: '#FF3B30',
  reserved: '#007AFF',
};
```

- [ ] **Step 3: Update useParking destructure and add useReservation**

Replace:
```typescript
const { spots, spotsLoading, parkSpot, leaveSpot } = useParking(user?.id ?? null);
```

With:
```typescript
const { spots, spotsLoading, parkSpot, leaveSpot, reserveSpot, cancelReservation } = useParking(user?.id ?? null);
```

Then add `useReservation` after the `usePOIs` line:

```typescript
const { pois } = usePOIs();

const {
  navigationTarget,
  distanceToTarget,
  reservationActive,
  userLocation,
  startNavigation,
  cancelNavigation,
  confirmParking,
} = useReservation({
  currentUserId: user?.id ?? null,
  spots,
  reserveSpot,
  cancelReservation,
  // confirmParking is passed as a parameter (not closed over) to avoid circular reference
  onArrival: (spot, doConfirmParking) => {
    if (spot.zoneType !== 'none') {
      Alert.alert(
        `You've arrived at ${spot.streetName}`,
        'How long are you parking?',
        [
          ...DURATION_OPTIONS.map(({ label, value }) => ({
            text: label,
            onPress: () => {
              doConfirmParking();
              void parkSpot(spot.id, value);
              setSelectedSpot(spot);
            },
          })),
          { text: 'Not now', style: 'cancel' as const },
        ],
      );
    } else {
      Alert.alert(
        `You've arrived at ${spot.streetName}`,
        'Tap to confirm parking.',
        [
          {
            text: 'Park here',
            onPress: () => {
              doConfirmParking();
              void parkSpot(spot.id, null);
              setSelectedSpot(spot);
            },
          },
          { text: 'Not now', style: 'cancel' as const },
        ],
      );
    }
  },
  onSpotTaken: () => {
    Alert.alert('Spot Taken', 'This spot was just taken by another driver.');
  },
});
```

- [ ] **Step 4: Update onPark to handle active reservation**

Replace the `onPark` prop passed to `SpotDetail`:

```typescript
onPark={async (id, duration) => {
  if (navigationTarget) {
    if (navigationTarget.id !== id) {
      // Parking on a DIFFERENT spot — cancel existing reservation
      await cancelNavigation();
    } else {
      // Parking on the RESERVED spot — stop navigation without cancelling reservation
      confirmParking();
    }
  }
  parkSpot(id, duration);
}}
```

- [ ] **Step 5: Add onNavigate prop to SpotDetail**

Add the `onNavigate` prop to the `SpotDetail` component inside the `BottomSheet`:

```typescript
onNavigate={(spot) => {
  void startNavigation(spot);
  setSelectedSpot(null);
}}
```

The full `SpotDetail` usage should look like:

```typescript
<SpotDetail
  spot={selectedSpot}
  currentUserId={user?.id ?? null}
  onPark={async (id, duration) => {
    if (navigationTarget) {
      if (navigationTarget.id !== id) {
        await cancelNavigation();
      } else {
        confirmParking();
      }
    }
    parkSpot(id, duration);
  }}
  onLeave={(id) => {
    leaveSpot(id, spots);
    setSelectedSpot(null);
  }}
  onNavigate={(spot) => {
    void startNavigation(spot);
    setSelectedSpot(null);
  }}
  onDismiss={() => setSelectedSpot(null)}
/>
```

- [ ] **Step 6: Render ReservationBanner above the map**

Add the banner inside the root `<View>`, directly after the closing `</MapView>` tag and before the POI toggles:

```typescript
<ReservationBanner
  navigationTarget={navigationTarget}
  distanceToTarget={distanceToTarget}
  reservationActive={reservationActive}
  onCancel={() => void cancelNavigation()}
/>
```

- [ ] **Step 7: Render MapViewDirections inside MapView**

Inside `<MapView>`, after the spot markers block, add:

```typescript
{/* Route polyline — shown during navigation, hidden once reserved */}
{navigationTarget && userLocation && !reservationActive && (
  <MapViewDirections
    origin={userLocation}
    destination={{ latitude: navigationTarget.lat, longitude: navigationTarget.lng }}
    apikey={GOOGLE_MAPS_API_KEY}
    strokeWidth={3}
    strokeColor="#007AFF"
    lineDashPattern={[5, 5]}
    mode="DRIVING"
  />
)}
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: wire auto-reserve flow — banner, route, arrival popup"
```

---

### Task 9: Verify end-to-end in Expo Go

Manual test checklist — run through these on a device or simulator:

- [ ] **Step 1: Start the dev server**

```bash
npx expo start
```

- [ ] **Step 2: Verify reserved spots show blue**

Open the app. If any spot has `status = 'reserved'` in Supabase, confirm its marker is blue (not orange). Set one manually if needed:
```sql
UPDATE public.parking_spots SET status = 'reserved', reserved_by = '<any-uuid>', reserved_at = NOW() WHERE id = 'spot-1';
```

- [ ] **Step 3: Verify bottom sheet shows two buttons on free spots**

Tap a free spot → bottom sheet should show "Navigate" (light) and "I'm parking here" (blue) side by side.

- [ ] **Step 4: Verify reserved-by-other block**

With spot-1 reserved by someone else, tap it → bottom sheet should show "Reserved by another driver" (greyed out, non-tappable).

- [ ] **Step 5: Test navigation flow (simulator)**

Tap a free spot → tap "Navigate to spot". Confirm:
- Bottom sheet closes
- Top banner appears: `"Navigating to [street] — Xm"`
- Blue route line appears on map (may take a moment for Directions API)

- [ ] **Step 6: Test Cancel**

While banner is showing, tap Cancel. Confirm banner dismisses and spot stays free.

- [ ] **Step 7: Reset spot to free after testing**

```sql
UPDATE public.parking_spots SET status = 'free', reserved_by = NULL, reserved_at = NULL WHERE id = 'spot-1';
```

- [ ] **Step 8: Commit if any adjustments were needed**

```bash
git add -p   # stage only intentional adjustments
git commit -m "fix: <describe any adjustments>"
```

---

## Enablement note: Directions API

Before testing the route polyline, ensure **Directions API** is enabled in Google Cloud Console for the project that owns the key `AIzaSyBZ6_IwKvnINioda3w7s-DRNQZHLv-V2M0`. Navigation → APIs & Services → Library → search "Directions API" → Enable. The Maps JavaScript API and Maps SDK are already enabled (existing map works), but Directions is a separate API.
