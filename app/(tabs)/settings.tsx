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
import { COLORS, AppColors } from '../../lib/colors';
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

function SectionLabel({ title, colors }: { title: string; colors: AppColors }) {
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
  colors: AppColors;
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
