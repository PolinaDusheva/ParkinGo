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

function formatTimeLeft(isoString: string | null): string | null {
  if (!isoString) return null;
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const totalMin = Math.ceil(diffMs / 60_000);
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
  }
  return `${totalMin} min left`;
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
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(spot.expectedFreeAt));

  useEffect(() => {
    setTimeLeft(formatTimeLeft(spot.expectedFreeAt));
    if (!spot.expectedFreeAt) return;
    const id = setInterval(() => setTimeLeft(formatTimeLeft(spot.expectedFreeAt)), 60_000);
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
      onDismiss();
    }
  }

  function handleDurationSelect(duration: ParkingDuration) {
    onPark(spot.id, duration);
    onDismiss();
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

      {/* Status */}
      {isFree && <Text style={styles.statusFree}>Free</Text>}
      {isOwnSpot && <Text style={styles.statusOwn}>You're parked here</Text>}
      {isOtherSpot && <Text style={styles.statusTaken}>Occupied</Text>}
      {isReserved && <Text style={styles.statusReserved}>Reserved</Text>}

      {/* Timer info */}
      {isOwnSpot && timeLeft && (
        <Text style={styles.timerOwn}>{timeLeft}</Text>
      )}
      {isOwnSpot && !timeLeft && spot.occupiedAt && (
        <Text style={styles.timerHint}>Parked since {formatClock(spot.occupiedAt)}</Text>
      )}
      {isOtherSpot && timeLeft && (
        <Text style={styles.timerOther}>Expected free in {timeLeft}</Text>
      )}
      {isOtherSpot && !timeLeft && spot.occupiedAt && (
        <Text style={styles.timerHint}>Parked since {formatClock(spot.occupiedAt)}</Text>
      )}

      {/* Duration picker (inline, shown after tapping "I'm parking here" on a zone spot) */}
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
  timerOwn: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
