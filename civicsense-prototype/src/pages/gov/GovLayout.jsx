import React from "react";
import { Outlet } from "react-router-dom";
import { ListOrdered, BarChart3 } from "lucide-react";
import DashboardShell from "../../components/DashboardShell";
import { useLanguage } from "../../context/LanguageContext";

export default function GovLayout() {
  const { t } = useLanguage();

  const navItems = [
    { to: "/gov", end: true, label: t("nav_queue"), icon: ListOrdered },
    { to: "/gov/analytics", label: t("nav_analytics"), icon: BarChart3 },
  ];

  return (
    <DashboardShell roleTag="Official Dashboard" navItems={navItems}>
      <Outlet />
    </DashboardShell>
  );
}
