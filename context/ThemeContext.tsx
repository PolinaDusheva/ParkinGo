import { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { useAuth } from './AuthContext';

type ThemePref = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colorScheme: 'light' | 'dark';
  themePref: ThemePref;
  setThemePref: (pref: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'light',
  themePref: 'system',
  setThemePref: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [themePref, setThemePref] = useState<ThemePref>('system');
  const [deviceScheme, setDeviceScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  // Initialise from saved user_metadata when user loads
  useEffect(() => {
    if (!user) return;
    const saved = user.user_metadata?.settings?.theme as ThemePref | undefined;
    if (saved) setThemePref(saved);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track device appearance changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setDeviceScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const colorScheme: 'light' | 'dark' =
    themePref === 'system'
      ? deviceScheme === 'dark'
        ? 'dark'
        : 'light'
      : themePref;

  return (
    <ThemeContext.Provider value={{ colorScheme, themePref, setThemePref }}>
      {children}
    </ThemeContext.Provider>
  );
}
