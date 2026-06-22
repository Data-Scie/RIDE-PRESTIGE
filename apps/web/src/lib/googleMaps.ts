'use client';

declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
        Marker: new (options: Record<string, unknown>) => unknown;
        SymbolPath: { CIRCLE: number };
      };
    };
    __rpGoogleMapsCallbacks?: Array<() => void>;
  }
}

let loadingPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve) => {
    window.__rpGoogleMapsCallbacks = window.__rpGoogleMapsCallbacks || [];
    window.__rpGoogleMapsCallbacks.push(resolve);

    const existing = document.querySelector('script[data-rp-google-maps]');
    if (existing) return;

    (window as unknown as { __rpGoogleMapsInit: () => void }).__rpGoogleMapsInit = () => {
      (window.__rpGoogleMapsCallbacks || []).forEach(cb => cb());
      window.__rpGoogleMapsCallbacks = [];
    };
    const script = document.createElement('script');
    script.dataset.rpGoogleMaps = 'true';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__rpGoogleMapsInit`;
    script.async = true;
    document.head.appendChild(script);
  });
  return loadingPromise;
}
