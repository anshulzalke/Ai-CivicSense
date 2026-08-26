import React, { createContext, useContext, useState, useCallback } from "react";
import { useLanguage } from "./LanguageContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { t, getCategoryLabel } = useLanguage();

  const playNotificationChime = useCallback((type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";

      if (type === "urgent") {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
      } else if (type === "whatsapp") {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      } else {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch {
      // AudioContext might be silent until user gesture; ignore safely
    }
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dispatchNotification = useCallback(
    ({
      type = "sms", // 'sms' | 'whatsapp' | 'urgent'
      title,
      sender = "PMC-CivicSense",
      body,
      phone = "+91 83196 09151",
      token,
      duration = 6500,
    }) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newNotif = {
        id,
        type,
        title,
        sender,
        body,
        phone,
        token,
        timestamp: new Date(),
        duration,
      };

      playNotificationChime(type);

      setNotifications((prev) => [newNotif, ...prev.slice(0, 2)]); // Keep max 3

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          dismissNotification(id);
        }, duration);
      }

      return id;
    },
    [playNotificationChime, dismissNotification]
  );

  // Pre-built trigger helpers
  const notifyComplaintFiled = useCallback(
    ({ token, category = "potholes", ward = "14", phone = "+91 83196 09151" }) => {
      const catLabel = getCategoryLabel ? getCategoryLabel(category) : category;
      const bodyTemplate = t("notif_filed_body") ||
        "PMC Alert: Grievance {token} registered under {category} (Ward {ward}). Track status live on civicsense.gov.in.";
      const body = bodyTemplate
        .replace("{token}", token)
        .replace("{category}", catLabel)
        .replace("{ward}", ward);

      return dispatchNotification({
        type: "sms",
        title: t("notif_filed_title") || "PMC SMS Alert: Grievance Registered",
        sender: "PMC-GOV-ALERT",
        body,
        phone,
        token,
      });
    },
    [dispatchNotification, t, getCategoryLabel]
  );

  const notifyOfficerAssigned = useCallback(
    ({ token, officerName = "R. Kulkarni", slaHours = 48, phone = "+91 83196 09151" }) => {
      const bodyTemplate = t("notif_assigned_body") ||
        "Officer {officer} has been assigned to your complaint {token}. Standard resolution SLA: {sla} hours.";
      const body = bodyTemplate
        .replace("{officer}", officerName)
        .replace("{token}", token)
        .replace("{sla}", String(slaHours));

      return dispatchNotification({
        type: "whatsapp",
        title: t("notif_assigned_title") || "WhatsApp: PMC Officer Assigned",
        sender: "PMC Grievance Redressal (+91 98230 11874)",
        body,
        phone,
        token,
      });
    },
    [dispatchNotification, t]
  );

  const notifyComplaintResolved = useCallback(
    ({ token, phone = "+91 83196 09151" }) => {
      const bodyTemplate = t("notif_resolved_body") ||
        "Grievance {token} marked RESOLVED with photo proof by PMC field crew. Please validate and rate your experience to claim +25 Civic Coins.";
      const body = bodyTemplate.replace("{token}", token);

      return dispatchNotification({
        type: "sms",
        title: t("notif_resolved_title") || "PMC SMS Alert: Grievance Resolved",
        sender: "PMC-RESOLVE",
        body,
        phone,
        token,
      });
    },
    [dispatchNotification, t]
  );

  const notifyComplaintEscalated = useCallback(
    ({ token, reason = "Unsatisfactory resolution", level = 2, phone = "+91 83196 09151" }) => {
      const bodyTemplate = t("notif_flagged_body") ||
        "Grievance {token} flagged by Zonal Admin ({reason}) and auto-escalated to Level {level} Authority for immediate re-inspection.";
      const body = bodyTemplate
        .replace("{token}", token)
        .replace("{reason}", reason)
        .replace("{level}", String(level));

      return dispatchNotification({
        type: "urgent",
        title: t("notif_flagged_title") || "🚨 Urgent Alert: Grievance Escalated",
        sender: "PMC-ZONAL-COMMISSIONER",
        body,
        phone,
        token,
      });
    },
    [dispatchNotification, t]
  );

  const value = {
    notifications,
    dispatchNotification,
    dismissNotification,
    notifyComplaintFiled,
    notifyOfficerAssigned,
    notifyComplaintResolved,
    notifyComplaintEscalated,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

const defaultNotificationContext = {
  notifications: [],
  dispatchNotification: () => "",
  dismissNotification: () => {},
  notifyComplaintFiled: () => "",
  notifyOfficerAssigned: () => "",
  notifyComplaintResolved: () => "",
  notifyComplaintEscalated: () => "",
};

export function useNotification() {
  const ctx = useContext(NotificationContext);
  return ctx || defaultNotificationContext;
}

