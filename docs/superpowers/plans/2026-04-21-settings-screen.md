# Settings Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full Settings screen with theme, language (i18n), map type, parking defaults, notifications, data/cache, about, and account management — all synced to Supabase `user_metadata`.

**Architecture:** A `useSettings` hook reads/writes a nested `settings` object in Supabase `user_metadata` (same pattern as `useProfile`). A `ThemeContext` wraps the app and provides `colorScheme` for styling. Complex choices use a new `PickerSheet` modal. A `SettingsRow` reusable component handles the iOS-style grouped list rows.

**Tech Stack:** react-i18next + i18next (translations), expo-localization (device locale), expo-web-browser (external links), @react-native-async-storage/async-storage (already installed), Supabase `auth.updateUser` (already configured)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `types/settings.ts` | `AppSettings` interface + `DEFAULT_SETTINGS` constant |
| Create | `lib/colors.ts` | `COLORS` palette for light/dark themes |
| Create | `lib/i18n.ts` | Initialises i18next with en/bg resources |
| Create | `locales/en.json` | English translation strings (settings keys only) |
| Create | `locales/bg.json` | Bulgarian translation strings (settings keys only) |
| Create | `hooks/useSettings.ts` | Read/write settings from `user_metadata`; exposes `settings` + `updateSetting` |
| Create | `context/ThemeContext.tsx` | Provides `colorScheme` + `setThemePref` app-wide |
| Create | `components/SettingsRow.tsx` | Reusable settings list row (label, value, chevron, switch) |
| Create | `components/PickerSheet.tsx` | Modal bottom sheet picker for multi-option choices |
| Create | `supabase/delete_user.sql` | Postgres RPC function for client-side account deletion |
| Modify | `app/_layout.tsx` | Wrap tree in `ThemeProvider`; import `lib/i18n` side-effect; init language on login |
| Replace | `app/(tabs)/settings.tsx` | Full settings screen replacing stub |
| Modify | `app/(tabs)/index.tsx` | Read `mapType` from settings; apply `defaultDuration` skip-picker shortcut |

---

## Task 1: Install new dependencies

**Files:**
- Modify: `package.json` (via install commands)

- [ ] **Step 1: Install Expo-managed packages**

```bash
cd /path/to/ParkinGo
npx expo install expo-localization expo-web-browser
```

Expected output: packages added to `package.json` dependencies.

- [ ] **Step 2: Install i18n packages**

```bash
npm install react-i18next i18next
```

Expected output: `react-i18next` and `i18next` added to `node_modules` and `package.json`.

