import React from "react";
import {
  MessageSquare,
  PhoneCall,
  AlertTriangle,
  X,
  Radio,
  Smartphone,
  CheckCheck,
} from "lucide-react";
import { useNotification } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";

export default function NotificationSimulator() {
  const { notifications, dismissNotification } = useNotification();
  const { t } = useLanguage();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
      {notifications.map((notif) => {
        const isWhatsApp = notif.type === "whatsapp";
        const isUrgent = notif.type === "urgent";

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto w-full rounded-2xl p-4 border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-0 animate-in slide-in-from-bottom-5 fade-in ${
              isUrgent
                ? "bg-slate-900/95 border-red-500/40 text-white shadow-red-950/40"
                : isWhatsApp
                ? "bg-[#0b141a]/95 border-emerald-500/30 text-slate-100 shadow-emerald-950/30"
                : "bg-ink-950/95 border-sky-500/30 text-white shadow-slate-950/40"
            }`}
          >
            {/* Notification App Header */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                {/* App Badge Icon */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-xs ${
                    isUrgent
                      ? "bg-red-600 text-white"
                      : isWhatsApp
                      ? "bg-[#25D366] text-white"
                      : "bg-sky-500 text-white"
                  }`}
                >
                  {isUrgent ? (
                    <AlertTriangle size={13} />
                  ) : isWhatsApp ? (
                    <PhoneCall size={12} />
                  ) : (
                    <MessageSquare size={12} />
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  <span>
                    {isUrgent
                      ? "CIVIC EMERGENCY ALERT"
                      : isWhatsApp
                      ? "WHATSAPP"
                      : "MESSAGES (SMS)"}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {t("notif_now") || "Now"}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => dismissNotification(notif.id)}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={11} />
              </button>
            </div>

            {/* Notification Body */}
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  {notif.sender}
                  {isWhatsApp && <CheckCheck size={14} className="text-sky-400" />}
                </p>
                {notif.token && (
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    {notif.token}
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-slate-200 font-sans">
                {notif.body}
              </p>
            </div>

            {/* Footer Metadata Badge */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1 text-slate-300">
                <Smartphone size={11} className="text-slate-400" />
                <span>To: {notif.phone}</span>
              </div>

              <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Radio size={9} className="animate-pulse" />
                {t("notif_live_dispatch") || "Live Dispatch"}
              </span>
            </div>

            {/* Visual Auto-dismiss Progress Bar */}
            <div className="mt-2.5 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full animate-[progress_6.5s_linear_forwards] ${
                  isUrgent ? "bg-red-500" : isWhatsApp ? "bg-emerald-500" : "bg-sky-400"
                }`}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
