/** Shared Google Maps JS API loader (with Places library). */
let mapsPromise: Promise<void> | null = null;

export const MAPS_BROWSER_KEY = import.meta.env
  .VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;

export function loadGoogleMaps(): Promise<void> {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    if (!MAPS_BROWSER_KEY) {
      reject(new Error("Google Maps is not configured."));
      return;
    }
    if ((window as any).google?.maps?.Map) {
      resolve();
      return;
    }
    const existing = document.getElementById("google-maps-js") as HTMLScriptElement | null;
    (window as any).__initGoogleMaps = () => resolve();
    if (existing) return;
    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_BROWSER_KEY}&libraries=places&loading=async&callback=__initGoogleMaps`;
    script.async = true;
    script.onerror = () =>
      reject(new Error("Failed to load Google Maps. The API key may be restricted to another domain."));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

export type LatLng = { lat: number; lng: number };

/** Geocodes an address through the Maps JS Geocoder. */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  await loadGoogleMaps();
  const geocoder = new (window as any).google.maps.Geocoder();
  try {
    const res = await geocoder.geocode({ address });
    const loc = res.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat(), lng: loc.lng() } : null;
  } catch {
    return null;
  }
}
