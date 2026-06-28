import React, { useState, useEffect, useMemo } from "react";
import { Bell, Shield, Check, X, AlertTriangle } from "lucide-react";
import {
  NotificationType,
  NotificationCategory,
  NotificationPreference,
  getNotificationPrefs,
  saveNotificationPrefs,
  NOTIFICATION_META,
  NOTIFICATION_CATEGORIES,
} from "../utils/adminNotifier";

interface Props {
  showNotif: (type: "success" | "error", msg: string) => void;
}

export default function AdminNotificationPrefs({ showNotif }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreference[]>(getNotificationPrefs());
  const [saved, setSaved] = useState(false);

  const togglePref = (type: NotificationType) => {
    const meta = NOTIFICATION_META[type];
    if (meta?.criticalAlways) return; // Cannot disable critical alerts
    setPrefs(prev =>
      prev.map(p => p.type === type ? { ...p, enabled: !p.enabled } : p)
    );
    setSaved(false);
  };

  const handleSave = () => {
    saveNotificationPrefs(prefs);
    setSaved(true);
    showNotif("success", "Notification preferences saved");
    setTimeout(() => setSaved(false), 2000);
  };

  const isTypeEnabled = (type: NotificationType): boolean => {
    const meta = NOTIFICATION_META[type];
    if (meta?.criticalAlways) return true;
    const pref = prefs.find(p => p.type === type);
    return pref ? pref.enabled : true;
  };

  const enabledCount = prefs.filter(p => p.enabled).length;
  const totalCount = prefs.length;

  // Group by category
  const groupedPrefs = useMemo(() => {
    const groups: Record<string, { type: NotificationType; label: string; icon: string; enabled: boolean; critical: boolean }[]> = {};
    NOTIFICATION_CATEGORIES.forEach(cat => {
      groups[cat.id] = [];
    });
    (Object.keys(NOTIFICATION_META) as NotificationType[]).forEach(type => {
      const meta = NOTIFICATION_META[type];
      if (groups[meta.category]) {
        groups[meta.category].push({
          type,
          label: meta.label,
          icon: meta.icon,
          enabled: isTypeEnabled(type),
          critical: meta.criticalAlways,
        });
      }
    });
    return groups;
  }, [prefs]);

  const enableAllInCategory = (category: NotificationCategory) => {
    setPrefs(prev =>
      prev.map(p => {
        const meta = NOTIFICATION_META[p.type];
        if (meta?.category === category && !meta.criticalAlways) {
          return { ...p, enabled: true };
        }
        return p;
      })
    );
    setSaved(false);
  };

  const disableAllInCategory = (category: NotificationCategory) => {
    setPrefs(prev =>
      prev.map(p => {
        const meta = NOTIFICATION_META[p.type];
        if (meta?.category === category && !meta.criticalAlways) {
          return { ...p, enabled: false };
        }
        return p;
      })
    );
    setSaved(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" /> Notification Preferences
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Choose which notification types appear in the Admin Notification Center.
            Critical security alerts are always enabled.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-mono">
            {enabledCount}/{totalCount} enabled
          </span>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1.5 ${
              saved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:scale-[1.02]"
            }`}
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            {saved ? "Saved!" : "Save Preferences"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-300">Critical alerts are always delivered</p>
          <p className="text-[9px] text-slate-400 font-mono mt-0.5">
            VPN/Proxy Detection, Fraud Alerts, Multiple Account Detection, and System Errors
            (API Failure, VPN API Failure, Database Error, Server Error) cannot be disabled
            for security reasons.
          </p>
        </div>
      </div>

      {/* Category Groups */}
      {NOTIFICATION_CATEGORIES.map(cat => {
        const items = groupedPrefs[cat.id] || [];
        const enabledInCat = items.filter(i => i.enabled).length;
        const totalInCat = items.length;
        if (items.length === 0) return null;

        return (
          <div key={cat.id} className="bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden">
            {/* Category Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{cat.icon}</span>
                <h3 className="text-sm font-bold text-white">{cat.label}</h3>
                <span className="text-[9px] text-slate-500 font-mono">{enabledInCat}/{totalInCat}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => enableAllInCategory(cat.id as NotificationCategory)}
                  className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  Enable All
                </button>
                <button
                  onClick={() => disableAllInCategory(cat.id as NotificationCategory)}
                  className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-bold hover:bg-rose-500/20 transition-all cursor-pointer"
                >
                  Disable All
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="p-2 space-y-0.5">
              {items.map(item => {
                const isCritical = item.critical;
                return (
                  <div
                    key={item.type}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      item.enabled ? "bg-slate-900/30" : "bg-slate-900/10 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <span className={`text-xs font-semibold ${item.enabled ? "text-white" : "text-slate-400"}`}>
                          {item.label}
                        </span>
                        {isCritical && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[7px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            ALWAYS ON
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => togglePref(item.type)}
                      disabled={isCritical}
                      className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${
                        isCritical
                          ? "bg-rose-500 opacity-50 cursor-not-allowed"
                          : item.enabled ? "bg-cyan-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: item.enabled ? "calc(100% - 18px)" : "2px" }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
