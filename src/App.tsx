import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Zap, Users, ChevronRight, Wallet, Trophy, Gift, MessageSquare } from "lucide-react";
import { AppNotification } from "./components/Navbar";
import { playCoinSound, playNotificationSound } from "./utils/coinSound";
import RewardPopup, { usePopupQueue } from "./components/RewardPopup";
import LevelUpCelebration from "./components/LevelUpCelebration";
import KycUploadPage from "./components/KycUploadPage";
import { checkVpnStatus, isUserRestricted, logDetection, checkAutoRestrict, VpnCheckResult, getVpnSettings } from "./utils/vpnDetector";
import { createAdminNotification, notifyVpnDetection } from "./utils/adminNotifier";
import { calcLevel } from "./utils/levelSystem";
import DeveloperModeBanner from "./components/DeveloperModeBanner";
import { getSupabaseClient, getCurrentSession, getCurrentUser } from "./lib/supabase";
import { ActivityFeedItem, getDemoFeed, getStoredFeed, saveFeed, filterFeedBySettings, getTickerSettings, getSpeedMs, buildActivityMessage, mergeFeeds } from "./utils/activityFeed";
import { getProfile, updateProfile, getWithdrawals, getNotifications, getAllProfiles, createWithdrawal, signOut as supabaseSignOut, getSiteSetting, markNotificationRead, addCoins } from "./lib/supabaseService";
import { realtimeManager } from "./lib/realtimeManager";
import { AppRealtimeProvider } from "./hooks/useAppRealtimeState";

import AnimatedBackground from "./components/AnimatedBackground";
import Globe3D from "./components/Globe3D";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import EarnPage from "./components/EarnPage";
import RewardsStore from "./components/RewardsStore";
import ReferralsAffiliates from "./components/ReferralsAffiliates";
import LeaderboardPodium from "./components/LeaderboardPodium";
import AdminDashboardPanel from "./components/AdminDashboardPanel";
import VpnBlockPopup from "./components/VpnBlockPopup";
import RestrictionPage from "./components/RestrictionPage";
import SurveyHub from "./components/SurveyHub";
import Loader from "./components/Loader";
import WithdrawHub from "./components/WithdrawHub";
import MyProfilePage from "./components/MyProfilePage";
import AccountSettingsPage from "./components/AccountSettingsPage";
import SecuritySettingsPage from "./components/SecuritySettingsPage";
import SupportTicket from "./components/SupportTicket";

import { UserProfile, WithdrawalRequest } from "./types";
import { applyTheme, applyLanguage, loadPreferences, listenForSystemTheme } from "./utils/themeUtils";
import { preloadProviderLogos } from "./utils/providerLogos";

// ─── UI Constants (not data — just static UI content for landing page) ────────

const PAYMENT_METHODS = [
  { name: "PayPal", icon: "💎", desc: "Instant cashouts" },
  { name: "Binance Pay", icon: "🌐", desc: "Zero-fee transfers" },
  { name: "Bitcoin", icon: "₿", desc: "BTC wallet" },
  { name: "Litecoin", icon: "Ł", desc: "LTC wallet" },
  { name: "Ethereum", icon: "♦", desc: "ETH wallet" },
  { name: "USDT (TRC-20)", icon: "₮", desc: "Stablecoin" },
  { name: "Gift Cards", icon: "🎁", desc: "Amazon & more" },
];

const OFFERWALL_PROVIDERS = [
  { name: "CPX Research", color: "from-purple-500/20 to-pink-600/20", border: "border-purple-500/20" },
  { name: "BitLabs", color: "from-indigo-500/20 to-violet-600/20", border: "border-indigo-500/20" },
  { name: "TOROX", color: "from-cyan-500/20 to-blue-600/20", border: "border-cyan-500/20" },
  { name: "AdGate Media", color: "from-amber-500/20 to-orange-600/20", border: "border-amber-500/20" },
  { name: "AdGem", color: "from-rose-500/20 to-red-600/20", border: "border-rose-500/20" },
  { name: "Lootably", color: "from-emerald-500/20 to-teal-600/20", border: "border-emerald-500/20" },
  { name: "TimeWall", color: "from-fuchsia-500/20 to-pink-600/20", border: "border-fuchsia-500/20" },
  { name: "Revenue Universe", color: "from-sky-500/20 to-cyan-600/20", border: "border-sky-500/20" },
  { name: "Ayet Studios", color: "from-teal-500/20 to-emerald-600/20", border: "border-teal-500/20" },
  { name: "Kiwi Wall", color: "from-lime-500/20 to-green-600/20", border: "border-lime-500/20" },
  { name: "Monlix", color: "from-orange-500/20 to-amber-600/20", border: "border-orange-500/20" },
  { name: "Wannads", color: "from-pink-500/20 to-rose-600/20", border: "border-pink-500/20" },
];

// ─── App Component ───────────────────────────────────────────────────────────

