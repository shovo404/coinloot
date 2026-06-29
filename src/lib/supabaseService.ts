import { getSupabaseClient } from "./supabase";
import { createClient } from "@supabase/supabase-js";
import { UserProfile, WithdrawalRequest, PromoCode } from "../types";
import { calcLevel } from "../utils/levelSystem";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, username: string) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  let authData;

  try {
    const result = await sb.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    authData = result;
    if (result.error) throw result.error;
  } catch (authErr: any) {
    // If the auth user already exists, check whether the profile was soft-deleted.
    // If so, re-activate it rather than blocking registration.
    const msg = authErr?.message || "";
    if (msg.includes("already registered") || msg.includes("already exists")) {
      // Check if there is a soft-deleted profile with this email
      const existingProfile = await getActiveProfileByEmail(email);
      if (!existingProfile) {
        // Profile was either permanently deleted or doesn't exist — auth user
        // is orphaned. Try to delete the orphaned auth user using service role
        // and re-register. This only works if VITE_SUPABASE_SERVICE_ROLE_KEY is set.
        const adminClient = getAdminClient();
        if (adminClient) {
          try {
            // List auth users to find the orphaned one
            const { data: orphanedUsers } = await adminClient.auth.admin.listUsers() as any;
            const orphaned = (orphanedUsers?.users || []).find((u: any) => u.email === email);
            if (orphaned) {
              await deleteAuthUser(orphaned.id);
              // Retry sign-up
              const retry = await sb.auth.signUp({
                email,
                password,
                options: { data: { username } },
              });
              if (retry.error) throw retry.error;
              authData = retry;
            } else {
              throw authErr;
            }
          } catch {
            // Admin client unavailable or operation failed — email is truly taken
            throw authErr;
          }
        } else {
          // No service role key configured — cannot delete orphaned auth user
          throw authErr;
        }
      } else {
        // Profile exists and is not deleted — email truly taken
        throw authErr;
      }
    } else {
      throw authErr;
    }
  }

  // In Supabase JS SDK v2, the response is { data: { user, session }, error }
  // Support both v1 flattened ({ user }) and v2 ({ data: { user } }) formats
  const newUser = authData.data?.user || (authData as any).user;
  if (newUser) {
    // Create profile in profiles table (trigger handles referral link + notif settings)
    const { error: profileError } = await sb.from("profiles").insert({
      id: newUser.id,
      username,
      email,
      balance_coins: 0,
      balance_usd: 0,
      xp: 0,
      level: 1,
      total_earned_coins: 0,
      kyc_status: "NOT_STARTED",
      is_admin: false,
      vpn_detected: false,
    });
    if (profileError) {
      // If profile insertion fails (e.g. duplicate key), the auth user was
      // created but profile wasn't — still a success for re-registration
      console.warn("[signUp] Profile insertion warning:", profileError.message);
    }
  }

  return authData;
}

export async function signIn(email: string, password: string) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.auth.signOut();
}

function getAdminClient() {
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  if (!serviceKey || !supabaseUrl) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function deleteAuthUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const adminClient = getAdminClient();
  if (!adminClient) {
    console.warn("[deleteAuthUser] VITE_SUPABASE_SERVICE_ROLE_KEY not set. Supabase Auth user not deleted.");
    return { success: false, error: "Service role key not configured" };
  }

  try {
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("[deleteAuthUser] Failed to delete auth user:", err?.message || err);
    return { success: false, error: err?.message || "Unknown error deleting auth user" };
  }
}

/**
 * Soft-delete a user: sets deleted_at on their profile so the email stays
 * reserved but the account can be restored. Removes localStorage entries.
 */
