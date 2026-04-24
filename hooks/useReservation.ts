import { useState, useCallback, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Spot } from '../types/parking';

const RESERVE_THRESHOLD_M = 100;
const ARRIVAL_THRESHOLD_M = 10;
const SAFETY_NET_MS = 5 * 60 * 1000;
const SAFETY_NET_CHECK_MS = 30_000;
const ROUTE_UPDATE_THRESHOLD_M = 10;

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
    trigger: null,
  });
}

interface UseReservationOptions {
  currentUserId: string | null;
  spots: Spot[];
  reserveSpot: (spotId: string) => Promise<void>;
  cancelReservation: (spotId: string) => Promise<void>;
  onArrival: (spot: Spot, confirmParking: () => void, isActive: () => boolean) => void;
  onSpotTaken: () => void;
  notificationSettings?: { reservation: boolean; arrival: boolean };
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
  notificationSettings,
}: UseReservationOptions): UseReservationResult {
  const [navigationTarget, setNavigationTarget] = useState<Spot | null>(null);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [reservationActive, setReservationActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const navigationTargetRef = useRef<Spot | null>(null);
  const reservationActiveRef = useRef(false);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const arrivalFiredRef = useRef(false);
  const reservationFiredRef = useRef(false);
  const permissionRequestedRef = useRef(false);
  const lastRouteLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const spotsRef = useRef(spots);

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

      if (!permissionRequestedRef.current) {
        permissionRequestedRef.current = true;
        const { status } = await Notifications.requestPermissionsAsync();
        void status;
      }

      await cancelNavigation();

      navigationTargetRef.current = spot;
      reservationActiveRef.current = false;
      arrivalFiredRef.current = false;
      reservationFiredRef.current = false;
      lastRouteLocationRef.current = null;

      setNavigationTarget(spot);
      setDistanceToTarget(null);
      setReservationActive(false);

      // Seed userLocation immediately so MapViewDirections renders without waiting
      // for the first watchPosition callback (which can take several seconds).
      try {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = initial.coords;
        setUserLocation({ latitude, longitude });
        lastRouteLocationRef.current = { latitude, longitude };
        setDistanceToTarget(Math.round(distanceMetres(latitude, longitude, spot.lat, spot.lng)));
      } catch {
        // Permission already granted at this point; ignore transient errors.
      }

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
        (location) => {
          const { latitude, longitude } = location.coords;

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

          if (dist <= RESERVE_THRESHOLD_M && !reservationFiredRef.current) {
            reservationFiredRef.current = true;
            reservationActiveRef.current = true;
            setReservationActive(true);
            void reserveSpot(spot.id);
            if (notificationSettings?.reservation !== false) {
              void scheduleLocalNotification(
                'Spot Reserved',
                `Your spot on ${spot.streetName} is reserved! You have 5 minutes to park.`,
              );
            }
          }

          if (
            dist <= ARRIVAL_THRESHOLD_M &&
            reservationFiredRef.current &&
            !arrivalFiredRef.current
          ) {
            arrivalFiredRef.current = true;
            if (notificationSettings?.arrival !== false) {
              void scheduleLocalNotification(
                "You've Arrived",
                'Tap to confirm how long you are parking.',
              );
            }
            onArrival(spot, confirmParking, () => reservationActiveRef.current);
          }
        },
      );

      watcherRef.current = sub;
    },
    [currentUserId, cancelNavigation, reserveSpot, onArrival, confirmParking],
  );

  // Keep spotsRef current so the safety-net interval reads fresh spot data
  // without being recreated on every real-time Supabase push.
  useEffect(() => {
    spotsRef.current = spots;
  }, [spots]);

  useEffect(() => {
    if (!currentUserId || !reservationActive || !navigationTarget) return;

    const check = () => {
      const target = spotsRef.current.find((s) => s.id === navigationTarget.id);
      if (!target || target.status !== 'reserved' || target.reservedBy !== currentUserId) return;
      if (!target.reservedAt) return;
      if (Date.now() - new Date(target.reservedAt).getTime() > SAFETY_NET_MS) {
        void cancelNavigation();
      }
    };

    check();
    const id = setInterval(check, SAFETY_NET_CHECK_MS);
    return () => clearInterval(id);
  }, [currentUserId, reservationActive, navigationTarget, cancelNavigation]);

  useEffect(() => {
    if (!navigationTarget || reservationActive) return;
    const target = spots.find((s) => s.id === navigationTarget.id);
    if (target && target.status !== 'free') {
      void cancelNavigation();
      onSpotTaken();
    }
  }, [spots, navigationTarget, reservationActive, cancelNavigation, onSpotTaken]);

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
