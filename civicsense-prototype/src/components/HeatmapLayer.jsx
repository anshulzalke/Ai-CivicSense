import React, { useEffect, useMemo, useRef } from "react";
import { useMap, CircleMarker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { Flame, AlertTriangle, ShieldAlert } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";


export const PUNE_WARDS = [
  { id: "wagholi", name: "Wagholi (Ward 14)", lat: 18.5793, lng: 73.9812 },
  { id: "kharadi", name: "Kharadi (Ward 12)", lat: 18.5515, lng: 73.9345 },
  { id: "baner", name: "Baner - Balewadi (Ward 8)", lat: 18.5596, lng: 73.7799 },
  { id: "kothrud", name: "Kothrud (Ward 10)", lat: 18.5074, lng: 73.8077 },
  { id: "hadapsar", name: "Hadapsar (Ward 15)", lat: 18.5089, lng: 73.9260 },
  { id: "shivajinagar", name: "Shivaji Nagar (Ward 5)", lat: 18.5314, lng: 73.8446 },
  { id: "pcmc", name: "PCMC / Pimpri (Zone 1)", lat: 18.6279, lng: 73.8009 },
  { id: "vimannagar", name: "Viman Nagar (Ward 3)", lat: 18.5679, lng: 73.9143 },
  { id: "swargate", name: "Swargate (Ward 7)", lat: 18.5018, lng: 73.8636 },
];

/**
 * Calculates distance in km between two lat/lng points
 */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HeatmapLayer({ complaints = [] }) {
  const map = useMap();
  const { t } = useLanguage();
  const canvasRef = useRef(null);

  // Group complaints by nearest ward & calculate cluster intensity
  const wardAnalytics = useMemo(() => {
    return PUNE_WARDS.map((ward) => {
      // Find all complaints within 3.5 km of the ward center
      const nearby = complaints.filter((c) => {
        if (!c.lat || !c.lng || isNaN(c.lat) || isNaN(c.lng)) return false;
        return getDistanceKm(ward.lat, ward.lng, c.lat, c.lng) < 4.0;
      });

      const totalComplaints = nearby.length;
      const criticalCount = nearby.filter((c) => (c.severity || 3) >= 4).length;
      const avgSeverity =
        totalComplaints > 0
          ? (nearby.reduce((sum, c) => sum + (c.severity || 3), 0) / totalComplaints).toFixed(1)
          : 0;

      let riskLevel = "low"; // low | medium | critical
      let color = "#4C7A5E"; // green
      if (totalComplaints >= 3 || criticalCount >= 2) {
        riskLevel = "critical";
        color = "#C1443A"; // red
      } else if (totalComplaints >= 1 || avgSeverity >= 3) {
        riskLevel = "medium";
        color = "#E8A33D"; // amber
      }

      return {
        ...ward,
        count: totalComplaints,
        criticalCount,
        avgSeverity,
        riskLevel,
        color,
        nearby,
      };
    });
  }, [complaints]);

  // Render Canvas density gradients on the Leaflet map pane
  useEffect(() => {
    if (!map) return;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "leaflet-heatmap-canvas pointer-events-none";
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "400";
      canvas.style.pointerEvents = "none";
      canvas.style.opacity = "0.75";
      canvasRef.current = canvas;
      map.getPanes().overlayPane.appendChild(canvas);
    }

    function drawHeatmap() {
      if (!canvas || !map) return;
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;

      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeft);

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw radial intensity gradients for each complaint point
      complaints.forEach((c) => {
        if (!c.lat || !c.lng || isNaN(c.lat) || isNaN(c.lng)) return;
        const pt = map.latLngToContainerPoint([c.lat, c.lng]);
        const radius = 45 + (c.severity || 3) * 8;

        const radGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
        const sev = c.severity || 3;

        if (sev >= 4) {
          radGrad.addColorStop(0, "rgba(193, 68, 58, 0.85)"); // red center
          radGrad.addColorStop(0.4, "rgba(232, 163, 61, 0.5)"); // amber
          radGrad.addColorStop(0.8, "rgba(76, 122, 94, 0.2)"); // green
          radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else if (sev === 3) {
          radGrad.addColorStop(0, "rgba(232, 163, 61, 0.75)"); // amber center
          radGrad.addColorStop(0.5, "rgba(76, 122, 94, 0.35)"); // green
          radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
          radGrad.addColorStop(0, "rgba(76, 122, 94, 0.7)"); // green center
          radGrad.addColorStop(0.6, "rgba(61, 76, 107, 0.25)"); // blue
          radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        }

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    drawHeatmap();

    map.on("move", drawHeatmap);
    map.on("moveend", drawHeatmap);
    map.on("zoom", drawHeatmap);
    map.on("resize", drawHeatmap);

    return () => {
      map.off("move", drawHeatmap);
      map.off("moveend", drawHeatmap);
      map.off("zoom", drawHeatmap);
      map.off("resize", drawHeatmap);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        canvasRef.current = null;
      }
    };
  }, [map, complaints]);

  return (
    <>
      {/* Interactive Ward Hotspot Node Markers */}
      {wardAnalytics.map((w) => {
        const radius = Math.max(16, Math.min(32, 14 + w.count * 4));
        const isCritical = w.riskLevel === "critical";

        return (
          <CircleMarker
            key={w.id}
            center={[w.lat, w.lng]}
            radius={radius}
            pathOptions={{
              color: w.color,
              fillColor: w.color,
              fillOpacity: isCritical ? 0.8 : 0.65,
              weight: isCritical ? 3 : 2,
            }}
          >
            {/* Tooltip on Hover */}
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95} sticky>
              <div className="text-xs font-sans font-semibold p-0.5 text-ink-900">
                <span className="flex items-center gap-1">
                  {isCritical ? "🔥" : "📍"} {w.name}
                </span>
                <span className="text-[10px] text-slate-600 block mt-0.5">
                  {w.count} Active Grievances · Avg Sev: {w.avgSeverity}/5
                </span>
              </div>
            </Tooltip>

            {/* Detailed Popup on Click */}
            <Popup className="civicsense-leaflet-popup">
              <div className="p-1 min-w-[220px] text-ink-900 font-sans">
                <div className="flex items-center justify-between border-b border-ink-100 pb-1.5 mb-2">
                  <span className="font-display font-semibold text-xs text-ink-900 flex items-center gap-1.5">
                    {isCritical ? (
                      <Flame size={14} className="text-signal-600 animate-pulse" />
                    ) : (
                      <ShieldAlert size={14} className="text-marigold-600" />
                    )}
                    {w.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCritical
                        ? "bg-signal-100 text-signal-800"
                        : w.riskLevel === "medium"
                        ? "bg-marigold-100 text-marigold-800"
                        : "bg-moss-100 text-moss-800"
                    }`}
                  >
                    {isCritical ? t("map_critical_hotspot") : t("map_density_high")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-ink-50 p-2 rounded-xl mb-2">
                  <div>
                    <span className="text-[10px] text-slate2 block uppercase font-mono">
                      Active Cases
                    </span>
                    <span className="font-bold text-ink-900 text-sm">{w.count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate2 block uppercase font-mono">
                      Avg Severity
                    </span>
                    <span className="font-bold text-ink-900 text-sm">{w.avgSeverity} / 5</span>
                  </div>
                </div>

                {w.criticalCount > 0 && (
                  <p className="text-[11px] text-signal-600 font-medium flex items-center gap-1 mb-1">
                    <AlertTriangle size={12} /> {w.criticalCount} Critical (Sev 4–5) tickets in
                    this ward.
                  </p>
                )}

                <div className="text-[10px] text-slate2 font-mono mt-1">
                  Coordinates: {w.lat.toFixed(4)}, {w.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
