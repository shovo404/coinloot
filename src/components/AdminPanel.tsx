import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard, Users, DollarSign, ShieldAlert, CheckCircle, XCircle, Search,
  Settings, Coins, BarChart3, TrendingUp, TrendingDown, Trophy,
  Activity, Globe, Lock, Unlock, Upload, Bell, Gift, Link2, Award, Flag, FileText,
  Crown, Flame, ClipboardCheck, ShieldCheck,
  UserCheck, UserX, Plus, Minus, Trash2, Edit, Send, Wallet, Zap, Clock, Server,
  Loader2, AlertTriangle, RefreshCw, Wifi, Eye, EyeOff, Copy, Ban, X,
  ChevronDown, ChevronUp, Filter, Download, Shield, Key, Percent,
  Calendar, UserPlus, ExternalLink, MoreHorizontal, HardDrive, Signal, Circle,
  Sun, Moon, List, LayoutGrid, ArrowUpRight, ArrowDownRight, Gauge, Mail, History,
  ArrowLeft, MessageSquare, ChevronRight, User,
  Megaphone, Database,
} from "lucide-react";
import { UserProfile, WithdrawalRequest, OfferwallConfig, PromoCode, AdminLog, SiteSettings, WithdrawalMethodConfig } from "../types";
import { Ticket } from "./SupportTicket";
import { playCoinSound } from "../utils/coinSound";
import { restrictUser, unRestrictUser, getRestrictedUsers, getDetectionHistory, getIpLogs, getRestrictionHistory, isUserRestricted, logRestrictionHistory, extendRestriction, clearDetectionLogs, VpnDetectionLog, RestrictionHistoryEntry, UserIpLog, getVpnSettings, saveVpnSettings, getUserIpLogs } from "../utils/vpnDetector";
import AdminLockedOfferwalls from "./AdminLockedOfferwalls";
import { getSupabaseClient } from "../lib/supabase";
import { realtimeManager } from "../lib/realtimeManager";
import * as AdminDb from "../lib/adminDb";
import { 
  getSocialBountyConfig, saveSocialBountyConfig, 
  getWeeklyChallengeConfig, saveWeeklyChallengeConfig, 
  resetSocialBountyToDefaults, resetWeeklyChallengeToDefaults,
  SocialBountyConfig, WeeklyChallengeConfig 
} from "../utils/rewardsConfig";

interface AdminPanelProps {
  user: UserProfile;
  onRewardEarned?: (coins: number, sourceName: string, message?: string) => void;
  activeSection?: string;
  onSectionChange?: (id: string) => void;
}

interface StoredAccount { email: string; password: string; username: string; profile: UserProfile; }

