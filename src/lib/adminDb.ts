import { getSupabaseClient } from "./supabase";
import { UserProfile, WithdrawalRequest } from "../types";

// ─── Generic helpers ─────────────────────────────────────────────────────────

async function getSetting(key: string): Promise<string | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.from("site_settings").select("setting_value").eq("setting_key", key).maybeSingle();
  return data?.setting_value ?? null;
}

async function setSetting(key: string, value: string) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { error } = await sb.from("site_settings").upsert(
    { setting_key: key, setting_value: value, setting_type: "string" },
    { onConflict: "setting_key" }
  );
  if (error) throw error;
}

// ─── Homepage Sections ──────────────────────────────────────────────────────

export interface HomepageSections {
  featured: boolean;
  hot: boolean;
  surveys: boolean;
  offerwalls: boolean;
  announcements: boolean;
  promo_cards: boolean;
  rewards: boolean;
  challenges: boolean;
}

export async function getHomepageSections(): Promise<HomepageSections> {
  const val = await getSetting("homepage_sections");
  if (val) {
    try { return JSON.parse(val); } catch {}
  }
  return { featured: true, hot: true, surveys: true, offerwalls: true, announcements: true, promo_cards: true, rewards: true, challenges: true };
}

export async function saveHomepageSections(sections: HomepageSections) {
  await setSetting("homepage_sections", JSON.stringify(sections));
}

// ─── Developer Mode ─────────────────────────────────────────────────────────

export interface DeveloperModeConfig {
  enabled: boolean;
  message: string;
}

export async function getDeveloperMode(): Promise<DeveloperModeConfig> {
  const val = await getSetting("developer_mode");
  if (val) {
    try { return JSON.parse(val); } catch {}
  }
  return { enabled: false, message: "" };
}

export async function saveDeveloperMode(config: DeveloperModeConfig) {
  await setSetting("developer_mode", JSON.stringify(config));
}

// ─── Maintenance Mode ───────────────────────────────────────────────────────

export interface MaintenanceModeConfig {
  enabled: boolean;
  message: string;
}

export async function getMaintenanceMode(): Promise<MaintenanceModeConfig> {
  const val = await getSetting("maintenance_mode");
  if (val) {
    try { return JSON.parse(val); } catch {}
  }
  return { enabled: false, message: "" };
}

export async function saveMaintenanceMode(config: MaintenanceModeConfig) {
  await setSetting("maintenance_mode", JSON.stringify(config));
}

// ─── Global Notification / Promo Banner ────────────────────────────────────

export interface GlobalPromoNotification {
  text: string;
  promoEnabled: boolean;
  promoCode: string;
  promoCoins: number;
  promoDuration: number;
  sentAt: string | null;
  startAt: string | null;
}

export async function getGlobalPromoNotification(): Promise<GlobalPromoNotification> {
  const val = await getSetting("global_promo_notification");
  if (val) {
    try { return JSON.parse(val); } catch {}
  }
  return { text: "", promoEnabled: false, promoCode: "", promoCoins: 0, promoDuration: 0, sentAt: null, startAt: null };
}

export async function saveGlobalPromoNotification(config: GlobalPromoNotification) {
  await setSetting("global_promo_notification", JSON.stringify(config));
}

// ─── VPN Settings ───────────────────────────────────────────────────────────

export interface VpnSettings {
  vpnDetection: boolean;
  vpnWarning: boolean;
  vpnBlock: boolean;
  withdrawalBlock: boolean;
  restrictDuration: number;
}

export async function getVpnSettingsDb(): Promise<VpnSettings> {
  const val = await getSetting("vpn_settings");
  if (val) {
    try { return JSON.parse(val); } catch {}
  }
  return { vpnDetection: true, vpnWarning: true, vpnBlock: true, withdrawalBlock: true, restrictDuration: 30 };
}

export async function saveVpnSettingsDb(settings: VpnSettings) {
  await setSetting("vpn_settings", JSON.stringify(settings));
}

// ─── Lock Rules (locked offerwall conditions) ──────────────────────────────

export interface LockRule {
  id: string;
  name: string;
  type: "coins_earned" | "level" | "tasks_completed";
  value: number;
}

export async function getLockRules(): Promise<LockRule[]> {
  const val = await getSetting("lock_rules");
  if (val) {
    try { return JSON.parse(val); } catch {}
  }
  return [];
}

export async function saveLockRules(rules: LockRule[]) {
  await setSetting("lock_rules", JSON.stringify(rules));
}

// ─── Rewards Config (Social Bounty + Weekly Challenge) ─────────────────────

