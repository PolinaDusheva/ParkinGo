import { useState, useCallback, useEffect, useRef } from 'react';
import { Spot, ParkingDuration } from '../types/parking';
import { supabase } from '../lib/supabase';

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
const EXPIRY_CHECK_INTERVAL_MS = 30_000; // 30 seconds

// Map Supabase snake_case columns → Spot type
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

function freeSpot(s: Spot): Spot {
  return { ...s, status: 'free', occupiedBy: null, occupiedAt: null, expectedFreeAt: null, reservedBy: null, reservedAt: null };
}

function minutesBetween(startIso: string, endIso: string): number {
  return Math.max(1, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000));
}

async function insertSession(
  userId: string,
  spot: Spot,
  startedAt: string,
  endedAt: string,
): Promise<void> {
  await supabase.from('parking_sessions').insert({
    user_id: userId,
    spot_id: spot.id,
    street_name: spot.streetName,
    zone_type: spot.zoneType,
    started_at: startedAt,
    ended_at: endedAt,
    actual_duration_minutes: minutesBetween(startedAt, endedAt),
  });
}

export function useParking(currentUserId: string | null) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(true);

  // Tracks spot IDs whose expiry session has already been recorded
  const processedExpiryIds = useRef(new Set<string>());

  // Initial fetch + real-time listener
  useEffect(() => {
    supabase
      .from('parking_spots')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) {
          setSpots((data as Record<string, unknown>[]).map(rowToSpot));
        }
        setSpotsLoading(false);
      });

    const channel = supabase
      .channel('parking_spots_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parking_spots' },
        (payload) => {
          const updated = rowToSpot(payload.new as Record<string, unknown>);
          setSpots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Client-side expiry check — records sessions and frees spots when timer runs out
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const nowIso = new Date(now).toISOString();

      setSpots((prev) => {
        const expired = prev.filter((s) => {
          if (s.status !== 'occupied') return false;
          if (processedExpiryIds.current.has(s.id)) return false;
          if (s.expectedFreeAt && new Date(s.expectedFreeAt).getTime() <= now) return true;
          if (!s.expectedFreeAt && s.occupiedAt && now - new Date(s.occupiedAt).getTime() > STALE_THRESHOLD_MS) return true;
          return false;
        });

        if (expired.length === 0) return prev;

        // Mark all as processed before any async work to prevent double-recording
        expired.forEach((s) => processedExpiryIds.current.add(s.id));

        // Defer Supabase writes outside the state updater
        queueMicrotask(() => {
          expired.forEach((s) => {
            if (!currentUserId || s.occupiedBy !== currentUserId || !s.occupiedAt) return;
            const endedAt = s.expectedFreeAt ?? nowIso;
            // Record session with actual duration (planned duration if timer ran out)
            void insertSession(currentUserId, s, s.occupiedAt, endedAt);
            // Free the spot in the DB
            void supabase
              .from('parking_spots')
              .update({ status: 'free', occupied_by: null, occupied_at: null, expected_free_at: null })
              .eq('id', s.id);
          });
        });

        return prev.map((s) => (expired.some((e) => e.id === s.id) ? freeSpot(s) : s));
      });
    };

    tick();
    const id = setInterval(tick, EXPIRY_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [currentUserId]);

  const parkSpot = useCallback(
    async (spotId: string, duration: ParkingDuration | null) => {
      if (!currentUserId) return;

      const now = new Date();
      const occupiedAt = now.toISOString();
      const expectedFreeAt = duration !== null
        ? new Date(now.getTime() + duration * 60 * 1000).toISOString()
        : null;

      // Optimistic local update
      setSpots((prev) =>
        prev.map((s) =>
          s.id === spotId
            ? { ...s, status: 'occupied', occupiedBy: currentUserId, occupiedAt, expectedFreeAt }
            : s,
        ),
      );

      await supabase
        .from('parking_spots')
        .update({
          status: 'occupied',
          occupied_by: currentUserId,
          occupied_at: occupiedAt,
          expected_free_at: expectedFreeAt,
        })
        .eq('id', spotId);
    },
    [currentUserId],
  );

  const leaveSpot = useCallback(
    async (spotId: string) => {
      if (!currentUserId) return;

      // Find the spot to get occupiedAt, streetName, zoneType before freeing
      setSpots((prev) => {
        const spot = prev.find((s) => s.id === spotId);

        if (spot?.occupiedAt && spot.occupiedBy === currentUserId) {
          const endedAt = new Date().toISOString();
          // Mark as processed so the expiry tick doesn't double-record
          processedExpiryIds.current.add(spotId);
          // Record the session with actual time spent
          void insertSession(currentUserId, spot, spot.occupiedAt, endedAt);
        }

        return prev.map((s) => (s.id === spotId ? freeSpot(s) : s));
      });

      await supabase
        .from('parking_spots')
        .update({ status: 'free', occupied_by: null, occupied_at: null, expected_free_at: null, reserved_by: null, reserved_at: null })
        .eq('id', spotId)
        .eq('occupied_by', currentUserId); // server-side ownership guard
    },
    [currentUserId],
  );

  const reserveSpot = useCallback(
    async (spotId: string): Promise<void> => {
      if (!currentUserId) return;
      const now = new Date().toISOString();
      setSpots((prev) =>
        prev.map((s) =>
          s.id === spotId
            ? { ...s, status: 'reserved', reservedBy: currentUserId, reservedAt: now }
            : s,
        ),
      );
      await supabase
        .from('parking_spots')
        .update({ status: 'reserved', reserved_by: currentUserId, reserved_at: now })
        .eq('id', spotId)
        .eq('status', 'free'); // atomic guard — only reserve if still free
    },
    [currentUserId],
  );

  const cancelReservation = useCallback(
    async (spotId: string): Promise<void> => {
      if (!currentUserId) return;
      setSpots((prev) =>
        prev.map((s) =>
          s.id === spotId
            ? { ...s, status: 'free', reservedBy: null, reservedAt: null }
            : s,
        ),
      );
      await supabase
        .from('parking_spots')
        .update({ status: 'free', reserved_by: null, reserved_at: null })
        .eq('id', spotId)
        .eq('reserved_by', currentUserId); // ownership guard
    },
    [currentUserId],
  );

  return { spots, spotsLoading, parkSpot, leaveSpot, reserveSpot, cancelReservation };
}
