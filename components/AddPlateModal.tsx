import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';

interface Props {
  visible: boolean;
  plates: string[];
  saving: boolean;
  onAdd: (plate: string) => Promise<unknown>;
  onRemove: (plate: string) => Promise<unknown>;
  onClose: () => void;
}

export function AddPlateModal({ visible, plates, saving, onAdd, onRemove, onClose }: Props) {
  const [input, setInput] = useState('');

  async function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setInput('');
  }

  function confirmRemove(plate: string) {
    Alert.alert('Remove Plate', `Remove ${plate}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(plate) },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>My Cars</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="e.g. B1234AB"
              placeholderTextColor="#C7C7CC"
              autoCapitalize="characters"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            {saving ? (
              <ActivityIndicator color="#4A90D9" style={styles.addBtn} />
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {plates.length === 0 ? (
            <Text style={styles.empty}>No plates added yet.</Text>
          ) : (
            <FlatList
              data={plates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View style={styles.plateRow}>
                  <View style={styles.plateBadge}>
                    <Text style={styles.plateText}>{item}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmRemove(item)}>
                    <Text style={styles.remove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
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
  headerSpacer: { width: 40 },
  title: { fontSize: 17, fontWeight: '600', color: '#000' },
  done: { fontSize: 17, color: '#4A90D9', fontWeight: '600' },
  body: { flex: 1, padding: 24 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  addBtn: {
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  plateBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  plateText: { fontSize: 16, fontWeight: '700', color: '#000', letterSpacing: 1.5 },
  remove: { color: '#FF3B30', fontSize: 15, fontWeight: '500' },
  empty: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontSize: 15 },
});