export interface SocialBountyConfig {
  enabled: boolean;
  title: string;
  description: string;
  icon: string;
  reward_coins: number;
  max_reward_limit: number;
  required_level: number;
  active: boolean;
}

export interface WeeklyChallengeConfig {
  enabled: boolean;
  title: string;
  description: string;
  icon: string;
  reward_coins: number;
  bonus_coins: number;
  required_level: number;
  required_tasks: number;
  completion_conditions: string;
  weekly_reset_rules: string;
  active: boolean;
}

export interface RewardsConfig {
  socialBounty: SocialBountyConfig;
  weeklyChallenge: WeeklyChallengeConfig;
}

export function defaultSocialBounty(): SocialBountyConfig {
  return { enabled: true, title: "Social Bounty Campaign", description: "Complete social tasks and earn bonus coins!", icon: "🎯", reward_coins: 500, max_reward_limit: 5000, required_level: 1, active: true };
}

export function defaultWeeklyChallenge(): WeeklyChallengeConfig {
  return { enabled: true, title: "Weekly Elite Challenge Chest", description: "Complete tasks this week to unlock the elite chest!", icon: "🏆", reward_coins: 1000, bonus_coins: 500, required_level: 5, required_tasks: 10, completion_conditions: "Complete tasks across any offerwall", weekly_reset_rules: "Resets every Monday at 00:00 UTC", active: true };
}

export async function getRewardsConfig(): Promise<RewardsConfig> {
  const val = await getSetting("rewards_config");
  if (val) {
    try { return JSON.parse(val); } catch {}
  }
  return { socialBounty: defaultSocialBounty(), weeklyChallenge: defaultWeeklyChallenge() };
}

export async function saveRewardsConfig(config: RewardsConfig) {
  await setSetting("rewards_config", JSON.stringify(config));
}

// ─── Notifications (create) ─────────────────────────────────────────────────

export interface AdminNotificationInput {
  title: string;
  message: string;
  notification_type: string;
  target_type: "all" | "selected_users" | "single_user";
  target_users?: string[];
  image_url?: string;
  link?: string;
}

export async function createSystemNotification(input: AdminNotificationInput, adminId: string) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb.from("system_notifications").insert({
    title: input.title,
    message: input.message,
    notification_type: input.notification_type,
    target_type: input.target_type,
    target_users: input.target_users ? JSON.stringify(input.target_users) : "[]",
    image_url: input.image_url || null,
    link: input.link || null,
    sent_by: adminId,
    sent_at: new Date().toISOString(),
    is_active: true,
  }).select().single();

  if (error) throw error;
  return data;
}

export async function createUserNotification(userId: string, title: string, description: string, notification_type: string, coinsEarned?: number, sourceName?: string) {
  const sb = getSupabaseClient();
  if (!sb) return;

  await sb.from("notifications").insert({
    user_id: userId,
    title,
    description,
    notification_type,
    coins_earned: coinsEarned || null,
    source_name: sourceName || null,
  });
}

export async function broadcastToAllUsers(title: string, message: string, notification_type: string, adminId: string) {
  await createSystemNotification({ title, message, notification_type, target_type: "all" }, adminId);
}

// ─── System Notifications (read) ───────────────────────────────────────────

export async function getSystemNotifications(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("system_notifications").select("*").eq("is_active", true).order("created_at", { ascending: false });
  return data || [];
}

export async function toggleSystemNotification(id: string, isActive: boolean) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("system_notifications").update({ is_active: isActive }).eq("id", id);
}

export async function deleteSystemNotification(id: string) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("system_notifications").delete().eq("id", id);
}

// ─── Promo Codes (admin CRUD) ──────────────────────────────────────────────

export async function getAdminPromoCodes(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("promo_codes").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function createAdminPromoCode(input: {
  code: string;
  coins: number;
  max_uses: number;
  min_level: number;
  expires_at: string;
  country_restrictions?: string[];
}, adminId: string) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const { data, error } = await sb.from("promo_codes").insert({
    code: input.code.toUpperCase(),
    coins: input.coins,
    max_uses: input.max_uses,
    min_level: input.min_level || 1,
    expires_at: input.expires_at,
    country_restrictions: input.country_restrictions ? JSON.stringify(input.country_restrictions) : "[]",
    created_by: adminId,
  }).select().single();

  if (error) throw error;
  return data;
}

export async function togglePromoCode(id: string, isActive: boolean) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("promo_codes").update({ is_active: isActive }).eq("id", id);
}

