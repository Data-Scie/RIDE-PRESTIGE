import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { api } from '@/services/apiClient';

// Foreground-only tracking: sends the driver's position while this hook is mounted
// and the app is open (e.g. on the current-ride screen). Does not track in the
// background when the app is closed or the screen is locked - that needs a native
// background-location entitlement/config that hasn't been set up.
export function useLocationTracking(active: boolean, jobId?: string) {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      subscriptionRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 25 },
        (position) => {
          api.put('/api/driver/location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed ?? undefined,
            heading: position.coords.heading ?? undefined,
            accuracy: position.coords.accuracy ?? undefined,
            jobId,
          }).catch(() => {});
        },
      );
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [active, jobId]);
}
