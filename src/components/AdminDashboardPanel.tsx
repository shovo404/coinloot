import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, ShieldCheck, RefreshCw, ArrowLeft
} from "lucide-react";
import { UserProfile } from "../types";
import { AppNotification } from "./Navbar";
import AdminPanel from "./AdminPanel";
import { SIDEBAR_ITEMS } from "./AdminLayout";

interface AdminDashboardPanelProps {
  user: UserProfile;
  onRewardEarned: (coins: number, sourceName: string, message?: string, xpGained?: number) => void;
  onBack: () => void;
}

export default function AdminDashboardPanel({ user, onRewardEarned, onBack }: AdminDashboardPanelProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("coinloot_sidebar_collapsed") === "true"; } catch { return false; }
  });

  const isActive = (id: string) => activeSection === id;

  useEffect(() => {
    try { localStorage.setItem("coinloot_sidebar_collapsed", String(sidebarCollapsed)); } catch { }
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-950 overflow-hidden rounded-2xl border border-white/5">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-slate-950/95 border-r border-white/5 transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[240px]"}`}>
        {/* Header */}
        <div className={`h-14 flex items-center border-b border-white/5 ${sidebarCollapsed ? "justify-center px-0" : "justify-between px-4"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-sans font-bold text-xs text-white tracking-wider">ADMIN</span>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-thin">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const itemActive = isActive(item.id);

            if (sidebarCollapsed) {
              return (
                <div key={item.id} className="relative group">
                  <button onClick={() => setActiveSection(item.id)}
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
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all cursor-pointer ${itemActive ? "bg-gradient-to-r from-cyan-500/10 to-purple-600/5 border border-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent"}`}>
                <Icon className={`w-4 h-4 shrink-0 ${itemActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="border-t border-white/5 px-4 py-3">
            <div className="flex items-center gap-2 text-[8px] font-mono text-slate-600">
              <RefreshCw className="w-2.5 h-2.5" />
              Live · v3.0
            </div>
          </div>
        )}
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="h-14 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-semibold">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-500">Admin Control Panel</span>
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto">
          <AdminPanel user={user} onRewardEarned={onRewardEarned} activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>
      </div>
    </div>
  );
}
