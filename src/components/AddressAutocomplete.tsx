import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchAddresses, type AddressSuggestion, type LatLng } from "@/lib/osm";
import { Loader2, MapPin } from "lucide-react";

interface Props {
  value: string;
  onChange: (address: string, coords?: LatLng) => void;
  placeholder?: string;
  id?: string;
}

/** Address input backed by OpenStreetMap (Nominatim) search suggestions. */
export function AddressAutocomplete({ value, onChange, placeholder = "Start typing an address...", id }: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<number | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const fetchSuggestions = (input: string) => {
    if (debounce.current) window.clearTimeout(debounce.current);
    if (input.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounce.current = window.setTimeout(async () => {
      setLoading(true);
      const results = await searchAddresses(input);
      setSuggestions(results);
      setOpen(true);
      setLoading(false);
    }, 400);
  };

  const select = (s: AddressSuggestion) => {
    setOpen(false);
    setSuggestions([]);
    onChange(s.label, { lat: s.lat, lng: s.lng });
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
            <li key={s.id}>
              <button
                type="button"
                onClick={() => select(s)}
                className="w-full text-left px-3 py-2 text-sm flex items-start gap-2 hover:bg-muted/60 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <span>{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