export async function softDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const adminClient = getAdminClient();
  if (!adminClient) {
    // Fallback: try authenticated client
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: "Supabase client not available" };
    const { error } = await sb.from("profiles").update({
      deleted_at: new Date().toISOString(),
      status: "deleted",
      is_banned: true,
    }).eq("id", userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  try {
    const { error } = await adminClient.from("profiles").update({
      deleted_at: new Date().toISOString(),
      status: "deleted",
      is_banned: true,
    }).eq("id", userId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to soft-delete user" };
  }
}

/**
 * Restore a soft-deleted user by clearing deleted_at.
 */
export async function restoreUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const adminClient = getAdminClient();
  const sb = adminClient || getSupabaseClient();
  if (!sb) return { success: false, error: "Supabase client not available" };

  try {
    const { error } = await sb.from("profiles").update({
      deleted_at: null,
      status: "active",
      is_banned: false,
    }).eq("id", userId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to restore user" };
  }
}

/**
 * Permanently delete a user from ALL Supabase tables AND Auth.
 * Uses the service-role client to bypass RLS.
 */
export async function permanentDeleteUser(userId: string, email?: string): Promise<{ success: boolean; error?: string }> {
  const adminClient = getAdminClient();
  if (!adminClient) {
    return { success: false, error: "Service role key not configured — cannot permanently delete" };
  }

  const tables = [
    "coin_transactions", "earnings_history", "live_earnings",
    "notifications", "notification_settings",
    "withdrawals", "support_tickets", "kyc_records",
    "referral_earnings", "referral_links",
    "login_history", "user_activity_logs",
    "daily_rewards", "achievement_rewards",
    "leaderboard_statistics", "user_balances",
    "promo_code_redemptions",
    "fraud_detection_logs",
    "campaign_submissions",
    "campaign_submission_screenshots",
    "ticket_replies",
    "email_verifications",
    "wallet_configurations",
  ];

  try {
    // 1. Delete from all related tables
    for (const table of tables) {
      try {
        await adminClient.from(table).delete().eq("user_id", userId);
      } catch {
        // Some tables may not exist — skip
      }
    }

    // 2. Delete from profiles (ON DELETE CASCADE from auth.users handles this,
    //    but we delete explicitly in case the FK is not set up)
    try {
      await adminClient.from("profiles").delete().eq("id", userId);
    } catch {}

    // 3. Delete from Supabase Auth
    const authResult = await deleteAuthUser(userId);
    if (!authResult.success) {
      return { success: false, error: authResult.error || "Failed to delete auth user" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[permanentDeleteUser] Failed:", err?.message || err);
    return { success: false, error: err?.message || "Unknown error during permanent deletion" };
  }
}

/**
 * Check if a profile exists and is NOT soft-deleted.
 * Used during registration to allow re-registration with an email that
 * was used by a permanently deleted user.
 */
export async function getActiveProfileByEmail(email: string): Promise<UserProfile | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("email", email)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;
    return mapDbProfileToUserProfile(data);
  } catch {
    return null;
  }
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return mapDbProfileToUserProfile(data);
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map(mapDbProfileToUserProfile);
}

export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
) {
  const sb = getSupabaseClient();
  if (!sb) return;

  const dbUpdates: Record<string, any> = {};
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.balance_coins !== undefined) dbUpdates.balance_coins = updates.balance_coins;
  if (updates.balance_usd !== undefined) dbUpdates.balance_usd = updates.balance_usd;
  if (updates.total_earned_coins !== undefined) dbUpdates.total_earned_coins = updates.total_earned_coins;
  if (updates.kyc_status !== undefined) dbUpdates.kyc_status = updates.kyc_status;
  if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
  if (updates.level !== undefined) dbUpdates.level = updates.level;
  if (updates.vpn_detected !== undefined) dbUpdates.vpn_detected = updates.vpn_detected;
  if (updates.preference_theme !== undefined) dbUpdates.preference_theme = updates.preference_theme;
  if (updates.preference_language !== undefined) dbUpdates.preference_language = updates.preference_language;
  if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
  if (updates.avatar_id !== undefined) dbUpdates.avatar_id = updates.avatar_id;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.restriction_reason !== undefined) dbUpdates.restriction_reason = updates.restriction_reason;
  if (updates.restricted_at !== undefined) dbUpdates.restricted_at = updates.restricted_at;
  if (updates.restricted_by !== undefined) dbUpdates.restricted_by = updates.restricted_by;
  if (updates.restriction_notes !== undefined) dbUpdates.restriction_notes = updates.restriction_notes;
  if (updates.registration_ip !== undefined) dbUpdates.registration_ip = updates.registration_ip;
  if (updates.device_fingerprint !== undefined) dbUpdates.device_fingerprint = updates.device_fingerprint;
  if (updates.force_password_change !== undefined) dbUpdates.force_password_change = updates.force_password_change;
  if (updates.registration_country !== undefined) dbUpdates.registration_country = updates.registration_country;
  if (updates.registration_isp !== undefined) dbUpdates.registration_isp = updates.registration_isp;

  const { error } = await sb.from("profiles").update(dbUpdates).eq("id", userId);
  if (error) throw error;
}

