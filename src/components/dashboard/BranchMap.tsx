import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fmtCurrency, fmtPct } from "@/components/dashboard/shared";
import type { BranchSummaryItem } from "@/services/dashboardService";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface BranchMapProps {
  branches: BranchSummaryItem[];
  coords: Record<string, [number, number]>;
  currency: string;
}

export default function BranchMap({ branches, coords, currency }: BranchMapProps) {
  return (
    <MapContainer
      center={[25.2048, 55.2708]}
      zoom={11}
      scrollWheelZoom={false}
      className="h-full w-full z-0"
      style={{ background: "var(--color-card)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {branches.map((b) => {
        const c = coords[b.branch];
        if (!c) return null;
        return (
          <Marker key={b.branch} position={c}>
            <Popup>
              <div className="text-xs space-y-1 min-w-[140px]">
                <p className="font-bold text-sm">{b.branch}</p>
                <p>Sales: {fmtCurrency(b.sales, currency)}</p>
                <p>Orders: {b.orders.toLocaleString()}</p>
                <p>Margin: {fmtPct(b.gross_margin_pct)}</p>
                {b.active_alerts > 0 && (
                  <p className="text-destructive font-semibold">
                    {b.active_alerts} alert{b.active_alerts !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
