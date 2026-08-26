import React, { useState } from "react";
import { toBoxPercent, severityColor, deriveEscalation } from "../lib/logic";
import { POIS } from "../lib/mockData";

// Placeholder live-map view. Renders complaint + POI positions on a
// normalized district grid. Swap this component out for a real
// Google Maps JavaScript API <Map> once an API key is configured —
// the lat/lng data model is already API-ready.
export default function MiniMap({ complaints, height = 340, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const safePOIS = Array.isArray(POIS) ? POIS : [];

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-ink-100 paper-texture"
      style={{ height, background: "linear-gradient(135deg, #EEF1F6 0%, #F7F5EF 60%)" }}
    >
      <div className="absolute inset-0 opacity-40">
        {[20, 40, 60, 80].map((v) => (
          <div key={"h" + v} className="absolute left-0 right-0 border-t border-ink-300/30" style={{ top: `${v}%` }} />
        ))}
        {[20, 40, 60, 80].map((v) => (
          <div key={"v" + v} className="absolute top-0 bottom-0 border-l border-ink-300/30" style={{ left: `${v}%` }} />
        ))}
      </div>

      {safePOIS.map((poi) => {
        if (!poi) return null;
        const { x, y } = toBoxPercent(poi.lat, poi.lng);
        return (
          <div
            key={poi.name || `${poi.lat}-${poi.lng}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={poi.name || "POI"}
          >
            <div className="w-2 h-2 rounded-full bg-ink-500 ring-2 ring-ink-100" />
          </div>
        );
      })}

      {safeComplaints.map((c) => {
        if (!c) return null;
        const { x, y } = toBoxPercent(c.lat, c.lng);
        const { effectiveLevel } = deriveEscalation(c);
        const color = severityColor(c.severity || 3);
        const isHovered = hovered === c.token;
        return (
          <button
            key={c.token || `${c.lat}-${c.lng}`}
            type="button"
            onClick={() => onSelect?.(c)}
            onMouseEnter={() => setHovered(c.token)}
            onMouseLeave={() => setHovered(null)}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-transform cursor-pointer"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: isHovered ? 22 : 16,
              height: isHovered ? 22 : 16,
              background: color,
              boxShadow: effectiveLevel > 0 ? `0 0 0 4px ${color}33` : "none",
            }}
          >
            {isHovered && (
              <span className="absolute bottom-full mb-1 whitespace-nowrap bg-ink-900 text-paper text-[11px] font-mono px-2 py-1 rounded shadow-md z-10">
                {c.token} · {c.title}
              </span>
            )}
          </button>
        );
      })}

      <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate2 bg-paper/80 px-2 py-1 rounded">
        placeholder map · swap in Google Maps API
      </div>
    </div>
  );
}

