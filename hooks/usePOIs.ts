import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { POI, POIType } from '../types/parking';
import { supabase } from '../lib/supabase';

function rowToPOI(row: Record<string, unknown>): POI {
  return {
    id: row.id as string,
    lat: row.lat as number,
    lng: row.lng as number,
    name: row.name as string,
    poiType: row.poi_type as POIType,
    address: (row.address as string | null) ?? null,
    capacity: (row.capacity as number | null) ?? null,
    operatingHours: (row.operating_hours as string | null) ?? null,
    priceInfo: (row.price_info as string | null) ?? null,
  };
}

export function usePOIs() {
  const [pois, setPois] = useState<POI[]>([]);
  const [poisLoading, setPoisLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('pois')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          Alert.alert('Could not load points of interest', error.message);
        } else if (data) {
          setPois((data as Record<string, unknown>[]).map(rowToPOI));
        }
        setPoisLoading(false);
      });
  }, []);

  return { pois, poisLoading };
}
