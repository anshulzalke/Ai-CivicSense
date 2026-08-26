import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldOff, ShieldAlert, CheckCircle2, User, Coins } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminCitizens() {
  const { citizens, fetchCitizens, flagCitizen, citizen } = useApp();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeModalId, setActiveModalId] = useState(null);
  const [reasonText, setReasonText] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchCitizens().finally(() => setLoading(false));
  }, [fetchCitizens]);

  async function handleToggleFlag(cit) {
    if (cit.flagged) {
      try {
        await flagCitizen(cit.id, false, null);
        setActionSuccess(`Flag cleared for ${cit.name || cit.id}`);
      } catch (err) {
        alert(err.message || "Failed to clear flag.");
      }
    } else {
      setActiveModalId(cit.id);
      setReasonText("Repeated invalid / duplicate complaints filed");
    }
  }

  async function handleConfirmFlag(citId) {
    try {
      await flagCitizen(citId, true, reasonText);
      setActiveModalId(null);
      setReasonText("");
      setActionSuccess("Citizen account flagged successfully.");
    } catch (err) {
      alert(err.message || "Failed to flag account.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-semibold text-ink-900">{t("admin_citizens_title")}</h1>
        <button
          onClick={() => {
            setLoading(true);
            fetchCitizens().finally(() => setLoading(false));
          }}
          className="text-xs px-3 py-1.5 rounded-xl border border-ink-200 hover:bg-ink-50 font-medium cursor-pointer transition-colors"
        >
          {loading ? t("admin_syncing") : t("btn_refresh_list")}
        </button>
      </div>
      <p className="text-sm text-slate2 mb-8">{t("admin_citizens_sub")}</p>

      {actionSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-moss-600/10 border border-moss-600/30 flex items-center gap-2 text-xs font-medium text-moss-700">
          <CheckCircle2 size={15} className="text-moss-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="space-y-3">
        {citizens.length === 0 && !loading && (
          <div className="p-8 bg-white border border-ink-100 rounded-2xl text-center shadow-2xs">
            <p className="text-sm text-slate2">{t("admin_no_records")}</p>
          </div>
        )}
        {citizens.map((c) => {
          const isCurrentSession = c.id === citizen?.id;
          return (
            <div key={c.id} className="bg-white border border-ink-100 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
              <div>
                <p className="font-medium text-ink-900 flex items-center gap-2">
                  <User size={15} className="text-slate2" />
                  {c.name || t("citizen_role")}
                  {isCurrentSession && (
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-marigold-100 text-marigold-800 px-1.5 py-0.5 rounded font-semibold">
                      {t("you")}
                    </span>
                  )}
                  {c.flagged && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-signal-600 bg-signal-400/10 px-2 py-0.5 rounded-full font-medium">
                      <AlertTriangle size={11} /> {t("admin_flagged")}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate2 mt-1">
                  <span>{c.ward || "No ward specified"}</span>
                  {c.govId && <span className="font-mono text-[11px]">{c.govId}</span>}
                  <span>{c.complaint_count ?? c.complaintCount ?? 0} {t("stat_total_complaints")}</span>
                  <span className="flex items-center gap-1 text-marigold-700 font-medium">
                    <Coins size={12} /> {c.coins || 0} {t("coins")}
                  </span>
                </div>
                {c.flagged && (c.flagReason || c.flag_reason) && (
                  <p className="text-xs text-signal-600 mt-1.5 flex items-center gap-1">
                    <ShieldAlert size={12} /> {t("admin_reason")}: {c.flagReason || c.flag_reason}
                  </p>
                )}
              </div>

              <div>
                <button
                  onClick={() => handleToggleFlag(c)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    c.flagged
                      ? "border-signal-300 bg-signal-50 text-signal-700 hover:bg-signal-100"
                      : "border-ink-300 text-ink-800 hover:bg-ink-50"
                  }`}
                >
                  <ShieldOff size={12} /> {c.flagged ? t("admin_clear_flag") : t("admin_flag_account")}
                </button>
              </div>

              {activeModalId === c.id && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-ink-100 shadow-xl">
                    <h3 className="font-display font-semibold text-lg text-ink-900">{t("admin_flag_modal_title")}</h3>
                    <p className="text-xs text-slate2 mt-1">{t("admin_flag_modal_sub")} {c.name || c.id}:</p>
                    <textarea
                      rows={3}
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      className="w-full mt-3 p-2.5 text-xs rounded-xl border border-ink-200 outline-none focus:border-signal-500"
                      placeholder={t("admin_flag_placeholder")}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => setActiveModalId(null)}
                        className="px-3 py-1.5 rounded-xl border border-ink-200 text-xs font-medium cursor-pointer"
                      >
                        {t("btn_cancel")}
                      </button>
                      <button
                        onClick={() => handleConfirmFlag(c.id)}
                        className="px-3 py-1.5 rounded-xl bg-signal-600 text-paper text-xs font-semibold hover:bg-signal-700 cursor-pointer shadow-xs"
                      >
                        {t("admin_confirm_flag")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
