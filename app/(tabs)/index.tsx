import MapView, { Marker, Polygon, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { BottomSheet } from '../../components/BottomSheet';
import { SpotDetail } from '../../components/SpotDetail';
import { POIDetail } from '../../components/POIDetail';
import { ReservationBanner } from '../../components/ReservationBanner';
import { useParking } from '../../hooks/useParking';
import { usePOIs } from '../../hooks/usePOIs';
import { useReservation } from '../../hooks/useReservation';
import { useAuth } from '../../context/AuthContext';
import { Spot, POI, POIType, DURATION_OPTIONS, ParkingDuration } from '../../types/parking';
import { BLUE_ZONE_POLYGONS } from '../../lib/zones';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBZ6_IwKvnINioda3w7s-DRNQZHLv-V2M0';

// Haversine distance in metres between two lat/lng points
function distanceMetres(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const NEARBY_THRESHOLD_M = 10;

const VARNA_REGION = {
  latitude: 43.2141,
  longitude: 27.9147,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const STATUS_FILL: Record<Spot['status'], string> = {
  free: '#34C759',
  occupied: '#FF3B30',
  reserved: '#007AFF',
};

const ZONE_BORDER: Record<Spot['zoneType'], string> = {
  none: 'transparent',
  blue: '#007AFF',
  green: '#34C759',
};

function SpotMarker({ spot }: { spot: Spot }) {
  const hasBorder = spot.zoneType !== 'none';
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: STATUS_FILL[spot.status],
        borderWidth: hasBorder ? 3 : 0,
        borderColor: ZONE_BORDER[spot.zoneType],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 2,
        elevation: 4,
      }}
    />
  );
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  const { user } = useAuth();
  const { spots, spotsLoading, parkSpot, leaveSpot, reserveSpot, cancelReservation } = useParking(user?.id ?? null);

  const { pois } = usePOIs();

  const {
    navigationTarget,
    distanceToTarget,
    reservationActive,
    userLocation,
    startNavigation,
    cancelNavigation,
    confirmParking,
  } = useReservation({
    currentUserId: user?.id ?? null,
    spots,
    reserveSpot,
    cancelReservation,
    onArrival: (spot, doConfirmParking, isActive) => {
      if (spot.zoneType !== 'none') {
        Alert.alert(
          `You've arrived at ${spot.streetName}`,
          'How long are you parking?',
          [
            ...DURATION_OPTIONS.map(({ label, value }: { label: string; value: ParkingDuration | null }) => ({
              text: label,
              onPress: () => {
                if (!isActive()) return;
                doConfirmParking();
                void parkSpot(spot.id, value);
                setSelectedSpot(spot);
              },
            })),
            { text: 'Not now', style: 'cancel' as const },
          ],
        );
      } else {
        Alert.alert(
          `You've arrived at ${spot.streetName}`,
          'Tap to confirm parking.',
          [
            {
              text: 'Park here',
              onPress: () => {
                if (!isActive()) return;
                doConfirmParking();
                void parkSpot(spot.id, null);
                setSelectedSpot(spot);
              },
            },
            { text: 'Not now', style: 'cancel' as const },
          ],
        );
      }
    },
    onSpotTaken: () => {
      Alert.alert('Spot Taken', 'This spot was just taken by another driver.');
    },
  });

  // Keep selectedSpot in sync when the spots array updates (e.g. after parking)
  useEffect(() => {
    if (!selectedSpot) return;
    const updated = spots.find((s) => s.id === selectedSpot.id);
    if (updated) setSelectedSpot(updated);
  }, [spots]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationGranted(true);
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = location.coords;

        mapRef.current?.animateToRegion(
          { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          800,
        );

        // Suggest parking if user is standing next to a free spot
        if (user) {
          const nearby = spots.find(
            (s) =>
              s.status === 'free' &&
              distanceMetres(latitude, longitude, s.lat, s.lng) <= NEARBY_THRESHOLD_M,
          );
          if (nearby) {
            Alert.alert(
              'Are you parking here?',
              `Free spot on ${nearby.streetName}`,
              [
                { text: 'Not now', style: 'cancel' },
                { text: 'Yes, park here', onPress: () => setSelectedSpot(nearby) },
              ],
            );
          }
        }
      }
      setLoading(false);
    })();
    // spots intentionally excluded — we only want this check once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={VARNA_REGION}
        showsUserLocation={locationGranted}
        showsMyLocationButton={locationGranted}
        showsCompass
        showsScale
        showsTraffic
        onPress={() => setSelectedSpot(null)}
      >
        {BLUE_ZONE_POLYGONS.map((zone) => (
          <Polygon
            key={zone.id}
            coordinates={zone.coordinates}
            strokeColor="rgba(0, 122, 255, 0.6)"
            fillColor="rgba(0, 122, 255, 0.08)"
            strokeWidth={1.5}
          />
        ))}

        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.lat, longitude: spot.lng }}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedSpot(spot);
            }}
            tracksViewChanges={false}
          >
            <SpotMarker spot={spot} />
          </Marker>
        ))}

        {navigationTarget && userLocation && !reservationActive && (
          <MapViewDirections
            origin={userLocation}
            destination={{ latitude: navigationTarget.lat, longitude: navigationTarget.lng }}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={3}
            strokeColor="#007AFF"
            lineDashPattern={[5, 5]}
            mode="DRIVING"
          />
        )}
      </MapView>

      <ReservationBanner
        navigationTarget={navigationTarget}
        distanceToTarget={distanceToTarget}
        reservationActive={reservationActive}
        onCancel={() => void cancelNavigation()}
      />

      {(loading || spotsLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      )}

      <BottomSheet expanded={selectedSpot !== null}>
        {selectedSpot ? (
          <SpotDetail
            spot={selectedSpot}
            currentUserId={user?.id ?? null}
            onPark={async (id, duration) => {
              if (navigationTarget) {
                if (navigationTarget.id !== id) {
                  await cancelNavigation();
                } else {
                  confirmParking();
                }
              }
              parkSpot(id, duration);
            }}
            onLeave={(id) => {
              leaveSpot(id);
              setSelectedSpot(null);
            }}
            onNavigate={(spot) => {
              void startNavigation(spot);
              setSelectedSpot(null);
            }}
            onDismiss={() => setSelectedSpot(null)}
          />
        ) : undefined}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
