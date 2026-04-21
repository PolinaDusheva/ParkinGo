# Feature 9: Settings Screen — Design Spec

**Date:** 2026-04-21  
**Status:** Approved

---

## Overview

A dedicated Settings screen giving users control over appearance, language, map behaviour, parking defaults, notifications, data, and account management. All preferences sync to Supabase `user_metadata` so they follow the user across devices. Premium features live in the Profile screen, not here.

---

## User Flow

1. User taps the **Settings** tab (bottom nav).
2. A single scrollable screen renders, grouped by section.
3. Simple toggles and segmented controls operate inline.
4. Complex choices (Language, Map Type, Default Duration) open a **bottom sheet picker** — re-using the existing `BottomSheet` component.
5. Changes are saved **optimistically**: local state updates immediately, Supabase sync happens in the background.
6. Destructive actions (Clear Cache, Delete Account) show a confirmation alert before proceeding.

---

## Screen Structure

| Section | Item | Control |
|---|---|---|
| **Appearance** | Theme | Segmented control: Light / Dark / System |
| **Language** | Language | Row → bottom sheet picker: English / Bulgarian |
| **Map** | Map Type | Row → bottom sheet picker: Standard / Satellite / Hybrid |
| **Parking Defaults** | Default Duration | Row → bottom sheet picker: 30 min / 1h / 2h / 3h / Always ask |
| **Parking Defaults** | Distance Units | Inline toggle: km / mi |
| **Notifications** | Reservation alerts | Switch |
| **Notifications** | Arrival alerts | Switch |
| **Notifications** | Timer expiry alerts | Switch |
| **Data & Cache** | Storage used | Read-only label |
| **Data & Cache** | Clear cache | Destructive button + confirmation alert |
| **About** | App version | Read-only label |
| **About** | Privacy Policy | Row → opens `expo-web-browser` |
| **About** | Terms of Service | Row → opens `expo-web-browser` |
| **About** | Open-source licenses | Row → sub-screen (flat list of licenses) |
| **Account** | Delete Account | Destructive button + confirmation alert |

---

## Architecture

### New files

| File | Purpose |
|---|---|
| `hooks/useSettings.ts` | Read/write settings from Supabase `user_metadata`; exposes `settings` + `updateSetting()` |
| `context/ThemeContext.tsx` | Provides `theme` + `colorScheme` to the whole app based on settings |
| `lib/i18n.ts` | Initialises react-i18next with `en` and `bg` resources |
| `locales/en.json` | English translation strings (Settings screen first) |
| `locales/bg.json` | Bulgarian translation strings (Settings screen first) |
| `components/SettingsRow.tsx` | Reusable row: label + optional value + chevron, used for picker rows and nav rows |
| `components/PickerSheet.tsx` | Generic bottom sheet picker: title + list of `{label, value}` options |

### Changed files

| File | Change |
|---|---|
| `app/(tabs)/settings.tsx` | Replace stub with full Settings screen |
| `app/_layout.tsx` | Wrap app in `ThemeProvider` and call `i18n` init |
| `app/(tabs)/index.tsx` | Read `mapType` from settings and pass to `MapView` `mapType` prop |
| `context/AuthContext.tsx` | On auth state change, load settings into `useSettings` |

---

## Data Model

Settings are stored as a nested object inside Supabase `user_metadata`, alongside existing fields (`name`, `avatar_color`, `bio`, `plates`):

```ts
// Added to user_metadata
settings: {
  theme: 'light' | 'dark' | 'system';           // default: 'system'
  language: 'en' | 'bg';                         // default: 'en'
  mapType: 'standard' | 'satellite' | 'hybrid';  // default: 'standard'
  defaultDuration: 30 | 60 | 120 | 180 | null;   // null = always ask
  distanceUnit: 'km' | 'mi';                     // default: 'km'
  notifications: {
    reservation: boolean;   // default: true
    arrival: boolean;       // default: true
    timerExpiry: boolean;   // default: true
  };
}
```

`useSettings()` reads from `user?.user_metadata.settings` on mount and merges with defaults for any missing keys. `updateSetting(path, value)` does an optimistic local update, then calls `supabase.auth.updateUser({ data: { settings: merged } })`.

---

## `useSettings` Hook

