/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

interface Marker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  icon?: 'driver' | 'destination' | 'store';
}

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Marker[];
  /** When true, adjusts the viewport to show all markers (useful for admin live map). */
  fitToMarkers?: boolean;
  driverLocation?: { lat: number; lng: number; heading?: number | null };
  destinationLocation?: { lat: number; lng: number };
  showRoute?: boolean;
  onMarkerClick?: (markerId: string) => void;
  className?: string;
}

function GoogleMapComponent({
  center,
  zoom = 15,
  markers = [],
  fitToMarkers = false,
  driverLocation,
  destinationLocation,
  showRoute = false,
  onMarkerClick,
  className = '',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const lastFitKeyRef = useRef<string>('');

  const { isLoaded, isLoading, error } = useGoogleMaps();

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapRef.current) return;

    const defaultCenter = center || driverLocation || destinationLocation || { lat: -23.55052, lng: -46.633308 };

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom,
      disableDefaultUI: true,
      zoomControl: true,
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
  }, [isLoaded, center, zoom, driverLocation, destinationLocation]);

  // Keep center in sync when provided
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current || !center) return;
    googleMapRef.current.panTo(center);
  }, [isLoaded, center]);

  // Update driver marker
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current || !driverLocation) return;

    // Motorcycle SVG icon
    const motorcycleIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2"/>
        <g transform="translate(8, 10)" fill="white">
          <circle cx="4" cy="14" r="3" stroke="white" stroke-width="1.5" fill="none"/>
          <circle cx="20" cy="14" r="3" stroke="white" stroke-width="1.5" fill="none"/>
          <path d="M4 14 L8 8 L14 8 L16 4 L20 4" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M14 8 L18 14" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <circle cx="12" cy="6" r="2" fill="white"/>
        </g>
      </svg>
    `;

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new google.maps.Marker({
        map: googleMapRef.current,
        position: driverLocation,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(motorcycleIcon),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        zIndex: 1000,
      });
    } else {
      driverMarkerRef.current.setPosition(driverLocation);
      // Icon doesn't need rotation update for motorcycle
    }

    // Center map on driver
    googleMapRef.current.panTo(driverLocation);
  }, [isLoaded, driverLocation]);

  // Update destination marker
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current || !destinationLocation) return;

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = new google.maps.Marker({
        map: googleMapRef.current,
        position: destinationLocation,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
              <path fill="#EF4444" d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z"/>
              <circle fill="white" cx="16" cy="16" r="8"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 40),
          anchor: new google.maps.Point(16, 40),
        },
        zIndex: 999,
      });
    } else {
      destinationMarkerRef.current.setPosition(destinationLocation);
    }
  }, [isLoaded, destinationLocation]);

  // Draw route
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current || !showRoute || !driverLocation || !destinationLocation) return;

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: googleMapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
    }

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: driverLocation,
        destination: destinationLocation,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
        }
      }
    );
  }, [isLoaded, showRoute, driverLocation, destinationLocation]);

  // Update markers
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!markers.find((m) => m.id === id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    markers.forEach((markerData) => {
      let marker = markersRef.current.get(markerData.id);

      if (!marker) {
        marker = new google.maps.Marker({
          map: googleMapRef.current,
          position: { lat: markerData.lat, lng: markerData.lng },
          label: markerData.label,
        });

        if (onMarkerClick) {
          marker.addListener('click', () => onMarkerClick(markerData.id));
        }

        markersRef.current.set(markerData.id, marker);
      } else {
        marker.setPosition({ lat: markerData.lat, lng: markerData.lng });
      }
    });
  }, [isLoaded, markers, onMarkerClick]);

  // Fit map to markers (one-time per marker set) so the admin doesn't get stuck in the default city.
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current || !fitToMarkers) return;
    if (!markers || markers.length === 0) return;

    const fitKey = markers
      .map((m) => m.id)
      .sort()
      .join('|');

    // Only refit when the set of marker ids changes (prevents constant viewport jumps on live updates).
    if (fitKey === lastFitKeyRef.current) return;
    lastFitKeyRef.current = fitKey;

    const bounds = new google.maps.LatLngBounds();
    for (const m of markers) {
      if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
        bounds.extend({ lat: m.lat, lng: m.lng });
      }
    }

    if (!bounds.isEmpty()) {
      googleMapRef.current.fitBounds(bounds, { top: 64, right: 64, bottom: 64, left: 64 });
    }
  }, [isLoaded, fitToMarkers, markers]);

  // Cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      driverMarkerRef.current?.setMap(null);
      destinationMarkerRef.current?.setMap(null);
      directionsRendererRef.current?.setMap(null);
    };
  }, []);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted ${className}`}>
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {error === 'Unauthorized' 
            ? 'Faça login para visualizar o mapa'
            : 'Não foi possível carregar o mapa. Verifique a configuração da API.'}
        </p>
      </div>
    );
  }

  if (isLoading || !isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground mt-3">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={`w-full h-full ${className}`} />;
}

export const GoogleMap = memo(GoogleMapComponent);
export default GoogleMap;
