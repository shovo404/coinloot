import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Bell, AlertTriangle, Shield, User, DollarSign, Gift, Server, MessageSquare } from "lucide-react";
import {
  AdminNotification,
  getAdminNotifications,
  markAdminRead,
  NOTIFICATION_META,
  getPriorityColor,
  getPriorityBg,
} from "../utils/adminNotifier";

type ToastItem = {
  notif: AdminNotification;
  visible: boolean;
};

export default function AdminNotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prevCountRef = useRef(0);

  useEffect(() => {
    // Check for new notifications every 2s
    const interval = setInterval(() => {
      const notifs = getAdminNotifications();
      if (notifs.length > prevCountRef.current) {
        // New notifications arrived
        const newNotifs = notifs.slice(0, notifs.length - prevCountRef.current);
        newNotifs.forEach(n => {
          // Only toast if unread and not already shown
          if (!n.is_read) {
            addToast(n);
          }
        });
      }
      prevCountRef.current = notifs.length;
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const addToast = useCallback((notif: AdminNotification) => {
    const id = notif.id;
    // Don't add duplicate
    setToasts(prev => {
      if (prev.some(t => t.notif.id === id)) return prev;
      return [...prev, { notif, visible: true }];
    });

    // Auto-dismiss after 6s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.notif.id !== id));
    }, 6000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.notif.id !== id));
  };

  const handleClick = (notif: AdminNotification) => {
    markAdminRead(notif.id);
    removeToast(notif.id);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map(({ notif }) => {
        const meta = NOTIFICATION_META[notif.type];
        return (
          <div
            key={notif.id}
            onClick={() => handleClick(notif)}
            className="pointer-events-auto bg-slate-900 border border-white/10 rounded-2xl p-3 shadow-2xl flex items-start gap-3 animate-slide-up cursor-pointer hover:border-cyan-500/30 transition-all group"
          >
            <div className={`w-9 h-9 rounded-xl ${getPriorityBg(notif.priority)} flex items-center justify-center shrink-0`}>
              <span className="text-sm">{meta?.icon || "🔔"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">{notif.title}</span>
                <span className={`text-[8px] font-bold font-mono shrink-0 ${getPriorityColor(notif.priority)}`}>
                  {notif.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono truncate mt-0.5">{notif.message}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeToast(notif.id); }}
              className="shrink-0 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
