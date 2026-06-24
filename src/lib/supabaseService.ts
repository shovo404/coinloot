import { getSupabaseClient } from "./supabase";
import { UserProfile, WithdrawalRequest, PromoCode } from "../types";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, username: string) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data: authData, error: authError } = await sb.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (authError) throw authError;

  if (authData.user) {
    // Create profile in profiles table (trigger handles referral link + notif settings)
    const { error: profileError } = await sb.from("profiles").insert({
      id: authData.user.id,
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
    if (profileError) throw profileError;
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

  const { error } = await sb.from("profiles").update(dbUpdates).eq("id", userId);
  if (error) throw error;
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
    vpn_detected: data.vpn_detected || false,
    device_fingerprint: data.device_fingerprint || "",
    country: data.country || "",
    avatar_url: data.avatar_url || undefined,
    preference_theme: data.preference_theme || undefined,
    preference_language: data.preference_language || undefined,
    is_banned: data.is_banned || false,
    registration_ip: data.registration_ip || undefined,
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

  // Update profile
  await sb
    .from("profiles")
    .update({
      balance_coins: newBalance,
      balance_usd: newBalance / 1000,
      total_earned_coins: newTotalEarned,
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
  if (!sb) return [];

  let query = sb.from("withdrawals").select("*").order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error || !data) return [];

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

export async function validatePromoCode(code: string, userId: string) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  // Find active promo code
  const { data: promo } = await sb
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!promo) return null;
  if (promo.current_uses >= promo.max_uses) return null;
  if (new Date(promo.expires_at) < new Date()) return null;

  // Check if user already redeemed
  const { data: existing } = await sb
    .from("promo_code_redemptions")
    .select("*")
    .eq("promo_code_id", promo.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return null;

  // Award coins
  await addCoins(userId, promo.coins, "PROMO_REWARD", `Promo: ${code}`, `Promo code ${code} redeemed for ${promo.coins} coins`);

  // Record redemption
  await sb.from("promo_code_redemptions").insert({
    promo_code_id: promo.id,
    user_id: userId,
    coins_awarded: promo.coins,
  });

  // Increment usage count
  await sb
    .from("promo_codes")
    .update({ current_uses: promo.current_uses + 1 })
    .eq("id", promo.id);

  return promo;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  const sb = getSupabaseClient();
  if (!sb) return [];

  const { data } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
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
