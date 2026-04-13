import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { UserProfile } from '../hooks/useProfile';

const AVATAR_COLORS = [
  '#4A90D9', '#34C759', '#FF9500', '#FF3B30',
  '#AF52DE', '#FF2D55', '#5AC8FA', '#FFCC00',
];

interface Props {
  visible: boolean;
  profile: UserProfile;
  saving: boolean;
  onSave: (updates: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'avatarColor'>>) => Promise<unknown>;
  onClose: () => void;
}

export function EditProfileModal({ visible, profile, saving, onSave, onClose }: Props) {
  const [name, setName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [color, setColor] = useState(profile.avatarColor);

  async function handleSave() {
    await onSave({ displayName: name, bio, avatarColor: color });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          {saving ? (
            <ActivityIndicator color="#4A90D9" />
          ) : (
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* Avatar preview + color picker */}
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: color }]}>
              <Text style={styles.avatarText}>
                {(name || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.colorGrid}>
              {AVATAR_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#C7C7CC"
            maxLength={40}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="A short bio..."
            placeholderTextColor="#C7C7CC"
            multiline
            maxLength={120}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#000' },
  cancel: { fontSize: 17, color: '#8E8E93' },
  save: { fontSize: 17, color: '#4A90D9', fontWeight: '600' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: '700' },
  colorGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