export async function adminResetPassword(userId: string): Promise<string> {
  const tempPassword = generateTempPassword(12);
  const sb = getSupabaseClient();

  // Update password in localStorage coinloot_accounts
  try {
    const accounts: Array<{ email: string; password: string; username: string; profile: any }> =
      JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
    const idx = accounts.findIndex((a) => a.profile.id === userId);
    if (idx >= 0) {
      accounts[idx].password = tempPassword;
      accounts[idx].profile.force_password_change = true;
      localStorage.setItem("coinloot_accounts", JSON.stringify(accounts));
    }
  } catch {}

  // Set force_password_change flag in Supabase profiles table
  if (sb) {
    try {
      await sb.from("profiles").update({ force_password_change: true }).eq("id", userId);
    } catch {}
  }

  return tempPassword;
}

function generateTempPassword(length: number): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&";
  const all = upper + lower + digits + special;
  let pwd = "";
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < length - 4; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

export async function changeUserPassword(userId: string, newPassword: string): Promise<void> {
  const sb = getSupabaseClient();

  // Update in Supabase Auth (requires user to be authenticated as themselves)
  if (sb) {
    try {
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) console.warn("[changeUserPassword] Supabase Auth update failed:", error.message);
    } catch (e) {
      console.warn("[changeUserPassword] Supabase Auth exception:", e);
    }
  }

  // Update in localStorage
  try {
    const accounts: Array<{ email: string; password: string; username: string; profile: any }> =
      JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
    const idx = accounts.findIndex((a) => a.profile.id === userId);
    if (idx >= 0) {
      accounts[idx].password = newPassword;
      accounts[idx].profile.force_password_change = false;
      localStorage.setItem("coinloot_accounts", JSON.stringify(accounts));
    }
  } catch {}

  // Clear force_password_change flag in Supabase
  if (sb) {
    try {
      await sb.from("profiles").update({ force_password_change: false }).eq("id", userId);
    } catch {}
  }
}

export async function getProfileByEmail(email: string): Promise<UserProfile | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error || !data) return null;
  return mapDbProfileToUserProfile(data);
}

function mapDbProfileToUserProfile(data: any): UserProfile {
  return {
    id: data.id,
    username: data.username || "User",
    email: data.email || "",
    balance_coins: data.balance_coins || 0,
    balance_usd: data.balance_usd || (data.balance_coins || 0) / 1000,
    xp: data.xp || 0,
    level: data.level || 1,
    streak_days: data.streak_days || 0,
    referred_by: data.referred_by || null,
    referrals_count: data.referrals_count || 0,
    total_earned_coins: data.total_earned_coins || 0,
    total_withdrawn_usd: data.total_withdrawn_usd || 0,
    kyc_status: data.kyc_status || "NOT_STARTED",
    kyc_required: data.kyc_required ?? false,
    is_admin: data.is_admin || false,
    role: data.role || (data.is_admin ? 'admin' : 'user'),
    vpn_detected: data.vpn_detected || false,
    device_fingerprint: data.device_fingerprint || "",
    country: data.country || "",
    avatar_url: data.avatar_url || undefined,
    avatar_id: data.avatar_id || undefined,
    force_password_change: data.force_password_change || false,
    preference_theme: data.preference_theme || undefined,
    preference_language: data.preference_language || undefined,
    is_banned: data.is_banned || false,
    registration_ip: data.registration_ip || undefined,
    status: data.status || (data.is_banned ? "banned" : "active"),
    restriction_reason: data.restriction_reason || undefined,
    restricted_at: data.restricted_at || undefined,
    restricted_by: data.restricted_by || undefined,
    restriction_notes: data.restriction_notes || undefined,
    created_at: data.created_at || undefined,
  };
}

