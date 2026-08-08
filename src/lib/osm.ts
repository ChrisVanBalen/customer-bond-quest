/** OpenStreetMap helpers: Nominatim geocoding + address search. */

export type LatLng = { lat: number; lng: number };

const NOMINATIM = "https://nominatim.openstreetmap.org";

export interface AddressSuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

/** Searches addresses via Nominatim (used for autocomplete). */
export async function searchAddresses(query: string, limit = 6): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `${NOMINATIM}/search?format=jsonv2&addressdetails=0&limit=${limit}&q=${encodeURIComponent(q)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
    return data.map(d => ({
      id: String(d.place_id),
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));
  } catch {
    return [];
  }
}

/** Geocodes a single address string to coordinates. */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const results = await searchAddresses(address, 1);
  return results.length ? { lat: results[0].lat, lng: results[0].lng } : null;
}

/** Link to the address on openstreetmap.org. */
export function osmSearchUrl(address: string) {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
}