export default function App() {
  // ── Supabase Auth Session ──
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false); // prevent flash of unauthenticated UI

  // Derive correct level from balance_coins on every render
  const correctedProfile = useMemo(() => {
    if (!userProfile) return null;
    const correctLevel = calcLevel(userProfile.balance_coins);
    if (userProfile.level !== correctLevel) {
      return { ...userProfile, level: correctLevel };
    }
    return userProfile;
  }, [userProfile?.level, userProfile?.balance_coins]);
  const supabase = getSupabaseClient();

  const location = useLocation();
  const navigate = useNavigate();

  const PATH_TO_TAB: Record<string, string> = {
    '/': 'landing',
    '/earn': 'offers',
    '/surveys': 'surveys',
    '/withdraw': 'withdraw',
    '/rewards': 'rewards',
    '/leaderboard': 'leaderboard',
    '/profile': 'my-profile',
    '/settings': 'account-settings',
    '/security': 'security-settings',
    '/kyc': 'kyc-upload',
    '/referrals': 'affiliates',
  };
  const TAB_TO_PATH: Record<string, string> = {
    'offers': '/earn',
    'surveys': '/surveys',
    'withdraw': '/withdraw',
    'rewards': '/rewards',
    'leaderboard': '/leaderboard',
    'my-profile': '/profile',
    'account-settings': '/settings',
    'security-settings': '/security',
    'kyc-upload': '/kyc',
    'affiliates': '/referrals',
  };

  const [isDashboardView, setIsDashboardView] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("offers");

  const [simulationCountry, setSimulationCountry] = useState<string>("BD");

  // ── Level-up celebration ──
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(1);
  const prevLevelRef = useRef(0);
  const profileLoadedRef = useRef(false);

  // ── Reward popup queue ──
  const { popups: rewardPopups, addPopup, dismissPopup } = usePopupQueue();

  const usernameRef = useRef(userProfile?.username || "User");
  const userIdRef = useRef(userProfile?.id || "");

  useEffect(() => { usernameRef.current = userProfile?.username || "User"; }, [userProfile?.username]);
  useEffect(() => { userIdRef.current = userProfile?.id || ""; }, [userProfile?.id]);

  // ── Activity ticker ──
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [currentTickerIdx, setCurrentTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [tickerSettings, setTickerSettings] = useState(getTickerSettings());

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPABASE AUTH SESSION — Load existing session on mount & listen for changes
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!supabase) {
      setSessionLoaded(true);
      return;
    }

    let cancelled = false;

    // Debug: check localStorage for session
    const allKeys = Object.keys(window.localStorage).filter(k => k.startsWith("sb-"));
    console.log("[Auth] Supabase storage keys found:", allKeys.length);

    async function init() {
      try {
        // 1. Subscribe FIRST to catch all events (INITIAL_SESSION, SIGNED_IN, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("[Auth] onAuthStateChange event:", event, "user:", session?.user?.id);

          if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            if (session?.user) {
              const profile = await getProfile(session.user.id);
              if (profile) {
                const correctedLevel = calcLevel(profile.balance_coins);
                if (profile.level !== correctedLevel) {
                  profile.level = correctedLevel;
                }
                setUserProfile(profile);
                setIsDashboardView(true);
              }
            }
          } else if (event === "SIGNED_OUT") {
            console.log("[Auth] SIGNED_OUT received, clearing state");
            setUserProfile(null);
            setIsDashboardView(false);
            setNotifications([]);
          }
        });

        // 2. Read session from storage FIRST (fast, no network)
        const storedSession = await getCurrentSession();
        console.log("[Auth] Stored session:", !!storedSession, "expires:", storedSession?.expires_at);

        if (storedSession?.user) {
          // Try server validation
          let userProfile_data = null;
          try {
            const user = await getCurrentUser();
            console.log("[Auth] Server validation user:", !!user);
            if (user) {
              userProfile_data = await getProfile(user.id);
            }
          } catch (err) {
            console.warn("[Auth] Server validation failed, using stored session:", err);
          }

          // If server validation failed, try with stored session
          if (!userProfile_data) {
            console.log("[Auth] Falling back to stored session profile fetch");
            try {
              userProfile_data = await getProfile(storedSession.user.id);
            } catch (err) {
              console.warn("[Auth] Stored session profile fetch also failed:", err);
            }
          }

          if (userProfile_data && !cancelled) {
            console.log("[Auth] Restored profile:", userProfile_data.username, "admin:", userProfile_data.is_admin);
            // Normalise level from wallet balance immediately
            const correctedLevel = calcLevel(userProfile_data.balance_coins);
            if (userProfile_data.level !== correctedLevel) {
              userProfile_data = { ...userProfile_data, level: correctedLevel };
              updateProfile(userProfile_data.id, { level: correctedLevel }).catch(() => {});
            }
            setUserProfile(userProfile_data);
            setIsDashboardView(true);
          }
        }

        if (!cancelled) setSessionLoaded(true);

        // Cleanup function for subscription
        const cleanup = () => subscription?.unsubscribe();
        return cleanup;
      } catch (err) {
        console.error("[Auth] init error:", err);
        if (!cancelled) setSessionLoaded(true);
        return () => {};
      }
    }

    let cleanup: (() => void) | undefined;
    init().then(fn => { cleanup = fn; });

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [supabase]);

  // ── Level-up tracking ──
  useEffect(() => {
    if (userProfile && !profileLoadedRef.current) {
      profileLoadedRef.current = true;
      prevLevelRef.current = calcLevel(userProfile.balance_coins);
    }
  }, [userProfile]);

  // ── Recalculate level from wallet balance ──
  useEffect(() => {
    if (!userProfile) return;

    const correctLevel = calcLevel(userProfile.balance_coins);
    const needsLevelFix = userProfile.level !== correctLevel;

    if (needsLevelFix) {
      setUserProfile(prev => prev ? { ...prev, level: correctLevel } : prev);
      updateProfile(userProfile.id, { level: correctLevel }).catch(() => {});
    }
  }, [userProfile?.balance_coins]);

  // ── Sync URL to active tab ──
  useEffect(() => {
    if (isDashboardView && activeTab) {
      const path = TAB_TO_PATH[activeTab];
      if (path && window.location.pathname !== path) {
        navigate(path, { replace: true });
      }
    } else if (!isDashboardView && window.location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [isDashboardView, activeTab, navigate]);

  // ── React Router location change ──
  useEffect(() => {
    const path = location.pathname;
    const tab = PATH_TO_TAB[path];
    if (tab && tab !== 'landing' && userProfile) {
      setActiveTab(tab);
      setIsDashboardView(true);
    } else if (path === '/' && !userProfile) {
      setIsDashboardView(false);
    } else if (path === '/' && userProfile) {
      setIsDashboardView(true);
    } else if (!userProfile) {
      setIsDashboardView(false);
    }
  }, [location.pathname, userProfile]);

  // ── Withdrawals from Supabase ──
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  const loadWithdrawals = useCallback(async () => {
    if (!userProfile) return;
    try {
      const data = await getWithdrawals();
      setWithdrawals(data);
    } catch {}
  }, [userProfile?.id]);

  useEffect(() => {
    if (!userProfile) {
      setWithdrawals([]);
      return;
    }
    loadWithdrawals();
  }, [userProfile?.id, loadWithdrawals]);

  // Poll withdrawals for status changes (for cross-tab/localStorage sync)
  useEffect(() => {
    if (!userProfile) return;
    const interval = setInterval(() => {
      loadWithdrawals();
    }, 5000);
    return () => clearInterval(interval);
  }, [userProfile?.id, loadWithdrawals]);

  // Listen for custom withdrawal-status-changed event for instant updates
  useEffect(() => {
    const handler = () => loadWithdrawals();
    window.addEventListener("withdrawal-status-changed", handler);
    return () => window.removeEventListener("withdrawal-status-changed", handler);
  }, [loadWithdrawals]);

  // ── Activity feed (live earnings + demo data) ──
  const [liveEarnerFeed, setLiveEarnerFeed] = useState<Array<{ id: string; user: string; provider: string; coins: number }>>([]);

  // Build activityFeed from liveEarnerFeed + demo data + stored feed
  useEffect(() => {
    const live: ActivityFeedItem[] = liveEarnerFeed.map((item, i) => ({
      id: item.id,
      username: item.user,
      activityType: "earning" as const,
      provider: item.provider,
      coins: item.coins,
      message: "",
      createdAt: new Date(Date.now() - i * 10000).toISOString(),
    }));
    const stored = getStoredFeed();
    // Merge real feed with demos if we have fewer than 10 real entries
    const merged = live.length >= 5 ? live : mergeFeeds([...live, ...stored], getDemoFeed());
    const filtered = filterFeedBySettings(merged, tickerSettings);
    if (filtered.length > 0) {
      setActivityFeed(filtered);
    }
  }, [liveEarnerFeed, tickerSettings]);

  useEffect(() => {
    if (!supabase) return;

    const loadFeed = async () => {
      try {
        const { data, error } = await supabase
          .from("live_earnings")
          .select("username, provider, coins_earned, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.warn("Live earnings feed unavailable:", error.message);
          return;
        }

        if (data && data.length > 0) {
          setLiveEarnerFeed(data.map((item: any, idx: number) => ({
            id: `fe-${idx}`,
            user: item.username,
            provider: item.provider,
            coins: item.coins_earned,
          })));
        }
      } catch { /* silently ignore */ }
    };

    loadFeed();

    const channel = supabase.channel("live_earnings_changes")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "live_earnings" },
        (payload: any) => {
          const item = payload.new;
          const newEntry: ActivityFeedItem = {
            id: `act-${Date.now()}`,
            username: item.username,
            activityType: "earning",
            provider: item.provider,
            coins: item.coins_earned,
            message: "",
            createdAt: new Date().toISOString(),
          };
          setLiveEarnerFeed(prev => [
            { id: `fe-${Date.now()}`, user: item.username, provider: item.provider, coins: item.coins_earned },
            ...prev.slice(0, 9)
          ]);
          // Also broadcast to stored feed
          setActivityFeed(prev => {
            const updated = filterFeedBySettings([newEntry, ...prev], tickerSettings);
            saveFeed(updated);
            return updated;
          });
        }
      )
      .subscribe((status: string) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Live earnings realtime unavailable:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, tickerSettings]);

  // ── Realtime notification subscriptions ──
  useEffect(() => {
    if (!userProfile?.id || !supabase) return;

    const cleanup = realtimeManager.subscribe(`app-notifs-${userProfile.id}`, {
      table: "notifications",
      event: "INSERT",
      filter: `user_id=eq.${userProfile.id}`,
      callback: (payload) => {
        const n = payload.new as any;
        setNotifications(prev => {
          const mapped: AppNotification = {
            id: n.id,
            title: n.title,
            description: n.message || n.description,
            time: n.created_at,
            category: n.category || "system",
            unread: !n.is_read,
            coinsEarned: n.coins_earned,
            sourceName: n.source_name,
          };
          return [mapped, ...prev.slice(0, 49)];
        });
        playNotificationSound();
        if (n.coins_earned > 0) {
          playCoinSound();
          addPopup({
            id: `rp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sourceName: n.source_name || "Admin",
            coins: n.coins_earned,
            message: n.title + (n.message ? ` – ${n.message}` : ""),
          });
        }
        // Track this ID so the localStorage poll doesn't double-fire sound+popup
        prevNotifIdsRef.current = new Set(prevNotifIdsRef.current).add(n.id);
      },
    });

    return () => {
      realtimeManager.unsubscribe(`app-notifs-${userProfile.id}`);
      cleanup();
    };
  }, [userProfile?.id, supabase]);

  // ── Realtime profile sync ──
  useEffect(() => {
    if (!userProfile?.id || !supabase) return;

    const cleanup = realtimeManager.subscribe(`app-profile-${userProfile.id}`, {
      table: "profiles",
      event: "UPDATE",
      filter: `id=eq.${userProfile.id}`,
      callback: (payload) => {
        const updated = payload.new as any;
        setUserProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            balance_coins: updated.balance_coins ?? prev.balance_coins,
            balance_usd: updated.balance_usd ?? (updated.balance_coins ?? prev.balance_coins) / 1000,
            total_earned_coins: updated.total_earned_coins ?? prev.total_earned_coins,
            level: updated.level ?? prev.level,
            xp: updated.xp ?? prev.xp,
            kyc_status: updated.kyc_status ?? prev.kyc_status,
            vpn_detected: updated.vpn_detected ?? prev.vpn_detected,
            is_banned: updated.is_banned ?? prev.is_banned,
          };
        });
      },
    });

    return () => {
      realtimeManager.unsubscribe(`app-profile-${userProfile.id}`);
      cleanup();
    };
  }, [userProfile?.id, supabase]);

  // ── Realtime withdrawal sync ──
  useEffect(() => {
    if (!supabase) return;
    // Subscribe to all withdrawal changes so both admin and user panels update
    const cleanup = realtimeManager.subscribe("app-withdrawals", {
      table: "withdrawals",
      event: "UPDATE",
      callback: () => {
        loadWithdrawals();
      },
    });
    return () => {
      realtimeManager.unsubscribe("app-withdrawals");
      cleanup();
    };
  }, [supabase, loadWithdrawals]);

  // ── Notifications from Supabase + localStorage ──
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const prevNotifIdsRef = useRef<Set<string>>(new Set());

  // One-time cleanup: Remove ALL stale broadcast/announcement notifications from localStorage.
  // Announcements display ONLY in the EarnPage AnnouncementPromoSection — never in the
  // notification dropdown. This cleans up any previously-broadcast notification records.
  useEffect(() => {
    try {
      const stored: any[] = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
      if (Array.isArray(stored)) {
        const cleaned = stored.filter((n: any) => {
          // Remove any notification with announcement/promo titles — these should never
          // appear in the notification dropdown. Announcements live on the Earn page only.
          const title = (n.title || "").trim();
          const isAnnouncementNotif = title === "📢 Announcement" || title === "🎉 Promo Event";
          return !isAnnouncementNotif;
        });
        if (cleaned.length < stored.length) {
          localStorage.setItem("coinloot_notifications", JSON.stringify(cleaned));
        }
      }
    } catch {}
  }, []);

  const loadNotifications = useCallback(() => {
    if (!userProfile) {
      setNotifications([]);
      return;
    }
    getNotifications(userProfile.id).then((data) => {
      const mapped: AppNotification[] = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.message || n.description,
        time: n.created_at || n.time,
        category: n.category || n.notification_type || "system",
        unread: n.unread !== undefined ? n.unread : !n.is_read,
        coinsEarned: n.coinsEarned ?? n.coins_earned,
        sourceName: n.sourceName || n.source_name,
      }));

      // Merge in locally-stored notifications (from offer completions etc.)
      // so they survive the poll cycle even if they haven't been saved to Supabase yet
      try {
        const stored = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
        if (Array.isArray(stored) && stored.length > 0) {
          const existingIds = new Set(mapped.map((m) => m.id));
          for (const n of stored) {
            if (n.id && !existingIds.has(n.id) && (!n.user_id || n.user_id === userProfile.id)) {
              mapped.push({
                id: n.id,
                title: n.title || "",
                description: n.description || "",
                time: n.time || new Date().toISOString(),
                category: n.category || "system",
                unread: n.unread !== false,
                coinsEarned: n.coinsEarned ?? undefined,
                sourceName: n.sourceName || undefined,
              });
              existingIds.add(n.id);
            }
          }
          mapped.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        }
      } catch {}

      // Detect new coin notifications for sound + popup
      const currentIds = new Set(mapped.map((n) => n.id));
      const prevIds = prevNotifIdsRef.current;
      if (prevIds.size > 0) {
        for (const notif of mapped) {
          if (!prevIds.has(notif.id) && (notif.coinsEarned ?? 0) > 0) {
            playCoinSound();
            addPopup({
              id: `rp-n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              sourceName: notif.sourceName || "Admin",
              coins: notif.coinsEarned ?? 0,
              message: notif.title + (notif.description ? ` – ${notif.description}` : ""),
            });
            break; // one popup per poll cycle
          }
        }
      }
      prevNotifIdsRef.current = currentIds;

      setNotifications(mapped);
    }).catch(() => {});
  }, [userProfile?.id, addPopup]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Poll localStorage for new notifications (for demo/localStorage users without Supabase realtime)
  useEffect(() => {
    if (!userProfile) return;
    const interval = setInterval(() => {
      loadNotifications();
    }, 3000);
    return () => clearInterval(interval);
  }, [userProfile?.id, loadNotifications]);

  const addNotification = useCallback((title: string, description: string, category: AppNotification["category"], coinsEarned?: number, sourceName?: string) => {
    const newNotif: AppNotification = {
      id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      description,
      time: new Date().toISOString(),
      category,
      unread: true,
      coinsEarned,
      sourceName,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);

    // Persist to localStorage so polling doesn't lose it
    try {
      const stored = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
      if (Array.isArray(stored)) {
        const merged = [{ ...newNotif, user_id: userIdRef.current }, ...stored.filter((n: any) => n.id !== newNotif.id)].slice(0, 50);
        localStorage.setItem("coinloot_notifications", JSON.stringify(merged));
      }
    } catch {}

    playNotificationSound();
  }, []);

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    markNotificationRead(id).catch(() => {});
    try {
      const stored = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
      if (Array.isArray(stored)) {
        const updated = stored.map((n: any) =>
          n.id === id ? { ...n, unread: false, is_read: true } : n
        );
        localStorage.setItem("coinloot_notifications", JSON.stringify(updated));
      }
    } catch {}
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => {
      const unreadIds = prev.filter((n) => n.unread).map((n) => n.id);
      for (const id of unreadIds) {
        markNotificationRead(id).catch(() => {});
      }
      return prev.map((n) => ({ ...n, unread: false }));
    });
    try {
      const stored = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
      if (Array.isArray(stored)) {
        const updated = stored.map((n: any) => ({ ...n, unread: false, is_read: true }));
        localStorage.setItem("coinloot_notifications", JSON.stringify(updated));
      }
    } catch {}
  }, []);

  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;

  // ── Centralized Reward Handler (single source of truth for coins, level, xp) ──
  const handleRewardEarned = useCallback(async (coins: number, sourceName: string, message?: string, xpGained?: number) => {
    if (coins <= 0) return;
    const profile = userProfileRef.current;
    if (!profile || profile?.status === "restricted" || profile?.status === "banned") return;

    const finalMessage = message || `You earned ${coins.toLocaleString()} coins from ${sourceName}.`;

    try {
      // 1. Persist to Supabase FIRST: profile + coin_transactions + earnings_history + live_earnings
      const result = await addCoins(
        profile.id,
        coins,
        "EARNING",
        sourceName,
        finalMessage
      );

      if (!result) {
        console.error("[handleRewardEarned] addCoins returned null — DB write failed, reward NOT applied");
        return;
      }

      const { newBalance, newTotalEarned } = result;
      const newLevel = calcLevel(newTotalEarned);
      const newXp = xpGained ? (profile.xp || 0) + xpGained : (profile.xp || 0);

      // Notify admin of significant earnings
      if (coins >= 100) {
        try {
          const { createAdminNotification } = await import("./utils/adminNotifier");
          createAdminNotification("high_value_reward", "🏆 Offer Completed", `User: ${profile.username}\nProvider: ${sourceName}\nCoins: ${coins.toLocaleString()}${xpGained ? `\nXP: +${xpGained}` : ""}`, profile.id, profile.username, { related_id: "", coins, sourceName });
        } catch {}
      }

      // 2. Also persist XP to DB (addCoins doesn't handle XP)
      if (xpGained) {
        try {
          await updateProfile(profile.id, { xp: newXp });
        } catch (xpErr) {
          console.error("[handleRewardEarned] Failed to persist XP:", xpErr);
        }
      }

      // 3. Update local React state AFTER successful DB update
      setUserProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          balance_coins: newBalance,
          balance_usd: newBalance / 1000,
          total_earned_coins: newTotalEarned,
          level: newLevel,
          xp: newXp,
        };
      });

      // 4. Sound + notification ONLY after successful wallet update
      playCoinSound();
      addNotification(
        `${coins.toLocaleString()} Coins Earned!`,
        finalMessage,
        "credit",
        coins,
        sourceName
      );

      // 5. Level-up check
      const oldLevel = prevLevelRef.current;
      if (newLevel > oldLevel) {
        setLevelUpLevel(newLevel);
        setShowLevelUp(true);
        prevLevelRef.current = newLevel;
      }

      // 6. Update live feed
      setLiveEarnerFeed(prev => [
        { id: `fe-${Math.random()}`, user: usernameRef.current, provider: sourceName, coins },
        ...prev.slice(0, 9)
      ]);
      const newAct: ActivityFeedItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username: usernameRef.current,
        activityType: "earning",
        provider: sourceName,
        coins,
        message: "",
        createdAt: new Date().toISOString(),
      };
      setActivityFeed(prev => {
        const updated = filterFeedBySettings([newAct, ...prev], tickerSettings);
        saveFeed(updated);
        return updated;
      });

    } catch (err) {
      console.error("[handleRewardEarned] Failed to process reward:", err);
      // NOTIFICATION IS NOT SHOWN — wallet update failed, so we don't deceive the user
    }
  }, [setUserProfile, addNotification, supabase, tickerSettings]);

  // ── Rotate activity ticker ──
  useEffect(() => {
    if (activityFeed.length === 0) return;
    const speed = getSpeedMs(tickerSettings.speed);
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setCurrentTickerIdx(prev => (prev + 1) % activityFeed.length);
        setTickerVisible(true);
      }, 400);
    }, speed);
    return () => clearInterval(interval);
  }, [activityFeed.length, tickerSettings.speed]);

  useEffect(() => {
    if (activityFeed.length > 0 && currentTickerIdx >= activityFeed.length) {
      setCurrentTickerIdx(0);
    }
  }, [activityFeed.length]);

  // ── VPN Detection ──
  const vpnDetectedRef = useRef(false);
  const [vpnBlocked, setVpnBlocked] = useState(false);
  const [lastVpnResult, setLastVpnResult] = useState<VpnCheckResult | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    // Admin accounts completely bypass VPN checking
    if (userProfile.role === 'admin') return;

    let mounted = true;
    const runVpnCheck = async () => {
      const result = await checkVpnStatus();
      if (!mounted || !userProfile) return;

      if (result.isVpn || result.isProxy || result.isTor || result.isHosting) {
        setLastVpnResult(result);
        setVpnBlocked(true);

        if (!vpnDetectedRef.current) {
          vpnDetectedRef.current = true;

          logDetection(userProfile.id, userProfile.username, result, userProfile.email);

          setUserProfile((prev) => {
            if (!prev) return prev;
            return { ...prev, vpn_detected: true };
          });

          updateProfile(userProfile.id, { vpn_detected: true }).catch(() => {});

          const settings = getVpnSettings();
          if (settings.vpnWarning) {
            addNotification(
              "VPN/Proxy Detected!",
              "Our system detected a VPN, proxy, or TOR connection. Please disable it immediately to continue using the platform.",
              "security"
            );
          }

          // Notify admin panel
          notifyVpnDetection(
            userProfile.id,
            userProfile.username,
            userProfile.email,
            result.ip,
            result.country,
            result.detectionType,
            result.fraudScore,
            result.isp
          );

          // Check auto-restriction rules
          if (checkAutoRestrict(userProfile.id, userProfile.username)) {
            addNotification(
              "Account Restricted",
              "Your account has been automatically restricted due to multiple VPN/proxy detections.",
              "system"
            );
          }
        }
      } else {
        setVpnBlocked(false);
        vpnDetectedRef.current = false;
      }
    };

    runVpnCheck();
    const interval = setInterval(runVpnCheck, 30 * 1000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") runVpnCheck();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userProfile?.id, addNotification]);

  // ── Restriction check (syncs userProfile.status with restriction engine) ──
  const isRestricted = userProfile?.status === "restricted" || userProfile?.status === "banned";
  const [restrictionRemaining, setRestrictionRemaining] = useState("");

  useEffect(() => {
    if (!userProfile) return;
    const check = () => {
      const result = isUserRestricted(userProfile.id);
      // Sync profile status if engine disagrees with profile
      const engineStatus = result.restricted ? "restricted" : "active";
      if (userProfile.status !== engineStatus) {
        setUserProfile(prev => prev ? { ...prev, status: engineStatus as "active" | "restricted" | "banned" } : prev);
      }
      if (result.restricted) {
        setRestrictionRemaining(result.remaining);
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [userProfile?.id]);

  // ── Redirect non-admin away from admin-panel ──
  useEffect(() => {
    if (activeTab === "admin-panel" && userProfile && !userProfile.is_admin) {
      setActiveTab("offers");
    }
  }, [activeTab, userProfile]);

  const handleAddNewWithdrawalRequest = useCallback(async (req: WithdrawalRequest) => {
    if (userProfile?.status === "restricted" || userProfile?.status === "banned") return;
    setWithdrawals(prev => [req, ...prev]);
    addNotification("Withdrawal Requested", `${req.usd_value.toFixed(2)} USD withdrawal via ${req.payout_method.toUpperCase()} is pending review.`, "system");
    // Persist to Supabase
    try {
      if (userProfile) {
        await createWithdrawal(
          userProfile.id,
          userProfile.username,
          req.payout_method,
          req.reward_name,
          req.payout_details,
          req.coins_deducted,
          req.usd_value
        );
      }
    } catch (err) {
      console.error("Failed to persist withdrawal:", err);
    }
    // Persist to localStorage so admin panel sees it
    try {
      const existing = JSON.parse(localStorage.getItem("coinloot_withdrawals_v3") || "[]");
      existing.unshift(req);
      localStorage.setItem("coinloot_withdrawals_v3", JSON.stringify(existing));
    } catch {}
  }, [addNotification, userProfile]);

  // Auth handlers
  const handleLogin = useCallback((profile: UserProfile) => {
    const correctedLevel = calcLevel(profile.balance_coins);
    if (profile.level !== correctedLevel) {
      profile = { ...profile, level: correctedLevel };
    }
    setUserProfile(profile);
    setIsDashboardView(true);
    setActiveTab("offers");
  }, []);

  const handleOpenAuth = () => setIsAuthModalOpen(true);
  const handleCloseAuth = () => setIsAuthModalOpen(false);

  const handleGoToDashboard = () => {
    setIsDashboardView(true);
    setActiveTab("offers");
  };

  const handleGoHome = () => setIsDashboardView(false);

  const handleLogout = async () => {
    setUserProfile(null);
    setIsDashboardView(false);
    setNotifications([]);
    setWithdrawals([]);
    try {
      await supabaseSignOut();
    } catch { /* */ }
    navigate('/', { replace: true });
  };

  const handleOpenProfile = () => {
    setIsDashboardView(true);
    setActiveTab("my-profile");
  };

  // ── Preload provider logos ──
  useEffect(() => {
    preloadProviderLogos();
  }, []);

  // ── Theme & Language ──
  useEffect(() => {
    const savedPrefs = loadPreferences();
    const theme = userProfile?.preference_theme || savedPrefs.theme;
    const language = userProfile?.preference_language || savedPrefs.language;
    applyTheme(theme);
    applyLanguage(language);
    if (theme === "system") {
      return listenForSystemTheme();
    }
  }, [userProfile?.id, userProfile?.preference_theme, userProfile?.preference_language]);

  const [openFaqCategory, setOpenFaqCategory] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<{ category: string; index: number } | null>(null);

  // ─── Don't render until session is loaded ─────────────────────────────────
  if (!sessionLoaded) {
    return (
      <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader size="lg" text="Loading" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppRealtimeProvider>
      <div className="relative overflow-x-hidden w-full min-h-screen text-slate-100 flex flex-col font-sans transition-all selection:bg-cyan-500/20 selection:text-cyan-200 bg-slate-950">
      <AnimatedBackground />
      <DeveloperModeBanner />
      <Navbar
        user={correctedProfile}
        onOpenAuth={handleOpenAuth}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllRead}
        onOpenProfile={handleOpenProfile}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1">
        {/* ═══════ LANDING PAGE ═══════ */}
        {!isDashboardView && (
          <div className="animate-fade-in">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden px-4 lg:px-8 pt-16 lg:pt-24 pb-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/3 via-purple-500/3 to-transparent blur-[120px] rounded-full pointer-events-none" />
              <div className="flex-1 text-center lg:text-left space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full backdrop-blur-md group/tag">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-mono tracking-widest text-emerald-300 font-semibold uppercase leading-none">
                    Premium GPT & Offerwall Platform
                  </span>
                </div>
                <h1 className="font-sans font-extrabold text-3xl xs:text-4xl sm:text-5xl lg:text-7xl text-white tracking-tight leading-[1.1]">
                  Earn Real Money<br />
                  <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                    Completing Tasks
                  </span>
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm lg:text-base max-w-xl leading-relaxed mx-auto lg:mx-0">
                  Complete surveys, try apps, and shop online to earn cash, crypto, and gift cards. Get paid instantly via PayPal, Binance, USDT, and more.
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                  <button
                    onClick={handleOpenAuth}
                    className="group relative px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 overflow-hidden min-h-[48px] w-full sm:w-auto justify-center"
                  >
                    <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <LogIn className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Get Started — It's Free</span>
                  </button>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 font-mono">
                    <div className="flex -space-x-2">
                      {["👤", "👩", "🧑", "👨"].map((a, i) => (
                        <span key={i} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] sm:text-xs">{a}</span>
                      ))}
                    </div>
                    <span><span className="text-emerald-400 font-bold">Real users</span> earning daily</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full flex items-center justify-center relative">
                <Globe3D />
              </div>
            </section>

            {/* ── How It Works ── */}
            <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-16 lg:mb-20">
              <div className="text-center mb-8 lg:mb-12">
                <h2 className="font-sans font-bold text-2xl lg:text-4xl text-white tracking-tight">
                  How It Works
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 lg:mt-3 max-w-lg mx-auto">
                  Start earning in three simple steps. No special skills required.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
                {[
                  { step: "01", title: "Create Account", desc: "Sign up for free in seconds. No credit card needed. Just your email and a username to get started.", icon: "📝", color: "from-cyan-500/10 to-blue-600/5", border: "border-cyan-500/20" },
                  { step: "02", title: "Complete Offers & Surveys", desc: "Browse hundreds of high-paying offers from trusted providers. Answer surveys, try apps, or shop online.", icon: "🎯", color: "from-purple-500/10 to-pink-600/5", border: "border-purple-500/20" },
                  { step: "03", title: "Withdraw Your Earnings", desc: "Cash out your coins via PayPal, Binance Pay, USDT, Bitcoin, gift cards, and more. Instant payouts available.", icon: "💰", color: "from-emerald-500/10 to-teal-600/5", border: "border-emerald-500/20" },
                ].map((item, idx) => (
                  <div key={idx} className={`relative p-6 lg:p-8 rounded-3xl bg-gradient-to-br ${item.color} border ${item.border} hover:border-opacity-50 transition-all duration-300 group`}>
                    <div className="absolute top-4 right-4 font-mono font-extrabold text-5xl opacity-5 group-hover:opacity-10 transition-opacity text-cyan-400">
                      {item.step}
                    </div>
                    <span className="text-4xl block mb-5">{item.icon}</span>
                    <h3 className="font-sans font-bold text-lg text-white tracking-wide mb-3">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Featured Offerwalls ── */}
            <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20">
              <div className="text-center mb-10">
                <h2 className="font-sans font-bold text-3xl lg:text-4xl text-white tracking-tight">
                  Trusted Offerwall Providers
                </h2>
                <p className="text-slate-400 text-sm mt-3 max-w-lg mx-auto">
                  We partner with the top offerwalls to bring you the highest payouts.
                </p>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-hide">
                {OFFERWALL_PROVIDERS.map((p, i) => (
                  <div key={i} className={`p-4 rounded-2xl bg-gradient-to-br ${p.color} border ${p.border} text-center transition-all hover:scale-[1.03] duration-300 cursor-default snap-start shrink-0 w-[130px]`}>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-5 h-5 text-white/70" />
                    </div>
                    <span className="block text-xs font-semibold text-white">{p.name}</span>
                    <span className="block text-[9px] text-slate-400 font-mono mt-1">Offerwall</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Why Choose CoinLoot ── */}
            <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20">
              <div className="text-center mb-10">
                <h2 className="font-sans font-bold text-2xl lg:text-4xl text-white tracking-tight">
                  Why Choose CoinLoot
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-lg mx-auto">
                  What makes us the preferred choice for thousands of earners worldwide.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {[
                  { title: "Fast Withdrawals", desc: "Instant payouts to crypto wallets. No waiting days for your hard-earned money.", icon: "⚡", border: "border-cyan-500/20", hover: "hover:border-cyan-500/40" },
                  { title: "Trusted Platform", desc: "Thousands of satisfied earners worldwide. Secure and reliable payouts.", icon: "🛡️", border: "border-emerald-500/20", hover: "hover:border-emerald-500/40" },
                  { title: "Multiple Offerwalls", desc: "Access 9+ premium offerwall providers. More options means more earning potential.", icon: "📊", border: "border-purple-500/20", hover: "hover:border-purple-500/40" },
                  { title: "Global Availability", desc: "Available worldwide. Geo-targeted offers ensure you always have tasks.", icon: "🌍", border: "border-amber-500/20", hover: "hover:border-amber-500/40" },
                  { title: "Anti-Fraud Protection", desc: "Advanced security systems protect your account and ensure fair earnings for everyone.", icon: "🔒", border: "border-rose-500/20", hover: "hover:border-rose-500/40" },
                ].map((item, i) => (
                  <div key={i} className={`p-5 lg:p-6 rounded-2xl bg-slate-950/40 border ${item.border} ${item.hover} transition-all duration-300 group`}>
                    <span className="text-3xl block mb-4">{item.icon}</span>
                    <h3 className="font-sans font-bold text-sm text-white tracking-wide mb-2 group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Payment Methods ── */}
            <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20">
              <div className="text-center mb-10">
                <h2 className="font-sans font-bold text-3xl lg:text-4xl text-white tracking-tight">
                  Withdraw Your Way
                </h2>
                <p className="text-slate-400 text-sm mt-3 max-w-lg mx-auto">
                  Choose from 7+ payout methods. Instant withdrawals to crypto and e-wallets.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {PAYMENT_METHODS.map((pm, i) => (
                  <div key={i} className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all duration-300 flex items-center gap-2 sm:gap-3 cursor-default group">
                    <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform">{pm.icon}</span>
                    <div>
                      <span className="block text-[11px] sm:text-xs font-semibold text-white">{pm.name}</span>
                      <span className="block text-[8px] sm:text-[9px] text-slate-500 font-mono">{pm.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Recent Withdrawals (Live from Supabase) ── */}
            <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-20">
              <div className="glass rounded-3xl p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/3 blur-[80px] rounded-full pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
                  <div>
                    <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Recent Withdrawals
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Live withdrawals processed on our platform.</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-mono text-[9px] border border-emerald-500/20 uppercase font-bold">
                    ⚫ REAL DATA
                  </span>
                </div>
                <div className="space-y-3">
                  {withdrawals.filter(w => w.status === "APPROVED" || w.status === "PAID").slice(0, 6).length > 0 ? (
                    withdrawals.filter(w => w.status === "APPROVED" || w.status === "PAID").slice(0, 6).map((wd, i) => (
                      <div key={wd.id} className="p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl flex items-center justify-between gap-4 font-mono text-xs hover:border-emerald-500/10 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-600/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                            {wd.username[0]}
                          </span>
                          <div className="min-w-0">
                            <span className="font-sans font-semibold text-slate-200 block truncate">{wd.username}</span>
                            <span className="text-[9px] text-slate-500 block">{new Date(wd.created_at).toLocaleDateString()} via {wd.reward_name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-emerald-400">${wd.usd_value.toFixed(2)}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${wd.status === "PAID" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-amber-500/10 text-amber-400 border border-amber-500/15"}`}>
                            {wd.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 text-[10px] font-mono py-6">
                      No withdrawals yet. Be the first!
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── Frequently Asked Questions ── */}
            <section className="max-w-4xl mx-auto px-4 lg:px-8 mb-20">
              <div className="text-center mb-10">
                <h2 className="font-sans font-bold text-3xl lg:text-4xl text-white tracking-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-slate-400 text-sm mt-3 max-w-lg mx-auto">
                  Everything you need to know about earning and withdrawing on CoinLoot.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  {
                    category: "Earnings",
                    items: [
                      { q: "How much can I earn on CoinLoot?", a: "Earnings vary based on your location and effort. Top users earn $200+ per week by completing surveys, offers, and using the referral system. Most users earn $20-50 per week casually." },
                      { q: "How are coins converted to real money?", a: "1,000 Coins = $1.00 USD. Your earnings accumulate in your account and can be withdrawn once you reach the minimum threshold for your chosen payment method." },
                      { q: "Is there a limit on how much I can earn?", a: "There's no upper limit! Complete as many offers and surveys as you want. Higher levels unlock better-paying opportunities and bonuses." },
                    ]
                  },
                  {
                    category: "Withdrawals",
                    items: [
                      { q: "How long do withdrawals take?", a: "Cryptocurrency withdrawals (USDT, Binance Pay) are processed instantly. PayPal and Skrill typically clear within 24 hours. Bank transfers take 2-3 business days." },
                      { q: "What is the minimum withdrawal amount?", a: "Minimum withdrawal is 1,000 Coins ($1.00 USD) for most methods. Some methods like bank transfer require higher minimums." },
                      { q: "Are there any withdrawal fees?", a: "No! CoinLoot charges zero fees on all withdrawals. You receive the full amount you request." },
                    ]
                  },
                  {
                    category: "Offer Completion",
                    items: [
                      { q: "Why didn't I receive coins for completing an offer?", a: "Most issues are caused by ad blockers, VPNs, or not completing all required steps. Try disabling ad blockers and ensure you've fully completed the offer requirements." },
                      { q: "How long does it take for offers to credit?", a: "Most offers credit instantly or within a few minutes. Some high-value offers may take up to 24 hours to verify and credit." },
                      { q: "Can I use multiple devices for offers?", a: "Yes, but you must be logged into the same account. Complete offers on desktop, tablet, or mobile — they all count toward your balance." },
                    ]
                  },
                  {
                    category: "VPN Policy",
                    items: [
                      { q: "Is using a VPN allowed on CoinLoot?", a: "No. VPNs, proxies, and TOR are strictly forbidden. Our security system detects VPN usage, which will result in account suspension." },
                      { q: "Why does CoinLoot block VPNs?", a: "Our offer partners require accurate geographic targeting. VPNs misrepresent your location, which violates our agreements with providers and can result in revoked offers." },
                      { q: "What happens if I'm caught using a VPN?", a: "First violation results in a warning and temporary hold. Repeated violations lead to permanent account suspension and forfeiture of all earnings." },
                    ]
                  }
                ].map((category, catIdx) => (
                  <div key={catIdx} className="glass rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaqCategory(openFaqCategory === category.category ? null : category.category)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left transition-all hover:bg-white/[0.02]"
                    >
                      <span className="font-sans font-bold text-sm text-white">{category.category}</span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openFaqCategory === category.category ? "rotate-90" : ""}`} />
                    </button>
                    {openFaqCategory === category.category && (
                      <div className="border-t border-white/5 animate-fade-in">
                        {category.items.map((faq, faqIdx) => {
                          const isOpen = openFaqIndex?.category === category.category && openFaqIndex?.index === faqIdx;
                          return (
                            <div key={faqIdx} className="border-b border-white/5 last:border-b-0">
                              <button
                                onClick={() => setOpenFaqIndex(isOpen ? null : { category: category.category, index: faqIdx })}
                                className="w-full px-5 py-3.5 flex items-center justify-between text-left transition-all hover:bg-white/[0.02]"
                              >
                                <span className="text-xs text-slate-300 font-medium pr-4">{faq.q}</span>
                                <span className={`text-[10px] text-cyan-400 font-mono shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                              </button>
                              {isOpen && (
                                <div className="px-5 pb-4 animate-fade-in">
                                  <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="max-w-7xl mx-auto px-4 lg:px-8 mb-16 lg:mb-20">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent border border-cyan-500/10 p-6 sm:p-8 lg:p-12 text-center">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/5 to-transparent blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="font-sans font-bold text-xl sm:text-2xl lg:text-4xl text-white tracking-tight mb-3 lg:mb-4">
                    Ready to Start Earning?
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mb-5 lg:mb-6">
                    Sign up free and get started today.
                  </p>
                  <button
                    onClick={handleOpenAuth}
                    className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-95 transition-all min-h-[48px]"
                  >
                    <LogIn className="w-4 h-4" />
                    Create Free Account
                  </button>
                </div>
              </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-white/5 px-4 lg:px-8 pt-12 pb-8">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-white/5">
                  <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                        <span className="text-white font-bold text-xs">CL</span>
                      </div>
                      <span className="font-sans font-bold text-sm text-white">CoinLoot</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                      Premium GPT and offerwall platform. Earn real money completing surveys, offers, and tasks. Trusted by thousands worldwide.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider mb-4">About</h4>
                    <ul className="space-y-2.5">
                      {["About Us", "How It Works", "Blog", "Careers"].map((link, i) => (
                        <li key={i}><a href="#" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">{link}</a></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider mb-4">Support</h4>
                    <ul className="space-y-2.5">
                      {["Help Center", "Contact Us", "Community", "FAQ"].map((link, i) => (
                        <li key={i}><a href="#" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">{link}</a></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider mb-4">Legal</h4>
                    <ul className="space-y-2.5">
                      {["Privacy Policy", "Terms of Service", "Cookie Policy", "Earnings Disclaimer"].map((link, i) => (
                        <li key={i}><a href="#" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">{link}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[10px] font-mono text-slate-500">
                  <span>&copy; 2026-2027 CoinLoot Inc. All rights reserved.</span>
                  <div className="flex gap-4 items-center">
                    <button onClick={handleOpenAuth} className="hover:text-cyan-400 transition-colors cursor-pointer">Admin</button>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> SSL Secured</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 256-bit Encrypted</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        )}

        {/* ═══════ LIVE ACTIVITY TICKER (vertical smooth rotation) ═══════ */}
        {isDashboardView && userProfile && activeTab !== "admin-panel" && (
          <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl px-3 sm:px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="py-2 overflow-hidden relative" style={{ minHeight: "2rem" }}>
                {activityFeed.length > 0 ? (
                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 relative">
                    {/* Live dot */}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 relative z-10" />
                    {/* Ticker item with vertical slide transition */}
                    <div className="relative overflow-hidden" style={{ height: "1.25rem" }}>
                      <div
                        className={`transition-all duration-[400ms] ease-in-out ${
                          tickerVisible
                            ? "translate-y-0 opacity-100"
                            : "translate-y-3 opacity-0"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-[10px] sm:text-xs">
                          <span>{activityFeed[currentTickerIdx].username === usernameRef.current ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-sans shrink-0">
                              YOU
                            </span>
                          ) : (
                            <span className="font-sans font-semibold text-slate-300">
                              {activityFeed[currentTickerIdx].username.slice(0, 1)}***
                              {activityFeed[currentTickerIdx].username.slice(-1)}
                            </span>
                          )}</span>
                          {activityFeed[currentTickerIdx].activityType === "earning" && (
                            <>
                              <span className="text-slate-500">earned</span>
                              <span className="font-bold text-emerald-400">
                                {activityFeed[currentTickerIdx].coins.toLocaleString()} coins
                              </span>
                              {activityFeed[currentTickerIdx].provider && (
                                <><span className="text-slate-500">from</span>
                                <span className="text-purple-300">{activityFeed[currentTickerIdx].provider}</span></>
                              )}
                            </>
                          )}
                          {activityFeed[currentTickerIdx].activityType === "withdrawal" && (
                            <>
                              <span className="text-slate-500">withdrew</span>
                              <span className="font-bold text-amber-400">
                                {activityFeed[currentTickerIdx].coins.toLocaleString()} coins
                              </span>
                              {activityFeed[currentTickerIdx].provider && (
                                <><span className="text-slate-500">via</span>
                                <span className="text-purple-300">{activityFeed[currentTickerIdx].provider}</span></>
                              )}
                            </>
                          )}
                          {activityFeed[currentTickerIdx].activityType === "bonus" && (
                            <>
                              <span className="text-slate-500">received</span>
                              <span className="font-bold text-purple-400">
                                {activityFeed[currentTickerIdx].coins.toLocaleString()} bonus coins
                              </span>
                            </>
                          )}
                          {activityFeed[currentTickerIdx].activityType === "referral" && (
                            <>
                              <span className="text-slate-500">earned</span>
                              <span className="font-bold text-cyan-400">
                                {activityFeed[currentTickerIdx].coins.toLocaleString()} coins
                              </span>
                              <span className="text-slate-500">from referral</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center sm:justify-start">
                    <Loader size="xs" text="Live feed loading" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ DASHBOARD VIEW ═══════ */}
        {isDashboardView && userProfile && (
          <div className={activeTab === "admin-panel" ? "pb-0" : "animate-fade-in pb-24 lg:pb-8"}>
            {activeTab === "admin-panel" && userProfile?.is_admin ? (
              <AdminDashboardPanel user={correctedProfile} onRewardEarned={handleRewardEarned} onBack={() => setActiveTab("offers")} />
            ) : isRestricted && (activeTab === "offers" || activeTab === "withdraw" || activeTab === "rewards" || activeTab === "kyc-upload" || activeTab === "affiliates") ? (
              <div className="max-w-lg mx-auto mt-12 text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-rose-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Feature Unavailable</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  This feature is not available while your account is restricted.
                  Please contact support if you believe this is a mistake.
                </p>
              </div>
            ) : (
              <>
                {activeTab === "offers" && (
                  <EarnPage user={correctedProfile} setUser={setUserProfile} onRewardEarned={handleRewardEarned} simulationCountry={simulationCountry} />
                )}
                {activeTab === "withdraw" && (
                  <WithdrawHub user={correctedProfile} setUser={setUserProfile} withdrawals={withdrawals} onAddWithdrawal={handleAddNewWithdrawalRequest} />
                )}
                {activeTab === "rewards" && (
                  <RewardsStore user={correctedProfile} setUser={setUserProfile} onRewardEarned={handleRewardEarned} />
                )}
                {activeTab === "kyc-upload" && (
                  <KycUploadPage user={correctedProfile} setUser={setUserProfile} />
                )}
                {activeTab === "affiliates" && (
                  <ReferralsAffiliates user={correctedProfile} />
                )}
              </>
            )}
              {activeTab === "support-ticket" && (
                <SupportTicket user={correctedProfile} setUser={setUserProfile} />
              )}
              {activeTab === "my-profile" && (
                <MyProfilePage user={correctedProfile} />
              )}
              {activeTab === "account-settings" && (
                <AccountSettingsPage user={correctedProfile} setUser={setUserProfile} simulationCountry={simulationCountry} setSimulationCountry={setSimulationCountry} />
              )}
              {activeTab === "security-settings" && (
                <SecuritySettingsPage user={correctedProfile} setUser={setUserProfile} />
              )}
              {activeTab === "leaderboard" && (
                <LeaderboardPodium />
              )}
          </div>
        )}
      </main>

      <LevelUpCelebration show={showLevelUp} level={levelUpLevel} onDismiss={() => setShowLevelUp(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuth} onLogin={handleLogin} />
      {userProfile && (
        <RestrictionPage
          userId={userProfile.id}
          onLogout={handleLogout}
          onContactSupport={() => { setActiveTab("support-ticket"); setIsDashboardView(true); }}
        />
      )}
      {vpnBlocked && lastVpnResult && <VpnBlockPopup result={lastVpnResult} onRetry={() => { const run = async () => { const r = await checkVpnStatus(); setVpnBlocked(r.isVpn); setLastVpnResult(r); }; run(); }} onRefresh={() => window.location.reload()} />}

      <RewardPopup popups={rewardPopups} onDismiss={dismissPopup} />

      {/* ═══════ MOBILE BOTTOM TAB BAR ═══════ */}
      {isDashboardView && userProfile && setActiveTab && activeTab !== "admin-panel" && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-slate-950/95 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
          <div className="grid grid-cols-5 items-center px-1 pt-1 pb-1.5">
            <button
              onClick={() => setActiveTab("support-ticket")}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200 min-w-0 min-h-[48px] ${
                activeTab === "support-ticket" ? "text-cyan-400" : "text-slate-500 hover:text-slate-300 active:text-slate-200"
              }`}
            >
              <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${activeTab === "support-ticket" ? "bg-cyan-500/10" : ""}`}>
                <MessageSquare className={`w-5 h-5 ${activeTab === "support-ticket" ? "text-cyan-400" : ""}`} />
                {activeTab === "support-ticket" && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${activeTab === "support-ticket" ? "text-cyan-400" : "text-slate-500"}`}>Support</span>
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200 min-w-0 min-h-[48px] ${
                activeTab === "withdraw" ? "text-cyan-400" : "text-slate-500 hover:text-slate-300 active:text-slate-200"
              }`}
            >
              <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${activeTab === "withdraw" ? "bg-cyan-500/10" : ""}`}>
                <Wallet className={`w-5 h-5 ${activeTab === "withdraw" ? "text-cyan-400" : ""}`} />
                {activeTab === "withdraw" && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${activeTab === "withdraw" ? "text-cyan-400" : "text-slate-500"}`}>Withdraw</span>
            </button>
            <div className="flex justify-center -mt-3">
              <button
                onClick={() => setActiveTab("offers")}
                className="flex flex-col items-center justify-center gap-0.5 transition-all duration-200 min-w-0"
              >
                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-[0_0_20px_rgba(6,182,212,0.35)] -translate-y-1">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold tracking-wide text-cyan-400">Earn</span>
              </button>
            </div>
            <button
              onClick={() => setActiveTab("rewards")}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200 min-w-0 min-h-[48px] ${
                activeTab === "rewards" ? "text-cyan-400" : "text-slate-500 hover:text-slate-300 active:text-slate-200"
              }`}
            >
              <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${activeTab === "rewards" ? "bg-cyan-500/10" : ""}`}>
                <Gift className={`w-5 h-5 ${activeTab === "rewards" ? "text-cyan-400" : ""}`} />
                {activeTab === "rewards" && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${activeTab === "rewards" ? "text-cyan-400" : "text-slate-500"}`}>Rewards</span>
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200 min-w-0 min-h-[48px] ${
                activeTab === "leaderboard" ? "text-cyan-400" : "text-slate-500 hover:text-slate-300 active:text-slate-200"
              }`}
            >
              <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${activeTab === "leaderboard" ? "bg-cyan-500/10" : ""}`}>
                <Trophy className={`w-5 h-5 ${activeTab === "leaderboard" ? "text-cyan-400" : ""}`} />
                {activeTab === "leaderboard" && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${activeTab === "leaderboard" ? "text-cyan-400" : "text-slate-500"}`}>Leaderboard</span>
            </button>
          </div>
        </nav>
      )}
      </div>
    </AppRealtimeProvider>
  );
}
