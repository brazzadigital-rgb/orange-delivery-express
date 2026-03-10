/// <reference types="google.maps" />
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

interface UseGoogleMapsResult {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadError: string | null;
}

let isLoadingScript = false;
let isScriptLoaded = false;
let mapsApiKey: string | null = null;

export function useGoogleMaps(): UseGoogleMapsResult {
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScript = useCallback(async () => {
    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    if (isLoadingScript) {
      return;
    }

    setIsLoading(true);
    isLoadingScript = true;

    try {
      // Fetch API key from edge function
      if (!mapsApiKey) {
        const { data, error: fnError } = await supabase.functions.invoke('get-maps-key');
        
        if (fnError) {
          throw new Error(fnError.message);
        }
        
        if (!data?.apiKey) {
          throw new Error('API key not available');
        }
        
        mapsApiKey = data.apiKey;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        if (window.google?.maps) {
          isScriptLoaded = true;
          setIsLoaded(true);
          setIsLoading(false);
          isLoadingScript = false;
          return;
        }
      }

      // Create callback
      window.initGoogleMaps = () => {
        isScriptLoaded = true;
        setIsLoaded(true);
        setIsLoading(false);
        isLoadingScript = false;
      };

      // Load script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places,geometry&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setError('Failed to load Google Maps');
        setIsLoading(false);
        isLoadingScript = false;
      };
      
      document.head.appendChild(script);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load maps';
      setError(message);
      setIsLoading(false);
      isLoadingScript = false;
    }
  }, []);

  useEffect(() => {
    loadScript();
  }, [loadScript]);

  return {
    isLoaded,
    isLoading,
    error,
    loadError: error,
  };
}

export default useGoogleMaps;
