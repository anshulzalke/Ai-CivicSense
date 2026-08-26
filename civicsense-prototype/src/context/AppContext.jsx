import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  api,
  getToken,
  getStoredUser,
  getStoredRole,
  clearSession,
  setStoredRole,
} from "../lib/api";
import { DEPARTMENTS as FALLBACK_DEPARTMENTS, OFFICIALS as FALLBACK_OFFICIALS } from "../lib/mockData";

const COIN_LEDGER_KEY = "civicsense_coin_ledger";
const REDEEMED_VOUCHERS_KEY = "civicsense_redeemed_vouchers";

export const DEFAULT_COIN_TRANSACTIONS = [
  {
    id: "TXN-2026-945881",
    type: "credit",
    category: "validation",
    categoryKey: "rewards_cat_validation",
    title: "Grievance Validated & Satisfied (CVX-2026-945881)",
    refToken: "CVX-2026-945881",
    amount: 25,
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "TXN-2026-538830",
    type: "credit",
    category: "bonus",
    categoryKey: "rewards_cat_bonus",
    title: "Complaint First Reporter Bonus (CVX-2026-538830)",
    refToken: "CVX-2026-538830",
    amount: 15,
    timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "TXN-2026-441092",
    type: "credit",
    category: "community",
    categoryKey: "rewards_cat_community",
    title: "Community Poll Vote Cast (Wagholi Multi-Tier Flyover)",
    refToken: "POLL-2026-WAGHOLI",
    amount: 5,
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "TXN-2026-781923",
    type: "debit",
    category: "redemption",
    categoryKey: "rewards_cat_redemption",
    title: "Redeemed: Free Smart Parking 2 Hours Voucher",
    refToken: "PMC-SMART-8492-XQ",
    amount: -75,
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "TXN-2026-621849",
    type: "credit",
    category: "validation",
    categoryKey: "rewards_cat_validation",
    title: "Grievance Validated & Satisfied (CVX-2026-000072)",
    refToken: "CVX-2026-000072",
    amount: 25,
    timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "TXN-2026-319024",
    type: "debit",
    category: "redemption",
    categoryKey: "rewards_cat_redemption",
    title: "Redeemed: 10% Off PMPML Bus Pass",
    refToken: "PMC-PMPML-5912-ZT",
    amount: -150,
    timestamp: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "TXN-2026-118402",
    type: "credit",
    category: "validation",
    categoryKey: "rewards_cat_validation",
    title: "Grievance Validated & Satisfied (CVX-2026-000045)",
    refToken: "CVX-2026-000045",
    amount: 25,
    timestamp: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "TXN-2026-009182",
    type: "credit",
    category: "onboarding",
    categoryKey: "rewards_cat_onboarding",
    title: "Pune Citizen Distress SOS & e-KYC Profile Verification",
    refToken: "KYC-GOV-1187",
    amount: 50,
    timestamp: new Date(Date.now() - 150 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "TXN-2026-000101",
    type: "credit",
    category: "bonus",
    categoryKey: "rewards_cat_bonus",
    title: "Complaint First Reporter Bonus (CVX-2026-000101)",
    refToken: "CVX-2026-000101",
    amount: 15,
    timestamp: new Date(Date.now() - 180 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "TXN-2026-000001",
    type: "credit",
    category: "onboarding",
    categoryKey: "rewards_cat_onboarding",
    title: "CivicSense Platform Registration Welcome Reward",
    refToken: "WELCOME-PMC",
    amount: 305,
    timestamp: new Date(Date.now() - 200 * 3600 * 1000).toISOString(),
    status: "settled",
  },
];

export const DEFAULT_REDEEMED_VOUCHERS = [
  {
    code: "PMC-SMART-8492-XQ",
    title: "Free Smart Parking (2 Hours)",
    cost: 75,
    category: "Urban Mobility",
    date: "21 Aug 2026",
    status: "ACTIVE",
  },
  {
    code: "PMC-PMPML-5912-ZT",
    title: "10% Off PMPML Monthly Bus Pass",
    cost: 150,
    category: "Transit",
    date: "19 Aug 2026",
    status: "ACTIVE",
  },
];

export function computeRunningBalances(txns) {
  if (!Array.isArray(txns) || txns.length === 0) return [];
  const sortedAsc = [...txns].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let running = 0;
  const withBalances = sortedAsc.map((t) => {
    running += Number(t.amount) || 0;
    return {
      ...t,
      runningBalance: Math.max(0, running),
    };
  });
  return withBalances.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [role, setRole] = useState(() => getStoredRole()); // 'citizen' | 'gov' | 'admin'
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setTokenState] = useState(() => getToken());
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [officials, setOfficials] = useState(FALLBACK_OFFICIALS);
  const [audit, setAudit] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);

  // Coin Transaction Ledger state
  const [rawTransactions, setRawTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem(COIN_LEDGER_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_COIN_TRANSACTIONS;
    } catch {
      return DEFAULT_COIN_TRANSACTIONS;
    }
  });

  // Redeemed Vouchers state
  const [redeemedVouchers, setRedeemedVouchers] = useState(() => {
    try {
      const stored = localStorage.getItem(REDEEMED_VOUCHERS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_REDEEMED_VOUCHERS;
    } catch {
      return DEFAULT_REDEEMED_VOUCHERS;
    }
  });

  // Memoized transactions with running balances
  const coinTransactions = useMemo(() => {
    return computeRunningBalances(rawTransactions);
  }, [rawTransactions]);

  // Load complaints list from backend
  const refreshComplaints = useCallback(async (params = {}) => {
    if (!getToken()) return;
    try {
      const list = await api.complaints.list(params);
      setComplaints(list);
      setBackendOnline(true);
      return list;
    } catch (err) {
      console.warn("Failed to fetch complaints from backend:", err.message);
      setError(err.message);
      if (err.message.includes("Cannot connect")) {
        setBackendOnline(false);
      }
      return [];
    }
  }, []);

  // Fetch departments & officials metadata
  const fetchMetadata = useCallback(async () => {
    if (!getToken()) return;
    try {
      const [deptRes, offRes] = await Promise.allSettled([
        api.admin.getDepartments(),
        api.admin.getOfficials(),
      ]);

      if (deptRes.status === "fulfilled" && deptRes.value.length > 0) {
        setDepartments(deptRes.value);
      }
      if (offRes.status === "fulfilled" && offRes.value.length > 0) {
        setOfficials(offRes.value);
      }
    } catch (err) {
      console.warn("Failed to load metadata:", err.message);
    }
  }, []);

  // Fetch audit log
  const fetchAuditLog = useCallback(async () => {
    if (!getToken()) return;
    try {
      const log = await api.admin.getAuditLog();
      setAudit(log);
      return log;
    } catch (err) {
      console.warn("Failed to fetch audit log:", err.message);
      return [];
    }
  }, []);

  // Fetch citizens list (admin)
  const fetchCitizens = useCallback(async () => {
    if (!getToken()) return;
    try {
      const list = await api.admin.getCitizens();
      setCitizens(list);
      return list;
    } catch (err) {
      console.warn("Failed to fetch citizens:", err.message);
      return [];
    }
  }, []);

  // Verify and sync current user on start or token change
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const currentToken = getToken();
      if (!currentToken) return;

      try {
        const profile = await api.auth.getMe();
        if (isMounted && profile) {
          setUser(profile);
          const computedRole = profile.role === "official" ? "gov" : profile.role;
          setRole(computedRole);
          setStoredRole(computedRole);
          setBackendOnline(true);
          await refreshComplaints();
          await fetchMetadata();
        }
      } catch (err) {
        console.warn("Session restore check failed:", err.message);
        if (err.status === 401) {
          clearSession();
          if (isMounted) {
            setUser(null);
            setRole(null);
            setTokenState(null);
          }
        }
      }
    }

    initSession();
    return () => {
      isMounted = false;
    };
  }, [refreshComplaints, fetchMetadata]);

  // Citizen Login
  const loginCitizen = useCallback(async ({ govId, name, ward }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.citizenLogin({ govId, name, ward });
      setUser(res.user);
      setRole("citizen");
      setTokenState(res.token);
      setBackendOnline(true);
      await refreshComplaints();
      await fetchMetadata();
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshComplaints, fetchMetadata]);

  // Staff Login (Officials & Admin)
  const loginStaff = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.staffLogin({ email, password });
      setUser(res.user);
      const computedRole = res.user.role === "official" ? "gov" : res.user.role;
      setRole(computedRole);
      setTokenState(res.token);
      setBackendOnline(true);
      await refreshComplaints();
      await fetchMetadata();
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshComplaints, fetchMetadata]);

  // Generic login helper
  const login = useCallback(async (chosenRole, credentials = {}) => {
    if (chosenRole === "citizen") {
      return loginCitizen({ govId: credentials.govId || "GOV-XXXX-1187", name: credentials.name, ward: credentials.ward });
    }
    return loginStaff({
      email: credentials.email || (chosenRole === "admin" ? "admin@civicsense.gov.in" : "r.kulkarni@civicsense.gov.in"),
      password: credentials.password || "civicsense123",
    });
  }, [loginCitizen, loginStaff]);

  const logout = useCallback(() => {
    api.auth.logout();
    setRole(null);
    setUser(null);
    setTokenState(null);
    setComplaints([]);
    setAudit([]);
    setCitizens([]);
  }, []);

  const checkDuplicate = useCallback(async (draft) => {
    try {
      return await api.complaints.checkDuplicate(draft);
    } catch (err) {
      console.warn("Duplicate check error:", err.message);
      return null;
    }
  }, []);

  const addCoinTransaction = useCallback((txn) => {
    const newTxn = {
      id: txn.id || `TXN-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      type: txn.type || (txn.amount >= 0 ? "credit" : "debit"),
      category: txn.category || (txn.amount >= 0 ? "validation" : "redemption"),
      categoryKey:
        txn.categoryKey || (txn.amount >= 0 ? "rewards_cat_validation" : "rewards_cat_redemption"),
      title: txn.title || "Civic Action Reward",
      refToken: txn.refToken || null,
      amount: Number(txn.amount) || 0,
      timestamp: txn.timestamp || new Date().toISOString(),
      status: txn.status || "settled",
    };

    setRawTransactions((prev) => {
      const updated = [newTxn, ...prev];
      try {
        localStorage.setItem(COIN_LEDGER_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist coin ledger:", e);
      }
      return updated;
    });

    setUser((prev) => {
      const currentCoins = Number(prev?.coins ?? 240);
      const newCoins = Math.max(0, currentCoins + newTxn.amount);
      const updatedUser = prev ? { ...prev, coins: newCoins } : { coins: newCoins };
      try {
        localStorage.setItem("civicsense_user", JSON.stringify(updatedUser));
      } catch {
        // ignore
      }
      return updatedUser;
    });

    return newTxn;
  }, []);

  const redeemPerk = useCallback(
    async (perk) => {
      const currentCoins = Number(user?.coins ?? 240);
      if (currentCoins < perk.cost) {
        throw new Error("Insufficient coins");
      }

      const voucherCode = `PMC-${perk.id.toUpperCase().slice(0, 5)}-${Math.floor(
        1000 + Math.random() * 9000
      )}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

      const newBalance = currentCoins - perk.cost;

      const redeemedRecord = {
        code: voucherCode,
        title: perk.title,
        cost: perk.cost,
        category: perk.category || "Municipal",
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        status: "ACTIVE",
      };

      setRedeemedVouchers((prev) => {
        const updated = [redeemedRecord, ...prev];
        try {
          localStorage.setItem(REDEEMED_VOUCHERS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      const txn = addCoinTransaction({
        id: `TXN-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        type: "debit",
        category: "redemption",
        categoryKey: "rewards_cat_redemption",
        title: `Redeemed: ${perk.title}`,
        refToken: voucherCode,
        amount: -Math.abs(perk.cost),
        timestamp: new Date().toISOString(),
        status: "settled",
      });

      return { voucher: redeemedRecord, newBalance, txn };
    },
    [user?.coins, addCoinTransaction]
  );

  const recordVoteBonus = useCallback(
    (pollTitle) => {
      return addCoinTransaction({
        id: `TXN-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        type: "credit",
        category: "community",
        categoryKey: "rewards_cat_community",
        title: `Community Poll Vote Cast (${pollTitle || "District Project Priority"})`,
        refToken: `POLL-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: 5,
        timestamp: new Date().toISOString(),
        status: "settled",
      });
    },
    [addCoinTransaction]
  );

  const fileComplaint = useCallback(
    async (draft) => {
      setLoading(true);
      try {
        const created = await api.complaints.file(draft);
        setComplaints((prev) => [created, ...prev]);

        // Award first reporter bonus
        addCoinTransaction({
          id: `TXN-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          type: "credit",
          category: "bonus",
          categoryKey: "rewards_cat_bonus",
          title: `Complaint First Reporter Bonus (${created.token})`,
          refToken: created.token,
          amount: 15,
          timestamp: new Date().toISOString(),
          status: "settled",
        });

        try {
          const freshUser = await api.auth.getMe();
          if (freshUser) setUser(freshUser);
        } catch {
          // ignore
        }
        return created;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addCoinTransaction]
  );

  const resolveComplaint = useCallback(async (token, note, resolutionImage = null) => {
    setLoading(true);
    try {
      const updated = await api.complaints.resolve(token, note, resolutionImage);
      setComplaints((prev) => prev.map((c) => (c.token === token ? updated : c)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateResolution = useCallback(
    async (token, payload) => {
      setLoading(true);
      try {
        const updated = await api.complaints.validate(token, payload);
        setComplaints((prev) => prev.map((c) => (c.token === token ? updated : c)));

        if (payload?.satisfied) {
          addCoinTransaction({
            id: `TXN-2026-${Math.floor(100000 + Math.random() * 900000)}`,
            type: "credit",
            category: "validation",
            categoryKey: "rewards_cat_validation",
            title: `Grievance Validated & Satisfied (${token})`,
            refToken: token,
            amount: 25,
            timestamp: new Date().toISOString(),
            status: "settled",
          });
        }

        try {
          const freshUser = await api.auth.getMe();
          if (freshUser) setUser(freshUser);
        } catch {
          // ignore
        }
        return updated;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addCoinTransaction]
  );

  const flagResolution = useCallback(async (token, reason) => {
    setLoading(true);
    try {
      const updated = await api.complaints.flag(token, reason);
      setComplaints((prev) => prev.map((c) => (c.token === token ? updated : c)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  const assignOfficer = useCallback(async (token, officerId) => {
    setLoading(true);
    try {
      const updated = await api.complaints.assign(token, officerId);
      setComplaints((prev) => prev.map((c) => (c.token === token ? updated : c)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const flagCitizen = useCallback(async (id, flagged, reason) => {
    setLoading(true);
    try {
      const updatedCitizen = await api.admin.flagCitizen(id, { flagged, reason });
      setCitizens((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedCitizen } : c)));
      return updatedCitizen;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  const seedDemoData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.seedDemoData();
      await Promise.all([refreshComplaints(), fetchAuditLog(), fetchCitizens()]);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshComplaints, fetchAuditLog, fetchCitizens]);

  const resetDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.resetDatabase();
      await Promise.all([refreshComplaints(), fetchAuditLog(), fetchCitizens()]);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshComplaints, fetchAuditLog, fetchCitizens]);

  const value = useMemo(
    () => ({
      role,
      user,
      citizen: user, // backward compatibility for citizen views
      token,
      complaints,
      departments,
      officials,
      citizens,
      audit,
      loading,
      error,
      backendOnline,
      // Coin Transaction Ledger & Perks
      coinTransactions,
      rawTransactions,
      redeemedVouchers,
      addCoinTransaction,
      redeemPerk,
      recordVoteBonus,
      loginCitizen,
      loginStaff,
      login,
      logout,
      refreshComplaints,
      fetchAuditLog,
      fetchCitizens,
      fetchMetadata,
      checkDuplicate,
      fileComplaint,
      resolveComplaint,
      validateResolution,
      flagResolution,
      assignOfficer,
      flagCitizen,
      seedDemoData,
      resetDatabase,
      resetAll: () => {
        logout();
      },
    }),
    [
      role,
      user,
      token,
      complaints,
      departments,
      officials,
      citizens,
      audit,
      loading,
      error,
      backendOnline,
      coinTransactions,
      rawTransactions,
      redeemedVouchers,
      addCoinTransaction,
      redeemPerk,
      recordVoteBonus,
      loginCitizen,
      loginStaff,
      login,
      logout,
      refreshComplaints,
      fetchAuditLog,
      fetchCitizens,
      fetchMetadata,
      checkDuplicate,
      fileComplaint,
      resolveComplaint,
      validateResolution,
      flagResolution,
      assignOfficer,
      flagCitizen,
      seedDemoData,
      resetDatabase,
    ]
  );


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const AuthProvider = AppProvider;

const defaultAppContext = {
  role: null,
  user: null,
  citizen: null,
  token: null,
  complaints: [],
  departments: FALLBACK_DEPARTMENTS,
  officials: FALLBACK_OFFICIALS,
  citizens: [],
  audit: [],
  loading: false,
  error: null,
  backendOnline: true,
  coinTransactions: DEFAULT_COIN_TRANSACTIONS,
  rawTransactions: DEFAULT_COIN_TRANSACTIONS,
  redeemedVouchers: DEFAULT_REDEEMED_VOUCHERS,
  addCoinTransaction: () => ({}),
  redeemPerk: async () => ({}),
  recordVoteBonus: () => ({}),
  loginCitizen: async () => ({}),
  loginStaff: async () => ({}),
  login: async () => ({}),
  logout: () => {},
  refreshComplaints: async () => [],
  fetchAuditLog: async () => [],
  fetchCitizens: async () => [],
  fetchMetadata: async () => {},
  checkDuplicate: async () => null,
  fileComplaint: async () => ({}),
  resolveComplaint: async () => ({}),
  validateResolution: async () => ({}),
  flagResolution: async () => ({}),
  assignOfficer: async () => ({}),
  flagCitizen: async () => ({}),
  seedDemoData: async () => ({}),
  resetDatabase: async () => ({}),
  resetAll: () => {},
};

export function useApp() {
  const ctx = useContext(AppContext);
  return ctx || defaultAppContext;
}

export const useAppContext = useApp;
export const useAuth = useApp;

