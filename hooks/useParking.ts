import { useState, useCallback } from 'react';
import { Spot, ParkingDuration } from '../types/parking';
import { supabase } from '../lib/supabase';

// Mock spots around Varna center — replaced by Feature 3 Supabase data
const MOCK_SPOTS: Spot[] = [
  // bul. Slivnitsa — blue zone
  {
    id: 'slivnitsa-1',
    lat: 43.2158,
    lng: 27.9128,
    streetName: 'bul. Slivnitsa',
    zoneType: 'blue',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'slivnitsa-2',
    lat: 43.2155,
    lng: 27.9133,
    streetName: 'bul. Slivnitsa',
    zoneType: 'blue',
    status: 'occupied',
    occupiedBy: 'other-user-1',
    occupiedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    expectedFreeAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'slivnitsa-3',
    lat: 43.2152,
    lng: 27.9138,
    streetName: 'bul. Slivnitsa',
    zoneType: 'blue',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'slivnitsa-4',
    lat: 43.2149,
    lng: 27.9143,
    streetName: 'bul. Slivnitsa',
    zoneType: 'blue',
    status: 'reserved',
    occupiedBy: 'other-user-2',
    occupiedAt: null,
    expectedFreeAt: null,
  },
  // ul. Tsar Simeon I — green zone
  {
    id: 'simeon-1',
    lat: 43.2144,
    lng: 27.9162,
    streetName: 'ul. Tsar Simeon I',
    zoneType: 'green',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'simeon-2',
    lat: 43.2141,
    lng: 27.9167,
    streetName: 'ul. Tsar Simeon I',
    zoneType: 'green',
    status: 'occupied',
    occupiedBy: 'other-user-3',
    occupiedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    expectedFreeAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'simeon-3',
    lat: 43.2138,
    lng: 27.9172,
    streetName: 'ul. Tsar Simeon I',
    zoneType: 'green',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'simeon-4',
    lat: 43.2135,
    lng: 27.9177,
    streetName: 'ul. Tsar Simeon I',
    zoneType: 'green',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  // bul. Vladislav Varnenchik — no zone
  {
    id: 'varnenchik-1',
    lat: 43.2128,
    lng: 27.9118,
    streetName: 'bul. Vladislav Varnenchik',
    zoneType: 'none',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'varnenchik-2',
    lat: 43.2125,
    lng: 27.9123,
    streetName: 'bul. Vladislav Varnenchik',
    zoneType: 'none',
    status: 'occupied',
    occupiedBy: 'other-user-4',
    occupiedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    expectedFreeAt: null,
  },
  {
    id: 'varnenchik-3',
    lat: 43.2122,
    lng: 27.9128,
    streetName: 'bul. Vladislav Varnenchik',
    zoneType: 'none',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
  {
    id: 'varnenchik-4',
    lat: 43.2119,
    lng: 27.9133,
    streetName: 'bul. Vladislav Varnenchik',
    zoneType: 'none',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  },
];

export function useParking(currentUserId: string | null) {
  const [spots, setSpots] = useState<Spot[]>(MOCK_SPOTS);

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

  const leaveSpot = useCallback((spotId: string) => {
    // Optimistic local update
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId
          ? {
              ...s,
              status: 'free',
              occupiedBy: null,
              occupiedAt: null,
              expectedFreeAt: null,
            }
          : s,
      ),
    );

    // Fire-and-forget Supabase update
    supabase
      .from('spots')
      .update({ status: 'free', occupiedBy: null, occupiedAt: null, expectedFreeAt: null })
      .eq('id', spotId)
      .then(() => {})
      .catch(() => {});
  }, []);

  return { spots, parkSpot, leaveSpot };
}
