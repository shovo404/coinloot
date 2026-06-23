import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClient } from "../lib/supabase";

export interface DashboardStats {
  // Users
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  onlineUsers: number;
  // Earnings
  totalCoinsEarned: number;
  totalCoinsWithdrawn: number;
  totalPaidUsd: number;
  earningsToday: number;
  earningsThisWeek: number;
  earningsThisMonth: number;
  // Withdrawals
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  rejectedWithdrawals: number;
  totalWithdrawalsCount: number;
  // Offerwalls
  totalOfferwalls: number;
  activeOfferwalls: number;
  disabledOfferwalls: number;
  lockedOfferwalls: number;
  // Offers (from offerwalls table - each offerwall is an "offer")
  totalOffers: number;
  activeOffers: number;
  disabledOffers: number;
  lockedOffers: number;
  // Countries
  countriesWithOffers: { country: string; offerCount: number }[];
  topEarningCountries: { country: string; totalEarned: number }[];
  // Top earners
  topEarnersAllTime: { username: string; totalEarned: number; level: number }[];
  // Recent earnings activity
  recentEarnings: { username: string; provider: string; coins: number; created_at: string }[];
  // Withdrawal analytics
  withdrawalByMethod: { method: string; count: number; totalUsd: number }[];
  // Chart data
  dailyEarnings: number[];
  weeklyEarnings: number[];
  monthlyEarnings: number[];
  userGrowth: number[];
  // Connected state
  isLive: boolean;
}

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  newUsersToday: 0,
  newUsersThisWeek: 0,
  newUsersThisMonth: 0,
  onlineUsers: 0,
  totalCoinsEarned: 0,
  totalCoinsWithdrawn: 0,
  totalPaidUsd: 0,
  earningsToday: 0,
  earningsThisWeek: 0,
  earningsThisMonth: 0,
  pendingWithdrawals: 0,
  approvedWithdrawals: 0,
  rejectedWithdrawals: 0,
  totalWithdrawalsCount: 0,
  totalOfferwalls: 0,
  activeOfferwalls: 0,
  disabledOfferwalls: 0,
  lockedOfferwalls: 0,
  totalOffers: 0,
  activeOffers: 0,
  disabledOffers: 0,
  lockedOffers: 0,
  countriesWithOffers: [],
  topEarningCountries: [],
  topEarnersAllTime: [],
  recentEarnings: [],
  withdrawalByMethod: [],
  dailyEarnings: [],
  weeklyEarnings: [],
  monthlyEarnings: [],
  userGrowth: [],
  isLive: false,
};

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export function useAdminDashboard(): {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refresh: () => void;
} {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const sb = getSupabaseClient();
      if (!sb) { setLoading(false); return; }
      const today = new Date().toISOString().split("T")[0];
      const weekStart = getWeekStart();
      const monthStart = getMonthStart();

      // Run all queries in parallel
      const results = await Promise.allSettled([
        // Users
        sb.from("profiles").select("*", { count: "exact", head: true }),
        sb.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", false),
        sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", today),
        sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
        sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        // Earnings aggregates
        sb.from("profiles").select("total_earned_coins"),
        sb.from("withdrawals").select("coins_deducted").eq("status", "APPROVED"),
        sb.from("withdrawals").select("usd_value").eq("status", "APPROVED"),
        // Earnings by period
        sb.from("earnings_history").select("coins_earned").gte("created_at", today),
        sb.from("earnings_history").select("coins_earned").gte("created_at", weekStart),
        sb.from("earnings_history").select("coins_earned").gte("created_at", monthStart),
        // Withdrawal counts
        sb.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
        sb.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
        sb.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "REJECTED"),
        sb.from("withdrawals").select("*", { count: "exact", head: true }),
        // Offerwalls
        sb.from("offerwalls").select("*", { count: "exact", head: true }),
        sb.from("offerwalls").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
        sb.from("offerwalls").select("*", { count: "exact", head: true }).eq("status", "INACTIVE"),
        sb.from("offerwalls").select("*", { count: "exact", head: true }).eq("status", "LOCKED"),
        // Profiles for country / top earners / growth
        sb.from("profiles").select("country, total_earned_coins, username, level, balance_coins, created_at").order("total_earned_coins", { ascending: false }).limit(100),
        // Recent earnings activity (live_earnings has username column)
        sb.from("live_earnings").select("username, provider, coins_earned, created_at").order("created_at", { ascending: false }).limit(20),
        // Withdrawal methods
        sb.from("withdrawals").select("payout_method, usd_value"),
        // Daily earnings for charts (last 7 days)
        sb.from("earnings_history").select("coins_earned, created_at").gte("created_at", getDaysAgo(6)),
        // User growth (users created per day for last 7 days)
        sb.from("profiles").select("created_at").gte("created_at", getDaysAgo(6)),
      ]);

      // Safe extractors
      const safeCount = (_r: any, idx: number): number => {
        const res = results[idx];
        if (res.status === "fulfilled" && res.value) {
          const d = res.value as any;
          return d.count ?? 0;
        }
        return 0;
      };

      const safeSum = (r: any, field: string): number => {
        if (!r) return 0;
        if (r.status === "fulfilled" && r.value?.data) {
          return r.value.data.reduce((s: number, item: any) => s + (Number(item[field]) || 0), 0);
        }
        return 0;
      };

      const safeArray = (r: any): any[] => {
        if (r?.status === "fulfilled" && r.value?.data) return r.value.data;
        return [];
      };

      // Extract profile data (index 19)
      const profileData = safeArray(results[19]);
      const profilesArray = Array.isArray(profileData) ? profileData : [];

      // Country aggregation
      const countryMap = new Map<string, number>();
      const countryEarningsMap = new Map<string, number>();
      profilesArray.forEach((p: any) => {
        const c = p.country || "Unknown";
        countryMap.set(c, (countryMap.get(c) || 0) + 1);
        countryEarningsMap.set(c, (countryEarningsMap.get(c) || 0) + (Number(p.total_earned_coins) || 0));
      });
      const countriesWithOffers = Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, offerCount: count }))
        .sort((a, b) => b.offerCount - a.offerCount)
        .slice(0, 10);
      const topEarningCountries = Array.from(countryEarningsMap.entries())
        .map(([country, totalEarned]) => ({ country, totalEarned }))
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 10);

      // Top earners
      const topEarnersAllTime = profilesArray
        .filter((p: any) => p.total_earned_coins > 0)
        .slice(0, 10)
        .map((p: any) => ({ username: p.username, totalEarned: Number(p.total_earned_coins) || 0, level: p.level || 1 }));

      // Recent earnings (from live_earnings which has username)
      const earningsData = safeArray(results[20]);
      const recentEarnings = (Array.isArray(earningsData) ? earningsData : []).slice(0, 10).map((e: any) => ({
        username: e.username || "Unknown",
        provider: e.provider || "Unknown",
        coins: Number(e.coins_earned) || 0,
        created_at: e.created_at || new Date().toISOString(),
      }));

      // Withdrawal by method
      const wdData = safeArray(results[21]);
      const methodMap = new Map<string, { count: number; totalUsd: number }>();
      (Array.isArray(wdData) ? wdData : []).forEach((w: any) => {
        const m = w.payout_method || "Unknown";
        const existing = methodMap.get(m) || { count: 0, totalUsd: 0 };
        existing.count++;
        existing.totalUsd += Number(w.usd_value) || 0;
        methodMap.set(m, existing);
      });
      const withdrawalByMethod = Array.from(methodMap.entries())
        .map(([method, data]) => ({ method, count: data.count, totalUsd: data.totalUsd }))
        .sort((a, b) => b.count - a.count);

      // Daily earnings chart (last 7 days)
      const dailyEarningsData = safeArray(results[22]);
      const dailyEarningsMap = new Map<string, number>();
      const today_d = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today_d);
        d.setDate(d.getDate() - i);
        dailyEarningsMap.set(d.toISOString().split("T")[0], 0);
      }
      (Array.isArray(dailyEarningsData) ? dailyEarningsData : []).forEach((e: any) => {
        const day = (e.created_at || "").split("T")[0];
        if (dailyEarningsMap.has(day)) {
          dailyEarningsMap.set(day, dailyEarningsMap.get(day)! + (Number(e.coins_earned) || 0));
        }
      });
      const dailyEarnings = Array.from(dailyEarningsMap.values());

      // User growth chart (users per day, last 7 days)
      const growthData = safeArray(results[23]);
      const growthMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today_d);
        d.setDate(d.getDate() - i);
        growthMap.set(d.toISOString().split("T")[0], 0);
      }
      (Array.isArray(growthData) ? growthData : []).forEach((p: any) => {
        const day = (p.created_at || "").split("T")[0];
        if (growthMap.has(day)) {
          growthMap.set(day, growthMap.get(day)! + 1);
        }
      });
      const userGrowth = Array.from(growthMap.values());

      setStats({
        totalUsers: safeCount(results[0], 0),
        activeUsers: safeCount(results[1], 1),
        newUsersToday: safeCount(results[2], 2),
        newUsersThisWeek: safeCount(results[3], 3),
        newUsersThisMonth: safeCount(results[4], 4),
        onlineUsers: 0, // Requires real-time tracking table
        totalCoinsEarned: safeSum(results[5], "total_earned_coins"),
        totalCoinsWithdrawn: safeSum(results[6], "coins_deducted"),
        totalPaidUsd: safeSum(results[7], "usd_value"),
        earningsToday: safeSum(results[8], "coins_earned"),
        earningsThisWeek: safeSum(results[9], "coins_earned"),
        earningsThisMonth: safeSum(results[10], "coins_earned"),
        pendingWithdrawals: safeCount(results[11], 11),
        approvedWithdrawals: safeCount(results[12], 12),
        rejectedWithdrawals: safeCount(results[13], 13),
        totalWithdrawalsCount: safeCount(results[14], 14),
        totalOfferwalls: safeCount(results[15], 15),
        activeOfferwalls: safeCount(results[16], 16),
        disabledOfferwalls: safeCount(results[17], 17),
        lockedOfferwalls: safeCount(results[18], 18),
        totalOffers: safeCount(results[15], 15),
        activeOffers: safeCount(results[16], 16),
        disabledOffers: safeCount(results[17], 17),
        lockedOffers: safeCount(results[18], 18),
        countriesWithOffers,
        topEarningCountries,
        topEarnersAllTime,
        recentEarnings,
        withdrawalByMethod,
        dailyEarnings,
        weeklyEarnings: dailyEarnings,
        monthlyEarnings: dailyEarnings,
        userGrowth,
        isLive: true,
      });
      setError(null);
      setIsLive(true);
    } catch (e: any) {
      const msg = e?.message || "Unknown error";
      // Log real errors to console but don't block the dashboard
      console.error("[AdminDashboard] Query error:", msg);
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError(null); // Network issues — hide from user, just show zeros
      } else if (msg.includes("42P01") || msg.includes("relation") || msg.includes("does not exist")) {
        setError(null); // Missing tables — hide from user, just show zeros
      } else {
        setError(null); // Hide all errors from user — dashboard shows "No data" gracefully
      }
      setIsLive(false);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Fetch on mount only — no Realtime subscriptions
  useEffect(() => {
    fetchStats();
    return () => { mountedRef.current = false; };
  }, [fetchStats]);

  const refresh = useCallback(() => fetchStats(), [fetchStats]);

  return { stats, loading, error, isLive, refresh };
}
