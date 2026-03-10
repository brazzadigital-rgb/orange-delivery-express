import { useState, useCallback } from 'react';

export interface ReverseGeocodeData {
  lat: number;
  lng: number;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  cep: string | null;
  formatted_address: string | null;
  source: string;
}

interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'GEOCODE_FAILED' | 'UNKNOWN';
  message: string;
}

interface UseGeolocationReturn {
  getCurrentLocation: () => Promise<ReverseGeocodeData | null>;
  isLoading: boolean;
  error: GeolocationError | null;
  clearError: () => void;
}

const ERROR_MESSAGES: Record<string, GeolocationError> = {
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    message: 'Localização bloqueada. Ative nas configurações do navegador.',
  },
  POSITION_UNAVAILABLE: {
    code: 'POSITION_UNAVAILABLE',
    message: 'Não foi possível obter sua localização. Tente novamente.',
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    message: 'Tempo esgotado ao buscar localização. Verifique seu GPS.',
  },
  GEOCODE_FAILED: {
    code: 'GEOCODE_FAILED',
    message: 'Localização obtida, mas não foi possível preencher o endereço automaticamente.',
  },
  UNKNOWN: {
    code: 'UNKNOWN',
    message: 'Erro desconhecido ao obter localização.',
  },
};

export function useGeolocation(): UseGeolocationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const getCurrentLocation = useCallback(async (): Promise<ReverseGeocodeData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw { code: 2 }; // POSITION_UNAVAILABLE
      }

      // Get current position with high accuracy
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const { latitude: lat, longitude: lng } = position.coords;

      // Call reverse geocode endpoint
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/reverse-geocode?lat=${lat}&lng=${lng}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Geolocation] Reverse geocode error:', errorData);
        setError(ERROR_MESSAGES.GEOCODE_FAILED);
        
        // Return partial data with just coordinates
        return {
          lat,
          lng,
          street: null,
          number: null,
          neighborhood: null,
          city: '',
          state: '',
          cep: null,
          formatted_address: null,
          source: 'geolocation_only',
        };
      }

      const data: ReverseGeocodeData = await response.json();
      return data;

    } catch (err: any) {
      console.error('[Geolocation] Error:', err);
      
      // Handle GeolocationPositionError
      if (err.code !== undefined) {
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            setError(ERROR_MESSAGES.PERMISSION_DENIED);
            break;
          case 2: // POSITION_UNAVAILABLE
            setError(ERROR_MESSAGES.POSITION_UNAVAILABLE);
            break;
          case 3: // TIMEOUT
            setError(ERROR_MESSAGES.TIMEOUT);
            break;
          default:
            setError(ERROR_MESSAGES.UNKNOWN);
        }
      } else {
        setError(ERROR_MESSAGES.UNKNOWN);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getCurrentLocation,
    isLoading,
    error,
    clearError,
  };
}
