export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'bg';
  mapType: 'standard' | 'satellite' | 'hybrid';
  defaultDuration: 30 | 60 | 120 | 180 | null; // null = always ask
  distanceUnit: 'km' | 'mi';
  notifications: {
    reservation: boolean;
    arrival: boolean;
    timerExpiry: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  mapType: 'standard',
  defaultDuration: null,
  distanceUnit: 'km',
  notifications: {
    reservation: true,
    arrival: true,
    timerExpiry: true,
  },
};
