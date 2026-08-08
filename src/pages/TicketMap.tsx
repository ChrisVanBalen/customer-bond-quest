import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, type OptionColor } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "@/components/StatusBadge";
import { Filter, MapPin, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeAddress, type LatLng } from "@/lib/osm";

const MARKER_COLORS: Record<OptionColor, string> = {
  gray: "#71717a",
  blue: "#2563eb",
  green: "#059669",
  amber: "#d97706",
  orange: "#ea580c",
  red: "#dc2626",
  purple: "#9333ea",
  violet: "#7c3aed",
  sky: "#0284c7",
  teal: "#0d9488",
  pink: "#db2777",
};

const GEO_CACHE_KEY = "commandhub-geocache";

function readGeoCache(): Record<string, LatLng> {
  try {
    return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeGeoCache(cache: Record<string, LatLng>) {
  localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
}

function pinIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="39" viewBox="0 0 32 42"><path d="M16 1C8.8 1 3 6.8 3 14c0 9.5 13 27 13 27s13-17.5 13-27c0-7.2-5.8-13-13-13z" fill="${color}" stroke="#ffffff" stroke-width="2"/><circle cx="16" cy="14" r="5" fill="#ffffff"/></svg>`,
    iconSize: [30, 39],
    iconAnchor: [15, 39],
    popupAnchor: [0, -34],
  });
}

const escapeHtml = (s: string) => s.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

interface Plotted {
  ticketId: string;
  title: string;
  status: string;
  customerName: string;
  address: string;
  position: LatLng;
  color: string;
}

export default function TicketMap() {
  const { tickets, customers, settings } = useStore();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);

  const statusOptions = settings.ticketStatuses;
  const [selected, setSelected] = useState<string[]>(
    statusOptions.filter(s => s.value !== "closed" && s.value !== "billing").map(s => s.value)
  );
  const [geocoding, setGeocoding] = useState(false);
  const [coords, setCoords] = useState<Record<string, LatLng>>(() => readGeoCache());
  const [unlocatable, setUnlocatable] = useState<string[]>([]);

  const colorFor = (status: string) =>
    MARKER_COLORS[statusOptions.find(s => s.value === status)?.color ?? "gray"];

  /** Resolves the street address for a ticket via its site or customer record. */
  const addressFor = useMemo(
    () => (customerId: string, locationId: string | null) => {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return null;
      const loc = locationId ? customer.locations.find(l => l.id === locationId) : null;
      const primary = customer.locations.find(l => l.isPrimary) ?? customer.locations[0];
      return loc?.address ?? primary?.address ?? customer.address ?? null;
    },
    [customers]
  );

  /** Coordinates saved on the site record via address lookup, when present. */
  const savedCoordsFor = useMemo(
    () => (customerId: string, locationId: string | null): LatLng | null => {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return null;
      const loc = locationId ? customer.locations.find(l => l.id === locationId) : null;
      const primary = customer.locations.find(l => l.isPrimary) ?? customer.locations[0];
      const target = loc ?? primary;
      return target?.lat != null && target?.lng != null ? { lat: target.lat, lng: target.lng } : null;
    },
    [customers]
  );

  const visibleTickets = useMemo(
    () => tickets.filter(t => selected.includes(t.status)),
    [tickets, selected]
  );

  // Geocode any addresses we haven't resolved yet (Nominatim, rate-limited to 1/sec)
  useEffect(() => {
    const needed = Array.from(
      new Set(
        tickets
          .map(t => addressFor(t.customerId, t.locationId))
          .filter((a): a is string => !!a)
      )
    ).filter(a => !coords[a] && !unlocatable.includes(a));
    if (needed.length === 0) return;

    let cancelled = false;
    setGeocoding(true);
    (async () => {
      const found: Record<string, LatLng> = {};
      const failed: string[] = [];
      for (const address of needed) {
        if (cancelled) return;
        const loc = await geocodeAddress(address);
        if (loc) found[address] = loc;
        else failed.push(address);
        await new Promise(r => setTimeout(r, 1100));
      }
      if (cancelled) return;
      const merged = { ...readGeoCache(), ...found };
      writeGeoCache(merged);
      setCoords(merged);
      if (failed.length) setUnlocatable(prev => [...prev, ...failed]);
      setGeocoding(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tickets, addressFor, coords, unlocatable]);

  const plotted: Plotted[] = useMemo(() => {
    return visibleTickets.flatMap(t => {
      const address = addressFor(t.customerId, t.locationId);
      if (!address) return [];
      const position = savedCoordsFor(t.customerId, t.locationId) ?? coords[address];
      if (!position) return [];
      return [{
        ticketId: t.id,
        title: t.title,
        status: t.status,
        customerName: customers.find(c => c.id === t.customerId)?.name ?? "Unknown",
        address,
        position,
        color: colorFor(t.status),
      }];
    });
  }, [visibleTickets, coords, customers, addressFor, savedCoordsFor, statusOptions]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;
    const map = L.map(mapRef.current, { center: [39.5, -98.35], zoom: 4, scrollWheelZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    markerLayer.current = L.layerGroup().addTo(map);
    mapObj.current = map;
    return () => {
      map.remove();
      mapObj.current = null;
      markerLayer.current = null;
    };
  }, []);

  // Render markers
  useEffect(() => {
    const map = mapObj.current;
    const layer = markerLayer.current;
    if (!map || !layer) return;
    layer.clearLayers();

    plotted.forEach(p => {
      L.marker([p.position.lat, p.position.lng], { icon: pinIcon(p.color), title: p.title })
        .bindPopup(
          `<div style="font-family:inherit;font-size:13px;max-width:220px">
             <strong>${escapeHtml(p.title)}</strong><br/>
             ${escapeHtml(p.customerName)}<br/>
             <span style="color:#666">${escapeHtml(p.address)}</span>
           </div>`
        )
        .addTo(layer);
    });

    if (plotted.length === 1) {
      map.setView([plotted[0].position.lat, plotted[0].position.lng], 13);
    } else if (plotted.length > 1) {
      map.fitBounds(L.latLngBounds(plotted.map(p => [p.position.lat, p.position.lng] as [number, number])), {
        padding: [48, 48],
      });
    }
    map.invalidateSize();
  }, [plotted]);

  const toggle = (value: string) =>
    setSelected(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ticket Map"
        description="See where open work sits so dispatch can group nearby onsite visits"
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Statuses
              <span className="ml-2 text-xs text-muted-foreground">
                {selected.length}/{statusOptions.length}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56">
            <div className="space-y-2">
              {statusOptions.map(s => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selected.includes(s.value)} onCheckedChange={() => toggle(s.value)} />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: MARKER_COLORS[s.color] }}
                  />
                  {s.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button size="sm" variant="ghost" onClick={() => setSelected(statusOptions.map(s => s.value))}>All</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>None</Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap items-center gap-3">
          {statusOptions.filter(s => selected.includes(s.value)).map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MARKER_COLORS[s.color] }} />
              {s.label}
            </span>
          ))}
        </div>

        <div className="ml-auto text-sm text-muted-foreground flex items-center gap-2">
          {geocoding && <Loader2 className="h-4 w-4 animate-spin" />}
          {plotted.length} of {visibleTickets.length} tickets plotted
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div ref={mapRef} className="h-[560px] w-full z-0" />
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-4 max-h-[560px] overflow-auto">
          <h2 className="text-sm font-semibold text-foreground mb-3">Plotted Tickets</h2>
          {plotted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets match the selected statuses.</p>
          ) : (
            <ul className="space-y-2">
              {plotted.map(p => (
                <li key={p.ticketId}>
                  <button
                    onClick={() => navigate(`/tickets/${p.ticketId}`)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                        <div className="mt-1"><StatusBadge status={p.status} /></div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {unlocatable.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              {unlocatable.length} address{unlocatable.length === 1 ? "" : "es"} could not be located. Re-save the site address on the customer using the address lookup to pin it exactly.
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-3">
            Map data © OpenStreetMap contributors
          </p>
        </div>
      </div>
    </div>
  );
}
