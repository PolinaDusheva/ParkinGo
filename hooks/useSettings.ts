import { useState, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import i18n from '../lib/i18n';

// Merges base settings with a partial override. Handles nested notifications object.
function mergeSettings(base: AppSettings, overrides: Partial<AppSettings>): AppSettings {
  return {
    ...base,
    ...overrides,
    notifications: {
      ...base.notifications,
      ...(overrides.notifications ?? {}),
    },
  };
}

function settingsFromUser(user: User | null): AppSettings {
  const saved = user?.user_metadata?.settings as Partial<AppSettings> | undefined;
  return saved ? mergeSettings(DEFAULT_SETTINGS, saved) : { ...DEFAULT_SETTINGS };
}

export function useSettings(user: User | null) {
  const [settings, setSettings] = useState<AppSettings>(() => settingsFromUser(user));

  // Re-sync when user logs in/out or switches accounts
  useEffect(() => {
    setSettings(settingsFromUser(user));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSetting = useCallback(
    async (patch: Partial<AppSettings>) => {
      const updated = mergeSettings(settings, patch);
      setSettings(updated);

      // Apply language change immediately
      if (patch.language) {
        void i18n.changeLanguage(patch.language);
      }

      if (user) {
        await supabase.auth.updateUser({ data: { settings: updated } });
      }
    },
    [settings, user],
  );

  return { settings, updateSetting };
}