// ─── Coin Transactions ────────────────────────────────────────────────────────

export async function addCoins(
  userId: string,
  amount: number,
  source: string,
  sourceName: string,
  description: string
) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  // Get current profile
  const profile = await getProfile(userId);
  if (!profile) return null;

  const newBalance = profile.balance_coins + amount;
  const newTotalEarned = profile.total_earned_coins + amount;
  const newLevel = calcLevel(newTotalEarned);

  // Update profile
  await sb
    .from("profiles")
    .update({
      balance_coins: newBalance,
      balance_usd: newBalance / 1000,
      total_earned_coins: newTotalEarned,
      level: newLevel,
    })
    .eq("id", userId);

  // Log transaction
  await sb.from("coin_transactions").insert({
    user_id: userId,
    transaction_type: source,
    amount_coins: amount,
    amount_usd: amount / 1000,
    balance_after_coins: newBalance,
    balance_after_usd: newBalance / 1000,
    source: sourceName,
    description,
  });

  // Add to earnings history
  await sb.from("earnings_history").insert({
    user_id: userId,
    source_type: source.toLowerCase(),
    source_name: sourceName,
    coins_earned: amount,
    usd_value: amount / 1000,
  });

  // Add to live feed
  await sb.from("live_earnings").insert({
    user_id: userId,
    username: profile.username,
    provider: sourceName,
    coins_earned: amount,
  });

  return { newBalance, newTotalEarned };
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export async function createWithdrawal(
  userId: string,
  username: string,
  method: string,
  methodName: string,
  payoutDetails: string,
  coinsAmount: number,
  usdValue: number
) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  // Deduct coins from profile
  const profile = await getProfile(userId);
  if (!profile) return null;

  const newBalance = profile.balance_coins - coinsAmount;

  await sb
    .from("profiles")
    .update({
      balance_coins: newBalance,
      balance_usd: newBalance / 1000,
      total_withdrawn_usd: (profile.total_withdrawn_usd || 0) + usdValue,
    })
    .eq("id", userId);

  // Create withdrawal record
  const { data, error } = await sb
    .from("withdrawals")
    .insert({
      user_id: userId,
      username,
      reward_name: methodName,
      payout_method: method,
      payout_details: payoutDetails,
      coins_deducted: coinsAmount,
      usd_value: usdValue,
      status: "PENDING",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWithdrawals(userId?: string): Promise<WithdrawalRequest[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      let query = sb.from("withdrawals").select("*").order("created_at", { ascending: false });

      if (userId) query = query.eq("user_id", userId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((w: any) => ({
          id: w.id,
          user_id: w.user_id,
          username: w.username,
          reward_name: w.reward_name,
          payout_method: w.payout_method,
          payout_details: w.payout_details,
          coins_deducted: w.coins_deducted,
          usd_value: w.usd_value,
          status: w.status,
          created_at: w.created_at,
        }));
      }
    } catch {}
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem("coinloot_withdrawals_v3");
    if (stored) {
      const parsed: WithdrawalRequest[] = JSON.parse(stored);
      if (userId) return parsed.filter((w) => w.user_id === userId);
      return parsed;
    }
  } catch {}

  return [];
}

export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: string,
  adminId: string
) {
  const sb = getSupabaseClient();
  if (!sb) return;

  const { error } = await sb
    .from("withdrawals")
    .update({ status, processed_by: adminId, processed_at: new Date().toISOString() })
    .eq("id", withdrawalId);

  if (error) throw error;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const results = await Promise.allSettled([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    sb.from("withdrawals").select("*", { count: "exact", head: true }),
    sb.from("profiles").select("balance_coins"),
    sb.from("profiles").select("total_earned_coins"),
  ]);

  const safeCount = (idx: number): number => {
    const r = results[idx];
    if (r.status === "fulfilled" && r.value) return (r.value as any).count ?? 0;
    return 0;
  };

  const safeSum = (idx: number, field: string): number => {
    const r = results[idx];
    if (r.status === "fulfilled" && r.value?.data) {
      return r.value.data.reduce((s: number, item: any) => s + (Number(item[field]) || 0), 0);
    }
    return 0;
  };

  return {
    totalUsers: safeCount(0),
    pendingWithdrawals: safeCount(1),
    totalWithdrawals: safeCount(2),
    totalCoins: safeSum(3, "balance_coins"),
    totalEarned: safeSum(4, "total_earned_coins"),
  };
}

