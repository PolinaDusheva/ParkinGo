import { Spot, ZoneType } from '../types/parking';
import geojson from '../parking-spots.geojson';

interface SpotFeatureProperties {
  id: number;
  method?: string;
  time?: string;
  // Optional fields — add these when you create spots in the GeoJSON file
  streetName?: string;
  zoneType?: ZoneType;
}

interface SpotFeature {
  type: 'Feature';
  properties: SpotFeatureProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface SpotFeatureCollection {
  type: 'FeatureCollection';
  features: SpotFeature[];
}

export const SPOTS_FROM_GEOJSON: Spot[] = (geojson as SpotFeatureCollection).features.map(
  (f) => ({
    id: `spot-${f.properties.id}`,
    // GeoJSON coordinates are [longitude, latitude]
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    streetName: f.properties.streetName ?? 'Unknown Street',
    zoneType: f.properties.zoneType ?? 'none',
    status: 'free',
    occupiedBy: null,
    occupiedAt: null,
    expectedFreeAt: null,
  }),
);
