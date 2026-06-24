import { useState, useRef, useEffect } from "react";
import { Coins, LogIn, ShieldAlert, ShieldCheck, Award, Bell, User, Fingerprint, CheckCircle, AlertTriangle, Settings, LogOut, UserCog, Menu, X, Zap, Wallet, Trophy, Gift, ClipboardCheck, Users, MessageSquare } from "lucide-react";
import { UserProfile } from "../types";
import { getProviderInfo } from "../utils/providerLogos";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  category: "credit" | "system" | "security";
  unread: boolean;
  coinsEarned?: number;
  sourceName?: string;
  sourceLogo?: string;
}

interface NavbarProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Navbar({
  user,
  onOpenAuth,
  notifications,
  onMarkNotificationRead,
  onMarkAllRead,
  onOpenProfile,
  onLogout,
  activeTab,
  setActiveTab,
}: NavbarProps) {
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const securityRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileMobileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close dropdowns on outside click (supports both mouse and touch)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        securityRef.current && !securityRef.current.contains(target) &&
        notifRef.current && !notifRef.current.contains(target) &&
        profileRef.current && !profileRef.current.contains(target) &&
        profileMobileRef.current && !profileMobileRef.current.contains(target) &&
        mobileNotifRef.current && !mobileNotifRef.current.contains(target) &&
        mobileMenuRef.current && !mobileMenuRef.current.contains(target)
      ) {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Close mobile menu on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  // Close dropdowns when activeTab changes (e.g. mobile bottom nav navigation)
  useEffect(() => {
    setOpenDropdown(null);
  }, [activeTab]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const timeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const dashboardTabs = [
    { id: "support-ticket", label: "Support Ticket", icon: MessageSquare },
    { id: "withdraw", label: "Withdraw", icon: Wallet },
    { id: "offers", label: "Earn", icon: Zap },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const handleMobileNav = (tabId: string) => {
    if (setActiveTab) setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 glass px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-h-[44px]">
        {/* Branding */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-transform group-hover:scale-105">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400 opacity-0 group-hover:opacity-20 blur-md transition-opacity" />
          </div>
          <div className="hidden sm:block">
            <span className="font-sans font-bold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
              COIN LOOT
            </span>
            <span className="block text-[7px] sm:text-[9px] font-mono tracking-[2px] sm:tracking-[4px] text-purple-400 font-semibold uppercase leading-none mt-0.5">
              V3 PLATFORM
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) — centered between logo and right widgets */}
        {user && setActiveTab && (
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1 mx-2 xl:mx-4">
            {[
              { id: "support-ticket", label: "Support Ticket", icon: MessageSquare },
              { id: "withdraw", label: "Withdraw", icon: Wallet },
              { id: "offers", label: "Earn", icon: Zap },
              { id: "rewards", label: "Rewards", icon: Gift },
              { id: "leaderboard", label: "Leaderboard", icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); }}
                  className={`relative flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-bold tracking-wider whitespace-nowrap transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/15 to-purple-600/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                      : "text-slate-500 border border-transparent hover:text-slate-200 hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-all ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                  <span className="hidden xl:inline">{tab.label}</span>
                </button>
              );
            })}

          </div>
        )}

        {/* Right Section */}
        {user ? (
          <>
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {/* ── Security Status ── */}
              <div ref={securityRef} className="relative">
                <button
                  onClick={() => toggleDropdown("security")}
                  className={`p-2 rounded-lg border transition-all relative min-h-[36px] min-w-[36px] flex items-center justify-center ${
                    openDropdown === "security"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-900/40 border-white/5 text-slate-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400"
                  }`}
                  title="Security Status"
                >
                  <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                </button>

                {/* Security Dropdown */}
                {openDropdown === "security" && (
                  <div className="absolute right-0 top-full mt-2 w-72 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-zoom-in z-50">
                    <div className="p-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-sans font-semibold text-sm text-white">Account Security</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-400" /> KYC Status</span>
                        <span className={`font-bold ${user.kyc_status === "APPROVED" ? "text-emerald-400" : user.kyc_status === "PENDING" ? "text-amber-400" : "text-slate-400"}`}>{user.kyc_status}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5"><Fingerprint className="w-3 h-3 text-cyan-400" /> Device Fingerprint</span>
                        <span className="text-white truncate max-w-[140px]" title={user.device_fingerprint}>{user.device_fingerprint.slice(0, 16)}...</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-amber-400" /> VPN Detection</span>
                        <span className={user.vpn_detected ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{user.vpn_detected ? "DETECTED" : "CLEAN"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-400" /> Account Status</span>
                        <span className="text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                    </div>
                    {user.kyc_status !== "APPROVED" && (
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => setActiveTab?.("kyc-upload")}
                          className="w-full py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold text-[10px] hover:bg-cyan-500/20 transition-all cursor-pointer"
                        >
                          Complete KYC Verification
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Coin + USD Balance ── */}
              <div className="bg-slate-900/60 border border-white/5 rounded-xl pl-2 lg:pl-3 pr-2 lg:pr-4 py-1 flex items-center gap-1.5 lg:gap-3 hover:border-cyan-500/20 hover:bg-slate-900/80 transition-all cursor-default">
                <div className="flex items-center gap-1">
                  <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 animate-spin [animation-duration:12s]" />
                  <span className="font-mono text-xs lg:text-sm font-semibold text-white tracking-tight">{user.balance_coins.toLocaleString()}</span>
                </div>
                <div className="h-3 w-[1px] bg-white/10 hidden xs:block" />
                <span className="font-mono text-[10px] lg:text-xs text-slate-400 hidden xs:block">${user.balance_usd.toFixed(2)}</span>
              </div>

              {/* ── Level Badge ── */}
              <div className="hidden lg:flex items-center gap-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl px-2.5 py-1.5">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-mono text-purple-300 font-bold uppercase">LVL {user.level}</span>
              </div>

              {/* ── Notifications ── */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => toggleDropdown("notifications")}
                  className={`p-2 rounded-xl border transition-all relative min-h-[36px] min-w-[36px] flex items-center justify-center ${
                    openDropdown === "notifications"
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                      : "bg-slate-900/40 border-white/5 hover:bg-slate-900/80 text-white"
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 font-mono text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center animate-bounce px-1">{unreadCount}</span>
                  )}
                </button>
              </div>

              {/* ── User Profile ── */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => toggleDropdown("profile")}
                  className={`p-0.5 rounded-xl border transition-all flex items-center justify-center min-h-[36px] min-w-[36px] overflow-hidden ${
                    openDropdown === "profile"
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                      : "bg-slate-900/40 border-white/5 text-slate-400 hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-400"
                  }`}
                  title={user.username}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-lg object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center gap-1 sm:gap-2">
              {/* Coin balance (compact) */}
              <div className="bg-slate-900/60 border border-white/5 rounded-xl px-2 py-1.5 flex items-center gap-1 min-h-[36px]">
                <Coins className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-[11px] font-bold text-white">{user.balance_coins.toLocaleString()}</span>
              </div>

              {/* Level badge (compact) */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl px-2 py-1.5 min-h-[36px]">
                <Award className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] font-mono text-purple-300 font-bold uppercase">LVL {user.level}</span>
              </div>

              {/* Notifications Bell */}
              <div ref={mobileNotifRef} className="relative">
                <button
                  onClick={() => toggleDropdown("notifications")}
                  className={`p-2.5 rounded-xl border transition-all relative min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    openDropdown === "notifications"
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                      : "bg-slate-900/40 border-white/5 hover:bg-slate-900/80 text-white"
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 font-mono text-[8px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
              </div>

              {/* Profile Icon — opens dropdown on mobile */}
              <div ref={profileMobileRef} className="relative">
                <button
                  onClick={() => toggleDropdown("profile")}
                  className={`p-0.5 rounded-xl border transition-all flex items-center justify-center min-h-[44px] min-w-[44px] overflow-hidden ${
                    openDropdown === "profile"
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                      : "bg-slate-900/40 border-white/5 text-slate-400 hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-400"
                  }`}
                  title={user.username}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-[36px] h-[36px] rounded-[10px] object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Hamburger — for dashboard navigation menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl border border-white/5 bg-slate-900/40 text-white hover:bg-slate-900/80 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

            {/* Mobile Slide-in Menu */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 md:hidden">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                {/* Panel */}
                <div
                  ref={mobileMenuRef}
                  className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-slate-950 border-l border-white/5 shadow-2xl animate-slide-in-right overflow-y-auto"
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-9 h-9 rounded-xl object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">{user.username[0].toUpperCase()}</div>
                    )}
                    <div>
                      <span className="block text-sm font-semibold text-white">{user.username}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{user.email}</span>
                    </div>
                  </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all" aria-label="Close menu">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 p-4 border-b border-white/5">
                    <div className="bg-slate-900/60 p-3 rounded-xl text-center border border-white/5">
                      <Coins className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                      <span className="block text-xs font-bold text-white">{user.balance_coins.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Coins</span>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl text-center border border-white/5">
                      <Award className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                      <span className="block text-xs font-bold text-white">LVL {user.level}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Level</span>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl text-center border border-white/5">
                      <Bell className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                      <span className="block text-xs font-bold text-white">{unreadCount}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Unread</span>
                    </div>
                  </div>

                  {/* Dashboard Navigation */}
                  {setActiveTab && (
                    <div className="p-4 border-b border-white/5">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider block mb-3 px-1">Dashboard</span>
                      <div className="space-y-1">
                        {dashboardTabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => handleMobileNav(tab.id)}
                              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                                isActive
                                  ? "bg-gradient-to-r from-cyan-500/15 to-purple-600/15 border border-cyan-500/30 text-cyan-300"
                                  : "text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                              <span>{tab.label}</span>
                              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Security & Profile Actions */}
                  <div className="p-4 border-b border-white/5">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider block mb-3 px-1">Account</span>
                    <div className="space-y-1">
                      <button onClick={() => { setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Security Status</span>
                        <span className="ml-auto px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/20">{user.kyc_status}</span>
                      </button>
                      <button onClick={() => { onOpenProfile(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all">
                        <Settings className="w-4 h-4 text-purple-400" />
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>


                </div>
              </div>
            )}
          </>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 sm:px-5 py-2.5 sm:py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 animate-pulse min-h-[44px]"
          >
            <LogIn className="w-4 h-4" />
            <span>Get Started</span>
          </button>
        )}
      </div>

      {/* ===== Floating Dropdown Panels (rendered at root so visible on mobile) ===== */}

      {/* Notifications Dropdown */}
      {openDropdown === "notifications" && (
        <>
          {/* Mobile backdrop - covers below header only, so header buttons stay clickable */}
          <div className="fixed top-[66px] left-0 right-0 bottom-0 z-40 md:hidden" onClick={() => setOpenDropdown(null)} />
          <div className="absolute md:absolute right-2 md:right-0 top-full md:top-[70px] left-2 md:left-auto w-auto md:w-80 max-w-full md:max-w-[calc(100vw-1.5rem)] glass-notification rounded-2xl overflow-hidden animate-slide-up md:animate-zoom-in z-50 mobile-dropdown-panel">
          <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="font-sans font-bold text-sm text-white tracking-wide">Notifications</span>
            {unreadCount > 0 && <button onClick={onMarkAllRead} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">No notifications yet</div>
            ) : (
              notifications.map((notif) => {
                const pi = notif.sourceName ? getProviderInfo(notif.sourceName) : null;
                return (
                <div key={notif.id} onClick={() => onMarkNotificationRead(notif.id)} className={`relative pl-4 pr-4 py-3.5 border-b border-white/[0.04] last:border-b-0 cursor-pointer transition-all duration-200 flex gap-3 group ${
                  notif.unread
                    ? "bg-cyan-500/[0.06] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-gradient-to-b before:from-cyan-400 before:to-purple-500 before:rounded-r hover:bg-cyan-500/[0.10]"
                    : "hover:bg-white/[0.04]"
                }`}>
                  <div className="mt-0.5 shrink-0">
                    {pi ? (
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${pi.color} border ${pi.border} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-[10px]">{pi.initials}</span>
                      </div>
                    ) : notif.category === "credit" ? (
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-emerald-400" />
                      </div>
                    ) : notif.category === "security" ? (
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-bold block leading-snug ${notif.unread ? "text-white" : "text-slate-200"}`}>{notif.title}</span>
                      {notif.unread && <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />}
                    </div>
                    <p className={`text-[11px] leading-relaxed mt-1 ${notif.unread ? "text-slate-300" : "text-slate-400"}`}>{notif.description}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      {notif.coinsEarned ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-bold text-[9px] font-mono">
                          <Coins className="w-2.5 h-2.5" />
                          +{notif.coinsEarned.toLocaleString()}
                        </span>
                      ) : <span />}
                      <span className="text-[8px] text-slate-600 font-mono">{timeAgo(notif.time)}</span>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
        </>
      )}

      {/* Profile Dropdown */}
      {openDropdown === "profile" && (
        <>
          {/* Mobile backdrop - covers below header only, so header buttons stay clickable */}
          <div className="fixed top-[66px] left-0 right-0 bottom-0 z-40 md:hidden" onClick={() => setOpenDropdown(null)} />
          <div className="absolute md:absolute right-2 md:right-0 top-full md:top-[70px] left-2 md:left-auto w-auto md:w-56 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up md:animate-zoom-in z-50 mobile-dropdown-panel">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">{user.username[0].toUpperCase()}</div>
              )}
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-white truncate">{user.username}</span>
                <span className="block text-[10px] text-slate-400 font-mono truncate">{user.email}</span>
              </div>
            </div>
          </div>
          <div className="p-2 space-y-0.5">
            <button onClick={() => { setActiveTab?.("my-profile"); setOpenDropdown(null); }} className="w-full px-3 py-3 md:py-2.5 rounded-xl text-xs text-left text-slate-300 hover:bg-white/[0.03] hover:text-white transition-all flex items-center gap-2.5 min-h-[44px] md:min-h-0">
              <UserCog className="w-4 h-4 text-cyan-400" /> My Profile
            </button>
            <button onClick={() => { setActiveTab?.("account-settings"); setOpenDropdown(null); }} className="w-full px-3 py-3 md:py-2.5 rounded-xl text-xs text-left text-slate-300 hover:bg-white/[0.03] hover:text-white transition-all flex items-center gap-2.5 min-h-[44px] md:min-h-0">
              <Settings className="w-4 h-4 text-purple-400" /> Account Settings
            </button>
            <button onClick={() => { setActiveTab?.("security-settings"); setOpenDropdown(null); }} className="w-full px-3 py-3 md:py-2.5 rounded-xl text-xs text-left text-slate-300 hover:bg-white/[0.03] hover:text-white transition-all flex items-center gap-2.5 min-h-[44px] md:min-h-0">
              <ShieldAlert className="w-4 h-4 text-emerald-400" /> Security Settings
            </button>
            <button onClick={() => { toggleDropdown("notifications"); }} className="w-full px-3 py-3 md:py-2.5 rounded-xl text-xs text-left text-slate-300 hover:bg-white/[0.03] hover:text-white transition-all flex items-center gap-2.5 min-h-[44px] md:min-h-0">
              <Bell className="w-4 h-4 text-cyan-400" /> Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-cyan-500 text-slate-950 font-mono text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{unreadCount}</span>
              )}
            </button>
          </div>
          <div className="border-t border-white/5 p-2">
            <button onClick={() => { onLogout(); setOpenDropdown(null); }} className="w-full px-3 py-3 md:py-2.5 rounded-xl text-xs text-left text-rose-400 hover:bg-rose-500/5 transition-all flex items-center gap-2.5 min-h-[44px] md:min-h-0">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
        </>
      )}

    </header>
  );
}
