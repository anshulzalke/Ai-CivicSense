import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  ShieldCheck,
  Check,
  Mic,
  MicOff,
} from "lucide-react";
import CameraCapture from "../../components/CameraCapture";
import Seal from "../../components/Seal";
import AIDetectionOverlay from "../../components/AIDetectionOverlay";
import VoiceNoteRecorder from "../../components/VoiceNoteRecorder";
import { downloadPDFReceipt } from "../../lib/pdfReceipt";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotification } from "../../context/NotificationContext";
import { PUNE_BOUNDS } from "../../lib/mockData";
import { classifyCivicImage } from "../../lib/imageClassifier";

function randomFallbackLocation() {
  const [minLat, minLng, maxLat, maxLng] = PUNE_BOUNDS;
  return {
    lat: minLat + Math.random() * (maxLat - minLat),
    lng: minLng + Math.random() * (maxLng - minLng),
  };
}

export default function FileComplaint() {
  const { fileComplaint, checkDuplicate, departments, user } = useApp();
  const { t, language, getCategoryLabel } = useLanguage();
  const { notifyComplaintFiled } = useNotification();
  const navigate = useNavigate();

  const [image, setImage] = useState(null);
  const [category, setCategory] = useState("potholes");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState(3);
  const [aiState, setAiState] = useState("idle"); // idle | analyzing | done
  const [detection, setDetection] = useState(null);
  const [isOverriddenCategory, setIsOverriddenCategory] = useState(false);
  const [isOverriddenSeverity, setIsOverriddenSeverity] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationState, setLocationState] = useState("idle"); // idle | granted | denied | manual
  const [manualAddress, setManualAddress] = useState("");
  const [duplicate, setDuplicate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [audioData, setAudioData] = useState(null);

  // Speech-to-Text states
  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState(null); // 'title' | 'description' | null
  const [speechToast, setSpeechToast] = useState("");
  const recognitionRef = useRef(null);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setActiveField(null);
  };

  const startListening = (field = "description") => {
    if (
      typeof window === "undefined" ||
      (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window))
    ) {
      console.warn("Speech recognition not supported in this browser");
      setSpeechToast(t("voice_mic_denied") || "Speech recognition is not supported in this browser.");
      setTimeout(() => setSpeechToast(""), 5000);
      return;
    }

    if (isListening && activeField === field) {
      stopListening();
      return;
    }

    stopListening();

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang =
        language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setActiveField(field);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        if (transcript) {
          if (field === "title") {
            setTitle((prev) => (prev ? `${prev} ${transcript}` : transcript));
          } else {
            setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        }
        setIsListening(false);
        setActiveField(null);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event?.error);
        if (
          event?.error === "not-allowed" ||
          event?.error === "service-not-allowed"
        ) {
          setSpeechToast(
            t("voice_mic_denied") ||
              "Microphone permission denied. Please allow microphone access in browser settings."
          );
          setTimeout(() => setSpeechToast(""), 5000);
        }
        setIsListening(false);
        setActiveField(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        setActiveField(null);
      };

      setIsListening(true);
      setActiveField(field);
      recognition.start();
    } catch (err) {
      console.warn("Failed to start speech recognition:", err);
      setIsListening(false);
      setActiveField(null);
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  async function runAIAnalysis(dataUrl, fileMeta = {}) {
    setImage(dataUrl);
    if (!dataUrl) {
      setAiState("idle");
      setDetection(null);
      setIsOverriddenCategory(false);
      setIsOverriddenSeverity(false);
      return;
    }
    setAiState("analyzing");

    const startTime = Date.now();
    try {
      const result = await classifyCivicImage(dataUrl, fileMeta);
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 1100 - elapsed);

      setTimeout(() => {
        setDetection(result);
        if (result.isCivicAnomaly) {
          if (result.category) {
            setCategory(result.category);
          }
          if (result.severity) {
            setSeverity(result.severity);
          }
          if (!title.trim() && result.suggestedTitleKey) {
            setTitle(t(result.suggestedTitleKey) || result.suggestedTitle);
          }
          setIsOverriddenCategory(false);
          setIsOverriddenSeverity(false);
        } else {
          setIsOverriddenCategory(false);
          setIsOverriddenSeverity(false);
        }
        setAiState("done");
      }, remainingDelay);
    } catch (err) {
      console.error("AI Analysis error:", err);
      setAiState("done");
    }
  }

  function handleRetake() {
    setImage(null);
    setDetection(null);
    setAiState("idle");
    setIsOverriddenCategory(false);
    setIsOverriddenSeverity(false);
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationState("granted");
      },
      () => setLocationState("denied"),
      { timeout: 6000 }
    );
  }

  function useManualLocation() {
    setLocation(randomFallbackLocation());
    setLocationState("manual");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    const loc = location || randomFallbackLocation();
    const draft = {
      category,
      title: title.trim() || `${getCategoryLabel(category)} issue reported`,
      description,
      severity,
      lat: loc.lat,
      lng: loc.lng,
      image,
      audio: audioData,
      audioUrl: audioData,
      audio_url: audioData,
      audio_base64: audioData,
    };

    setSubmitting(true);
    try {
      if (!duplicate) {
        const existingDup = await checkDuplicate(draft);
        if (existingDup) {
          setDuplicate(existingDup);
          setSubmitting(false);
          return;
        }
      }

      const record = await fileComplaint(draft);
      setSubmitted(record);
      notifyComplaintFiled?.({
        token: record.token,
        category: record.category,
        ward: user?.ward || "14",
        phone: "+91 83196 09151",
      });
    } catch (err) {
      setSubmitError(err.message || "Failed to file complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const deptName = getCategoryLabel(submitted.category);
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-14 h-14 rounded-full bg-moss-600/10 text-moss-600 flex items-center justify-center mx-auto mb-5 shadow-2xs">
          <CheckCircle2 size={24} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          {t("file_filed_success_title")}
        </h1>
        <p className="text-sm text-slate2 mt-2">
          {t("file_filed_success_desc")} ({deptName})
        </p>

        <div className="ticket-notch mt-6 bg-white border border-ink-100 rounded-xl p-5 inline-flex items-center gap-4 text-left shadow-2xs w-full">
          <Seal severity={submitted.severity} size={56} />
          <div className="text-left flex-1 min-w-0">
            <p className="font-mono text-lg font-semibold text-ink-900">{submitted.token}</p>
            <p className="text-sm text-slate2 truncate">{submitted.title}</p>
          </div>
        </div>

        {/* Prominent PDF Download Button */}
        <div className="mt-6">
          <button
            type="button"
            disabled={downloadingReceipt}
            onClick={async () => {
              setDownloadingReceipt(true);
              try {
                await downloadPDFReceipt(submitted, user);
              } catch (e) {
                console.error("Failed to generate PDF receipt:", e);
              } finally {
                setDownloadingReceipt(false);
              }
            }}
            className="w-full py-3 px-5 rounded-xl bg-moss-600 text-paper text-sm font-semibold hover:bg-moss-700 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
          >
            <Download size={16} />
            {downloadingReceipt ? t("receipt_downloading") : t("receipt_download_btn")}
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => navigate(`/citizen/track?token=${submitted.token}`)}
            className="flex-1 py-2.5 rounded-xl bg-ink-900 text-paper text-sm font-medium hover:bg-ink-700 transition-colors cursor-pointer"
          >
            {t("file_track_this_btn")}
          </button>
          <button
            onClick={() => navigate("/citizen")}
            className="flex-1 py-2.5 rounded-xl border border-ink-300 text-sm font-medium hover:bg-ink-50 transition-colors cursor-pointer"
          >
            {t("file_back_overview_btn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
        {t("file_title")}
      </h1>
      <p className="text-sm text-slate2 mb-6">
        {t("file_subtitle")}
      </p>

      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-signal-50 border border-signal-200 text-signal-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo evidence + AI Detection Overlay */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-slate2 mb-2 block font-semibold">
            {t("file_photo_label")}
          </label>
          {!image ? (
            <CameraCapture onCapture={runAIAnalysis} />
          ) : (
            <AIDetectionOverlay
              image={image}
              aiState={aiState}
              detection={detection}
              onRetake={handleRetake}
            />
          )}
        </div>

        {/* AI Diagnostics Banner */}
        {aiState === "done" && detection && (
          <div
            className={`border rounded-2xl p-4 transition-all duration-300 ${
              detection.isCivicAnomaly
                ? "border-moss-200 bg-moss-50/70"
                : "border-signal-200 bg-signal-50/70"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl text-white shrink-0 ${
                  detection.isCivicAnomaly ? "bg-moss-600" : "bg-signal-600"
                }`}
              >
                {detection.isCivicAnomaly ? (
                  <Sparkles size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-ink-900 font-display">
                    {detection.isCivicAnomaly
                      ? t("ai_detected_title")
                      : t("ai_no_anomaly_title")}
                  </h4>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      detection.isCivicAnomaly
                        ? "bg-moss-100 text-moss-800 border-moss-300"
                        : "bg-signal-100 text-signal-800 border-signal-300"
                    }`}
                  >
                    {t("ai_confidence_badge")} {detection.confidence}%
                  </span>
                </div>
                <p className="text-xs text-slate2 mt-1 leading-relaxed">
                  {detection.isCivicAnomaly
                    ? t("ai_detected_desc")
                    : t("ai_no_anomaly_desc")}
                </p>

                {detection.isCivicAnomaly && (
                  <div className="mt-3 pt-3 border-t border-moss-200/60 flex items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-slate2">
                        {t("ai_auto_category")}:
                      </span>
                      <strong className="text-ink-900 bg-white/80 px-2 py-0.5 rounded border border-moss-200">
                        {getCategoryLabel(detection.category)}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate2">
                        {t("ai_auto_severity")}:
                      </span>
                      <strong className="text-ink-900 bg-white/80 px-2 py-0.5 rounded border border-moss-200">
                        {detection.severity}/5
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold flex items-center gap-1.5">
              {t("file_category_label")}
            </label>
            {isOverriddenCategory && (
              <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                {t("ai_manual_override_badge")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(departments || []).map((dept) => {
              const isSelected = category === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => {
                    setCategory(dept.id);
                    if (aiState === "done" && detection?.category !== dept.id) {
                      setIsOverriddenCategory(true);
                    } else {
                      setIsOverriddenCategory(false);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-ink-900 bg-ink-900 text-paper shadow-sm"
                      : "border-ink-100 bg-white hover:border-ink-300 text-ink-900"
                  }`}
                >
                  <span className="truncate">{getCategoryLabel(dept.id)}</span>
                  {isSelected && <Check size={14} className="shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Severity Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold">
              {t("file_severity_label")}
            </label>
            {isOverriddenSeverity && (
              <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                {t("ai_manual_override_badge")}
              </span>
            )}
          </div>
          <div className="bg-white border border-ink-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <Seal severity={severity} size={36} />
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setSeverity(lvl);
                      if (aiState === "done" && detection?.severity !== lvl) {
                        setIsOverriddenSeverity(true);
                      } else {
                        setIsOverriddenSeverity(false);
                      }
                    }}
                    className={`w-8 h-8 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                      severity === lvl
                        ? "bg-ink-900 text-paper scale-105 shadow-2xs"
                        : "bg-ink-50 hover:bg-ink-100 text-ink-700"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={severity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSeverity(val);
                if (aiState === "done" && detection?.severity !== val) {
                  setIsOverriddenSeverity(true);
                } else {
                  setIsOverriddenSeverity(false);
                }
              }}
              className="mt-3 w-full accent-marigold-400 cursor-pointer"
            />
            <p className="text-xs text-slate2 mt-1 font-mono">
              {t("file_severity_level")} {severity}
            </p>
          </div>
        </div>

        {/* Speech Recognition Error / Warning Banner */}
        {speechToast && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              {speechToast}
            </span>
            <button
              type="button"
              onClick={() => setSpeechToast("")}
              className="text-rose-600 font-bold hover:underline cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Title Input with Mic STT */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold flex items-center gap-1.5">
              {t("file_title_label")}
            </label>
            {isListening && activeField === "title" && (
              <span className="text-[11px] font-mono text-rose-600 font-bold animate-pulse flex items-center gap-1.5 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Listening... Speak now
              </span>
            )}
          </div>
          <div className="relative mt-1.5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("file_title_placeholder")}
              className={`w-full pl-4 pr-12 py-2.5 rounded-xl border bg-white text-sm outline-none transition-all ${
                isListening && activeField === "title"
                  ? "border-rose-500 ring-2 ring-rose-500/25 bg-rose-50/15 shadow-sm"
                  : "border-ink-100 focus:border-marigold-400"
              }`}
            />
            <button
              type="button"
              onClick={() => startListening("title")}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                isListening && activeField === "title"
                  ? "bg-rose-600 text-white animate-pulse shadow-[0_0_14px_rgba(225,29,72,0.7)]"
                  : "bg-ink-50 hover:bg-ink-100 text-slate2 hover:text-ink-900 border border-ink-200"
              }`}
              title={
                isListening && activeField === "title"
                  ? t("voice_stop")
                  : t("voice_speak_title")
              }
            >
              {isListening && activeField === "title" ? (
                <MicOff size={15} />
              ) : (
                <Mic size={15} />
              )}
            </button>
          </div>
        </div>

        {/* Description Textarea with Mic STT */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold flex items-center gap-1.5">
              {t("file_desc_label")}
            </label>
            {isListening && activeField === "description" && (
              <span className="text-[11px] font-mono text-rose-600 font-bold animate-pulse flex items-center gap-1.5 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Listening... Speak now
              </span>
            )}
          </div>
          <div className="relative mt-1.5">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("file_desc_placeholder")}
              className={`w-full pl-4 pr-12 py-2.5 rounded-xl border bg-white text-sm outline-none transition-all ${
                isListening && activeField === "description"
                  ? "border-rose-500 ring-2 ring-rose-500/25 bg-rose-50/15 shadow-sm"
                  : "border-ink-100 focus:border-marigold-400"
              }`}
            />
            <button
              type="button"
              onClick={() => startListening("description")}
              className={`absolute right-2.5 top-2.5 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                isListening && activeField === "description"
                  ? "bg-rose-600 text-white animate-pulse shadow-[0_0_14px_rgba(225,29,72,0.7)]"
                  : "bg-ink-50 hover:bg-ink-100 text-slate2 hover:text-ink-900 border border-ink-200"
              }`}
              title={
                isListening && activeField === "description"
                  ? t("voice_stop")
                  : t("voice_speak_desc")
              }
            >
              {isListening && activeField === "description" ? (
                <MicOff size={15} />
              ) : (
                <Mic size={15} />
              )}
            </button>
          </div>
        </div>

        {/* WhatsApp-Style Landmark Voice Note Recorder (MediaRecorder API) */}
        <VoiceNoteRecorder
          onAudioChange={setAudioData}
          audioUrl={audioData}
        />

        {/* Location Selection */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-slate2 mb-2 block font-semibold">
            {t("file_location_label")}
          </label>
          {locationState === "idle" && (
            <button
              type="button"
              onClick={requestLocation}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-ink-300 text-sm font-medium hover:bg-ink-50 transition-colors cursor-pointer"
            >
              <MapPin size={14} className="text-marigold-600" /> {t("file_share_location")}
            </button>
          )}
          {locationState === "granted" && (
            <p className="text-sm text-moss-600 flex items-center gap-1.5 font-medium">
              <MapPin size={14} /> {t("file_location_captured")} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
            </p>
          )}
          {locationState === "denied" && (
            <div className="space-y-2">
              <p className="text-sm text-signal-600 flex items-center gap-1.5">
                <AlertTriangle size={14} /> {t("file_location_denied")}
              </p>
              <div className="flex gap-2">
                <input
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="e.g. Wagholi, Pune"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-ink-100 bg-white text-sm outline-none focus:border-marigold-400"
                />
                <button
                  type="button"
                  onClick={useManualLocation}
                  className="px-4 py-2.5 rounded-xl bg-ink-900 text-paper text-sm font-medium hover:bg-ink-700 transition-colors cursor-pointer"
                >
                  {t("file_location_manual_btn")}
                </button>
              </div>
            </div>
          )}
          {locationState === "manual" && (
            <p className="text-sm text-moss-600 flex items-center gap-1.5 font-medium">
              <MapPin size={14} /> {t("file_location_manual_set")} "{manualAddress || "manual entry"}"
            </p>
          )}
        </div>

        {/* Duplicate warning */}
        {duplicate && (
          <div className="border border-marigold-200 bg-marigold-50 rounded-2xl p-4">
            <p className="text-sm font-semibold text-ink-900 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-marigold-600" /> {t("file_duplicate_title")}
            </p>
            <p className="text-xs text-slate2 mt-1 leading-relaxed">
              <strong>{duplicate.token}</strong> — "{duplicate.title}" {t("file_duplicate_desc")}
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="mt-3 px-4 py-2 rounded-xl bg-ink-900 text-paper text-xs font-semibold hover:bg-ink-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? t("file_submitting_btn") : t("file_file_anyway")}
            </button>
          </div>
        )}

        {!duplicate && (
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-ink-900 text-paper font-semibold hover:bg-ink-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {submitting ? t("file_submitting_btn") : t("file_submit_btn")}
          </button>
        )}
      </form>
    </div>
  );
}
