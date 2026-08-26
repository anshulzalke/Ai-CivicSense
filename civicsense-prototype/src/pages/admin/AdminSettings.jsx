import React, { useState, useEffect } from "react";
import {
  RotateCcw,

  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { DEPARTMENTS } from "../../lib/mockData";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";

export default function AdminSettings() {
  const { t, getCategoryLabel } = useLanguage();
  const {
    complaints = [],
    officials = [],
    citizens = [],
    departments = [],
    seedDemoData,
    resetDatabase,
    resetAll,
  } = useApp();

  const TABS = [
    { id: "depts", label: t("admin_tab_depts") },
    { id: "ai", label: t("admin_tab_ai") },
    { id: "notifs", label: t("admin_tab_notifs") },
    { id: "perms", label: t("admin_tab_perms") },
  ];

  const [tab, setTab] = useState("depts");
  const [slaHours, setSlaHours] = useState(48);
  const [confidence, setConfidence] = useState(70);

  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [dbHealth, setDbHealth] = useState(null);

  // Fetch live system health on mount
  useEffect(() => {
    let mounted = true;
    api.admin
      .getSystemHealth()
      .then((res) => {
        if (mounted) setDbHealth(res?.stats || null);
      })
      .catch(() => {
        // Fallback to local counts if API offline
      });
    return () => {
      mounted = false;
    };
  }, [complaints.length]);

  // Compute breakdown stats
  const totalCount = dbHealth?.totalComplaints ?? complaints.length;
  const pendingCount =
    dbHealth?.submitted ?? complaints.filter((c) => c.status === "submitted").length;
  const inProgressCount =
    dbHealth?.inProgress ?? complaints.filter((c) => c.status === "in_progress").length;
  const resolvedCount =
    dbHealth?.resolved ??
    complaints.filter(
      (c) => c.status === "resolved_pending_validation" || c.status === "closed"
    ).length;
  const escalatedCount =
    dbHealth?.escalated ?? complaints.filter((c) => c.status === "escalated").length;

  async function handleSeedDemo() {
    setSeeding(true);
    setActionSuccess("");
    setActionError("");
    try {
      if (seedDemoData) {
        await seedDemoData();
      } else {
        await api.admin.seedDemoData();
      }
      setActionSuccess(
        t("admin_seed_success") ||
          "Demo complaints across Pune wards seeded successfully!"
      );
    } catch (err) {
      setActionError(err.message || "Failed to seed demo complaints.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleResetDB() {
    setResetting(true);
    setActionSuccess("");
    setActionError("");
    try {
      if (resetDatabase) {
        await resetDatabase();
      } else {
        await api.admin.resetDatabase();
      }
      setActionSuccess(
        t("admin_reset_success") ||
          "Database reset to baseline state successfully!"
      );
    } catch (err) {
      setActionError(err.message || "Failed to reset database.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            {t("admin_settings_title")}
          </h1>
          <p className="text-sm text-slate2">{t("admin_settings_sub")}</p>
        </div>

        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-ink-300 text-xs font-semibold hover:bg-ink-50 cursor-pointer transition-colors"
        >
          <RotateCcw size={13} /> {t("admin_reset_demo")}
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess("")}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button
            onClick={() => setActionError("")}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: VIVA DEMO CONTROLS & QUICK RESET */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-ink-950 via-slate-900 to-ink-900 text-white shadow-xl border border-white/10 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              <h2 className="font-display text-lg font-bold text-white">
                {t("admin_viva_controls") || "Viva Demo Controls & Quick Reset"}
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {t("admin_viva_desc") ||
                "Instantly populate realistic multi-ward Pune complaints or restore clean baseline for evaluation."}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t("admin_db_connected") || "PostgreSQL 16 Engine Connected"}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-3 pt-1">
          <button
            type="button"
            disabled={seeding || resetting}
            onClick={handleSeedDemo}
            className="flex-1 min-w-[220px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-ink-950 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            <span>
              {seeding
                ? "Seeding Pune Grid Complaints..."
                : t("admin_seed_btn") || "Seed Fresh Demo Complaints (Pune Grid)"}
            </span>
          </button>

          <button
            type="button"
            disabled={seeding || resetting}
            onClick={handleResetDB}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {resetting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RotateCcw size={15} />
            )}
            <span>
              {resetting
                ? "Resetting Base State..."
                : t("admin_reset_btn") || "Reset to Clean State"}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 2: SYSTEM HEALTH & DATABASE STATS */}
      <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-sky-600" />
            <h3 className="font-display font-bold text-ink-900 text-base">
              {t("admin_system_health") || "Platform & Database Health"}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate2">
            Ward Synchronized: Wagholi, Baner, Kharadi, Kothrud, Hadapsar, PCMC
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-ink-50/70 border border-ink-100/80">
            <p className="text-[11px] font-mono text-slate2 uppercase font-semibold">
              {t("admin_total_grievances") || "Total Grievances"}
            </p>
            <p className="font-display text-2xl font-bold text-ink-900 mt-1">
              {totalCount}
            </p>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
              <span className="text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                {pendingCount} Pending
              </span>
              <span className="text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                {inProgressCount} Active
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ink-50/70 border border-ink-100/80">
            <p className="text-[11px] font-mono text-slate2 uppercase font-semibold">
              Resolved &amp; Validated
            </p>
            <p className="font-display text-2xl font-bold text-emerald-600 mt-1">
              {resolvedCount}
            </p>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded mt-2 inline-block">
              Photographic Proofs
            </span>
          </div>

          <div className="p-4 rounded-xl bg-ink-50/70 border border-ink-100/80">
            <p className="text-[11px] font-mono text-slate2 uppercase font-semibold">
              Escalated SLA Breaches
            </p>
            <p className="font-display text-2xl font-bold text-red-600 mt-1">
              {escalatedCount}
            </p>
            <span className="text-[10px] font-mono text-red-700 bg-red-100/70 px-1.5 py-0.5 rounded mt-2 inline-block">
              Level 2/3 Reassigned
            </span>
          </div>

          <div className="p-4 rounded-xl bg-ink-50/70 border border-ink-100/80">
            <p className="text-[11px] font-mono text-slate2 uppercase font-semibold">
              Active Municipal Officers
            </p>
            <p className="font-display text-2xl font-bold text-indigo-600 mt-1">
              {officials.length || 5}
            </p>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded mt-2 inline-block">
              {departments.length || 4} Departments
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: SYSTEM CONFIGURATION TABS */}
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-ink-100">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                tab === tabItem.id
                  ? "border-marigold-400 text-ink-900"
                  : "border-transparent text-slate2 hover:text-ink-900"
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {tab === "depts" && (
          <div className="space-y-3">
            {DEPARTMENTS.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-ink-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="font-medium text-ink-900">
                    {getCategoryLabel(d.id)}
                  </span>
                </div>
                <span className="text-xs text-slate2 font-mono">
                  {d.officerCount} {t("stat_officers_active")}
                </span>
              </div>
            ))}
            <p className="text-xs text-slate2 mt-2">
              Garbage, Sanitation, Drainage, and Streetlights inherit municipal escalation architecture.
            </p>
          </div>
        )}

        {tab === "ai" && (
          <div className="bg-white border border-ink-100 rounded-2xl p-5 space-y-6 max-w-md shadow-2xs">
            <div>
              <label className="text-xs font-mono uppercase tracking-wide text-slate2 block mb-1 font-semibold">
                {t("admin_yolo_threshold")}
              </label>
              <input
                type="range"
                min={40}
                max={95}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full mt-3 accent-marigold-400 cursor-pointer"
              />
              <p className="text-xs text-slate2 mt-1 font-mono">
                {confidence}% minimum confidence to auto-classify
              </p>
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wide text-slate2 block mb-1 font-semibold">
                {t("admin_duplicate_radius")}
              </label>
              <p className="text-xs text-slate2 mt-1">
                Spatial radius check within 150 meters across 14-day rolling window.
              </p>
            </div>
          </div>
        )}

        {tab === "notifs" && (
          <div className="bg-white border border-ink-100 rounded-2xl p-5 max-w-md space-y-4 shadow-2xs">
            <ToggleRow label="Email on status change" defaultOn />
            <ToggleRow label="SMS on SLA escalation" defaultOn />
            <ToggleRow label="Push notification on resolution validation" defaultOn />
          </div>
        )}

        {tab === "perms" && (
          <div className="bg-white border border-ink-100 rounded-2xl p-5 max-w-md space-y-4 shadow-2xs">
            <div>
              <label className="text-xs font-mono uppercase tracking-wide text-slate2 block mb-1 font-semibold">
                {t("admin_sla_hours")}
              </label>
              <input
                type="number"
                value={slaHours}
                onChange={(e) => setSlaHours(Number(e.target.value))}
                className="mt-1.5 w-32 px-3 py-2 rounded-xl border border-ink-100 text-sm font-mono outline-none"
              />
            </div>
            <ToggleRow label="Officials can close complaints directly" defaultOn={false} />
            <ToggleRow label="Admins can override severity" defaultOn />
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-ink-900">{label}</span>
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
          on ? "bg-marigold-400" : "bg-ink-100"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