```ts
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'bg';
  mapType: 'standard' | 'satellite' | 'hybrid';
  defaultDuration: 30 | 60 | 120 | 180 | null;
  distanceUnit: 'km' | 'mi';
  notifications: {
    reservation: boolean;
    arrival: boolean;
    timerExpiry: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  mapType: 'standard',
  defaultDuration: null,
  distanceUnit: 'km',
  notifications: { reservation: true, arrival: true, timerExpiry: true },
};

// API
const { settings, updateSetting, loading } = useSettings();
await updateSetting('theme', 'dark');
await updateSetting('notifications.reservation', false);
```

---

## Theme System

`ThemeContext` reads `settings.theme`:
- `'system'` → uses `Appearance.getColorScheme()` + listens to `Appearance.addChangeListener`
- `'light'` / `'dark'` → ignores device setting

Exposes `colorScheme: 'light' | 'dark'` to the app. Components read colors from a `COLORS` object keyed by `colorScheme` (e.g. `COLORS[colorScheme].background`). No third-party theming library — plain React context.

---

## i18n Architecture

Library: `react-i18next` + `expo-localization`.

- `lib/i18n.ts` initialises i18next with `en` and `bg` resources.
- On app boot, `settings.language` from Supabase calls `i18n.changeLanguage()`.
- **Phase 1:** Only `settings.*` keys are translated. All other screens use hardcoded strings — untranslated keys fall back to the key string, so nothing breaks.
- Strings follow namespace pattern: `t('settings.appearance.theme')`.

```json
// locales/en.json (sample)
{
  "settings": {
    "title": "Settings",
    "appearance": { "title": "Appearance", "theme": "Theme" },
    "language": { "title": "Language", "en": "English", "bg": "Bulgarian" },
    "map": { "title": "Map", "mapType": "Map Type",
             "standard": "Standard", "satellite": "Satellite", "hybrid": "Hybrid" },
    "parkingDefaults": { "title": "Parking Defaults",
                         "defaultDuration": "Default Duration", "distanceUnit": "Distance Units",
                         "alwaysAsk": "Always ask" },
    "notifications": { "title": "Notifications", "reservation": "Reservation alerts",
                        "arrival": "Arrival alerts", "timerExpiry": "Timer expiry alerts" },
    "dataCache": { "title": "Data & Cache", "storageUsed": "Storage used",
                   "clearCache": "Clear Cache", "clearCacheConfirm": "Clear cached map tiles?" },
    "about": { "title": "About", "version": "Version",
               "privacyPolicy": "Privacy Policy", "terms": "Terms of Service", "licenses": "Licenses" },
    "account": { "title": "Account", "deleteAccount": "Delete Account",
                 "deleteConfirm": "This will permanently delete your account and all data." }
  }
}
```

---

## Map Type Integration

`MapView` in `app/(tabs)/index.tsx` accepts a `mapType` prop:

```tsx
<MapView
  mapType={settings.mapType}   // 'standard' | 'satellite' | 'hybrid'
  ...
/>
```

`react-native-maps` supports these values natively on both iOS (Apple Maps) and Android (Google Maps).

---

## Default Duration Integration

When `settings.defaultDuration !== null`, the zone duration alert in `index.tsx` skips showing the picker and immediately calls `parkSpot(spot.id, settings.defaultDuration)`. When `null`, the existing picker alert fires as today.

---

## Edge Cases

| Case | Handling |
|---|---|
| User not logged in (unauthenticated) | Settings screen shows but uses DEFAULT_SETTINGS; changes are not persisted (no user to write to) |
| Supabase sync fails | Optimistic update stays in local state; silent retry on next `updateSetting` call |
| `user_metadata.settings` is undefined (new user) | `useSettings` merges with DEFAULT_SETTINGS, writes defaults on first update |
| Delete Account | Calls `supabase.rpc('delete_user')` (a Postgres function that deletes `auth.users` row for the calling user — requires creating this function in Supabase), then signs out and navigates to auth screen. Do NOT use `supabase.auth.admin.deleteUser` — that requires the service role key which must never be in client code. |
| Clear Cache | Clears AsyncStorage keys prefixed with `mapTile_`; shows storage reclaimed in a toast |

---

## Out of Scope

- Premium tier settings (go in Profile screen — Feature 9 in TASKS.md)
- Push notification scheduling (managed by `expo-notifications` in `useReservation`, not Settings)
- Per-spot notification overrides
- Translation of non-Settings screens (Phase 2)
