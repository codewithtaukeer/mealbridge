import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  pinCode?: string;
  address?: string;
}

/**
 * Haversine formula to compute geodesic distance between two points in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function useGeolocation() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  const detectLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return null;
    }

    setIsDetecting(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let city: string | undefined;
          let pinCode: string | undefined;
          let address: string | undefined;

          try {
            // Reverse geocode via OpenStreetMap Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'en',
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              const addr = data.address || {};
              city = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state_district;
              pinCode = addr.postcode;
              address = data.display_name?.split(',').slice(0, 3).join(',').trim();
            }
          } catch (err) {
            console.warn('Reverse geocode lookup warning:', err);
          }

          const resolvedLocation: LocationData = {
            latitude,
            longitude,
            city,
            pinCode,
            address,
          };

          setLocation(resolvedLocation);
          setIsDetecting(false);
          toast.success(
            city || pinCode
              ? `Location detected: ${city || ''} ${pinCode ? `(${pinCode})` : ''}`
              : `GPS coordinates acquired: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          );
          resolve(resolvedLocation);
        },
        (error) => {
          setIsDetecting(false);
          let message = 'Unable to retrieve location';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location access was denied. Please allow location permissions in your browser.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Location information is currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            message = 'Location request timed out. Please try again.';
          }
          toast.error(message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  return {
    detectLocation,
    isDetecting,
    location,
  };
}
