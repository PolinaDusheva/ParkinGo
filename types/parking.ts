export type ZoneType = 'none' | 'blue' | 'green';
export type SpotStatus = 'free' | 'occupied' | 'reserved';

export interface Spot {
  id: string;
  lat: number;
  lng: number;
  streetName: string;
  zoneType: ZoneType;
  status: SpotStatus;
  occupiedBy: string | null;
  occupiedAt: string | null;       // ISO timestamp
  expectedFreeAt: string | null;   // ISO timestamp
  reservedBy: string | null;
  reservedAt: string | null;
}

export type ParkingDuration = 30 | 60 | 120 | 180; // minutes

export const DURATION_OPTIONS: { label: string; value: ParkingDuration }[] = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

export type POIType = 'garage' | 'private_lot' | 'ev_charging';

export interface POI {
  id: string;
  lat: number;
  lng: number;
  name: string;
  poiType: POIType;
  address: string | null;
  capacity: number | null;
  operatingHours: string | null;
  priceInfo: string | null;
}
