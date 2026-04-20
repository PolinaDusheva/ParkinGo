import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { POI, POIType } from '../types/parking';

interface Props {
  poi: POI;
  onDismiss: () => void;
}

const POI_COLORS: Record<POIType, string> = {
  garage: '#007AFF',
  private_lot: '#FF9500',
  ev_charging: '#34C759',
};

const POI_LABELS: Record<POIType, string> = {
  garage: 'Official Garage',
  private_lot: 'Private Lot',
  ev_charging: 'EV Charging',
};

export function POIDetail({ poi, onDismiss }: Props) {
  const color = POI_COLORS[poi.poiType];
  const label = POI_LABELS[poi.poiType];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name}>{poi.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.typeLabel, { color }]}>{label}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Details */}
      {poi.address ? (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Address</Text>
          <Text style={styles.rowValue}>{poi.address}</Text>
        </View>
      ) : null}

      {poi.capacity ? (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Capacity</Text>
          <Text style={styles.rowValue}>{poi.capacity} spots</Text>
        </View>
      ) : null}

      {poi.operatingHours ? (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Hours</Text>
          <Text style={styles.rowValue}>{poi.operatingHours}</Text>
        </View>
      ) : null}

      {poi.priceInfo ? (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Pricing</Text>
          <Text style={styles.rowValue}>{poi.priceInfo}</Text>
        </View>
      ) : null}
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
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  dismiss: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: '#8E8E93',
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 14,
    color: '#1C1C1E',
    textAlign: 'right',
    flex: 1,
  },
});