- [ ] **Step 3: Verify TypeScript still passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-i18next, i18next, expo-localization, expo-web-browser"
```

---

## Task 2: i18n setup

**Files:**
- Create: `lib/i18n.ts`
- Create: `locales/en.json`
- Create: `locales/bg.json`

- [ ] **Step 1: Create `locales/en.json`**

```json
{
  "settings": {
    "title": "Settings",
    "appearance": {
      "title": "Appearance",
      "theme": "Theme",
      "light": "Light",
      "dark": "Dark",
      "system": "System"
    },
    "language": {
      "title": "Language",
      "label": "Language",
      "en": "English",
      "bg": "Bulgarian"
    },
    "map": {
      "title": "Map",
      "mapType": "Map Type",
      "standard": "Standard",
      "satellite": "Satellite",
      "hybrid": "Hybrid"
    },
    "parkingDefaults": {
      "title": "Parking Defaults",
      "defaultDuration": "Default Duration",
      "distanceUnit": "Distance Units",
      "alwaysAsk": "Always ask",
      "km": "km",
      "mi": "mi"
    },
    "notifications": {
      "title": "Notifications",
      "reservation": "Reservation alerts",
      "arrival": "Arrival alerts",
      "timerExpiry": "Timer expiry alerts"
    },
    "dataCache": {
      "title": "Data & Cache",
      "storageUsed": "Storage used",
      "clearCache": "Clear Cache",
      "clearCacheConfirm": "This will clear locally cached app data. Your account and parking data are safe."
    },
    "about": {
      "title": "About",
      "version": "Version",
      "privacyPolicy": "Privacy Policy",
      "terms": "Terms of Service",
      "licenses": "Open-source Licenses"
    },
    "account": {
      "title": "Account",
      "deleteAccount": "Delete Account",
      "deleteConfirmTitle": "Delete Account",
      "deleteConfirmMessage": "This will permanently delete your account and all parking history. This cannot be undone."
    }
  }
}
```

- [ ] **Step 2: Create `locales/bg.json`**

```json
{
  "settings": {
    "title": "Настройки",
    "appearance": {
      "title": "Външен вид",
      "theme": "Тема",
      "light": "Светла",
      "dark": "Тъмна",
      "system": "Системна"
    },
    "language": {
      "title": "Език",
      "label": "Език",
      "en": "English",
      "bg": "Български"
    },
    "map": {
      "title": "Карта",
      "mapType": "Тип карта",
      "standard": "Стандартна",
      "satellite": "Сателитна",
      "hybrid": "Хибридна"
    },
    "parkingDefaults": {
      "title": "Паркиране по подразбиране",
      "defaultDuration": "Продължителност",
      "distanceUnit": "Единица за разстояние",
      "alwaysAsk": "Винаги питай",
      "km": "км",
      "mi": "ми"
    },
    "notifications": {
      "title": "Известия",
      "reservation": "Известия за резервация",
      "arrival": "Известия при пристигане",
      "timerExpiry": "Известия за изтекъл таймер"
    },
    "dataCache": {
      "title": "Данни и кеш",
      "storageUsed": "Използвано място",
      "clearCache": "Изчисти кеша",
      "clearCacheConfirm": "Това ще изчисти локално кешираните данни. Вашите данни са в безопасност."
    },
    "about": {
      "title": "За приложението",
      "version": "Версия",
      "privacyPolicy": "Политика за поверителност",
      "terms": "Условия за ползване",
      "licenses": "Лицензи с отворен код"
    },
    "account": {
      "title": "Акаунт",
      "deleteAccount": "Изтрий акаунт",
      "deleteConfirmTitle": "Изтриване на акаунт",
      "deleteConfirmMessage": "Това ще изтрие завинаги вашия акаунт и цялата история на паркиране. Действието не може да се отмени."
    }
  }
}
```

- [ ] **Step 3: Create `lib/i18n.ts`**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import bg from '../locales/bg.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bg: { translation: bg },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 4: Verify TypeScript passes**

```bash
npm run lint
```

Expected: no errors. (`resolveJsonModule: true` is set in the Expo base tsconfig — JSON imports work out of the box.)

- [ ] **Step 5: Commit**

```bash
git add lib/i18n.ts locales/en.json locales/bg.json
git commit -m "feat(i18n): add react-i18next setup with English and Bulgarian translations"
```

---

## Task 3: AppSettings type + DEFAULT_SETTINGS

**Files:**
- Create: `types/settings.ts`

- [ ] **Step 1: Create `types/settings.ts`**

```ts
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'bg';
  mapType: 'standard' | 'satellite' | 'hybrid';
  defaultDuration: 30 | 60 | 120 | 180 | null; // null = always ask
  distanceUnit: 'km' | 'mi';
  notifications: {
    reservation: boolean;
    arrival: boolean;
    timerExpiry: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  mapType: 'standard',
  defaultDuration: null,
  distanceUnit: 'km',
  notifications: {
    reservation: true,
    arrival: true,
    timerExpiry: true,
  },
};
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add types/settings.ts
git commit -m "feat(settings): add AppSettings type and DEFAULT_SETTINGS"
```

---

## Task 4: useSettings hook

**Files:**
- Create: `hooks/useSettings.ts`

- [ ] **Step 1: Create `hooks/useSettings.ts`**

```ts
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
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useSettings.ts
git commit -m "feat(settings): add useSettings hook with Supabase sync"
```

---

## Task 5: ThemeContext + COLORS palette

**Files:**
- Create: `lib/colors.ts`
- Create: `context/ThemeContext.tsx`

- [ ] **Step 1: Create `lib/colors.ts`**

```ts
export const COLORS = {
  light: {
    background: '#FFFFFF',
    groupedBackground: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    separator: '#C6C6C8',
    destructive: '#FF3B30',
    tint: '#4A90D9',
  },
  dark: {
    background: '#000000',
    groupedBackground: '#1C1C1E',
    surface: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    separator: '#38383A',
    destructive: '#FF453A',
    tint: '#0A84FF',
  },
} as const;

