import React, { useState } from "react";
import LiveLeafletMap from "../../components/LiveLeafletMap";
import Seal from "../../components/Seal";
import StatusPill from "../../components/StatusPill";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { deriveEscalation } from "../../lib/logic";

export default function LiveMapPage() {
  const { complaints = [] } = useApp();
  const { t, getCategoryLabel } = useLanguage();
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const selected = complaints.find((c) => c.token === selectedToken);

  const categoryChips = [
    { id: "all", label: t("cat_all") || "All", color: "bg-slate-500" },
    { id: "potholes", label: getCategoryLabel("potholes"), color: "bg-[#EF4444]" },
    { id: "garbage", label: getCategoryLabel("garbage"), color: "bg-[#10B981]" },
    { id: "drainage", label: getCategoryLabel("drainage"), color: "bg-[#06B6D4]" },
    { id: "streetlights", label: getCategoryLabel("streetlights"), color: "bg-[#F59E0B]" },
  ];

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            {t("nav_live_map") || "Live Map"}
          </h1>
          <p className="text-sm text-slate2">
            All reported civic issues across Pune district, colored by category pin standards.
          </p>
        </div>

        {/* 4 Category Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {categoryChips.map((chip) => {
            const active = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedCategory(chip.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-ink-900 text-paper shadow-xs"
                    : "bg-white border border-ink-100 text-slate2 hover:border-ink-300 hover:text-ink-900"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${chip.color}`} />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <LiveLeafletMap
        complaints={complaints}
        height={460}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onSelectToken={setSelectedToken}
      />

      {selected && (
        <div className="mt-5 bg-white border border-ink-100 rounded-xl p-4 flex items-center gap-4 shadow-sm animate-in fade-in duration-200">
          <Seal severity={selected.severity} size={48} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-ink-900">{selected.token}</span>
              <StatusPill status={deriveEscalation(selected).effectiveStatus} />
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                {getCategoryLabel(selected.category)}
              </span>
            </div>
            <p className="font-display font-medium text-ink-900 truncate">{selected.title}</p>
            {selected.description && (
              <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{selected.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
