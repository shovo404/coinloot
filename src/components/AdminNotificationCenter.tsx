import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Bell, CheckCheck, Trash2, X, Search, Filter, Download,
  ArrowUpDown, ChevronDown, Clock, AlertTriangle, Eye, EyeOff,
  CheckCircle, XCircle, MessageSquare, User, Activity,
  Shield, DollarSign, Gift, Server, Lock,
} from "lucide-react";
import {
  AdminNotification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  getAdminNotifications,
  getNotificationStats,
  markAdminRead,
  markAdminUnread,
  markAsDone,
  markAllAdminRead,
  deleteAdminNotification,
  deleteAdminNotifications,
  onAdminNotifChange,
  NOTIFICATION_META,
  NOTIFICATION_CATEGORIES,
  getNotificationIcon,
  getPriorityColor,
  getPriorityBg,
} from "../utils/adminNotifier";

interface Props {
  showNotif: (type: "success" | "error", msg: string) => void;
}

const PRIORITY_ORDER: NotificationPriority[] = ["critical", "high", "medium", "low"];

export default function AdminNotificationCenter({ showNotif }: Props) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(getAdminNotifications());
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | "all">("all");
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "read" | "unread">("all");
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    const unsub = onAdminNotifChange(() => {
      setNotifications(getAdminNotifications());
    });
    return unsub;
  }, []);

  // Refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(getAdminNotifications());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => getNotificationStats(), [notifications]);

  const filtered = useMemo(() => {
    let result = [...notifications];
    if (filterType !== "all") result = result.filter(n => n.type === filterType);
    if (filterCategory !== "all") result = result.filter(n => n.category === filterCategory);
    if (filterPriority !== "all") result = result.filter(n => n.priority === filterPriority);
    if (filterStatus === "read") result = result.filter(n => n.is_read);
    if (filterStatus === "unread") result = result.filter(n => !n.is_read);
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(s) ||
        n.message.toLowerCase().includes(s) ||
        n.username.toLowerCase().includes(s)
      );
    }
    result.sort((a, b) => {
      const dateCmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortOrder === "newest" ? dateCmp : -dateCmp;
    });
    return result;
  }, [notifications, filterType, filterCategory, filterPriority, filterStatus, searchText, sortOrder]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(n => n.id)));
    }
  };

  const handleMarkRead = (id: string) => {
    markAdminRead(id);
    showNotif("success", "Marked as read");
  };

  const handleMarkUnread = (id: string) => {
    markAdminUnread(id);
    showNotif("success", "Marked as unread");
  };

  const handleDelete = (id: string) => {
    deleteAdminNotification(id);
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    showNotif("success", "Notification deleted");
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    deleteAdminNotifications(Array.from(selectedIds));
    setSelectedIds(new Set());
    showNotif("success", `${selectedIds.size} notifications deleted`);
  };

  const handleBulkMarkRead = () => {
    selectedIds.forEach(id => markAdminRead(id));
    setSelectedIds(new Set());
    showNotif("success", "Marked as read");
  };

  const handleExport = () => {
    const csv = "Type,Priority,Title,Message,User,Created,Read,Status\n" +
      filtered.map(n =>
        `${n.type},${n.priority},"${n.title.replace(/"/g, '""')}","${n.message.replace(/"/g, '""')}",${n.username},${n.created_at},${n.is_read},${n.status}`
      ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "admin-notifications.csv"; a.click();
    URL.revokeObjectURL(url);
    showNotif("success", "Exported CSV");
  };

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      counts[n.category] = (counts[n.category] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  const countByPriority = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      counts[n.priority] = (counts[n.priority] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" /> Admin Notification Center
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Manage all admin notifications in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold hover:bg-cyan-500/20 transition-all cursor-pointer flex items-center gap-1.5">
            <Download className="w-3 h-3" /> Export CSV
          </button>
          <button onClick={() => setSelectMode(!selectMode)} className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${selectMode ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-slate-900/40 text-slate-400 border-white/5 hover:border-white/10"}`}>
            <CheckCircle className="w-3 h-3" /> {selectMode ? "Exit Select" : "Select"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
          <span className="block text-lg font-bold font-mono text-white">{stats.total}</span>
          <span className="text-[9px] text-slate-500 font-mono">Total</span>
        </div>
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-cyan-500/10">
          <span className="block text-lg font-bold font-mono text-cyan-400">{stats.unread}</span>
          <span className="text-[9px] text-slate-500 font-mono">Unread</span>
        </div>
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-emerald-500/10">
          <span className="block text-lg font-bold font-mono text-emerald-400">{stats.read}</span>
          <span className="text-[9px] text-slate-500 font-mono">Read</span>
        </div>
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-rose-500/10">
          <span className="block text-lg font-bold font-mono text-rose-400">{stats.critical}</span>
          <span className="text-[9px] text-slate-500 font-mono">Critical</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {NOTIFICATION_CATEGORIES.map(cat => {
          const count = countByCategory[cat.id] || 0;
          const isActive = filterCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(isActive ? "all" : cat.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${isActive ? "bg-cyan-500/10 border-cyan-500/20" : "bg-slate-950/40 border-white/5 hover:border-white/10"}`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span className="block text-[9px] font-bold text-white mt-1">{cat.label}</span>
              <span className="text-[10px] font-mono text-slate-400">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[160px] flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search notifications..."
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none font-mono"
            />
          </div>

          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-white">
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-white">
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <button onClick={() => { setFilterType("all"); setFilterCategory("all"); setFilterPriority("all"); setFilterStatus("all"); setSearchText(""); }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-[9px] text-slate-400 hover:text-white transition-all cursor-pointer">
            <X className="w-3 h-3" />
          </button>

          <button onClick={() => setSortOrder(s => s === "newest" ? "oldest" : "newest")}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-[9px] text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> {sortOrder === "newest" ? "Newest" : "Oldest"}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectMode && selectedIds.size > 0 && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-2xl flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] text-cyan-400 font-mono font-bold">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkMarkRead} className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-bold hover:bg-cyan-500/30 transition-all cursor-pointer flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Mark Read
            </button>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold hover:bg-rose-500/30 transition-all cursor-pointer flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 border border-white/10 text-[9px] font-bold hover:text-white transition-all cursor-pointer">
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Mark All Read */}
      {notifications.filter(n => !n.is_read).length > 0 && !selectMode && (
        <button onClick={() => { markAllAdminRead(); showNotif("success", "All marked as read"); }}
          className="w-full py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-cyan-400 font-bold hover:bg-cyan-500/10 transition-all cursor-pointer">
          <CheckCheck className="w-3.5 h-3.5 inline mr-1.5" /> Mark All as Read
        </button>
      )}

      {/* Notification Type Filter Tags */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
        <button onClick={() => setFilterType("all")}
          className={`px-2.5 py-1 rounded-lg text-[8px] font-bold whitespace-nowrap transition-all cursor-pointer ${filterType === "all" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-500 border border-transparent hover:text-white"}`}>
          All Types
        </button>
        {(Object.keys(NOTIFICATION_META) as NotificationType[]).map(type => (
          <button key={type} onClick={() => setFilterType(filterType === type ? "all" : type)}
            className={`px-2.5 py-1 rounded-lg text-[8px] font-bold whitespace-nowrap transition-all cursor-pointer ${filterType === type ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-slate-500 border border-transparent hover:text-white"}`}>
            {NOTIFICATION_META[type].icon} {NOTIFICATION_META[type].label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <div className="bg-slate-950/40 p-8 rounded-3xl border border-white/5 text-center">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">No notifications match your filters</p>
          </div>
        )}
        {filtered.map((n) => {
          const meta = NOTIFICATION_META[n.type];
          const isSelected = selectedIds.has(n.id);
          return (
            <div
              key={n.id}
              className={`relative group flex items-start gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                n.is_read
                  ? "bg-slate-950/40 border-white/5 hover:border-white/10"
                  : "bg-cyan-500/[0.04] border-cyan-500/15 hover:border-cyan-500/25"
              } ${isSelected ? "ring-2 ring-cyan-500/40" : ""}`}
            >
              {/* Select checkbox */}
              {selectMode && (
                <button
                  onClick={() => toggleSelect(n.id)}
                  className={`w-4 h-4 rounded border-2 mt-1 shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                    isSelected ? "bg-cyan-500 border-cyan-500" : "border-slate-600 hover:border-slate-400"
                  }`}
                >
                  {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                </button>
              )}

              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl ${getPriorityBg(n.priority)} flex items-center justify-center shrink-0`}>
                <span className="text-sm">{meta?.icon || "🔔"}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className={`text-xs font-bold ${n.is_read ? "text-slate-300" : "text-white"}`}>
                      {n.title}
                    </span>
                    <span className={`text-[9px] font-bold font-mono ${getPriorityColor(n.priority)}`}>
                      {n.priority.toUpperCase()}
                    </span>
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                    )}
                  </div>
                </div>
                <p className={`text-[10px] leading-relaxed mt-0.5 ${n.is_read ? "text-slate-400" : "text-slate-300"}`}>
                  {n.message}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {n.username && (
                    <span className="text-[8px] text-slate-500 font-mono flex items-center gap-1">
                      <User className="w-2.5 h-2.5" /> {n.username}
                    </span>
                  )}
                  <span className="text-[8px] text-slate-600 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {new Date(n.created_at).toLocaleString()}
                  </span>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${n.category === "security" ? "bg-rose-500/10 text-rose-400" : n.category === "user" ? "bg-amber-500/10 text-amber-400" : n.category === "withdrawal" ? "bg-emerald-500/10 text-emerald-400" : n.category === "offerwall" ? "bg-blue-500/10 text-blue-400" : n.category === "support" ? "bg-purple-500/10 text-purple-400" : "bg-slate-500/10 text-slate-400"}`}>
                    {NOTIFICATION_CATEGORIES.find(c => c.id === n.category)?.label || n.category}
                  </span>
                  {n.details?.detectionType && (
                    <span className={`px-1 py-0.5 rounded text-[7px] font-bold ${n.details.detectionType === "Proxy" || n.details.detectionType === "VPN" || n.details.detectionType === "VPN / Proxy" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {n.details.detectionType}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!selectMode && (
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  {!n.is_read ? (
                    <button onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer" title="Mark Read">
                      <Eye className="w-3 h-3" />
                    </button>
                  ) : (
                    <button onClick={() => handleMarkUnread(n.id)}
                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer" title="Mark Unread">
                      <EyeOff className="w-3 h-3" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
