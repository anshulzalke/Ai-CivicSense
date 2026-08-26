import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher({ variant = "header" }) {
  const { language, setLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 bg-ink-950/5 border border-ink-200 rounded-lg p-0.5">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`px-2 py-1 text-xs rounded font-medium transition-all ${
              language === l.code
                ? "bg-ink-900 text-paper shadow-sm"
                : "text-slate2 hover:text-ink-900"
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-200 bg-white hover:bg-ink-50 text-ink-900 text-xs font-medium transition-colors shadow-2xs"
        aria-expanded={open}
      >
        <Globe size={14} className="text-marigold-600 shrink-0" />
        <span>{activeLang.flag}</span>
        <span className="font-semibold">{activeLang.name}</span>
        <ChevronDown size={12} className={`text-slate2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-ink-100 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] uppercase font-mono2 tracking-wider text-slate2 border-b border-ink-50 mb-1">
            Select Language
          </div>
          {languages.map((l) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  isSelected
                    ? "bg-marigold-50 text-marigold-900 font-semibold"
                    : "text-ink-900 hover:bg-ink-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                </div>
                {isSelected && <Check size={13} className="text-marigold-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
