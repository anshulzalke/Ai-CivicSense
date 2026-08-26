import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, RefreshCcw, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function CameraCapture({ onCapture }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [mode, setMode] = useState("idle"); // idle | live | denied | captured
  const [image, setImage] = useState(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setMode("live");
    } catch {
      setMode("denied");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setImage(dataUrl);
    setMode("captured");
    stopCamera();
    onCapture?.(dataUrl, { name: "camera_capture.jpg", isCamera: true });
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setMode("captured");
      onCapture?.(reader.result, { name: file.name, size: file.size, type: file.type, rawFile: file, isCamera: false });
    };
    reader.readAsDataURL(file);
  }

  function retake() {
    setImage(null);
    onCapture?.(null);
    startCamera();
  }

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="border border-ink-100 rounded-xl overflow-hidden bg-ink-950/2">
      {mode === "idle" && (
        <div className="p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-ink-900 flex items-center justify-center text-paper">
            <Camera size={20} />
          </div>
          <p className="text-sm text-slate2">{t("file_photo_helper")}</p>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 rounded-lg bg-ink-900 text-paper text-sm font-medium hover:bg-ink-700 cursor-pointer"
            >
              {t("file_open_camera")}
            </button>
            <label className="px-4 py-2 rounded-lg border border-ink-300 text-sm font-medium cursor-pointer hover:bg-ink-50">
              {t("file_upload_photo")}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>
        </div>
      )}

      {mode === "denied" && (
        <div className="p-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-signal-600">{t("file_camera_denied")}</p>
          <label className="px-4 py-2 rounded-lg bg-ink-900 text-paper text-sm font-medium cursor-pointer inline-flex items-center gap-2">
            <Upload size={14} /> {t("file_upload_photo_instead")}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </div>
      )}

      {mode === "live" && (
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover bg-black" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
            <button
              type="button"
              onClick={capture}
              className="w-14 h-14 rounded-full bg-paper border-4 border-marigold-400 shadow-lg cursor-pointer"
              aria-label="Capture photo"
            />
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setMode("idle");
              }}
              className="absolute right-3 top-3 w-8 h-8 rounded-full bg-ink-900/70 text-paper flex items-center justify-center cursor-pointer"
              aria-label="Close camera"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {mode === "captured" && image && (
        <div className="relative max-h-[420px] w-full flex items-center justify-center bg-ink-950/5 rounded-xl overflow-hidden">
          <img
            src={image}
            alt="Captured issue"
            className="max-h-[420px] w-auto max-w-full object-contain mx-auto block select-none"
          />
          <button
            type="button"
            onClick={retake}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-ink-900/80 hover:bg-ink-900 text-paper text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
          >
            <RefreshCcw size={12} /> {t("file_retake")}
          </button>
        </div>
      )}

    </div>
  );
}