export async function verifyAdminAccess(userId: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;

  const { data } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  return data?.is_admin === true;
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────

export interface PromoClaimResult {
  success: boolean;
  error?: string;
  promo?: any;
  coins?: number;
}

export async function validatePromoCode(code: string, userId: string): Promise<PromoClaimResult> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: "Service unavailable" };

  // Try the promo_codes DB table first
  const { data: promo, error: promoErr } = await sb
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!promoErr && promo) {
    if (new Date(promo.expires_at) < new Date()) return { success: false, error: "This promo code has expired" };
    if (promo.current_uses >= promo.max_uses) return { success: false, error: "This promo code has reached its maximum uses" };

    const { data: existing } = await sb
      .from("promo_code_redemptions")
      .select("*")
      .eq("promo_code_id", promo.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) return { success: false, error: "You have already claimed this promo code" };

    const { error: insertErr } = await sb.from("promo_code_redemptions").insert({
      promo_code_id: promo.id, user_id: userId, coins_awarded: promo.coins,
    });
    if (insertErr) {
      if (insertErr.code === "23505") return { success: false, error: "You have already claimed this promo code" };
      return { success: false, error: "Failed to claim promo code" };
    }

    await sb.from("promo_codes").update({ current_uses: promo.current_uses + 1 }).eq("id", promo.id);
    try { await addCoins(userId, promo.coins, "PROMO_REWARD", `Promo: ${code}`, `Promo code ${code} redeemed for ${promo.coins} coins`); } catch {}
    try {
      const { notifyRegistration } = await import("../utils/adminNotifier");
      const profile = await getProfile(userId);
      const username = profile?.username || userId;
      const { createAdminNotification } = await import("../utils/adminNotifier");
      createAdminNotification("high_value_reward", "🎁 Promo Code Redeemed", `User: ${username}\nCode: ${code}\nCoins: ${promo.coins}`, userId, username, { related_id: code, coins: promo.coins });
    } catch {}
    return { success: true, promo, coins: promo.coins };
  }

  // Fallback: check JSON blob in site_settings (admin-created codes from Announcements & Promo Codes section)
  try {
    const { data: settings } = await sb.from("site_settings").select("setting_value").eq("setting_key", "promo_codes").maybeSingle();
    if (settings?.setting_value) {
      const adminCodes: any[] = JSON.parse(settings.setting_value);
      const match = adminCodes.find((c: any) => c.code === code.toUpperCase() && c.active);
      if (!match) return { success: false, error: "Invalid promo code" };
      if (new Date(match.expiresAt) < new Date()) return { success: false, error: "This promo code has expired" };
      if (match.currentUses >= match.maxUses) return { success: false, error: "This promo code has reached its maximum uses" };

      // Check if user already claimed (using localStorage fallback since JSON blob has no per-user redemption table)
      const claimed: string[] = JSON.parse(localStorage.getItem("coinloot_claimed_promos") || "[]");
      if (claimed.includes(code.toUpperCase())) return { success: false, error: "You have already claimed this promo code" };
      claimed.push(code.toUpperCase());
      localStorage.setItem("coinloot_claimed_promos", JSON.stringify(claimed));

      // Update usage count and persist
      match.currentUses += 1;
      const updated = adminCodes.map((c: any) => c.code === code.toUpperCase() ? match : c);
      try {
        await sb.from("site_settings").update({ setting_value: JSON.stringify(updated) }).eq("setting_key", "promo_codes");
        window.dispatchEvent(new CustomEvent("promo-codes-changed"));
      } catch {}

      try { await addCoins(userId, match.coins, "PROMO_REWARD", `Promo: ${code}`, `Promo code ${code} redeemed for ${match.coins} coins`); } catch {}
      return { success: true, promo: match, coins: match.coins };
    }
  } catch {}

  return { success: false, error: "Invalid promo code" };
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data } = await sb
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        return data;
      }
    } catch {}
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem("coinloot_notifications");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((n: any) => !n.user_id || n.user_id === userId)
          .slice(0, 50);
      }
    }
  } catch {}

  return [];
}

