import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, Users, Zap, Wallet, DollarSign, Bell, Gift, Link2,
  BarChart3, ShieldAlert, Settings, LogOut, Search, ChevronDown, Lock,
  Coins, Award, Activity, Globe, Server, Menu, X, User as UserIcon,
  PanelRightClose, PanelRight, RefreshCw, ShieldCheck, ChevronLeft,
  MessageSquare, UserPlus, ExternalLink, Check,
} from "lucide-react";
import { UserProfile } from "../types";
import { AppNotification } from "./Navbar";
import AdminPanel from "./AdminPanel";
import { getUnreadAdminCount, getPendingAdminNotifications, markAdminRead, markAllAdminRead, markAsDone, onAdminNotifChange, AdminNotification } from "../utils/adminNotifier";

interface AdminLayoutProps {
  user: UserProfile;
  onRewardEarned: (coins: number, sourceName: string, message?: string) => void;
  onLogout: () => void;
  notifications: AppNotification[];
}

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number;
  children?: { id: string; label: string; badge?: string | number }[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "offerwalls", label: "Offerwalls", icon: Zap },
  { id: "offers", label: "Offers", icon: Activity },
  { id: "locked-offers", label: "Lock Rules", icon: Lock },
  { id: "locked-offers-management", label: "Offerwall Mgt", icon: ShieldCheck },
  { id: "locked-offers-promos", label: "Lock Promos", icon: Gift },
  { id: "coins", label: "Coins & Rewards", icon: Coins },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "promos", label: "Promo Codes", icon: Gift },
  { id: "referrals", label: "Referrals", icon: Link2 },
  { id: "tickets", label: "Tickets", icon: MessageSquare },
  { id: "homepage", label: "Homepage", icon: Globe },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "rewards-challenges", label: "Rewards & Challenges", icon: Award },
  { id: "kyc", label: "KYC", icon: ShieldCheck },
  { id: "database", label: "Database", icon: Server },
  { id: "security", label: "Security", icon: ShieldAlert },
  { id: "settings", label: "Settings", icon: Settings },
];