export type AppColors = (typeof COLORS)['light'];
```

- [ ] **Step 2: Create `context/ThemeContext.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify TypeScript passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/colors.ts context/ThemeContext.tsx
git commit -m "feat(theme): add COLORS palette and ThemeContext"
```

---

## Task 6: Wire ThemeContext and i18n into app layout

**Files:**
- Modify: `app/_layout.tsx`

Current `app/_layout.tsx` content (read before editing):
```tsx
// existing: SafeAreaProvider > StatusBar + AuthProvider > RootNavigator
```

- [ ] **Step 1: Replace `app/_layout.tsx` with the wired version**

```tsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import AuthProvider, { useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import i18n from '../lib/i18n'; // side-effect: initialises i18next on import

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
  const { session, loading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Apply saved language preference when user session loads
  useEffect(() => {
    if (!user) return;
    const lang = user.user_metadata?.settings?.language as 'en' | 'bg' | undefined;
    if (lang) void i18n.changeLanguage(lang);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(settings): wire ThemeProvider and i18n into root layout"
```

---

## Task 7: SettingsRow component

**Files:**
- Create: `components/SettingsRow.tsx`

- [ ] **Step 1: Create `components/SettingsRow.tsx`**

```tsx
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../lib/colors';

interface Props {
  label: string;
  value?: string;           // text shown on the right (e.g. "Dark")
  onPress?: () => void;     // if provided: row is tappable, shows chevron
  rightElement?: React.ReactNode; // custom right side (e.g. Switch)
  destructive?: boolean;    // renders label in red
  isLast?: boolean;         // omit bottom separator line
}

export function SettingsRow({
  label,
  value,
  onPress,
  rightElement,
  destructive = false,
  isLast = false,
}: Props) {
  const { colorScheme } = useTheme();
  const C = COLORS[colorScheme];

  const content = (
    <View style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator }]}>
      <Text style={[styles.label, { color: destructive ? C.destructive : C.text }]}>
        {label}
      </Text>
      <View style={styles.right}>
        {rightElement ?? (
          <>
            {value ? <Text style={[styles.value, { color: C.textSecondary }]}>{value}</Text> : null}
            {onPress ? <Text style={[styles.chevron, { color: C.textSecondary }]}>›</Text> : null}
          </>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
    lineHeight: 22,
    marginLeft: 2,
  },
});
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/SettingsRow.tsx
git commit -m "feat(settings): add SettingsRow component"
```

---

## Task 8: PickerSheet component

**Files:**
- Create: `components/PickerSheet.tsx`

- [ ] **Step 1: Create `components/PickerSheet.tsx`**

```tsx
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../lib/colors';

export interface PickerOption {
  label: string;
  value: string | number | null;
}

interface Props {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: string | number | null;
  onSelect: (value: string | number | null) => void;
  onClose: () => void;
}

export function PickerSheet({ visible, title, options, selected, onSelect, onClose }: Props) {
  const { colorScheme } = useTheme();
  const C = COLORS[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={[styles.sheet, { backgroundColor: C.surface, paddingBottom: insets.bottom + 8 }]}>
        <View style={[styles.header, { borderBottomColor: C.separator }]}>
          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Text style={[styles.done, { color: C.tint }]}>Done</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={options}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.option,
                index < options.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: C.separator,
                },
              ]}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, { color: C.text }]}>{item.label}</Text>
              {item.value === selected && (
                <Text style={[styles.check, { color: C.tint }]}>✓</Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  done: {
    fontSize: 16,
    fontWeight: '500',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  check: {
    fontSize: 18,
  },
});
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/PickerSheet.tsx
git commit -m "feat(settings): add PickerSheet modal component"
```

---

## Task 9: Build full Settings screen

**Files:**
- Replace: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Replace `app/(tabs)/settings.tsx` with the full implementation**

```tsx
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import { COLORS } from '../../lib/colors';
import { SettingsRow } from '../../components/SettingsRow';
import { PickerSheet, PickerOption } from '../../components/PickerSheet';
import { supabase } from '../../lib/supabase';
import { DURATION_OPTIONS } from '../../types/parking';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const LANGUAGE_OPTIONS: PickerOption[] = [
  { label: 'English', value: 'en' },
  { label: 'Български', value: 'bg' },
];

const MAP_TYPE_OPTIONS: PickerOption[] = [
  { label: 'Standard', value: 'standard' },
  { label: 'Satellite', value: 'satellite' },
  { label: 'Hybrid', value: 'hybrid' },
];

const DURATION_PICKER_OPTIONS: PickerOption[] = [
  { label: 'Always ask', value: null },
  ...DURATION_OPTIONS.map((o) => ({ label: o.label, value: o.value as number })),
];

function durationLabel(d: 30 | 60 | 120 | 180 | null): string {
  if (d === null) return 'Always ask';
  return DURATION_OPTIONS.find((o) => o.value === d)?.label ?? 'Always ask';
}

function mapTypeLabel(m: 'standard' | 'satellite' | 'hybrid'): string {
  return MAP_TYPE_OPTIONS.find((o) => o.value === m)?.label ?? 'Standard';
}

function languageLabel(l: 'en' | 'bg'): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === l)?.label ?? 'English';
}

