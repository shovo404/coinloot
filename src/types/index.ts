export interface UserProfile {
  id: string;
  username: string;
  email: string;
  balance_coins: number;
  balance_usd: number;
  xp: number;
  level: number;
  streak_days: number;
  referred_by: string | null;
  referrals_count: number;
  total_earned_coins: number;
  total_withdrawn_usd: number;
  kyc_status: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  kyc_required: boolean;
  registration_ip?: string;
  is_admin: boolean;
  admin_role?: 'ADMIN';
  vpn_detected: boolean;
  device_fingerprint: string;
  country?: string;
  is_banned?: boolean;
  restricted_until?: string | null;
  avatar_url?: string;
  preference_theme?: string;
  preference_language?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  payout_coins: number;
  category: 'trending' | 'high-paying' | 'new' | 'recommended' | 'ai';
  provider: string;
  imageUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  link: string;
}

export interface RewardItem {
  id: string;
  name: string;
  icon: string;
  minCoins: number;
  fields: string[];
  type: 'paypal' | 'skrill' | 'binance' | 'payeer' | 'usdt' | 'giftcard';
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  username: string;
  reward_name: string;
  payout_method: string;
  payout_details: string;
  coins_deducted: number;
  usd_value: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface ReferrerRewardLog {
  id: string;
  referrer_id: string;
  ref_username: string;
  level: number; // 1, 2, or 3
  coins_awarded: number;
  created_at: string;
}

export interface LiveEarningFeed {
  id: string;
  username: string;
  provider: string;
  coins: number;
  timestamp: string;
}

// ── Admin Types ──────────────────────────────────────────────────────────────

export interface OfferwallConfig {
  id: string;
  name: string;
  slug: string;
  initials: string;
  color: string;
  category: 'surveys' | 'main' | 'mobile' | 'extra';
  logoUrl: string;
  domain: string;
  apiKey: string;
  publisherId: string;
  secretKey: string;
  postbackUrl: string;
  status: 'active' | 'inactive';
  priority: number;
  countryRestrictions: string[];
  lockedCondition?: {
    type: 'coins_earned' | 'level' | 'tasks_completed';
    value: number;
  };
  connected: boolean;
  apiConnected: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  coins: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  countryRestriction: string[];
  active: boolean;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface SiteSettings {
  siteName: string;
  logo: string;
  coinToUsdRate: number;
  minWithdrawal: number;
  referralRewardPercent: number;
  referralLevel2Percent: number;
  referralLevel3Percent: number;
  dailyStreakBase: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  notificationSound: boolean;
  popupEnabled: boolean;
  maintenanceMode: boolean;
}

export interface WithdrawalMethodConfig {
  id: string;
  name: string;
  icon: string;
  minCoins: number;
  maxCoins: number;
  feePercent: number;
  apiConnected: boolean;
  apiCredentials: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UserStatus {
  userId: string;
  isSuspended: boolean;
  isBanned: boolean;
  banReason: string;
  suspendedAt: string | null;
  bannedAt: string | null;
}