export async function updatePromoCode(id: string, updates: Record<string, any>) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("promo_codes").update(updates).eq("id", id);
}

export async function deletePromoCode(id: string) {
  const sb = getSupabaseClient();
  if (!sb) return;
  const { error } = await sb.from("promo_codes").delete().eq("id", id);
  if (error) throw error;
}

export async function getPromoCodeRedemptions(promoCodeId?: string): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  let query = sb.from("promo_code_redemptions").select("*, profiles(id, username)");
  if (promoCodeId) query = query.eq("promo_code_id", promoCodeId);
  query = query.order("redeemed_at", { ascending: false }).limit(100);
  const { data } = await query;
  return data || [];
}

export async function getPromoClaimStats(): Promise<{ total_claims: number; total_rewards: number; promo_breakdown: any[] }> {
  const sb = getSupabaseClient();
  if (!sb) return { total_claims: 0, total_rewards: 0, promo_breakdown: [] };
  const { data: redemptions } = await sb.from("promo_code_redemptions").select("coins_awarded, promo_code_id");
  const { data: promos } = await sb.from("promo_codes").select("id, code");
  if (!redemptions) return { total_claims: 0, total_rewards: 0, promo_breakdown: [] };
  const total_claims = redemptions.length;
  const total_rewards = redemptions.reduce((sum, r) => sum + r.coins_awarded, 0);
  const promoMap = new Map<string, string>();
  if (promos) promos.forEach(p => promoMap.set(p.id, p.code));
  const breakdownMap = new Map<string, { code: string; claims: number; total: number }>();
  redemptions.forEach(r => {
    const key = r.promo_code_id || "unknown";
    const entry = breakdownMap.get(key) || { code: promoMap.get(key) || "Unknown", claims: 0, total: 0 };
    entry.claims++;
    entry.total += r.coins_awarded;
    breakdownMap.set(key, entry);
  });
  return { total_claims, total_rewards, promo_breakdown: Array.from(breakdownMap.values()) };
}

// ─── Withdrawals (admin) ───────────────────────────────────────────────────

export async function getAdminWithdrawals(): Promise<WithdrawalRequest[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(100);
  if (!data) return [];
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

export async function updateWithdrawalStatusAdmin(id: string, status: string) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("withdrawals").update({ status, processed_at: new Date().toISOString() }).eq("id", id);
}

// ─── Withdrawal Methods (admin CRUD) ───────────────────────────────────────

export async function getAdminWithdrawalMethods(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("withdrawal_methods").select("*").order("sort_order");
  return data || [];
}

export async function updateWithdrawalMethod(id: string, updates: Record<string, any>) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("withdrawal_methods").update(updates).eq("id", id);
}

export async function toggleWithdrawalMethod(id: string, status: "ACTIVE" | "INACTIVE") {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("withdrawal_methods").update({ status }).eq("id", id);
}

// ─── Offerwalls / Offerwall Providers (admin) ──────────────────────────────

export async function getAdminOfferwalls(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("offerwalls").select("*, provider:provider_id(name, initials, color, logo_url)").order("priority");
  return data || [];
}

export async function updateOfferwallStatus(id: string, status: "ACTIVE" | "INACTIVE" | "LOCKED") {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("offerwalls").update({ status }).eq("id", id);
}

export async function getAdminOfferwallProviders(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("offerwall_providers").select("*").order("name");
  return data || [];
}

export async function updateOfferwallProvider(id: string, updates: Record<string, any>) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("offerwall_providers").update(updates).eq("id", id);
}

// ─── Rewards Store (admin CRUD) ────────────────────────────────────────────

export async function getAdminRewards(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("rewards").select("*").order("min_coins");
  return data || [];
}

