/**
 * MINIMAL SPLASH LOADING SCREEN
 * ================================
 * Ultra lightweight splash - no heavy animations to avoid jank.
 * Uses CSS-only animation for maximum performance.
 */
export function AppSplash() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      {/* Simple pulsing dot */}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
