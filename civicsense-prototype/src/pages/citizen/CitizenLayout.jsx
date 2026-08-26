import React from "react";
import { Outlet } from "react-router-dom";
import { LayoutGrid, FilePlus2, Search, Map, Vote, Gift, Siren } from "lucide-react";
import DashboardShell from "../../components/DashboardShell";
import { useLanguage } from "../../context/LanguageContext";

export default function CitizenLayout() {
  const { t } = useLanguage();

  const navItems = [
    { to: "/citizen", end: true, label: t("nav_overview"), icon: LayoutGrid },
    { to: "/citizen/file", label: t("nav_file_complaint"), icon: FilePlus2 },
    { to: "/citizen/track", label: t("nav_track_complaint"), icon: Search },
    { to: "/citizen/map", label: t("nav_live_map"), icon: Map },
    { to: "/citizen/voting", label: t("nav_voting"), icon: Vote },
    { to: "/citizen/rewards", label: t("nav_rewards"), icon: Gift },
    { to: "/citizen/sos", label: t("nav_sos"), icon: Siren },
  ];

  return (
    <DashboardShell roleTag="Citizen Dashboard" navItems={navItems}>
      <Outlet />
    </DashboardShell>
  );
}
