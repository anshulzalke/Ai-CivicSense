import React, { useEffect, useState } from "react";
import { ScrollText, RefreshCcw, Eye, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { timeAgo } from "../../lib/logic";
import ResolutionAuditModal from "../../components/ResolutionAuditModal";

export default function AdminAuditLog() {
  const { audit = [], fetchAuditLog, complaints = [], validateResolution } = useApp();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        await fetchAuditLog();
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [fetchAuditLog]);

  function getComplaintForEntry(entry) {
    if (!complaints || complaints.length === 0) return null;
    // Extract token code from string if present
    const match = entry.action?.match(/(CS-[A-Z0-9-]+|PUN-[A-Z0-9-]+|[A-Z]{2,5}-\d{4}-[A-Z0-9]+)/i);
    const token = entry.token || (match ? match[0] : null);
    if (token) {
      const found = complaints.find(
        (c) => c.token?.toLowerCase() === token?.toLowerCase()
      );
      if (found) return found;
    }
    // Fallback to any resolved or open complaint
    return (
      complaints.find(
        (c) =>
          c.resolutionImageUrl ||
          c.status === "closed" ||
          c.status === "resolved_pending_validation"
      ) || complaints[0]
    );
  }

  function handleInspect(entry) {
    const matched = getComplaintForEntry(entry);
    setSelectedAudit(entry);
    setSelectedComplaint(matched);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          {t("admin_audit_title")}
        </h1>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              await fetchAuditLog();
            } finally {
              setLoading(false);
            }
          }}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-ink-200 hover:bg-ink-50 font-medium text-slate2 cursor-pointer transition-colors"
        >
          <RefreshCcw size={12} className={loading ? "animate-spin" : ""} />
          {loading ? t("admin_syncing") : t("admin_refresh_log")}
        </button>
      </div>
      <p className="text-sm text-slate2 mb-8">{t("admin_audit_sub")}</p>

      <div className="bg-white border border-ink-100 rounded-2xl divide-y divide-ink-100 shadow-2xs">
        {audit.length === 0 && !loading && (
          <div className="p-8 text-center text-sm text-slate2">{t("admin_no_records")}</div>
        )}
        {audit.map((entry) => {
          const isResolution =
            entry.action?.toLowerCase().includes("resolv") ||
            entry.action?.toLowerCase().includes("assign") ||
            entry.action?.toLowerCase().includes("clos") ||
            entry.action?.toLowerCase().includes("validat");

          return (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-ink-50/40 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isResolution
                      ? "bg-moss-100 text-moss-700"
                      : "bg-ink-50 text-ink-500"
                  }`}
                >
                  {isResolution ? <ShieldCheck size={15} /> : <ScrollText size={14} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-ink-900 font-medium leading-snug">
                    {entry.action}
                  </p>
                  <p className="text-xs text-slate2 mt-0.5 font-mono">
                    {entry.actor} · {timeAgo(entry.at || entry.created_at)}
                  </p>
                </div>
              </div>

              {/* Inspect Button */}
              <button
                type="button"
                onClick={() => handleInspect(entry)}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-ink-50 hover:bg-ink-900 hover:text-paper text-xs font-semibold text-ink-900 border border-ink-200 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                title={t("admin_inspect_resolution")}
              >
                <Eye size={13} />
                <span className="hidden sm:inline">{t("admin_inspect_btn")}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Resolution Audit Dossier Modal */}
      {selectedComplaint && (
        <ResolutionAuditModal
          complaint={selectedComplaint}
          auditEntry={selectedAudit}
          onClose={() => {
            setSelectedComplaint(null);
            setSelectedAudit(null);
          }}
          onReopen={async (token, reason) => {
            await validateResolution(token, false);
            await fetchAuditLog();
          }}
        />
      )}
    </div>
  );
}
