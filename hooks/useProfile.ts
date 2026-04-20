import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface ParkingSession {
  id: string;
  zone: 'blue' | 'green' | 'none';
  streetName: string;
  startedAt: string;   // ISO
  endedAt: string;     // ISO
  durationMinutes: number;
}

export interface UserProfile {
  displayName: string;
  bio: string;
  avatarColor: string;
  plates: string[];
}

function rowToSession(row: Record<string, unknown>): ParkingSession {
  return {
    id: row.id as string,
    zone: row.zone_type as ParkingSession['zone'],
    streetName: row.street_name as string,
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string,
    durationMinutes: row.actual_duration_minutes as number,
  };
}

export function useProfile(user: User | null) {
  const meta = user?.user_metadata ?? {};

  const [profile, setProfile] = useState<UserProfile>({
    displayName: (meta.display_name as string) ?? '',
    bio: (meta.bio as string) ?? '',
    avatarColor: (meta.avatar_color as string) ?? '#4A90D9',
    plates: (meta.plates as string[]) ?? [],
  });

  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch sessions + real-time INSERT listener
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    supabase
      .from('parking_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          Alert.alert('Could not load parking sessions', error.message);
          return;
        }
        if (data) {
          setSessions((data as Record<string, unknown>[]).map(rowToSession));
        }
      });

    const channel = supabase
      .channel('user_parking_sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parking_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const session = rowToSession(payload.new as Record<string, unknown>);
          setSessions((prev) => [session, ...prev]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'avatarColor'>>) => {
      setSaving(true);
      const next = { ...profile, ...updates };
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: next.displayName,
          bio: next.bio,
          avatar_color: next.avatarColor,
          plates: next.plates,
        },
      });
      if (!error) setProfile(next);
      setSaving(false);
      return error;
    },
    [profile],
  );

  const addPlate = useCallback(
    async (plate: string) => {
      const trimmed = plate.trim().toUpperCase();
      if (!trimmed || profile.plates.includes(trimmed)) return null;
      const newPlates = [...profile.plates, trimmed];
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: profile.displayName,
          bio: profile.bio,
          avatar_color: profile.avatarColor,
          plates: newPlates,
        },
      });
      if (!error) setProfile((p) => ({ ...p, plates: newPlates }));
      setSaving(false);
      return error;
    },
    [profile],
  );

  const removePlate = useCallback(
    async (plate: string) => {
      const newPlates = profile.plates.filter((p) => p !== plate);
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: profile.displayName,
          bio: profile.bio,
          avatar_color: profile.avatarColor,
          plates: newPlates,
        },
      });
      if (!error) setProfile((p) => ({ ...p, plates: newPlates }));
      setSaving(false);
      return error;
    },
    [profile],
  );

  return { profile, sessions, saving, updateProfile, addPlate, removePlate };
}
