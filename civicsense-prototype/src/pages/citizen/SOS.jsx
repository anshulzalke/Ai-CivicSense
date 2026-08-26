import React, { useState, useEffect } from "react";
import {
  Siren,
  Phone,
  Flame,
  ShieldAlert,
  HeartPulse,
  Users,
  Baby,
  ShieldCheck,
  Car,
  Train,
  AlertTriangle,
  HeartHandshake,
  Activity,
  Copy,
  Check,
  MapPin,
  RefreshCw,
  Mic,
  Volume2,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const EMERGENCY_CONTACTS = [
  {
    number: "100",
    icon: ShieldAlert,
    names: {
      en: "Police Emergency",
      hi: "पुलिस आपातकाल",
      mr: "पोलीस नियंत्रण कक्ष",
    },
    categories: {
      en: "Law & Order",
      hi: "सुरक्षा व कानून",
      mr: "कायदा व सुव्यवस्था",
    },
  },
  {
    number: "101",
    icon: Flame,
    names: {
      en: "Fire Brigade & Rescue",
      hi: "दमकल व आपदा बचाव",
      mr: "अग्निशामक दल व बचाव",
    },
    categories: {
      en: "Fire & Hazmat",
      hi: "अग्नि व आपातकाल",
      mr: "अग्नि व बचाव कार्य",
    },
  },
  {
    number: "108",
    icon: HeartPulse,
    names: {
      en: "Ambulance / Medical EMS",
      hi: "एम्बुलेंस / चिकित्सा सहायता",
      mr: "रुग्णवाहिका / वैद्यकीय मदत",
    },
    categories: {
      en: "Medical",
      hi: "चिकित्सा",
      mr: "वैद्यकीय",
    },
  },
  {
    number: "1091",
    icon: Users,
    names: {
      en: "Women's Helpline",
      hi: "महिला सुरक्षा हेल्पलाइन",
      mr: "महिला सुरक्षा हेल्पलाइन",
    },
    categories: {
      en: "Safety",
      hi: "महिला सुरक्षा",
      mr: "महिला सुरक्षा",
    },
  },
  {
    number: "1098",
    icon: Baby,
    names: {
      en: "Child Helpline",
      hi: "बाल सुरक्षा हेल्पलाइन",
      mr: "बाल सुरक्षा हेल्पलाइन",
    },
    categories: {
      en: "Protection",
      hi: "बाल संरक्षण",
      mr: "बाल संरक्षण",
    },
  },
  {
    number: "1078",
    icon: ShieldCheck,
    names: {
      en: "NDRF Disaster Relief",
      hi: "NDRF आपदा राहत बल",
      mr: "NDRF आपत्ती निवारण दल",
    },
    categories: {
      en: "Disaster",
      hi: "आपदा प्रबंधन",
      mr: "आपत्ती व्यवस्थापन",
    },
  },
  {
    number: "1073",
    icon: Car,
    names: {
      en: "Road Accident Emergency",
      hi: "सड़क दुर्घटना हेल्पलाइन",
      mr: "रस्ता अपघात आपत्कालीन",
    },
    categories: {
      en: "Traffic",
      hi: "यातायात",
      mr: "वाहतूक",
    },
  },
  {
    number: "139",
    icon: Train,
    names: {
      en: "Railway Protection (RPF)",
      hi: "रेलवे सुरक्षा बल (RPF)",
      mr: "रेल्वे सुरक्षा दल (RPF)",
    },
    categories: {
      en: "Transit",
      hi: "रेलवे",
      mr: "रेल्वे",
    },
  },
  {
    number: "1906",
    icon: AlertTriangle,
    names: {
      en: "LPG Gas Leak Helpline",
      hi: "एलपीजी गैस रिसाव हेल्पलाइन",
      mr: "घरगुती गॅस गळती हेल्पलाइन",
    },
    categories: {
      en: "Hazards",
      hi: "गैस सुरक्षा",
      mr: "गॅस सुरक्षा",
    },
  },
  {
    number: "14567",
    icon: HeartHandshake,
    names: {
      en: "Senior Citizen Helpline",
      hi: "वरिष्ठ नागरिक हेल्पलाइन",
      mr: "ज्येष्ठ नागरिक हेल्पलाइन",
    },
    categories: {
      en: "Elder Care",
      hi: "वृद्ध कल्याण",
      mr: "ज्येष्ठ कल्याण",
    },
  },
  {
    number: "1800-599-0019",
    icon: Activity,
    names: {
      en: "Mental Health Helpline (Kiran)",
      hi: "मानसिक स्वास्थ्य हेल्पलाइन (किरण)",
      mr: "मानसिक आरोग्य हेल्पलाइन (किरण)",
    },
    categories: {
      en: "Wellness",
      hi: "मानसिक स्वास्थ्य",
      mr: "मानसिक स्वास्थ्य",
    },
  },
];

export default function SOS() {
  const { t, language } = useLanguage();
  const langKey = language || "en";
  const [timeStr, setTimeStr] = useState("");
  const [copiedNum, setCopiedNum] = useState(null);
  const [location, setLocation] = useState({
    lat: 18.5204,
    lng: 73.8567,
    accuracy: 15,
    address: "Shivajinagar / Wagholi Ward Corridor, Pune District",
    loading: false,
  });

  const [safeWordActive, setSafeWordActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [audioSaved, setAudioSaved] = useState(false);
  const [openGuideline, setOpenGuideline] = useState(0); // 0 or 1

  // Digital Live Clock
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeStr(now.toTimeString().split(" ")[0]);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Geolocation Fetcher
  function fetchLocation() {
    if (!navigator.geolocation) return;
    setLocation((prev) => ({ ...prev, loading: true }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          address: "Live GPS Acquired · Pune District Jurisdiction",
          loading: false,
        });
      },
      () => {
        setLocation((prev) => ({
          ...prev,
          loading: false,
          address: "Pune Municipal District (Fallback GPS Coordinates)",
        }));
      },
      { timeout: 8000 }
    );
  }

  useEffect(() => {
    fetchLocation();
  }, []);

  // Copy Number Helper
  function handleCopy(number) {
    navigator.clipboard.writeText(number);
    setCopiedNum(number);
    setTimeout(() => setCopiedNum(null), 2500);
  }

  // Audio Recording Simulation
  function handleStartRecording() {
    if (recording) return;
    setRecording(true);
    setAudioSaved(false);
    setRecordSec(10);

    const timer = setInterval(() => {
      setRecordSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRecording(false);
          setAudioSaved(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Red Emergency Top Banner with Live Digital Clock */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-6 rounded-2xl shadow-lg border border-red-600/30 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <Siren size={180} />
        </div>

        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-red-200 bg-red-900/50 border border-red-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block mb-2">
              <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-red-300 animate-ping" />
                {t("sos_banner_title")}
              </span>
            </span>
            <h1 className="text-white font-bold text-xl md:text-2xl drop-shadow-sm tracking-tight">
              Pune Municipal District • 24/7 Distress Center
            </h1>
            <p className="text-red-100/90 text-sm mt-1 max-w-xl leading-relaxed">
              {t("sos_banner_sub")}
            </p>
          </div>

          {/* Live Digital Clock */}
          <div className="bg-black/40 border border-white/20 text-white rounded-xl px-4 py-2 text-right shadow-inner">
            <p className="text-[10px] font-mono uppercase tracking-wider text-red-200/80 mb-0.5">
              {t("sos_live_clock")}
            </p>
            <p className="font-mono text-2xl font-bold tracking-wider">
              {timeStr || "00:00:00"}
            </p>
          </div>
        </div>
      </div>


      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Location & Quick Action Cards */}
        <div className="space-y-4 md:col-span-1">
          {/* Live GPS Card */}
          <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-wider text-slate2 font-semibold flex items-center gap-1.5">
                <MapPin size={14} className="text-signal-600" />
                {t("sos_gps_title")}
              </p>
              <button
                onClick={fetchLocation}
                disabled={location.loading}
                className="p-1 rounded-lg text-slate2 hover:text-ink-900 transition-colors cursor-pointer"
                title={t("sos_gps_retry")}
              >
                <RefreshCw size={13} className={location.loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="bg-ink-50 p-3 rounded-xl border border-ink-100 space-y-1 font-mono text-xs text-ink-900">
              <div className="flex justify-between">
                <span className="text-slate2">Latitude:</span>
                <span className="font-bold">{location.lat.toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate2">Longitude:</span>
                <span className="font-bold">{location.lng.toFixed(5)}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 text-slate2 border-t border-ink-200/50">
                <span>Accuracy:</span>
                <span>~{location.accuracy} meters</span>
              </div>
            </div>

            <p className="text-[11px] text-slate2 leading-snug">{location.address}</p>
          </div>

          {/* Safe Word Alert Card */}
          <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-marigold-100 text-marigold-800 flex items-center justify-center font-bold">
                <Lock size={15} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm text-ink-900">
                  {t("sos_safeword_title")}
                </h3>
                <p className="text-[11px] text-slate2">{t("sos_safeword_desc")}</p>
              </div>
            </div>

            <button
              onClick={() => setSafeWordActive(true)}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                safeWordActive
                  ? "bg-moss-600 text-paper"
                  : "bg-ink-900 text-paper hover:bg-ink-700"
              }`}
            >
              {safeWordActive ? "✓ Silent Distress Alert Dispatched" : t("sos_safeword_btn")}
            </button>
          </div>

          {/* Record Audio Evidence */}
          <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-signal-100 text-signal-700 flex items-center justify-center font-bold">
                <Mic size={15} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm text-ink-900">
                  {t("sos_audio_title")}
                </h3>
                <p className="text-[11px] text-slate2">{t("sos_audio_desc")}</p>
              </div>
            </div>

            <button
              onClick={handleStartRecording}
              disabled={recording}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                recording
                  ? "bg-signal-600 text-paper animate-pulse"
                  : audioSaved
                  ? "bg-moss-600 text-paper"
                  : "bg-signal-600 text-paper hover:bg-signal-700"
              }`}
            >
              {recording ? (
                <>
                  <Volume2 size={14} className="animate-spin" />
                  {t("sos_audio_recording")} ({recordSec}s)
                </>
              ) : audioSaved ? (
                "✓ Audio Clip Captured (10s)"
              ) : (
                <>
                  <Mic size={14} /> {t("sos_audio_btn")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: 11-Contact Emergency Directory */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
            <h2 className="font-display text-base font-semibold text-ink-900 mb-3 flex items-center justify-between">
              <span>National & Municipal Emergency Directory</span>
              <span className="text-xs font-mono font-normal text-slate2">
                11 Active Hotlines
              </span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {EMERGENCY_CONTACTS.map((c) => {
                const name = c.names?.[langKey] || c.names?.en;
                const category = c.categories?.[langKey] || c.categories?.en;
                return (
                  <div
                    key={c.number}
                    className="bg-paper border border-ink-100 rounded-xl p-3 flex flex-col justify-between gap-2.5 hover:border-ink-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white text-signal-700 border border-ink-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <c.icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink-900 truncate leading-tight">
                          {name}
                        </p>
                        <p className="text-[10px] text-slate2 font-mono">{category}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-ink-200/40">
                      <span className="font-mono text-sm font-bold text-ink-900">
                        {c.number}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(c.number)}
                          className="px-2 py-1 rounded-lg bg-white border border-ink-100 text-[11px] font-medium text-slate2 hover:text-ink-900 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          title={t("sos_copy")}
                        >
                          {copiedNum === c.number ? (
                            <>
                              <Check size={11} className="text-moss-600" />
                              <span className="text-moss-600 font-semibold">{t("sos_copied")}</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} /> {t("sos_copy")}
                            </>
                          )}
                        </button>

                        <a
                          href={`tel:${c.number.replace(/-/g, "")}`}
                          className="px-2.5 py-1 rounded-lg bg-signal-600 hover:bg-signal-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Phone size={11} /> {t("sos_call")}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Safety Guidelines Accordion */}
          <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="font-display text-sm font-semibold text-ink-900">
              {t("sos_guidelines_title")}
            </h3>

            {/* Protocol 1 */}
            <div className="border border-ink-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenGuideline(openGuideline === 0 ? -1 : 0)}
                className="w-full px-4 py-3 bg-paper flex items-center justify-between text-xs font-semibold text-ink-900 text-left cursor-pointer"
              >
                <span>1. Immediate Steps in Fire & Gas Leak Situations</span>
                {openGuideline === 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {openGuideline === 0 && (
                <div className="p-4 text-xs text-slate2 space-y-2 bg-white leading-relaxed">
                  <p>• Do not switch electric appliances ON or OFF if gas odor is present.</p>
                  <p>• Evacuate immediately and assemble at the designated open ground or muster point.</p>
                  <p>• Call 1906 (Gas Leak) or 101 (Fire Brigade) once you are at a safe distance.</p>
                </div>
              )}
            </div>

            {/* Protocol 2 */}
            <div className="border border-ink-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenGuideline(openGuideline === 1 ? -1 : 1)}
                className="w-full px-4 py-3 bg-paper flex items-center justify-between text-xs font-semibold text-ink-900 text-left cursor-pointer"
              >
                <span>2. Road Accident & Trauma Response Protocol</span>
                {openGuideline === 1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {openGuideline === 1 && (
                <div className="p-4 text-xs text-slate2 space-y-2 bg-white leading-relaxed">
                  <p>• Ensure vehicular safety and place warning markers 50m behind the vehicle.</p>
                  <p>• Dial 108 for EMS Ambulance and 1073 for Highway Accident rescue.</p>
                  <p>• Do not move critically injured individuals without certified first-responder support unless in immediate fire danger.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
