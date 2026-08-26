import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, IdCard, ShieldCheck, Landmark, AlertCircle, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";

const SEEDED_OFFICIALS = [
  { name: "R. Kulkarni (Potholes L1)", email: "r.kulkarni@civicsense.gov.in" },
  { name: "S. Deshmukh (Garbage L1)", email: "s.deshmukh@civicsense.gov.in" },
  { name: "A. Bhosale (Drainage L1)", email: "a.bhosale@civicsense.gov.in" },
  { name: "Zonal Officer (Potholes L2)", email: "zonal.east@civicsense.gov.in" },
  { name: "Commissioner (Potholes L3)", email: "commissioner@civicsense.gov.in" },
];

export default function Login() {
  const { role: roleParam } = useParams();
  const { t } = useLanguage();
  const currentRole = roleParam === "gov" || roleParam === "official" ? "gov" : roleParam === "admin" ? "admin" : "citizen";

  const copy = {
    citizen: {
      icon: IdCard,
      title: t("login_citizen_title"),
      sub: t("login_citizen_sub"),
      home: "/citizen",
    },
    gov: {
      icon: Landmark,
      title: t("login_gov_title"),
      sub: t("login_gov_sub"),
      home: "/gov",
    },
    admin: {
      icon: ShieldCheck,
      title: t("login_admin_title"),
      sub: t("login_admin_sub"),
      home: "/admin",
    },
  }[currentRole];

  const navigate = useNavigate();
  const { loginCitizen, loginStaff } = useApp();

  // Form states
  const [govId, setGovId] = useState("GOV-XXXX-1187");
  const [citizenName, setCitizenName] = useState("Anshul Zalke");
  const [ward, setWard] = useState("Wagholi, Pune");

  const [email, setEmail] = useState(
    currentRole === "admin" ? "admin@civicsense.gov.in" : "r.kulkarni@civicsense.gov.in"
  );
  const [password, setPassword] = useState("civicsense123");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (currentRole === "citizen") {
        if (!govId.trim()) throw new Error("Please enter a Government ID");
        await loginCitizen({ govId: govId.trim(), name: citizenName.trim(), ward: ward.trim() });
      } else {
        if (!email.trim() || !password) throw new Error("Email and password are required");
        await loginStaff({ email: email.trim(), password });
      }
      navigate(copy.home);
    } catch (err) {
      setErrorMessage(err.message || "Failed to sign in. Please verify your details.");
    } finally {
      setLoading(false);
    }
  }

  const Icon = copy.icon;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate2 hover:text-ink-900 mb-6 transition-colors">
          <ArrowLeft size={14} /> {t("back_to_home")}
        </Link>

        <div className="bg-white border border-ink-100 rounded-2xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-ink-900 flex items-center justify-center text-marigold-400 mb-5 shadow-xs">
            <Icon size={22} />
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink-900">{copy.title}</h1>
          <p className="text-sm text-slate2 mt-1.5">{copy.sub}</p>

          {errorMessage && (
            <div className="mt-5 p-3.5 rounded-xl bg-signal-400/10 border border-signal-400/30 flex items-start gap-2.5 text-sm text-signal-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Authentication Failed</p>
                <p className="text-xs mt-0.5 text-signal-700">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {currentRole === "citizen" ? (
              <>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold block mb-1">
                    {t("login_govid_label")}
                  </label>
                  <input
                    required
                    value={govId}
                    onChange={(e) => setGovId(e.target.value)}
                    placeholder="GOV-XXXX-1187"
                    className="w-full px-4 py-2.5 rounded-xl border border-ink-100 bg-white focus:border-marigold-400 outline-none font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold block mb-1">
                      {t("login_name_label")}
                    </label>
                    <input
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-ink-100 bg-white text-sm outline-none focus:border-marigold-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold block mb-1">
                      {t("login_ward_label")}
                    </label>
                    <input
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder="e.g. Wagholi, Pune"
                      className="w-full px-4 py-2.5 rounded-xl border border-ink-100 bg-white text-sm outline-none focus:border-marigold-400"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setGovId("GOV-XXXX-1187");
                      setCitizenName("Anshul Zalke");
                      setWard("Wagholi, Pune");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-marigold-600 hover:text-marigold-700 font-semibold cursor-pointer"
                  >
                    <Sparkles size={12} /> {t("login_seed_citizen_btn")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold block mb-1">
                    {currentRole === "admin" ? t("login_admin_email_label") : t("login_email_label")}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@civicsense.gov.in"
                    className="w-full px-4 py-2.5 rounded-xl border border-ink-100 bg-white focus:border-marigold-400 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wide text-slate2 font-semibold block mb-1">
                    {t("login_password_label")}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-ink-100 bg-white focus:border-marigold-400 outline-none text-sm"
                  />
                </div>

                {currentRole === "gov" && (
                  <div className="pt-2">
                    <p className="text-xs text-slate2 mb-2 font-medium">
                      {t("login_quick_demo")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SEEDED_OFFICIALS.map((o) => (
                        <button
                          key={o.email}
                          type="button"
                          onClick={() => {
                            setEmail(o.email);
                            setPassword("civicsense123");
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            email === o.email
                              ? "bg-marigold-50 border-marigold-300 text-marigold-800 font-semibold"
                              : "border-ink-100 hover:bg-ink-50 text-slate2"
                          }`}
                        >
                          {o.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentRole === "admin" && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("admin@civicsense.gov.in");
                        setPassword("civicsense123");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-marigold-600 hover:text-marigold-700 font-semibold cursor-pointer"
                    >
                      <Sparkles size={12} /> {t("login_seed_admin_btn")}
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-ink-900 text-paper font-semibold hover:bg-ink-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {loading ? t("login_submitting_btn") : t("login_submit_btn")}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-ink-100 text-center">
            <p className="text-[11px] text-slate2 font-mono">
              Connected to backend REST API with Bearer JWT Token authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
