import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CepResponse {
  cep: string;
  street: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lng: number | null;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodingResult {
  address_components: GoogleAddressComponent[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
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

// Parse Google Geocoding response
function parseGoogleResponse(result: GoogleGeocodingResult): Omit<CepResponse, 'cep' | 'source'> {
  const components = result.address_components;
  
  // State: administrative_area_level_1 -> short_name (RS, SP, etc.)
  const stateComponent = extractComponent(components, 'administrative_area_level_1');
  let state = stateComponent?.short || '';
  
  // Brazilian state mapping for long names
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
  
  if (state.length > 2 && stateComponent?.long) {
    state = stateMapping[stateComponent.long] || stateMapping[state] || state.slice(0, 2).toUpperCase();
  }
  
  // City: priority order for Brazil
  const cityComponent = extractComponent(components, 'locality', 'administrative_area_level_2', 'sublocality_level_1');
  const city = cityComponent?.long || '';
  
  // Neighborhood
  const neighborhoodComponent = extractComponent(components, 'sublocality_level_1', 'sublocality', 'neighborhood');
  let neighborhood = neighborhoodComponent?.long || null;
  if (neighborhood === city) neighborhood = null;
  
  // Street
  const streetComponent = extractComponent(components, 'route');
  const street = streetComponent?.long || null;
  
  // Country
  const countryComponent = extractComponent(components, 'country');
  const country = countryComponent?.short || 'BR';
  
  // Coordinates
  const lat = result.geometry?.location?.lat || null;
  const lng = result.geometry?.location?.lng || null;
  
  // Confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (city && state) {
    confidence = street && neighborhood ? 'high' : 'medium';
  }
  
  return { street, neighborhood, city, state, country, lat, lng, confidence };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get CEP from query params
    const url = new URL(req.url);
    const cepRaw = url.searchParams.get('cep');
    
    if (!cepRaw) {
      return new Response(
        JSON.stringify({ error: 'CEP parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Normalize CEP (only digits)
    const cep = cepRaw.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      return new Response(
        JSON.stringify({ error: 'CEP must have 8 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for cache operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cached } = await supabase
      .from('cep_cache')
      .select('*')
      .eq('cep', cep)
      .single();

    // If cached and less than 90 days old, return cached data
    if (cached) {
      const updatedAt = new Date(cached.updated_at);
      const now = new Date();
      const daysDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 90) {
        console.log(`[CEP] Cache hit for ${cep}`);
        return new Response(
          JSON.stringify({
            cep,
            street: cached.street,
            neighborhood: cached.neighborhood,
            city: cached.city,
            state: cached.state,
            country: cached.country || 'BR',
            lat: cached.lat,
            lng: cached.lng,
            source: 'cache',
            confidence: cached.confidence || 'high',
          } as CepResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get Google Maps API key
    const mapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!mapsApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format CEP for Google: 00000-000
    const formattedCep = `${cep.slice(0, 5)}-${cep.slice(5)}`;
    
    // Call Google Geocoding API
    console.log(`[CEP] Calling Google Geocoding for ${formattedCep}`);
    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formattedCep)},Brazil&key=${mapsApiKey}&language=pt-BR`;
    
    const googleResponse = await fetch(googleUrl);
    const googleData = await googleResponse.json();

    if (googleData.status !== 'OK' || !googleData.results || googleData.results.length === 0) {
      console.log(`[CEP] Google returned no results for ${cep}: ${googleData.status}`);
      return new Response(
        JSON.stringify({ 
          error: 'CEP not found',
          details: googleData.status 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the first result
    const parsed = parseGoogleResponse(googleData.results[0]);
    
    if (!parsed.city || !parsed.state) {
      console.log(`[CEP] Could not extract city/state for ${cep}`);
      return new Response(
        JSON.stringify({ error: 'Could not determine city/state for this CEP' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: CepResponse = {
      cep,
      ...parsed,
      source: 'google',
    };

    // Cache the result (upsert)
    const { error: cacheError } = await supabase
      .from('cep_cache')
      .upsert({
        cep,
        street: parsed.street,
        neighborhood: parsed.neighborhood,
        city: parsed.city,
        state: parsed.state,
        country: parsed.country,
        lat: parsed.lat,
        lng: parsed.lng,
        source: 'google',
        confidence: parsed.confidence,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'cep' });

    if (cacheError) {
      console.error('[CEP] Cache write error:', cacheError);
      // Don't fail the request, just log the error
    } else {
      console.log(`[CEP] Cached result for ${cep}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CEP] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