interface ActivePicker {
  title: string;
  options: PickerOption[];
  selected: string | number | null;
  onSelect: (v: string | number | null) => void;
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const { colorScheme, themePref, setThemePref } = useTheme();
  const { settings, updateSetting } = useSettings(user);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const C = COLORS[colorScheme];

  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);
  const [cacheSize, setCacheSize] = useState('...');

  // Calculate cache size from AsyncStorage
  useEffect(() => {
    void (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        if (!keys || keys.length === 0) { setCacheSize('0 KB'); return; }
        const pairs = await AsyncStorage.multiGet(keys);
        const bytes = pairs.reduce((sum, [, v]) => sum + (v?.length ?? 0), 0);
        setCacheSize(bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`);
      } catch {
        setCacheSize('—');
      }
    })();
  }, []);

  function openPicker(picker: ActivePicker) {
    setActivePicker(picker);
  }

  function handleClearCache() {
    Alert.alert(
      t('settings.dataCache.clearCache'),
      t('settings.dataCache.clearCacheConfirm'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            // Preserve Supabase auth keys (prefixed 'sb-')
            const toDelete = keys.filter((k) => !k.startsWith('sb-'));
            if (toDelete.length > 0) await AsyncStorage.multiRemove(toDelete);
            setCacheSize('0 KB');
          },
        },
      ],
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      t('settings.account.deleteConfirmTitle'),
      t('settings.account.deleteConfirmMessage'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_user');
            if (error) {
              Alert.alert('Error', error.message);
              return;
            }
            await supabase.auth.signOut();
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.groupedBackground }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Appearance ── */}
        <SectionLabel title={t('settings.appearance.title')} colors={C} />
        <SectionGroup colors={C}>
          <View style={styles.themeRow}>
            <Text style={[styles.themeLabel, { color: C.text }]}>{t('settings.appearance.theme')}</Text>
            <View style={styles.segmented}>
              {(['light', 'dark', 'system'] as const).map((pref) => {
                const active = themePref === pref;
                const label = t(`settings.appearance.${pref}`);
                return (
                  <TouchableOpacity
                    key={pref}
                    style={[
                      styles.segment,
                      active && { backgroundColor: C.tint },
                      { borderColor: C.tint },
                    ]}
                    onPress={() => {
                      setThemePref(pref);
                      void updateSetting({ theme: pref });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentText, { color: active ? '#fff' : C.tint }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SectionGroup>

        {/* ── Language ── */}
        <SectionLabel title={t('settings.language.title')} colors={C} />
        <SectionGroup colors={C}>
          <SettingsRow
            label={t('settings.language.label')}
            value={languageLabel(settings.language)}
            onPress={() =>
              openPicker({
                title: t('settings.language.title'),
                options: LANGUAGE_OPTIONS,
                selected: settings.language,
                onSelect: (v) => void updateSetting({ language: v as 'en' | 'bg' }),
              })
            }
            isLast
          />
        </SectionGroup>

        {/* ── Map ── */}
        <SectionLabel title={t('settings.map.title')} colors={C} />
        <SectionGroup colors={C}>
          <SettingsRow
            label={t('settings.map.mapType')}
            value={mapTypeLabel(settings.mapType)}
            onPress={() =>
              openPicker({
                title: t('settings.map.mapType'),
                options: MAP_TYPE_OPTIONS,
                selected: settings.mapType,
                onSelect: (v) =>
                  void updateSetting({ mapType: v as 'standard' | 'satellite' | 'hybrid' }),
              })
            }
            isLast
          />
        </SectionGroup>

        {/* ── Parking Defaults ── */}
        <SectionLabel title={t('settings.parkingDefaults.title')} colors={C} />
        <SectionGroup colors={C}>
          <SettingsRow
            label={t('settings.parkingDefaults.defaultDuration')}
            value={durationLabel(settings.defaultDuration)}
            onPress={() =>
              openPicker({
                title: t('settings.parkingDefaults.defaultDuration'),
                options: DURATION_PICKER_OPTIONS,
                selected: settings.defaultDuration,
                onSelect: (v) =>
                  void updateSetting({ defaultDuration: v as 30 | 60 | 120 | 180 | null }),
              })
            }
          />
          <SettingsRow
            label={t('settings.parkingDefaults.distanceUnit')}
            rightElement={
              <View style={styles.segmented}>
                {(['km', 'mi'] as const).map((unit) => {
                  const active = settings.distanceUnit === unit;
                  return (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.segment,
                        active && { backgroundColor: C.tint },
                        { borderColor: C.tint },
                      ]}
                      onPress={() => void updateSetting({ distanceUnit: unit })}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.segmentText, { color: active ? '#fff' : C.tint }]}
                      >
                        {t(`settings.parkingDefaults.${unit}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            }
            isLast
          />
        </SectionGroup>

        {/* ── Notifications ── */}
        <SectionLabel title={t('settings.notifications.title')} colors={C} />
        <SectionGroup colors={C}>
          <SettingsRow
            label={t('settings.notifications.reservation')}
            rightElement={
              <Switch
                value={settings.notifications.reservation}
                onValueChange={(v) =>
                  void updateSetting({
                    notifications: { ...settings.notifications, reservation: v },
                  })
                }
                trackColor={{ true: C.tint }}
              />
            }
          />
          <SettingsRow
            label={t('settings.notifications.arrival')}
            rightElement={
              <Switch
                value={settings.notifications.arrival}
                onValueChange={(v) =>
                  void updateSetting({
                    notifications: { ...settings.notifications, arrival: v },
                  })
                }
                trackColor={{ true: C.tint }}
              />
            }
          />
          <SettingsRow
            label={t('settings.notifications.timerExpiry')}
            rightElement={
              <Switch
                value={settings.notifications.timerExpiry}
                onValueChange={(v) =>
                  void updateSetting({
                    notifications: { ...settings.notifications, timerExpiry: v },
                  })
                }
                trackColor={{ true: C.tint }}
              />
            }
            isLast
          />
        </SectionGroup>

        {/* ── Data & Cache ── */}
        <SectionLabel title={t('settings.dataCache.title')} colors={C} />
        <SectionGroup colors={C}>
          <SettingsRow label={t('settings.dataCache.storageUsed')} value={cacheSize} />
          <SettingsRow
            label={t('settings.dataCache.clearCache')}
            onPress={handleClearCache}
            destructive
            isLast
          />
        </SectionGroup>

        {/* ── About ── */}
        <SectionLabel title={t('settings.about.title')} colors={C} />
        <SectionGroup colors={C}>
          <SettingsRow label={t('settings.about.version')} value={APP_VERSION} />
          <SettingsRow
            label={t('settings.about.privacyPolicy')}
            onPress={() =>
              void WebBrowser.openBrowserAsync('https://parkingo.app/privacy')
            }
          />
          <SettingsRow
            label={t('settings.about.terms')}
            onPress={() =>
              void WebBrowser.openBrowserAsync('https://parkingo.app/terms')
            }
          />
          <SettingsRow
            label={t('settings.about.licenses')}
            onPress={() => Alert.alert('Licenses', 'expo (MIT), react-native (MIT), react-i18next (MIT), supabase-js (MIT)')}
            isLast
          />
        </SectionGroup>

        {/* ── Account ── */}
        <SectionLabel title={t('settings.account.title')} colors={C} />
        <SectionGroup colors={C}>
          <SettingsRow
            label={t('settings.account.deleteAccount')}
            onPress={handleDeleteAccount}
            destructive
            isLast
          />
        </SectionGroup>
      </ScrollView>

      <PickerSheet
        visible={activePicker !== null}
        title={activePicker?.title ?? ''}
        options={activePicker?.options ?? []}
        selected={activePicker?.selected ?? null}
        onSelect={(v) => activePicker?.onSelect(v)}
        onClose={() => setActivePicker(null)}
      />
    </View>
  );
}

// ── Local helper components ───────────────────────────────────────────────────

function SectionLabel({ title, colors }: { title: string; colors: typeof COLORS['light'] }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
      {title.toUpperCase()}
    </Text>
  );
}

