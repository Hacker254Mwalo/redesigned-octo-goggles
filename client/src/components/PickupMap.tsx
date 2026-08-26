import { MapView } from "@/components/Map";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Station = { id: number; name: string; town: string; latitude: string | null; longitude: string | null };

export function PickupMap({ stations }: { stations: Station[] }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    markerRefs.current.forEach(marker => marker.map = null);
    markerRefs.current = stations.flatMap(station => {
      const lat = Number(station.latitude); const lng = Number(station.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      const marker = new google.maps.marker.AdvancedMarkerElement({ map: mapRef.current!, position: { lat, lng }, title: `${station.name} — ${station.town}` });
      return [marker];
    });
  }, [stations]);
  if (unavailable) return <div className="map-fallback"><MapPin size={24} /><div><strong>Map view is temporarily unavailable.</strong><p>Every station card below includes a directions link, address, landmark, and opening hours.</p></div></div>;
  return <MapView className="pickup-map" initialCenter={{ lat: -1.286, lng: 36.817 }} initialZoom={10} onMapReady={map => { mapRef.current = map; }} onMapError={() => setUnavailable(true)} />;
}
