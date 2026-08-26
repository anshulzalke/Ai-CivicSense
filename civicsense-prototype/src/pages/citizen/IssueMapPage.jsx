import React from "react";
import { useNavigate } from "react-router-dom";
import { Map } from "lucide-react";

import LiveLeafletMap from "../../components/LiveLeafletMap";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import ErrorBoundary from "../../components/ErrorBoundary";

export default function IssueMapPage() {
  const { complaints } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  return (
    <ErrorBoundary title="Live Map Encountered an Issue">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900 flex items-center gap-2">
              <Map size={22} className="text-marigold-600" />
              {t?.("nav_live_map") || "District Issue Map"}
            </h1>
            <p className="text-sm text-slate2 mt-0.5">
              {t?.("section_live_map_sub") || "Real-time geographical telemetry of citywide civic tickets"}
            </p>
          </div>
        </div>

        <LiveLeafletMap
          complaints={safeComplaints}
          height={540}
          showFilters={true}
          onSelectToken={(token) => navigate(`/citizen/track?token=${token}`)}
        />
      </div>
    </ErrorBoundary>
  );
}

