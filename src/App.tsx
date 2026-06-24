import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Zap, Users, ChevronRight, Wallet, Trophy, Gift, MessageSquare } from "lucide-react";
import { AppNotification } from "./components/Navbar";
import { playCoinSound, playNotificationSound } from "./utils/coinSound";
import RewardPopup, { usePopupQueue } from "./components/RewardPopup";
import LevelUpCelebration from "./components/LevelUpCelebration";
import KycUploadPage from "./components/KycUploadPage";
import { checkVpnStatus, isUserRestricted, logDetection, VpnCheckResult, getVpnSettings } from "./utils/vpnDetector";
import { calcLevelFromBalance } from "./utils/levelSystem";
import DeveloperModeBanner from "./components/DeveloperModeBanner";
import { getSupabaseClient, getCurrentSession, getCurrentUser } from "./lib/supabase";
import { getProfile, updateProfile, getWithdrawals, getNotifications, getAllProfiles, createWithdrawal, signOut as supabaseSignOut, getSiteSetting } from "./lib/supabaseService";
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
import OfferwallShowcase from "./components/OfferwallShowcase";
import AdminLayout from "./components/AdminLayout";
import VpnBlockPopup from "./components/VpnBlockPopup";
import RestrictionPage from "./components/RestrictionPage";
import SurveyHub from "./components/SurveyHub";
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
    '/admin': 'admin',
    '/admin/login': 'admin',
    '/admin/dashboard': 'admin',
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
    'admin': '/admin',
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
                setUserProfile(profile);
                setIsDashboardView(true);
                if (profile.is_admin) {
                  setActiveTab("admin");
                }
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
            setUserProfile(userProfile_data);
            setIsDashboardView(true);
            if (userProfile_data.is_admin) {
              setActiveTab("admin");
            }
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
      prevLevelRef.current = calcLevelFromBalance(userProfile.balance_coins);
    }
  }, [userProfile]);

  // ── Recalculate level from current balance ──
  useEffect(() => {
    if (!userProfile) return;
    const correctLevel = calcLevelFromBalance(userProfile.balance_coins);
    if (userProfile.level !== correctLevel) {
      setUserProfile(prev => prev ? { ...prev, level: correctLevel } : prev);
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

  useEffect(() => {
    if (!userProfile) {
      setWithdrawals([]);
      return;
    }
    getWithdrawals().then(setWithdrawals).catch(() => {});
  }, [userProfile?.id]);

  // ── Live earnings feed from Supabase ──
  const [liveEarnerFeed, setLiveEarnerFeed] = useState<Array<{ id: string; user: string; provider: string; coins: number }>>([]);

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

        if (data) {
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

    // Subscribe to new live earnings
    const channel = supabase.channel("live_earnings_changes")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "live_earnings" },
        (payload: any) => {
          const item = payload.new;
          setLiveEarnerFeed(prev => [
            { id: `fe-${Date.now()}`, user: item.username, provider: item.provider, coins: item.coins_earned },
            ...prev.slice(0, 9)
          ]);
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
  }, [supabase]);

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

  // ── Notifications from Supabase ──
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!userProfile) {
      setNotifications([]);
      return;
    }
    getNotifications(userProfile.id).then((data) => {
      const mapped: AppNotification[] = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.message || n.description,
        time: n.created_at,
        category: n.category || "system",
        unread: !n.is_read,
        coinsEarned: n.coins_earned,
        sourceName: n.source_name,
      }));
      setNotifications(mapped);
    }).catch(() => {});
  }, [userProfile?.id]);

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
    playNotificationSound();
  }, []);

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  // ── Centralized Reward Handler ──
  const handleRewardEarned = useCallback((coins: number, sourceName: string, message?: string) => {
    if (coins <= 0) return;

    const finalMessage = message || `You earned ${coins.toLocaleString()} coins from ${sourceName}.`;

    setUserProfile((prev) => {
      if (!prev) return prev;
      const newCoins = prev.balance_coins + coins;
      const newTotalEarned = prev.total_earned_coins + coins;
      return {
        ...prev,
        balance_coins: newCoins,
        balance_usd: newCoins / 1000,
        total_earned_coins: newTotalEarned,
        level: calcLevelFromBalance(newCoins),
      };
    });

    playCoinSound();

    addNotification(
      `${coins.toLocaleString()} Coins Earned!`,
      finalMessage,
      "credit",
      coins,
      sourceName
    );

    addPopup({
      id: `rp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sourceName,
      coins,
      message: finalMessage,
    });

    // Persist to Supabase
    if (userProfile) {
      updateProfile(userProfile.id, {
        balance_coins: (userProfile.balance_coins + coins),
        total_earned_coins: (userProfile.total_earned_coins + coins),
      }).catch(() => {});
    }

    // Level-up check
    const oldLevel = prevLevelRef.current;
    if (userProfile) {
      const newLevel = calcLevelFromBalance(userProfile.balance_coins + coins);
      if (newLevel > oldLevel) {
        setLevelUpLevel(newLevel);
        setShowLevelUp(true);
        prevLevelRef.current = newLevel;
      }
    }

    // Update live feed
    setLiveEarnerFeed(prev => [
      { id: `fe-${Math.random()}`, user: usernameRef.current, provider: sourceName, coins },
      ...prev.slice(0, 3)
    ]);


  }, [setUserProfile, addNotification, addPopup, userProfile, supabase]);

  // ── VPN Detection ──
  const vpnDetectedRef = useRef(false);
  const [vpnBlocked, setVpnBlocked] = useState(false);
  const [lastVpnResult, setLastVpnResult] = useState<VpnCheckResult | null>(null);

  useEffect(() => {
    if (!userProfile) return;

    let mounted = true;
    const runVpnCheck = async () => {
      const result = await checkVpnStatus();
      if (!mounted || !userProfile) return;

      if (result.isVpn) {
        setLastVpnResult(result);
        setVpnBlocked(true);

        if (!vpnDetectedRef.current) {
          vpnDetectedRef.current = true;

          logDetection(userProfile.id, userProfile.username, result);

          setUserProfile((prev) => {
            if (!prev) return prev;
            return { ...prev, vpn_detected: true };
          });

          updateProfile(userProfile.id, { vpn_detected: true }).catch(() => {});

          const settings = getVpnSettings();
          if (settings.vpnWarning) {
            addNotification(
              "VPN Detected!",
              "Our system detected a VPN or proxy connection. Please disable it immediately to continue using the platform.",
              "security"
            );
          }
        }
      } else {
        setVpnBlocked(false);
        vpnDetectedRef.current = false;
      }
    };

    runVpnCheck();
    const interval = setInterval(runVpnCheck, 5 * 60 * 1000);
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

  // ── Restriction check ──
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionRemaining, setRestrictionRemaining] = useState("");

  useEffect(() => {
    if (!userProfile) { setIsRestricted(false); return; }
    const check = () => {
      const result = isUserRestricted(userProfile.id);
      setIsRestricted(result.restricted);
      setRestrictionRemaining(result.remaining);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [userProfile?.id]);

  const handleAddNewWithdrawalRequest = useCallback(async (req: WithdrawalRequest) => {
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
  }, [addNotification, userProfile]);

  // Auth handlers
  const handleLogin = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setIsDashboardView(true);
    if (profile.is_admin) {
      setActiveTab("admin");
    } else {
      setActiveTab("offers");
    }
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-[10px] font-mono text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppRealtimeProvider>
      {userProfile && userProfile.is_admin && isDashboardView ? (
        <div className="relative w-full min-h-screen text-slate-100 font-sans bg-slate-950">
          <DeveloperModeBanner />
          <AdminLayout
            user={userProfile}
            onRewardEarned={handleRewardEarned}
            onLogout={handleLogout}
            notifications={notifications}
          />
          <LevelUpCelebration show={showLevelUp} level={levelUpLevel} onDismiss={() => setShowLevelUp(false)} />
          <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuth} onLogin={handleLogin} />
          {userProfile && <RestrictionPage userId={userProfile.id} />}
          {vpnBlocked && lastVpnResult && <VpnBlockPopup result={lastVpnResult} onRetry={() => { const run = async () => { const r = await checkVpnStatus(); setVpnBlocked(r.isVpn); setLastVpnResult(r); }; run(); }} onRefresh={() => window.location.reload()} />}
          <RewardPopup popups={rewardPopups} onDismiss={dismissPopup} />
        </div>
      ) : (
        <div className="relative overflow-x-hidden w-full min-h-screen text-slate-100 flex flex-col font-sans transition-all selection:bg-cyan-500/20 selection:text-cyan-200 bg-slate-950">
      <AnimatedBackground />
      <DeveloperModeBanner />
      <Navbar
        user={userProfile}
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

            {/* ── Premium Offerwall Showcase ── */}
            <OfferwallShowcase />

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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {OFFERWALL_PROVIDERS.map((p, i) => (
                  <div key={i} className={`p-4 rounded-2xl bg-gradient-to-br ${p.color} border ${p.border} text-center transition-all hover:scale-[1.03] duration-300 cursor-default`}>
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

        {/* ═══════ LIVE EARNINGS TICKER (shown in Dashboard) ═══════ */}
        {isDashboardView && userProfile && (
          <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl px-3 sm:px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="py-2 overflow-hidden relative group">
                <div className="flex items-center gap-3 animate-ticker hover:[animation-play-state:paused]">
                  {liveEarnerFeed.length > 0 ? (
                    [...liveEarnerFeed, ...liveEarnerFeed].map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="font-sans font-semibold text-slate-300 whitespace-nowrap">{item.user}</span>
                        <span className="text-slate-500 whitespace-nowrap">earned</span>
                        <span className="font-bold text-cyan-400 whitespace-nowrap">{item.coins.toLocaleString()} coins</span>
                        <span className="text-slate-500 whitespace-nowrap">from</span>
                        <span className="text-purple-300 whitespace-nowrap">{item.provider}</span>
                        <span className="mx-3 text-slate-600">•</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                      <span>Live feed loading...</span>
                    </div>
                  )}
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* ═══════ RESTRICTION BANNER ═══════ */}
        {isRestricted && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold text-rose-300">Account Restricted</span>
                  <span className="block text-[10px] text-rose-400/80 font-mono mt-0.5">
                    Your account has been temporarily restricted by the admin for security reasons. Remaining: {restrictionRemaining}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ DASHBOARD VIEW ═══════ */}
        {isDashboardView && userProfile && (
          <div className="animate-fade-in pb-24 lg:pb-8">
              {activeTab === "offers" && (
                <EarnPage user={userProfile} setUser={setUserProfile} onRewardEarned={handleRewardEarned} simulationCountry={simulationCountry} />
              )}
              {activeTab === "support-ticket" && (
                <SupportTicket user={userProfile} setUser={setUserProfile} />
              )}
              {activeTab === "withdraw" && (
                <WithdrawHub user={userProfile} setUser={setUserProfile} withdrawals={withdrawals} onAddWithdrawal={handleAddNewWithdrawalRequest} />
              )}
              {activeTab === "rewards" && (
                <RewardsStore user={userProfile} setUser={setUserProfile} onRewardEarned={handleRewardEarned} />
              )}
              {activeTab === "my-profile" && (
                <MyProfilePage user={userProfile} />
              )}
              {activeTab === "account-settings" && (
                <AccountSettingsPage user={userProfile} setUser={setUserProfile} simulationCountry={simulationCountry} setSimulationCountry={setSimulationCountry} />
              )}
              {activeTab === "security-settings" && (
                <SecuritySettingsPage user={userProfile} setUser={setUserProfile} />
              )}
              {activeTab === "kyc-upload" && (
                <KycUploadPage user={userProfile} setUser={setUserProfile} />
              )}
              {activeTab === "affiliates" && (
                <ReferralsAffiliates user={userProfile} />
              )}
              {activeTab === "leaderboard" && (
                <LeaderboardPodium />
              )}
          </div>
        )}
      </main>

      <LevelUpCelebration show={showLevelUp} level={levelUpLevel} onDismiss={() => setShowLevelUp(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuth} onLogin={handleLogin} />
      {userProfile && <RestrictionPage userId={userProfile.id} />}
      {vpnBlocked && lastVpnResult && <VpnBlockPopup result={lastVpnResult} onRetry={() => { const run = async () => { const r = await checkVpnStatus(); setVpnBlocked(r.isVpn); setLastVpnResult(r); }; run(); }} onRefresh={() => window.location.reload()} />}

      <RewardPopup popups={rewardPopups} onDismiss={dismissPopup} />

      {/* ═══════ MOBILE BOTTOM TAB BAR ═══════ */}
      {isDashboardView && userProfile && setActiveTab && (
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
      )}
    </AppRealtimeProvider>
  );
}
