import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  UserCog,
  FileText,
  Clock,
  Coins,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Star,
  Tag,
} from "lucide-react";

import Seal from "./Seal";
import StatusPill from "./StatusPill";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";
import { getImageUrl } from "../lib/api";
import { timeAgo, severityLabel } from "../lib/logic";

export default function ResolutionAuditModal({
  complaint,
  auditEntry,
  officer,
  onClose,
  onReopen,
}) {
  const { t, getCategoryLabel } = useLanguage();
  const { notifyComplaintEscalated } = useNotification();


  const [showFlagBox, setShowFlagBox] = useState(false);
  const [selectedTag, setSelectedTag] = useState("tag_incomplete_repair");
  const [flagReason, setFlagReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);

  if (!complaint) return null;

  const resolvingOfficer =
    officer || {
      name: auditEntry?.actor || "Municipal Official",
      department: complaint.category,
      level: 2,
    };

  const beforePhoto = getImageUrl(complaint.imageUrl || complaint.image_url);
  const afterPhoto = getImageUrl(
    complaint.resolutionImageUrl ||
      complaint.resolution_image_url ||
      "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80"
  );

  const quickTags = [
    { key: "tag_photo_mismatch", label: t("tag_photo_mismatch") },
    { key: "tag_incomplete_repair", label: t("tag_incomplete_repair") },
    { key: "tag_poor_materials", label: t("tag_poor_materials") },
    { key: "tag_issue_reappeared", label: t("tag_issue_reappeared") },
    { key: "tag_other", label: t("tag_other") },
  ];

  async function handleFlagSubmit() {
    if (!onReopen) return;
    setProcessing(true);
    try {
      const activeTagLabel = quickTags.find((tItem) => tItem.key === selectedTag)?.label || "";
      const fullReason = flagReason.trim()
        ? `${activeTagLabel}: ${flagReason.trim()}`
        : activeTagLabel || "Inadequate resolution / photo mismatch flagged by Admin.";

      await onReopen(complaint.token, fullReason);
      notifyComplaintEscalated?.({
        token: complaint.token,
        reason: fullReason,
        level: 2,
        phone: "+91 83196 09151",
      });
      setFlagSuccess(true);
      setTimeout(() => {
        onClose?.();
      }, 1500);

    } catch (err) {
      console.error("Failed to flag resolution:", err);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-ink-100 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-6 py-4 border-b border-ink-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-900 text-paper flex items-center justify-center shadow-xs">
              <ShieldCheck size={20} className="text-marigold-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900 leading-tight">
                {t("admin_audit_dossier")}
              </h2>
              <p className="text-xs text-slate2 font-mono">
                {complaint.token} · {t("admin_dossier_subtitle")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-ink-50 hover:bg-ink-100 text-slate2 hover:text-ink-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {flagSuccess && (
            <div className="p-3.5 rounded-xl bg-moss-50 border border-moss-200 text-moss-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-moss-600 shrink-0" />
              {t("admin_flag_success")}
            </div>
          )}

          {/* Grievance Overview Card */}
          <div className="p-4 bg-ink-50/60 rounded-xl border border-ink-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Seal severity={complaint.severity} size={44} />
              <div>
                <span className="font-mono text-xs text-slate2 block">{complaint.token}</span>
                <p className="font-display font-bold text-ink-900 text-sm">{complaint.title}</p>
                <p className="text-xs text-slate2 mt-0.5">
                  {getCategoryLabel(complaint.category)} · {t("map_severity")}: {complaint.severity} (
                  {severityLabel(complaint.severity)})
                </p>
              </div>
            </div>
            <StatusPill status={complaint.status} />
          </div>

          {/* Visual Proof Comparison (Before vs After Slider) */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wide text-slate2 mb-2 block font-semibold flex items-center justify-between">
              <span>{t("proof_comparison_title")}</span>
              <span className="text-[11px] font-mono text-moss-700 bg-moss-50 px-2 py-0.5 rounded border border-moss-200">
                Official Evidence Verification
              </span>
            </label>
            <BeforeAfterSlider beforeImage={beforePhoto} afterImage={afterPhoto} height={260} />
          </div>

          {/* Official Resolution Note */}
          <div className="p-4 rounded-xl bg-white border border-ink-200 shadow-2xs space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold flex items-center gap-1.5">
              <FileText size={13} className="text-marigold-600" />
              {t("admin_official_note")}
            </label>
            <p className="text-xs text-ink-900 leading-relaxed font-sans bg-ink-50/50 p-3 rounded-lg border border-ink-100">
              "{complaint.resolutionNote ||
                complaint.resolution_note ||
                "Issue addressed, cleared, and repaired by municipal field team with photographic proof."}"
            </p>
          </div>

          {/* Officer Details & Citizen Validation Grid */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            {/* Resolving Officer Details */}
            <div className="p-3.5 rounded-xl border border-ink-100 bg-ink-50/40 space-y-2">
              <p className="font-mono uppercase tracking-wider text-slate2 text-[11px] font-semibold flex items-center gap-1.5">
                <UserCog size={13} className="text-ink-600" />
                {t("admin_officer_details")}
              </p>
              <div className="space-y-1 text-ink-900">
                <p className="font-bold text-sm">{resolvingOfficer.name}</p>
                <p className="text-slate2">
                  {getCategoryLabel(resolvingOfficer.department || complaint.category)} · Officer L
                  {resolvingOfficer.level || 2}
                </p>
                <p className="text-slate2 font-mono text-[11px] flex items-center gap-1 pt-1">
                  <Clock size={11} /> Resolved {timeAgo(complaint.resolvedAt || complaint.updatedAt || complaint.lastActionAt)}
                </p>
              </div>
            </div>

            {/* Citizen Validation & Coins Status */}
            <div className="p-3.5 rounded-xl border border-ink-100 bg-ink-50/40 space-y-2">
              <p className="font-mono uppercase tracking-wider text-slate2 text-[11px] font-semibold flex items-center gap-1.5">
                <Coins size={13} className="text-marigold-500" />
                {t("admin_citizen_validation")}
              </p>
              <div className="space-y-1">
                {complaint.status === "closed" ? (
                  <span className="inline-flex items-center gap-1 text-moss-700 bg-moss-100 font-bold px-2 py-0.5 rounded text-xs">
                    <CheckCircle2 size={12} /> Citizen Confirmed (+25 Coins Awarded)
                  </span>
                ) : complaint.status === "resolved_pending_validation" ? (
                  <span className="inline-flex items-center gap-1 text-marigold-800 bg-marigold-100 font-medium px-2 py-0.5 rounded text-xs">
                    <Clock size={12} /> Pending Citizen Review (48h SLA)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-signal-700 bg-signal-100 font-bold px-2 py-0.5 rounded text-xs">
                    <AlertTriangle size={12} /> Reopened / Escalated
                  </span>
                )}

                {/* Rating display if rated */}
                {complaint.rating && (
                  <div className="flex items-center gap-1 pt-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={13}
                        className={
                          star <= complaint.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-ink-200"
                        }
                      />
                    ))}
                    <span className="text-[11px] font-mono font-bold text-ink-700 ml-1">
                      {complaint.rating}/5 Stars
                    </span>
                  </div>
                )}

                {complaint.citizenFeedback && (
                  <p className="text-[11px] text-slate2 italic pt-1">
                    "{complaint.citizenFeedback}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Admin Override: Flag & Reopen Resolution with Quick Tags */}
          {onReopen && complaint.status !== "reopened" && (
            <div className="pt-2 border-t border-ink-100">
              {!showFlagBox ? (
                <button
                  type="button"
                  onClick={() => setShowFlagBox(true)}
                  className="px-4 py-2 rounded-xl border border-signal-300 text-signal-700 bg-signal-50 hover:bg-signal-100 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <AlertTriangle size={13} className="text-signal-600" />
                  {t("admin_reopen_flag")}
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-signal-50/70 border border-signal-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-signal-900 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-signal-600" />
                      {t("admin_flag_title")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFlagBox(false)}
                      className="text-xs text-slate2 hover:text-ink-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Preset Quick Tags */}
                  <div>
                    <label className="text-[11px] font-mono text-slate2 mb-1.5 block font-semibold flex items-center gap-1">
                      <Tag size={11} /> {t("feedback_select_reason")}:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {quickTags.map((tag) => (
                        <button
                          key={tag.key}
                          type="button"
                          onClick={() => setSelectedTag(tag.key)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                            selectedTag === tag.key
                              ? "bg-signal-600 text-white border-signal-600 shadow-xs"
                              : "bg-white text-ink-700 border-signal-200 hover:border-signal-400"
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder={t("admin_flag_reason_placeholder")}
                    rows={2}
                    className="w-full p-2.5 rounded-lg border border-signal-200 bg-white text-xs text-ink-900 outline-none focus:border-signal-500"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={processing}
                      onClick={handleFlagSubmit}
                      className="px-4 py-2 rounded-lg bg-signal-600 hover:bg-signal-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60 transition-colors shadow-xs"
                    >
                      {processing ? "Flagging & Escalating..." : t("admin_flag_submit")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Close */}
        <div className="px-6 py-3.5 bg-ink-50/50 border-t border-ink-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-ink-900 text-paper text-xs font-semibold hover:bg-ink-700 transition-colors cursor-pointer"
          >
            {t("btn_close") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