export async function markNotificationRead(notificationId: string) {
  const sb = getSupabaseClient();
  if (!sb) return;

  await sb
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

export async function createTicket(
  userId: string,
  subject: string,
  message: string,
  category: string
) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from("support_tickets")
    .insert({
      user_id: userId,
      subject,
      message,
      category,
      status: "OPEN",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTickets(userId?: string) {
  const sb = getSupabaseClient();
  if (!sb) return [];

  let query = sb.from("support_tickets").select("*").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);

  const { data } = await query;
  return data || [];
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export async function submitKyc(
  userId: string,
  docType: string,
  frontImageUrl: string,
  backImageUrl: string,
  selfieUrl: string
) {
  const sb = getSupabaseClient();
  if (!sb) return;

  const { error } = await sb.from("kyc_records").insert({
    user_id: userId,
    doc_type: docType,
    front_image_url: frontImageUrl,
    back_image_url: backImageUrl,
    selfie_url: selfieUrl,
    status: "PENDING",
  });

  if (error) throw error;

  await sb.from("profiles").update({ kyc_status: "PENDING" }).eq("id", userId);
}

export async function getKycRecords(status?: string) {
  const sb = getSupabaseClient();
  if (!sb) return [];

  let query = sb.from("kyc_records").select("*").order("submitted_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data } = await query;
  return data || [];
}

export async function updateKycStatus(recordId: string, status: string, userId: string) {
  const sb = getSupabaseClient();
  if (!sb) return;

  await sb.from("kyc_records").update({ status }).eq("id", recordId);
  await sb.from("profiles").update({ kyc_status: status }).eq("id", userId);
}

// ─── Earnings History ─────────────────────────────────────────────────────────

export async function getEarningsHistory(userId: string) {
  const sb = getSupabaseClient();
  if (!sb) return [];

  const { data } = await sb
    .from("earnings_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return data || [];
}

// ─── Offerwalls ──────────────────────────────────────────────────────────────

export async function getOfferwallProviders() {
  const sb = getSupabaseClient();
  if (!sb) return [];

  const { data } = await sb
    .from("offerwall_providers")
    .select("*")
    .order("name");

  return data || [];
}

export async function getActiveOfferwalls() {
  const sb = getSupabaseClient();
  if (!sb) return [];

  const { data } = await sb
    .from("offerwalls")
    .select("*, provider:provider_id(name, initials, color)")
    .eq("status", "ACTIVE")
    .order("priority");

  return data || [];
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSetting(key: string) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data } = await sb
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", key)
    .maybeSingle();

  return data?.setting_value || null;
}

export async function getAllSiteSettings() {
  const sb = getSupabaseClient();
  if (!sb) return [];

  const { data } = await sb.from("site_settings").select("*");
  return data || [];
}

// ─── Withdrawal Methods ────────────────────────────────────────────────────────

export async function getWithdrawalMethods(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data } = await sb
        .from("withdrawal_methods")
        .select("*")
        .order("sort_order");

      if (data && data.length > 0) {
        // Map snake_case DB columns to camelCase expected by the component
        return data.map((m: any) => ({
          id: m.id,
          name: m.name,
          icon: m.icon || "💳",
          minCoins: m.min_coins || 1000,
          type: m.name?.toLowerCase().replace(/[^a-z0-9]/g, "_") || "wallet",
          fieldLabel: "Wallet Address / Account",
          placeholder: `Enter your ${m.name} details`,
          description: m.instructions || `Withdraw via ${m.name}. Min: ${(m.min_coins || 1000).toLocaleString()} coins.`,
          status: m.status,
          maxCoins: m.max_coins,
          feePercent: m.fee_percent,
        }));
      }
    } catch {}
  }

  // Fallback to localStorage (admin panel stores withdrawal methods here)
  try {
    const stored = localStorage.getItem("coinloot_payment_methods");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((m: any) => ({
          id: m.id || `pm-${Math.random().toString(36).substring(2, 6)}`,
          name: m.name,
          icon: m.icon || "💳",
          minCoins: m.minCoins || 1000,
          type: m.name?.toLowerCase().replace(/[^a-z0-9]/g, "_") || "wallet",
          fieldLabel: "Wallet Address / Account",
          placeholder: `Enter your ${m.name} details`,
          description: `Withdraw via ${m.name}. Min: ${(m.minCoins || 1000).toLocaleString()} coins.`,
          status: m.status || "ACTIVE",
          maxCoins: m.maxCoins,
          feePercent: m.feePercent,
        }));
      }
    }
  } catch {}

  // Ultimate fallback: default active methods only
  return [
    { id: "paypal", name: "PayPal", icon: "💎", minCoins: 1000, type: "paypal", fieldLabel: "PayPal Email", placeholder: "Enter your PayPal email", description: "Withdraw via PayPal. Min: 1,000 coins.", status: "ACTIVE" },
    { id: "binance", name: "Binance Pay", icon: "🌐", minCoins: 1000, type: "binance", fieldLabel: "Binance UID / Email", placeholder: "Enter your Binance UID or email", description: "Withdraw via Binance Pay. Min: 1,000 coins.", status: "ACTIVE" },
    { id: "usdt", name: "USDT (TRC-20)", icon: "₮", minCoins: 2000, type: "usdt", fieldLabel: "USDT Wallet Address", placeholder: "Enter your TRC-20 wallet address", description: "Withdraw via USDT (TRC-20). Min: 2,000 coins.", status: "ACTIVE" },
  ];
}

