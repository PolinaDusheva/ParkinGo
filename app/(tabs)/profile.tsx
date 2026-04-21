import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useProfile, ParkingSession } from '../../hooks/useProfile';
import { EditProfileModal } from '../../components/EditProfileModal';
import { AddPlateModal } from '../../components/AddPlateModal';
import { SubscriptionModal } from '../../components/SubscriptionModal';

const ZONE_COLOR: Record<ParkingSession['zone'], string> = {
  blue: '#007AFF',
  green: '#34C759',
  none: '#8E8E93',
};

const ZONE_LABEL: Record<ParkingSession['zone'], string> = {
  blue: 'Blue Zone',
  green: 'Green Zone',
  none: 'Free Zone',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { profile, sessions, saving, updateProfile, addPlate, removePlate } = useProfile(user);
  const [editVisible, setEditVisible] = useState(false);
  const [platesVisible, setPlatesVisible] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [paymentAdded, setPaymentAdded] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => { await supabase.auth.signOut(); },
      },
    ]);
  }

  const avatarLetter = (profile.displayName || user?.email || '?')[0].toUpperCase();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>

        {/* Identity */}
        <Text style={styles.name}>{profile.displayName || 'Driver'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <TouchableOpacity onPress={() => setEditVisible(true)} style={styles.editLink}>
          <Text style={styles.editLinkText}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Payment card */}
        <Text style={styles.sectionTitle}>Wallet</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentCardTop}>
            <Text style={styles.paymentCardLabel}>Balance</Text>
            <View style={styles.paymentChip} />
          </View>
          <Text style={styles.paymentBalance}>0.00 €</Text>
          {paymentAdded ? (
            <Text style={styles.paymentCardNumber}>•••• •••• •••• 4242</Text>
          ) : (
            <Text style={styles.paymentCardNone}>No payment method linked</Text>
          )}
          <View style={styles.paymentCardBottom}>
            <Text style={styles.paymentCardBrand}>ParkinGo Pay</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => setPaymentAdded((v) => !v)}
        >
          <Text style={styles.paymentButtonText}>
            {paymentAdded ? 'Modify payment' : 'Add payment method'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Parking sessions */}
        <Text style={styles.sectionTitle}>Parking Sessions</Text>
        <View style={styles.sessionsCard}>
          {sessions.length === 0 ? (
            <Text style={styles.empty}>No parking sessions yet.</Text>
          ) : (
            <>
              {(showAllSessions ? sessions : sessions.slice(0, 4)).map((s) => (
                <View key={s.id} style={styles.sessionCard}>
                  <View style={[styles.zoneDot, { backgroundColor: ZONE_COLOR[s.zone] }]} />
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionStreet}>{s.streetName}</Text>
                    <Text style={styles.sessionMeta}>
                      {ZONE_LABEL[s.zone]} · {formatDuration(s.durationMinutes)}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {formatDate(s.startedAt)} · {formatTime(s.startedAt)} – {formatTime(s.endedAt)}
                    </Text>
                  </View>
                </View>
              ))}
              {sessions.length > 4 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllSessions((v) => !v)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllSessions ? 'Show less' : `More (${sessions.length - 4})`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Spacer so FAB doesn't overlap last item */}
        <View style={{ height: 88 }} />
      </ScrollView>

      {/* FAB — add/manage car plates */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => setPlatesVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>P+</Text>
      </TouchableOpacity>

      <EditProfileModal
        visible={editVisible}
        profile={profile}
        saving={saving}
        onSave={updateProfile}
        onClose={() => setEditVisible(false)}
      />

      <AddPlateModal
        visible={platesVisible}
        plates={profile.plates}
        saving={saving}
        onAdd={addPlate}
        onRemove={removePlate}
        onClose={() => setPlatesVisible(false)}
      />

      <SubscriptionModal
        visible={showSubscription}
        onClose={() => setShowSubscription(false)}
      />

      {/* Crown button — top-left */}
      <TouchableOpacity
        style={[styles.crownButton, { top: insets.top + 12 }]}
        onPress={() => setShowSubscription(true)}
        activeOpacity={0.8}
      >
        <Image source={require('../../assets/crown.png')} style={styles.crownImage} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { alignItems: 'center', paddingHorizontal: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#000' },
  email: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  bio: { fontSize: 14, color: '#3C3C43', marginTop: 8, textAlign: 'center' },
  editLink: { marginTop: 10 },
  editLinkText: { color: '#6C63FF', fontSize: 15, fontWeight: '500' },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 24,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  empty: { color: '#8E8E93', fontSize: 15, marginBottom: 12 },
  sessionsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    gap: 12,
  },
  zoneDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  sessionInfo: { flex: 1 },
  sessionStreet: { fontSize: 15, fontWeight: '600', color: '#000' },
  sessionMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  sessionDate: { fontSize: 12, color: '#C7C7CC', marginTop: 2 },
  paymentCard: {
    width: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  paymentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paymentChip: {
    width: 32,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  paymentBalance: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  paymentCardNumber: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2,
    fontWeight: '500',
  },
  paymentCardNone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  paymentCardBottom: {
    marginTop: 24,
    alignItems: 'flex-end',
  },
  paymentCardBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  paymentButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6C63FF',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C63FF',
  },
  showMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
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
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  crownButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
    zIndex: 10,
  },
  crownImage: {
    width: 32,
    height: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
