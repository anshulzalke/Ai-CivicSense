import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { TRANSLATIONS, LANGUAGES } from "../lib/i18n";


const LanguageContext = createContext(null);

const STORAGE_KEY = "civicsense_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && TRANSLATIONS[saved] ? saved : "en";
    } catch {
      return "en";
    }
  });

  const setLanguage = useCallback((langCode) => {
    if (TRANSLATIONS[langCode]) {
      setLanguageState(langCode);
      try {
        localStorage.setItem(STORAGE_KEY, langCode);
      } catch {
        // ignore
      }
    }
  }, []);

  const t = useCallback(
    (key) => {
      const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
      if (currentDict[key] !== undefined) return currentDict[key];
      if (TRANSLATIONS.en[key] !== undefined) return TRANSLATIONS.en[key];
      return key;
    },
    [language]
  );

  const getStatusLabel = useCallback(
    (status) => {
      const map = {
        submitted: t("status_submitted"),
        in_progress: t("status_in_progress"),
        escalated: t("status_escalated"),
        resolved_pending_validation: t("status_resolved_pending_validation"),
        closed: t("status_closed"),
        reopened: t("status_reopened"),
      };
      return map[status] || status;
    },
    [t]
  );

  const getCategoryLabel = useCallback(
    (cat) => {
      const normalized = (cat || "").toLowerCase();
      const map = {
        potholes: t("cat_potholes"),
        pothole: t("cat_potholes"),
        road_damage: t("cat_potholes"),
        garbage: t("cat_garbage"),
        solid_waste: t("cat_garbage"),
        sanitation: t("cat_sanitation") || t("cat_garbage"),
        waste: t("cat_garbage"),
        drainage: t("cat_drainage"),
        drain: t("cat_drainage"),
        streetlights: t("cat_streetlights"),
        streetlight: t("cat_streetlights"),
        infrastructure: t("cat_infrastructure"),
        traffic: t("cat_traffic"),
        all: t("cat_all"),
      };
      return map[normalized] || cat;
    },
    [t]
  );

  const value = useMemo(
    () => ({
      language,
      languages: LANGUAGES,
      setLanguage,
      t,
      getStatusLabel,
      getCategoryLabel,
    }),
    [language, setLanguage, t, getStatusLabel, getCategoryLabel]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

const defaultLanguageContext = {
  language: "en",
  languages: LANGUAGES,
  setLanguage: () => {},
  t: (key) => TRANSLATIONS?.en?.[key] ?? key ?? "",
  getStatusLabel: (status) => {
    const map = {
      submitted: TRANSLATIONS?.en?.status_submitted || "Submitted",
      in_progress: TRANSLATIONS?.en?.status_in_progress || "In Progress",
      escalated: TRANSLATIONS?.en?.status_escalated || "Escalated (Level 1)",
      resolved_pending_validation: TRANSLATIONS?.en?.status_resolved_pending_validation || "Awaiting Your Validation",
      closed: TRANSLATIONS?.en?.status_closed || "Closed / Satisfied",
      reopened: TRANSLATIONS?.en?.status_reopened || "Re-raised by Citizen",
    };
    return map[status] || status || "";
  },
  getCategoryLabel: (cat) => {
    const normalized = (cat || "").toLowerCase();
    const map = {
      potholes: TRANSLATIONS?.en?.cat_potholes || "Roads & Potholes",
      pothole: TRANSLATIONS?.en?.cat_potholes || "Roads & Potholes",
      road_damage: TRANSLATIONS?.en?.cat_potholes || "Roads & Potholes",
      garbage: TRANSLATIONS?.en?.cat_garbage || "Solid Waste Management",
      solid_waste: TRANSLATIONS?.en?.cat_garbage || "Solid Waste Management",
      sanitation: TRANSLATIONS?.en?.cat_sanitation || "Solid Waste Management",
      waste: TRANSLATIONS?.en?.cat_garbage || "Solid Waste Management",
      drainage: TRANSLATIONS?.en?.cat_drainage || "Drainage & Sewerage",
      drain: TRANSLATIONS?.en?.cat_drainage || "Drainage & Sewerage",
      streetlights: TRANSLATIONS?.en?.cat_streetlights || "Streetlighting & Electrical",
      streetlight: TRANSLATIONS?.en?.cat_streetlights || "Streetlighting & Electrical",
      infrastructure: TRANSLATIONS?.en?.cat_infrastructure || "General Infrastructure",
      traffic: TRANSLATIONS?.en?.cat_traffic || "Traffic & Signage",
      all: TRANSLATIONS?.en?.cat_all || "All Departments",
    };
    return map[normalized] || cat || "";
  },
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx || defaultLanguageContext;
}