// ─── Social Bounty Campaigns (user-facing) ─────────────────────────────────

export async function getActiveCampaigns() {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("social_campaigns").select("*").eq("is_active", true).order("created_at", { ascending: false });
  return data || [];
}

export async function getCampaignWithTasks(campaignId: string) {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data: campaign } = await sb.from("social_campaigns").select("*").eq("id", campaignId).maybeSingle();
  if (!campaign) return null;
  const { data: tasks } = await sb.from("campaign_tasks").select("*").eq("campaign_id", campaignId).eq("is_active", true).order("sort_order", { ascending: true });
  return { ...campaign, tasks: tasks || [] };
}

export async function getUserCampaignSubmissions(userId: string, campaignId?: string) {
  const sb = getSupabaseClient();
  if (!sb) return [];
  let query = sb.from("campaign_submissions").select("*, campaign_submission_screenshots(*)").eq("user_id", userId);
  if (campaignId) query = query.eq("campaign_id", campaignId);
  query = query.order("created_at", { ascending: false });
  const { data } = await query;
  return data || [];
}

export async function submitCampaign(campaignId: string, userId: string, screenshotUrls: string[]) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");

  const { data: campaign } = await sb.from("social_campaigns").select("*").eq("id", campaignId).single();
  if (!campaign) throw new Error("Campaign not found");
  if (!campaign.is_active) throw new Error("Campaign is not active");

  const existing = await getUserCampaignSubmissions(userId, campaignId);
  const hasApproved = existing.some(s => s.status === "approved");
  if (hasApproved) throw new Error("You have already completed this campaign");
  const hasPending = existing.some(s => s.status === "pending");
  if (hasPending) throw new Error("You already have a pending submission for this campaign");

  const { data: submission, error } = await sb.from("campaign_submissions").insert({
    campaign_id: campaignId,
    user_id: userId,
    status: "pending",
    total_reward: campaign.reward_coins,
  }).select().single();
  if (error) throw error;

  if (screenshotUrls.length > 0) {
    const screenshotRows = screenshotUrls.map(url => ({ submission_id: submission.id, screenshot_url: url }));
    const { error: ssError } = await sb.from("campaign_submission_screenshots").insert(screenshotRows);
    if (ssError) throw ssError;
  }

  try {
    const { createAdminNotification } = await import("../utils/adminNotifier");
    createAdminNotification("offer_completed", "🎯 Campaign Submitted", `User submitted campaign "${campaign.title}" for review.`, userId, userId, { related_id: submission.id, campaignId });
  } catch {}

  return submission;
}
