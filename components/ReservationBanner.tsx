import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spot } from '../types/parking';

interface Props {
  navigationTarget: Spot | null;
  distanceToTarget: number | null;
  reservationActive: boolean;
  onCancel: () => void;
}

export function ReservationBanner({
  navigationTarget,
  distanceToTarget,
  reservationActive,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();

  if (!navigationTarget) return null;

  const distanceText = distanceToTarget !== null ? ` — ${distanceToTarget}m` : '';
  const message = reservationActive
    ? `Spot reserved on ${navigationTarget.streetName}${distanceText}`
    : `Navigating to ${navigationTarget.streetName}${distanceText}`;

  const bannerColor = reservationActive ? '#6C63FF' : '#1C1C1E';

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8, backgroundColor: bannerColor }]}>
      <Text style={styles.message} numberOfLines={1}>
        {message}
      </Text>
      <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cancelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
