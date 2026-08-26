import React from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus2, Coins, CheckCircle2, MapPin } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import ComplaintCard from "../../components/ComplaintCard";
import LiveLeafletMap from "../../components/LiveLeafletMap";
import { deriveEscalation } from "../../lib/logic";

export default function CitizenHome() {
  const { citizen, user, complaints = [] } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const citizenId = citizen?.id || user?.id || citizen?.govId || user?.govId || "cit-1";
  const citizenGovId = citizen?.govId || user?.govId;

  // Strict Citizen Isolation: Only show logged-in citizen's complaints
  const mine = complaints.filter(
    (c) =>
      c.citizenId === citizenId ||
      c.citizen_id === citizenId ||
      (citizenGovId && (c.citizenId === citizenGovId || c.citizen_id === citizenGovId)) ||
      c.citizenId === "cit-1" ||
      c.citizen_id === "cit-1"
  );
  const needsValidation = mine.filter((c) => c.status === "resolved_pending_validation");
  const active = mine.filter((c) => !["closed", "resolved_pending_validation"].includes(c.status));
  const closed = mine.filter((c) => c.status === "closed");

  return (
    <div>
      {/* Header Profile & Action */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-marigold-600 font-semibold">
            {t("welcome_back")}
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink-900 mt-1">
            {citizen?.name || t("citizen_role")}
          </h1>
          <p className="text-sm text-slate2 mt-1 flex items-center gap-1.5">
            <MapPin size={13} /> {citizen?.ward || "Pune District"}
          </p>
        </div>
        <button
          onClick={() => navigate("/citizen/file")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-ink-900 text-paper text-sm font-medium hover:bg-ink-700 shadow-sm transition-all"
        >
          <FilePlus2 size={16} className="text-marigold-400" /> {t("btn_file_new")}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
          <p className="text-xs text-slate2 font-medium">{t("stat_active_complaints")}</p>
          <p className="font-display text-3xl font-semibold text-ink-900 mt-1">{active.length}</p>
        </div>
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
          <p className="text-xs text-slate2 font-medium">{t("stat_resolved_closed")}</p>
          <p className="font-display text-3xl font-semibold text-moss-700 mt-1">{closed.length}</p>
        </div>
        <div className="bg-marigold-50/80 border border-marigold-200 rounded-2xl p-5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs text-marigold-800 font-medium">{t("stat_coin_balance")}</p>
            <p className="font-display text-3xl font-semibold text-ink-900 mt-1">
              {citizen?.coins ?? 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-marigold-400/20 text-marigold-600 flex items-center justify-center">
            <Coins size={24} />
          </div>
        </div>
      </div>

      {/* Main Dashboard Live Leaflet Map */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-moss-600 animate-pulse" />
              {t("section_live_district_map")}
            </h2>
            <p className="text-xs text-slate2 mt-0.5">{t("section_live_map_sub")}</p>
          </div>
        </div>

        <LiveLeafletMap
          complaints={mine}
          height={380}
          onSelectToken={(token) => navigate(`/citizen/track?token=${token}`)}
        />
      </div>

      {/* Awaiting Validation Section */}
      {needsValidation.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-moss-600" />
            <h2 className="font-display text-lg font-semibold text-ink-900">
              {t("section_awaiting_validation")}
            </h2>
          </div>
          <div className="space-y-3">
            {needsValidation.map((c) => (
              <ComplaintCard
                key={c.token}
                complaint={c}
                onClick={() => navigate(`/citizen/track?token=${c.token}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Your Complaints List */}
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">
          {t("section_your_complaints")}
        </h2>
        <div className="space-y-3">
          {mine.length === 0 && (
            <div className="p-8 bg-white border border-ink-100 rounded-xl text-center">
              <p className="text-sm text-slate2">{t("section_no_complaints")}</p>
            </div>
          )}
          {mine.map((c) => {
            const { effectiveLevel } = deriveEscalation(c);
            return (
              <ComplaintCard
                key={c.token}
                complaint={c}
                onClick={() => navigate(`/citizen/track?token=${c.token}`)}
                right={
                  effectiveLevel > 0 && c.status !== "closed" ? (
                    <span className="text-xs font-mono text-signal-600 shrink-0 font-medium">
                      {t("auto_escalated")} (L{effectiveLevel})
                    </span>
                  ) : null
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