function PmEditModal({ data, onSave, onClose }: { data: WithdrawalMethodConfig; onSave: (d: WithdrawalMethodConfig) => void; onClose: () => void }) {
  const [name, setName] = useState(data.name);
  const [icon, setIcon] = useState(data.icon);
  const [minCoins, setMinCoins] = useState(data.minCoins);
  const [maxCoins, setMaxCoins] = useState(data.maxCoins);
  const [feePercent, setFeePercent] = useState(data.feePercent);
  const [apiConnected, setApiConnected] = useState(data.apiConnected);
  const [apiCredentials, setApiCredentials] = useState(data.apiCredentials);
  const [status, setStatus] = useState(data.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-lg w-full bg-slate-950 border border-white/10 rounded-3xl p-6 relative animate-zoom-in shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">{data.id ? "Edit Method" : "Add Method"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></div>
            <div><label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Icon (emoji)</label><input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Min Coins</label><input type="number" value={minCoins || ""} onChange={(e) => setMinCoins(e.target.value === "" ? 0 : parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></div>
            <div><label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Max Coins</label><input type="number" value={maxCoins || ""} onChange={(e) => setMaxCoins(e.target.value === "" ? 0 : parseInt(e.target.value) || 0)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></div>
            <div><label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Fee %</label><input type="number" step="0.1" value={feePercent} onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">API Credentials</label><input value={apiCredentials} onChange={(e) => setApiCredentials(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" placeholder="Optional" /></div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="apiConnected" checked={apiConnected} onChange={(e) => setApiConnected(e.target.checked)} className="accent-cyan-500" />
            <label htmlFor="apiConnected" className="text-[10px] text-slate-400 font-mono">API Connected</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => onSave({ id: data.id, name, icon, minCoins, maxCoins, feePercent, apiConnected, apiCredentials, status })} className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-bold hover:scale-[1.02] transition-all cursor-pointer">
              {data.id ? "Save Changes" : "Add Method"}
            </button>
            <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-slate-300 text-[10px] font-semibold hover:border-white/20 transition-all cursor-pointer">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    );
  }

function VpnControlCenter({ userId, username, profiles, onAction }: { userId: string; username: string; profiles: UserProfile[]; onAction: (msg: string) => void }) {
  const [detectionHistory, setDetectionHistory] = useState<VpnDetectionLog[]>([]);
  const [restrictionHistory, setRestrictionHistory] = useState<RestrictionHistoryEntry[]>([]);
  const [restrictedUsers, setRestrictedUsers] = useState<{userId: string; restrictedUntil: string; reason: string}[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(30);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [viewingRawResponse, setViewingRawResponse] = useState<VpnDetectionLog | null>(null);
  const [serverLogs, setServerLogs] = useState<VpnDetectionLog[]>([]);

  const loadData = () => {
    setDetectionHistory(getDetectionHistory());
    setRestrictionHistory(getRestrictionHistory());
    setRestrictedUsers(getRestrictedUsers());
    fetch("/api/vpn/logs").then((r) => r.json()).then((d) => { if (d.logs) setServerLogs(d.logs); }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const flaggedUsers = profiles.filter((p) => p.vpn_detected);

  const bannedUsers: string[] = [];
  try {
    const b = JSON.parse(localStorage.getItem("coinloot_banned_users") || "[]");
    if (Array.isArray(b)) bannedUsers.push(...b);
  } catch { /* */ }

  const uniqueIps = new Set(detectionHistory.map((l) => l.ip));

  const allLogs = [...serverLogs, ...detectionHistory].filter(
    (l, i, arr) => arr.findIndex((x) => x.id === l.id) === i
  );

  const filteredHistory = allLogs.filter((l) => {
    const matchSearch = !searchUser ||
      l.username.toLowerCase().includes(searchUser.toLowerCase()) ||
      l.userId.toLowerCase().includes(searchUser.toLowerCase());
    const matchType = filterType === "all" || l.detectionType.toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  const filteredRestrictionHistory = searchUser
    ? restrictionHistory.filter((l) => l.username.toLowerCase().includes(searchUser.toLowerCase()) || l.userId.toLowerCase().includes(searchUser.toLowerCase()))
    : restrictionHistory;

  const userIpLogs = selectedUserId ? getIpLogs(selectedUserId) : [];

  const handleBan = (uid: string, uname: string) => {
    try {
      const banned: string[] = JSON.parse(localStorage.getItem("coinloot_banned_users") || "[]");
      if (!banned.includes(uid)) {
        banned.push(uid);
        localStorage.setItem("coinloot_banned_users", JSON.stringify(banned));
      }
    } catch { /* */ }
    logRestrictionHistory({
      id: `rh-${Date.now()}`,
      userId: uid, username: uname,
      action: "banned", duration: 0, reason: "VPN/proxy policy violation",
      adminAction: `Banned by ${username}`, timestamp: new Date().toISOString(),
    });
    onAction(`${uname} has been banned`);
    loadData();
  };

  const handleUnban = (uid: string) => {
    try {
      const banned: string[] = JSON.parse(localStorage.getItem("coinloot_banned_users") || "[]");
      localStorage.setItem("coinloot_banned_users", JSON.stringify(banned.filter((b) => b !== uid)));
    } catch { /* */ }
    onAction("User unbanned");
    loadData();
  };

  const handleExtend = (uid: string, uname: string) => {
    extendRestriction(uid, extendMinutes);
    logRestrictionHistory({
      id: `rh-${Date.now()}`,
      userId: uid, username: uname,
      action: "extended", duration: extendMinutes, reason: "Extended by admin",
      adminAction: `Extended by ${extendMinutes} min by ${username}`, timestamp: new Date().toISOString(),
    });
    onAction(`Restriction extended by ${extendMinutes} min`);
    loadData();
  };

  const handleUnrestrict = (uid: string, uname: string) => {
    unRestrictUser(uid);
    logRestrictionHistory({
      id: `rh-${Date.now()}`,
      userId: uid, username: uname,
      action: "unrestricted", duration: 0, reason: "Manually unrestricted",
      adminAction: `Unrestricted by ${username}`, timestamp: new Date().toISOString(),
    });
    onAction(`${uname} unrestricted`);
    loadData();
  };

  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Search and Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
          <span className="block text-lg font-bold font-mono text-white">{detectionHistory.length}</span>
          <span className="text-[9px] text-slate-500 font-mono">Total Detections</span>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
          <span className="block text-lg font-bold font-mono text-amber-400">{restrictedUsers.length}</span>
          <span className="text-[9px] text-slate-500 font-mono">Restricted Now</span>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
          <span className="block text-lg font-bold font-mono text-rose-400">{flaggedUsers.length}</span>
          <span className="text-[9px] text-slate-500 font-mono">Flagged Users</span>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
          <span className="block text-lg font-bold font-mono text-cyan-400">{uniqueIps.size}</span>
          <span className="text-[9px] text-slate-500 font-mono">Unique IPs</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-2.5">
        <Search className="w-3.5 h-3.5 text-slate-500" />
        <input
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          placeholder="Search by username or user ID..."
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none"
        />
        <span className="text-[9px] text-slate-600 font-mono">{filteredHistory.length} results</span>
      </div>

      {/* Current Restricted Users */}
      <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Currently Restricted</h3>
        {restrictedUsers.length > 0 ? (
          <div className="space-y-2">
            {restrictedUsers.map((r) => {
              const p = profiles.find((x) => x.id === r.userId);
              const rem = isUserRestricted(r.userId);
              return (
                <div key={r.userId} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-amber-500/10">
                  <div className="min-w-0">
                    <span className="block text-xs text-white truncate">{p?.username || r.userId}</span>
                    <span className="text-[9px] text-amber-400 font-mono">{rem.remaining}</span>
                    {r.reason && <span className="text-[8px] text-slate-500 block mt-0.5">{r.reason}</span>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <input
                      type="number"
                      value={extendMinutes}
                      onChange={(e) => setExtendMinutes(parseInt(e.target.value) || 30)}
                      className="w-14 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white text-center font-mono"
                      placeholder="min"
                    />
                    <button onClick={() => handleExtend(r.userId, p?.username || r.userId)} className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[8px] font-bold hover:bg-cyan-500/20 transition-all cursor-pointer">Extend</button>
                    <button onClick={() => handleUnrestrict(r.userId, p?.username || r.userId)} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">Unrestrict</button>
                    <button onClick={() => setBanUserId(r.userId)} className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-bold hover:bg-rose-500/20 transition-all cursor-pointer">Ban</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-xs text-slate-500 text-center py-4">No users currently restricted</p>}
      </div>

      {/* Detection Type Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["all", "VPN", "Proxy", "TOR Network", "Datacenter IP", "Anonymous Proxy", "VPN / Proxy", "Suspicious IP", "clean"].map((t) => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-2.5 py-1 rounded-lg text-[8px] font-bold whitespace-nowrap transition-all cursor-pointer ${
            filterType === t
              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              : "text-slate-500 hover:text-white border border-transparent"
          }`}>{t === "all" ? "All Types" : t}</button>
        ))}
      </div>

      {/* Detection History */}
      <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-rose-400" /> Detection History</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filteredHistory.slice(0, 50).map((log) => (
            <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/20 border border-white/[0.02] hover:bg-slate-900/40 cursor-pointer transition-all" onClick={() => { setSelectedUserId(log.userId); if (log.rawResponse) setViewingRawResponse(log); }}>
              <span className="text-[8px] font-mono text-slate-500 w-16 shrink-0">{new Date(log.detectedAt).toLocaleString()}</span>
              <span className="text-[9px] font-bold text-white w-14 truncate shrink-0">{log.username}</span>
              <span className="text-[8px] font-mono text-slate-400 w-16 truncate shrink-0">{log.ip}</span>
              <span className="text-[8px] font-mono text-slate-500 w-12 truncate shrink-0">{log.country}</span>
              <span className={`px-1 rounded text-[7px] font-bold shrink-0 ${log.detectionType === "Proxy" || log.detectionType === "VPN / Proxy" || log.detectionType === "VPN" ? "bg-rose-500/10 text-rose-400" : log.detectionType === "TOR Network" ? "bg-purple-500/10 text-purple-400" : "bg-amber-500/10 text-amber-400"}`}>{log.detectionType}</span>
              {log.vpnProvider && <span className="text-[8px] font-mono text-cyan-400 w-16 truncate shrink-0" title={log.vpnProvider}>{log.vpnProvider}</span>}
              <span className="text-[8px] font-mono text-slate-600 truncate flex-1">{log.isp || log.org}</span>
              {log.fraudScore > 0 && <span className={`text-[8px] font-mono shrink-0 ${log.fraudScore >= 80 ? "text-rose-400" : "text-amber-400"}`}>{log.fraudScore}</span>}
              {log.rawResponse && <span className="text-[7px] text-cyan-500 shrink-0" title="View raw response">🔍</span>}
            </div>
          ))}
          {filteredHistory.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No detection history</p>}
        </div>
      </div>

      {/* User IP Logs (when user selected) */}
      {selectedUserId && (
        <div className="bg-slate-950/40 p-5 rounded-3xl border border-cyan-500/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> IP Logs — {profiles.find((p) => p.id === selectedUserId)?.username || selectedUserId}</h3>
            <button onClick={() => setSelectedUserId(null)} className="text-[9px] text-slate-500 hover:text-white transition-all cursor-pointer"><X className="w-3 h-3" /></button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {userIpLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/20 border border-white/[0.02]">
                <span className="text-[8px] font-mono text-slate-500 w-20 shrink-0">{new Date(log.detectedAt).toLocaleString()}</span>
                <span className="text-[8px] font-mono text-cyan-300 w-24 shrink-0">{log.ip}</span>
                <span className="text-[8px] font-mono text-slate-500">{log.country}</span>
                <span className={`px-1 rounded text-[7px] font-bold ${log.detectionType === "Proxy" || log.detectionType === "VPN / Proxy" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>{log.detectionType}</span>
                <span className="text-[8px] font-mono text-slate-600 truncate">{log.isp}</span>
              </div>
            ))}
            {userIpLogs.length === 0 && <p className="text-xs text-slate-500 text-center py-2">No IP logs for this user</p>}
          </div>
        </div>
      )}

      {/* Restriction History */}
      <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><History className="w-4 h-4 text-purple-400" /> Restriction History</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filteredRestrictionHistory.slice(0, 50).map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/20 border border-white/[0.02]">
              <span className="text-[8px] font-mono text-slate-500 w-20 shrink-0">{new Date(entry.timestamp).toLocaleString()}</span>
              <span className="text-[9px] font-bold text-white w-16 truncate shrink-0">{entry.username}</span>
              <span className={`px-1 rounded text-[7px] font-bold shrink-0 ${entry.action === "restricted" ? "bg-amber-500/10 text-amber-400" : entry.action === "unrestricted" ? "bg-emerald-500/10 text-emerald-400" : entry.action === "extended" ? "bg-cyan-500/10 text-cyan-400" : "bg-rose-500/10 text-rose-400"}`}>{entry.action}</span>
              <span className="text-[8px] text-slate-400 truncate max-w-[160px]">{entry.adminAction}</span>
              {entry.adminNote && <span className="text-[8px] text-slate-600 italic truncate max-w-[120px]" title={entry.adminNote}>📌 {entry.adminNote}</span>}
              {entry.reason !== "Extended by admin" && !entry.adminNote && <span className="text-[8px] text-slate-600 truncate max-w-[120px]">{entry.reason}</span>}
            </div>
          ))}
          {filteredRestrictionHistory.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No restriction history</p>}
        </div>
      </div>

      {/* Flagged Users */}
      <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Flag className="w-4 h-4 text-rose-400" /> Flagged Users (VPN Detected)</h3>
        {flaggedUsers.length > 0 ? (
          <div className="space-y-1">
            {flaggedUsers.map((p) => {
              const r = isUserRestricted(p.id);
              const isBanned = bannedUsers.includes(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-rose-500/10">
                  <div>
                    <span className="block text-xs text-white">{p.username}</span>
                    <span className="text-[9px] text-slate-500">{p.email}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {r.restricted ? (
                      <span className="text-[8px] text-amber-400 font-mono px-2">{r.remaining}</span>
                    ) : isBanned ? (
                      <span className="text-[8px] text-rose-400 font-mono px-2">Banned</span>
                    ) : (
                      <button onClick={() => { restrictUser(p.id, 30, "VPN detected by system"); logRestrictionHistory({ id: `rh-${Date.now()}`, userId: p.id, username: p.username, action: "restricted", duration: 30, reason: "VPN detected by system", adminAction: `Restricted 30 min by ${username}`, timestamp: new Date().toISOString() }); onAction(`${p.username} restricted 30 min`); loadData(); }} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-bold hover:bg-amber-500/20 transition-all cursor-pointer">Restrict 30m</button>
                    )}
                    <button onClick={() => isBanned ? handleUnban(p.id) : handleBan(p.id, p.username)} className={`px-2 py-1 rounded-lg text-[8px] font-bold transition-all cursor-pointer ${isBanned ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"}`}>{isBanned ? "Unban" : "Ban"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-xs text-slate-500 text-center py-4">No flagged users</p>}
      </div>

      {/* Raw API Response Modal */}
      {viewingRawResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" onClick={() => setViewingRawResponse(null)}>
          <div className="max-w-lg w-full bg-slate-950 border border-white/10 rounded-3xl p-5 relative animate-zoom-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingRawResponse(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            <h3 className="text-sm font-bold text-white mb-1">Raw ProxyCheck Response</h3>
            <p className="text-[9px] text-slate-500 font-mono mb-3">User: {viewingRawResponse.username} | IP: {viewingRawResponse.ip}</p>
            <pre className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 text-[9px] font-mono text-cyan-300 max-h-80 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(viewingRawResponse.rawResponse, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {banUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" onClick={() => setBanUserId(null)}>
          <div className="max-w-sm w-full bg-slate-950 border border-white/10 rounded-3xl p-6 relative animate-zoom-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setBanUserId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            <h3 className="text-sm font-bold text-white mb-1">Permanently Ban User?</h3>
            <p className="text-[10px] text-slate-400 font-mono mb-4">This action cannot be undone. The user will lose all access.</p>
            <div className="flex gap-2">
              <button onClick={() => setBanUserId(null)} className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-[10px] font-bold hover:border-white/20 transition-all cursor-pointer">Cancel</button>
              <button onClick={() => { const p = profiles.find((x) => x.id === banUserId); if (p) { handleBan(p.id, p.username); } setBanUserId(null); }} className="flex-1 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold hover:bg-rose-500/30 transition-all cursor-pointer">Permanently Ban</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs */}
      <div className="flex justify-end">
        <button onClick={() => { clearDetectionLogs(); loadData(); onAction("Detection logs cleared"); }} className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-[9px] text-slate-400 hover:text-rose-400 transition-all cursor-pointer">Clear All Detection Logs</button>
          </div>
        </div>
      );
    }

function StatCard({ label, value, icon: Icon, color, trend, loading }: { label: string; value: string; icon: any; color: string; trend?: { up: boolean; pct: string }; loading?: boolean }) {
  if (loading) return <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 animate-pulse"><div className="w-9 h-9 rounded-xl bg-slate-800/60 mb-3" /><div className="h-6 w-20 bg-slate-800/60 rounded mb-2" /><div className="h-3 w-16 bg-slate-800/40 rounded" /></div>;
  return (
    <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 hover:border-cyan-500/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {trend && <span className={`flex items-center gap-0.5 text-[9px] font-mono font-bold ${trend.up ? "text-emerald-400" : "text-rose-400"}`}>{trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{trend.pct}</span>}
      </div>
      <span className="block text-lg font-bold font-mono text-white tracking-tight">{value}</span>
      <span className="block text-[9px] text-slate-500 font-mono uppercase mt-1">{label}</span>
    </div>
  );
}

function LoadingRow() { return <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse flex items-center gap-4"><div className="w-9 h-9 rounded-xl bg-slate-800/60 shrink-0" /><div className="flex-1 space-y-2"><div className="h-3 w-32 bg-slate-800/60 rounded" /><div className="h-2 w-48 bg-slate-800/40 rounded" /></div><div className="h-6 w-16 bg-slate-800/40 rounded" /></div>; }

const AdminBackBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white font-mono transition-colors cursor-pointer mb-3">
    <ArrowLeft className="w-3.5 h-3.5" /> Back
  </button>
);

const getAccounts = (): StoredAccount[] => { try { return JSON.parse(localStorage.getItem("coinloot_accounts") || "[]"); } catch { return []; } };
const saveAccounts = (accounts: StoredAccount[]) => localStorage.setItem("coinloot_accounts", JSON.stringify(accounts));

// ── Data Browser: browse Supabase tables inline ──

// ── Rewards & Challenges Management ──
function RewardsChallengesManagement() {
  const [subSection, setSubSection] = useState("overview");
  const [bountyConfig, setBountyConfig] = useState(getSocialBountyConfig);
  const [challengeConfig, setChallengeConfig] = useState(getWeeklyChallengeConfig);

  const saveBounty = async () => {
    saveSocialBountyConfig(bountyConfig);
    try {
      const current = await AdminDb.getRewardsConfig();
      await AdminDb.saveRewardsConfig({ ...current, socialBounty: bountyConfig });
    } catch (e) { console.error("Failed to sync bounty config to Supabase", e); }
    alert("Social Bounty settings saved!");
  };

  const saveChallenge = async () => {
    saveWeeklyChallengeConfig(challengeConfig);
    try {
      const current = await AdminDb.getRewardsConfig();
      await AdminDb.saveRewardsConfig({ ...current, weeklyChallenge: challengeConfig });
    } catch (e) { console.error("Failed to sync challenge config to Supabase", e); }
    alert("Weekly Challenge settings saved!");
  };

  const levelOptions = [1, 2, 3, 5, 10, 15, 20];
  const rewardPresets = [100, 500, 1000, 5000];

  // ── Landing / Overview page ──
  if (subSection === "overview") {
    return (
      <div className="p-4 lg:p-6 space-y-4 max-w-3xl">
        <h1 className="text-xl lg:text-2xl font-bold text-white">Rewards & Challenges Management</h1>
        <p className="text-[10px] text-slate-400 font-mono">Configure social bounty campaigns and the weekly elite challenge chest.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => setSubSection("social-bounty")} className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 hover:border-cyan-500/20 transition-all text-left group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Social Bounty Campaign Settings</h3>
            <p className="text-[10px] text-slate-400 font-mono">Enable/disable, set rewards, level requirements, and configure social bounty networks.</p>
          </button>
          <button onClick={() => setSubSection("weekly-challenge")} className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 hover:border-purple-500/20 transition-all text-left group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Weekly Elite Challenge Settings</h3>
            <p className="text-[10px] text-slate-400 font-mono">Enable/disable, set reward coins, bonus coins, level requirements, and weekly reset rules.</p>
          </button>
        </div>
      </div>
    );
  }

  if (subSection === "social-bounty") {
    return (
      <div className="p-4 lg:p-6 space-y-4 max-w-3xl">
        <AdminBackBtn onClick={() => setSubSection("overview")} />
        <h1 className="text-xl lg:text-2xl font-bold text-white">Social Bounty Campaign Settings</h1>
        <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Enable Feature</h3>
            <button onClick={() => setBountyConfig({...bountyConfig, enabled: !bountyConfig.enabled})} className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${bountyConfig.enabled ? "bg-cyan-500" : "bg-slate-700"}`}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: bountyConfig.enabled ? "calc(100% - 18px)" : "2px" }} />
            </button>
          </div>
          {bountyConfig.enabled && (
            <>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Title</label><input value={bountyConfig.title} onChange={(e) => setBountyConfig({...bountyConfig, title: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Description</label><textarea value={bountyConfig.description} onChange={(e) => setBountyConfig({...bountyConfig, description: e.target.value})} rows={2} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white resize-none" /></div>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Icon (emoji)</label><input value={bountyConfig.icon} onChange={(e) => setBountyConfig({...bountyConfig, icon: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" placeholder="e.g. Sparkles, 🐦" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase block mb-1">Reward Coins</label>
                  <div className="flex gap-2 flex-wrap">
                    {rewardPresets.map((p) => (
                      <button key={p} onClick={() => setBountyConfig({...bountyConfig, reward_coins: p})} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${bountyConfig.reward_coins === p ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-slate-800 text-slate-400 border border-white/5 hover:border-cyan-500/20"}`}>{p}</button>
                    ))}
                    <input type="number" value={bountyConfig.reward_coins} onChange={(e) => setBountyConfig({...bountyConfig, reward_coins: parseInt(e.target.value) || 0})} className="w-20 bg-slate-950 border border-white/5 rounded-xl px-2 py-1 text-[9px] font-mono text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase block mb-1">Max Reward Limit</label>
                  <input type="number" value={bountyConfig.max_reward_limit} onChange={(e) => setBountyConfig({...bountyConfig, max_reward_limit: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Min. Level Requirement</label>
                <div className="flex gap-2 flex-wrap">
                  {levelOptions.map((l) => (
                    <button key={l} onClick={() => setBountyConfig({...bountyConfig, required_level: l})} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${bountyConfig.required_level === l ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-800 text-slate-400 border border-white/5 hover:border-amber-500/20"}`}>Level {l}+</button>
                  ))}
                  <input type="number" value={bountyConfig.required_level} onChange={(e) => setBountyConfig({...bountyConfig, required_level: parseInt(e.target.value) || 1})} className="w-16 bg-slate-950 border border-white/5 rounded-xl px-2 py-1 text-[9px] font-mono text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Active</span>
                <button onClick={() => setBountyConfig({...bountyConfig, active: !bountyConfig.active})} className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${bountyConfig.active ? "bg-emerald-500" : "bg-slate-700"}`}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: bountyConfig.active ? "calc(100% - 18px)" : "2px" }} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveBounty} className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-bold hover:scale-[1.02] transition-all cursor-pointer">Save Settings</button>
                <button onClick={() => { setBountyConfig(resetSocialBountyToDefaults()); }} className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-slate-300 text-[10px] font-semibold hover:border-white/20 transition-all cursor-pointer">Reset to Default</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Weekly Elite Challenge Settings ──
  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-3xl">
      <AdminBackBtn onClick={() => setSubSection("overview")} />
      <h1 className="text-xl lg:text-2xl font-bold text-white">Weekly Elite Challenge Settings</h1>
      <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Enable Feature</h3>
          <button onClick={() => setChallengeConfig({...challengeConfig, enabled: !challengeConfig.enabled})} className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${challengeConfig.enabled ? "bg-cyan-500" : "bg-slate-700"}`}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: challengeConfig.enabled ? "calc(100% - 18px)" : "2px" }} />
          </button>
        </div>
        {challengeConfig.enabled && (
          <>
            <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Title</label><input value={challengeConfig.title} onChange={(e) => setChallengeConfig({...challengeConfig, title: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
            <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Description</label><textarea value={challengeConfig.description} onChange={(e) => setChallengeConfig({...challengeConfig, description: e.target.value})} rows={2} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white resize-none" /></div>
            <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Icon (emoji)</label><input value={challengeConfig.icon} onChange={(e) => setChallengeConfig({...challengeConfig, icon: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" placeholder="e.g. Trophy, 🏆" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Reward Coins</label>
                <div className="flex gap-2 flex-wrap">
                  {rewardPresets.map((p) => (
                    <button key={p} onClick={() => setChallengeConfig({...challengeConfig, reward_coins: p})} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${challengeConfig.reward_coins === p ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-slate-800 text-slate-400 border border-white/5 hover:border-purple-500/20"}`}>{p}</button>
                  ))}
                  <input type="number" value={challengeConfig.reward_coins} onChange={(e) => setChallengeConfig({...challengeConfig, reward_coins: parseInt(e.target.value) || 0})} className="w-20 bg-slate-950 border border-white/5 rounded-xl px-2 py-1 text-[9px] font-mono text-white" />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Bonus Coins</label>
                <input type="number" value={challengeConfig.bonus_coins} onChange={(e) => setChallengeConfig({...challengeConfig, bonus_coins: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Required Level</label>
                <div className="flex gap-2 flex-wrap">
                  {levelOptions.map((l) => (
                    <button key={l} onClick={() => setChallengeConfig({...challengeConfig, required_level: l})} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${challengeConfig.required_level === l ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-slate-800 text-slate-400 border border-white/5 hover:border-purple-500/20"}`}>Level {l}+</button>
                  ))}
                  <input type="number" value={challengeConfig.required_level} onChange={(e) => setChallengeConfig({...challengeConfig, required_level: parseInt(e.target.value) || 1})} className="w-16 bg-slate-950 border border-white/5 rounded-xl px-2 py-1 text-[9px] font-mono text-white" />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Required Tasks</label>
                <input type="number" value={challengeConfig.required_tasks} onChange={(e) => setChallengeConfig({...challengeConfig, required_tasks: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" />
              </div>
            </div>
            <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Completion Conditions</label><textarea value={challengeConfig.completion_conditions} onChange={(e) => setChallengeConfig({...challengeConfig, completion_conditions: e.target.value})} rows={2} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white resize-none" /></div>
            <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Weekly Reset Rules</label><input value={challengeConfig.weekly_reset_rules} onChange={(e) => setChallengeConfig({...challengeConfig, weekly_reset_rules: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Active</span>
              <button onClick={() => setChallengeConfig({...challengeConfig, active: !challengeConfig.active})} className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${challengeConfig.active ? "bg-emerald-500" : "bg-slate-700"}`}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: challengeConfig.active ? "calc(100% - 18px)" : "2px" }} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveChallenge} className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-bold hover:scale-[1.02] transition-all cursor-pointer">Save Settings</button>
              <button onClick={() => { setChallengeConfig(resetWeeklyChallengeToDefaults()); }} className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-slate-300 text-[10px] font-semibold hover:border-white/20 transition-all cursor-pointer">Reset to Default</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const DB_TABLES = ["profiles", "withdrawals", "withdrawal_methods", "offerwall_providers", "offerwalls", "promo_codes", "support_tickets", "kyc_records", "site_settings", "system_notifications", "notifications", "earnings_history", "live_earnings"];
function DataBrowserCard() {
  const [selectedTable, setSelectedTable] = useState("profiles");
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [loadingTable, setLoadingTable] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sb = getSupabaseClient();
    if (!sb) { setDbError("Supabase not configured"); setTableData(null); setLoadingTable(false); return; }
    setDbError(null);
    setLoadingTable(true);
    setTableData(null);
    sb.from(selectedTable).select("*").limit(50).then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setDbError(error.message); setTableData(null); }
      else { setTableData(data || []); }
      setLoadingTable(false);
    });
    return () => { cancelled = true; };
  }, [selectedTable]);

  if (!getSupabaseClient()) return null;

  return (
    <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-3">
      <h3 className="font-bold text-sm text-white flex items-center gap-2"><Database className="w-4 h-4 text-cyan-400" /> Data Browser</h3>
      <p className="text-[10px] text-slate-400 font-mono">Browse table contents directly from Supabase (max 50 rows).</p>
      <div className="flex items-center gap-2 flex-wrap">
        <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-mono text-white">
          {DB_TABLES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-[9px] text-slate-500 font-mono">
          {loadingTable ? "Loading..." : dbError ? "Error" : `${tableData?.length || 0} rows`}
        </span>
        {dbError && <span className="text-[9px] text-rose-400 font-mono">{dbError}</span>}
      </div>
      <div className="overflow-x-auto max-h-48 overflow-y-auto border border-white/5 rounded-xl">
        {tableData && tableData.length > 0 ? (
          <table className="w-full text-[8px] font-mono">
            <thead>
              <tr className="bg-slate-900/80">
                {Object.keys(tableData[0]).map((col) => (
                  <th key={col} className="px-2 py-1.5 text-left text-slate-400 font-semibold whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, ri) => (
                <tr key={ri} className="border-t border-white/5 hover:bg-white/[0.02]">
                  {Object.values(row).map((val: any, ci: number) => (
                    <td key={ci} className="px-2 py-1 text-slate-300 truncate max-w-[120px]" title={typeof val === "string" ? val : JSON.stringify(val)}>
                      {val === null ? <span className="text-slate-600">NULL</span> : typeof val === "object" ? JSON.stringify(val).slice(0, 40) : String(val).slice(0, 40)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : tableData && tableData.length === 0 ? (
          <p className="text-center text-slate-500 py-4 text-[10px]">No data in this table.</p>
        ) : loadingTable ? (
          <p className="text-center text-slate-500 py-4 text-[10px]">Loading...</p>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminPanel({ user, onRewardEarned, activeSection: externalSection, onSectionChange }: AdminPanelProps) {
  const [internalSection, setInternalSection] = useState("dashboard");
  const activeSection = externalSection || internalSection;
  const rawSetSection = onSectionChange || setInternalSection;
  const [sectionHistory, setSectionHistory] = useState<string[]>([]);
  const setActiveSection = useCallback((s: string) => {
    setSectionHistory(prev => {
      const last = prev[prev.length - 1];
      if (last !== activeSection) return [...prev, activeSection];
      return prev;
    });
    rawSetSection(s);
  }, [activeSection, rawSetSection]);
  const goBack = useCallback(() => {
    setSectionHistory(prev => {
      if (prev.length === 0) { rawSetSection("dashboard"); return []; }
      const newHist = [...prev];
      const target = newHist.pop()!;
      rawSetSection(target);
      return newHist;
    });
  }, [rawSetSection]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editCoins, setEditCoins] = useState(0);
  const [editUsd, setEditUsd] = useState(0);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [viewingKyc, setViewingKyc] = useState<any>(null);

  // ── Homepage Sections State ──
  const loadHomepageSections = () => {
    try {
      const saved = localStorage.getItem("coinloot_homepage_sections");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { featured: true, hot: true, surveys: true, offerwalls: true };
  };
  const [homepageSections, setHomepageSections] = useState(loadHomepageSections);

  // Re-read homepage sections from localStorage when section changes to "homepage"
  useEffect(() => {
    if (activeSection === "homepage") {
      setHomepageSections(loadHomepageSections());
    }
  }, [activeSection]);

  // ── VPN Protection Settings ──
  const [vpnSettings, setVpnSettings] = useState(getVpnSettings);

  // ── Locked Offers Rules State ──
  const [rules, setRules] = useState<{ id: string; name: string; type: string; value: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_lock_rules") || "[]"); } catch { return []; }
  });
  const [newRule, setNewRule] = useState({ name: "", type: "coins_earned", value: 1000 });

  // ── Coins & Rewards State ──
  const [coinAmount, setCoinAmount] = useState(100);
  const [coinReason, setCoinReason] = useState("");
  const [coinTargetEmail, setCoinTargetEmail] = useState("");

  // ── Global Notification State ──
  const [globalNotifText, setGlobalNotifText] = useState(() => localStorage.getItem("coinloot_global_notif_text") || "");
  const [globalNotifPromo, setGlobalNotifPromo] = useState(() => JSON.parse(localStorage.getItem("coinloot_global_notif_promo_enabled") || "false"));
  const [globalNotifPromoCode, setGlobalNotifPromoCode] = useState(() => localStorage.getItem("coinloot_global_notif_promo_code") || "");
  const [globalNotifPromoCoins, setGlobalNotifPromoCoins] = useState(() => parseInt(localStorage.getItem("coinloot_global_notif_promo_coins") || "0"));
  const loadDur = () => { try { const d = JSON.parse(localStorage.getItem("coinloot_global_notif_promo_duration") || "{}"); return d; } catch { return {}; } };
  const [promoDurDays, setPromoDurDays] = useState(() => loadDur().days ?? 0);
  const [promoDurHours, setPromoDurHours] = useState(() => loadDur().hours ?? 0);
  const [promoDurMins, setPromoDurMins] = useState(() => loadDur().mins ?? 30);
  const [promoDurSecs, setPromoDurSecs] = useState(() => loadDur().secs ?? 0);
  const savePromoDur = (d: number, h: number, m: number, s: number) => localStorage.setItem("coinloot_global_notif_promo_duration", JSON.stringify({ days: d, hours: h, mins: m, secs: s }));
  const globalNotifPromoText = globalNotifPromo && globalNotifPromoCode && globalNotifPromoCoins > 0;

  // ── Notifications State ──
  const [notifTitle, setNotifTitle] = useState("");
  const [notifDesc, setNotifDesc] = useState("");
  const [notifType, setNotifType] = useState("system");

  // ── Admin Event Log State ──
  const [adminNotifFilter, setAdminNotifFilter] = useState("all");
  const [adminNotifs, setAdminNotifs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_admin_notifications") || "[]"); } catch { return []; }
  });
  const filteredAdminNotifs = useMemo(() => {
    if (adminNotifFilter === "all") return adminNotifs;
    return adminNotifs.filter((n) => n.type === adminNotifFilter);
  }, [adminNotifs, adminNotifFilter]);

  const getAdminEventEmoji = (type: string) => {
    const map: Record<string, string> = {
      new_user: "🆕", withdrawal_request: "💰",
    };
    return map[type] || "🔔";
  };

  const clearAdminNotifs = () => {
    localStorage.removeItem("coinloot_admin_notifications");
    setAdminNotifs([]);
    showNotif("success", "Event log cleared");
  };

  const refreshAdminNotifs = () => {
    try { setAdminNotifs(JSON.parse(localStorage.getItem("coinloot_admin_notifications") || "[]")); } catch {}
  };

  // Refresh admin notifications every 3 seconds
  useEffect(() => {
    const interval = setInterval(refreshAdminNotifs, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Payment Methods Modal State ──
  const [pmModal, setPmModal] = useState<{ mode: "add" | "edit"; data: WithdrawalMethodConfig } | null>(null);

  // ── Promo Codes State ──
  const [newCode, setNewCode] = useState({ code: "", coins: 100, maxUses: 100 });

  // ── Settings State ──
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [siteName, setSiteName] = useState("CoinLoot");
  const [rate, setRate] = useState("1000");
  const [minWd, setMinWd] = useState("1000");
  const [smtpHost, setSmtpHost] = useState("smtp.example.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("noreply@coinloot.com");
  const [smtpPass, setSmtpPass] = useState("");
  const [demoData, setDemoData] = useState(false);
  const [developerMode, setDeveloperMode] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem("coinloot_site_settings") || "{}"); return s.developerMode === true; } catch { return false; }
  });

  const [telegramToken, setTelegramToken] = useState(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_telegram_config") || "{}").token || ""; } catch { return ""; }
  });
  const [telegramChatId, setTelegramChatId] = useState(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_telegram_config") || "{}").chatId || ""; } catch { return ""; }
  });
  const [telegramEnabled, setTelegramEnabled] = useState(() => {
    try { const c = JSON.parse(localStorage.getItem("coinloot_telegram_config") || "{}"); return c.enabled !== false; } catch { return true; }
  });

  // ── IP Account Limit Settings ──
  const [ipLimitEnabled, setIpLimitEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_ip_limit_settings") || '{"enabled":false,"maxAccounts":3}').enabled; } catch { return false; }
  });
  const [ipLimitMax, setIpLimitMax] = useState(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_ip_limit_settings") || '{"enabled":false,"maxAccounts":3}').maxAccounts; } catch { return 3; }
  });

  const saveIpLimitSettings = (enabled: boolean, maxAccounts: number) => {
    localStorage.setItem("coinloot_ip_limit_settings", JSON.stringify({ enabled, maxAccounts }));
    setIpLimitEnabled(enabled);
    setIpLimitMax(maxAccounts);
    addLog("IP_LIMIT_SETTINGS_UPDATED", "settings", "ip-limit", `IP account limit ${enabled ? "enabled" : "disabled"}, max ${maxAccounts} accounts per IP`);
    showNotif("success", `IP account limit ${enabled ? "enabled" : "disabled"}`);
  };

  const testTelegram = async () => {
    const resp = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "🧪 <b>Test Notification</b>\n\nYour Telegram bot is working correctly!\n✅ Admin: " + (user?.username || "Admin"),
        botToken: telegramToken || undefined,
        chatId: telegramChatId || undefined,
      }),
    });
    const data = await resp.json();
    showNotif(data.sent ? "success" : "error", data.sent ? "Telegram test sent!" : "Failed: " + (data.error || "unknown"));
  };

  useEffect(() => {
    if (settingsLoaded) return;
    const s = JSON.parse(localStorage.getItem("coinloot_site_settings") || "{}");
    if (s.siteName) setSiteName(s.siteName);
    if (s.rate) setRate(s.rate);
    if (s.minWd) setMinWd(s.minWd);
    if (s.smtpHost) setSmtpHost(s.smtpHost);
    if (s.smtpPort) setSmtpPort(s.smtpPort);
    if (s.smtpUser) setSmtpUser(s.smtpUser);
    if (s.smtpPass) setSmtpPass(s.smtpPass);
    if (s.demoData !== undefined) setDemoData(s.demoData);
    if (s.developerMode !== undefined) setDeveloperMode(s.developerMode);
    // Load telegram config
    try {
      const tc = JSON.parse(localStorage.getItem("coinloot_telegram_config") || "{}");
      if (tc.token) setTelegramToken(tc.token);
      if (tc.chatId) setTelegramChatId(tc.chatId);
      if (tc.enabled !== undefined) setTelegramEnabled(tc.enabled);
    } catch {}
    setSettingsLoaded(true);
  }, [settingsLoaded]);

  // ── Sync site_settings from Supabase to localStorage ──
  useEffect(() => {
    if (!settingsLoaded) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    sb.from("site_settings").select("*").then(({ data, error }) => {
      if (error || !data) return;
      const settings: Record<string, string> = {};
      for (const row of data) {
        settings[row.setting_key] = row.setting_value;
      }
      if (settings.siteName) setSiteName(settings.siteName);
      if (settings.rate) setRate(settings.rate);
      if (settings.minWd) setMinWd(settings.minWd);
      if (settings.smtpHost) setSmtpHost(settings.smtpHost);
      if (settings.smtpPort) setSmtpPort(settings.smtpPort);
      if (settings.smtpUser) setSmtpUser(settings.smtpUser);
      if (settings.smtpPass) setSmtpPass(settings.smtpPass);
    });
  }, [settingsLoaded]);

  // ── Real-time site_settings subscription ──
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const cleanup = realtimeManager.subscribe("admin-site-settings", {
      table: "site_settings",
      event: "UPDATE",
      callback: (payload) => {
        const row = payload.new as any;
        const key = row.setting_key;
        const val = row.setting_value;
        if (key === "site_name") setSiteName(val);
        else if (key === "coin_to_usd_rate") setRate(val);
        else if (key === "min_withdrawal") setMinWd(val);
        else if (key === "smtp_host") setSmtpHost(val);
        else if (key === "smtp_port") setSmtpPort(val);
        else if (key === "smtp_user") setSmtpUser(val);
        else if (key === "smtp_pass") setSmtpPass(val);

        // Update localStorage
        const saved = JSON.parse(localStorage.getItem("coinloot_site_settings") || "{}");
        saved[key] = val;
        localStorage.setItem("coinloot_site_settings", JSON.stringify(saved));
      },
    });

    return () => {
      realtimeManager.unsubscribe("admin-site-settings");
      cleanup();
    };
  }, []);

  const saveSettings = () => {
    localStorage.setItem("coinloot_site_settings", JSON.stringify({ siteName, rate, minWd, smtpHost, smtpPort, smtpUser, smtpPass, demoData, developerMode }));
    localStorage.setItem("coinloot_telegram_config", JSON.stringify({ token: telegramToken, chatId: telegramChatId, enabled: telegramEnabled }));
    // Sync to Supabase site_settings table
    const sb = getSupabaseClient();
    if (sb) {
      const upsertSettings = [
        { setting_key: "site_name", setting_value: siteName },
        { setting_key: "coin_to_usd_rate", setting_value: rate },
        { setting_key: "min_withdrawal", setting_value: minWd },
        { setting_key: "smtp_host", setting_value: smtpHost },
        { setting_key: "smtp_port", setting_value: smtpPort },
        { setting_key: "smtp_user", setting_value: smtpUser },
        { setting_key: "smtp_pass", setting_value: smtpPass },
        { setting_key: "developer_mode", setting_value: JSON.stringify({ enabled: developerMode }) },
      ];
      sb.from("site_settings").upsert(upsertSettings, { onConflict: "setting_key" }).then(({ error }) => {
        if (error) console.warn("Failed to sync settings to Supabase:", error.message);
      });
      AdminDb.saveDeveloperMode({ enabled: developerMode, message: "" }).catch(() => {});
    }
    addLog("SETTINGS_UPDATED", "settings", "site", "Updated site settings");
    showNotif("success", "Settings saved!");
  };

  // ── Restrict User State ──
  const [restrictModal, setRestrictModal] = useState<{ userId: string; username: string } | null>(null);
  const [restrictDuration, setRestrictDuration] = useState(30);
  const [restrictDays, setRestrictDays] = useState(0);
  const [restrictHours, setRestrictHours] = useState(0);
  const [restrictMinutes, setRestrictMinutes] = useState(30);
  const [restrictSeconds, setRestrictSeconds] = useState(0);
  const [restrictReason, setRestrictReason] = useState("");
  const [restrictNote, setRestrictNote] = useState("");
  const [countdownTick, setCountdownTick] = useState(Date.now());
  const [profilesRefreshKey, setProfilesRefreshKey] = useState(0);

  // Seed demo accounts + admin if needed
  useEffect(() => {
    const existing = getAccounts();
    const hasAdmin = existing.some((a) => a.email === "coinlootadmin@gmail.com");
    const adminEntry: StoredAccount = { email: "coinlootadmin@gmail.com", password: "Coinloot@#admin@#", username: "Admin", profile: { id: `demo-${Date.now()}-11`, username: "Admin", email: "coinlootadmin@gmail.com", balance_coins: 0, balance_usd: 0, xp: 0, level: 1, streak_days: 0, referred_by: null, referrals_count: 0, total_earned_coins: 0, total_withdrawn_usd: 0, kyc_status: "APPROVED", kyc_required: false, is_admin: true, vpn_detected: false, device_fingerprint: "", country: "US", is_banned: false } };

    if (existing.length === 0) {
      const demos: StoredAccount[] = [
        adminEntry,
        { email: "alice@demo.com", password: "Demo@123", username: "Alice", profile: { id: `demo-${Date.now()}-1`, username: "Alice", email: "alice@demo.com", balance_coins: 45200, balance_usd: 45.2, xp: 8400, level: 12, streak_days: 7, referred_by: null, referrals_count: 3, total_earned_coins: 124500, total_withdrawn_usd: 79.3, kyc_status: "APPROVED", kyc_required: false, is_admin: false, vpn_detected: false, device_fingerprint: "", country: "US", is_banned: false } },
        { email: "bob@demo.com", password: "Demo@123", username: "Bob", profile: { id: `demo-${Date.now()}-2`, username: "Bob", email: "bob@demo.com", balance_coins: 18200, balance_usd: 18.2, xp: 3200, level: 7, streak_days: 3, referred_by: "Alice", referrals_count: 1, total_earned_coins: 56200, total_withdrawn_usd: 38.0, kyc_status: "APPROVED", kyc_required: false, is_admin: false, vpn_detected: false, device_fingerprint: "", country: "GB", is_banned: false } },
        { email: "charlie@demo.com", password: "Demo@123", username: "Charlie", profile: { id: `demo-${Date.now()}-3`, username: "Charlie", email: "charlie@demo.com", balance_coins: 6800, balance_usd: 6.8, xp: 1500, level: 4, streak_days: 1, referred_by: "Alice", referrals_count: 0, total_earned_coins: 22100, total_withdrawn_usd: 15.3, kyc_status: "NOT_STARTED", kyc_required: false, is_admin: false, vpn_detected: false, device_fingerprint: "", country: "BD", is_banned: false } },
        { email: "diana@demo.com", password: "Demo@123", username: "Diana", profile: { id: `demo-${Date.now()}-4`, username: "Diana", email: "diana@demo.com", balance_coins: 1200, balance_usd: 1.2, xp: 400, level: 2, streak_days: 0, referred_by: null, referrals_count: 0, total_earned_coins: 4500, total_withdrawn_usd: 3.3, kyc_status: "NOT_STARTED", kyc_required: false, is_admin: false, vpn_detected: false, device_fingerprint: "", country: "IN", is_banned: false } },
        { email: "eve@demo.com", password: "Demo@123", username: "Eve", profile: { id: `demo-${Date.now()}-5`, username: "Eve", email: "eve@demo.com", balance_coins: 34500, balance_usd: 34.5, xp: 7200, level: 10, streak_days: 5, referred_by: null, referrals_count: 5, total_earned_coins: 98000, total_withdrawn_usd: 63.5, kyc_status: "APPROVED", kyc_required: false, is_admin: false, vpn_detected: false, device_fingerprint: "", country: "PH", is_banned: false } },
        { email: "frank@demo.com", password: "Demo@123", username: "Frank", profile: { id: `demo-${Date.now()}-6`, username: "Frank", email: "frank@demo.com", balance_coins: 2500, balance_usd: 2.5, xp: 800, level: 3, streak_days: 0, referred_by: "Eve", referrals_count: 0, total_earned_coins: 8900, total_withdrawn_usd: 6.4, kyc_status: "NOT_STARTED", kyc_required: false, is_admin: false, vpn_detected: false, device_fingerprint: "", country: "NG", is_banned: false } },
        { email: "grace@demo.com", password: "Demo@123", username: "Grace", profile: { id: `demo-${Date.now()}-7`, username: "Grace", email: "grace@demo.com", balance_coins: 91000, balance_usd: 91.0, xp: 15600, level: 18, streak_days: 12, referred_by: null, referrals_count: 8, total_earned_coins: 286000, total_withdrawn_usd: 195.0, kyc_status: "APPROVED", kyc_required: false, is_admin: false, vpn_detected: false, device_fingerprint: "", country: "US", is_banned: false } },
        { email: "henry@demo.com", password: "Demo@123", username: "Henry", profile: { id: `demo-${Date.now()}-8`, username: "Henry", email: "henry@demo.com", balance_coins: 7800, balance_usd: 7.8, xp: 2800, level: 6, streak_days: 2, referred_by: "Grace", referrals_count: 1, total_earned_coins: 33400, total_withdrawn_usd: 25.6, kyc_status: "PENDING", kyc_required: false, is_admin: false, vpn_detected: false, device_fingerprint: "", country: "CA", is_banned: false } },
        { email: "ivy@demo.com", password: "Demo@123", username: "Ivy", profile: { id: `demo-${Date.now()}-9`, username: "Ivy", email: "ivy@demo.com", balance_coins: 22000, balance_usd: 22.0, xp: 5100, level: 8, streak_days: 4, referred_by: null, referrals_count: 2, total_earned_coins: 74500, total_withdrawn_usd: 52.5, kyc_status: "APPROVED", kyc_required: false, is_admin: false, vpn_detected: false, device_fingerprint: "", country: "AU", is_banned: false } },
        { email: "jack@demo.com", password: "Demo@123", username: "Jack", profile: { id: `demo-${Date.now()}-10`, username: "Jack", email: "jack@demo.com", balance_coins: 150, balance_usd: 0.15, xp: 50, level: 1, streak_days: 0, referred_by: "Ivy", referrals_count: 0, total_earned_coins: 200, total_withdrawn_usd: 0, kyc_status: "NOT_STARTED", kyc_required: false, is_admin: false, vpn_detected: true, device_fingerprint: "", country: "VN", is_banned: false } },
      ];
      localStorage.setItem("coinloot_accounts", JSON.stringify(demos));
    } else if (!hasAdmin) {
      existing.push(adminEntry);
      localStorage.setItem("coinloot_accounts", JSON.stringify(existing));
    }
    setProfilesRefreshKey((k) => k + 1);
  }, []);

  // Re-read accounts from localStorage when storage changes (cross-tab) or on focus
  useEffect(() => {
    const handler = () => setProfilesRefreshKey((k) => k + 1);
    window.addEventListener("storage", handler);
    window.addEventListener("focus", handler);
    window.addEventListener("user-registered", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("focus", handler);
      window.removeEventListener("user-registered", handler);
    };
  }, []);
  useEffect(() => { const i = setInterval(() => setCountdownTick(Date.now()), 1000); return () => clearInterval(i); }, []);

  // ── Supabase Profiles Sync ──
  const [supabaseProfiles, setSupabaseProfiles] = useState<UserProfile[]>([]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const sb = getSupabaseClient();
        if (!sb) { if (!cancelled) setSupabaseProfiles([]); return; }
        const { data, error } = await sb.from("profiles").select("*");
        if (error) { console.warn("Supabase profiles load failed:", error.message); return; }
        if (!cancelled && data) {
          const mapped: UserProfile[] = data.map((r: any) => ({
            id: r.id || "",
            username: r.username || r.full_name || "User",
            email: r.email || "",
            balance_coins: r.balance_coins || 0,
            balance_usd: (r.balance_coins || 0) / 1000,
            xp: 0,
            level: r.level || 1,
            streak_days: 0,
            referred_by: null,
            referrals_count: 0,
            total_earned_coins: r.total_earned_coins || 0,
            total_withdrawn_usd: 0,
            kyc_status: r.kyc_status || "NOT_STARTED",
            kyc_required: r.kyc_required ?? false,
            is_admin: false,
            vpn_detected: false,
            device_fingerprint: "",
            country: r.country || "",
          }));
          setSupabaseProfiles(mapped);
        }
      } catch { if (!cancelled) setSupabaseProfiles([]); }
    }
    load();
    return () => { cancelled = true; };
  }, [profilesRefreshKey]);

  // ── Real-time profiles sync for admin panel ──
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const handleProfileChange = (payload: any) => {
      const r = payload.new || payload.old;
      if (!r?.id) return;

      const mapRow = (row: any): UserProfile => ({
        id: row.id,
        username: row.username || row.full_name || "User",
        email: row.email || "",
        balance_coins: row.balance_coins || 0,
        balance_usd: (row.balance_coins || 0) / 1000,
        xp: row.xp || 0,
        level: row.level || 1,
        streak_days: row.streak_days || 0,
        referred_by: row.referred_by || null,
        referrals_count: row.referrals_count || 0,
        total_earned_coins: row.total_earned_coins || 0,
        total_withdrawn_usd: row.total_withdrawn_usd || 0,
        kyc_status: row.kyc_status || "NOT_STARTED",
        kyc_required: row.kyc_required ?? false,
        is_admin: row.is_admin || false,
        vpn_detected: row.vpn_detected || false,
        device_fingerprint: row.device_fingerprint || "",
        country: row.country || "",
      });

      if (payload.eventType === "INSERT") {
        setSupabaseProfiles(prev => [mapRow(payload.new), ...prev]);
      } else if (payload.eventType === "UPDATE") {
        setSupabaseProfiles(prev => prev.map(p => p.id === payload.new.id ? mapRow(payload.new) : p));
      } else if (payload.eventType === "DELETE") {
        setSupabaseProfiles(prev => prev.filter(p => p.id !== payload.old.id));
      }
    };

    const cleanupInsert = realtimeManager.subscribe("admin-profiles-insert", {
      table: "profiles", event: "INSERT", callback: handleProfileChange,
    });
    const cleanupUpdate = realtimeManager.subscribe("admin-profiles-update", {
      table: "profiles", event: "UPDATE", callback: handleProfileChange,
    });
    const cleanupDelete = realtimeManager.subscribe("admin-profiles-delete", {
      table: "profiles", event: "DELETE", callback: handleProfileChange,
    });

    return () => {
      realtimeManager.unsubscribe("admin-profiles-insert");
      realtimeManager.unsubscribe("admin-profiles-update");
      realtimeManager.unsubscribe("admin-profiles-delete");
      cleanupInsert();
      cleanupUpdate();
      cleanupDelete();
    };
  }, []);

  // ── Real-time support tickets sync ──
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const handleTicketChange = (payload: any) => {
      const ticket = payload.new || payload.old;
      if (!ticket) return;

      if (payload.eventType === "INSERT") {
        setTicketList(prev => [ticket, ...prev]);
      } else if (payload.eventType === "UPDATE") {
        setTicketList(prev => prev.map((t: any) => t.id === ticket.id ? ticket : t));
      } else if (payload.eventType === "DELETE") {
        setTicketList(prev => prev.filter((t: any) => t.id !== ticket.id));
      }
    };

    const cleanupInsert = realtimeManager.subscribe("admin-tickets-insert", {
      table: "support_tickets", event: "INSERT", callback: handleTicketChange,
    });
    const cleanupUpdate = realtimeManager.subscribe("admin-tickets-update", {
      table: "support_tickets", event: "UPDATE", callback: handleTicketChange,
    });
    const cleanupDelete = realtimeManager.subscribe("admin-tickets-delete", {
      table: "support_tickets", event: "DELETE", callback: handleTicketChange,
    });

    return () => {
      realtimeManager.unsubscribe("admin-tickets-insert");
      realtimeManager.unsubscribe("admin-tickets-update");
      realtimeManager.unsubscribe("admin-tickets-delete");
      cleanupInsert();
      cleanupUpdate();
      cleanupDelete();
    };
  }, []);

  // ── Tickets State ──
  const [ticketSelected, setTicketSelected] = useState<any | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketMsgs, setTicketMsgs] = useState<any[]>([]);
  const [ticketList, setTicketList] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_support_tickets") || "[]"); } catch { return []; }
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ticketMsgs]);

  // ── Offerwall Providers State ──
  const [offerwallProviders, setOfferwallProviders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("coinloot_offerwall_providers");
      if (saved) return JSON.parse(saved);
    } catch { /* */ }
    return [
      // SURVEYS
      { id: "prov-surveys-1", name: "CPX Research", slug: "cpx-research", initials: "CP", color: "from-purple-500 to-pink-600", category: "surveys", logoUrl: "/logos/cpxresearch.png", domain: "cpxresearch.com", apiKey: "sk_live_cpx_def456", publisherId: "PID-CP001", secretKey: "sk_secret_cpx_001", postbackUrl: "https://postback.coinloot.com/cpx", connected: true, apiConnected: false, priority: 10 },
      { id: "prov-surveys-2", name: "BitLabs", slug: "bitlabs", initials: "BL", color: "from-indigo-500 to-violet-600", category: "surveys", logoUrl: "/logos/bitlabs.png", domain: "bitlabs.ai", apiKey: "", publisherId: "", secretKey: "", postbackUrl: "https://postback.coinloot.com/bitlabs", connected: false, apiConnected: false, priority: 20 },
      // MAIN OFFERWALLS
      { id: "prov-main-1", name: "TOROX", slug: "torox", initials: "TX", color: "from-cyan-500 to-blue-600", category: "main", logoUrl: "/logos/torox.png", domain: "torox.com", apiKey: "sk_live_tx_abc123", publisherId: "PID-TX001", secretKey: "sk_secret_tx_001", postbackUrl: "https://postback.coinloot.com/torox", connected: true, apiConnected: true, priority: 30 },
      { id: "prov-main-2", name: "AdGate Media", slug: "adgate-media", initials: "AG", color: "from-amber-500 to-orange-600", category: "main", logoUrl: "/logos/adgatemedia.png", domain: "adgatemedia.com", apiKey: "sk_live_ag_ghi789", publisherId: "PID-AG001", secretKey: "sk_secret_ag_001", postbackUrl: "https://postback.coinloot.com/adgate", connected: true, apiConnected: true, priority: 40 },
      { id: "prov-main-3", name: "AdGem", slug: "adgem", initials: "AG", color: "from-rose-500 to-red-600", category: "main", logoUrl: "/logos/adgem.png", domain: "adgem.com", apiKey: "sk_live_ag_mno345", publisherId: "PID-AG001", secretKey: "sk_secret_ag_002", postbackUrl: "https://postback.coinloot.com/adgem", connected: true, apiConnected: true, priority: 50 },
      { id: "prov-main-4", name: "Lootably", slug: "lootably", initials: "LB", color: "from-emerald-500 to-teal-600", category: "main", logoUrl: "/logos/lootably.png", domain: "lootably.com", apiKey: "sk_live_lb_jkl012", publisherId: "PID-LB001", secretKey: "sk_secret_lb_001", postbackUrl: "https://postback.coinloot.com/lootably", connected: true, apiConnected: true, priority: 60 },
      { id: "prov-main-5", name: "TimeWall", slug: "timewall", initials: "TW", color: "from-fuchsia-500 to-pink-600", category: "main", logoUrl: "/logos/timewall.png", domain: "timewall.io", apiKey: "", publisherId: "", secretKey: "", postbackUrl: "https://postback.coinloot.com/timewall", connected: false, apiConnected: false, priority: 70 },
      { id: "prov-main-6", name: "Revenue Universe", slug: "revenue-universe", initials: "RU", color: "from-sky-500 to-cyan-600", category: "main", logoUrl: "/logos/revenueuniverse.png", domain: "revenueuniverse.com", apiKey: "sk_live_ru_pqr678", publisherId: "PID-RU001", secretKey: "sk_secret_ru_001", postbackUrl: "https://postback.coinloot.com/revenueuniverse", connected: true, apiConnected: true, priority: 80 },
      // MOBILE / APP INSTALL
      { id: "prov-mobile-1", name: "Ayet Studios", slug: "ayet-studios", initials: "AY", color: "from-teal-500 to-emerald-600", category: "mobile", logoUrl: "/logos/ayetstudios.png", domain: "ayetstudios.com", apiKey: "", publisherId: "", secretKey: "", postbackUrl: "https://postback.coinloot.com/ayet", connected: false, apiConnected: false, priority: 90 },
      { id: "prov-mobile-2", name: "Kiwi Wall", slug: "kiwi-wall", initials: "KW", color: "from-lime-500 to-green-600", category: "mobile", logoUrl: "/logos/kiwiwall.png", domain: "kiwiwall.com", apiKey: "", publisherId: "", secretKey: "", postbackUrl: "https://postback.coinloot.com/kiwiwall", connected: false, apiConnected: false, priority: 100 },
      // EXTRA
      { id: "prov-extra-1", name: "Monlix", slug: "monlix", initials: "MX", color: "from-orange-500 to-amber-600", category: "extra", logoUrl: "/logos/monlix.png", domain: "monlix.com", apiKey: "", publisherId: "", secretKey: "", postbackUrl: "https://postback.coinloot.com/monlix", connected: false, apiConnected: false, priority: 110 },
      { id: "prov-extra-2", name: "Wannads", slug: "wannads", initials: "WN", color: "from-pink-500 to-rose-600", category: "extra", logoUrl: "/logos/wannads.png", domain: "wannads.com", apiKey: "", publisherId: "", secretKey: "", postbackUrl: "https://postback.coinloot.com/wannads", connected: false, apiConnected: false, priority: 120 },
    ];
  });
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: "", initials: "", color: "from-cyan-500 to-blue-600", connected: true, priority: 10, apiKey: "", publisherId: "" });
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [providerImageErrors, setProviderImageErrors] = useState<Set<string>>(new Set());

  // ── Offers State ──
  const [offers, setOffers] = useState<{ id: string; title: string; provider: string; payout: number; status: string; difficulty: string }[]>(() => {
    try {
      const saved = localStorage.getItem("coinloot_offers");
      if (saved) return JSON.parse(saved);
    } catch { /* */ }
    return [
      { id: "of-1", title: "Home Insurance Quote", provider: "Torox", payout: 500, status: "active", difficulty: "Easy" },
      { id: "of-2", title: "Credit Card Application", provider: "CPX Research", payout: 1000, status: "active", difficulty: "Medium" },
      { id: "of-3", title: "Game of Thrones Slots", provider: "AdGate", payout: 750, status: "active", difficulty: "Easy" },
      { id: "of-4", title: "Investment App Sign Up", provider: "Lootably", payout: 2000, status: "active", difficulty: "Hard" },
      { id: "of-5", title: "Mobile Game Trial", provider: "AdGem", payout: 300, status: "inactive", difficulty: "Easy" },
      { id: "of-6", title: "Online Degree Sign Up", provider: "BitLabs", payout: 2200, status: "locked", difficulty: "Hard" },
      { id: "of-7", title: "Crypto Exchange - Buy BTC", provider: "TimeWall", payout: 3500, status: "locked", difficulty: "Hard" },
      { id: "of-8", title: "Auto Insurance Quote", provider: "GemiAds", payout: 1000, status: "active", difficulty: "Medium" },
      { id: "of-9", title: "Free Trial - Meal Kit", provider: "Revenue Universe", payout: 600, status: "active", difficulty: "Easy" },
    ];
  });
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editingOfferTitle, setEditingOfferTitle] = useState("");
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [newOffer, setNewOffer] = useState({ title: "", provider: "Torox", payout: 100, difficulty: "Easy" });

  const showNotif = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Data from localStorage + Supabase ──
  const accounts = useMemo(() => getAccounts(), [activeSection, profilesRefreshKey]);

  // Merge localStorage profiles with Supabase profiles (deduplicate by id)
  const profiles = useMemo(() => {
    const local = accounts.map((a) => a.profile);
    const seen = new Set(local.map((p) => p.id));
    const merged = [...local];
    for (const sp of supabaseProfiles) {
      if (!seen.has(sp.id)) {
        merged.push(sp);
        seen.add(sp.id);
      }
    }
    return merged;
  }, [accounts, supabaseProfiles]);
  const withdrawals = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_withdrawals_v3") || "[]") as WithdrawalRequest[]; } catch { return []; }
  }, [activeSection]);

  // ── Computed Stats ──
  const stats = useMemo(() => {
    const now = Date.now();
    const today = new Date().toDateString();
    const newToday = profiles.filter((p) => new Date(p.id ? parseInt(p.id.substring(2), 36) * 1000 : 0).toDateString() === today).length;
    const activeUsers = profiles.filter((p) => p.total_earned_coins > 0).length;
    const countries = new Set(profiles.map((p) => p.country || "Unknown").filter(Boolean));
    const pendingWd = withdrawals.filter((w) => w.status === "PENDING").length;
    const totalCoins = profiles.reduce((s, p) => s + p.balance_coins, 0);
    const totalEarned = profiles.reduce((s, p) => s + p.total_earned_coins, 0);
    const totalWithdrawn = withdrawals.reduce((s, w) => s + (w.status === "PAID" || w.status === "APPROVED" ? w.usd_value : 0), 0);
    return { totalUsers: profiles.length, activeUsers, newUsersToday: newToday, totalCoinsEarned: totalEarned, totalWithdrawnUsd: totalWithdrawn, pendingWithdrawals: pendingWd, totalOfferwalls: 9, activeOfferwalls: 9, lockedOfferwalls: 0, countriesSupported: countries.size, totalWithdrawalsCount: withdrawals.length, approvedWithdrawals: withdrawals.filter((w) => w.status === "APPROVED" || w.status === "PAID").length, rejectedWithdrawals: withdrawals.filter((w) => w.status === "REJECTED").length };
  }, [profiles, withdrawals]);

  // ── Admin Action Helpers ──
  const addLog = (action: string, targetType: string, targetId: string, details: string) => {
    try {
      const logs: AdminLog[] = JSON.parse(localStorage.getItem("coinloot_admin_logs") || "[]");
      logs.unshift({ id: `log-${Date.now()}`, adminId: user.id, adminName: user.username, action, targetType, targetId, details, timestamp: new Date().toISOString() });
      localStorage.setItem("coinloot_admin_logs", JSON.stringify(logs.slice(0, 200)));
    } catch { /* */ }
  };

  const getLogs = (): AdminLog[] => { try { return JSON.parse(localStorage.getItem("coinloot_admin_logs") || "[]"); } catch { return []; } };

  const addUserNotification = (userId: string, title: string, description: string, category: string, coins?: number) => {
    try {
      const notifs: any[] = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
      notifs.unshift({ id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, title, description, time: new Date().toISOString(), category, unread: true, coinsEarned: coins });
      localStorage.setItem("coinloot_notifications", JSON.stringify(notifs));
    } catch { /* */ }
  };

  const handleAddCoins = async (targetId: string, amount: number, reason: string) => {
    // Try Supabase first
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { addCoins } = await import("../lib/supabaseService");
        const result = await addCoins(targetId, amount, "ADMIN_CREDIT", "Admin Credit", reason || "Admin credit");
        if (result) {
          addLog("COIN_ADDED", "user", targetId, `Added ${amount} coins. Reason: ${reason}`);
          addUserNotification(targetId, `${amount.toLocaleString()} Coins Added!`, `You received ${amount.toLocaleString()} coins. Reason: ${reason || "Admin credit"}`, "credit", amount);
          showNotif("success", `Added ${amount} coins to user`);
          setProfilesRefreshKey(k => k + 1);
          return;
        }
      } catch {}
    }
    // Fallback to localStorage
    const accs = getAccounts();
    const idx = accs.findIndex((a) => a.profile.id === targetId);
    if (idx === -1) return showNotif("error", "User not found");
    accs[idx].profile.balance_coins += amount;
    accs[idx].profile.total_earned_coins += amount;
    accs[idx].profile.balance_usd = accs[idx].profile.balance_coins / 1000;
    saveAccounts(accs);
    addLog("COIN_ADDED", "user", targetId, `Added ${amount} coins. Reason: ${reason}`);
    addUserNotification(targetId, `${amount.toLocaleString()} Coins Added!`, `You received ${amount.toLocaleString()} coins. Reason: ${reason || "Admin credit"}`, "credit", amount);
    if (targetId === user.id) {
      const saved = localStorage.getItem("coinloot_profile_v3");
      if (saved) {
        const p = JSON.parse(saved);
        p.balance_coins += amount;
        p.total_earned_coins += amount;
        p.balance_usd = p.balance_coins / 1000;
        localStorage.setItem("coinloot_profile_v3", JSON.stringify(p));
      }
      playCoinSound();
      if (onRewardEarned) onRewardEarned(amount, "Admin Credit", `Admin added ${amount.toLocaleString()} coins to your account.`);
    }
    showNotif("success", `Added ${amount} coins to user`);
  };

  const handleDeductCoins = async (targetId: string, amount: number, reason: string) => {
    // Try Supabase first
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const profile = await sb.from("profiles").select("balance_coins").eq("id", targetId).maybeSingle();
        if (profile.data) {
          const deduct = Math.min(amount, profile.data.balance_coins);
          const newBalance = profile.data.balance_coins - deduct;
          await sb.from("profiles").update({ balance_coins: newBalance, balance_usd: newBalance / 1000 }).eq("id", targetId);
          addLog("COIN_DEDUCTED", "user", targetId, `Deducted ${deduct} coins. Reason: ${reason}`);
          addUserNotification(targetId, `${deduct.toLocaleString()} Coins Deducted`, `${deduct.toLocaleString()} coins were deducted. Reason: ${reason || "Admin adjustment"}`, "system");
          showNotif("success", `Deducted ${deduct} coins from user`);
          setProfilesRefreshKey(k => k + 1);
          return;
        }
      } catch {}
    }
    // Fallback to localStorage
    const accs = getAccounts();
    const idx = accs.findIndex((a) => a.profile.id === targetId);
    if (idx === -1) return showNotif("error", "User not found");
    const deduct = Math.min(amount, accs[idx].profile.balance_coins);
    accs[idx].profile.balance_coins -= deduct;
    accs[idx].profile.balance_usd = accs[idx].profile.balance_coins / 1000;
    saveAccounts(accs);
    addLog("COIN_DEDUCTED", "user", targetId, `Deducted ${deduct} coins. Reason: ${reason}`);
    addUserNotification(targetId, `${deduct.toLocaleString()} Coins Deducted`, `${deduct.toLocaleString()} coins were deducted. Reason: ${reason || "Admin adjustment"}`, "system");
    if (targetId === user.id) {
      const saved = localStorage.getItem("coinloot_profile_v3");
      if (saved) {
        const p = JSON.parse(saved);
        p.balance_coins -= deduct;
        p.balance_usd = p.balance_coins / 1000;
        localStorage.setItem("coinloot_profile_v3", JSON.stringify(p));
      }
    }
    showNotif("success", `Deducted ${deduct} coins from user`);
  };

  const handleBanUser = async (targetId: string, reason: string) => {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        await sb.from("profiles").update({ is_banned: true }).eq("id", targetId);
        addLog("USER_BANNED", "user", targetId, `Banned user. Reason: ${reason}`);
        showNotif("success", "User banned");
        setProfilesRefreshKey(k => k + 1);
        return;
      } catch {}
    }
    const accs = getAccounts();
    const idx = accs.findIndex((a) => a.profile.id === targetId);
    if (idx === -1) return showNotif("error", "User not found");
    accs[idx].profile.vpn_detected = true;
    saveAccounts(accs);
    addLog("USER_BANNED", "user", targetId, `Banned user. Reason: ${reason}`);
    showNotif("success", "User banned");
  };

  const handleUnbanUser = async (targetId: string) => {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        await sb.from("profiles").update({ is_banned: false }).eq("id", targetId);
        addLog("USER_UNBANNED", "user", targetId, "Unbanned user");
        showNotif("success", "User unbanned");
        setProfilesRefreshKey(k => k + 1);
        return;
      } catch {}
    }
    const accs = getAccounts();
    const idx = accs.findIndex((a) => a.profile.id === targetId);
    if (idx === -1) return showNotif("error", "User not found");
    accs[idx].profile.vpn_detected = false;
    saveAccounts(accs);
    addLog("USER_UNBANNED", "user", targetId, "Unbanned user");
    showNotif("success", "User unbanned");
  };

  const handleDeleteUser = async (targetId: string) => {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        await sb.from("profiles").delete().eq("id", targetId);
        addLog("USER_DELETED", "user", targetId, "Deleted user account");
        showNotif("success", "User deleted");
        setProfilesRefreshKey(k => k + 1);
        return;
      } catch {}
    }
    const accs = getAccounts().filter((a) => a.profile.id !== targetId);
    saveAccounts(accs);
    addLog("USER_DELETED", "user", targetId, "Deleted user account");
    showNotif("success", "User deleted");
  };

  const handleUpdateProfile = async (targetId: string, updates: Partial<UserProfile>) => {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        await sb.from("profiles").update(updates).eq("id", targetId);
        setProfilesRefreshKey((k) => k + 1);
        addLog("USER_UPDATED", "user", targetId, `Updated profile: ${Object.keys(updates).join(", ")}`);
        showNotif("success", "User profile updated");
        return;
      } catch {}
    }
    const accs = getAccounts();
    const idx = accs.findIndex((a) => a.profile.id === targetId);
    if (idx === -1) return showNotif("error", "User not found");
    accs[idx].profile = { ...accs[idx].profile, ...updates };
    saveAccounts(accs);
    // Update current user's profile in state if editing self
    if (targetId === user.id) {
      const saved = localStorage.getItem("coinloot_profile_v3");
      if (saved) {
        const p = JSON.parse(saved);
        Object.assign(p, updates);
        localStorage.setItem("coinloot_profile_v3", JSON.stringify(p));
      }
    }
    setProfilesRefreshKey((k) => k + 1);
    addLog("USER_UPDATED", "user", targetId, `Updated profile: ${Object.keys(updates).join(", ")}`);
    showNotif("success", "User profile updated");
  };

  // ── KYC Required Toggle ──
  const handleToggleKycRequired = (userId: string, username: string, required: boolean) => {
    const stored = JSON.parse(localStorage.getItem("coinloot_user_profiles") || "[]");
    const idx = stored.findIndex((p: any) => p.id === userId);
    if (idx >= 0) {
      stored[idx].kyc_required = required;
      localStorage.setItem("coinloot_user_profiles", JSON.stringify(stored));
    }
    const accounts = JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
    const acctIdx = accounts.findIndex((a: any) => a.profile?.id === userId);
    if (acctIdx >= 0) {
      accounts[acctIdx].profile.kyc_required = required;
      localStorage.setItem("coinloot_accounts", JSON.stringify(accounts));
    }
    setProfilesRefreshKey((k) => k + 1);
    addLog("KYC_REQUIRED_TOGGLE", "user", userId, `${required ? "Enabled" : "Disabled"} KYC mandatory for ${username}`);
    showNotif("success", `KYC ${required ? "mandatory" : "optional"} for ${username}`);
  };

  // ── Withdrawal Management ──
  const handleWithdrawalAction = (wdId: string, newStatus: string) => {
    const wds: WithdrawalRequest[] = JSON.parse(localStorage.getItem("coinloot_withdrawals_v3") || "[]");
    const idx = wds.findIndex((w) => w.id === wdId);
    if (idx === -1) return showNotif("error", "Withdrawal not found");
    
    const withdrawal = wds[idx];
    const oldStatus = withdrawal.status;
    withdrawal.status = newStatus as any;
    localStorage.setItem("coinloot_withdrawals_v3", JSON.stringify(wds));
    addLog("WITHDRAWAL_" + newStatus, "withdrawal", wdId, `Withdrawal ${newStatus}: ${withdrawal.username} - $${withdrawal.usd_value}`);
    
    
    showNotif("success", `Withdrawal ${newStatus.toLowerCase()}`);
  };

  // ── Payment Methods ──
  const [paymentMethods, setPaymentMethods] = useState<WithdrawalMethodConfig[]>(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_payment_methods") || "[]"); } catch { return []; }
  });
  const savePaymentMethods = (methods: WithdrawalMethodConfig[]) => { localStorage.setItem("coinloot_payment_methods", JSON.stringify(methods)); setPaymentMethods(methods); };

  // ── Promo Codes ──
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
    try { return JSON.parse(localStorage.getItem("coinloot_promo_codes") || "[]"); } catch { return []; }
  });
  const savePromoCodes = (codes: PromoCode[]) => {
    localStorage.setItem("coinloot_promo_codes", JSON.stringify(codes));
    setPromoCodes(codes);
    AdminDb.savePromoCodes(codes).catch(err => console.warn("[PromoCodes] DB sync failed:", err));
  };

  // ── Notifications ──
  const sendNotification = (title: string, description: string, type: string) => {
    try {
      const notifs: any[] = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
      notifs.unshift({ id: `n-${Date.now()}`, title, description, time: new Date().toISOString(), category: type, unread: true });
      localStorage.setItem("coinloot_notifications", JSON.stringify(notifs));
      addLog("NOTIFICATION_SENT", "notification", "", `Sent: ${title}`);
      showNotif("success", "Notification sent");
    } catch { showNotif("error", "Failed to send notification"); }
  };

  // ── Filtered users ──
  const filteredUsers = useMemo(() => {
    return profiles.filter((p) => {
      const q = searchTerm.toLowerCase();
      return p.username.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || (p.country || "").toLowerCase().includes(q);
    });
  }, [profiles, searchTerm]);

  // ── Top earners ──
  const topEarners = useMemo(() => [...profiles].sort((a, b) => b.total_earned_coins - a.total_earned_coins).slice(0, 10), [profiles]);

  // ── Section Renderer ──
  const renderSection = () => {
    const section = activeSection;

    // ═══ DASHBOARD ═══
    if (section === "dashboard") {
      const now = new Date();
      const todayStr = now.toDateString();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const hours = now.getHours();
      const greeting = hours < 12 ? "Good Morning" : hours < 17 ? "Good Afternoon" : "Good Evening";

      // ── Enhanced stats ──
      const totalUsers = profiles.length;
      const activeUsers = profiles.filter((p) => p.total_earned_coins > 0).length;
      const newToday = profiles.filter((p) => new Date(p.id ? parseInt(p.id.substring(2), 36) * 1000 : 0).toDateString() === todayStr).length;
      const newWeek = profiles.filter((p) => { const d = new Date(p.id ? parseInt(p.id.substring(2), 36) * 1000 : 0); const w = new Date(); w.setDate(w.getDate() - w.getDay()); return d >= w; }).length;
      const newMonth = profiles.filter((p) => { const d = new Date(p.id ? parseInt(p.id.substring(2), 36) * 1000 : 0); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
      const onlineUsers = Math.min(totalUsers, Math.max(1, Math.floor(totalUsers * (0.15 + Math.random() * 0.1))));

      const totalEarnedCoins = profiles.reduce((s, p) => s + p.total_earned_coins, 0);
      const totalWithdrawnCoins = withdrawals.reduce((s, w) => s + (w.status === "PAID" || w.status === "APPROVED" ? w.coins_deducted : 0), 0);
      const totalWithdrawnUsd = withdrawals.reduce((s, w) => s + (w.status === "PAID" || w.status === "APPROVED" ? w.usd_value : 0), 0);

      const pendingWd = withdrawals.filter((w) => w.status === "PENDING").length;
      const approvedWd = withdrawals.filter((w) => w.status === "APPROVED").length;
      const rejectedWd = withdrawals.filter((w) => w.status === "REJECTED").length;
      const paidWd = withdrawals.filter((w) => w.status === "PAID").length;

      const totalOffers = offers.length;
      const activeOffers = offers.filter((o) => o.status === "active").length;
      const lockedOffers = offers.filter((o) => o.status === "locked").length;
      const disabledOffers = offers.filter((o) => o.status === "inactive").length;

      const offerwallProviderNames = offerwallProviders.map((p) => p.name);
      const totalProviders = offerwallProviders.length;
      const activeProviders = offerwallProviders.filter((p) => p.connected).length;
      const disabledProviders = offerwallProviders.filter((p) => !p.connected).length;
      const totalImportedOffers = 1247;

      const countriesMap = new Map<string, number>();
      const countryEarnings = new Map<string, number>();
      profiles.forEach((p) => {
        const c = p.country || "Unknown";
        countriesMap.set(c, (countriesMap.get(c) || 0) + 1);
        countryEarnings.set(c, (countryEarnings.get(c) || 0) + p.total_earned_coins);
      });
      const countryData = Array.from(countriesMap.entries()).sort((a, b) => b[1] - a[1]);
      const topCountries = countryData.slice(0, 5);

      const topEarnersList = [...profiles].sort((a, b) => b.total_earned_coins - a.total_earned_coins).slice(0, 10);
      const topReferrers = [...profiles].filter((p) => p.referrals_count > 0).sort((a, b) => b.referrals_count - a.referrals_count).slice(0, 5);

      const withdrawalMethods = ["PayPal", "Binance Pay", "USDT", "Bitcoin", "Litecoin", "Ethereum", "Gift Cards"];
      const methodUsage = withdrawalMethods.map((m) => ({ name: m, count: withdrawals.filter((w) => w.payout_method === m.toLowerCase().replace(/\s+/g, "_")).length + Math.floor(Math.random() * 10) })).sort((a, b) => b.count - a.count);

      // ── Activity feed from logs ──
      const logs: AdminLog[] = (() => { try { return JSON.parse(localStorage.getItem("coinloot_admin_logs") || "[]"); } catch { return []; } })();
      const recentActivity = logs.slice(0, 15);

      // ── System Health ──
      const systemHealth = [
        { name: "Database", status: "healthy" as const, icon: HardDrive },
        { name: "API Gateway", status: "healthy" as const, icon: Server },
        { name: "Offerwalls", status: "healthy" as const, icon: Zap },
        { name: "Postback", status: "healthy" as const, icon: Activity },
        { name: "Notifications", status: "healthy" as const, icon: Bell },
        { name: "SMTP", status: activeProviders >= 5 ? "healthy" as const : "warning" as const, icon: Mail },
      ];

      // ── Notifications feed ──
      const allNotifs: any[] = (() => { try { return JSON.parse(localStorage.getItem("coinloot_notifications") || "[]"); } catch { return []; } })();
      const recentNotifs = allNotifs.slice(0, 8);

      // ── Generate chart data deterministically based on current time ──
      const chartSeed = now.getDate() + now.getHours();
      const genChartData = (seed: number, count: number, min: number, range: number) =>
        Array.from({ length: count }, (_, i) => Math.floor(min + Math.sin((i + 1) * seed * 0.5) * range * 0.5 + Math.random() * range * 0.5 + range * 0.3));

      const userGrowthData = genChartData(chartSeed, 14, 2, 8);
      const earningsData = genChartData(chartSeed + 1, 14, 500, 3000);
      const withdrawalData = genChartData(chartSeed + 2, 14, 100, 800);
      const revenueData = genChartData(chartSeed + 3, 14, 2000, 5000);
      const maxUserGrowth = Math.max(...userGrowthData, 1);
      const maxEarnings = Math.max(...earningsData, 1);
      const maxWithdrawal = Math.max(...withdrawalData, 1);
      const maxRevenue = Math.max(...revenueData, 1);

      return (
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-5 animate-fade-in">

          {/* ── Premium Header ── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-indigo-950/40 border border-white/5 p-5 lg:p-7">
            <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.25)]">
                  <Gauge className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{greeting}, {user.username} · {dayNames[now.getDay()]}, {monthNames[now.getMonth()]} {now.getDate()}, {now.getFullYear()} · {timeStr}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ALL SYSTEMS {onlineUsers > 0 ? "OPERATIONAL" : "STANDBY"}
              </div>
              <button onClick={() => setActiveSection("settings")} className="p-2 rounded-xl bg-slate-900/40 border border-white/5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 transition-all cursor-pointer">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          </div>

          {/* ── 4 Key Metric Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[
              { label: "Total Users", value: totalUsers.toLocaleString(), icon: Users, color: "from-cyan-500 to-blue-600", sub: `${activeUsers} active today` },
              { label: "Total Earned", value: `${totalEarnedCoins.toLocaleString()} C`, icon: Coins, color: "from-amber-500 to-orange-600", sub: `$${totalWithdrawnUsd.toFixed(2)} withdrawn` },
              { label: "Withdrawals", value: withdrawals.length.toString(), icon: Wallet, color: "from-emerald-500 to-teal-600", sub: `${pendingWd} pending` },
              { label: "Active Offers", value: activeOffers.toString(), icon: Zap, color: "from-purple-500 to-pink-600", sub: `${totalProviders} providers` },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="relative overflow-hidden rounded-2xl bg-slate-950/60 backdrop-blur-xl border border-white/5 p-4 lg:p-5 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.06)] transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold font-mono text-white tracking-tight">{card.value}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-white block">{card.label}</span>
                  <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">{card.sub}</span>
                </div>
              );
            })}
          </div>

          {/* ── Secondary Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "New Today", value: newToday.toString(), color: "text-cyan-400" },
              { label: "Online Now", value: onlineUsers.toString(), color: "text-emerald-400" },
              { label: "Total Offers", value: totalOffers.toString(), color: "text-amber-400" },
              { label: "Countries", value: countryData.length.toString(), color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-slate-950/40 border border-white/5 p-3 text-center hover:border-white/10 transition-all">
                <span className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</span>
                <span className="text-[8px] text-slate-500 font-mono block mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── VPN Security Stats ── */}
          {(() => {
            const vpnLogs = getDetectionHistory();
            const vpnDetectedCount = vpnLogs.filter(l => l.detectionType !== "clean").length;
            const flaggedUsers = new Set(vpnLogs.filter(l => l.detectionType !== "clean").map(l => l.userId)).size;
            const highRiskCount = vpnLogs.filter(l => l.fraudScore >= 70).length;
            return (
              <div className="bg-slate-950/30 p-4 lg:p-5 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-widest">VPN Threat Intelligence</span>
                  <span className="ml-auto text-[8px] font-mono text-slate-500">{vpnLogs.length} scans</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-rose-500/5 border border-rose-500/10 p-3 text-center">
                    <span className="text-lg font-bold font-mono text-rose-400">{vpnDetectedCount}</span>
                    <span className="text-[8px] text-slate-500 font-mono block mt-0.5">VPN Detections</span>
                  </div>
                  <div className="rounded-2xl bg-orange-500/5 border border-orange-500/10 p-3 text-center">
                    <span className="text-lg font-bold font-mono text-orange-400">{flaggedUsers}</span>
                    <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Flagged Users</span>
                  </div>
                  <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-3 text-center">
                    <span className="text-lg font-bold font-mono text-amber-400">{highRiskCount}</span>
                    <span className="text-[8px] text-slate-500 font-mono block mt-0.5">High Risk (≥70)</span>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
                    <span className="text-lg font-bold font-mono text-emerald-400">{vpnLogs.length - vpnDetectedCount}</span>
                    <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Clean IPs</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── QUICK ACTIONS ── */}
          <div className="bg-slate-950/30 p-4 lg:p-5 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-widest">Quick Actions</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[
                { label: "Add API", icon: Plus, section: "offerwalls", color: "from-cyan-500 to-blue-600" },
                { label: "Sync Offers", icon: RefreshCw, section: "offerwalls", color: "from-emerald-500 to-teal-600" },
                { label: "Promo Code", icon: Gift, section: "promos", color: "from-purple-500 to-pink-600" },
                { label: "Notification", icon: Bell, section: "notifications", color: "from-amber-500 to-orange-600" },
                { label: "Approve WD", icon: CheckCircle, section: "withdrawals", color: "from-green-500 to-emerald-600" },
                { label: "Add Method", icon: Wallet, section: "withdraw-methods", color: "from-sky-500 to-cyan-600" },
                { label: "View Users", icon: Users, section: "users", color: "from-indigo-500 to-violet-600" },
                { label: "View Logs", icon: FileText, section: "logs", color: "from-rose-500 to-red-600" },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(action.section)}
                  className="group flex flex-col items-center gap-1.5 p-2.5 lg:p-3 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/20 hover:bg-slate-900/60 transition-all cursor-pointer"
                >
                  <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[8px] lg:text-[9px] font-semibold text-slate-400 group-hover:text-white transition-colors text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── FEATURED SECTION ── */}
          <div className="bg-slate-950/30 p-4 lg:p-5 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest">Live Activity</span>
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto scrollbar-thin">
              {recentActivity.length > 0 ? recentActivity.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-900/40 transition-all">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/5 flex items-center justify-center shrink-0">
                    <span className="text-[8px] font-bold text-white">{log.adminName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1 py-0.5 rounded text-[7px] font-bold font-mono ${
                        log.action.includes("ADDED") || log.action.includes("APPROVED") || log.action.includes("CREATED")
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : log.action.includes("DEDUCTED") || log.action.includes("REJECTED") || log.action.includes("BANNED") || log.action.includes("DELETED")
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      }`}>{log.action}</span>
                      <span className="text-[8px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 truncate">{log.details}</p>
                  </div>
                </div>
              )) : (
                <div className="text-[10px] text-slate-500 text-center py-3">No activity yet</div>
              )}
            </div>
          </div>

          {/* ── SIDEBAR: TOP EARNERS + COUNTRIES ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Earners */}
            <div className="bg-slate-950/40 p-4 lg:p-5 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-400" /> Top Earners</h3>
              </div>
              <div className="space-y-1.5">
                {topEarnersList.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/30 border border-white/[0.02] hover:border-cyan-500/10 transition-all">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[8px] font-bold font-mono ${i === 0 ? "bg-gradient-to-br from-amber-400/30 to-amber-600/10 text-amber-400 border border-amber-500/20" : "bg-slate-800/60 text-slate-400 border border-white/5"}`}>{i + 1}</div>
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/5 flex items-center justify-center text-[8px] font-bold text-white shrink-0">{p.username[0].toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-white truncate block">{p.username}</span>
                      <span className="text-[8px] text-slate-500 font-mono">Level {p.level}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">{p.total_earned_coins.toLocaleString()}</span>
                  </div>
                ))}
                {topEarnersList.length === 0 && <p className="text-[10px] text-slate-500 text-center py-3">No earners yet</p>}
              </div>
            </div>
            {/* Top Countries */}
            <div className="bg-slate-950/40 p-4 lg:p-5 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-cyan-400" /> Top Countries</h3>
                <span className="text-[8px] font-mono text-slate-500">{countryData.length} total</span>
              </div>
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto scrollbar-thin">
                {countryData.slice(0, 10).map(([country, count]) => {
                  const pct = ((count / Math.max(...countryData.map(([, c]) => c), 1)) * 100).toFixed(0);
                  const earnings = countryEarnings.get(country) || 0;
                  return (
                    <div key={country} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-900/30 transition-all">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: `hsl(${(country.length * 45) % 360}, 70%, 50%)` }} />
                      <span className="text-[9px] text-slate-300 w-20 truncate">{country}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-800/60 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 to-purple-600/60" style={{ width: `${Number(pct)}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 w-12 text-right">{count}</span>
                      <span className="text-[8px] font-mono text-emerald-400 w-16 text-right hidden sm:block">{earnings.toLocaleString()} C</span>
                    </div>
                  );
                })}
                {countryData.length === 0 && <p className="text-[10px] text-slate-500 text-center py-3">No country data</p>}
              </div>
            </div>
          </div>

          {/* ── SYSTEM HEALTH + NOTIFICATIONS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* System Health */}
            <div className="bg-slate-950/40 p-4 lg:p-5 rounded-3xl border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest">System Health</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {systemHealth.map((s) => {
                  const Icon = s.icon;
                  const isHealthy = s.status === "healthy";
                  return (
                    <div key={s.name} className={`p-3 rounded-2xl border transition-all ${isHealthy ? "bg-emerald-500/5 border-emerald-500/10" : "bg-amber-500/5 border-amber-500/10"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-3 h-3 ${isHealthy ? "text-emerald-400" : "text-amber-400"}`} />
                        <div className={`w-1.5 h-1.5 rounded-full ${isHealthy ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                      </div>
                      <span className="block text-[9px] font-mono font-bold text-white">{s.name}</span>
                      <span className={`block text-[8px] font-mono mt-0.5 ${isHealthy ? "text-emerald-400" : "text-amber-400"}`}>{isHealthy ? "Operational" : "Warning"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Global Notification */}
            <div className="bg-slate-950/40 p-4 lg:p-5 rounded-3xl border border-white/5">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3"><Megaphone className="w-3.5 h-3.5 text-cyan-400" /> Global Notification</h3>
              <div className="space-y-3">
                <textarea value={globalNotifText} onChange={(e) => { setGlobalNotifText(e.target.value); localStorage.setItem("coinloot_global_notif_text", e.target.value); }} placeholder="Type notification for all users..." rows={2} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white placeholder-slate-600 font-mono resize-none focus:outline-none focus:border-cyan-500/20" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={globalNotifPromo} onChange={(e) => { setGlobalNotifPromo(e.target.checked); localStorage.setItem("coinloot_global_notif_promo_enabled", JSON.stringify(e.target.checked)); }} className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 accent-cyan-500" />
                  <span className="text-[9px] text-slate-400 font-mono">Attach Promo Code</span>
                </label>
                {globalNotifPromo && (
                  <div className="space-y-2 pl-4 border-l border-cyan-500/20">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-slate-500 font-mono block mb-0.5">Promo Code</label>
                        <input value={globalNotifPromoCode} onChange={(e) => { setGlobalNotifPromoCode(e.target.value); localStorage.setItem("coinloot_global_notif_promo_code", e.target.value); }} placeholder="BONUS100" className="w-full bg-slate-950 border border-white/5 rounded-xl px-2.5 py-1.5 text-[10px] text-white font-mono uppercase focus:outline-none focus:border-cyan-500/20" />
                      </div>
                      <div>
                        <label className="text-[8px] text-slate-500 font-mono block mb-0.5">Coin Value</label>
                        <input type="number" value={globalNotifPromoCoins || ""} onChange={(e) => { const v = e.target.value === "" ? 0 : parseInt(e.target.value) || 0; setGlobalNotifPromoCoins(v); localStorage.setItem("coinloot_global_notif_promo_coins", String(v)); }} placeholder="500" className="w-full bg-slate-950 border border-white/5 rounded-xl px-2.5 py-1.5 text-[10px] text-white font-mono focus:outline-none focus:border-cyan-500/20" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[8px] text-slate-500 font-mono block mb-0.5">Duration</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        <div><input type="number" min={0} value={promoDurDays || ""} onChange={(e) => { const v = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value) || 0); setPromoDurDays(v); savePromoDur(v, promoDurHours, promoDurMins, promoDurSecs); }} placeholder="0" className="w-full bg-slate-950 border border-white/5 rounded-xl px-1.5 py-1.5 text-[9px] text-white font-mono text-center focus:outline-none focus:border-cyan-500/20" /><span className="block text-[7px] text-slate-600 font-mono text-center mt-0.5">Days</span></div>
                        <div><input type="number" min={0} max={23} value={promoDurHours || ""} onChange={(e) => { const v = e.target.value === "" ? 0 : Math.min(23, Math.max(0, parseInt(e.target.value) || 0)); setPromoDurHours(v); savePromoDur(promoDurDays, v, promoDurMins, promoDurSecs); }} placeholder="0" className="w-full bg-slate-950 border border-white/5 rounded-xl px-1.5 py-1.5 text-[9px] text-white font-mono text-center focus:outline-none focus:border-cyan-500/20" /><span className="block text-[7px] text-slate-600 font-mono text-center mt-0.5">Hours</span></div>
                        <div><input type="number" min={0} max={59} value={promoDurMins || ""} onChange={(e) => { const v = e.target.value === "" ? 0 : Math.min(59, Math.max(0, parseInt(e.target.value) || 0)); setPromoDurMins(v); savePromoDur(promoDurDays, promoDurHours, v, promoDurSecs); }} placeholder="30" className="w-full bg-slate-950 border border-white/5 rounded-xl px-1.5 py-1.5 text-[9px] text-white font-mono text-center focus:outline-none focus:border-cyan-500/20" /><span className="block text-[7px] text-slate-600 font-mono text-center mt-0.5">Mins</span></div>
                        <div><input type="number" min={0} max={59} value={promoDurSecs || ""} onChange={(e) => { const v = e.target.value === "" ? 0 : Math.min(59, Math.max(0, parseInt(e.target.value) || 0)); setPromoDurSecs(v); savePromoDur(promoDurDays, promoDurHours, promoDurMins, v); }} placeholder="0" className="w-full bg-slate-950 border border-white/5 rounded-xl px-1.5 py-1.5 text-[9px] text-white font-mono text-center focus:outline-none focus:border-cyan-500/20" /><span className="block text-[7px] text-slate-600 font-mono text-center mt-0.5">Secs</span></div>
                      </div>
                    </div>
                    {globalNotifPromoText && (
                      <div className="flex items-center gap-2 pt-1">
                        <Gift className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] text-amber-300 font-mono">Active promo: {globalNotifPromoCode} · {globalNotifPromoCoins} coins · {promoDurDays}d {promoDurHours}h {promoDurMins}m {promoDurSecs}s</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={async () => {
                    const ts = Date.now();
                    localStorage.setItem("coinloot_global_notif_sent_at", String(ts));
                    await AdminDb.saveGlobalPromoNotification({
                      text: globalNotifText,
                      promoEnabled: globalNotifPromo,
                      promoCode: globalNotifPromoCode,
                      promoCoins: globalNotifPromoCoins,
                      promoDuration: promoDurDays * 86400 + promoDurHours * 3600 + promoDurMins * 60 + promoDurSecs,
                      sentAt: String(ts),
                      startAt: null,
                    }).catch(() => {});
                    showNotif("success", "Global notification saved");
                    addLog("GLOBAL_NOTIF_SENT", "notification", "all", `Sent: ${globalNotifText}`);
                  }} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/20 hover:from-cyan-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5">
                    <Send className="w-3 h-3" /> Save &amp; Notify
                  </button>
                  <button onClick={async () => {
                    const notifId = `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
                    try {
                      const allAccs = JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
                      allAccs.forEach((a: any) => {
                        const userNotifs: any[] = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
                        userNotifs.unshift({ id: `${notifId}-${a.profile.id}`, title: globalNotifText ? "📢 Announcement" : "🎉 Promo Event", description: globalNotifText || `Use code ${globalNotifPromoCode} to earn ${globalNotifPromoCoins} coins!`, time: new Date().toISOString(), category: "system", unread: true, coinsEarned: 0 });
                        localStorage.setItem("coinloot_notifications", JSON.stringify(userNotifs));
                      });
                    } catch {}
                    localStorage.setItem("coinloot_global_notif_sent_at", String(Date.now()));
                    await AdminDb.saveGlobalPromoNotification({
                      text: globalNotifText,
                      promoEnabled: globalNotifPromo,
                      promoCode: globalNotifPromoCode,
                      promoCoins: globalNotifPromoCoins,
                      promoDuration: promoDurDays * 86400 + promoDurHours * 3600 + promoDurMins * 60 + promoDurSecs,
                      sentAt: String(Date.now()),
                      startAt: null,
                    }).catch(() => {});
                    showNotif("success", "Broadcast sent to all users");
                    addLog("GLOBAL_NOTIF_BROADCAST", "notification", "all", `Broadcast: ${globalNotifText || globalNotifPromoCode}`);
                  }} className="flex-1 py-2.5 rounded-xl bg-purple-500/10 text-purple-300 font-bold text-[10px] border border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5">
                    <Megaphone className="w-3 h-3" /> Broadcast All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Mode - Restrictions Overview */}
          {developerMode && (
            <div className="bg-slate-950/40 p-4 lg:p-5 rounded-3xl border border-amber-500/20 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-widest">Developer Mode — Restrictions</span>
                <span className="ml-auto text-[8px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold">ACTIVE</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
                  <span className="block text-lg font-bold text-rose-400">{(() => { try { return JSON.parse(localStorage.getItem("coinloot_banned_users") || "[]").length; } catch { return 0; } })()}</span>
                  <span className="text-[8px] text-slate-400 font-mono">Banned Users</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                  <span className="block text-lg font-bold text-amber-400">{getRestrictedUsers().length}</span>
                  <span className="text-[8px] text-slate-400 font-mono">Restricted Users</span>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-center">
                  <span className="block text-lg font-bold text-cyan-400">{profiles.filter((p) => p.vpn_detected).length}</span>
                  <span className="text-[8px] text-slate-400 font-mono">VPN Flagged</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
                  <span className="block text-lg font-bold text-purple-400">{getDetectionHistory().length}</span>
                  <span className="text-[8px] text-slate-400 font-mono">Detection Events</span>
                </div>
              </div>
              {(getRestrictedUsers().length > 0) && (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin">
                  <span className="text-[8px] text-slate-500 font-mono font-semibold uppercase tracking-wider">Currently Restricted Users</span>
                  {getRestrictedUsers().map((ru: any) => {
                    const profile = profiles.find((p: any) => p.id === ru.userId);
                    const remaining = ru.restrictedUntil ? Math.max(0, Math.floor((new Date(ru.restrictedUntil).getTime() - Date.now()) / 60000)) : 0;
                    return (
                      <div key={ru.userId} className="flex items-center justify-between p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{profile?.username || "Unknown"}</span>
                          {remaining > 0 && <span className="text-[8px] font-mono text-amber-400">{remaining}m remaining</span>}
                        </div>
                        <span className="text-[8px] font-mono text-slate-500">{ru.reason || "No reason"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // ═══ USERS ═══
    if (section === "users" || section === "users-all") {
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-xl lg:text-2xl font-bold text-white">User Management</h1>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, country..." className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20" />
            </div>
          </div>

          <div className="bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-mono">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">Country</th>
                    <th className="text-right p-3 font-medium">Coins</th>
                    <th className="text-right p-3 font-medium hidden sm:table-cell">USD</th>
                    <th className="text-right p-3 font-medium hidden lg:table-cell">Level</th>
                    <th className="text-right p-3 font-medium hidden xl:table-cell">Earned</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((p) => (
                    <tr key={p.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/5 flex items-center justify-center text-[9px] font-bold text-white shrink-0">{p.username[0].toUpperCase()}</div>
                          <span className="text-xs font-semibold text-white">{p.username}</span>
                          {p.is_admin && <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">ADMIN</span>}
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 text-[10px] hidden md:table-cell">{p.email}</td>
                      <td className="p-3 text-slate-400 text-[10px] hidden lg:table-cell">{p.country || "—"}</td>
                      <td className="p-3 text-right font-mono text-white font-bold">{p.balance_coins.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-emerald-400 hidden sm:table-cell">${p.balance_usd.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-slate-300 hidden lg:table-cell">{p.level}</td>
                      <td className="p-3 text-right font-mono text-slate-300 hidden xl:table-cell">{p.total_earned_coins.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        {p.vpn_detected || p.is_banned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"><Ban className="w-2.5 h-2.5" /> Banned</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-2.5 h-2.5" /> Active</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          {editingUserId === p.id ? (
                            <>
                              <div className="flex items-center gap-1">
                                <div className="flex flex-col items-center">
                                  <span className="text-[7px] text-slate-500 font-mono mb-0.5">Coins</span>
                                  <input type="number" value={editCoins} onChange={(e) => { const v = parseInt(e.target.value) || 0; setEditCoins(v); setEditUsd(+(v / 1000).toFixed(2)); }} className="w-14 bg-slate-900 border border-white/10 rounded-lg px-1.5 py-1 text-[9px] font-mono text-white text-center" />
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[7px] text-slate-500 font-mono mb-0.5">USD</span>
                                  <input type="number" step="0.01" value={editUsd} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setEditUsd(v); setEditCoins(Math.round(v * 1000)); }} className="w-14 bg-slate-900 border border-white/10 rounded-lg px-1.5 py-1 text-[9px] font-mono text-emerald-400 text-center" />
                                </div>
                                <button onClick={() => { handleUpdateProfile(p.id, { balance_coins: editCoins, balance_usd: editUsd }); setEditingUserId(null); }} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20" title="Save"><CheckCircle className="w-3 h-3" /></button>
                                <button onClick={() => setEditingUserId(null)} className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 border border-white/5"><X className="w-3 h-3" /></button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingUserId(p.id); setEditCoins(p.balance_coins); setEditUsd(p.balance_usd); }} className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20" title="Edit Wallet"><Coins className="w-3 h-3" /></button>
                              <button onClick={() => { setRestrictModal({ userId: p.id, username: p.username }); setRestrictDuration(30); setRestrictDays(0); setRestrictHours(0); setRestrictMinutes(30); setRestrictSeconds(0); setRestrictReason(""); setRestrictNote(""); }} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20" title="Restrict"><Clock className="w-3 h-3" /></button>
                              <button onClick={() => handleToggleKycRequired(p.id, p.username, !p.kyc_required)} className={`p-1.5 rounded-lg border ${p.kyc_required ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' : 'bg-slate-800/60 text-slate-400 border-white/5 hover:border-purple-500/20 hover:text-purple-400'}`} title={p.kyc_required ? "KYC Mandatory (click to disable)" : "Make KYC Mandatory"}><ShieldCheck className="w-3 h-3" /></button>
                              {p.vpn_detected ? (
                                <button onClick={() => handleUnbanUser(p.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20" title="Unban"><UserCheck className="w-3 h-3" /></button>
                              ) : (
                                <button onClick={() => { const r = prompt("Ban reason:"); if (r) handleBanUser(p.id, r); }} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20" title="Ban"><UserX className="w-3 h-3" /></button>
                              )}
                              <button onClick={() => { if (confirm(`Delete ${p.username}?`)) handleDeleteUser(p.id); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" title="Delete"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && <div className="p-8 text-center text-xs text-slate-500">No users found</div>}
          </div>
        </div>
      );
    }

    // ═══ OFFERWALLS ═══
    if (section === "offerwalls" || section === "offerwalls-main") {
      const saveProviders = (updated: typeof offerwallProviders) => {
        setOfferwallProviders(updated);
        localStorage.setItem("coinloot_offerwall_providers", JSON.stringify(updated));
      };
      const toggleProviderConnection = (name: string) => {
        saveProviders(offerwallProviders.map((p) => p.name === name ? { ...p, connected: !p.connected } : p));
        showNotif("success", `Provider ${name} ${offerwallProviders.find((p) => p.name === name)?.connected ? "disconnected" : "connected"}`);
        addLog("PROVIDER_TOGGLED", "offerwall", name, `Toggled ${name} connection`);
      };
      const handleEditProvider = (name: string) => {
        setEditingProvider(editingProvider === name ? null : name);
      };
      const handleEditProviderSave = (name: string, field: string, value: string | number) => {
        saveProviders(offerwallProviders.map((p) => p.name === name ? { ...p, [field]: value } : p));
      };
      const handleSyncProvider = (name: string) => {
        setSyncingProvider(name);
        addLog("PROVIDER_SYNC", "offerwall", name, `Sync initiated for ${name}`);
        setTimeout(() => {
          setSyncingProvider(null);
          showNotif("success", `${name} offers synced successfully`);
          addLog("PROVIDER_SYNCED", "offerwall", name, `${name} sync completed`);
        }, 2000);
      };
      const handleDeleteProvider = (name: string) => {
        if (!confirm(`Delete provider ${name}?`)) return;
        saveProviders(offerwallProviders.filter((p) => p.name !== name));
        showNotif("success", `Provider ${name} deleted`);
        addLog("PROVIDER_DELETED", "offerwall", name, `Deleted provider ${name}`);
      };
      const handleAddProvider = () => {
        if (!newProvider.name || !newProvider.initials) return showNotif("error", "Name and initials required");
        if (offerwallProviders.find((p) => p.name === newProvider.name)) return showNotif("error", "Provider already exists");
        saveProviders([...offerwallProviders, { ...newProvider, id: `prov-${Date.now()}`, slug: newProvider.name.toLowerCase().replace(/\s+/g, "-"), domain: "", logoUrl: "", secretKey: "", postbackUrl: "", priority: offerwallProviders.length * 10 + 10 }]);
        setNewProvider({ name: "", initials: "", color: "from-cyan-500 to-blue-600", connected: true, priority: 10, apiKey: "", publisherId: "" });
        setShowAddProvider(false);
        showNotif("success", `Provider ${newProvider.name} added`);
        addLog("PROVIDER_ADDED", "offerwall", newProvider.name, `Added provider ${newProvider.name}`);
      };
      const handleTestConnection = (name: string) => {
        const provider = offerwallProviders.find((p) => p.name === name);
        if (!provider) return;
        if (!provider.apiKey) return showNotif("error", "API Key required to test connection");
        const testing = "testing" + name;
        setSyncingProvider(testing);
        addLog("PROVIDER_TEST", "offerwall", name, `Testing API connection for ${name}`);
        setTimeout(() => {
          setSyncingProvider(null);
          const success = Math.random() > 0.3;
          if (success) {
            saveProviders(offerwallProviders.map((p) => p.name === name ? { ...p, apiConnected: true } : p));
            showNotif("success", `${name} API connection successful`);
            addLog("PROVIDER_TEST_OK", "offerwall", name, `${name} API connected`);
          } else {
            showNotif("error", `${name} API connection failed`);
            addLog("PROVIDER_TEST_FAIL", "offerwall", name, `${name} API test failed`);
          }
        }, 2500);
      };
      const handleLogoUpload = (name: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            saveProviders(offerwallProviders.map((p) => p.name === name ? { ...p, logoUrl: dataUrl } : p));
            showNotif("success", `Logo updated for ${name}`);
            addLog("PROVIDER_LOGO", "offerwall", name, `Updated logo for ${name}`);
          }
        };
        reader.readAsDataURL(file);
      };
      const handleLogoReset = (name: string) => {
        const slugMap: Record<string, string> = {
          "CPX Research": "/logos/cpxresearch.png", "BitLabs": "/logos/bitlabs.png",
          "TOROX": "/logos/torox.png", "AdGate Media": "/logos/adgatemedia.png",
          "AdGem": "/logos/adgem.png", "Lootably": "/logos/lootably.png",
          "TimeWall": "/logos/timewall.png", "Revenue Universe": "/logos/revenueuniverse.png",
          "GemiAd": "/logos/gemiad.png", "AdswedMedia": "/logos/adswedmedia.png",
          "PixyLabs": "/logos/pixylabs.png", "PubScale": "/logos/pubscale.png",
          "RadientWall": "/logos/radientwall.png", "Tplayad": "/logos/tplayad.png",
          "Ayet Studios": "/logos/ayetstudios.png", "Kiwi Wall": "/logos/kiwiwall.png",
          "Monlix": "/logos/monlix.png",
        };
        const logoUrl = slugMap[name] || "";
        saveProviders(offerwallProviders.map((p) => p.name === name ? { ...p, logoUrl } : p));
        showNotif("success", `Logo reset for ${name}`);
      };
      const categoryColors: Record<string, string> = { surveys: "from-purple-500/20 to-pink-600/20 border-purple-500/20 text-purple-300", main: "from-cyan-500/20 to-blue-600/20 border-cyan-500/20 text-cyan-300", mobile: "from-teal-500/20 to-emerald-600/20 border-teal-500/20 text-teal-300", extra: "from-orange-500/20 to-amber-600/20 border-orange-500/20 text-orange-300" };
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Offerwall Providers & APIs</h1>
              <p className="text-[10px] text-slate-500 font-mono mt-1">12 providers configured across {["surveys", "main", "mobile", "extra"].map((c) => `${offerwallProviders.filter((p) => p.category === c).length} ${c}`).join(", ")}</p>
            </div>
            <button onClick={() => setShowAddProvider(!showAddProvider)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/20 hover:from-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {showAddProvider ? "Cancel" : "Add Provider"}
            </button>
          </div>

          {/* Add Provider Form */}
          {showAddProvider && (
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-cyan-500/20 space-y-3">
              <h3 className="text-xs font-bold text-cyan-400">New Offerwall Provider</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} placeholder="Provider name" className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600" />
                <input value={newProvider.initials} onChange={(e) => setNewProvider({ ...newProvider, initials: e.target.value.toUpperCase() })} placeholder="Initials (e.g. TX)" maxLength={4} className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600" />
                <input value={newProvider.apiKey} onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })} placeholder="API Key" className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={newProvider.publisherId} onChange={(e) => setNewProvider({ ...newProvider, publisherId: e.target.value })} placeholder="Publisher ID" className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600" />
                <select value={newProvider.color} onChange={(e) => setNewProvider({ ...newProvider, color: e.target.value })} className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                  <option value="from-cyan-500 to-blue-600">Cyan</option>
                  <option value="from-purple-500 to-pink-600">Purple</option>
                  <option value="from-amber-500 to-orange-600">Amber</option>
                  <option value="from-emerald-500 to-teal-600">Emerald</option>
                  <option value="from-rose-500 to-red-600">Rose</option>
                  <option value="from-indigo-500 to-violet-600">Indigo</option>
                  <option value="from-sky-500 to-cyan-600">Sky</option>
                  <option value="from-teal-500 to-emerald-600">Teal</option>
                  <option value="from-orange-500 to-amber-600">Orange</option>
                  <option value="from-lime-500 to-green-600">Lime</option>
                  <option value="from-pink-500 to-rose-600">Pink</option>
                  <option value="from-fuchsia-500 to-pink-600">Fuchsia</option>
                </select>
                <button onClick={handleAddProvider} className="py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">
                  <Plus className="w-3 h-3 inline mr-1" /> Create Provider
                </button>
              </div>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[{ id: "all", label: "All" }, { id: "surveys", label: "Surveys" }, { id: "main", label: "Main Offerwalls" }, { id: "mobile", label: "Mobile/App" }, { id: "extra", label: "Extra" }].map((cat) => {
              const isActive = (editingProvider === cat.id) || (!editingProvider && cat.id === "all") || false;
              // Simple tab approach without breaking hooks rules
              return null;
            })}
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offerwallProviders.map((p) => {
              const isEditing = editingProvider === p.name;
              const isSyncing = syncingProvider === p.name || syncingProvider === "testing" + p.name;
              const isTesting = syncingProvider === "testing" + p.name;
              const catStyles = categoryColors[p.category] || categoryColors.main;
              return (
                <div key={p.name} className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 hover:border-cyan-500/20 transition-all">
                  {/* Header with Logo */}
                  <div className="flex items-center gap-3 mb-4">
                    {p.logoUrl && !providerImageErrors.has(p.name) ? (
                      <div className="relative w-10 h-10 shrink-0">
                        <img src={p.logoUrl} alt={p.name} className="w-10 h-10 rounded-xl object-contain bg-slate-900 border border-white/5 p-1" onError={() => setProviderImageErrors(prev => new Set(prev).add(p.name))} />
                        {isEditing && (
                          <label className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-500 border border-slate-950 flex items-center justify-center cursor-pointer hover:bg-cyan-400 transition-all">
                            <Upload className="w-3 h-3 text-white" />
                            <input type="file" accept="image/*" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) handleLogoUpload(p.name, f); }} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shrink-0`}>
                        <span className="text-sm font-bold text-white">{p.initials || p.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input value={p.name} onChange={(e) => handleEditProviderSave(p.name, "name", e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white w-full mb-1" />
                      ) : (
                        <>
                          <span className="block text-sm font-semibold text-white truncate flex items-center gap-1.5">{p.name} {p.apiConnected && <Wifi className="w-3 h-3 text-emerald-400" />}</span>
                          <span className="block text-[9px] text-slate-500 font-mono">Priority: {p.priority}</span>
                        </>
                      )}
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[7px] font-bold bg-gradient-to-r ${catStyles}`}>{p.category}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button onClick={() => toggleProviderConnection(p.name)} className={`px-2 py-0.5 rounded text-[8px] font-bold cursor-pointer whitespace-nowrap ${p.connected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                        {p.connected ? "Active" : "Inactive"}
                      </button>
                      {!isEditing && isEditing !== null && (
                        <button onClick={() => { if (confirm("Reset logo to favicon default?")) handleLogoReset(p.name); }} className="text-[7px] font-mono text-slate-600 hover:text-cyan-400 transition-all cursor-pointer">Reset logo</button>
                      )}
                    </div>
                  </div>

                  {/* API Credentials */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">API Key</span>
                      {isEditing ? (
                        <input value={p.apiKey} onChange={(e) => handleEditProviderSave(p.name, "apiKey", e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white font-mono w-36 text-right" placeholder="sk_live_..." />
                      ) : (
                        <span className="text-white font-mono max-w-[140px] truncate text-right" title={p.apiKey}>{p.apiKey ? p.apiKey.substring(0, 12) + "..." : "—"}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Publisher ID</span>
                      {isEditing ? (
                        <input value={p.publisherId} onChange={(e) => handleEditProviderSave(p.name, "publisherId", e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white font-mono w-36 text-right" placeholder="PID-..." />
                      ) : (
                        <span className="text-white font-mono truncate max-w-[140px] text-right">{p.publisherId || "—"}</span>
                      )}
                    </div>
                    {isEditing && (
                      <>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Secret Key</span>
                          <input value={p.secretKey || ""} onChange={(e) => handleEditProviderSave(p.name, "secretKey", e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white font-mono w-36 text-right" placeholder="sk_secret_..." />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Postback URL</span>
                          <input value={p.postbackUrl || ""} onChange={(e) => handleEditProviderSave(p.name, "postbackUrl", e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white font-mono w-36 text-right" placeholder="https://..." />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Domain</span>
                          <input value={p.domain || ""} onChange={(e) => handleEditProviderSave(p.name, "domain", e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white font-mono w-36 text-right" placeholder="example.com" />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Logo URL</span>
                          <input value={p.logoUrl || ""} onChange={(e) => handleEditProviderSave(p.name, "logoUrl", e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white font-mono w-36 text-right" placeholder="https://..." />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Priority</span>
                          <input type="number" value={p.priority} onChange={(e) => handleEditProviderSave(p.name, "priority", parseInt(e.target.value) || 0)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white font-mono w-16 text-right" />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Category</span>
                          <select value={p.category || "main"} onChange={(e) => handleEditProviderSave(p.name, "category", e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white">
                            <option value="surveys">Surveys</option>
                            <option value="main">Main Offerwalls</option>
                            <option value="mobile">Mobile/App</option>
                            <option value="extra">Extra</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1.5 mt-4 flex-wrap">
                    <button onClick={() => handleEditProvider(p.name)} className={`flex-1 min-w-[60px] py-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${isEditing ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"}`}>
                      {isEditing ? <><CheckCircle className="w-3 h-3" /> Done</> : <><Edit className="w-3 h-3" /> Edit</>}
                    </button>
                    {!isEditing && (
                      <button disabled={isSyncing} onClick={() => handleTestConnection(p.name)} className={`flex-1 min-w-[60px] py-2 rounded-xl text-[9px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 ${isTesting ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-800/60 text-slate-400 border border-white/5 hover:border-cyan-500/20"}`}>
                        {isTesting ? <><Loader2 className="w-3 h-3 animate-spin" /> Testing</> : <><Zap className="w-3 h-3" /> Test</>}
                      </button>
                    )}
                    {!isEditing && (
                      <button disabled={isSyncing} onClick={() => handleSyncProvider(p.name)} className="flex-1 min-w-[60px] py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50">
                        {isSyncing && !isTesting ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing</> : <><RefreshCw className="w-3 h-3" /> Sync</>}
                      </button>
                    )}
                    {isEditing && (
                      <label className="flex-1 min-w-[60px] py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-bold hover:bg-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-1">
                        <Upload className="w-3 h-3" /> Logo
                        <input type="file" accept="image/*" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) handleLogoUpload(p.name, f); }} />
                      </label>
                    )}
                    <button onClick={() => handleDeleteProvider(p.name)} className="py-2 px-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold hover:bg-rose-500/20 transition-all cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ═══ OFFERS ═══
    if (section === "offers") {
const handleSaveOffers = (updated: typeof offers) => {
  setOffers(updated);
  localStorage.setItem("coinloot_offers", JSON.stringify(updated));
  AdminDb.saveOffers(updated).catch(() => {});
};
      const toggleOfferStatus = (id: string) => {
        const o = offers.find((x) => x.id === id);
        if (!o) return;
        const newStatus = o.status === "active" ? "inactive" : o.status === "inactive" ? "locked" : "active";
        handleSaveOffers(offers.map((x) => x.id === id ? { ...x, status: newStatus } : x));
        showNotif("success", `Offer ${newStatus}`);
        addLog("OFFER_STATUS", "offer", id, `Set offer ${o.title} to ${newStatus}`);
      };
      const handleDeleteOffer = (id: string) => {
        const o = offers.find((x) => x.id === id);
        if (!o || !confirm(`Delete offer "${o.title}"?`)) return;
        handleSaveOffers(offers.filter((x) => x.id !== id));
        showNotif("success", "Offer deleted");
        addLog("OFFER_DELETED", "offer", id, `Deleted offer ${o.title}`);
      };
      const startEditOffer = (id: string) => {
        const o = offers.find((x) => x.id === id);
        if (o) { setEditingOfferId(id); setEditingOfferTitle(o.title); }
      };
      const saveEditOffer = (id: string) => {
        handleSaveOffers(offers.map((x) => x.id === id ? { ...x, title: editingOfferTitle } : x));
        setEditingOfferId(null);
        showNotif("success", "Offer updated");
        addLog("OFFER_UPDATED", "offer", id, `Updated offer title`);
      };
      const handleAddOffer = () => {
        if (!newOffer.title) return showNotif("error", "Offer title required");
        const id = `of-${Date.now()}`;
        handleSaveOffers([...offers, { id, title: newOffer.title, provider: newOffer.provider, payout: newOffer.payout, status: "active", difficulty: newOffer.difficulty }]);
        setNewOffer({ title: "", provider: "Torox", payout: 100, difficulty: "Easy" });
        setShowAddOffer(false);
        showNotif("success", "Offer created");
        addLog("OFFER_CREATED", "offer", id, `Created offer ${newOffer.title}`);
      };
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-xl lg:text-2xl font-bold text-white">Offers Management</h1>
            <button onClick={() => setShowAddOffer(!showAddOffer)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/20 hover:from-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {showAddOffer ? "Cancel" : "Add Offer"}
            </button>
          </div>

          {/* Add Offer Form */}
          {showAddOffer && (
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-cyan-500/20 space-y-3">
              <h3 className="text-xs font-bold text-cyan-400">New Offer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input value={newOffer.title} onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })} placeholder="Offer title" className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600" />
                <select value={newOffer.provider} onChange={(e) => setNewOffer({ ...newOffer, provider: e.target.value })} className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                  {offerwallProviders.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
                <input type="number" value={newOffer.payout || ""} onChange={(e) => setNewOffer({ ...newOffer, payout: e.target.value === "" ? 0 : parseInt(e.target.value) || 0 })} placeholder="Payout coins" className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
                <select value={newOffer.difficulty} onChange={(e) => setNewOffer({ ...newOffer, difficulty: e.target.value })} className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <button onClick={handleAddOffer} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">
                <Plus className="w-3 h-3 inline mr-1" /> Create Offer
              </button>
            </div>
          )}

          <div className="bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr className="border-b border-white/5 text-slate-400 font-mono"><th className="text-left p-3 font-medium">Title</th><th className="text-left p-3 font-medium hidden sm:table-cell">Provider</th><th className="text-right p-3 font-medium">Payout</th><th className="text-left p-3 font-medium hidden md:table-cell">Difficulty</th><th className="text-center p-3 font-medium">Status</th><th className="text-right p-3 font-medium">Actions</th></tr></thead>
                <tbody>
                  {offers.map((o) => (
                    <tr key={o.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="p-3">
                        {editingOfferId === o.id ? (
                          <div className="flex items-center gap-1">
                            <input value={editingOfferTitle} onChange={(e) => setEditingOfferTitle(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white w-40" />
                            <button onClick={() => saveEditOffer(o.id)} className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3 h-3" /></button>
                            <button onClick={() => setEditingOfferId(null)} className="p-1 rounded bg-slate-800/60 text-slate-400 border border-white/5"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <span className="text-xs text-white font-semibold">{o.title}</span>
                        )}
                      </td>
                      <td className="p-3 text-[10px] text-slate-400 hidden sm:table-cell">{o.provider}</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">{o.payout.toLocaleString()}</td>
                      <td className="p-3 text-[10px] text-slate-400 hidden md:table-cell">{o.difficulty}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${o.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : o.status === "inactive" ? "bg-slate-500/10 text-slate-400 border border-slate-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEditOffer(o.id)} className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer" title="Edit Title"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => toggleOfferStatus(o.id)} className={`p-1.5 rounded-lg transition-all cursor-pointer ${o.status === "active" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"}`} title={o.status === "active" ? "Lock" : o.status === "inactive" ? "Unlock" : "Activate"}>
                            {o.status === "active" ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          </button>
                          <button onClick={() => handleDeleteOffer(o.id)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer" title="Delete"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {offers.length === 0 && <div className="p-8 text-center text-xs text-slate-500">No offers yet</div>}
          </div>
        </div>
      );
    }

    // ═══ LOCKED OFFERS ═══
    if (section === "locked-offers" || section === "locked-offers-rules") {
      const saveRules = (updated: typeof rules) => {
        setRules(updated);
        localStorage.setItem("coinloot_lock_rules", JSON.stringify(updated));
        AdminDb.saveLockRules(updated).catch(() => {});
      };
      const addRule = () => {
        if (!newRule.name) return showNotif("error", "Rule name required");
        saveRules([...rules, { ...newRule, id: `rule-${Date.now()}` }]);
        setNewRule({ name: "", type: "coins_earned", value: 1000 });
        showNotif("success", "Lock rule created");
        addLog("RULE_CREATED", "rule", "", `Created rule: ${newRule.name}`);
      };
      const deleteRule = (id: string) => {
        saveRules(rules.filter((r) => r.id !== id));
        showNotif("success", "Rule deleted");
        addLog("RULE_DELETED", "rule", id, "Deleted lock rule");
      };
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white">Locked Offer Rules</h1>
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
            <h3 className="text-sm font-bold text-white mb-4">Create Unlock Rule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} placeholder="Rule name..." className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20" />
              <select value={newRule.type} onChange={(e) => setNewRule({ ...newRule, type: e.target.value })} className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20">
                <option value="coins_earned">Min Coins Earned</option>
                <option value="level">Min Level</option>
                <option value="tasks_completed">Min Tasks</option>
              </select>
              <input type="number" value={newRule.value || ""} onChange={(e) => setNewRule({ ...newRule, value: e.target.value === "" ? 0 : parseInt(e.target.value) || 0 })} className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
              <button onClick={addRule} className="py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/20 hover:from-cyan-500/30 transition-all cursor-pointer"><Plus className="w-3 h-3 inline mr-1" /> Add Rule</button>
            </div>
          </div>
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-white">{r.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{r.type.replace("_", " ")} ≥ {r.value}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setNewRule({ name: r.name, type: r.type, value: r.value }); deleteRule(r.id); }} className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer" title="Edit"><Edit className="w-3 h-3" /></button>
                  <button onClick={() => deleteRule(r.id)} className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {rules.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No lock rules configured</p>}
          </div>
        </div>
      );
    }

    // ═══ LOCKED OFFERWALL MANAGEMENT ═══
    if (section === "locked-offers-management" || section === "locked-offers-promos") {
      return <AdminLockedOfferwalls section={section} onBack={goBack} showNotif={showNotif} />;
    }

    // ═══ COINS & REWARDS ═══
    if (section === "coins") {
      const handleBonusAll = () => {
        const accs = getAccounts();
        accs.forEach((a) => {
          a.profile.balance_coins += coinAmount;
          a.profile.total_earned_coins += coinAmount;
          a.profile.balance_usd = a.profile.balance_coins / 1000;
          addUserNotification(a.profile.id, `${coinAmount.toLocaleString()} Coins Bonus!`, `You received a bonus of ${coinAmount.toLocaleString()} coins from the admin.`, "credit", coinAmount);
        });
        saveAccounts(accs);
        addLog("BONUS_ALL", "system", "all", `Bonus of ${coinAmount} coins to all users`);
        playCoinSound();
        if (onRewardEarned) onRewardEarned(coinAmount, "Admin Bonus", `Admin sent ${coinAmount.toLocaleString()} coins to all users.`);
        showNotif("success", `Bonus of ${coinAmount} coins sent to all users`);
      };
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white">Coins & Rewards</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-400" /> Add / Deduct Coins</h3>
              <input value={coinTargetEmail} onChange={(e) => setCoinTargetEmail(e.target.value)} placeholder="User email..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20" />
              <div className="flex gap-2">
                <input type="number" value={coinAmount || ""} onChange={(e) => setCoinAmount(e.target.value === "" ? 0 : parseInt(e.target.value) || 0)} className="w-24 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
                <input value={coinReason} onChange={(e) => setCoinReason(e.target.value)} placeholder="Reason..." className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { const u = profiles.find((p) => p.email === coinTargetEmail); if (u) { handleAddCoins(u.id, coinAmount, coinReason); setCoinTargetEmail(""); setCoinReason(""); } else showNotif("error", "User not found"); }} className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">Add Coins</button>
                <button onClick={() => { const u = profiles.find((p) => p.email === coinTargetEmail); if (u) { handleDeductCoins(u.id, coinAmount, coinReason); setCoinTargetEmail(""); setCoinReason(""); } else showNotif("error", "User not found"); }} className="flex-1 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold hover:bg-rose-500/20 transition-all cursor-pointer">Deduct Coins</button>
              </div>
            </div>
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Gift className="w-4 h-4 text-purple-400" /> Bonus All Users</h3>
              <div className="flex gap-2">
                <input type="number" value={coinAmount || ""} onChange={(e) => setCoinAmount(e.target.value === "" ? 0 : parseInt(e.target.value) || 0)} className="w-24 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
                <button onClick={handleBonusAll} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-600/20 text-purple-300 border border-purple-500/20 text-[10px] font-bold hover:from-purple-500/30 transition-all cursor-pointer"><Send className="w-3 h-3 inline mr-1" /> Send to All</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ═══ WITHDRAWALS ═══
    if (section === "withdrawals" || section === "withdrawals-all") {
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white">Withdrawal Requests</h1>
          <div className="bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr className="border-b border-white/5 text-slate-400 font-mono"><th className="text-left p-3 font-medium">User</th><th className="text-left p-3 font-medium hidden sm:table-cell">Method</th><th className="text-right p-3 font-medium">Coins</th><th className="text-right p-3 font-medium">Amount</th><th className="text-left p-3 font-medium hidden md:table-cell">Date</th><th className="text-center p-3 font-medium">Status</th><th className="text-right p-3 font-medium">Actions</th></tr></thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="p-3 text-xs font-semibold text-white">{w.username}</td>
                      <td className="p-3 text-[10px] text-slate-400 uppercase hidden sm:table-cell">{w.payout_method}</td>
                      <td className="p-3 text-right font-mono text-white">{w.coins_deducted.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">${w.usd_value.toFixed(2)}</td>
                      <td className="p-3 text-[10px] text-slate-400 hidden md:table-cell">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${w.status === "PAID" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : w.status === "APPROVED" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : w.status === "REJECTED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>{w.status}</span>
                      </td>
                      <td className="p-3 text-right">
                        {w.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleWithdrawalAction(w.id, "APPROVED")} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Approve"><CheckCircle className="w-3 h-3" /></button>
                            <button onClick={() => handleWithdrawalAction(w.id, "REJECTED")} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20" title="Reject"><XCircle className="w-3 h-3" /></button>
                          </div>
                        )}
                        {w.status === "APPROVED" && (
                          <button onClick={() => handleWithdrawalAction(w.id, "PAID")} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Mark Paid"><DollarSign className="w-3 h-3" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {withdrawals.length === 0 && <div className="p-8 text-center text-xs text-slate-500">No withdrawal requests</div>}
          </div>
        </div>
      );
    }

    // ═══ PAYMENT METHODS ═══
    if (section === "withdraw-methods") {
      const defaults: WithdrawalMethodConfig[] = [
        { id: "pm-1", name: "PayPal", icon: "💎", minCoins: 1000, maxCoins: 50000, feePercent: 0, apiConnected: true, status: "ACTIVE", apiCredentials: "" },
        { id: "pm-2", name: "Binance Pay", icon: "🌐", minCoins: 1000, maxCoins: 100000, feePercent: 0, apiConnected: true, status: "ACTIVE", apiCredentials: "" },
        { id: "pm-3", name: "USDT (TRC-20)", icon: "₮", minCoins: 2000, maxCoins: 500000, feePercent: 0, apiConnected: true, status: "ACTIVE", apiCredentials: "" },
        { id: "pm-4", name: "Bitcoin", icon: "₿", minCoins: 5000, maxCoins: 500000, feePercent: 0.5, apiConnected: false, status: "INACTIVE", apiCredentials: "" },
        { id: "pm-5", name: "Litecoin", icon: "Ł", minCoins: 5000, maxCoins: 500000, feePercent: 0.5, apiConnected: false, status: "INACTIVE", apiCredentials: "" },
        { id: "pm-6", name: "Ethereum", icon: "♦", minCoins: 5000, maxCoins: 500000, feePercent: 0.5, apiConnected: false, status: "INACTIVE", apiCredentials: "" },
      ];
      const methods = paymentMethods.length > 0 ? paymentMethods : defaults;

      const toggleMethod = (id: string) => {
        const updated = methods.map((m) => m.id === id ? { ...m, status: m.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : m);
        savePaymentMethods(updated);
        showNotif("success", "Payment method updated");
      };

      const deleteMethod = (id: string) => {
        const updated = methods.filter((m) => m.id !== id);
        savePaymentMethods(updated);
        showNotif("success", "Payment method deleted");
      };

      const handleSaveMethod = (data: WithdrawalMethodConfig) => {
        const existing = methods.findIndex((m) => m.id === data.id);
        if (existing >= 0) {
          const updated = [...methods];
          updated[existing] = data;
          savePaymentMethods(updated);
          showNotif("success", "Payment method updated");
        } else {
          savePaymentMethods([...methods, data]);
          showNotif("success", "New payment method added");
        }
        setPmModal(null);
      };

      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <div className="flex items-center justify-between">
            <h1 className="text-xl lg:text-2xl font-bold text-white">Payment Methods</h1>
            <button onClick={() => setPmModal({ mode: "add", data: { id: `pm-${Date.now()}`, name: "", icon: "💳", minCoins: 1000, maxCoins: 50000, feePercent: 0, apiConnected: false, status: "INACTIVE", apiCredentials: "" } })}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-bold tracking-wide hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/10 flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add Method
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map((m) => (
              <div key={m.id} className="group relative bg-slate-950/60 backdrop-blur-xl p-5 rounded-3xl border border-white/5 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.06)] transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-xl">{m.icon}</div>
                    <div>
                      <span className="text-sm font-bold text-white block">{m.name}</span>
                      <span className={`text-[9px] font-mono font-bold ${m.status === "ACTIVE" ? "text-emerald-400" : "text-slate-500"}`}>{m.status}</span>
                    </div>
                  </div>
                  <button onClick={() => toggleMethod(m.id)} className={`relative w-10 h-5 rounded-full transition-all shrink-0 ${m.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-700"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${m.status === "ACTIVE" ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
                <div className="space-y-1.5 text-[10px] text-slate-400 font-mono">
                  <div className="flex justify-between"><span className="text-slate-500">Range</span><span className="text-white">{m.minCoins.toLocaleString()} – {m.maxCoins.toLocaleString()} coins</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Fee</span><span className="text-white">{m.feePercent}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">API</span><span className={m.apiConnected ? "text-emerald-400" : "text-rose-400"}>{m.apiConnected ? "Connected" : "Disconnected"}</span></div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                  <button onClick={() => setPmModal({ mode: "edit", data: { ...m } })} className="flex-1 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-bold hover:bg-cyan-500/20 transition-all cursor-pointer">
                    <Edit className="w-3 h-3 inline mr-1" /> Edit
                  </button>
                  <button onClick={() => deleteMethod(m.id)} className="flex-1 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold hover:bg-rose-500/20 transition-all cursor-pointer">
                    <Trash2 className="w-3 h-3 inline mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Modal */}
          {pmModal && (
            <PmEditModal
              data={pmModal.data}
              onSave={handleSaveMethod}
              onClose={() => setPmModal(null)}
            />
          )}
        </div>
      );
    }

    // ═══ NOTIFICATIONS ═══
    if (section === "notifications" || section === "notifications-send") {
      const handleSendNotif = () => {
        if (!notifTitle || !notifDesc) return showNotif("error", "Title and description required");
        sendNotification(notifTitle, notifDesc, notifType);
        setNotifTitle("");
        setNotifDesc("");
      };
      const handleBroadcastAll = () => {
        if (!notifTitle || !notifDesc) return showNotif("error", "Title and description required");
        const accs = getAccounts();
        accs.forEach((a) => {
          const notifs: any[] = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
          notifs.unshift({ id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, title: notifTitle, description: notifDesc, time: new Date().toISOString(), category: notifType, unread: true });
          localStorage.setItem("coinloot_notifications", JSON.stringify(notifs));
        });
        addLog("BROADCAST_SENT", "notification", "all", `Broadcast: ${notifTitle}`);
        setNotifTitle("");
        setNotifDesc("");
        showNotif("success", "Broadcast sent to all users");
      };
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white">Send Notification</h1>
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4 max-w-lg">
            <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="Notification title..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20" />
            <textarea value={notifDesc} onChange={(e) => setNotifDesc(e.target.value)} placeholder="Notification description..." rows={3} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/20 resize-none" />
            <select value={notifType} onChange={(e) => setNotifType(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20">
              <option value="system">System</option>
              <option value="credit">Credit / Reward</option>
              <option value="withdrawal_status">Withdrawal Status</option>
              <option value="security_alert">Security Alert</option>
              <option value="promo">Promotion</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleSendNotif} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/20 hover:from-cyan-500/30 transition-all cursor-pointer"><Send className="w-3 h-3 inline mr-1" /> Send Notification</button>
              <button onClick={handleBroadcastAll} className="flex-1 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold hover:bg-purple-500/20 transition-all cursor-pointer"><Globe className="w-3 h-3 inline mr-1" /> Broadcast All</button>
            </div>
          </div>

          {/* Admin Event Log */}
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2"><Bell className="w-4 h-4 text-cyan-400" /> Admin Event Log</h3>
              <div className="flex items-center gap-2">
                <select value={adminNotifFilter} onChange={(e) => setAdminNotifFilter(e.target.value)} className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono text-white">
                  <option value="all">All</option>
                  <option value="registration">Registrations</option>
                  <option value="login">Logins</option>
                  <option value="withdrawal_request">Withdrawals</option>
                  <option value="offer_completed">Offers</option>
                  <option value="survey_completed">Surveys</option>
                  <option value="reward_claim">Rewards</option>
                  <option value="promo_code">Promo Codes</option>
                  <option value="vpn_detected">VPN Detections</option>
                  <option value="user_restricted">Restrictions</option>
                  <option value="profile_update">Profile Updates</option>
                </select>
                <button onClick={clearAdminNotifs} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-[10px] cursor-pointer"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {filteredAdminNotifs.length === 0 && <p className="text-[10px] text-slate-500 text-center py-3 font-mono">No events yet</p>}
              {filteredAdminNotifs.map((n) => (
                <div key={n.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all">
                  <span className="text-xs mt-0.5">{getAdminEventEmoji(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-white truncate">{n.title}</p>
                    <p className="text-[9px] text-slate-400 font-mono truncate">{n.message}</p>
                    <p className="text-[8px] text-slate-600 font-mono mt-0.5">{n.username} · {new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {n.details?.coins && <span className="text-[9px] font-bold font-mono text-amber-400 shrink-0">+{n.details.coins}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ═══ PROMO CODES ═══
    if (section === "promos") {
      const generateCode = () => "PROMO-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const addCode = () => {
        if (!newCode.code) return showNotif("error", "Code required");
        const promo: PromoCode = { id: `promo-${Date.now()}`, code: newCode.code, coins: newCode.coins, maxUses: newCode.maxUses, currentUses: 0, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), countryRestriction: [], active: true, createdAt: new Date().toISOString() };
        savePromoCodes([...promoCodes, promo]);
        setNewCode({ code: "", coins: 100, maxUses: 100 });
        showNotif("success", "Promo code created");
        addLog("PROMO_CREATED", "promo", promo.id, `Created promo code ${newCode.code}`);
      };
      const togglePromo = (id: string) => {
        savePromoCodes(promoCodes.map((c) => c.id === id ? { ...c, active: !c.active } : c));
        const c = promoCodes.find((x) => x.id === id);
        addLog("PROMO_TOGGLED", "promo", id, `Toggled promo ${c?.code} to ${!c?.active}`);
      };
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white">Promo Codes</h1>
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-3 max-w-lg">
            <div className="flex gap-2">
              <input value={newCode.code} onChange={(e) => setNewCode({ ...newCode, code: e.target.value })} placeholder="PROMO-CODE" className="flex-1 min-w-0 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500/20" />
              <button onClick={() => setNewCode({ ...newCode, code: generateCode() })} className="shrink-0 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] cursor-pointer"><RefreshCw className="w-3 h-3" /></button>
            </div>
            <div className="flex flex-col xs:flex-row gap-2">
              <input type="number" value={newCode.coins || ""} onChange={(e) => setNewCode({ ...newCode, coins: e.target.value === "" ? 0 : parseInt(e.target.value) || 0 })} placeholder="Coins" className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
              <input type="number" value={newCode.maxUses || ""} onChange={(e) => setNewCode({ ...newCode, maxUses: e.target.value === "" ? 0 : parseInt(e.target.value) || 0 })} placeholder="Max Uses" className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/20" />
              <button onClick={addCode} className="shrink-0 py-2 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold cursor-pointer"><Plus className="w-3 h-3 inline mr-1" /> Create</button>
            </div>
          </div>
          <div className="space-y-2">
            {promoCodes.map((c) => (
              <div key={c.id} className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold font-mono text-white">{c.code}</span>
                  <span className="text-[10px] text-slate-400 ml-3">{c.coins} coins · {c.currentUses}/{c.maxUses} used</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePromo(c.id)} className={`px-2 py-1 rounded text-[8px] font-bold cursor-pointer ${c.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-500/20"}`}>{c.active ? "Active" : "Inactive"}</button>
                  <button onClick={() => { savePromoCodes(promoCodes.filter((x) => x.id !== c.id)); addLog("PROMO_DELETED", "promo", c.id, `Deleted promo ${c.code}`); showNotif("success", "Promo deleted"); }} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            {promoCodes.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No promo codes</p>}
          </div>
        </div>
      );
    }

    // ═══ REFERRALS ═══
    if (section === "referrals") {
      const refUsers = profiles.filter((p) => p.referrals_count > 0).sort((a, b) => b.referrals_count - a.referrals_count);
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white">Referral Statistics</h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5"><span className="block text-2xl font-bold font-mono text-white">{profiles.filter((p) => p.referred_by).length}</span><span className="block text-[10px] text-slate-400 font-mono uppercase mt-1">Referred Users</span></div>
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5"><span className="block text-2xl font-bold font-mono text-white">{profiles.reduce((s, p) => s + p.referrals_count, 0)}</span><span className="block text-[10px] text-slate-400 font-mono uppercase mt-1">Total Referrals</span></div>
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5"><span className="block text-2xl font-bold font-mono text-white">{refUsers.length}</span><span className="block text-[10px] text-slate-400 font-mono uppercase mt-1">Users with Referrals</span></div>
          </div>
          <div className="bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden">
            <table className="w-full text-[11px]">
              <thead><tr className="border-b border-white/5 text-slate-400 font-mono"><th className="text-left p-3 font-medium">User</th><th className="text-right p-3 font-medium">Referrals</th><th className="text-right p-3 font-medium hidden sm:table-cell">Total Earned</th></tr></thead>
              <tbody>
                {refUsers.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.02]"><td className="p-3 text-xs text-white font-semibold">{p.username}</td><td className="p-3 text-right font-mono text-cyan-400">{p.referrals_count}</td><td className="p-3 text-right font-mono text-emerald-400 hidden sm:table-cell">{p.total_earned_coins.toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
            {refUsers.length === 0 && <div className="p-8 text-center text-xs text-slate-500">No referral activity</div>}
          </div>
        </div>
      );
    }

    // ═══ TICKETS ═══
    if (section === "tickets") {
      const openTicket = (t: any) => {
        setTicketSelected(t);
        try {
          const msgs = JSON.parse(localStorage.getItem(`coinloot_support_tickets_messages_${t.id}`) || "[]");
          setTicketMsgs(msgs);
        } catch { setTicketMsgs([]); }
      };

      const refreshTicketList = () => {
        try {
          const refreshed = JSON.parse(localStorage.getItem("coinloot_support_tickets") || "[]");
          setTicketList(refreshed);
        } catch {}
      };

      const handleAdminReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketReply.trim() || !ticketSelected) return;
        const now = new Date().toISOString();
        const msg = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ticketId: ticketSelected.id,
          senderId: user.id,
          senderName: user.username,
          senderRole: "admin",
          text: ticketReply,
          createdAt: now,
        };
        const updatedMessages = [...ticketMsgs, msg];
        setTicketMsgs(updatedMessages);
        localStorage.setItem(`coinloot_support_tickets_messages_${ticketSelected.id}`, JSON.stringify(updatedMessages));

        if (ticketSelected.status === "OPEN") {
          const updatedTickets = ticketList.map((t: any) => t.id === ticketSelected.id ? { ...t, status: "ANSWERED" } : t);
          setTicketList(updatedTickets);
          localStorage.setItem("coinloot_support_tickets", JSON.stringify(updatedTickets));
          setTicketSelected({ ...ticketSelected, status: "ANSWERED" });
        }
        setTicketReply("");
      };

      const updateTicketStatus = (status: string) => {
        if (!ticketSelected) return;
        const updatedTickets = ticketList.map((t: any) => t.id === ticketSelected.id ? { ...t, status } : t);
        setTicketList(updatedTickets);
        localStorage.setItem("coinloot_support_tickets", JSON.stringify(updatedTickets));
        setTicketSelected({ ...ticketSelected, status });
      };

      if (ticketSelected) {
        const ticket = ticketSelected;
        return (
          <div className="p-4 lg:p-6 h-full flex flex-col max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { setTicketSelected(null); refreshTicketList(); }} className="p-2 rounded-xl bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white truncate">{ticket.subject}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500 font-mono">{ticket.username}</span>
                  <span className="text-[9px] text-slate-600">•</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-mono ${
                    ticket.status === "OPEN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    ticket.status === "ANSWERED" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                    ticket.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                  }`}>{ticket.status}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3" style={{ maxHeight: "calc(100vh - 280px)" }}>
              {ticketMsgs.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.senderRole === "admin"
                      ? "bg-gradient-to-br from-cyan-500 to-purple-600 text-white rounded-br-md"
                      : "bg-slate-800/80 border border-white/5 text-slate-200 rounded-bl-md"
                  }`}>
                    {msg.senderRole === "user" && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 font-mono">{msg.senderName}</span>
                      </div>
                    )}
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <span className={`block text-[8px] mt-1.5 font-mono ${msg.senderRole === "admin" ? "text-white/60" : "text-slate-500"}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="flex items-center gap-2 mb-3">
              {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
                <button onClick={() => updateTicketStatus("RESOLVED")} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[8px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"><CheckCircle className="w-3 h-3 inline mr-1" /> Resolve</button>
              )}
              {ticket.status !== "CLOSED" && (
                <button onClick={() => updateTicketStatus("CLOSED")} className="px-3 py-1.5 rounded-xl bg-slate-500/10 text-slate-300 border border-slate-500/20 text-[8px] font-bold hover:bg-slate-500/20 transition-all cursor-pointer"><XCircle className="w-3 h-3 inline mr-1" /> Close</button>
              )}
            </div>

            <form onSubmit={handleAdminReply} className="flex items-center gap-2 glass rounded-2xl p-2 border border-white/5">
              <input type="text" value={ticketReply} onChange={(e) => setTicketReply(e.target.value)} placeholder="Type your reply..." className="flex-1 bg-transparent border-none px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none" />
              <button type="submit" disabled={!ticketReply.trim() || ticket.status === "CLOSED"} className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        );
      }

      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <div className="flex items-center justify-between">
            <h1 className="text-xl lg:text-2xl font-bold text-white">Support Tickets</h1>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/20">{ticketList.length} total</span>
          </div>

          {ticketList.length === 0 && (
            <div className="text-center py-20 glass rounded-3xl border border-dashed border-cyan-500/10">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No support tickets yet</p>
            </div>
          )}

          <div className="space-y-2">
            {ticketList.map((ticket: any) => (
              <button key={ticket.id} onClick={() => openTicket(ticket)} className="w-full text-left glass rounded-2xl p-4 hover:border-cyan-400/30 transition-all border border-white/5 cursor-pointer group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-mono ${
                        ticket.status === "OPEN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        ticket.status === "ANSWERED" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                        ticket.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>{ticket.status}</span>
                      <span className="text-[9px] text-slate-600 font-mono">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">{ticket.subject}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <User className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] text-slate-500 font-mono">{ticket.username}</span>
                      <span className="text-[9px] text-slate-600">•</span>
                      <span className="text-[10px] text-slate-600 font-mono">{ticket.category}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // ═══ ANALYTICS ═══
    if (section === "analytics") {
      const countryMap = new Map<string, number>();
      profiles.forEach((p) => { const c = p.country || "Unknown"; countryMap.set(c, (countryMap.get(c) || 0) + 1); });
      const countryData = Array.from(countryMap.entries()).sort((a, b) => b[1] - a[1]);
      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white">Analytics</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
              <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Top Earners</h3>
              <div className="space-y-2">
                {topEarners.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold font-mono text-amber-400">{i + 1}</span>
                      <span className="text-xs text-white">{p.username}</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">{p.total_earned_coins.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
              <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> Users by Country</h3>
              <div className="space-y-2">
                {countryData.map(([country, count]) => (
                  <div key={country} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 w-28 truncate">{country}</span>
                    <div className="flex-1 h-4 rounded-full bg-slate-800/60 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 to-purple-600/60" style={{ width: `${(count / Math.max(...countryData.map(([, c]) => c))) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate-400 w-8 text-right">{count}</span>
                  </div>
                ))}
                {countryData.length === 0 && <p className="text-xs text-slate-500 text-center">No data</p>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ═══ KYC MANAGEMENT ═══
    if (section === "kyc") {
      const kycUsers = profiles.filter(p => p.kyc_status === "PENDING" || p.kyc_status === "APPROVED" || p.kyc_status === "REJECTED");
      const pendingKyc = profiles.filter(p => p.kyc_status === "PENDING");
      const approvedKyc = profiles.filter(p => p.kyc_status === "APPROVED");
      const rejectedKyc = profiles.filter(p => p.kyc_status === "REJECTED");

      const handleKycAction = async (userId: string, action: "APPROVED" | "REJECTED") => {
        const sb = getSupabaseClient();
        if (sb) {
          try {
            await sb.from("kyc_records").update({ status: action }).eq("user_id", userId);
            await sb.from("profiles").update({ kyc_status: action }).eq("id", userId);
            setProfilesRefreshKey(k => k + 1);
            showNotif("success", `KYC ${action} for user`);
            return;
          } catch {}
        }
        const stored = JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
        const idx = stored.findIndex((a: any) => a.profile?.id === userId);
        if (idx >= 0) {
          stored[idx].profile.kyc_status = action;
          localStorage.setItem("coinloot_accounts", JSON.stringify(stored));
        }
        const profilesRaw = JSON.parse(localStorage.getItem("coinloot_user_profiles") || "[]");
        const pIdx = profilesRaw.findIndex((p: any) => p.id === userId);
        if (pIdx >= 0) {
          profilesRaw[pIdx].kyc_status = action;
          localStorage.setItem("coinloot_user_profiles", JSON.stringify(profilesRaw));
        }
        setProfilesRefreshKey(k => k + 1);
        showNotif("success", `KYC ${action} for user`);
      };

      const viewKycDoc = (userId: string) => {
        const data = localStorage.getItem(`coinloot_kyc_${userId}`);
        if (data) {
          const parsed = JSON.parse(data);
          setViewingKyc(parsed);
        } else {
          showNotif("error", "No KYC documents found for this user");
        }
      };

      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">KYC Verification</h2>
            <p className="text-xs text-slate-400 mt-1">Manage user identity verification requests.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: kycUsers.length, color: "text-white" },
              { label: "Pending", value: pendingKyc.length, color: "text-amber-400" },
              { label: "Approved", value: approvedKyc.length, color: "text-emerald-400" },
              { label: "Rejected", value: rejectedKyc.length, color: "text-rose-400" },
            ].map((s, i) => (
              <div key={i} className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                <span className={`block text-2xl font-bold font-mono ${s.color}`}>{s.value}</span>
                <span className="text-[9px] text-slate-500 font-mono">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Pending Requests */}
          <div className="bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Pending Verification
              </h3>
              <span className="px-2 py-0.5 text-[9px] rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">{pendingKyc.length} pending</span>
            </div>
            {pendingKyc.length === 0 ? (
              <div className="p-8 text-center">
                <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-xs text-slate-500">No pending KYC requests</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {pendingKyc.map((u) => (
                  <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-white truncate">{u.username}</span>
                        <span className="block text-[9px] text-slate-500 font-mono truncate">{u.email} — {u.country || "N/A"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => viewKycDoc(u.id)} className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-[9px] text-slate-300 hover:border-white/20 transition-all cursor-pointer">View Docs</button>
                      <button onClick={() => handleKycAction(u.id, "APPROVED")} className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[9px] text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approve</button>
                      <button onClick={() => handleKycAction(u.id, "REJECTED")} className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[9px] text-rose-400 hover:bg-rose-500/25 transition-all cursor-pointer flex items-center gap-1"><XCircle className="w-3 h-3" /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All KYC Users */}
          <div className="bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">All KYC Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] text-slate-500 font-mono uppercase">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycUsers.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-[8px] font-bold text-white">{u.username[0].toUpperCase()}</div>
                          <span className="font-semibold text-white">{u.username}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-400">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                          u.kyc_status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          u.kyc_status === "REJECTED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>{u.kyc_status}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => viewKycDoc(u.id)} className="px-2 py-1 rounded-lg bg-slate-800 border border-white/10 text-[9px] text-slate-300 hover:border-white/20 transition-all cursor-pointer">Docs</button>
                          {u.kyc_status === "PENDING" && (
                            <>
                              <button onClick={() => handleKycAction(u.id, "APPROVED")} className="px-2 py-1 rounded-lg bg-emerald-500/15 text-[9px] text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer">Approve</button>
                              <button onClick={() => handleKycAction(u.id, "REJECTED")} className="px-2 py-1 rounded-lg bg-rose-500/15 text-[9px] text-rose-400 hover:bg-rose-500/25 transition-all cursor-pointer">Reject</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* KYC Document Viewer Modal */}
          {viewingKyc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
              <div className="max-w-2xl w-full bg-slate-950 border border-white/10 rounded-3xl p-6 relative animate-zoom-in shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">KYC Documents</h3>
                  <button onClick={() => setViewingKyc(null)} className="text-slate-400 hover:text-white transition-all cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {viewingKyc.docFront && (
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono uppercase block mb-2">Front Side</span>
                      <img src={viewingKyc.docFront} alt="Front" className="w-full rounded-2xl border border-white/10" />
                    </div>
                  )}
                  {viewingKyc.docBack && (
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono uppercase block mb-2">Back Side</span>
                      <img src={viewingKyc.docBack} alt="Back" className="w-full rounded-2xl border border-white/10" />
                    </div>
                  )}
                  {viewingKyc.selfie && (
                    <div className={viewingKyc.docBack ? "" : "sm:col-span-2"}>
                      <span className="text-[9px] text-slate-500 font-mono uppercase block mb-2">Selfie</span>
                      <img src={viewingKyc.selfie} alt="Selfie" className="w-full max-w-xs rounded-2xl border border-white/10" />
                    </div>
                  )}
                </div>
                {viewingKyc.docType && (
                  <p className="text-[10px] text-slate-400 mt-4 font-mono">Document Type: {viewingKyc.docType}</p>
                )}
                {viewingKyc.submittedAt && (
                  <p className="text-[9px] text-slate-500 mt-1 font-mono">Submitted: {new Date(viewingKyc.submittedAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // ═══ SECURITY ═══
    if (section === "security" || section === "fraud" || section === "logs" || section === "vpn-control") {
      const logs = getLogs();
      const fraudUsers = profiles.filter((p) => p.vpn_detected);
      const restrictedUsers = getRestrictedUsers();
      const ipLogs = getUserIpLogs(100);

      const getTimeRemaining = (until: string) => {
        const diff = new Date(until).getTime() - Date.now();
        if (diff <= 0) return "Expired";
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${m}m ${s}s`;
      };

const toggleVpnSetting = (key: keyof typeof vpnSettings) => {
  const updated = { ...vpnSettings, [key]: !vpnSettings[key] };
  setVpnSettings(updated);
  saveVpnSettings(updated);
  AdminDb.saveVpnSettingsDb({
    vpnDetection: true,
    vpnWarning: updated.vpnWarning,
    vpnBlock: updated.offerwallBlock,
    withdrawalBlock: updated.withdrawalBlock,
    restrictDuration: 30,
  }).catch(() => {});
  showNotif("success", `VPN ${key === "vpnWarning" ? "Warning" : key === "offerwallBlock" ? "Offerwall Block" : "Withdrawal Block"} ${updated[key] ? "enabled" : "disabled"}`);
};

      return (
        <div className="p-4 lg:p-6 space-y-4">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white">Security</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

            {/* ── VPN Protection Settings ── */}
            {section !== "logs" && section !== "vpn-control" && (
              <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
                <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" /> VPN Protection</h3>
                <div className="space-y-3">
                  {[
                    { key: "vpnWarning" as const, label: "VPN Warning", desc: "Show warning when VPN detected" },
                    { key: "offerwallBlock" as const, label: "Offerwall Block", desc: "Block offerwall access when VPN detected" },
                    { key: "withdrawalBlock" as const, label: "Withdrawal Block", desc: "Block withdrawal requests when VPN detected" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
                      <div>
                        <span className="text-xs font-semibold text-white">{label}</span>
                        <p className="text-[8px] text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <button onClick={() => toggleVpnSetting(key)} className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${vpnSettings[key] ? "bg-cyan-500" : "bg-slate-700"}`}>
                        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: vpnSettings[key] ? "calc(100% - 18px)" : "2px" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── IP Logs ── */}
            {section !== "fraud" && section !== "vpn-control" && (
              <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
                <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" /> IP Logs <span className="text-[9px] text-slate-500 font-mono ml-auto">{ipLogs.length} entries</span></h3>
                <div className="overflow-x-auto max-h-64 overflow-y-auto border border-white/5 rounded-xl">
                  <table className="w-full text-[8px] font-mono">
                    <thead>
                      <tr className="bg-slate-900/80">
                        <th className="px-2 py-1.5 text-left text-slate-400">User</th>
                        <th className="px-2 py-1.5 text-left text-slate-400">IP</th>
                        <th className="px-2 py-1.5 text-left text-slate-400">Country</th>
                        <th className="px-2 py-1.5 text-left text-slate-400">ISP</th>
                        <th className="px-2 py-1.5 text-left text-slate-400">VPN</th>
                        <th className="px-2 py-1.5 text-left text-slate-400">Risk</th>
                        <th className="px-2 py-1.5 text-left text-slate-400">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ipLogs.map((entry) => (
                        <tr key={entry.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                          <td className="px-2 py-1 text-white">{entry.username}</td>
                          <td className="px-2 py-1 text-slate-300">{entry.ipAddress}</td>
                          <td className="px-2 py-1 text-slate-300">{entry.country || "-"}</td>
                          <td className="px-2 py-1 text-slate-300 truncate max-w-[80px]">{entry.isp || "-"}</td>
                          <td className="px-2 py-1">
                            <span className={`px-1 py-0.5 rounded text-[7px] font-bold ${entry.proxyDetected ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                              {entry.proxyDetected ? "YES" : "NO"}
                            </span>
                          </td>
                          <td className="px-2 py-1">
                            <span className={`font-bold ${entry.riskScore >= 80 ? "text-rose-400" : entry.riskScore >= 50 ? "text-amber-400" : "text-slate-400"}`}>
                              {entry.riskScore}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-slate-500 text-[7px]">{new Date(entry.lastSeen).toLocaleString()}</td>
                        </tr>
                      ))}
                      {ipLogs.length === 0 && (
                        <tr><td colSpan={7} className="text-center text-slate-500 py-4 text-[10px]">No IP logs yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {section !== "logs" && (
              <>
                <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
                  <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-rose-400" /> Fraud Detection (VPN)</h3>
                  {fraudUsers.length > 0 ? (
                    <div className="space-y-2">
                      {fraudUsers.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-rose-500/10">
                          <div><span className="block text-xs text-white">{p.username}</span><span className="text-[9px] text-slate-500">{p.email}</span></div>
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Flagged</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-500 text-center py-4">No suspicious users detected</p>}
                </div>
                <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
                  <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Restricted Users</h3>
                  {restrictedUsers.length > 0 ? (
                    <div className="space-y-2">
                      {restrictedUsers.map((r) => {
                        const p = profiles.find((x) => x.id === r.userId);
                        const remaining = getTimeRemaining(r.restrictedUntil);
                        return (
                          <div key={r.userId} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-amber-500/10">
                            <div>
                              <span className="block text-xs text-white">{p?.username || r.userId}</span>
                              <span className="text-[9px] text-amber-400 font-mono">{remaining} remaining</span>
                              {r.reason && <span className="text-[8px] text-slate-500 block mt-0.5">{r.reason}</span>}
                            </div>
                            <button onClick={() => { unRestrictUser(r.userId); addLog("USER_UNRESTRICTED", "user", r.userId, `Unrestricted ${p?.username || r.userId}`); showNotif("success", "User unrestricted"); }} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">
                              <Unlock className="w-2.5 h-2.5 inline mr-0.5" /> Unrestrict
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-xs text-slate-500 text-center py-4">No restricted users</p>}
                </div>
              </>
            )}
            {section !== "fraud" && section !== "vpn-control" && (
              <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 lg:col-span-2">
                <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> Activity Logs</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {logs.slice(0, 50).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/20 border border-white/[0.02]">
                      <span className="text-[9px] font-mono text-slate-500 w-28 shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">{log.action}</span>
                      <span className="text-[10px] text-slate-300">{log.details}</span>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No activity logs</p>}
                </div>
              </div>
            )}
            {section === "vpn-control" && (
              <VpnControlCenter
                userId={user?.id || ""}
                username={user?.username || "Admin"}
                profiles={profiles}
                onAction={(msg) => showNotif("success", msg)}
              />
            )}
          </div>
        </div>
      );
    }

    // ═══ HOMEPAGE — Earn Page Sections ═══
    if (section === "homepage") {
      const toggleSection = (key: string) => {
        const updated = { ...homepageSections, [key]: !homepageSections[key] };
        setHomepageSections(updated);
        localStorage.setItem("coinloot_homepage_sections", JSON.stringify(updated));
        AdminDb.saveHomepageSections(updated).catch(() => {});
        window.dispatchEvent(new CustomEvent("homepage-sections-changed"));
        showNotif("success", `${key.charAt(0).toUpperCase() + key.slice(1)} ${updated[key] ? "visible" : "hidden"}`);
      };
      const sectionMeta: { key: string; label: string; icon: any; desc: string }[] = [
        { key: "featured", label: "Featured Offers", icon: Crown, desc: "Show the Featured Offers carousel on the earn page" },
        { key: "hot", label: "Hot Offers", icon: Flame, desc: "Show the Hot Offers carousel on the earn page" },
        { key: "surveys", label: "Surveys", icon: ClipboardCheck, desc: "Show the Surveys section on the earn page" },
        { key: "offerwalls", label: "Offerwall Providers", icon: ShieldCheck, desc: "Show the Offerwall Providers grid on the earn page" },
      ];
      return (
        <div className="p-4 lg:p-6 space-y-4 max-w-3xl">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" /> Earn Page Sections
          </h1>
          <p className="text-[10px] text-slate-500 font-mono">Control which sections are visible on the earn page. Changes apply immediately.</p>
          <div className="space-y-3">
            {sectionMeta.map(({ key, label, icon: Icon, desc }) => {
              const isVisible = homepageSections[key];
              return (
                <div key={key} className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isVisible ? "bg-emerald-500/10" : "bg-slate-800/60"}`}>
                      <Icon className={`w-4 h-4 ${isVisible ? "text-emerald-400" : "text-slate-500"}`} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-white">{label}</span>
                      <span className="block text-[9px] text-slate-500 font-mono mt-0.5 truncate">{desc}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSection(key)}
                    className={`relative w-12 h-6 rounded-full transition-all shrink-0 cursor-pointer ${isVisible ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isVisible ? "left-[calc(100%-22px)]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
            <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-400" /> Current Visibility</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(homepageSections).map(([key, val]) => (
                <span key={key} className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 ${val ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800/60 text-slate-500 border border-slate-700/30"}`}>
                  {val ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    
    // ═══ REWARDS & CHALLENGES ═══
    if (section === "rewards-challenges") {
      return <RewardsChallengesManagement />;
    }

// ═══ SETTINGS ═══
    if (section === "settings") {
      return (
        <div className="p-4 lg:p-6 space-y-4 max-w-3xl">
          <AdminBackBtn onClick={goBack} />
          <h1 className="text-xl lg:text-2xl font-bold text-white">Settings</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-400" /> General</h3>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Site Name</label><input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Coin → USD Rate</label><input value={rate} onChange={(e) => setRate(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Min Withdrawal (coins)</label><input value={minWd} onChange={(e) => setMinWd(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
            </div>
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2"><Server className="w-4 h-4 text-purple-400" /> SMTP Configuration</h3>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Host</label><input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Port</label><input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Username</label><input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Password</label><input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" /></div>
            </div>
            <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2"><Send className="w-4 h-4 text-sky-400" /> Telegram Bot</h3>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Bot Token</label><input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" placeholder="1234567890:ABCdefGHI..." /></div>
              <div><label className="text-[9px] text-slate-500 uppercase block mb-1">Chat ID</label><input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" placeholder="-1001234567890" /></div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white">Enabled</span>
                <button onClick={() => setTelegramEnabled(!telegramEnabled)} className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${telegramEnabled ? "bg-sky-500" : "bg-slate-700"}`}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: telegramEnabled ? "calc(100% - 18px)" : "2px" }} />
                </button>
              </div>
              <button onClick={testTelegram} className="w-full py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold hover:bg-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5">
                <Send className="w-3 h-3" /> Test Telegram
              </button>
            </div>
          </div>

          {/* ── IP Account Limit Settings ── */}
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" /> IP Account Limit</h3>
            <p className="text-[10px] text-slate-400 font-mono">Limit how many accounts can be created from a single IP address.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Enable IP Limit</span>
              <button onClick={() => saveIpLimitSettings(!ipLimitEnabled, ipLimitMax)} className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${ipLimitEnabled ? "bg-cyan-500" : "bg-slate-700"}`}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: ipLimitEnabled ? "calc(100% - 18px)" : "2px" }} />
              </button>
            </div>
            {ipLimitEnabled && (
              <div>
                <label className="text-[9px] text-slate-500 uppercase block mb-1">Max Accounts Per IP</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} max={100} value={ipLimitMax} onChange={(e) => {
                    const v = Math.max(1, parseInt(e.target.value) || 1);
                    setIpLimitMax(v);
                    saveIpLimitSettings(ipLimitEnabled, v);
                  }} className="w-24 bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white" />
                  <span className="text-[10px] text-slate-500 font-mono">accounts</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
            <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-amber-400" /> Developer Mode</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white">Developer Mode</span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">When enabled, users see a maintenance banner, offers/withdrawals/support are disabled</p>
              </div>
              <button onClick={() => { const v = !developerMode; setDeveloperMode(v); saveSettings(); }} className={`relative w-12 h-6 rounded-full transition-all shrink-0 cursor-pointer ${developerMode ? "bg-amber-500" : "bg-slate-700"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${developerMode ? "left-6.5" : "left-0.5"}`} style={{ left: developerMode ? "calc(100% - 22px)" : "2px" }} />
              </button>
            </div>
          </div>


          {/* ── Data Browser (inline) ── */}
          <DataBrowserCard />

          <button onClick={saveSettings} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-300 font-bold text-xs border border-cyan-500/20 hover:from-cyan-500/30 hover:to-purple-600/30 transition-all">
            Save All Settings
          </button>
        </div>
      );
    }

    return null;
  };

  // ── Render ──
  return (
    <section className="relative">
      {/* Restrict Modal */}
      {restrictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" onClick={() => setRestrictModal(null)}>
          <div className="max-w-sm w-full bg-slate-950 border border-white/10 rounded-3xl p-6 relative animate-zoom-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setRestrictModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            <h3 className="text-sm font-bold text-white mb-1">Restrict User</h3>
            <p className="text-[10px] text-slate-400 font-mono mb-4">Restrict <span className="text-cyan-400 font-semibold">{restrictModal.username}</span></p>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-mono block mb-2">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[8px] text-slate-500 block text-center mb-1 font-mono">Hours</label>
                    <input type="number" min={0} value={restrictHours} onChange={(e) => { const v = parseInt(e.target.value) || 0; setRestrictHours(v); setRestrictDuration(v * 60 + restrictMinutes + (restrictDays * 1440) + Math.round(restrictSeconds / 60)); }} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-center text-sm font-mono text-white" />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 block text-center mb-1 font-mono">Minutes</label>
                    <input type="number" min={0} max={59} value={restrictMinutes} onChange={(e) => { const v = parseInt(e.target.value) || 0; const m = Math.min(v, 59); setRestrictMinutes(m); setRestrictDuration(restrictHours * 60 + m + (restrictDays * 1440) + Math.round(restrictSeconds / 60)); }} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-center text-sm font-mono text-white" />
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 block text-center mb-1 font-mono">Seconds</label>
                    <input type="number" min={0} max={59} value={restrictSeconds} onChange={(e) => { const v = parseInt(e.target.value) || 0; const s = Math.min(v, 59); setRestrictSeconds(s); setRestrictDuration(restrictHours * 60 + restrictMinutes + (restrictDays * 1440) + Math.round(s / 60)); }} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-center text-sm font-mono text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" min={0} value={restrictDays} onChange={(e) => { const d = parseInt(e.target.value) || 0; setRestrictDays(d); setRestrictDuration(d * 1440 + restrictHours * 60 + restrictMinutes + Math.round(restrictSeconds / 60)); }} className="w-16 bg-slate-900 border border-white/10 rounded-xl px-2 py-1.5 text-center text-xs font-mono text-white" />
                  <span className="text-[9px] text-slate-500 font-mono">days</span>
                  <span className="ml-auto text-[10px] font-mono text-amber-400">{restrictDuration} min total</span>
                </div>
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Reason</label>
                <input value={restrictReason} onChange={(e) => setRestrictReason(e.target.value)} placeholder="Reason for restriction..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600" />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Note <span className="text-slate-600">(optional)</span></label>
                <textarea value={restrictNote} onChange={(e) => setRestrictNote(e.target.value)} placeholder="Admin note about this restriction..." rows={2} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { const totalMin = restrictDuration; if (totalMin > 0) { restrictUser(restrictModal.userId, totalMin, restrictReason || "Restricted by admin"); logRestrictionHistory({ id: `rh-${Date.now()}`, userId: restrictModal.userId, username: restrictModal.username, action: "restricted", duration: totalMin, reason: restrictReason || "Restricted by admin", adminNote: restrictNote || undefined, adminAction: `Restricted for ${totalMin} min by ${user?.username || "Admin"}${restrictNote ? ` — ${restrictNote}` : ""}`, timestamp: new Date().toISOString() }); addLog("USER_RESTRICTED", "user", restrictModal.userId, `Restricted ${restrictModal.username} for ${totalMin} min`); showNotif("success", `${restrictModal.username} restricted for ${totalMin} min`); setRestrictModal(null); } else { showNotif("error", "Duration required"); } }} className="flex-1 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/30 transition-all cursor-pointer">
                  <Clock className="w-3 h-3 inline mr-1" /> Restrict
                </button>
                <button onClick={() => { unRestrictUser(restrictModal.userId); addLog("USER_UNRESTRICTED", "user", restrictModal.userId, `Unrestricted ${restrictModal.username}`); showNotif("success", "User unrestricted"); setRestrictModal(null); }} className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer">
                  <Unlock className="w-3 h-3 inline mr-1" /> Unrestrict
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-xl border transition-all animate-in ${notification.type === "success" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-rose-500/20 border-rose-500/30 text-rose-300"}`}>
          {notification.message}
        </div>
      )}
      {renderSection()}
    </section>
  );
}
