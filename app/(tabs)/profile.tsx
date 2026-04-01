import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const displayName = user?.user_metadata?.display_name as string | undefined;

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          // AuthContext update → root layout redirects to login
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(displayName ?? user?.email ?? '?')[0].toUpperCase()}
        </Text>
      </View>

      <Text style={styles.name}>{displayName ?? 'Driver'}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#000' },
  email: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 24,
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});
