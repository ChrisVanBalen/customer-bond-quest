import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadGoogleMaps, type LatLng } from "@/lib/googleMaps";
import { Loader2, MapPin } from "lucide-react";

interface Suggestion {
  text: string;
  placeId: string;
}

interface Props {
  value: string;
  onChange: (address: string, coords?: LatLng) => void;
  placeholder?: string;
  id?: string;
}

/** Address input backed by the Google Places API (New) autocomplete suggestions. */
export function AddressAutocomplete({ value, onChange, placeholder = "Start typing an address...", id }: Props) {
  const [ready, setReady] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionToken = useRef<any>(null);
  const debounce = useRef<number | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGoogleMaps().then(() => setReady(true)).catch(() => setReady(false));
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const fetchSuggestions = (input: string) => {
    if (debounce.current) window.clearTimeout(debounce.current);
    if (!ready || input.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounce.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const { AutocompleteSuggestion, AutocompleteSessionToken } =
          (await (window as any).google.maps.importLibrary("places")) as any;
        if (!sessionToken.current) sessionToken.current = new AutocompleteSessionToken();
        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionToken.current,
        });
        setSuggestions(
          (results ?? [])
            .filter((r: any) => r.placePrediction)
            .map((r: any) => ({
              text: r.placePrediction.text?.toString() ?? "",
              placeId: r.placePrediction.placeId,
            }))
        );
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const select = async (s: Suggestion) => {
    setOpen(false);
    setSuggestions([]);
    try {
      const { Place } = (await (window as any).google.maps.importLibrary("places")) as any;
      const place = new Place({ id: s.placeId });
      await place.fetchFields({ fields: ["formattedAddress", "location"] });
      const address = place.formattedAddress ?? s.text;
      const loc = place.location;
      onChange(address, loc ? { lat: loc.lat(), lng: loc.lng() } : undefined);
    } catch {
      onChange(s.text);
    }
    sessionToken.current = null;
  };

  return (
    <div className="relative" ref={wrapper}>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={e => {
          onChange(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map(s => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => select(s)}
                className="w-full text-left px-3 py-2 text-sm flex items-start gap-2 hover:bg-muted/60 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <span>{s.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
