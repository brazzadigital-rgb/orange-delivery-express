import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface LocationPickerMapProps {
  lat?: number | null;
  lng?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
}

export function LocationPickerMap({ lat, lng, onLocationChange, address }: LocationPickerMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Default to São Paulo if no coords
  const defaultLat = lat || -23.5505;
  const defaultLng = lng || -46.6333;

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    mapInstanceRef.current = map;

    // Create draggable marker
    const marker = new google.maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map,
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FF8A00',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
    });

    markerRef.current = marker;

    // Update coords when marker is dragged
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        onLocationChange(position.lat(), position.lng());
      }
    });

    // Allow clicking on map to move marker
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        onLocationChange(e.latLng.lat(), e.latLng.lng());
      }
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [isLoaded, defaultLat, defaultLng, onLocationChange]);

  // Update marker position when lat/lng props change externally
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      const newPos = new google.maps.LatLng(lat, lng);
      markerRef.current.setPosition(newPos);
      mapInstanceRef.current?.panTo(newPos);
    }
  }, [lat, lng]);

  // Search address and move marker
  const searchAddress = useCallback(async () => {
    if (!address || !isLoaded || !mapInstanceRef.current) return;

    setIsSearching(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: address + ', Brasil' });

      if (result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const newLat = location.lat();
        const newLng = location.lng();

        markerRef.current?.setPosition(location);
        mapInstanceRef.current?.panTo(location);
        mapInstanceRef.current?.setZoom(17);
        onLocationChange(newLat, newLng);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [address, isLoaded, onLocationChange]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = new google.maps.LatLng(latitude, longitude);
        
        markerRef.current?.setPosition(newPos);
        mapInstanceRef.current?.panTo(newPos);
        mapInstanceRef.current?.setZoom(17);
        onLocationChange(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  }, [onLocationChange]);

  if (loadError) {
    return (
      <div className="h-64 bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Erro ao carregar mapa</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-64 bg-muted rounded-xl flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={searchAddress}
          disabled={!address || isSearching}
          className="gap-2"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          Buscar pelo endereço
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          className="gap-2"
        >
          <Crosshair className="w-4 h-4" />
          Minha localização
        </Button>
      </div>
      
      <div 
        ref={mapRef} 
        className="h-64 w-full rounded-xl overflow-hidden border"
      />
      
      <p className="text-xs text-muted-foreground">
        💡 Arraste o pino ou clique no mapa para ajustar a localização exata da loja
      </p>
    </div>
  );
}
