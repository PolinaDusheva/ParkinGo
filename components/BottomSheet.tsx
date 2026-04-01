import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children?: React.ReactNode;
}

export function BottomSheet({ children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.handle} />
      {children ?? (
        <Text style={styles.hint}>Tap a parking spot to see details</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 80,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingBottom: 4,
  },
});
