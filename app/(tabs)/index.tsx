import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { BottomSheet } from '../../components/BottomSheet';

const VARNA_REGION = {
  latitude: 43.2141,
  longitude: 27.9147,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(true);

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
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      )}
      <BottomSheet />
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
