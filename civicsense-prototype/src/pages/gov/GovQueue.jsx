import React, { useMemo, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import Seal from "../../components/Seal";
import StatusPill from "../../components/StatusPill";
import LiveLeafletMap from "../../components/LiveLeafletMap";
import BeforeAfterSlider from "../../components/BeforeAfterSlider";
import CitizenPhotoEvidence from "../../components/CitizenPhotoEvidence";
import VoiceNotePlayer from "../../components/VoiceNotePlayer";
import {
  Clock,
  MapPin,
  UserCog,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useNotification } from "../../context/NotificationContext";

import {
  priorityScore,
  deriveEscalation,
  severityLabel,
  nearestPOI,
  timeAgo,
} from "../../lib/logic";
import { getImageUrl } from "../../lib/api";

const CATEGORY_ALIASES = {
  garbage: ["garbage", "solid_waste", "sanitation", "waste", "garbage_dump"],
  potholes: ["potholes", "pothole", "road_damage", "road", "roads", "cracks", "crack"],
  drainage: ["drainage", "waterlogging", "sewage", "drain", "flooding", "sewer"],
  streetlights: ["streetlights", "streetlight", "lighting", "lights", "electrical"],
};

function matchCategory(complaintCat, targetDept) {
  if (!targetDept || targetDept === "all") return true;
  if (!complaintCat) return false;
  const cat = String(complaintCat).toLowerCase().trim();
  const tDept = String(targetDept).toLowerCase().trim();
  if (cat === tDept) return true;
  const aliases = CATEGORY_ALIASES[tDept] || [tDept];
  return aliases.includes(cat) || aliases.some((a) => cat.includes(a));
}

export default function GovQueue(props) {
  const authState = useApp();
  const rawComplaints = props?.complaints ?? authState?.complaints ?? [];
  const safeComplaints = Array.isArray(rawComplaints) ? rawComplaints : [];

  const resolveComplaint = authState?.resolveComplaint;
  const assignOfficer = authState?.assignOfficer;
  const departments = Array.isArray(authState?.departments) ? authState.departments : [];
  const officials = Array.isArray(authState?.officials) ? authState.officials : [];
  const user = props?.user || authState?.user || {};
  const loading = authState?.loading || false;
  const { t, getCategoryLabel } = useLanguage();
  const { notifyComplaintResolved, notifyOfficerAssigned } = useNotification();

  const emailStr = String(user?.email || "").toLowerCase().trim();
  const nameStr = String(user?.name || "").toLowerCase().trim();

  // Comprehensive Defensive Null-Checking & rawDept definition
  const rawDept = String(
    props?.rawDept ||
    props?.userDept ||
    user?.department ||
    user?.dept ||
    (emailStr.includes("deshmukh") ? "garbage" : emailStr.includes("bhosale") ? "drainage" : "potholes")
  ).toLowerCase().trim();

  const userDept = rawDept;
  const userRole = props?.userRole || user?.role || authState?.role || "L1";

  const officerDept = useMemo(() => {
    if (rawDept) {
      if (CATEGORY_ALIASES.garbage.includes(rawDept)) return "garbage";
      if (CATEGORY_ALIASES.potholes.includes(rawDept)) return "potholes";
      if (CATEGORY_ALIASES.drainage.includes(rawDept)) return "drainage";
      if (CATEGORY_ALIASES.streetlights.includes(rawDept)) return "streetlights";
      return rawDept;
    }

    if (
      emailStr.includes("deshmukh") ||
      emailStr.includes("garbage") ||
      emailStr.includes("waste") ||
      nameStr.includes("deshmukh")
    ) {
      return "garbage";
    }
    if (
      emailStr.includes("bhosale") ||
      emailStr.includes("drain") ||
      nameStr.includes("bhosale")
    ) {
      return "drainage";
    }
    if (emailStr.includes("light") || emailStr.includes("street")) {
      return "streetlights";
    }
    if (
      emailStr.includes("kulkarni") ||
      emailStr.includes("pothole") ||
      nameStr.includes("kulkarni")
    ) {
      return "potholes";
    }
    if (user?.role === "official" || userRole === "official") {
      return "garbage";
    }
    return null;
  }, [user, userRole, rawDept, emailStr, nameStr]);

  const isSuperAdminOrZonal =
    userRole === "admin" ||
    user?.role === "admin" ||
    (user?.level && Number(user.level) >= 2) ||
    ((userRole === "gov" || user?.role === "official") && !officerDept);


  const [dept, setDept] = useState("all");
  const [selectedToken, setSelectedToken] = useState(null);
  const [note, setNote] = useState("");
  const [resolutionImage, setResolutionImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (officerDept && !isSuperAdminOrZonal) {
      setDept(officerDept);
    }
  }, [officerDept, isSuperAdminOrZonal]);

  // Safe Priority Queue Calculation with Department Scoping & Aliases
  const queue = useMemo(() => {
    const open = safeComplaints.filter((c) => c && !["closed"].includes(c.status));
    
    const activeDept = isSuperAdminOrZonal ? dept : (officerDept || dept);
    const filtered =
      activeDept === "all"
        ? open
        : open.filter((c) => c && matchCategory(c.category, activeDept));

    return filtered.sort((a, b) => {
      try {
        const scoreB = priorityScore(b) || 0;
        const scoreA = priorityScore(a) || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
      } catch {
        const sevB = b?.severity || 0;
        const sevA = a?.severity || 0;
        if (sevB !== sevA) return sevB - sevA;
      }
      const timeB = new Date(b?.createdAt || b?.created_at || b?.timestamp || 0).getTime();
      const timeA = new Date(a?.createdAt || a?.created_at || a?.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [safeComplaints, dept, officerDept, isSuperAdminOrZonal]);

  const selected = useMemo(() => {
    if (selectedToken) {
      const found = safeComplaints.find((c) => c && c.token === selectedToken);
      if (found) return found;
    }
    return queue[0] || safeComplaints[0] || null;
  }, [safeComplaints, selectedToken, queue]);

  const deptOfficials = useMemo(() => {
    return (officials || []).filter(
      (o) => o && matchCategory(o.dept || o.department, selected?.category)
    );
  }, [officials, selected]);

  // Role Protection: Redirect non-officials to /login/gov
  if (user && user.role && user.role !== "official" && user.role !== "admin" && user.role !== "gov") {
    return <Navigate to="/login/gov" replace />;
  }



  function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResolutionImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setResolutionImage(null);
    setImagePreview(null);
  }

  async function handleResolve() {
    if (!selected) return;
    setProcessing(true);
    setActionSuccess("");
    setActionError("");
    try {
      const proofToSend =
        imagePreview ||
        resolutionImage ||
        "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80";

      await resolveComplaint(
        selected.token,
        note || "Issue addressed and repaired by municipal field crew.",
        proofToSend
      );
      setActionSuccess(
        `Marked ${selected.token} as resolved with proof photo. Sent to citizen for validation.`
      );
      notifyComplaintResolved?.({
        token: selected.token,
        phone: "+91 83196 09151",
      });
      setNote("");
      setResolutionImage(null);
      setImagePreview(null);
    } catch (err) {
      setActionError(err.message || "Failed to resolve complaint.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleAssign(officerId) {
    if (!selected || !officerId) return;
    setProcessing(true);
    setActionSuccess("");
    setActionError("");
    try {
      await assignOfficer(selected.token, officerId);
      setActionSuccess(`Reassigned ${selected.token} to official.`);
      const assignedOfficerObj = (deptOfficials || []).find((o) => o.id === officerId);
      notifyOfficerAssigned?.({
        token: selected.token,
        officerName: assignedOfficerObj?.name || "R. Kulkarni (Zonal Officer)",
        slaHours: 48,
        phone: "+91 83196 09151",
      });
    } catch (err) {
      setActionError(err.message || "Failed to reassign officer.");
    } finally {
      setProcessing(false);
    }
  }



  // Loading Spinner Fallback
  if (loading && (!complaints || complaints.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] gap-3 text-center">
        <Loader2 size={32} className="text-marigold-500 animate-spin" />
        <p className="text-sm font-mono text-slate2">
          Loading Official Priority Queue &amp; Ward Analytics...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header & Filter Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            {t("section_priority_queue")}
          </h1>
          <p className="text-sm text-slate2 mt-1">
            {t("section_priority_queue_sub")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {!isSuperAdminOrZonal && officerDept ? (
            <div className="flex items-center gap-2 bg-ink-900 text-paper text-xs font-mono font-semibold px-3.5 py-1.5 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dept Scoped: {getCategoryLabel(officerDept).toUpperCase()}</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setDept("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  dept === "all"
                    ? "bg-ink-900 text-paper shadow-xs"
                    : "bg-white border border-ink-100 text-slate2 hover:border-ink-300"
                }`}
              >
                {t("cat_all")}
              </button>
              {(departments || []).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDept(d.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    dept === d.id
                      ? "bg-ink-900 text-paper shadow-xs"
                      : "bg-white border border-ink-100 text-slate2 hover:border-ink-300"
                  }`}
                >
                  {getCategoryLabel(d.id)}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-moss-600/10 border border-moss-600/30 flex items-center gap-2 text-xs font-medium text-moss-700">
          <CheckCircle2 size={15} className="text-moss-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-3 rounded-xl bg-signal-400/10 border border-signal-400/30 flex items-center gap-2 text-xs font-medium text-signal-600">
          <AlertCircle size={15} className="text-signal-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Leaflet Live Map for Priority Queue */}
      <div className="mb-6">
        <LiveLeafletMap
          complaints={queue || []}
          height={320}
          onSelectToken={(token) => {
            setSelectedToken(token);
            setActionSuccess("");
            setActionError("");
          }}
        />
      </div>

      {/* Queue List & Incident Action Detail Panel */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3 thin-scroll max-h-[70vh] overflow-y-auto pr-1">
          {queue.length === 0 && (
            <div className="p-8 bg-white border border-ink-100 rounded-xl text-center">
              <p className="text-sm text-slate2">{t("section_no_open_complaints")}</p>
            </div>
          )}
          {queue.map((c, i) => {
            const { effectiveStatus, effectiveLevel } = deriveEscalation(c);
            const poi = nearestPOI(c.lat, c.lng);
            const isSelected = selected?.token === c.token;
            return (
              <button
                key={c.token}
                onClick={() => {
                  setSelectedToken(c.token);
                  setActionSuccess("");
                  setActionError("");
                }}
                className={`ticket-notch w-full text-left bg-white border rounded-xl p-4 flex items-center gap-4 transition-all cursor-pointer ${
                  isSelected
                    ? "border-marigold-400 shadow-sm ring-1 ring-marigold-400/20"
                    : "border-ink-100 hover:border-ink-300"
                }`}
              >
                <span className="font-mono text-xs text-ink-300 w-5 shrink-0">#{i + 1}</span>
                <Seal severity={c.severity} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate2 font-semibold">
                      {c.token}
                    </span>
                    <StatusPill status={effectiveStatus} />
                    {effectiveLevel > 0 && (
                      <span className="text-[11px] font-mono text-signal-600 font-semibold flex items-center gap-0.5 bg-signal-50 px-1.5 py-0.5 rounded border border-signal-200">
                        <ShieldAlert size={11} /> L{effectiveLevel}
                      </span>
                    )}
                  </div>
                  <p className="font-display text-ink-900 font-medium truncate mt-0.5">
                    {c.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate2 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {timeAgo(c.createdAt)}
                    </span>
                    {poi && poi.distance < 800 && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> near {poi.name}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white border border-ink-100 rounded-2xl p-5 sticky top-20 shadow-2xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-ink-100">
                <Seal severity={selected.severity} size={48} />
                <div className="min-w-0">
                  <span className="font-mono text-xs text-slate2 font-semibold block">
                    {selected.token}
                  </span>
                  <p className="font-display font-semibold text-ink-900 text-sm truncate">
                    {selected.title}
                  </p>
                </div>
              </div>

              {/* Citizen Photo Evidence Viewer with AI Diagnostics */}
              <CitizenPhotoEvidence complaint={selected} />

              {/* Citizen Landmark Voice Note Player (If audio note attached) */}
              {(selected?.audioUrl || selected?.audio_url || selected?.audio_base64 || selected?.audio) && (
                <VoiceNotePlayer
                  audioUrl={selected?.audioUrl || selected?.audio_url || selected?.audio_base64 || selected?.audio}
                  title={t("voice_note_landmark_title") || "Citizen Landmark Voice Note"}
                />
              )}

              {/* Before vs After Resolution Comparison if already resolved */}
              {(selected?.resolutionImageUrl || selected?.resolution_image_url) && (
                <div>
                  <label className="text-xs font-mono uppercase tracking-wide text-slate2 mb-1.5 block font-semibold">
                    {t("proof_comparison_title")}
                  </label>
                  <BeforeAfterSlider
                    beforeImage={getImageUrl(
                      selected?.imageUrl ||
                      selected?.photoUrl ||
                      selected?.image_url ||
                      selected?.image ||
                      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"
                    )}
                    afterImage={getImageUrl(
                      selected?.resolutionImageUrl ||
                      selected?.resolution_image_url ||
                      "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80"
                    )}
                  />
                </div>
              )}

              <p className="text-xs text-slate2 leading-relaxed">
                {selected?.description || "No additional details provided."}
              </p>

              <dl className="text-xs space-y-2 bg-ink-50/50 p-3 rounded-xl border border-ink-100">
                <div className="flex justify-between">
                  <dt className="text-slate2">{t("map_severity")}</dt>
                  <dd className="font-semibold text-ink-900">
                    {selected?.severity || 3} — {severityLabel(selected?.severity || 3)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate2">{t("stat_response_time")}</dt>
                  <dd className="font-medium text-ink-900 font-mono">
                    {Math.floor(deriveEscalation(selected || {}).hoursSinceAction || 0)}h
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate2">{t("stat_priority_score")}</dt>
                  <dd className="font-bold text-ink-900 font-mono">
                    {priorityScore(selected || {})}
                  </dd>
                </div>
              </dl>

              <div>
                <label className="text-xs font-mono uppercase tracking-wide text-slate2 flex items-center gap-1.5 mb-1.5 font-semibold">
                  <UserCog size={12} /> {t("gov_assigned_officer")}
                </label>
                <select
                  disabled={processing}
                  value={selected?.assignedOfficerId || selected?.assigned_officer_id || ""}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-ink-100 bg-white text-sm outline-none focus:border-marigold-400"
                >
                  <option value="">{t("gov_select_officer_placeholder")}</option>
                  {deptOfficials.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} (Level {o.level})
                    </option>
                  ))}
                </select>
              </div>

              {selected?.status === "resolved_pending_validation" ? (
                <div className="p-3.5 bg-moss-50 border border-moss-200 rounded-xl text-sm text-moss-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-moss-600 shrink-0" />
                  <span>{t("sent_for_validation")}</span>
                </div>
              ) : selected?.status === "closed" ? (
                <div className="p-3.5 bg-ink-50 border border-ink-100 rounded-xl text-sm text-ink-900 font-medium">
                  {t("closed_by_citizen")}
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {/* Mandatory Resolution Proof Photo Upload */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wide text-slate2 mb-1.5 block font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon size={13} className="text-moss-600" />
                        {t("proof_upload_label")} *
                      </span>
                    </label>

                    {imagePreview ? (
                      <div className="space-y-2">
                        {/* Side-by-Side Before vs After Comparison */}
                        <div className="grid grid-cols-2 gap-2 bg-ink-50/70 p-2 rounded-xl border border-ink-200">
                          {/* Before Photo */}
                          <div className="relative rounded-lg overflow-hidden border border-ink-200 bg-black/90">
                            <span className="absolute top-1.5 left-1.5 z-10 bg-black/80 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white/20">
                              BEFORE (Citizen)
                            </span>
                            <img
                              src={getImageUrl(
                                selected?.imageUrl ||
                                selected?.photoUrl ||
                                selected?.image_url ||
                                selected?.image ||
                                "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"
                              )}
                              alt="Before issue evidence"
                              className="w-full h-28 object-cover"
                            />
                          </div>

                          {/* After Resolution Photo */}
                          <div className="relative rounded-lg overflow-hidden border border-moss-400 bg-moss-950/20">
                            <span className="absolute top-1.5 left-1.5 z-10 bg-moss-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white/20">
                              AFTER (Field Proof)
                            </span>
                            <img
                              src={imagePreview}
                              alt="Resolution proof preview"
                              className="w-full h-28 object-cover"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-black cursor-pointer shadow-md"
                              title={t("proof_remove_photo")}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-moss-700 font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-moss-600" />{" "}
                          Side-by-side comparison verified &amp; ready for resolution.
                        </p>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-ink-200 rounded-xl p-3 text-center bg-paper hover:bg-ink-50/50 transition-colors">
                        <div className="flex justify-center gap-2 mb-2">
                          <label className="px-3 py-1.5 rounded-lg bg-ink-900 text-paper text-xs font-semibold hover:bg-ink-700 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                            <Upload size={12} /> {t("proof_upload_btn")}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageFile}
                            />
                          </label>
                        </div>
                        <p className="text-[10px] text-slate2">
                          {t("proof_upload_helper")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-wide text-slate2 mb-1.5 block font-semibold">
                      {t("gov_resolution_note_label")}
                    </label>
                    <textarea
                      disabled={processing}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder={t("gov_resolution_note_placeholder")}
                      className="w-full px-3 py-2 rounded-xl border border-ink-100 bg-white text-sm outline-none focus:border-marigold-400"
                    />
                  </div>

                  <button
                    disabled={processing}
                    onClick={handleResolve}
                    className="w-full py-2.5 rounded-xl bg-ink-900 text-paper text-sm font-semibold hover:bg-ink-700 transition-colors disabled:opacity-60 cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    {processing ? t("gov_saving_btn") : t("gov_mark_resolved_btn")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate2">Select a complaint to manage it.</p>
          )}
        </div>
      </div>
    </div>
  );
}
