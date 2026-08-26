import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { deriveEscalation } from "../../lib/logic";

import ErrorBoundary from "../../components/ErrorBoundary";

export default function GovAnalytics() {
  const { complaints = [], departments = [] } = useApp();
  const { t, getCategoryLabel, getStatusLabel } = useLanguage();

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];

  const byDept = useMemo(
    () =>
      safeDepartments.map((d) => {
        const inDept = safeComplaints.filter((c) => c && c.category === d.id);
        const closed = inDept.filter((c) => c && c.status === "closed");
        const escalated = inDept.filter((c) => c && deriveEscalation(c).effectiveLevel > 0);
        return {
          name: getCategoryLabel(d.id),
          Open: inDept.length - closed.length,
          Closed: closed.length,
          Escalated: escalated.length,
        };
      }),
    [safeComplaints, safeDepartments, getCategoryLabel]
  );

  const totalOpen = safeComplaints.filter((c) => c && c.status !== "closed").length;
  const totalEscalated = safeComplaints.filter((c) => c && deriveEscalation(c).effectiveLevel > 0 && c.status !== "closed").length;
  const totalClosed = safeComplaints.filter((c) => c && c.status === "closed").length;

  return (
    <ErrorBoundary title="Analytics Dashboard Error">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
          {t?.("gov_analytics_title") || "Ward Analytics"}
        </h1>
        <p className="text-sm text-slate2 mb-6">
          {t?.("gov_analytics_sub") || "Cross-departmental performance metrics and SLA escalations."}
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Stat label={t?.("stat_open") || "Open Tickets"} value={totalOpen} />
          <Stat label={t?.("stat_currently_escalated") || "Escalated (SLA Breached)"} value={totalEscalated} tone="signal" />
          <Stat label={t?.("stat_closed_validated") || "Validated & Closed"} value={totalClosed} tone="moss" />
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
          <p className="text-xs font-mono uppercase tracking-wide text-slate2 mb-4 font-semibold">
            {t?.("gov_chart_by_dept") || "Tickets by Department"}
          </p>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={byDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE2ED" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5B6472" }} />
                <YAxis tick={{ fontSize: 12, fill: "#5B6472" }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DCE2ED" }} />
                <Bar dataKey="Open" name={getStatusLabel("in_progress")} fill="#8C9AB8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Escalated" name={getStatusLabel("escalated")} fill="#C1443A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Closed" name={getStatusLabel("closed")} fill="#4C7A5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}


function Stat({ label, value, tone }) {
  const toneClass = tone === "signal" ? "text-signal-600" : tone === "moss" ? "text-moss-600" : "text-ink-900";
  return (
    <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs">
      <p className="text-xs text-slate2 font-medium">{label}</p>
      <p className={`font-display text-3xl font-semibold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}
