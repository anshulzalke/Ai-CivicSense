import React from "react";
import { MapPin, Clock } from "lucide-react";
import Seal from "./Seal";
import StatusPill from "./StatusPill";
import { deriveEscalation, timeAgo } from "../lib/logic";
import { useLanguage } from "../context/LanguageContext";

export default function ComplaintCard({ complaint, onClick, right }) {
  const { getCategoryLabel } = useLanguage();
  const { effectiveStatus, effectiveLevel } = deriveEscalation(complaint);

  return (
    <button
      onClick={onClick}
      className="ticket-notch w-full text-left bg-white border border-ink-100 rounded-xl p-4 flex items-center gap-4 hover:border-marigold-400 hover:shadow-sm transition-all cursor-pointer"
    >
      <Seal severity={complaint.severity} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-slate2">{complaint.token}</span>
          <StatusPill status={effectiveStatus} />
          {effectiveLevel > 0 && effectiveStatus !== "closed" && (
            <span className="text-[11px] font-mono text-signal-600 font-semibold">
              L{effectiveLevel} Escalation
            </span>
          )}
        </div>
        <p className="font-display text-ink-900 font-medium truncate mt-0.5">{complaint.title}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate2">
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {getCategoryLabel(complaint.category)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {timeAgo(complaint.createdAt)}
          </span>
        </div>
      </div>
      {right}
    </button>
  );
}
