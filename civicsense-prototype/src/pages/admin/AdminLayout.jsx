import React from "react";
import { Outlet } from "react-router-dom";
import { Gauge, Users, Landmark, Settings2, ScrollText } from "lucide-react";
import DashboardShell from "../../components/DashboardShell";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminLayout() {
  const { t } = useLanguage();

  const navItems = [
    { to: "/admin", end: true, label: t("nav_overview"), icon: Gauge },
    { to: "/admin/citizens", label: t("nav_citizens"), icon: Users },
    { to: "/admin/gov", label: t("nav_gov"), icon: Landmark },
    { to: "/admin/audit", label: t("nav_audit"), icon: ScrollText },
    { to: "/admin/settings", label: t("nav_settings"), icon: Settings2 },
  ];

  return (
    <DashboardShell roleTag="Admin Dashboard" navItems={navItems}>
      <Outlet />
    </DashboardShell>
  );
}
