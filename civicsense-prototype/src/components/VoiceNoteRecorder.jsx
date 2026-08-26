import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Volume2, AlertCircle, Sparkles } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function VoiceNoteRecorder({ onAudioChange, audioUrl = null, className = "" }) {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(audioUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [micError, setMicError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const MAX_SECONDS = 30;

  useEffect(() => {
    if (audioUrl) {
      setRecordedAudio(audioUrl);
    }
  }, [audioUrl]);

  // Clean up timer and streams
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setMicError("");
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result;
          setRecordedAudio(base64Data);
          onAudioChange?.(base64Data);
        };
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // Start 30s countdown timer
      let seconds = 0;
      timerIntervalRef.current = setInterval(() => {
        seconds += 1;
        setRecordingSeconds(seconds);
        if (seconds >= MAX_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.warn("Microphone access error:", err);
      setMicError("Microphone permission denied. Please allow mic access in your browser.");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleDeleteAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
    setRecordedAudio(null);
    setPlaybackTime(0);
    setAudioDuration(0);
    onAudioChange?.(null);
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().catch((err) => console.warn("Playback error:", err));
      setIsPlaying(true);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className={`rounded-xl border border-ink-100 bg-ink-50/40 p-3.5 space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold flex items-center gap-1.5">
          <Volume2 size={13} className="text-moss-600" />
          {t("voice_note_title") || "Landmark Voice Note (Optional)"}
        </label>
        {isRecording && (
          <span className="text-[11px] font-mono text-rose-600 font-bold animate-pulse flex items-center gap-1.5 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            REC {formatTime(recordingSeconds)} / 0:30
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate2 leading-relaxed">
        {t("voice_note_hint") || "Speak landmark directions for field officers (e.g., 'Behind metro pillar #42 opposite bakery')."}
      </p>

      {micError && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* 1. Recording in Progress State */}
      {isRecording ? (
        <div className="flex items-center justify-between bg-rose-500/10 border border-rose-300 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center animate-pulse shadow-[0_0_12px_rgba(225,29,72,0.6)]">
              <Mic size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-900 font-display">
                Recording Audio Instructions...
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1 h-3 bg-rose-500 animate-[bounce_0.6s_infinite_100ms] rounded-full" />
                <span className="w-1 h-4 bg-rose-500 animate-[bounce_0.6s_infinite_200ms] rounded-full" />
                <span className="w-1 h-2 bg-rose-500 animate-[bounce_0.6s_infinite_300ms] rounded-full" />
                <span className="w-1 h-5 bg-rose-500 animate-[bounce_0.6s_infinite_150ms] rounded-full" />
                <span className="w-1 h-3 bg-rose-500 animate-[bounce_0.6s_infinite_250ms] rounded-full" />
                <span className="text-[11px] font-mono font-bold text-rose-700 ml-1.5">
                  {formatTime(recordingSeconds)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Square size={13} fill="white" />
            <span>Stop</span>
          </button>
        </div>
      ) : recordedAudio ? (
        /* 2. Audio Recorded State (WhatsApp Style Audio Player) */
        <div className="flex items-center justify-between bg-white border border-moss-300/80 rounded-xl p-2.5 shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-9 h-9 rounded-full bg-moss-600 hover:bg-moss-700 text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0 shadow-2xs"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
            </button>

            {/* Audio waveform mockup / progress scrubber */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate2 mb-1">
                <span className="font-semibold text-moss-800">
                  {isPlaying ? "Playing Voice Note..." : "Voice Note Attached"}
                </span>
                <span>
                  {formatTime(playbackTime)} / {formatTime(audioDuration || recordingSeconds || 6)}
                </span>
              </div>
              <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-moss-600 h-full transition-all duration-150"
                  style={{
                    width: `${audioDuration > 0 ? (playbackTime / audioDuration) * 100 : isPlaying ? 50 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Hidden HTML5 Audio Element */}
            <audio
              ref={audioPlayerRef}
              src={recordedAudio}
              onTimeUpdate={() => {
                if (audioPlayerRef.current) {
                  setPlaybackTime(audioPlayerRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (audioPlayerRef.current) {
                  setAudioDuration(audioPlayerRef.current.duration);
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                setPlaybackTime(0);
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleDeleteAudio}
            className="p-2 rounded-lg text-slate2 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            title="Delete & Re-record"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        /* 3. Idle / Record Button State */
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-ink-300 hover:border-moss-500 bg-white hover:bg-moss-50/30 text-ink-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs group"
        >
          <div className="w-6 h-6 rounded-full bg-moss-100 text-moss-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mic size={14} />
          </div>
          <span>{t("voice_note_record_btn") || "Record Landmark Voice Note"}</span>
          <span className="text-[10px] text-slate2 font-normal font-mono">(Max 30s)</span>
        </button>
      )}
    </div>
  );
}
