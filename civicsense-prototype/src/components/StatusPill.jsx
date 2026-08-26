import React from "react";
import { useLanguage } from "../context/LanguageContext";

const STYLES = {
  submitted: "bg-ink-100 text-ink-700",
  in_progress: "bg-marigold-50 text-marigold-600 border border-marigold-200",
  escalated: "bg-signal-400/10 text-signal-600 border border-signal-400/40",
  resolved_pending_validation: "bg-moss-400/10 text-moss-600 border border-moss-400/40",
  closed: "bg-ink-900 text-paper",
  reopened: "bg-signal-600 text-paper",
};

export default function StatusPill({ status }) {
  const { getStatusLabel } = useLanguage();
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-wide ${
        STYLES[status] || "bg-ink-100 text-ink-700"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