function SectionGroup({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: typeof COLORS['light'];
}) {
  return (
    <View
      style={[
        styles.group,
        { backgroundColor: colors.surface, borderColor: colors.separator },
      ]}
    >
      {children}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  group: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  themeRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  themeLabel: {
    fontSize: 16,
  },
  segmented: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Start the app and verify the Settings screen renders**

```bash
npx expo start
```

Open on iOS simulator. Navigate to the Settings tab. Verify:
- All 8 sections render with correct labels
- Tapping Language/Map Type/Duration opens a PickerSheet
- Theme segmented control switches light/dark/system
- Notification switches toggle
- Clearing cache shows confirmation alert

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/settings.tsx
git commit -m "feat(settings): build full Settings screen with all sections"
```

---

## Task 10: Supabase delete_user SQL function

**Files:**
- Create: `supabase/delete_user.sql`

This is a server-side function that allows a user to delete their own account. Run this SQL in the Supabase SQL editor (Dashboard → SQL Editor → New query).

- [ ] **Step 1: Create `supabase/delete_user.sql`**

```sql
-- RPC function: allows the calling authenticated user to delete their own account.
-- Called client-side via supabase.rpc('delete_user').
-- Uses SECURITY DEFINER to access auth.users, but checks auth.uid() to ensure
-- a user can only delete themselves.
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only delete if the calling user matches
  delete from auth.users where id = auth.uid();
end;
$$;

-- Grant execute to authenticated users only
revoke execute on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated;
```

- [ ] **Step 2: Run the SQL in Supabase**

Go to Supabase Dashboard → SQL Editor → paste the contents of `supabase/delete_user.sql` → click Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Commit the SQL file**

```bash
git add supabase/delete_user.sql
git commit -m "feat(settings): add delete_user Supabase RPC function"
```

---

## Task 11: Wire mapType and defaultDuration into the map screen

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Read the current `app/(tabs)/index.tsx`** (already done — confirmed structure)

The file uses `MapView` with no `mapType` prop and always shows the duration picker alert.

- [ ] **Step 2: Add `useSettings` to MapScreen and pass `mapType` to MapView**

In `app/(tabs)/index.tsx`, add these changes:

**Add import** (after the existing `useAuth` import):
```tsx
import { useSettings } from '../../hooks/useSettings';
```

**Add hook call** inside `MapScreen` (after the `useParking` line):
```tsx
const { settings } = useSettings(user);
```

**Add `mapType` prop to `MapView`** (around line 287):
```tsx
<MapView
  ref={mapRef}
  style={styles.map}
  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
  initialRegion={VARNA_REGION}
  mapType={settings.mapType}
  showsUserLocation={locationGranted}
  showsMyLocationButton={locationGranted}
  showsCompass
  showsScale
  showsTraffic
  onPress={handleMapPress}
>
```

- [ ] **Step 3: Apply defaultDuration shortcut in the `onArrival` callback**

In the `onArrival` callback inside `useReservation` (around line 151 in index.tsx), the current code shows an Alert with duration options for zone spots. Modify the `onArrival` handler to skip the picker when `settings.defaultDuration` is set:

Replace the `onArrival` callback:
```tsx
onArrival: (spot, doConfirmParking, isActive) => {
  // If user has a default duration set, skip the picker
  if (settings.defaultDuration !== null && spot.zoneType !== 'none') {
    if (!isActive()) return;
    doConfirmParking();
    void parkSpot(spot.id, settings.defaultDuration);
    setSelectedSpot(spot);
    return;
  }

  if (spot.zoneType !== 'none') {
    Alert.alert(
      `You've arrived at ${spot.streetName}`,
      'How long are you parking?',
      [
        ...DURATION_OPTIONS.map(({ label, value }: { label: string; value: ParkingDuration | null }) => ({
          text: label,
          onPress: () => {
            if (!isActive()) return;
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
            if (!isActive()) return;
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
```

- [ ] **Step 4: Verify TypeScript passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Start the app and verify mapType switches**

```bash
npx expo start
```

1. Open Settings → Map → Map Type → select "Satellite" → go back to Map tab. Verify the map renders in satellite view.
2. Switch back to "Standard". Verify map returns to standard view.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat(settings): apply mapType and defaultDuration from settings in map screen"
```
