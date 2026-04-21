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
