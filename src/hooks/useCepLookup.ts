import { useState, useCallback, useRef } from 'react';

export interface CepData {
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

interface UseCepLookupReturn {
  lookupCep: (cep: string) => Promise<CepData | null>;
  isLoading: boolean;
  error: string | null;
  lastResult: CepData | null;
}

// Debounce delay in ms
const DEBOUNCE_MS = 500;

export function useCepLookup(): UseCepLookupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CepData | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastCepRef = useRef<string | null>(null);

  const lookupCep = useCallback(async (cepRaw: string): Promise<CepData | null> => {
    // Normalize CEP
    const cep = cepRaw.replace(/\D/g, '');
    
    // Don't lookup if not 8 digits
    if (cep.length !== 8) {
      return null;
    }

    // Don't lookup same CEP twice in a row
    if (cep === lastCepRef.current && lastResult) {
      return lastResult;
    }

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    return new Promise((resolve) => {
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        setError(null);

        try {
          // Use fetch with proper headers for GET request with query params
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          
          const response = await fetch(
            `${supabaseUrl}/functions/v1/get-cep-address?cep=${cep}`,
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
            throw new Error(errorData.error || 'CEP não encontrado');
          }

          const result: CepData = await response.json();
          
          setLastResult(result);
          lastCepRef.current = cep;
          setError(null);
          resolve(result);
        } catch (err) {
          console.error('[CEP Lookup] Error:', err);
          const message = err instanceof Error ? err.message : 'Erro ao buscar CEP';
          setError(message);
          setLastResult(null);
          resolve(null);
        } finally {
          setIsLoading(false);
        }
      }, DEBOUNCE_MS);
    });
  }, [lastResult]);

  return {
    lookupCep,
    isLoading,
    error,
    lastResult,
  };
}
