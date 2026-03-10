import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreId, useTenant } from '@/contexts/TenantContext';
import { DEFAULT_STORE_ID } from '@/lib/constants';

// ============================================================================
// SINGLE SOURCE OF TRUTH FOR APP CONFIGURATION
// ============================================================================
// This context provides all branding/config data from app_settings.
// It handles:
// - Fetching fresh data on every mount (no stale cache)
// - LocalStorage versioning to invalidate old cached data
// - Dynamic document.title and meta theme-color updates
// - Dynamic brand colors applied to CSS variables
// - Neutral loading state (no hardcoded old names)
// ============================================================================

const CONFIG_VERSION_KEY = 'app_config_version';
const CONFIG_CACHE_KEYS = ['app_name_cached', 'app_logo_cached', 'theme_color_cached'];

export interface AppConfig {
  id: string;
  store_id: string;
  app_name: string;
  app_short_name: string;
  app_description: string | null;
  theme_color: string;
  background_color: string;
  brand_primary: string | null;
  brand_secondary: string | null;
  brand_accent: string | null;
  brand_background: string | null;
  brand_surface: string | null;
  brand_text: string | null;
  gradient_start: string | null;
  gradient_end: string | null;
  app_logo_url: string | null;
  app_icon_192_url: string | null;
  app_icon_512_url: string | null;
  app_icon_maskable_url: string | null;
  splash_image_url: string | null;
  support_whatsapp: string | null;
  support_email: string | null;
  terms_url: string | null;
  privacy_url: string | null;
  enable_install_banner: boolean;
  enable_push_notifications: boolean;
  enable_maintenance_mode: boolean;
  maintenance_message: string;
  enable_offline_catalog: boolean;
  offline_message: string;
  updated_at: string;
}

// NEUTRAL defaults - NO old app names like "Pizza Express"
const NEUTRAL_DEFAULTS: Partial<AppConfig> = {
  app_name: '',
  app_short_name: '',
  app_description: '',
  theme_color: '#FF8A00',
  background_color: '#FFFFFF',
  enable_install_banner: true,
  enable_push_notifications: false,
  enable_maintenance_mode: false,
  maintenance_message: '',
  enable_offline_catalog: true,
  offline_message: '',
};

interface AppConfigContextValue {
  config: AppConfig | null;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined);

// Invalidate localStorage if version changed
function invalidateStaleLocalStorage(newVersion: string) {
  const storedVersion = localStorage.getItem(CONFIG_VERSION_KEY);
  
  if (storedVersion !== newVersion) {
    console.log('[AppConfig] Version changed, invalidating local cache', { storedVersion, newVersion });
    
    // Clear any cached branding data
    CONFIG_CACHE_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Update version
    localStorage.setItem(CONFIG_VERSION_KEY, newVersion);
  }
}

// Convert hex to HSL for CSS variables
function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Apply brand colors to CSS variables globally
function applyBrandColorsToCSS(config: AppConfig) {
  const root = document.documentElement;
  
  if (config.brand_primary) {
    root.style.setProperty('--primary', hexToHSL(config.brand_primary));
    root.style.setProperty('--ring', hexToHSL(config.brand_primary));
  }
  if (config.brand_secondary) {
    root.style.setProperty('--gradient-end', hexToHSL(config.brand_secondary));
  }
  if (config.brand_accent) {
    root.style.setProperty('--accent-foreground', hexToHSL(config.brand_accent));
  }
  if (config.brand_background) {
    root.style.setProperty('--background', hexToHSL(config.brand_background));
  }
  if (config.brand_surface) {
    root.style.setProperty('--card', hexToHSL(config.brand_surface));
    root.style.setProperty('--popover', hexToHSL(config.brand_surface));
  }
  if (config.brand_text) {
    root.style.setProperty('--foreground', hexToHSL(config.brand_text));
  }
  // Gradient colors - set as full values for CSS use
  if (config.gradient_start) {
    root.style.setProperty('--gradient-start', config.gradient_start);
  }
  if (config.gradient_end) {
    root.style.setProperty('--gradient-end', config.gradient_end);
    root.style.setProperty('--gradient-end-hex', config.gradient_end);
  }
}

// Update document meta tags dynamically
function updateDocumentMeta(config: AppConfig) {
  // Update title only if we have a name
  if (config.app_name) {
    document.title = `${config.app_name} - Delivery`;
  }

  // Update theme-color meta tag
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta && config.theme_color) {
    themeColorMeta.setAttribute('content', config.theme_color);
  }

  // Cache-bust the manifest URL so browsers/OS don't reuse old icons
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (manifestLink) {
    try {
      const url = new URL(manifestLink.href);
      url.searchParams.set('v', config.updated_at || new Date().toISOString());
      manifestLink.href = url.toString();
    } catch {
      // ignore
    }
  }

  // Update ALL icon links to use admin-configured icons
  const bestIconUrl = config.app_icon_192_url || config.app_icon_512_url || config.app_icon_maskable_url;
  if (bestIconUrl) {
    const versionedIcon = bestIconUrl + '?v=' + (config.updated_at || Date.now());
    
    // Apple touch icon
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (appleTouchIcon) appleTouchIcon.href = versionedIcon;
    
    // Favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (favicon) favicon.href = versionedIcon;
    
    // Also update pwa-icon and pwa-apple-icon (from index.html)
    const pwaIcon = document.getElementById('pwa-icon') as HTMLLinkElement | null;
    if (pwaIcon) pwaIcon.href = versionedIcon;
    const pwaAppleIcon = document.getElementById('pwa-apple-icon') as HTMLLinkElement | null;
    if (pwaAppleIcon) pwaAppleIcon.href = versionedIcon;
  }

  // Update apple-mobile-web-app-title
  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta && config.app_name) {
    appleTitleMeta.setAttribute('content', config.app_name);
  }

  // Update application-name
  const appNameMeta = document.querySelector('meta[name="application-name"]');
  if (appNameMeta && config.app_name) {
    appNameMeta.setAttribute('content', config.app_name);
  }
}

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const storeId = useStoreId();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        // Invalidate stale localStorage using updated_at as version
        const version = data.updated_at || new Date().toISOString();
        invalidateStaleLocalStorage(version);
        
        // Update document meta
        updateDocumentMeta(data as AppConfig);
        
        // Apply brand colors to CSS variables
        applyBrandColorsToCSS(data as AppConfig);
        
        setConfig(data as AppConfig);
      } else {
        // No data in DB - use neutral defaults
        setConfig({ ...NEUTRAL_DEFAULTS, store_id: storeId } as AppConfig);
      }
    } catch (err) {
      console.error('[AppConfig] Failed to fetch config:', err);
      setError(err as Error);
      // On error, still set neutral defaults so UI can render
      setConfig({ ...NEUTRAL_DEFAULTS, store_id: storeId } as AppConfig);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset state immediately when storeId changes to prevent stale render
    setConfig(null);
    setIsLoading(true);
    // Remove old CSS variables so old brand doesn't flash
    const root = document.documentElement;
    ['--primary','--ring','--gradient-end','--accent-foreground','--background','--card','--popover','--foreground','--gradient-start','--gradient-end-hex']
      .forEach(prop => root.style.removeProperty(prop));
    fetchConfig();
  }, [storeId]);

  const value: AppConfigContextValue = {
    config,
    isLoading,
    isReady: !isLoading && config !== null,
    error,
    refetch: fetchConfig,
  };

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
}