function AdminHeader({ user, onLogout, userNotifs, onSectionChange }: { user: UserProfile; onLogout: () => void; userNotifs: AppNotification[]; onSectionChange?: (id: string) => void }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const pendingNotifs = getPendingAdminNotifications();
  const badgeCount = userNotifs.filter((n) => n.unread).length + getUnreadAdminCount();

  useEffect(() => {
    const unsub = onAdminNotifChange(() => setRefreshKey(k => k + 1));
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => { unsub(); document.removeEventListener("mousedown", handleClick); };
  }, []);

  // Force re-render when dropdown opens to get fresh data
  useEffect(() => { if (showNotifDropdown) setRefreshKey(k => k + 1); }, [showNotifDropdown]);

  const notifIcon = (type: string) => {
    switch (type) {
      case "new_user": return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case "withdrawal_request": return <ExternalLink className="w-4 h-4 text-amber-400" />;
      default: return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  const notifBg = (type: string) => {
    switch (type) {
      case "new_user": return "bg-emerald-500/10 border-emerald-500/20";
      case "withdrawal_request": return "bg-amber-500/10 border-amber-500/20";
      default: return "bg-purple-500/10 border-purple-500/20";
    }
  };

  const handleMarkAsDone = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsDone(id);
  };

  return (
    <header className="h-14 lg:h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <Server className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
        </div>
        <div className="hidden sm:block">
          <span className="font-sans font-bold text-sm text-white">CoinLoot</span>
          <span className="text-[8px] font-mono text-slate-500 block leading-none">Control Center</span>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input placeholder="Quick search..." className="w-36 lg:w-48 bg-slate-900/60 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 lg:py-2 text-[10px] font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20 transition-all" />
        </div>

        <div ref={notifRef} className="relative">
          <button onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowProfileMenu(false); }} className="p-2 rounded-xl bg-slate-900/40 border border-white/5 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 transition-all relative cursor-pointer">
            <Bell className="w-3.5 h-3.5" />
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 font-mono text-[8px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-white/5 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="font-bold text-xs text-white">Admin Notifications</span>
                {pendingNotifs.length > 0 && (
                  <button onClick={() => { markAllAdminRead(); }} className="text-[9px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Mark all done</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {pendingNotifs.length === 0 ? (
                  <div className="p-8 text-center text-[10px] text-slate-500 font-mono">No admin notifications yet</div>
                ) : (
                  pendingNotifs.slice(0, 20).map((n: AdminNotification) => (
                    <div key={n.id} className={`relative pl-3 pr-2 py-3 border-b border-white/[0.04] last:border-b-0 transition-all duration-200 flex gap-3 group ${
                      n.status === "pending" && !n.is_read
                        ? "bg-cyan-500/[0.06] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-gradient-to-b before:from-cyan-400 before:to-purple-500 before:rounded-r"
                        : "hover:bg-white/[0.04]"
                    }`}>
                      <div className={`w-8 h-8 rounded-xl ${notifBg(n.type)} flex items-center justify-center shrink-0`}>
                        {notifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[11px] font-bold block leading-snug ${n.status === "pending" && !n.is_read ? "text-white" : "text-slate-200"}`}>{n.title}</span>
                          {n.status === "pending" && !n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />}
                        </div>
                        <p className={`text-[9px] leading-relaxed mt-0.5 ${n.status === "pending" && !n.is_read ? "text-slate-300" : "text-slate-400"}`}>{n.message}</p>
                        <span className="text-[7px] text-slate-600 font-mono mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <button onClick={(e) => handleMarkAsDone(e, n.id)} className="shrink-0 self-center p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 opacity-0 group-hover:opacity-100 hover:bg-emerald-500/20 transition-all cursor-pointer" title="Mark as Done">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="px-3 py-2.5 border-t border-white/5">
                <button onClick={() => { setShowNotifDropdown(false); onSectionChange?.("notifications"); }} className="w-full text-center text-[9px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">View all in notifications panel</button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifDropdown(false); }} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/40 border border-white/5 hover:border-purple-500/30 transition-all">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-[9px] overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        user.username[0].toUpperCase()
                      )}
                    </div>
            <span className="hidden lg:block text-[10px] font-semibold text-white">{user.username}</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-[10px] overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      user.username[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-white">{user.username}</span>
                    <span className="block text-[9px] text-slate-400 font-mono">{user.email}</span>
                  </div>
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 text-[8px] font-bold bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20">ADMIN</span>
              </div>
              <div className="p-2">
                <button onClick={onLogout} className="w-full px-3 py-2.5 rounded-xl text-xs text-left text-rose-400 hover:bg-rose-500/5 transition-all flex items-center gap-2.5">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function AdminSidebar({ activeSection, onSectionChange, collapsed, onToggle, onMobileClose }: {
  activeSection: string; onSectionChange: (id: string) => void; collapsed: boolean; onToggle?: () => void; onMobileClose?: () => void;
}) {
  const isActive = (id: string) => activeSection === id;

  const handleClick = (id: string) => {
    onSectionChange(id);
    onMobileClose?.();
  };

  return (
    <aside className={`h-screen bg-slate-950/95 border-r border-white/5 flex flex-col transition-all duration-300 z-40 ${collapsed ? "w-[72px]" : "w-[280px]"}`}>
      {/* Header */}
      <div className={`h-14 lg:h-16 flex items-center border-b border-white/5 ${collapsed ? "justify-center px-0" : "justify-between px-4"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-sans font-bold text-xs text-white tracking-wider">ADMIN</span>
          </div>
        )}
        {onToggle && (
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-thin">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const itemActive = isActive(item.id);

          if (collapsed) {
            return (
              <div key={item.id} className="relative group">
                <button onClick={() => handleClick(item.id)}
                  className="w-full flex items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer">
                  <Icon className={`w-4 h-4 ${itemActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                  {itemActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.5)]" />}
                </button>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-white font-semibold whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-xl">
                  {item.label}
                </div>
              </div>
            );
          }

          return (
            <button key={item.id} onClick={() => handleClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${itemActive ? "bg-gradient-to-r from-cyan-500/10 to-purple-600/5 border border-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent"}`}>
              <Icon className={`w-4 h-4 shrink-0 ${itemActive ? "text-cyan-400" : "text-slate-500"}`} />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-white/5 px-4 py-3">
          <div className="flex items-center gap-2 text-[8px] font-mono text-slate-600">
            <RefreshCw className="w-2.5 h-2.5" />
            Live · v3.0
          </div>
        </div>
      )}
    </aside>
  );
}

export default function AdminLayout({ user, onRewardEarned, onLogout, notifications }: AdminLayoutProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("coinloot_sidebar_collapsed") === "true";
    } catch { return false; }
  });

  useEffect(() => {
    try {
      localStorage.setItem("coinloot_sidebar_collapsed", String(sidebarCollapsed));
    } catch { /* */ }
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Mobile hamburger */}
      <button onClick={() => setMobileSidebarOpen(true)} className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-lg bg-slate-900/80 border border-white/10 backdrop-blur-xl text-slate-400 cursor-pointer">
        <Menu className="w-4 h-4" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="w-[280px] h-full bg-slate-950 border-r border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between h-14 px-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-sans font-bold text-xs text-white tracking-wider">ADMIN</span>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} collapsed={false} onMobileClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader user={user} onLogout={onLogout} userNotifs={notifications} onSectionChange={setActiveSection} />
        <div className="flex-1 overflow-y-auto">
          <AdminPanel user={user} onRewardEarned={onRewardEarned} activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>
      </div>
    </div>
  );
}
