import { useState, useCallback, useEffect } from 'react';
import { Spot, ParkingDuration } from '../types/parking';
import { supabase } from '../lib/supabase';

// Test spots from parking-spots.geojson — replaced by Feature 3 Supabase data
const MOCK_SPOTS: Spot[] = [
  {
    id: 'spot-1',
    lat: 43.210476,
    lng: 27.924639,
    streetName: 'bul. Osmi Primorski Polk',
    zoneType: 'blue',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'spot-2',
    lat: 43.210484,
    lng: 27.924693,
    streetName: 'bul. Osmi Primorski Polk',
    zoneType: 'blue',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'spot-3',
    lat: 43.210489,
    lng: 27.924744,
    streetName: 'bul. Osmi Primorski Polk',
    zoneType: 'blue',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'spot-4',
    lat: 43.210495,
    lng: 27.924795,
    streetName: 'bul. Osmi Primorski Polk',
    zoneType: 'blue',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'spot-5',
    lat: 43.210503,
    lng: 27.924843,
    streetName: 'bul. Osmi Primorski Polk',
    zoneType: 'blue',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'spot-7',
    lat: 43.210509,
    lng: 27.924891,
    streetName: 'bul. Osmi Primorski Polk',
    zoneType: 'blue',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
];

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
const EXPIRY_CHECK_INTERVAL_MS = 30_000; // 30 seconds

function freeSpot(s: Spot): Spot {
  return { ...s, status: 'free', occupiedBy: null, occupiedAt: null, expectedFreeAt: null };
}

export function useParking(currentUserId: string | null) {
  const [spots, setSpots] = useState<Spot[]>(MOCK_SPOTS);

  // Auto-free zone spots whose timer has expired and stale spots (>24h, no zone time)
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setSpots((prev) => {
        const hasExpired = prev.some((s) => {
          if (s.status !== 'occupied') return false;
          if (s.expectedFreeAt && new Date(s.expectedFreeAt).getTime() <= now) return true;
          if (!s.expectedFreeAt && s.occupiedAt && now - new Date(s.occupiedAt).getTime() > STALE_THRESHOLD_MS) return true;
          return false;
        });
        if (!hasExpired) return prev; // skip re-render if nothing changed
        return prev.map((s) => {
          if (s.status !== 'occupied') return s;
          if (s.expectedFreeAt && new Date(s.expectedFreeAt).getTime() <= now) return freeSpot(s);
          if (!s.expectedFreeAt && s.occupiedAt && now - new Date(s.occupiedAt).getTime() > STALE_THRESHOLD_MS) return freeSpot(s);
          return s;
        });
      });
    };

    tick(); // run immediately on mount
    const id = setInterval(tick, EXPIRY_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const parkSpot = useCallback(
    (spotId: string, duration: ParkingDuration | null) => {
      if (!currentUserId) return;

      const now = new Date();
      const expectedFreeAt =
        duration !== null
          ? new Date(now.getTime() + duration * 60 * 1000).toISOString()
          : null;
      const occupiedAt = now.toISOString();

      // Optimistic local update
      setSpots((prev) =>
        prev.map((s) =>
          s.id === spotId
            ? {
                ...s,
                status: 'occupied',
                occupiedBy: currentUserId,
                occupiedAt,
                expectedFreeAt,
              }
            : s,
        ),
      );

      // Fire-and-forget Supabase update (table may not exist yet in Feature 3)
      supabase
        .from('spots')
        .update({ status: 'occupied', occupiedBy: currentUserId, occupiedAt, expectedFreeAt })
        .eq('id', spotId)
        .then(() => {})
        .catch(() => {});
    },
    [currentUserId],
  );

  const leaveSpot = useCallback(
    (spotId: string) => {
      // Guard: only the owner can free a spot
      setSpots((prev) => {
        const spot = prev.find((s) => s.id === spotId);
        if (!spot || spot.occupiedBy !== currentUserId) return prev;

        // Fire-and-forget Supabase update
        supabase
          .from('spots')
          .update({ status: 'free', occupiedBy: null, occupiedAt: null, expectedFreeAt: null })
          .eq('id', spotId)
          .then(() => {})
          .catch(() => {});

        return prev.map((s) => (s.id === spotId ? freeSpot(s) : s));
      });
    },
    [currentUserId],
  );

  return { spots, parkSpot, leaveSpot };
}
