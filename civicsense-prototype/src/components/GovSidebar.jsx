import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck, ListOrdered, BarChart3, Map, User } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";

export default function GovSidebar({ navItems: propNavItems, className = "" }) {
  const authState = useApp();
  const { t, getCategoryLabel } = useLanguage();
  const navigate = useNavigate();

  // Comprehensive Defensive Null-Checking
  const user = authState?.user || {};
  const emailStr = String(user?.email || "").toLowerCase().trim();
  const rawDept = String(
    user?.department ||
    user?.dept ||
    (emailStr.includes("deshmukh") ? "garbage" : emailStr.includes("bhosale") ? "drainage" : "potholes")
  ).toLowerCase().trim();
  const userDept = rawDept;
  const userRole = user?.role || authState?.role || "L1";



  const defaultNavItems = [
    { to: "/gov", end: true, label: t?.("nav_queue") || "Priority Queue", icon: ListOrdered },
    { to: "/gov/analytics", label: t?.("nav_analytics") || "Ward Analytics", icon: BarChart3 },
  ];

  const safeNavItems = Array.isArray(propNavItems) && propNavItems.length > 0 ? propNavItems : defaultNavItems;

  const handleLogout = () => {
    try {
      if (typeof authState?.logout === "function") {
        authState.logout();
      }
    } catch (e) {
      console.warn("Logout error:", e);
    }
    navigate("/login/gov");
  };

  const localizedRoleTag =
    userRole === "admin"
      ? t?.("admin_tag") || "Admin Authority"
      : t?.("gov_tag") || "Zonal Official";

  return (
    <aside
      className={`w-64 shrink-0 bg-ink-900 text-paper flex flex-col shadow-lg z-10 select-none ${className}`}
    >
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-marigold-400 text-ink-900 flex items-center justify-center text-xs font-bold font-sans">
              C
            </span>
            {t?.("app_name") || "CivicSense"}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck size={12} className="text-marigold-400 shrink-0" />
            <p className="text-[10px] uppercase tracking-[0.14em] text-marigold-400 font-mono font-medium truncate">
              {localizedRoleTag} · {getCategoryLabel?.(userDept) || userDept.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto thin-scroll">
        {safeNavItems.map((item) => {
          if (!item) return null;
          const Icon = item.icon || ListOrdered;
          return (
            <NavLink
              key={item.to || item.label}
              to={item.to || "/gov"}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-marigold-400 text-ink-900 shadow-sm" : "text-ink-100 hover:bg-white/10"
                }`
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Official Profile & Sign Out Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-3 bg-ink-950/40">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-mono font-bold">
            <User size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {user?.name || "Municipal Official"}
            </p>
            <p className="text-[10px] text-white/60 font-mono truncate mt-0.5">
              {user?.email || `Level ${user?.level || 1} Officer`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-ink-100 hover:bg-white/10 hover:text-signal-400 transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span>{t?.("sign_out") || "Sign Out"}</span>
        </button>
      </div>
    </aside>
  );
}
