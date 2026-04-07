import MapView, { Marker, Polygon, PROVIDER_DEFAULT } from 'react-native-maps';
import { Alert, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { BottomSheet } from '../../components/BottomSheet';
import { SpotDetail } from '../../components/SpotDetail';
import { useParking } from '../../hooks/useParking';
import { useAuth } from '../../context/AuthContext';
import { Spot } from '../../types/parking';
import { BLUE_ZONE_POLYGONS } from '../../lib/zones';

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

const MARKER_COLORS: Record<Spot['status'], string> = {
  free: 'green',
  occupied: 'red',
  reserved: '#007AFF',
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  const { user } = useAuth();
  const { spots, parkSpot, leaveSpot } = useParking(user?.id ?? null);

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
        provider={PROVIDER_DEFAULT}
        initialRegion={VARNA_REGION}
        showsUserLocation={locationGranted}
        showsMyLocationButton={locationGranted}
        showsCompass
        showsScale
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
            pinColor={MARKER_COLORS[spot.status]}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedSpot(spot);
            }}
            tracksViewChanges={false}
          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      )}

      <BottomSheet expanded={selectedSpot !== null}>
        {selectedSpot ? (
          <SpotDetail
            spot={selectedSpot}
            currentUserId={user?.id ?? null}
            onPark={(id, duration) => {
              parkSpot(id, duration);
              setSelectedSpot(null);
            }}
            onLeave={(id) => {
              leaveSpot(id);
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
