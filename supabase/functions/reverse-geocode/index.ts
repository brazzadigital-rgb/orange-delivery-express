const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ReverseGeocodeResponse {
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

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodingResult {
  address_components: GoogleAddressComponent[];
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
}

// Extract address component by type
function extractComponent(components: GoogleAddressComponent[], ...types: string[]): { long: string; short: string } | null {
  for (const type of types) {
    const component = components.find(c => c.types.includes(type));
    if (component) {
      return { long: component.long_name, short: component.short_name };
    }
  }
  return null;
}

// Brazilian state mapping
const stateMapping: Record<string, string> = {
  'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
  'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
  'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
  'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
  'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO',
  'State of São Paulo': 'SP', 'State of Rio de Janeiro': 'RJ',
  'State of Minas Gerais': 'MG', 'State of Bahia': 'BA',
};

function parseGoogleResult(result: GoogleGeocodingResult, lat: number, lng: number): ReverseGeocodeResponse {
  const components = result.address_components;
  
  // State
  const stateComponent = extractComponent(components, 'administrative_area_level_1');
  let state = stateComponent?.short || '';
  if (state.length > 2 && stateComponent?.long) {
    state = stateMapping[stateComponent.long] || stateMapping[state] || state.slice(0, 2).toUpperCase();
  }
  
  // City
  const cityComponent = extractComponent(components, 'locality', 'administrative_area_level_2', 'sublocality_level_1');
  const city = cityComponent?.long || '';
  
  // Neighborhood
  const neighborhoodComponent = extractComponent(components, 'sublocality_level_1', 'sublocality', 'neighborhood');
  let neighborhood = neighborhoodComponent?.long || null;
  if (neighborhood === city) neighborhood = null;
  
  // Street
  const streetComponent = extractComponent(components, 'route');
  const street = streetComponent?.long || null;
  
  // Street number
  const numberComponent = extractComponent(components, 'street_number');
  const number = numberComponent?.long || null;
  
  // CEP (postal code)
  const postalComponent = extractComponent(components, 'postal_code');
  let cep = postalComponent?.long || null;
  if (cep) {
    cep = cep.replace(/\D/g, '');
  }
  
  return {
    lat,
    lng,
    street,
    number,
    neighborhood,
    city,
    state,
    cep,
    formatted_address: result.formatted_address || null,
    source: 'google',
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const latParam = url.searchParams.get('lat');
    const lngParam = url.searchParams.get('lng');
    
    if (!latParam || !lngParam) {
      return new Response(
        JSON.stringify({ error: 'lat and lng parameters are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    
    if (isNaN(lat) || isNaN(lng)) {
      return new Response(
        JSON.stringify({ error: 'Invalid lat/lng values' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate coordinates are within reasonable bounds for Brazil
    if (lat < -35 || lat > 6 || lng < -75 || lng > -30) {
      return new Response(
        JSON.stringify({ error: 'Coordinates appear to be outside Brazil' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Google Maps API key
    const mapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!mapsApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Reverse Geocoding API
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsApiKey}&language=pt-BR&result_type=street_address|route|sublocality|locality`;
    
    const googleResponse = await fetch(googleUrl);
    const googleData = await googleResponse.json();

    if (googleData.status !== 'OK' || !googleData.results || googleData.results.length === 0) {
      // Try a less specific request
      const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsApiKey}&language=pt-BR`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.status !== 'OK' || !fallbackData.results || fallbackData.results.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No address found for this location',
            lat,
            lng,
            details: googleData.status 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const result = parseGoogleResult(fallbackData.results[0], lat, lng);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = parseGoogleResult(googleData.results[0], lat, lng);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ReverseGeocode] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
