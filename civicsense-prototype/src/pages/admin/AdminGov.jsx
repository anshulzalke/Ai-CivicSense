import React, { useEffect, useState } from "react";
import {
  History,

  Eye,
  CheckCircle2,
  UserCheck,
  X,
  Clock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { api, getImageUrl } from "../../lib/api";
import { timeAgo } from "../../lib/logic";
import Seal from "../../components/Seal";

import StatusPill from "../../components/StatusPill";
import ResolutionAuditModal from "../../components/ResolutionAuditModal";

export default function AdminGov() {
  const { departments = [], complaints = [], validateResolution } = useApp();
  const { t, getCategoryLabel } = useLanguage();
  const [officialsPerf, setOfficialsPerf] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyOfficer, setHistoryOfficer] = useState(null);
  const [inspectComplaint, setInspectComplaint] = useState(null);
  const [flagSuccessMsg, setFlagSuccessMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const perf = await api.admin.getGovPerformance();
        if (mounted) setOfficialsPerf(perf || []);
      } catch (err) {
        console.warn("Failed to load gov performance:", err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter complaints resolved or assigned to the selected officer
  const officerComplaints = (complaints || []).filter((c) => {
    if (!historyOfficer) return false;
    const matchesId =
      c.assignedOfficerId === historyOfficer.id ||
      c.assigned_officer_id === historyOfficer.id;
    const matchesDept = c.category === (historyOfficer.department || historyOfficer.dept);
    return matchesId || (matchesDept && (c.status === "closed" || c.status === "resolved_pending_validation"));
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          {t("admin_gov_title")}
        </h1>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const perf = await api.admin.getGovPerformance();
              setOfficialsPerf(perf || []);
            } finally {
              setLoading(false);
            }
          }}
          className="text-xs px-3 py-1.5 rounded-xl border border-ink-200 hover:bg-ink-50 font-medium cursor-pointer transition-colors"
        >
          {loading ? t("admin_syncing") : t("btn_refresh")}
        </button>
      </div>
      <p className="text-sm text-slate2 mb-8">{t("admin_gov_sub")}</p>

      {flagSuccessMsg && (
        <div className="mb-4 p-3 rounded-xl bg-moss-50 border border-moss-200 text-moss-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={15} className="text-moss-600 shrink-0" />
          {flagSuccessMsg}
        </div>
      )}

      <div className="space-y-3">
        {officialsPerf.length === 0 && !loading && (
          <div className="p-8 bg-white border border-ink-100 rounded-2xl text-center shadow-2xs">
            <p className="text-sm text-slate2">{t("admin_no_records")}</p>
          </div>
        )}

        {officialsPerf.map((o) => {
          const dept = (departments || []).find(
            (d) => d.id === (o.department || o.dept)
          );
          const rate =
            o.resolutionRate ??
            (o.assigned_count > 0
              ? Math.round((o.closed_count / o.assigned_count) * 100)
              : 0);

          return (
            <div
              key={o.id}
              className="bg-white border border-ink-100 rounded-2xl p-4 shadow-2xs space-y-3 hover:border-ink-200 transition-all"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium text-ink-900">{o.name}</p>
                  <p className="text-xs text-slate2 font-mono">
                    {getCategoryLabel(dept?.id || o.department || o.dept)} · Level{" "}
                    {o.level}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-semibold text-ink-900">
                    {rate}%
                  </p>
                  <p className="text-[11px] text-slate2">{t("gov_rate")}</p>
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full bg-moss-600 transition-all duration-500"
                  style={{ width: `${rate}%` }}
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                <div className="flex gap-4 text-xs text-slate2 font-mono">
                  <span>
                    {o.assigned_count ?? o.assignedCount ?? 0} {t("gov_assigned")}
                  </span>
                  <span>
                    {o.closed_count ?? o.closedCount ?? 0} {t("gov_closed")}
                  </span>
                </div>

                {/* View Resolution History Action */}
                <button
                  type="button"
                  onClick={() => setHistoryOfficer(o)}
                  className="px-3 py-1.5 rounded-lg bg-ink-50 hover:bg-ink-900 hover:text-paper text-xs font-semibold text-ink-900 border border-ink-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <History size={13} />
                  <span>{t("admin_view_history")}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Resolution History Modal */}
      {historyOfficer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-ink-100 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-6 py-4 border-b border-ink-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink-900 text-paper flex items-center justify-center">
                  <UserCheck size={20} className="text-marigold-400" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink-900">
                    {historyOfficer.name} · {t("admin_view_history")}
                  </h2>
                  <p className="text-xs text-slate2 font-mono">
                    {getCategoryLabel(historyOfficer.department || historyOfficer.dept)} · Officer
                    Level {historyOfficer.level}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setHistoryOfficer(null)}
                className="w-8 h-8 rounded-full bg-ink-50 hover:bg-ink-100 text-slate2 hover:text-ink-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {officerComplaints.length === 0 ? (
                <div className="p-8 text-center bg-ink-50/50 rounded-xl border border-ink-100">
                  <p className="text-xs text-slate2">
                    {t("admin_no_resolved_grievances")}
                  </p>
                </div>
              ) : (
                officerComplaints.map((c) => {
                  const beforeThumb = getImageUrl(c.imageUrl || c.image_url);
                  const afterThumb = getImageUrl(
                    c.resolutionImageUrl || c.resolution_image_url
                  );

                  return (
                    <div
                      key={c.token}
                      className="p-4 bg-white border border-ink-100 rounded-xl shadow-2xs hover:border-ink-200 transition-all flex items-center justify-between flex-wrap gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Seal severity={c.severity} size={40} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-slate2 font-semibold">
                              {c.token}
                            </span>
                            <StatusPill status={c.status} />
                          </div>
                          <p className="font-display font-medium text-ink-900 text-sm truncate mt-0.5">
                            {c.title}
                          </p>
                          <p className="text-xs text-slate2 font-mono flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> {timeAgo(c.resolvedAt || c.updatedAt || c.lastActionAt)}
                          </p>
                        </div>
                      </div>

                      {/* Photo Previews & Inspection Button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                          {beforeThumb && (
                            <img
                              src={beforeThumb}
                              alt="Before"
                              className="w-11 h-11 object-cover rounded-lg border border-ink-200"
                              title="Before Evidence"
                            />
                          )}
                          {afterThumb && (
                            <img
                              src={afterThumb}
                              alt="After Proof"
                              className="w-11 h-11 object-cover rounded-lg border border-moss-300 ring-2 ring-moss-500/20"
                              title="Official Resolution Proof Photo"
                            />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectComplaint(c)}
                          className="px-3 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-700 text-paper text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye size={13} />
                          <span>{t("admin_inspect_btn")}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-3.5 bg-ink-50/50 border-t border-ink-100 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryOfficer(null)}
                className="px-5 py-2 rounded-xl bg-ink-900 text-paper text-xs font-semibold hover:bg-ink-700 transition-colors cursor-pointer"
              >
                {t("btn_close") || "Close"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Resolution Audit Dossier Modal for deep inspection & flag */}
      {inspectComplaint && (
        <ResolutionAuditModal
          complaint={inspectComplaint}
          officer={historyOfficer}
          onClose={() => setInspectComplaint(null)}
          onReopen={async (token, reason) => {
            await validateResolution(token, false);
            setFlagSuccessMsg(`Grievance ${token} flagged and reopened for field rework.`);
            setTimeout(() => setFlagSuccessMsg(""), 5000);
          }}
        />
      )}
    </div>
  );
}
