import React, { useState } from "react";
import MiniMap from "../../components/MiniMap";
import Seal from "../../components/Seal";
import StatusPill from "../../components/StatusPill";
import { useApp } from "../../context/AppContext";
import { deriveEscalation } from "../../lib/logic";

export default function LiveMapPage() {
  const { complaints } = useApp();
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">Live map</h1>
      <p className="text-sm text-slate2 mb-6">All reported issues across the district, colored by severity.</p>

      <MiniMap complaints={complaints} height={420} onSelect={setSelected} />

      {selected && (
        <div className="mt-5 bg-white border border-ink-100 rounded-xl p-4 flex items-center gap-4">
          <Seal severity={selected.severity} size={48} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono2 text-xs text-slate2">{selected.token}</span>
              <StatusPill status={deriveEscalation(selected).effectiveStatus} />
            </div>
            <p className="font-display font-medium text-ink-900">{selected.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
