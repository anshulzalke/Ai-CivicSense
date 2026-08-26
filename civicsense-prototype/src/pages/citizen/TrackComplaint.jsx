import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Download,
  Star,
  MessageSquare,
  AlertTriangle,
  X,
} from "lucide-react";


import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotification } from "../../context/NotificationContext";
import { api } from "../../lib/api";

import Seal from "../../components/Seal";
import StatusPill from "../../components/StatusPill";
import BeforeAfterSlider from "../../components/BeforeAfterSlider";
import { downloadPDFReceipt } from "../../lib/pdfReceipt";
import { deriveEscalation, timeAgo } from "../../lib/logic";

const STEPS = ["submitted", "in_progress", "escalated", "resolved_pending_validation", "closed"];

export default function TrackComplaint() {
  const { user, citizen, complaints = [], validateResolution, departments } = useApp();
  const { t, getCategoryLabel, getStatusLabel } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("token") || "");
  const [found, setFound] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const citizenId = citizen?.id || user?.id || citizen?.govId || user?.govId || "cit-1";
  const citizenGovId = citizen?.govId || user?.govId;

  // Strict citizen isolation for grievance tracking
  const myComplaints = complaints.filter(
    (c) =>
      c.citizenId === citizenId ||
      c.citizen_id === citizenId ||
      (citizenGovId && (c.citizenId === citizenGovId || c.citizen_id === citizenGovId)) ||
      c.citizenId === "cit-1" ||
      c.citizen_id === "cit-1"
  );

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      setQuery(token);
      fetchComplaint(token);
    } else if (myComplaints.length > 0 && !found) {
      // Auto-select latest filed grievance by default
      const defaultToken = myComplaints[0].token;
      setQuery(defaultToken);
      setParams({ token: defaultToken });
      fetchComplaint(defaultToken);
    }
  }, [params]);

  async function fetchComplaint(token) {
    if (!token) return;
    setLoading(true);
    try {
      const c = await api.complaints.get(token);
      setFound(c || "not_found");
    } catch (err) {
      console.warn("Complaint lookup error:", err.message);
      if (err.status === 403 || err.message?.includes("Access Denied") || err.message?.includes("permitted")) {
        setFound("restricted");
      } else {
        setFound("not_found");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setParams({ token: query.trim() });
    fetchComplaint(query.trim());
  }

  async function handleValidate(token, payload) {
    try {
      const updated = await validateResolution(token, payload);
      setFound(updated);
      const isSatisfied = typeof payload === "boolean" ? payload : payload?.satisfied;
      setActionSuccess(
        isSatisfied
          ? t("feedback_success_close") || "Resolution confirmed! +25 Civic Coins awarded to your account."
          : t("feedback_success_reopen") || "Issue re-raised! Escalated to higher departmental authority."
      );
      setTimeout(() => setActionSuccess(""), 6000);
    } catch (err) {
      alert(err.message || "Failed to validate resolution.");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">{t("track_title")}</h1>
        <p className="text-sm text-slate2">{t("track_sub")}</p>
      </div>

      {/* Quick Access to My Own Filed Grievances */}
      {myComplaints.length > 0 && (
        <div className="p-3.5 bg-white border border-ink-100 rounded-2xl shadow-2xs space-y-2">
          <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-bold flex items-center justify-between">
            <span>Your Registered Grievances ({myComplaints.length})</span>
            <span className="text-[10px] text-moss-700 bg-moss-50 px-2 py-0.5 rounded border border-moss-200">
              Account Isolated
            </span>
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 thin-scroll">
            {myComplaints.map((mc) => {
              const isSelected = (found?.token || query) === mc.token;
              return (
                <button
                  key={mc.token}
                  type="button"
                  onClick={() => {
                    setQuery(mc.token);
                    setParams({ token: mc.token });
                    fetchComplaint(mc.token);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-ink-900 text-paper border-ink-900 shadow-xs"
                      : "bg-ink-50/70 hover:bg-ink-100 text-slate2 border-ink-100"
                  }`}
                >
                  <span className="font-bold">{mc.token}</span>
                  <span className="opacity-70 text-[10px]">({getCategoryLabel(mc.category)})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("track_placeholder")}
          className="flex-1 px-4 py-2.5 rounded-xl border border-ink-100 bg-white text-sm font-mono focus:border-marigold-400 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-ink-900 text-paper flex items-center gap-2 text-sm font-medium hover:bg-ink-700 disabled:opacity-60 cursor-pointer transition-colors"
        >
          <Search size={14} /> {loading ? t("track_searching") : t("btn_track")}
        </button>
      </form>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-moss-600/10 border border-moss-600/30 flex items-center gap-3 text-sm text-moss-700 font-medium animate-in fade-in duration-300">
          <CheckCircle2 size={18} className="shrink-0 text-moss-600" />
          <p>{actionSuccess}</p>
        </div>
      )}

      {found === "restricted" && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center shadow-2xs space-y-2">
          <AlertCircle size={28} className="mx-auto text-amber-600" />
          <p className="text-sm text-amber-900 font-bold">
            Access Restricted: Confidential Citizen Grievance
          </p>
          <p className="text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
            Grievance token <strong>{query}</strong> was submitted by another citizen. Under the CivicSense Privacy &amp; Data Protection Policy, citizens are only permitted to inspect grievances filed from their own authenticated account.
          </p>
        </div>
      )}

      {found === "not_found" && (
        <div className="p-6 bg-white border border-ink-100 rounded-2xl text-center shadow-2xs">
          <AlertCircle size={24} className="mx-auto text-signal-600 mb-2" />
          <p className="text-sm text-signal-600 font-semibold">
            {t("track_not_found")} "{query}".
          </p>
          <p className="text-xs text-slate2 mt-1">{t("track_double_check")}</p>
        </div>
      )}

      {found && found !== "not_found" && found !== "restricted" && (
        <ComplaintDetail
          complaint={found}
          user={user}
          departments={departments}
          onValidate={handleValidate}
          t={t}
          getCategoryLabel={getCategoryLabel}
          getStatusLabel={getStatusLabel}
        />
      )}
    </div>
  );
}

function ComplaintDetail({ complaint, user, departments, onValidate, t, getCategoryLabel, getStatusLabel }) {
  const { effectiveStatus, effectiveLevel, hoursSinceAction } = deriveEscalation(complaint);
  const stepIndex = STEPS.indexOf(effectiveStatus === "reopened" ? "resolved_pending_validation" : effectiveStatus);
  const dept = departments?.find((d) => d.id === complaint.category);
  const beforeImg = complaint.imageUrl || complaint.image_url;
  const afterImg = complaint.resolutionImageUrl || complaint.resolution_image_url;
  const [downloading, setDownloading] = useState(false);

  // Rating & Feedback State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState("tag_incomplete_repair");
  const [reopenReason, setReopenReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const quickTags = [
    { key: "tag_photo_mismatch", label: t("tag_photo_mismatch") },
    { key: "tag_incomplete_repair", label: t("tag_incomplete_repair") },
    { key: "tag_poor_materials", label: t("tag_poor_materials") },
    { key: "tag_issue_reappeared", label: t("tag_issue_reappeared") },
    { key: "tag_other", label: t("tag_other") },
  ];

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadPDFReceipt(complaint, user);
    } catch (e) {
      console.error("PDF download error:", e);
    } finally {
      setDownloading(false);
    }
  }

  async function handleSatisfiedSubmit() {
    setSubmitting(true);
    try {
      await onValidate(complaint.token, {
        satisfied: true,
        rating,
        feedback: feedback.trim() || "Satisfied with municipal resolution work.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const { notifyComplaintEscalated } = useNotification();

  async function handleReopenSubmit() {
    setSubmitting(true);
    try {
      const activeTagLabel = quickTags.find((tItem) => tItem.key === selectedTag)?.label || "";
      const fullReason = reopenReason.trim()
        ? `${activeTagLabel}: ${reopenReason.trim()}`
        : activeTagLabel || "Issue not resolved properly according to citizen.";

      await onValidate(complaint.token, {
        satisfied: false,
        rating: rating || 1,
        reason: fullReason,
        feedback: fullReason,
      });
      notifyComplaintEscalated?.({
        token: complaint.token,
        reason: fullReason,
        level: Math.min((complaint.escalationLevel || 0) + 1, 3),
        phone: "+91 83196 09151",
      });
      setShowReopenModal(false);
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div className="space-y-6">
      {/* Complaint Token Card */}
      <div className="ticket-notch bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <Seal severity={complaint.severity} size={60} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-semibold text-slate2">{complaint.token}</span>
                <StatusPill status={effectiveStatus} />
              </div>
              <p className="font-display text-lg font-semibold text-ink-900 mt-0.5">{complaint.title}</p>
              <p className="text-sm text-slate2 mt-1">{complaint.description || "No description provided."}</p>
            </div>
          </div>

          {/* Download Receipt Button */}
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="shrink-0 px-3 py-2 rounded-xl bg-paper border border-ink-200 text-xs font-semibold text-ink-900 hover:bg-ink-100/70 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60"
            title="Download PDF Acknowledgement Receipt"
          >
            <Download size={13} className="text-moss-600" />
            <span className="hidden sm:inline">
              {downloading ? t("receipt_downloading") : t("receipt_download_short")}
            </span>
          </button>
        </div>
      </div>

      {/* Interactive Before vs After Resolution Proof Slider */}
      <BeforeAfterSlider
        beforeImage={beforeImg}
        afterImage={afterImg}
        title={complaint.title}
      />

      {/* Lifecycle Stage Progress */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
        <p className="text-xs font-mono uppercase tracking-wide text-slate2 mb-4 font-semibold">
          {t("track_lifecycle_title")}
        </p>
        <div className="flex items-center">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    i <= stepIndex ? "bg-marigold-400" : "bg-ink-100"
                  }`}
                />
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < stepIndex ? "bg-marigold-400" : "bg-ink-100"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-slate2 mt-2 font-mono">
          <span>{getStatusLabel("submitted")}</span>
          <span>{getStatusLabel("closed")}</span>
        </div>
        {effectiveLevel > 0 && effectiveStatus !== "closed" && (
          <p className="text-xs text-signal-600 mt-4 font-medium">
            ⚠️ No action in {Math.floor(hoursSinceAction)}h — automatically escalated to level {effectiveLevel}{" "}
            authority ({getCategoryLabel(dept?.id || complaint.category)}).
          </p>
        )}
      </div>

      {/* Department Resolution Note */}
      {complaint.resolutionNote && (
        <div className="bg-moss-400/5 border border-moss-400/30 rounded-2xl p-5 shadow-2xs">
          <p className="text-xs font-mono uppercase tracking-wide text-moss-600 mb-1 font-semibold">
            {t("track_dept_note")}
          </p>
          <p className="text-sm text-ink-900 font-medium">{complaint.resolutionNote}</p>
          <p className="text-[11px] text-slate2 mt-2 font-mono">{timeAgo(complaint.lastActionAt)}</p>
        </div>
      )}

      {/* Citizen Validation & Star Rating Action Card */}
      {complaint.status === "resolved_pending_validation" && (
        <div className="border border-marigold-300 bg-gradient-to-b from-marigold-50/80 to-white rounded-2xl p-6 shadow-md space-y-5">
          <div>
            <span className="font-mono text-[11px] font-semibold text-marigold-700 bg-marigold-100 px-2 py-0.5 rounded uppercase tracking-wider">
              Citizen Action Required
            </span>
            <h3 className="text-base font-bold text-ink-900 mt-1.5">{t("track_satisfied_question")}</h3>
            <p className="text-xs text-slate2 mt-0.5 leading-relaxed">
              {t("track_satisfied_sub")}
            </p>
          </div>

          {/* Interactive 5-Star Rating Selector */}
          <div className="bg-white p-4 rounded-xl border border-marigold-200/80 shadow-2xs space-y-2">
            <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold flex items-center justify-between">
              <span>{t("feedback_rate_resolution")}</span>
              <span className="text-amber-600 font-bold font-mono text-xs">
                {(hoverRating || rating)} / 5 Stars
              </span>
            </label>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-ink-300 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <Star
                    size={26}
                    className={`transition-transform duration-150 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400 scale-110"
                        : "text-ink-200"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Optional Citizen Feedback Textarea */}
            <div className="pt-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t("feedback_feedback_placeholder")}
                rows={2}
                className="w-full p-2.5 rounded-lg border border-ink-200 bg-ink-50/40 text-xs text-ink-900 outline-none focus:border-marigold-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Action Confirmation Buttons */}
          <div className="flex gap-3 flex-wrap pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={handleSatisfiedSubmit}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-moss-600 hover:bg-moss-700 text-paper text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-60"
            >
              <ThumbsUp size={15} /> {t("feedback_satisfied_btn")}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowReopenModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-signal-50 hover:bg-signal-100 text-signal-700 border border-signal-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <ThumbsDown size={14} /> {t("feedback_not_satisfied_btn")}
            </button>
          </div>
        </div>
      )}

      {/* Citizen Submitted Rating & Feedback View if already closed/rated */}
      {complaint.rating && (
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold flex items-center gap-1.5">
              <MessageSquare size={13} className="text-marigold-600" /> Citizen Review
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  className={
                    s <= complaint.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-ink-200"
                  }
                />
              ))}
            </div>
          </div>
          {complaint.citizenFeedback && (
            <p className="text-xs text-ink-900 italic bg-ink-50/50 p-3 rounded-lg border border-ink-100">
              "{complaint.citizenFeedback}"
            </p>
          )}
          {complaint.reopenedReason && (
            <div className="p-3 bg-signal-50 rounded-lg border border-signal-200 text-xs text-signal-800">
              <strong className="block font-semibold mb-0.5">Reopened / Rejection Reason:</strong>
              {complaint.reopenedReason}
            </div>
          )}
        </div>
      )}

      {/* Geographic Coordinates Card */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
        <p className="text-xs font-mono uppercase tracking-wide text-slate2 mb-2 flex items-center gap-1.5 font-semibold">
          <MapPin size={13} className="text-marigold-600" /> {t("track_coords_title")}
        </p>
        <div className="flex items-center justify-between text-xs text-ink-900 font-mono bg-ink-50 p-3 rounded-xl border border-ink-100">
          <span>Lat: {complaint.lat?.toFixed(5)}</span>
          <span>Lng: {complaint.lng?.toFixed(5)}</span>
          <span className="font-sans font-medium text-slate2">Pune District</span>
        </div>
      </div>

      {/* Rejection / Reopen Reason Selection Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-ink-100 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-ink-100">
              <div className="flex items-center gap-2 text-signal-700 font-bold text-base">
                <AlertTriangle size={18} />
                <span>{t("feedback_select_reason")}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="w-7 h-7 rounded-full bg-ink-50 hover:bg-ink-100 text-slate2 flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-slate2 leading-relaxed">
              Please specify why the resolution was unsatisfactory so we can escalate this issue to senior authority.
            </p>

            {/* Quick Reason Tags */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => setSelectedTag(tag.key)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                      selectedTag === tag.key
                        ? "bg-signal-600 text-white border-signal-600 shadow-xs"
                        : "bg-white text-ink-700 border-ink-200 hover:border-signal-300"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Comments Textarea */}
            <div>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Additional notes for the higher authority supervisor..."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-ink-200 bg-white text-xs text-ink-900 outline-none focus:border-signal-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate2 hover:bg-ink-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleReopenSubmit}
                className="px-4 py-2 rounded-xl bg-signal-600 hover:bg-signal-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {submitting ? "Escalating..." : t("feedback_reopen_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
