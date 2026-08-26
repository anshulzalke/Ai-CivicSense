import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Layers, Filter, MapPin, Flame } from "lucide-react";
import { deriveEscalation, severityColor, severityLabel } from "../lib/logic";
import HeatmapLayer from "./HeatmapLayer";
import { useLanguage } from "../context/LanguageContext";
import { getImageUrl } from "../lib/api";

function createCustomPin(color, severity, isEscalated) {
  const pinHtml = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      ${
        isEscalated
          ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(193, 68, 58, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
          : ""
      }
      <div style="
        width: 28px;
        height: 28px;
        background-color: ${color};
        border: 2.5px solid #FFFFFF;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 11px;
          font-family: monospace;
        ">${severity}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: pinHtml,
    className: "custom-leaflet-pin",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
}

function AutoFitBounds({ complaints }) {
  const map = useMap();

  useEffect(() => {
    if (!complaints || complaints.length === 0) return;
    const valid = complaints.filter((c) => c.lat && c.lng && !isNaN(c.lat) && !isNaN(c.lng));
    if (valid.length === 0) return;

    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 14, { animate: true });
    } else {
      const bounds = L.latLngBounds(valid.map((c) => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    }
  }, [complaints, map]);

  return null;
}

const DEFAULT_PUNE_CENTER = [18.5204, 73.8567];

const MAP_LAYERS = {
  street: {
    name: "Street View",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    name: "Satellite View",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
};

export function matchesCategory(itemCat, filterCat) {
  if (!filterCat || filterCat === "all") return true;
  const normalized = (itemCat || "").toLowerCase();
  const filter = filterCat.toLowerCase();
  if (filter === "potholes" || filter === "road") {
    return ["potholes", "pothole", "road", "road_damage", "infrastructure"].includes(normalized);
  }
  if (filter === "garbage" || filter === "solid_waste") {
    return ["garbage", "solid_waste", "sanitation", "waste"].includes(normalized);
  }
  if (filter === "streetlights" || filter === "streetlight") {
    return ["streetlights", "streetlight", "electrical", "electricity", "lighting"].includes(normalized);
  }
  if (filter === "drainage" || filter === "water") {
    return ["drainage", "water", "waterlogging", "sewage", "flooding"].includes(normalized);
  }
  return normalized === filter;
}

export default function LiveLeafletMap({
  complaints = [],
  height = 420,
  showFilters = true,
  selectedCategory = "all",
  onCategoryChange,
  onSelectToken,
}) {
  const { t, getStatusLabel, getCategoryLabel } = useLanguage();
  const [mapType, setMapType] = useState("street");
  const [viewMode, setViewMode] = useState("pins"); // "pins" | "heatmap"
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory || "all");

  // Keep in sync with parent category selection (e.g. Admin Department Pills)
  useEffect(() => {
    if (selectedCategory !== undefined) {
      setCategoryFilter(selectedCategory);
    }
  }, [selectedCategory]);

  const handleCategorySelect = (newCat) => {
    setCategoryFilter(newCat);
    if (onCategoryChange) {
      onCategoryChange(newCat);
    }
  };

  const filteredComplaints = useMemo(() => {
    return (complaints || []).filter((c) => {
      if (!c.lat || !c.lng || isNaN(c.lat) || isNaN(c.lng)) return false;
      if (categoryFilter !== "all" && !matchesCategory(c.category, categoryFilter)) return false;
      if (statusFilter !== "all") {
        const { effectiveStatus } = deriveEscalation(c);
        if (effectiveStatus !== statusFilter && c.status !== statusFilter) return false;
      }
      return true;
    });
  }, [complaints, categoryFilter, statusFilter]);

  const activeLayer = MAP_LAYERS[mapType] || MAP_LAYERS.street;

  return (
    <div className="space-y-2.5">
      {/* Top Filter & View Mode Switcher Bar */}
      {showFilters && (
        <div className="flex items-center justify-between flex-wrap gap-2 bg-white border border-ink-100 p-2.5 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate2 flex items-center gap-1 font-mono uppercase tracking-wider">
              <Filter size={12} /> {t("map_filter_category")}:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-ink-100 bg-white text-ink-900 font-medium outline-none focus:border-marigold-400"
            >
              <option value="all">{t("cat_all")}</option>
              <option value="potholes">Road &amp; Potholes</option>
              <option value="garbage">Solid Waste / Garbage</option>
              <option value="streetlights">Electrical / Streetlights</option>
              <option value="drainage">Water &amp; Drainage</option>
            </select>

            <span className="text-xs font-medium text-slate2 flex items-center gap-1 font-mono uppercase tracking-wider pl-2">
              {t("map_filter_status")}:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-ink-100 bg-white text-ink-900 font-medium outline-none focus:border-marigold-400"
            >
              <option value="all">{t("status_all")}</option>
              <option value="submitted">{t("status_submitted")}</option>
              <option value="in_progress">{t("status_in_progress")}</option>
              <option value="escalated">{t("status_escalated")}</option>
              <option value="resolved_pending_validation">{t("status_resolved_pending_validation")}</option>
              <option value="closed">{t("status_closed")}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Pins vs Heatmap View Toggle */}
            <div className="flex items-center gap-1 bg-ink-50 p-1 rounded-lg border border-ink-100">
              <button
                type="button"
                onClick={() => setViewMode("pins")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === "pins"
                    ? "bg-white text-ink-900 shadow-2xs font-semibold"
                    : "text-slate2 hover:text-ink-900"
                }`}
              >
                <MapPin size={12} className="text-marigold-600" /> {t("map_view_pins")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("heatmap")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === "heatmap"
                    ? "bg-signal-600 text-white shadow-2xs font-semibold"
                    : "text-slate2 hover:text-ink-900"
                }`}
              >
                <Flame size={12} className={viewMode === "heatmap" ? "text-white" : "text-signal-600"} />
                {t("map_view_heatmap")}
              </button>
            </div>

            {/* Street / Satellite Toggle */}
            <div className="flex items-center gap-1 bg-ink-50 p-1 rounded-lg border border-ink-100">
              <button
                type="button"
                onClick={() => setMapType("street")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  mapType === "street"
                    ? "bg-white text-ink-900 shadow-2xs font-semibold"
                    : "text-slate2 hover:text-ink-900"
                }`}
              >
                <Layers size={12} /> {t("map_street_view")}
              </button>
              <button
                type="button"
                onClick={() => setMapType("satellite")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  mapType === "satellite"
                    ? "bg-ink-900 text-paper shadow-2xs font-semibold"
                    : "text-slate2 hover:text-ink-900"
                }`}
              >
                <Layers size={12} /> {t("map_satellite_view")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaflet Map Frame */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-ink-100 shadow-sm z-0"
        style={{ height }}
      >
        <MapContainer
          key={mapType}
          center={DEFAULT_PUNE_CENTER}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer attribution={activeLayer.attribution} url={activeLayer.url} />

          <AutoFitBounds complaints={filteredComplaints} />

          {/* Conditional Layer: Heatmap vs Individual Pins */}
          {viewMode === "heatmap" ? (
            <HeatmapLayer complaints={filteredComplaints} />
          ) : (
            filteredComplaints.map((c) => {
              const { effectiveStatus, effectiveLevel } = deriveEscalation(c);
              const color = severityColor(c.severity);
              const isEscalated = effectiveLevel > 0 && c.status !== "closed";
              const pinIcon = createCustomPin(color, c.severity, isEscalated);
              const categoryName = getCategoryLabel(c.category);
              const statusText = getStatusLabel(effectiveStatus);
              const imgUrl = getImageUrl(c.imageUrl || c.image_url);

              return (
                <Marker
                  key={c.token}
                  position={[c.lat, c.lng]}
                  icon={pinIcon}
                  eventHandlers={{
                    click: () => onSelectToken?.(c.token),
                  }}
                >
                  <Popup className="civicsense-leaflet-popup">
                    <div className="p-1 min-w-[220px] max-w-[260px] text-ink-900 font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-ink-100 pb-1.5 mb-2">
                        <span className="font-mono text-xs font-bold text-ink-900">{c.token}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            c.status === "closed"
                              ? "bg-moss-100 text-moss-800"
                              : effectiveLevel > 0
                              ? "bg-signal-100 text-signal-800"
                              : "bg-marigold-100 text-marigold-800"
                          }`}
                        >
                          {statusText}
                        </span>
                      </div>

                      {imgUrl && (
                        <img
                          src={imgUrl}
                          alt="Evidence thumbnail"
                          className="w-full h-24 object-cover rounded-lg mb-2 border border-ink-100"
                        />
                      )}

                      <p className="text-xs font-semibold text-ink-900 mb-1 leading-snug">{c.title}</p>
                      {c.description && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                          {c.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono tracking-wider">
                            {t("map_category")}
                          </span>
                          <span className="font-medium text-slate-800">{categoryName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono tracking-wider">
                            {t("map_severity")}
                          </span>
                          <span className="font-medium text-slate-800">
                            {c.severity} ({severityLabel(c.severity)})
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-slate2 flex items-center gap-1 font-mono">
                        <MapPin size={10} /> {c.lat?.toFixed(4)}, {c.lng?.toFixed(4)}
                      </div>

                      {effectiveLevel > 0 && c.status !== "closed" && (
                        <div className="mt-2 text-[10px] font-medium text-signal-700 bg-signal-50 px-2 py-1 rounded border border-signal-200">
                          ⚠️ SLA Auto-Escalated to Level {effectiveLevel}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })
          )}
        </MapContainer>

        {/* Dynamic Legend */}
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs border border-ink-100 rounded-xl px-3.5 py-2 shadow-md text-xs pointer-events-auto">
          {viewMode === "heatmap" ? (
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-moss-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4C7A5E]" /> {t("map_heat_legend_low")}
              </span>
              <span className="text-slate2">→</span>
              <span className="flex items-center gap-1 text-marigold-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8A33D]" /> {t("map_heat_legend_med")}
              </span>
              <span className="text-slate2">→</span>
              <span className="flex items-center gap-1 text-signal-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C1443A] animate-pulse" /> {t("map_heat_legend_crit")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[11px] text-ink-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C1443A]" /> {t("cat_potholes")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4C7A5E]" /> {t("cat_garbage")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3D4C6B]" /> {t("cat_drainage")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

