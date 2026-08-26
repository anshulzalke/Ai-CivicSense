import React, { useState, useRef } from "react";
import { Play, Pause, Volume2, Mic, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function VoiceNotePlayer({
  audioUrl,
  title = "Citizen Landmark Instructions",
  durationSec = 12,
  className = "",
}) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(durationSec);
  const audioRef = useRef(null);

  if (!audioUrl) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn("Audio playback error:", e);
          setIsPlaying(false);
        });
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={`rounded-xl border border-moss-200 bg-gradient-to-r from-moss-50/80 to-emerald-50/40 p-3 shadow-2xs space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase font-bold text-moss-900 flex items-center gap-1.5">
          <Volume2 size={14} className="text-moss-600 animate-pulse" />
          {title}
        </span>
        <span className="text-[10px] bg-moss-200/80 text-moss-900 font-semibold px-2 py-0.5 rounded-full font-mono">
          Audio Note
        </span>
      </div>

      <div className="flex items-center gap-3 bg-white/90 rounded-lg p-2 border border-moss-200/60 shadow-2xs">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-moss-600 hover:bg-moss-700 text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0 shadow-2xs"
          title={isPlaying ? "Pause" : "Play Voice Note"}
        >
          {isPlaying ? (
            <Pause size={14} fill="white" />
          ) : (
            <Play size={14} fill="white" className="ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate2 mb-1">
            <span className="font-semibold text-moss-800">
              {isPlaying ? "Playing voice note..." : "Click to play landmark directions"}
            </span>
            <span>
              {formatTime(playbackTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-moss-600 h-full transition-all duration-150"
              style={{
                width: `${duration > 0 ? (playbackTime / duration) * 100 : isPlaying ? 50 : 0}%`,
              }}
            />
          </div>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setPlaybackTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setPlaybackTime(0);
          }}
        />
      </div>
    </div>
  );
}
