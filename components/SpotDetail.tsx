import { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Spot, ParkingDuration, DURATION_OPTIONS, ZoneType } from '../types/parking';

interface Props {
  spot: Spot;
  currentUserId: string | null;
  onPark: (spotId: string, duration: ParkingDuration | null) => void;
  onLeave: (spotId: string) => void;
  onDismiss: () => void;
}

// Returns "HH:MM:SS" or "MM:SS" — updates every second
function formatCountdown(isoString: string | null): string | null {
  if (!isoString) return null;
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const totalSec = Math.ceil(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatClock(isoString: string | null): string | null {
  if (!isoString) return null;
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ZONE_COLORS: Record<ZoneType, string> = {
  none: '#8E8E93',
  blue: '#007AFF',
  green: '#34C759',
};

const ZONE_LABELS: Record<ZoneType, string> = {
  none: 'No zone',
  blue: 'Blue zone',
  green: 'Green zone',
};

export function SpotDetail({ spot, currentUserId, onPark, onLeave, onDismiss }: Props) {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [countdown, setCountdown] = useState(() => formatCountdown(spot.expectedFreeAt));

  // Reset duration picker when spot status changes (e.g. after parking)
  useEffect(() => {
    setShowDurationPicker(false);
  }, [spot.status]);

  // Second-precision countdown tick
  useEffect(() => {
    setCountdown(formatCountdown(spot.expectedFreeAt));
    if (!spot.expectedFreeAt) return;
    const id = setInterval(() => setCountdown(formatCountdown(spot.expectedFreeAt)), 1000);
    return () => clearInterval(id);
  }, [spot.expectedFreeAt]);

  const isOwnSpot = spot.status === 'occupied' && spot.occupiedBy === currentUserId;
  const isOtherSpot = spot.status === 'occupied' && spot.occupiedBy !== currentUserId;
  const isReserved = spot.status === 'reserved';
  const isFree = spot.status === 'free';

  function handleParkPress() {
    if (spot.zoneType !== 'none') {
      setShowDurationPicker(true);
    } else {
      onPark(spot.id, null);
      // Sheet stays open — shows "You're parked here"
    }
  }

  function handleDurationSelect(duration: ParkingDuration) {
    onPark(spot.id, duration);
    // Sheet stays open — sync effect in MapScreen will update spot to show countdown
  }

  function handleLeavePress() {
    Alert.alert(
      'Leave this spot?',
      'The spot will be marked as free for other drivers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave parking',
          style: 'destructive',
          onPress: () => {
            onLeave(spot.id);
            onDismiss();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.streetName}>{spot.streetName}</Text>
          <View style={[styles.zoneBadge, { backgroundColor: ZONE_COLORS[spot.zoneType] + '20' }]}>
            <Text style={[styles.zoneLabel, { color: ZONE_COLORS[spot.zoneType] }]}>
              {ZONE_LABELS[spot.zoneType]}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Status label */}
      {isFree && <Text style={styles.statusFree}>Free</Text>}
      {isOwnSpot && <Text style={styles.statusOwn}>You're parked here</Text>}
      {isOtherSpot && <Text style={styles.statusTaken}>Occupied</Text>}
      {isReserved && <Text style={styles.statusReserved}>Reserved</Text>}

      {/* Countdown for own spot with a timer */}
      {isOwnSpot && spot.expectedFreeAt && countdown && (
        <View style={styles.countdownBox}>
          <Text style={styles.countdownLabel}>Time remaining</Text>
          <Text style={styles.countdownValue}>{countdown}</Text>
        </View>
      )}

      {/* No-timer own spot: show parked-since time */}
      {isOwnSpot && !spot.expectedFreeAt && spot.occupiedAt && (
        <Text style={styles.timerHint}>Parked since {formatClock(spot.occupiedAt)}</Text>
      )}

      {/* Other driver's spot */}
      {isOtherSpot && countdown && (
        <Text style={styles.timerOther}>Expected free in {countdown}</Text>
      )}
      {isOtherSpot && !countdown && spot.occupiedAt && (
        <Text style={styles.timerHint}>Parked since {formatClock(spot.occupiedAt)}</Text>
      )}

      {/* Duration picker */}
      {showDurationPicker && (
        <View>
          <Text style={styles.durationPrompt}>How long are you parking?</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map(({ label, value }) => (
              <TouchableOpacity
                key={value}
                style={styles.durationChip}
                onPress={() => handleDurationSelect(value)}
              >
                <Text style={styles.durationChipText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      {isFree && !showDurationPicker && (
        <TouchableOpacity style={styles.primaryButton} onPress={handleParkPress}>
          <Text style={styles.primaryButtonText}>I'm parking here</Text>
        </TouchableOpacity>
      )}

      {isOwnSpot && (
        <TouchableOpacity style={styles.destructiveButton} onPress={handleLeavePress}>
          <Text style={styles.destructiveButtonText}>Leave parking</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  streetName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  zoneBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zoneLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  dismiss: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8,
  },
  statusFree: {
    fontSize: 15,
    color: '#34C759',
    fontWeight: '500',
  },
  statusOwn: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  statusTaken: {
    fontSize: 15,
    color: '#8E8E93',
  },
  statusReserved: {
    fontSize: 15,
    color: '#FF9500',
    fontWeight: '500',
  },
  countdownBox: {
    backgroundColor: '#007AFF10',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#007AFF',
    fontVariant: ['tabular-nums'],
  },
  timerOther: {
    fontSize: 14,
    color: '#8E8E93',
  },
  timerHint: {
    fontSize: 13,
    color: '#AEAEB2',
  },
  durationPrompt: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 8,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30' + '15',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  destructiveButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
