import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Coins,
  Gift,
  Trophy,
  Medal,
  Star,
  Bus,
  Building2,
  Car,
  Train,
  TreePine,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Crown,
  X,
  Ticket,
  Vote,
  Compass,
  ScrollText,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Filter,
  ExternalLink,
  Receipt,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotification } from "../../context/NotificationContext";

export default function Rewards() {
  const {
    user,
    complaints = [],
    coinTransactions = [],
    redeemedVouchers = [],
    redeemPerk,
  } = useApp();
  const { t } = useLanguage();
  const { dispatchNotification } = useNotification();

  const [activeTab, setActiveTab] = useState("leaderboard"); // 'leaderboard' | 'badges' | 'redeem' | 'ledger'
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [txnFilter, setTxnFilter] = useState("all"); // 'all' | 'credit' | 'debit'
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const userCoins = user?.coins ?? 240;

  // Calculate dynamic user metrics
  const myClosedComplaints = (complaints || []).filter(
    (c) =>
      (!user?.id || c.citizenId === user.id || c.citizen_id === user.id) &&
      c.status === "closed"
  );
  const myPotholesCount = (complaints || []).filter(
    (c) => c.category === "potholes"
  ).length;
  const myGreenCount = (complaints || []).filter(
    (c) => c.category === "garbage" || c.category === "drainage"
  ).length;

  // Badges Definitions with Dynamic Progress
  const badgesList = [
    {
      id: "pothole_hunter",
      title: "Pothole Hunter",
      icon: "🕳️",
      lucideIcon: Compass,
      desc: "Report 3 or more road potholes to improve transit safety.",
      current: Math.min(myPotholesCount + 2, 3),
      target: 3,
      unlocked: myPotholesCount + 2 >= 3,
      rarity: "Silver Tier",
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "rapid_reporter",
      title: "Rapid Reporter",
      icon: "⚡",
      lucideIcon: Zap,
      desc: "File a geo-tagged issue on the spot within 5 minutes.",
      current: 1,
      target: 1,
      unlocked: true,
      rarity: "Gold Tier",
      color: "from-yellow-400 to-amber-500",
    },
    {
      id: "green_champion",
      title: "Green Champion",
      icon: "🌱",
      lucideIcon: TreePine,
      desc: "Report 2 waste dumping or drainage pollution grievances.",
      current: Math.min(myGreenCount + 1, 2),
      target: 2,
      unlocked: myGreenCount + 1 >= 2,
      rarity: "Emerald Tier",
      color: "from-emerald-400 to-teal-600",
    },
    {
      id: "ward_hero",
      title: "Ward Hero",
      icon: "🏙️",
      lucideIcon: Building2,
      desc: "Validate 5 resolved grievances in your home ward.",
      current: Math.min(myClosedComplaints.length + 3, 5),
      target: 5,
      unlocked: myClosedComplaints.length + 3 >= 5,
      rarity: "Diamond Tier",
      color: "from-sky-400 to-blue-600",
    },
    {
      id: "community_voter",
      title: "Community Voter",
      icon: "🗳️",
      lucideIcon: Vote,
      desc: "Participate in 3 municipal project priority ballots.",
      current: 3,
      target: 3,
      unlocked: true,
      rarity: "Gold Tier",
      color: "from-indigo-400 to-purple-600",
    },
    {
      id: "super_validator",
      title: "Super Validator",
      icon: "⭐",
      lucideIcon: Star,
      desc: "Provide 5-star photographic reviews on resolved repairs.",
      current: 2,
      target: 3,
      unlocked: false,
      rarity: "Platinum Tier",
      color: "from-rose-400 to-pink-600",
    },
    {
      id: "diamond_guardian",
      title: "Diamond Guardian",
      icon: "💎",
      lucideIcon: Crown,
      desc: "Accumulate 300+ Civic Coins through verified civic actions.",
      current: Math.min(userCoins, 300),
      target: 300,
      unlocked: userCoins >= 300,
      rarity: "Legendary Tier",
      color: "from-cyan-400 to-blue-600",
    },
    {
      id: "sos_guardian",
      title: "SOS Sentinel",
      icon: "🚨",
      lucideIcon: ShieldCheck,
      desc: "Complete your 24/7 Pune Distress & SOS emergency profile.",
      current: 1,
      target: 1,
      unlocked: true,
      rarity: "Safety Tier",
      color: "from-red-500 to-rose-600",
    },
  ];

  // Leaderboard Top 10 Pune Citizens
  const leaderboardData = [
    {
      rank: 1,
      name: "Ananya Deshmukh",
      ward: "Ward 14 (Wagholi)",
      fixes: 34,
      coins: 850,
      tier: "Diamond Guardian 💎",
      isUser: false,
    },
    {
      rank: 2,
      name: "Rajesh Shinde",
      ward: "Ward 8 (Kothrud)",
      fixes: 29,
      coins: 725,
      tier: "Diamond Guardian 💎",
      isUser: false,
    },
    {
      rank: 3,
      name: "Pooja Kadam",
      ward: "Ward 21 (Baner)",
      fixes: 24,
      coins: 600,
      tier: "Platinum Pioneer 🛡️",
      isUser: false,
    },
    {
      rank: 4,
      name: user?.name ? `${user.name} (You)` : "Anshul Zalke (You)",
      ward: `Ward ${user?.ward || "14 (Wagholi)"}`,
      fixes: Math.max(myClosedComplaints.length + 7, 18),
      coins: userCoins,
      tier: userCoins >= 300 ? "Diamond Guardian 💎" : "Platinum Pioneer 🛡️",
      isUser: true,
    },
    {
      rank: 5,
      name: "Sanjay Patil",
      ward: "Ward 12 (Hadapsar)",
      fixes: 19,
      coins: 475,
      tier: "Platinum Pioneer 🛡️",
      isUser: false,
    },
    {
      rank: 6,
      name: "Neha Joshi",
      ward: "Ward 4 (Shivaji Nagar)",
      fixes: 16,
      coins: 400,
      tier: "Gold Sentinel 🌟",
      isUser: false,
    },
    {
      rank: 7,
      name: "Amitabh Gokhale",
      ward: "Ward 17 (PCMC)",
      fixes: 14,
      coins: 350,
      tier: "Gold Sentinel 🌟",
      isUser: false,
    },
    {
      rank: 8,
      name: "Sunita More",
      ward: "Ward 9 (Viman Nagar)",
      fixes: 11,
      coins: 275,
      tier: "Silver Scout 🥈",
      isUser: false,
    },
    {
      rank: 9,
      name: "Vikram Chavan",
      ward: "Ward 3 (Swargate)",
      fixes: 9,
      coins: 225,
      tier: "Silver Scout 🥈",
      isUser: false,
    },
    {
      rank: 10,
      name: "Meera Ranade",
      ward: "Ward 6 (Aundh)",
      fixes: 7,
      coins: 175,
      tier: "Bronze Citizen 🥉",
      isUser: false,
    },
  ];

  // Redeemable Municipal Perks Catalog
  const perksCatalog = [
    {
      id: "pmpml_pass",
      title: t("rewards_pmpml_title"),
      desc: t("rewards_pmpml_desc"),
      cost: 150,
      category: "Transit",
      icon: Bus,
      badge: "PMPML Transport",
      accent: "from-blue-600 to-indigo-700",
    },
    {
      id: "tax_rebate",
      title: t("rewards_tax_title"),
      desc: t("rewards_tax_desc"),
      cost: 300,
      category: "Municipal",
      icon: Building2,
      badge: "PMC Revenue Dept",
      accent: "from-amber-600 to-marigold-600",
    },
    {
      id: "smart_parking",
      title: t("rewards_parking_title"),
      desc: t("rewards_parking_desc"),
      cost: 75,
      category: "Urban Mobility",
      icon: Car,
      badge: "Pune Smart City",
      accent: "from-emerald-600 to-teal-700",
    },
    {
      id: "metro_pass",
      title: t("rewards_metro_title"),
      desc: t("rewards_metro_desc"),
      cost: 100,
      category: "Transit",
      icon: Train,
      badge: "MahaMetro",
      accent: "from-purple-600 to-pink-700",
    },
    {
      id: "tree_certificate",
      title: t("rewards_tree_title"),
      desc: t("rewards_tree_desc"),
      cost: 120,
      category: "Environment",
      icon: TreePine,
      badge: "Social Forestry",
      accent: "from-moss-600 to-green-700",
    },
    {
      id: "msedcl_discount",
      title: t("rewards_msedcl_title"),
      desc: t("rewards_msedcl_desc"),
      cost: 200,
      category: "Utilities",
      icon: Zap,
      badge: "MSEDCL Power",
      accent: "from-orange-600 to-red-600",
    },
  ];

  async function handleRedeemConfirm(perk) {
    if (userCoins < perk.cost) return;

    try {
      if (redeemPerk) {
        const { voucher, newBalance } = await redeemPerk(perk);
        setSelectedVoucher(voucher);
        setConfirmModal(null);

        // Dispatch SMS Notification
        dispatchNotification?.({
          type: "sms",
          title: "PMC Rewards: Voucher Unlocked",
          sender: "PMC-REWARDS",
          body: `Congratulations! Voucher ${voucher.code} for "${perk.title}" redeemed successfully with ${perk.cost} Coins. Remaining balance: ${newBalance} Coins.`,
          phone: "+91 83196 09151",
        });
      }
    } catch (err) {
      console.error("Redemption failed:", err);
    }
  }

  // Helper function to format timestamp nicely with relative tag
  function formatTxnDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let relative = "";
    if (diffMins < 60) {
      relative = `${Math.max(1, diffMins)}m ago`;
    } else if (diffHours < 24 && date.getDate() === now.getDate()) {
      relative = `Today, ${date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (
      diffDays <= 1 ||
      (diffHours < 48 && date.getDate() === now.getDate() - 1)
    ) {
      relative = `Yesterday, ${date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      relative = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    const fullDate = date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return { relative, fullDate };
  }

  // Category visual badge configuration
  const categoryConfig = {
    validation: {
      labelKey: "rewards_cat_validation",
      defaultLabel: "Validation Reward",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
    },
    bonus: {
      labelKey: "rewards_cat_bonus",
      defaultLabel: "First Reporter Bonus",
      color: "bg-sky-50 text-sky-800 border-sky-200",
      icon: Zap,
      iconColor: "text-sky-600",
    },
    community: {
      labelKey: "rewards_cat_community",
      defaultLabel: "Community Activity",
      color: "bg-purple-50 text-purple-800 border-purple-200",
      icon: Vote,
      iconColor: "text-purple-600",
    },
    redemption: {
      labelKey: "rewards_cat_redemption",
      defaultLabel: "Voucher Redemption",
      color: "bg-rose-50 text-rose-800 border-rose-200",
      icon: Gift,
      iconColor: "text-rose-600",
    },
    onboarding: {
      labelKey: "rewards_cat_onboarding",
      defaultLabel: "Civic Onboarding",
      color: "bg-amber-50 text-amber-800 border-amber-200",
      icon: ShieldCheck,
      iconColor: "text-amber-600",
    },
  };

  // KPI Calculations
  const lifetimeEarned = coinTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRedeemed = Math.abs(
    coinTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  // Filtered transactions list
  const filteredTransactions = coinTransactions.filter((t) => {
    if (txnFilter === "credit" && t.amount < 0) return false;
    if (txnFilter === "debit" && t.amount >= 0) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = t.title?.toLowerCase().includes(q);
      const matchesRef = t.refToken?.toLowerCase().includes(q);
      const matchesId = t.id?.toLowerCase().includes(q);
      const matchesCategory = t.category?.toLowerCase().includes(q);
      return matchesTitle || matchesRef || matchesId || matchesCategory;
    }
    return true;
  });

  // CSV Export Statement function
  function handleExportCSV() {
    const headers = [
      "Transaction ID",
      "Date & Time",
      "Description",
      "Reference Token",
      "Category",
      "Amount (Coins)",
      "Running Balance",
      "Status",
    ];
    const rows = filteredTransactions.map((t) => [
      t.id,
      new Date(t.timestamp).toLocaleString("en-IN"),
      `"${(t.title || "").replace(/"/g, '""')}"`,
      t.refToken || "-",
      t.category,
      t.amount > 0 ? `+${t.amount}` : `${t.amount}`,
      t.runningBalance ?? "-",
      t.status || "SETTLED",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `CivicSense_Coin_Ledger_${user?.govId || "Citizen"}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header & Balance Hero Card */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            {t("rewards_title")}
          </h1>
          <p className="text-sm text-slate2">{t("rewards_sub")}</p>
        </div>

        {/* Live Coin Balance Pill with Quick Ledger Trigger */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-ink-950 via-slate-900 to-ink-900 text-white rounded-2xl px-5 py-3 flex items-center gap-3.5 shadow-lg border border-white/10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-ink-950 flex items-center justify-center shadow-md shrink-0">
              <Coins size={24} className="fill-ink-950 stroke-ink-950" />
            </div>
            <div>
              <p className="text-[10px] text-amber-300 uppercase tracking-widest font-mono font-bold">
                {t("stat_coin_balance")}
              </p>
              <p className="font-display text-2xl font-bold text-white tracking-tight">
                {userCoins}{" "}
                <span className="text-xs font-mono font-normal text-amber-300">
                  Coins
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className="px-3.5 py-3 rounded-2xl bg-white border border-ink-200 hover:border-ink-300 text-ink-900 hover:bg-ink-50 transition-all font-bold text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Open Coin Audit Ledger"
          >
            <ScrollText size={15} className="text-blue-600" />
            <span className="hidden sm:inline">
              {t("rewards_view_ledger_btn")}
            </span>
          </button>
        </div>
      </div>

      {/* 4 Interactive Tab Switches */}
      <div className="flex items-center gap-1.5 p-1.5 bg-ink-100/70 rounded-2xl border border-ink-200/80 max-w-2xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "leaderboard"
              ? "bg-white text-ink-950 shadow-sm"
              : "text-slate2 hover:text-ink-900"
          }`}
        >
          <Trophy size={15} className="text-amber-500 shrink-0" />
          <span>{t("tab_leaderboard")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("badges")}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "badges"
              ? "bg-white text-ink-950 shadow-sm"
              : "text-slate2 hover:text-ink-900"
          }`}
        >
          <Medal size={15} className="text-purple-500 shrink-0" />
          <span>{t("tab_badges")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("redeem")}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "redeem"
              ? "bg-white text-ink-950 shadow-sm"
              : "text-slate2 hover:text-ink-900"
          }`}
        >
          <Gift size={15} className="text-moss-600 shrink-0" />
          <span>{t("tab_redeem")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ledger")}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ledger"
              ? "bg-white text-ink-950 shadow-sm"
              : "text-slate2 hover:text-ink-900"
          }`}
        >
          <ScrollText size={15} className="text-blue-600 shrink-0" />
          <span>{t("tab_ledger")}</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === "ledger"
                ? "bg-blue-100 text-blue-800"
                : "bg-ink-200 text-slate2"
            }`}
          >
            {coinTransactions.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CIVIC LEADERBOARD */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* User Rank Highlight Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-marigold-50/50 to-white border border-amber-200 flex items-center justify-between flex-wrap gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-display font-extrabold text-xl shadow-md">
                #4
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                  {t("rewards_my_rank_card")}
                </span>
                <p className="font-bold text-ink-900 text-base mt-0.5">
                  {user?.name || "Anshul Zalke"} · Ward{" "}
                  {user?.ward || "14 (Wagholi)"}
                </p>
                <p className="text-xs text-slate2">
                  Top 5% of active Pune citizens • Next tier unlock at 300 Coins!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right font-mono">
              <div>
                <p className="text-xs text-slate2">Resolved Fixes</p>
                <p className="font-bold text-ink-900 text-lg">18 Fixes</p>
              </div>
              <div className="h-8 w-px bg-amber-200" />
              <div>
                <p className="text-xs text-slate2">
                  {t("rewards_total_coins")}
                </p>
                <p className="font-bold text-amber-700 text-lg">
                  {userCoins} ⭐
                </p>
              </div>
            </div>
          </div>

          {/* Top 10 Leaderboard Table */}
          <div className="bg-white border border-ink-100 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-ink-900 text-base">
                  Pune District Civic Redressal Top Ranks
                </h3>
                <p className="text-xs text-slate2 font-mono">
                  Live ranking based on verified resolved grievances and civic
                  contributions
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live District Sync
              </span>
            </div>

            <div className="divide-y divide-ink-100 text-xs">
              {leaderboardData.map((citizen) => (
                <div
                  key={citizen.rank}
                  className={`flex items-center justify-between px-6 py-3.5 transition-colors ${
                    citizen.isUser
                      ? "bg-amber-50/80 font-semibold text-ink-950 border-l-4 border-amber-500"
                      : "hover:bg-ink-50/50"
                  }`}
                >
                  {/* Rank & Citizen Info */}
                  <div className="flex items-center gap-4 min-w-[240px]">
                    <div className="w-8 flex items-center justify-center font-display font-bold text-sm">
                      {citizen.rank === 1 ? (
                        <span className="text-xl">🥇</span>
                      ) : citizen.rank === 2 ? (
                        <span className="text-xl">🥈</span>
                      ) : citizen.rank === 3 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-slate2 font-mono">
                          #{citizen.rank}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-ink-900 text-sm flex items-center gap-1.5">
                        {citizen.name}
                        {citizen.isUser && (
                          <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate2 font-mono">
                        {citizen.ward}
                      </p>
                    </div>
                  </div>

                  {/* Tier Badge */}
                  <div className="hidden sm:block">
                    <span className="text-[11px] font-mono bg-ink-50 text-slate2 px-2 py-1 rounded-lg border border-ink-100">
                      {citizen.tier}
                    </span>
                  </div>

                  {/* Fixes Count */}
                  <div className="hidden md:block text-right">
                    <p className="font-bold text-ink-900">
                      {citizen.fixes} Fixes
                    </p>
                    <p className="text-[10px] text-slate2 font-mono">
                      Validated
                    </p>
                  </div>

                  {/* Total Coins */}
                  <div className="text-right">
                    <p className="font-bold font-mono text-sm text-amber-600">
                      {citizen.coins} {t("coins")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY BADGES & ACHIEVEMENTS */}
      {activeTab === "badges" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-ink-900 text-base">
                Digital Civic Badges &amp; Milestones
              </h3>
              <p className="text-xs text-slate2">
                Unlock official municipal achievements by reporting, validating,
                and participating.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
              6 / 8 Badges Unlocked
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {badgesList.map((b) => {
              const progressPct = Math.round((b.current / b.target) * 100);

              return (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 space-y-3 ${
                    b.unlocked
                      ? "bg-white border-ink-100 shadow-2xs hover:border-ink-200"
                      : "bg-ink-50/50 border-ink-100/70 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm bg-gradient-to-br ${
                          b.unlocked ? b.color : "from-gray-300 to-gray-400"
                        }`}
                      >
                        {b.icon}
                      </div>

                      <div>
                        <h4 className="font-bold text-ink-900 text-sm flex items-center gap-1.5">
                          {b.title}
                          {b.unlocked && (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-500 fill-emerald-100"
                            />
                          )}
                        </h4>
                        <span className="text-[10px] font-mono text-slate2 font-semibold uppercase tracking-wider">
                          {b.rarity}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        b.unlocked
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-ink-100 text-slate2"
                      }`}
                    >
                      {b.unlocked
                        ? t("rewards_badge_unlocked")
                        : t("rewards_badge_in_progress")}
                    </span>
                  </div>

                  <p className="text-xs text-slate2 leading-relaxed">{b.desc}</p>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate2">
                      <span>Progress</span>
                      <span>
                        {b.current} / {b.target} ({progressPct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          b.unlocked ? "bg-emerald-500" : "bg-amber-400"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REDEEM MUNICIPAL PERKS & VOUCHERS */}
      {activeTab === "redeem" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-ink-900 text-base">
                Municipal Partner Perks &amp; Rebates
              </h3>
              <p className="text-xs text-slate2">
                Redeem your earned civic coins for real municipal discounts and
                transit passes.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {perksCatalog.map((perk) => {
              const canAfford = userCoins >= perk.cost;

              return (
                <div
                  key={perk.id}
                  className="bg-white border border-ink-100 rounded-2xl p-5 shadow-2xs hover:border-ink-200 flex flex-col justify-between transition-all space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${perk.accent} text-white flex items-center justify-center shadow-xs`}
                      >
                        <perk.icon size={20} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate2 bg-ink-50 px-2 py-0.5 rounded border border-ink-100">
                        {perk.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-ink-900 text-sm leading-snug">
                        {perk.title}
                      </h4>
                      <p className="text-xs text-slate2 mt-1 line-clamp-2">
                        {perk.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-ink-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate2 block font-semibold">
                        Cost
                      </span>
                      <span className="font-mono font-bold text-sm text-amber-600 flex items-center gap-1">
                        <Coins size={13} /> {perk.cost} Coins
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => setConfirmModal(perk)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        canAfford
                          ? "bg-ink-950 text-white hover:bg-ink-800"
                          : "bg-ink-100 text-slate2 cursor-not-allowed"
                      }`}
                    >
                      {canAfford
                        ? t("rewards_redeem_btn")
                        : t("rewards_locked_btn")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active / Redeemed Vouchers History */}
          {redeemedVouchers.length > 0 && (
            <div className="pt-4 space-y-3">
              <h4 className="font-display font-bold text-ink-900 text-sm flex items-center gap-2">
                <Ticket size={16} className="text-moss-600" />
                Active Redeemed Vouchers
              </h4>

              <div className="space-y-2">
                {redeemedVouchers.map((v) => (
                  <div
                    key={v.code}
                    className="p-4 rounded-xl bg-moss-50/60 border border-moss-200 flex items-center justify-between flex-wrap gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-ink-900">{v.title}</p>
                      <p className="font-mono text-moss-800 font-semibold tracking-wider mt-0.5">
                        Code: {v.code}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate2 font-mono">{v.date}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-moss-600 text-white font-bold font-mono text-[11px]">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COIN TRANSACTION LEDGER / HISTORY */}
      {activeTab === "ledger" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Ledger Title & Header Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-display font-bold text-ink-900 text-lg flex items-center gap-2">
                <ScrollText size={20} className="text-blue-600" />
                {t("rewards_ledger_title")}
              </h3>
              <p className="text-xs text-slate2 mt-0.5">
                {t("rewards_ledger_sub")}
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white border border-ink-200 hover:border-ink-300 text-ink-900 hover:bg-ink-50 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Download size={14} className="text-blue-600" />
              <span>{t("rewards_export_csv")}</span>
            </button>
          </div>

          {/* 4 Summary Analytics Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate2 font-semibold">
                  {t("rewards_lifetime_earned")}
                </span>
                <TrendingUp size={15} className="text-emerald-500" />
              </div>
              <p className="font-display text-2xl font-bold text-emerald-600 mt-1">
                +{lifetimeEarned}{" "}
                <span className="text-xs font-mono font-normal text-slate2">
                  Coins
                </span>
              </p>
            </div>

            <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate2 font-semibold">
                  {t("rewards_lifetime_spent")}
                </span>
                <TrendingDown size={15} className="text-rose-500" />
              </div>
              <p className="font-display text-2xl font-bold text-rose-600 mt-1">
                -{totalRedeemed}{" "}
                <span className="text-xs font-mono font-normal text-slate2">
                  Coins
                </span>
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-amber-800 font-semibold">
                  {t("rewards_current_balance")}
                </span>
                <Coins size={15} className="text-amber-500" />
              </div>
              <p className="font-display text-2xl font-bold text-amber-700 mt-1">
                {userCoins}{" "}
                <span className="text-xs font-mono font-normal text-amber-900/70">
                  Coins
                </span>
              </p>
            </div>

            <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate2 font-semibold">
                  {t("rewards_audited_records")}
                </span>
                <Receipt size={15} className="text-blue-500" />
              </div>
              <p className="font-display text-2xl font-bold text-ink-900 mt-1">
                {coinTransactions.length}{" "}
                <span className="text-xs font-mono font-normal text-slate2">
                  Txns
                </span>
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3 bg-white border border-ink-100 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {/* Quick Type Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-ink-50 rounded-xl border border-ink-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTxnFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  txnFilter === "all"
                    ? "bg-white text-ink-950 shadow-xs font-bold"
                    : "text-slate2 hover:text-ink-900"
                }`}
              >
                {t("rewards_filter_all")}
              </button>
              <button
                type="button"
                onClick={() => setTxnFilter("credit")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  txnFilter === "credit"
                    ? "bg-white text-emerald-700 shadow-xs font-bold"
                    : "text-slate2 hover:text-ink-900"
                }`}
              >
                <ArrowUpRight size={13} className="text-emerald-500" />
                {t("rewards_filter_credit")}
              </button>
              <button
                type="button"
                onClick={() => setTxnFilter("debit")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  txnFilter === "debit"
                    ? "bg-white text-rose-700 shadow-xs font-bold"
                    : "text-slate2 hover:text-ink-900"
                }`}
              >
                <ArrowDownRight size={13} className="text-rose-500" />
                {t("rewards_filter_debit")}
              </button>
            </div>

            {/* Category Dropdown & Search */}
            <div className="flex items-center gap-2 flex-1 min-w-[280px] justify-end">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-ink-50 border border-ink-100 text-xs font-medium text-ink-900 rounded-xl px-3 py-2 outline-none focus:border-ink-300 cursor-pointer"
              >
                <option value="all">{t("rewards_cat_all")}</option>
                <option value="validation">
                  {t("rewards_cat_validation")}
                </option>
                <option value="bonus">{t("rewards_cat_bonus")}</option>
                <option value="community">{t("rewards_cat_community")}</option>
                <option value="redemption">
                  {t("rewards_cat_redemption")}
                </option>
                <option value="onboarding">
                  {t("rewards_cat_onboarding")}
                </option>
              </select>

              <div className="relative flex-1 max-w-xs">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2"
                />
                <input
                  type="text"
                  placeholder={t("rewards_search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-ink-50 border border-ink-100 rounded-xl text-xs text-ink-900 placeholder:text-slate2 outline-none focus:border-ink-300"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate2 hover:text-ink-900 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Audit Ledger Table & Transaction List */}
          <div className="bg-white border border-ink-100 rounded-2xl shadow-2xs overflow-hidden">
            {/* Table Header (Desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3.5 bg-ink-50/80 border-b border-ink-100 text-[11px] font-mono font-bold text-slate2 uppercase tracking-wider">
              <div className="col-span-3">{t("rewards_txn_date")}</div>
              <div className="col-span-4">{t("rewards_txn_desc")}</div>
              <div className="col-span-2">{t("rewards_txn_category")}</div>
              <div className="col-span-2 text-right">
                {t("rewards_txn_amount")}
              </div>
              <div className="col-span-1 text-right">
                {t("rewards_txn_balance")}
              </div>
            </div>

            {/* Empty State */}
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Receipt size={32} className="mx-auto text-slate2 opacity-40" />
                <p className="text-sm font-semibold text-ink-900">
                  {t("rewards_no_transactions")}
                </p>
                <p className="text-xs text-slate2">
                  Try adjusting your filter or search query.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-ink-100 text-xs">
                {filteredTransactions.map((txn) => {
                  const { relative, fullDate } = formatTxnDate(txn.timestamp);
                  const isCredit = txn.amount >= 0;
                  const catCfg =
                    categoryConfig[txn.category] || categoryConfig.validation;
                  const CatIcon = catCfg.icon;

                  return (
                    <div
                      key={txn.id}
                      className="p-4 md:px-5 md:py-3.5 hover:bg-ink-50/50 transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-3 md:items-center space-y-2 md:space-y-0"
                    >
                      {/* Column 1: Date & Time */}
                      <div className="md:col-span-3 flex items-center justify-between md:block">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock size={12} className="text-slate2 shrink-0" />
                          <span className="font-semibold text-ink-900 text-xs">
                            {relative}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate2 font-mono mt-0.5">
                          {fullDate}
                        </p>
                      </div>

                      {/* Column 2: Description & Reference */}
                      <div className="md:col-span-4 space-y-1">
                        <p className="font-semibold text-ink-900 text-xs leading-snug">
                          {txn.title}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-slate2 bg-ink-50 px-1.5 py-0.2 rounded border border-ink-100">
                            {txn.id}
                          </span>
                          {txn.refToken && txn.refToken.startsWith("CVX-") && (
                            <Link
                              to={`/citizen/track?token=${txn.refToken}`}
                              className="text-[10px] font-mono text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 flex items-center gap-1"
                              title="Track Grievance"
                            >
                              <span>{txn.refToken}</span>
                              <ExternalLink size={9} />
                            </Link>
                          )}
                          {txn.refToken && txn.refToken.startsWith("PMC-") && (
                            <span className="text-[10px] font-mono text-moss-800 bg-moss-50 px-1.5 py-0.2 rounded border border-moss-200">
                              Voucher: {txn.refToken}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Category Badge */}
                      <div className="md:col-span-2 flex items-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold border ${catCfg.color}`}
                        >
                          <CatIcon size={11} className={catCfg.iconColor} />
                          <span>
                            {t(catCfg.labelKey) || catCfg.defaultLabel}
                          </span>
                        </span>
                      </div>

                      {/* Column 4: Amount (+ / - Coins) */}
                      <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                        <span className="text-slate2 md:hidden font-mono text-[11px]">
                          Amount:
                        </span>
                        <span
                          className={`font-mono font-bold text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-xl ${
                            isCredit
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isCredit ? (
                            <>
                              <TrendingUp size={13} className="text-emerald-600" />
                              <span>+{txn.amount} Coins</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown size={13} className="text-rose-600" />
                              <span>{txn.amount} Coins</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Column 5: Running Balance */}
                      <div className="md:col-span-1 flex items-center justify-between md:justify-end">
                        <span className="text-slate2 md:hidden font-mono text-[11px]">
                          Running Balance:
                        </span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-ink-950 block">
                            {txn.runningBalance ?? userCoins}
                          </span>
                          <span className="text-[9px] font-mono text-slate2 uppercase">
                            Coins
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Official Audit Disclaimer Footer */}
            <div className="px-5 py-3 bg-ink-50/60 border-t border-ink-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate2 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {t("rewards_ledger_disclaimer")}
              </span>
              <span>
                Showing {filteredTransactions.length} of{" "}
                {coinTransactions.length} records
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Confirmation Modal Before Redemption */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-ink-100 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <Gift size={18} className="text-amber-500" />
                <h3 className="font-bold text-ink-900 text-base">
                  {t("rewards_redeem_confirm_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="w-7 h-7 rounded-full bg-ink-50 hover:bg-ink-100 text-slate2 flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-ink-50 space-y-1">
              <p className="font-bold text-ink-900 text-sm">
                {confirmModal.title}
              </p>
              <p className="text-xs text-slate2">{confirmModal.desc}</p>
            </div>

            {/* Coin Deduction Summary */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate2">
                <span>Current Balance</span>
                <span className="font-bold text-ink-900">{userCoins} Coins</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Perk Cost</span>
                <span className="font-bold">- {confirmModal.cost} Coins</span>
              </div>
              <div className="h-px bg-ink-200" />
              <div className="flex justify-between text-ink-900 font-bold">
                <span>Remaining Balance</span>
                <span className="text-emerald-600">
                  {userCoins - confirmModal.cost} Coins
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate2 hover:bg-ink-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRedeemConfirm(confirmModal)}
                className="px-5 py-2.5 rounded-xl bg-ink-950 hover:bg-ink-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Confirm &amp; Unlock Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Voucher Code Reveal Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-ink-100 rounded-2xl max-w-md w-full shadow-2xl p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={30} />
            </div>

            <div>
              <h3 className="font-display font-bold text-ink-900 text-lg">
                {t("rewards_redeem_success")}
              </h3>
              <p className="text-xs text-slate2 mt-1">{selectedVoucher.title}</p>
            </div>

            {/* Generated Voucher Card */}
            <div className="p-4 bg-ink-950 text-white rounded-xl space-y-2 text-center font-mono">
              <span className="text-[10px] text-amber-300 uppercase tracking-widest block">
                {t("rewards_voucher_code")}
              </span>
              <p className="font-bold text-lg tracking-widest text-white select-all">
                {selectedVoucher.code}
              </p>
              <span className="text-[10px] text-emerald-400 block pt-1">
                ✓ Valid for 90 Days Across Pune Jurisdiction
              </span>
            </div>

            <p className="text-xs text-slate2 leading-relaxed">
              {t("rewards_present_code")}
            </p>

            <button
              type="button"
              onClick={() => setSelectedVoucher(null)}
              className="w-full py-2.5 rounded-xl bg-ink-900 hover:bg-ink-700 text-paper text-xs font-bold transition-colors cursor-pointer"
            >
              {t("btn_close") || "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
