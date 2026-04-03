import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { BottomSheet } from '../../components/BottomSheet';
import { SpotDetail } from '../../components/SpotDetail';
import { useParking } from '../../hooks/useParking';
import { useAuth } from '../../context/AuthContext';
import { Spot } from '../../types/parking';

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
        mapRef.current?.animateToRegion(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          800,
        );
      }
      setLoading(false);
    })();
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
