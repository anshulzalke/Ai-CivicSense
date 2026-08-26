import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ErrorBoundary from "./ErrorBoundary";

export default function DashboardShell({ navItems = [], children }) {
  const { logout, user, role } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  function handleLogout() {
    try {
      if (typeof logout === "function") logout();
    } catch (e) {
      console.warn("Logout warning:", e);
    }
    navigate("/");
  }

  const safeRole = role || user?.role || "citizen";
  const localizedRoleTag =
    safeRole === "citizen"
      ? t?.("citizen_tag") || "Citizen Portal"
      : safeRole === "gov" || safeRole === "official"
      ? t?.("gov_tag") || "Official Portal"
      : t?.("admin_tag") || "Admin Portal";

  const safeNavItems = Array.isArray(navItems) ? navItems : [];

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-ink-900 text-paper flex flex-col shadow-lg z-10">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-marigold-400 text-ink-900 flex items-center justify-center text-xs font-bold font-sans">
                C
              </span>
              {t?.("app_name") || "CivicSense"}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-marigold-400 mt-1 font-mono font-medium">
              {localizedRoleTag}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto thin-scroll">
          {safeNavItems.map((item) => {
            if (!item) return null;
            const Icon = item.icon || User;
            return (
              <NavLink
                key={item.to || item.label}
                to={item.to || "/"}
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

        <div className="px-3 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-100 hover:bg-white/10 hover:text-signal-400 transition-colors cursor-pointer"
          >
            <LogOut size={16} /> {t?.("sign_out") || "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Language Switcher & Profile */}
        <header className="bg-white/80 backdrop-blur-md border-b border-ink-100 sticky top-0 z-20 px-6 md:px-10 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate2 hidden sm:inline-block">
              {t?.("sub_tagline") || "Next-Gen Civic Redressal"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher Dropdown */}
            <LanguageSwitcher />

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-ink-100">
                <div className="w-8 h-8 rounded-full bg-ink-100 text-ink-800 flex items-center justify-center font-medium text-xs font-mono">
                  <User size={14} />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-ink-900 leading-none">{user?.name || "Official"}</p>
                  <p className="text-[10px] text-slate2 mt-0.5 font-mono leading-none">
                    {user?.govId || user?.email || user?.ward || localizedRoleTag}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

