import React, { useState, useRef, useCallback, useEffect } from "react";
import { MoveHorizontal, Eye, Sparkles, Image as ImageIcon, CheckCircle2, Clock } from "lucide-react";
import { getImageUrl } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  title = "",
  className = "",
}) {
  const { t } = useLanguage();
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const beforeSrc = getImageUrl(beforeImage);
  const afterSrc = getImageUrl(afterImage);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percent = (x / rect.width) * 100;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // If only before image is available (work still pending)
  if (beforeSrc && !afterSrc) {
    return (
      <div className={`bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-2xs ${className}`}>
        <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-marigold-600" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate2">
              {t("proof_before_label")}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-marigold-700 bg-marigold-50 px-2.5 py-0.5 rounded-full border border-marigold-200">
            <Clock size={11} /> {t("proof_pending_status")}
          </span>
        </div>
        <div className="relative aspect-video w-full bg-ink-950/5">
          <img
            src={beforeSrc}
            alt={title || "Original Issue"}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wider uppercase shadow-sm">
            {t("proof_badge_before")}
          </div>
        </div>
      </div>
    );
  }

  // If no images at all
  if (!beforeSrc && !afterSrc) {
    return (
      <div className={`p-8 bg-white border border-ink-100 rounded-2xl text-center shadow-2xs ${className}`}>
        <ImageIcon size={28} className="mx-auto text-slate2 mb-2" />
        <p className="text-xs text-slate2 font-medium">{t("proof_no_photos")}</p>
      </div>
    );
  }

  // If both before and after images are present (or only after is present)
  return (
    <div className={`bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-2xs ${className}`}>
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-ink-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-moss-600" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate2">
            {t("proof_slider_title")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-moss-700 bg-moss-50 px-2.5 py-0.5 rounded-full border border-moss-200">
            <CheckCircle2 size={12} /> {t("proof_verified_badge")}
          </span>
          <span className="hidden sm:inline-block text-[11px] text-slate2 font-mono">
            {t("proof_drag_instruction")}
          </span>
        </div>
      </div>

      {/* Interactive Slider Area */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches && e.touches[0]) {
            handleMove(e.touches[0].clientX);
          }
        }}
        className="relative aspect-video w-full select-none cursor-ew-resize overflow-hidden bg-black"
        tabIndex={0}
        role="slider"
        aria-valuenow={Math.round(sliderPosition)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before and after comparison slider"
      >
        {/* Layer 1: AFTER Image (Underneath) */}
        <img
          src={afterSrc || beforeSrc}
          alt="Resolved issue (After)"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* AFTER Badge */}
        <div className="absolute top-3 right-3 z-10 bg-moss-700/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1">
          <CheckCircle2 size={12} /> {t("proof_badge_after")}
        </div>

        {/* Layer 2: BEFORE Image (Clipped Overlay on Left) */}
        {beforeSrc && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
            }}
          >
            <img
              src={beforeSrc}
              alt="Original issue (Before)"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* BEFORE Badge */}
            <div className="absolute top-3 left-3 z-10 bg-signal-700/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wider uppercase shadow-md">
              {t("proof_badge_before")}
            </div>
          </div>
        )}


        {/* Divider Line & Circular Drag Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-ink-900 border-2 border-marigold-400 shadow-xl flex items-center justify-center pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform">
            <MoveHorizontal size={18} className="text-ink-900" />
          </div>
        </div>

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <span className="bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <Eye size={11} /> {t("proof_drag_prompt")}
          </span>
        </div>
      </div>

      {/* Preset Quick Jump Buttons */}
      <div className="px-4 py-2.5 bg-ink-50/70 border-t border-ink-100 flex items-center justify-between text-xs">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSliderPosition(100)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
              sliderPosition === 100
                ? "bg-signal-600 text-white font-bold"
                : "bg-white border border-ink-200 text-slate2 hover:text-ink-900"
            }`}
          >
            100% {t("proof_badge_before")}
          </button>
          <button
            type="button"
            onClick={() => setSliderPosition(50)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
              sliderPosition === 50
                ? "bg-ink-900 text-white font-bold"
                : "bg-white border border-ink-200 text-slate2 hover:text-ink-900"
            }`}
          >
            50/50 {t("proof_split_view")}
          </button>
          <button
            type="button"
            onClick={() => setSliderPosition(0)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
              sliderPosition === 0
                ? "bg-moss-600 text-white font-bold"
                : "bg-white border border-ink-200 text-slate2 hover:text-ink-900"
            }`}
          >
            100% {t("proof_badge_after")}
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate2">
          {Math.round(sliderPosition)}% : {100 - Math.round(sliderPosition)}%
        </span>
      </div>
    </div>
  );
}
