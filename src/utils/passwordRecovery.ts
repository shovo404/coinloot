import { PasswordRecoveryRequest } from "../types";
import { getSupabaseClient } from "../lib/supabase";
import { createAdminNotification } from "./adminNotifier";

const RECOVERY_KEY = "coinloot_password_recovery_requests";
const RECOVERY_SUPABASE_KEY = "password_recovery_requests";

// ── Supabase Persistence ─────────────────────────────────────────────────

async function persistRecoveryToSupabase() {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const requests = getAllRequests().slice(0, 200);
    await sb.from("site_settings").upsert({
      setting_key: RECOVERY_SUPABASE_KEY,
      setting_value: JSON.stringify(requests),
      setting_type: "json",
      description: "Password recovery requests persisted across sessions",
    }, { onConflict: "setting_key" });
  } catch { /* best-effort */ }
}

// ── CRUD ─────────────────────────────────────────────────────────────────

function getAllRequests(): PasswordRecoveryRequest[] {
  try {
    return JSON.parse(localStorage.getItem(RECOVERY_KEY) || "[]");
  } catch { return []; }
}

function saveAllRequests(requests: PasswordRecoveryRequest[]) {
  localStorage.setItem(RECOVERY_KEY, JSON.stringify(requests));
  persistRecoveryToSupabase();
}

export function createRecoveryRequest(userId: string, username: string, email: string, reason: string): PasswordRecoveryRequest {
  const request: PasswordRecoveryRequest = {
    id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId,
    username,
    email,
    reason,
    status: "pending",
    adminId: null,
    adminNotes: null,
    resetToken: null,
    tokenExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getAllRequests();
  all.push(request);
  saveAllRequests(all);

  // Admin notification
  createAdminNotification(
    "verification_request",
    "🔑 New Password Recovery Request",
    `${username} (${email}) has requested a password recovery. Reason: ${reason}`,
    userId,
    username,
    { requestId: request.id, reason }
  );

  return request;
}

export function getRecoveryRequests(): PasswordRecoveryRequest[] {
  return getAllRequests();
}

export function getPendingRecoveryRequests(): PasswordRecoveryRequest[] {
  return getAllRequests().filter((r) => r.status === "pending");
}

export function getUserRecoveryRequest(userId: string): PasswordRecoveryRequest | null {
  return getAllRequests().find((r) => r.userId === userId && r.status === "pending") || null;
}

export function hasActiveRequest(userId: string): boolean {
  return getAllRequests().some((r) => r.userId === userId && r.status === "pending");
}

export function getRecoveryRequestById(id: string): PasswordRecoveryRequest | null {
  return getAllRequests().find((r) => r.id === id) || null;
}

// ── Admin Actions ────────────────────────────────────────────────────────

function generateResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function approveRecoveryRequest(id: string, adminId: string): Promise<PasswordRecoveryRequest | null> {
  const all = getAllRequests();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  all[idx] = {
    ...all[idx],
    status: "approved",
    adminId,
    resetToken: token,
    tokenExpiresAt: expiresAt,
    updatedAt: new Date().toISOString(),
  };
  saveAllRequests(all);

  // User notification via localStorage
  try {
    const notifs: any[] = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
    notifs.unshift({
      id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: all[idx].userId,
      title: "Recovery Request Approved",
      description: "Your password recovery request has been approved. You may now set a new password.",
      time: new Date().toISOString(),
      category: "system",
      unread: true,
      resetToken: token,
    });
    localStorage.setItem("coinloot_notifications", JSON.stringify(notifs));
  } catch {}

  // Also insert into Supabase notifications
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from("notifications").insert({
        user_id: all[idx].userId,
        title: "Recovery Request Approved",
        description: "Your password recovery request has been approved. You may now set a new password.",
        notification_type: "system",
        source_name: "Admin",
        metadata: { resetToken: token },
      });
    } catch {}
  }

  return all[idx];
}

export async function rejectRecoveryRequest(id: string, adminId: string, notes?: string): Promise<PasswordRecoveryRequest | null> {
  const all = getAllRequests();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    status: "rejected",
    adminId,
    adminNotes: notes || null,
    updatedAt: new Date().toISOString(),
  };
  saveAllRequests(all);

  try {
    const notifs: any[] = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
    notifs.unshift({
      id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: all[idx].userId,
      title: "Recovery Request Rejected",
      description: notes
        ? `Your password recovery request was rejected. Reason: ${notes}`
        : "Your password recovery request was rejected. Please contact support if you believe this was a mistake.",
      time: new Date().toISOString(),
      category: "system",
      unread: true,
    });
    localStorage.setItem("coinloot_notifications", JSON.stringify(notifs));
  } catch {}

  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from("notifications").insert({
        user_id: all[idx].userId,
        title: "Recovery Request Rejected",
        description: notes
          ? `Your password recovery request was rejected. Reason: ${notes}`
          : "Your password recovery request was rejected. Please contact support if you believe this was a mistake.",
        notification_type: "system",
        source_name: "Admin",
      });
    } catch {}
  }

  return all[idx];
}

// ── Token Validation & Password Reset ────────────────────────────────────

export function getResetRequestByToken(token: string): PasswordRecoveryRequest | null {
  return getAllRequests().find(
    (r) => r.resetToken === token && r.status === "approved" && r.tokenExpiresAt && new Date(r.tokenExpiresAt) > new Date()
  ) || null;
}

export function getRequestByTokenForUser(userId: string, token: string): PasswordRecoveryRequest | null {
  return getAllRequests().find(
    (r) => r.userId === userId && r.resetToken === token && r.status === "approved" && r.tokenExpiresAt && new Date(r.tokenExpiresAt) > new Date()
  ) || null;
}

export function completeRecovery(token: string): { userId: string; username: string } | null {
  const all = getAllRequests();
  const idx = all.findIndex(
    (r) => r.resetToken === token && r.status === "approved" && r.tokenExpiresAt && new Date(r.tokenExpiresAt) > new Date()
  );
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    status: "completed",
    resetToken: null,
    tokenExpiresAt: null,
    updatedAt: new Date().toISOString(),
  };
  saveAllRequests(all);

  return { userId: all[idx].userId, username: all[idx].username };
}

export function isValidRecoveryToken(token: string): boolean {
  return getAllRequests().some(
    (r) => r.resetToken === token && r.status === "approved" && r.tokenExpiresAt && new Date(r.tokenExpiresAt) > new Date()
  );
}
