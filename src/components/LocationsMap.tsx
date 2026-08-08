import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeAddress, type LatLng } from "@/lib/osm";

interface Place {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  isPrimary?: boolean;
}

interface Props {
  places: Place[];
  className?: string;
}

function pinIcon(primary: boolean) {
  const color = primary ? "#2563eb" : "#64748b";
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 32 42"><path d="M16 1C8.8 1 3 6.8 3 14c0 9.5 13 27 13 27s13-17.5 13-27c0-7.2-5.8-13-13-13z" fill="${color}" stroke="#ffffff" stroke-width="2"/><circle cx="16" cy="14" r="5" fill="#ffffff"/></svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

const escapeHtml = (s: string) => s.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

/** OpenStreetMap (Leaflet) map plotting a set of addresses. */
export function LocationsMap({ places, className = "h-64 w-full" }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [resolved, setResolved] = useState<Record<string, LatLng>>({});

  const pending = useMemo(
    () => places.filter(p => p.lat == null || p.lng == null).map(p => p.address).filter(a => !resolved[a]),
    [places, resolved]
  );

  useEffect(() => {
    if (pending.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const address of pending) {
        const loc = await geocodeAddress(address);
        if (cancelled) return;
        if (loc) setResolved(prev => ({ ...prev, [address]: loc }));
        await new Promise(r => setTimeout(r, 1100));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pending]);

  useEffect(() => {
    if (!container.current || map.current) return;
    const m = L.map(container.current, { center: [39.5, -98.35], zoom: 3, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const lg = layer.current;
    if (!m || !lg) return;
    lg.clearLayers();
    const points: [number, number][] = [];
    places.forEach(p => {
      const coords = p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : resolved[p.address];
      if (!coords) return;
      points.push([coords.lat, coords.lng]);
      L.marker([coords.lat, coords.lng], { icon: pinIcon(!!p.isPrimary), title: p.name })
        .bindPopup(
          `<div style="font-size:13px"><strong>${escapeHtml(p.name)}</strong><br/><span style="color:#666">${escapeHtml(p.address)}</span></div>`
        )
        .addTo(lg);
    });
    if (points.length === 1) m.setView(points[0], 14);
    else if (points.length > 1) m.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
    m.invalidateSize();
  }, [places, resolved]);

  return <div ref={container} className={`${className} z-0`} />;
}
