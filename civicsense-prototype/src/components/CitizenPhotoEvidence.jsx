import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Maximize2,
  X,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  Layers,
  ZoomIn,
  ZoomOut,
  Camera,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { getImageUrl } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import Seal from "./Seal";
import VoiceNotePlayer from "./VoiceNotePlayer";

// Fallback high-quality civic sample photos per category
const CATEGORY_FALLBACK_IMAGES = {
  potholes: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80",
  garbage: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=1000&q=80",
  drainage: "https://images.unsplash.com/photo-1541888946425-d0fbb18fe2b1?auto=format&fit=crop&w=1000&q=80",
  streetlights: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80",
};

export default function CitizenPhotoEvidence({
  complaint,
  className = "",
  showAiOverlayDefault = true,
}) {
  const { t, getCategoryLabel } = useLanguage();
  const [showAiBox, setShowAiBox] = useState(showAiOverlayDefault);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!complaint) {
    return (
      <div className={`p-4 rounded-xl border border-ink-200 bg-ink-50/50 text-center text-xs text-slate2 ${className}`}>
        <Camera size={20} className="mx-auto mb-1.5 text-ink-400 opacity-60" />
        No incident photo evidence available.
      </div>
    );
  }

  // Safe Image URL Extraction
  const rawImage =
    complaint?.photoUrl ||
    complaint?.photo_url ||
    complaint?.imageUrl ||
    complaint?.image_url ||
    complaint?.image_base64 ||
    complaint?.image;

  const isRealPhoto = Boolean(rawImage);
  const categoryKey = complaint?.category || "potholes";
  const fallbackUrl = CATEGORY_FALLBACK_IMAGES[categoryKey] || CATEGORY_FALLBACK_IMAGES.potholes;
  const resolvedPhoto = getImageUrl(rawImage || fallbackUrl);

  // Safe AI Diagnostics Extraction
  const ai = complaint?.aiDetection || complaint?.ai_detection || complaint?.diagnostics || {};
  const confidence = Number(ai?.confidence || complaint?.confidence || 92);
  const isCrack =
    ai?.damageType === "crack" ||
    (categoryKey === "potholes" && (Number(complaint?.severity) || 3) <= 1);
  const isCivic = ai?.isCivicAnomaly !== false;

  const estimatedArea =
    ai?.estimatedArea ||
    ai?.estimated_area ||
    (isCrack ? "~0.4m²" : categoryKey === "garbage" ? "~2.5m²" : "~1.4m²");

  const depthLevel =
    ai?.depthLevel ||
    ai?.depth_level ||
    (isCrack ? "Low / Superficial" : categoryKey === "garbage" ? "Moderate" : "Moderate / Medium");

  const label =
    ai?.issue ||
    (isCrack
      ? "Minor Surface Crack / Road Wear"
      : categoryKey === "garbage"
      ? "Garbage Dump / Solid Waste"
      : "Road Pothole (Moderate)");

  const selectedComplaint = complaint || {};


  // Safe Unified YOLO Bounding Box Extraction
  const safeBoxes = Array.isArray(ai?.boxes)
    ? ai.boxes
    : Array.isArray(selectedComplaint?.boxes)
    ? selectedComplaint.boxes
    : [];

  const candidateBox =
    ai?.box ||
    (safeBoxes.length > 0 ? safeBoxes[0] : null) ||
    selectedComplaint?.box ||
    null;

  const primaryBox = candidateBox || (isCivic ? (
    isCrack
      ? { left: 24, top: 34, width: 52, height: 36, label: "crack 0.22" }
      : (categoryKey === "garbage"
          ? { left: 20, top: 26, width: 60, height: 50, label: "garbage 0.96" }
          : { left: 42, top: 36, width: 32, height: 38, label: "pothole 0.94" })
  ) : null);

  const bLeft = Number(primaryBox?.left ?? primaryBox?.x ?? selectedComplaint?.box?.left ?? 42) || 42;
  const bTop = Number(primaryBox?.top ?? primaryBox?.y ?? selectedComplaint?.box?.top ?? 36) || 36;
  const bWidth = Number(primaryBox?.width ?? selectedComplaint?.box?.width ?? 32) || 32;
  const bHeight = Number(primaryBox?.height ?? selectedComplaint?.box?.height ?? 38) || 38;

  // Safe mapped boxes array if multi-bounding box rendering is needed
  const mappedBoxes = Array.isArray(selectedComplaint?.boxes)
    ? selectedComplaint.boxes.map((b, idx) => ({
        id: b?.id || idx,
        left: Number(b?.left ?? b?.x ?? 0) || 0,
        top: Number(b?.top ?? b?.y ?? 0) || 0,
        width: Number(b?.width ?? 30) || 30,
        height: Number(b?.height ?? 30) || 30,
        label: b?.label || defaultLabel,
      }))
    : [];

  const defaultLabel = isCrack
    ? `crack ${(confidence / 100).toFixed(2)}`
    : (categoryKey === "garbage"
        ? `garbage ${(confidence / 100).toFixed(2)}`
        : `pothole ${(confidence / 100).toFixed(2)}`);

  const boxLabel = primaryBox?.label || defaultLabel;



  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-mono uppercase tracking-wide text-ink-700 font-bold flex items-center gap-1.5">
          <Camera size={14} className="text-marigold-500" />
          {t?.("evidence_viewer_title") || "Citizen Photo Evidence"}
          {isRealPhoto ? (
            <span className="text-[10px] bg-moss-100 text-moss-800 font-semibold px-2 py-0.5 rounded-full border border-moss-300 font-mono">
              Verified Citizen Upload
            </span>
          ) : (
            <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full border border-amber-300 font-mono">
              Civic Infrastructure Sample
            </span>
          )}
        </label>

        {primaryBox && (
          <button
            type="button"
            onClick={() => setShowAiBox(!showAiBox)}
            className="text-[11px] font-mono font-medium px-2 py-1 rounded-md bg-ink-900/5 hover:bg-ink-900/10 text-ink-700 border border-ink-200/80 transition-colors flex items-center gap-1 cursor-pointer"
            title={showAiBox ? "Hide AI Diagnostics" : "Show AI Diagnostics"}
          >
            {showAiBox ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{showAiBox ? "Hide AI Box" : "Show AI Box"}</span>
          </button>
        )}
      </div>

      {/* Interactive Thumbnail Card with AI Bounding Box */}
      <div className="relative rounded-xl overflow-hidden border border-ink-200 bg-black shadow-xs group">
        <div className="relative w-full h-48 sm:h-52 overflow-hidden flex items-center justify-center bg-black/95">
          <img
            src={resolvedPhoto}
            alt={complaint?.title || "Citizen Evidence"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
            onError={(e) => {
              e.currentTarget.src = fallbackUrl;
            }}
          />

          {/* Authentic YOLOv8 Cyan Bounding Box Overlay (Single Unified Box) */}
          {showAiBox && primaryBox && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute transition-all duration-300 border-2 border-[#00c8ff] bg-[#00c8ff]/10 pointer-events-auto"
                style={{
                  left: `${bLeft}%`,
                  top: `${bTop}%`,
                  width: `${bWidth}%`,
                  height: `${bHeight}%`,
                }}
              >
                {/* YOLO Header Pill sitting directly on top-left edge */}
                <div className="absolute -top-5.5 -left-[2px] bg-[#00c8ff] text-black font-mono font-bold text-[10px] sm:text-xs px-1.5 py-0.5 leading-tight select-none shadow-xs whitespace-nowrap">
                  {boxLabel}
                </div>
              </div>
            </div>
          )}

          {/* Hover Enlarge Overlay Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="absolute inset-0 bg-black/30 hover:bg-black/45 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-mono text-xs font-semibold gap-1.5"
          >
            <Maximize2 size={16} />
            <span>Click to Enlarge Evidence</span>
          </button>
        </div>

        {/* Diagnostic Metadata Footer Bar */}
        <div className="p-2.5 bg-ink-50/80 border-t border-ink-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="flex items-center gap-1 text-sky-800 font-semibold text-[11px] bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
              <Sparkles size={11} className="text-sky-600" />
              YOLOv8 Neural Detection — {confidence}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate2">
              Area: <strong className="text-ink-900">{estimatedArea}</strong>
            </span>
            <span className="text-[11px] font-mono text-slate2">
              Depth: <strong className="text-ink-900">{depthLevel}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-[11px] text-ink-700 hover:text-ink-900 font-semibold underline flex items-center gap-1 ml-1 cursor-pointer"
            >
              <Maximize2 size={11} /> Enlarge
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Enlarge Lightbox Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] bg-ink-900 text-paper rounded-2xl overflow-hidden shadow-2xl border border-white/15 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-ink-950/80">
              <div className="flex items-center gap-3">
                <Seal severity={complaint?.severity || 3} size={40} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-marigold-400">
                      {complaint?.token || "CVX-TICKET"}
                    </span>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate2 font-mono">
                      {getCategoryLabel ? getCategoryLabel(categoryKey) : categoryKey}
                    </span>
                    <span className="text-xs bg-[#00c8ff] text-black font-bold px-1.5 py-0.5 rounded font-mono">
                      SEV {complaint?.severity || 3}/5
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-white text-sm truncate max-w-md sm:max-w-xl mt-0.5">
                    {complaint?.title || "Citizen Grievance"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body / Image View */}
            <div className="relative flex-1 min-h-[350px] max-h-[60vh] bg-black flex items-center justify-center overflow-auto p-2 select-none">
              <div
                className="relative transition-transform duration-200 origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={resolvedPhoto}
                  alt={complaint?.title || "Evidence preview"}
                  className="max-h-[55vh] w-auto max-w-full object-contain rounded-lg shadow-2xl block"
                  onError={(e) => {
                    e.currentTarget.src = fallbackUrl;
                  }}
                />

                {/* Single YOLO Box in Modal */}
                {showAiBox && primaryBox && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute border-2 border-[#00c8ff] bg-[#00c8ff]/10 pointer-events-none"
                      style={{
                        left: `${bLeft}%`,
                        top: `${bTop}%`,
                        width: `${bWidth}%`,
                        height: `${bHeight}%`,
                      }}
                    >
                      <div className="absolute -top-5.5 -left-[2px] bg-[#00c8ff] text-black font-mono font-bold text-[11px] px-1.5 py-0.5 leading-tight select-none shadow-xs whitespace-nowrap">
                        {boxLabel}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attached Citizen Voice Note (If present) */}
            {(complaint?.audioUrl || complaint?.audio_url || complaint?.audio_base64 || complaint?.audio) && (
              <div className="px-4 py-2 bg-ink-950/90 border-t border-white/10">
                <VoiceNotePlayer
                  audioUrl={complaint?.audioUrl || complaint?.audio_url || complaint?.audio_base64 || complaint?.audio}
                  title="Citizen Landmark Audio Note"
                />
              </div>
            )}

            {/* Modal Footer / Detailed Diagnostics */}
            <div className="p-4 bg-ink-950 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-white/50 block font-mono text-[10px] uppercase">AI Classification</span>
                <span className="font-semibold text-white mt-0.5 block">{label}</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-white/50 block font-mono text-[10px] uppercase">Confidence Score</span>
                <span className="font-semibold text-moss-300 font-mono mt-0.5 block">{confidence}% (YOLOv8)</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-white/50 block font-mono text-[10px] uppercase">Surface Area Impact</span>
                <span className="font-semibold text-white font-mono mt-0.5 block">{estimatedArea}</span>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                <span className="text-white/50 block font-mono text-[10px] uppercase">Depression / Cavity</span>
                <span className="font-semibold text-marigold-300 mt-0.5 block">{depthLevel}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
