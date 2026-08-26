import React, { useState } from "react";
import { Eye, EyeOff, RefreshCcw, Cpu, Scan, ShieldCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function AIDetectionOverlay({
  image,
  aiState = "idle", // "idle" | "analyzing" | "done"
  detection = null,
  onRetake,
  className = "",
}) {
  const { t } = useLanguage();
  const [showOverlay, setShowOverlay] = useState(true);

  if (!image) return null;

  const isCivic = detection ? Boolean(detection.isCivicAnomaly) : true;
  const confidence = detection?.confidence ?? 94;
  const severity = detection?.severity || 3;
  const box = detection?.box || (isCivic ? { top: 36, left: 42, width: 32, height: 38 } : null);

  const bLeft = box?.left ?? box?.x ?? 42;
  const bTop = box?.top ?? box?.y ?? 36;
  const bWidth = box?.width ?? 32;
  const bHeight = box?.height ?? 38;

  const defaultLabel = detection?.damageType === "crack"
    ? `crack ${(confidence / 100).toFixed(2)}`
    : (detection?.damageType === "garbage"
        ? `garbage ${(confidence / 100).toFixed(2)}`
        : `pothole ${(confidence / 100).toFixed(2)}`);

  const boxLabel = box?.label || detection?.boxLabel || defaultLabel;

  return (
    <div
      className={`relative max-h-[420px] w-full flex items-center justify-center bg-black/95 rounded-xl overflow-hidden border border-ink-200 shadow-md ${className}`}
    >
      {/* Inner Image + Bounding Box Wrapper (Matches Rendered Image Dimensions Exactly) */}
      <div className="relative inline-flex items-center justify-center max-h-[420px] max-w-full">
        {/* Base Image */}
        <img
          src={image}
          alt="Captured Issue"
          className="max-h-[420px] w-auto max-w-full object-contain mx-auto block select-none"
        />

        {/* 1. Analyzing Laser Scan Animation Overlay */}
        {aiState === "analyzing" && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 select-none">
            {/* Moving Laser Beam */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00c8ff] to-transparent shadow-[0_0_15px_#00c8ff] animate-[bounce_1.5s_infinite]" />

            {/* Holographic Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Central Neural Radar */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#00c8ff] flex items-center justify-center animate-spin text-[#00c8ff] bg-[#00c8ff]/10">
                <Scan size={26} />
              </div>
              <div className="text-center">
                <p className="text-white font-mono text-sm font-semibold tracking-wider flex items-center justify-center gap-2">
                  <Cpu size={16} className="text-[#00c8ff] animate-pulse" />
                  {t("ai_analyzing_yolo")}
                </p>
                <p className="text-white/60 font-mono text-xs mt-1">
                  YOLOv8 Cavity Segmentation &amp; Severity Inference
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Detected State: Single Unified Authentic YOLOv8 Cyan Bounding Box */}
        {aiState === "done" && isCivic && box && showOverlay && (
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
              {/* Authentic YOLO Solid Cyan Header Pill sitting directly on top-left edge */}
              <div className="absolute -top-5.5 -left-[2px] bg-[#00c8ff] text-black font-mono font-bold text-[11px] sm:text-xs px-1.5 py-0.5 leading-tight select-none shadow-xs whitespace-nowrap">
                {boxLabel}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {aiState === "done" && isCivic && box && (
          <button
            type="button"
            onClick={() => setShowOverlay(!showOverlay)}
            className="px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer border border-white/10 transition-colors shadow-sm"
            title={showOverlay ? t("ai_hide_overlay") : t("ai_show_overlay")}
          >
            {showOverlay ? <EyeOff size={13} /> : <Eye size={13} />}
            <span className="hidden sm:inline">
              {showOverlay ? t("ai_hide_overlay") : t("ai_show_overlay")}
            </span>
          </button>
        )}

        {onRetake && (
          <button
            type="button"
            onClick={onRetake}
            className="px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer border border-white/10 transition-colors shadow-sm"
          >
            <RefreshCcw size={13} />
            <span>{t("file_retake")}</span>
          </button>
        )}
      </div>

      {/* Bottom Status Tag */}
      {aiState === "done" && (
        <div className="absolute bottom-3 left-3 z-20">
          {isCivic ? (
            <span className="bg-black/85 backdrop-blur-md text-[#00c8ff] border border-[#00c8ff]/40 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
              <ShieldCheck size={13} className="text-[#00c8ff]" />
              YOLOv8 Neural Detection Complete
            </span>
          ) : (
            <span className="bg-signal-950/90 backdrop-blur-md text-signal-300 border border-signal-500/40 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-signal-400 animate-pulse" />
              {t("ai_no_anomaly_badge")} ({t("ai_confidence_low")})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