export async function createAdminReward(input: {
  name: string;
  icon: string;
  min_coins: number;
  reward_type: string;
  fields: string[];
}) {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from("rewards").insert({
    name: input.name,
    icon: input.icon,
    min_coins: input.min_coins,
    reward_type: input.reward_type,
    fields: JSON.stringify(input.fields),
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateAdminReward(id: string, updates: Record<string, any>) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("rewards").update(updates).eq("id", id);
}

export async function deleteAdminReward(id: string) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("rewards").delete().eq("id", id);
}

// ─── Support Tickets (admin) ───────────────────────────────────────────────

export async function getAdminTickets(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("support_tickets").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function updateTicketStatus(id: string, status: string) {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("support_tickets").update({ status }).eq("id", id);
}

// ─── Offers (admin CRUD) ─────────────────────────────────────────────────────

export async function getOffers(): Promise<any[]> {
  const val = await getSetting("offers");
  if (val) {
    try { return JSON.parse(val); } catch {}
  }
  // Fallback to localStorage when Supabase is unavailable
  try {
    const saved = localStorage.getItem("coinloot_offers");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return [];
}

export async function saveOffers(offers: any[]) {
  await setSetting("offers", JSON.stringify(offers));
}

// ─── Promo Codes (stored in site_settings as JSON blob) ──────────────────────

export async function getPromoCodes(): Promise<any[]> {
  const val = await getSetting("promo_codes");
  if (val) {
    try { return JSON.parse(val); } catch {}
  }
  return [];
}

export async function savePromoCodes(codes: any[]) {
  await setSetting("promo_codes", JSON.stringify(codes));
}

// ─── Site Settings (generic read/write) ────────────────────────────────────

export async function getAllSettings(): Promise<Record<string, string>> {
  const sb = getSupabaseClient();
  if (!sb) return {};
  const { data } = await sb.from("site_settings").select("setting_key, setting_value");
  if (!data) return {};
  const map: Record<string, string> = {};
  for (const row of data) {
    map[row.setting_key] = row.setting_value;
  }
  return map;
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function getActiveAnnouncements(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false });
  return data || [];
}

export async function getAdminAnnouncements(): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("announcements").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function createAnnouncement(input: { title: string; message: string }, adminId: string) {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from("announcements").insert({
    title: input.title,
    message: input.message,
    is_active: true,
    created_by: adminId,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateAnnouncement(id: string, updates: { title?: string; message?: string; is_active?: boolean }) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { error } = await sb.from("announcements").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function toggleAnnouncementStatus(id: string, isActive: boolean) {
  await updateAnnouncement(id, { is_active: isActive });
}

export async function deleteAnnouncement(id: string) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { error } = await sb.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

// ─── Social Campaigns (admin) ─────────────────────────────────────────────

export interface CampaignTask {
  id?: string;
  campaign_id?: string;
  task_title: string;
  task_description?: string;
  reward_coins: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface SocialCampaign {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  reward_coins: number;
  completion_mode: "all" | "any";
  max_screenshots?: number;
  required_level?: number;
  is_active?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getCampaigns(): Promise<SocialCampaign[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("social_campaigns").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function getCampaignById(id: string): Promise<SocialCampaign | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.from("social_campaigns").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function createCampaign(campaign: Partial<SocialCampaign>) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const user = (await sb.auth.getUser()).data.user;
  const { error } = await sb.from("social_campaigns").insert({
    ...campaign,
    created_by: user?.id,
  });
  if (error) throw error;
}

export async function updateCampaign(id: string, updates: Partial<SocialCampaign>) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { error } = await sb.from("social_campaigns").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteCampaign(id: string) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { error } = await sb.from("social_campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function getCampaignTasks(campaignId: string): Promise<CampaignTask[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data } = await sb.from("campaign_tasks").select("*").eq("campaign_id", campaignId).order("sort_order", { ascending: true });
  return data || [];
}

export async function createCampaignTask(task: CampaignTask) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { error } = await sb.from("campaign_tasks").insert(task);
  if (error) throw error;
}

export async function updateCampaignTask(id: string, updates: Partial<CampaignTask>) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { error } = await sb.from("campaign_tasks").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteCampaignTask(id: string) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { error } = await sb.from("campaign_tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function getCampaignSubmissions(campaignId?: string): Promise<any[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  let query = sb.from("campaign_submissions").select("*, profiles(id, username), campaign_submission_screenshots(*)");
  if (campaignId) query = query.eq("campaign_id", campaignId);
  query = query.order("created_at", { ascending: false });
  const { data } = await query;
  return data || [];
}

export async function approveCampaignSubmission(id: string, adminId: string) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { data: submission } = await sb.from("campaign_submissions").select("*").eq("id", id).single();
  if (!submission) throw new Error("Submission not found");
  const { error } = await sb.from("campaign_submissions").update({
    status: "approved",
    reviewed_by: adminId,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
  await sb.rpc("add_coins", { p_user_id: submission.user_id, p_coins: submission.total_reward, p_description: `Campaign reward: ${submission.campaign_id}` });
}

export async function rejectCampaignSubmission(id: string, adminId: string, notes?: string) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error("Supabase client not available");
  const { error } = await sb.from("campaign_submissions").update({
    status: "rejected",
    reviewed_by: adminId,
    reviewed_at: new Date().toISOString(),
    admin_notes: notes,
  }).eq("id", id);
  if (error) throw error;
}
