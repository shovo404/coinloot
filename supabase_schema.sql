-- ====================================================================
-- COIN LOOT - COMPLETE DATABASE SCHEMA (FULLY IDEMPOTENT)
-- Project ID: advxrogjhjkrwgzlxqwn
-- Safe to run multiple times — no "already exists" errors
-- Includes: tables, relationships, indexes, constraints, functions,
--           triggers, RLS policies, seed data, default settings,
--           admin account config, user levels, payment methods,
--           offerwall providers, rewards, and demo/test user data.
-- Executable top-to-bottom in Supabase SQL Editor.
-- ====================================================================

-- ════════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE LEGACY CLEANUP — Drop ALL existing tables with CASCADE
-- This ensures the schema is 100%% idempotent regardless of what
-- was run before. All policies on these tables are removed too.

drop table if exists public.achievement_rewards cascade;
drop table if exists public.admin_accounts cascade;
drop table if exists public.admin_activity_logs cascade;
drop table if exists public.api_integrations cascade;
drop table if exists public.coin_transactions cascade;
drop table if exists public.daily_rewards cascade;
drop table if exists public.earnings_history cascade;
drop table if exists public.email_verifications cascade;
drop table if exists public.fraud_detection_logs cascade;
drop table if exists public.ip_logs cascade;
drop table if exists public.leaderboard_statistics cascade;
drop table if exists public.live_earnings cascade;
drop table if exists public.locked_offerwalls cascade;
drop table if exists public.login_history cascade;
drop table if exists public.notification_settings cascade;
drop table if exists public.notifications cascade;
drop table if exists public.offer_unlock_rules cascade;
drop table if exists public.offerwall_api_configs cascade;
drop table if exists public.offerwall_providers cascade;
drop table if exists public.offerwall_status_history cascade;
drop table if exists public.offerwalls cascade;
drop table if exists public.profiles cascade;
drop table if exists public.promo_code_redemptions cascade;
drop table if exists public.promo_codes cascade;
drop table if exists public.referral_earnings cascade;
drop table if exists public.referral_links cascade;
drop table if exists public.restriction_history cascade;
drop table if exists public.rewards cascade;
drop table if exists public.security_logs cascade;
drop table if exists public.site_settings cascade;
drop table if exists public.support_tickets cascade;
drop table if exists public.surveys cascade;
drop table if exists public.system_notifications cascade;
drop table if exists public.ticket_replies cascade;
drop table if exists public.user_activity_logs cascade;
drop table if exists public.user_balances cascade;
drop table if exists public.user_levels cascade;
drop table if exists public.user_restrictions cascade;
drop table if exists public.vpn_detection_logs cascade;
drop table if exists public.wallet_configurations cascade;
drop table if exists public.withdrawal_methods cascade;
drop table if exists public.withdrawals cascade;

-- ════════════════════════════════════════════════════════════════════

drop table if exists public.vpn_detection_logs cascade;
drop table if exists public.user_restrictions cascade;
drop table if exists public.restriction_history cascade;
drop table if exists public.users cascade;
drop table if exists public.user_ip_logs cascade;
drop table if exists public.reward_configs cascade;
drop table if exists public.kyc_documents cascade;
drop table if exists public.admin_notifications cascade;
drop table if exists public.admin_logs cascade;
drop table if exists public._test_connection cascade;
drop table if exists public.admin_users cascade;
drop table if exists public.offers cascade;
drop table if exists public.notifications_old cascade;
drop table if exists public.referral_rewards cascade;
drop table if exists public.email_verifications_old cascade;

-- ════════════════════════════════════════════════════════════════════
-- 1. USER SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 1a. User Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  full_name text,
  country text default 'BD',
  avatar_url text,
  balance_coins integer default 0 not null,
  balance_usd numeric(10,2) default 0.00 not null,
  xp integer default 0 not null,
  level integer default 1 not null,
  streak_days integer default 0 not null,
  last_daily_claim timestamp with time zone,
  referred_by uuid references public.profiles(id) on delete set null,
  referrals_count integer default 0 not null,
  total_earned_coins integer default 0 not null,
  total_earned_usd numeric(10,2) default 0.00 not null,
  total_withdrawn_usd numeric(10,2) default 0.00 not null,
  kyc_status text default 'NOT_STARTED' check (kyc_status in ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED')),
  is_admin boolean default false not null,
  is_banned boolean default false not null,
  is_suspended boolean default false not null,
  ban_reason text,
  suspended_at timestamp with time zone,
  banned_at timestamp with time zone,
  vpn_detected boolean default false not null,
  device_fingerprint text,
  last_login_at timestamp with time zone,
  preference_theme text default 'dark' check (preference_theme in ('dark', 'light', 'system')),
  preference_language text default 'en',
  notification_email boolean default true,
  notification_push boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1b. User Balances (transactional balance tracking)
create table if not exists public.user_balances (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  balance_coins integer not null default 0,
  balance_usd numeric(10,2) not null default 0.00,
  xp integer not null default 0,
  level integer not null default 1,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1c. User Levels Configuration
create table if not exists public.user_levels (
  id uuid default uuid_generate_v4() primary key,
  level_number integer unique not null,
  level_name text not null,
  xp_required integer not null,
  bonus_coins integer default 0,
  daily_bonus_multiplier numeric(3,2) default 1.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1d. Login History
create table if not exists public.login_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ip_address inet,
  user_agent text,
  device_type text,
  country text,
  city text,
  isp text,
  vpn_detected boolean default false,
  login_success boolean default true,
  login_method text default 'email',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1e. Email Verification
create table if not exists public.email_verifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone not null default timezone('utc'::text, now()) + interval '24 hours',
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1f. User Activity Logs
create table if not exists public.user_activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action_type text not null,
  action_details jsonb,
  ip_address inet,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 2. ADMIN & ROLES SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 2a. Admin Accounts (links auth users to admin role)
create table if not exists public.admin_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  role text not null default 'ADMIN' check (role in ('ADMIN')),
  is_active boolean default true,
  last_active_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2b. Admin Activity Logs
create table if not exists public.admin_activity_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) on delete cascade not null,
  admin_name text not null,
  action text not null,
  target_type text not null,
  target_id text,
  details text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2c. Security Logs
create table if not exists public.security_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  severity text not null check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  event_type text not null,
  description text not null,
  ip_address inet,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2d. VPN / Fraud Detection Logs
create table if not exists public.fraud_detection_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  detection_type text not null check (detection_type in ('VPN', 'PROXY', 'TOR', 'SUSPICIOUS_IP', 'MULTIPLE_ACCOUNTS', 'CLICK_FRAUD', 'MANUAL_FLAG')),
  confidence_score numeric(5,2) default 0.00,
  ip_address inet,
  country text,
  isp text,
  details jsonb,
  action_taken text,
  resolved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 3. OFFERWALL SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 3a. Offerwall Providers
create table if not exists public.offerwall_providers (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  initials text not null,
  color text,
  logo_url text,
  website_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3b. Offerwall API Configurations (secure credential storage)
create table if not exists public.offerwall_api_configs (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references public.offerwall_providers(id) on delete cascade not null unique,
  api_key text,
  publisher_id text,
  secret_key text,
  api_endpoint text,
  api_version text,
  api_connected boolean default false,
  last_sync_at timestamp with time zone,
  webhook_secret text,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3c. Offerwalls (individual offerwall instances with status)
create table if not exists public.offerwalls (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references public.offerwall_providers(id) on delete cascade not null,
  name text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'LOCKED')),
  priority integer default 0,
  country_restrictions jsonb default '[]',
  device_restrictions jsonb default '[]',
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3d. Locked Offerwalls (conditional unlock)
create table if not exists public.locked_offerwalls (
  id uuid default uuid_generate_v4() primary key,
  offerwall_id uuid references public.offerwalls(id) on delete cascade not null unique,
  is_locked boolean default true,
  unlock_condition_type text not null check (unlock_condition_type in ('coins_earned', 'level', 'tasks_completed')),
  unlock_condition_value integer not null,
  is_active boolean default true,
  locked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unlocked_at timestamp with time zone
);

-- 3e. Offer Unlock Rules
create table if not exists public.offer_unlock_rules (
  id uuid default uuid_generate_v4() primary key,
  offerwall_id uuid references public.offerwalls(id) on delete cascade not null,
  rule_type text not null check (rule_type in ('min_level', 'min_coins_earned', 'country', 'device', 'new_users_only', 'returning_users_only')),
  rule_value text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3f. Offerwall Status History
create table if not exists public.offerwall_status_history (
  id uuid default uuid_generate_v4() primary key,
  offerwall_id uuid references public.offerwalls(id) on delete cascade not null,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 4. SURVEYS
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.surveys (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references public.offerwall_providers(id) on delete cascade,
  title text not null,
  description text,
  payout_coins integer not null,
  category text,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  image_url text,
  link text,
  country_restrictions jsonb default '[]',
  is_active boolean default true,
  total_slots integer default 1000,
  remaining_slots integer default 1000,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 5. COIN & TRANSACTION SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 5a. Coin Transactions (every coin movement logged)
create table if not exists public.coin_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  transaction_type text not null check (transaction_type in (
    'OFFER_COMPLETED', 'SURVEY_COMPLETED', 'REFERRAL_REWARD', 'DAILY_REWARD',
    'BONUS_REWARD', 'PROMO_REWARD', 'ACHIEVEMENT_REWARD', 'ADMIN_CREDIT',
    'ADMIN_DEBIT', 'WITHDRAWAL', 'REFUND', 'SYSTEM_CREDIT', 'SYSTEM_DEBIT',
    'REWARD_REDEMPTION', 'LEVEL_UP_BONUS', 'STREAK_BONUS', 'SPECIAL_EVENT'
  )),
  amount_coins integer not null,
  amount_usd numeric(10,2),
  balance_after_coins integer not null,
  balance_after_usd numeric(10,2),
  source text,
  source_id text,
  reference_id text,
  description text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5b. Earnings History
create table if not exists public.earnings_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  source_type text not null check (source_type in ('offerwall', 'survey', 'referral', 'daily', 'bonus', 'promo', 'achievement', 'admin', 'event', 'other')),
  source_name text not null,
  source_logo text,
  coins_earned integer not null,
  usd_value numeric(10,2),
  provider_name text,
  offer_title text,
  status text default 'COMPLETED' check (status in ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  reference_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5c. Live Earnings Feed
create table if not exists public.live_earnings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  username text not null,
  provider text not null,
  coins_earned integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 6. NOTIFICATION SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 6a. Notifications
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  notification_type text not null check (notification_type in (
    'offer_completed', 'survey_completed', 'referral_reward', 'daily_reward',
    'bonus_reward', 'promo_reward', 'achievement_reward', 'admin_credit',
    'system_reward', 'withdrawal_status', 'level_up', 'system', 'security_alert'
  )),
  coins_earned integer,
  source_name text,
  source_logo text,
  image_url text,
  link text,
  is_read boolean default false,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6b. Notification Settings (per-user)
create table if not exists public.notification_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  email_offers boolean default true,
  email_surveys boolean default true,
  email_withdrawals boolean default true,
  email_promotions boolean default false,
  push_offers boolean default true,
  push_rewards boolean default true,
  push_withdrawals boolean default true,
  sound_enabled boolean default true,
  popup_enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6c. System Notifications (admin-created broadcast)
create table if not exists public.system_notifications (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  message text not null,
  image_url text,
  link text,
  notification_type text not null,
  target_type text not null check (target_type in ('all', 'selected_users', 'single_user')),
  target_users jsonb default '[]',
  sent_count integer default 0,
  sent_by uuid references public.profiles(id) on delete set null,
  is_active boolean default true,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 7. WITHDRAWAL SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 7a. Withdrawal Method Configurations
create table if not exists public.withdrawal_methods (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  icon text,
  min_coins integer not null default 1000,
  max_coins integer not null default 50000,
  fee_percent numeric(5,2) default 0.00,
  fee_fixed_coins integer default 0,
  api_connected boolean default false,
  api_credentials jsonb default '{}',
  instructions text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7b. Withdrawal Requests
create table if not exists public.withdrawals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  username text not null,
  reward_name text not null,
  payout_method text not null,
  payout_details text not null,
  coins_deducted integer not null,
  usd_value numeric(10,2) not null,
  processing_fee_coins integer default 0,
  final_usd_value numeric(10,2),
  wallet_address text,
  admin_notes text,
  status text default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')),
  processed_by uuid references public.profiles(id) on delete set null,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7c. Wallet Configurations (user-stored wallet addresses)
create table if not exists public.wallet_configurations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  method_id uuid references public.withdrawal_methods(id) on delete cascade not null,
  wallet_address text not null,
  wallet_label text,
  is_default boolean default false,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 8. REFERRAL SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 8a. Referral Links
create table if not exists public.referral_links (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  referral_code text unique not null,
  total_clicks integer default 0,
  total_signups integer default 0,
  total_earnings_coins integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8b. Referral Earnings Log
create table if not exists public.referral_earnings (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_user_id uuid references public.profiles(id) on delete cascade not null,
  ref_username text not null,
  level_depth integer not null check (level_depth in (1, 2, 3)),
  coins_awarded integer not null,
  percentage numeric(5,2) not null,
  source_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 9. PROMO CODE SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 9a. Promo Codes
create table if not exists public.promo_codes (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  coins integer not null,
  max_uses integer not null default 100,
  current_uses integer default 0,
  min_level integer default 1,
  country_restrictions jsonb default '[]',
  expires_at timestamp with time zone not null,
  is_active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9b. Promo Code Redemptions
create table if not exists public.promo_code_redemptions (
  id uuid default uuid_generate_v4() primary key,
  promo_code_id uuid references public.promo_codes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  coins_awarded integer not null,
  redeemed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(promo_code_id, user_id)
);

-- 9b2. Announcements
create table if not exists public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  message text not null,
  is_active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9b3. Social Bounty Campaigns
create table if not exists public.social_campaigns (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  icon text default '🎯',
  reward_coins integer not null default 0,
  completion_mode text not null default 'all' check (completion_mode in ('all', 'any')),
  max_screenshots integer default 5,
  required_level integer default 1,
  is_active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.campaign_tasks (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.social_campaigns(id) on delete cascade not null,
  task_title text not null,
  task_description text,
  reward_coins integer not null default 0,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.campaign_submissions (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.social_campaigns(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamp with time zone,
  total_reward integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.campaign_submission_screenshots (
  id uuid default uuid_generate_v4() primary key,
  submission_id uuid references public.campaign_submissions(id) on delete cascade not null,
  screenshot_url text not null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 9c. KYC Records
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.kyc_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  doc_type text not null,
  front_image_url text,
  back_image_url text,
  selfie_url text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create index if not exists idx_kyc_records_user_id on public.kyc_records(user_id);
create index if not exists idx_kyc_records_status on public.kyc_records(status);

alter table public.kyc_records enable row level security;

drop policy if exists "Users can view own KYC" on public.kyc_records;
create policy "Users can view own KYC" on public.kyc_records
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own KYC" on public.kyc_records;
create policy "Users can insert own KYC" on public.kyc_records
  for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all KYC" on public.kyc_records;
create policy "Admins can view all KYC" on public.kyc_records
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Admins can update KYC" on public.kyc_records;
create policy "Admins can update KYC" on public.kyc_records
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create or replace function public.fn_sync_kyc_status()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set kyc_status = new.status
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists tr_sync_kyc_status on public.kyc_records;
create trigger tr_sync_kyc_status
  after insert or update of status on public.kyc_records
  for each row
  execute function public.fn_sync_kyc_status();


-- ════════════════════════════════════════════════════════════════════
-- 10. REWARDS SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 10a. Rewards Store Items
create table if not exists public.rewards (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text,
  min_coins integer not null,
  reward_type text not null check (reward_type in ('paypal', 'skrill', 'binance', 'payeer', 'usdt', 'giftcard', 'bitcoin', 'ethereum', 'litecoin')),
  fields jsonb default '[]',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10b. Daily Rewards Tracking
create table if not exists public.daily_rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  day_number integer not null check (day_number between 1 and 30),
  coins_awarded integer not null,
  streak_bonus integer default 0,
  claimed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10c. Achievement Rewards
create table if not exists public.achievement_rewards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_key text not null,
  achievement_name text not null,
  coins_awarded integer not null,
  criteria_met jsonb,
  claimed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 11. LEADERBOARD SYSTEM
-- ════════════════════════════════════════════════════════════════════

-- 11a. Leaderboard Statistics (materialized for performance)
create table if not exists public.leaderboard_statistics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  username text not null,
  avatar_url text,
  total_earned_coins integer default 0,
  total_earned_usd numeric(10,2) default 0.00,
  total_withdrawn_coins integer default 0,
  total_withdrawn_usd numeric(10,2) default 0.00,
  referrals_count integer default 0,
  level integer default 1,
  xp integer default 0,
  offers_completed integer default 0,
  surveys_completed integer default 0,
  daily_rank integer,
  weekly_rank integer,
  monthly_rank integer,
  all_time_rank integer,
  daily_earnings integer default 0,
  weekly_earnings integer default 0,
  monthly_earnings integer default 0,
  last_daily_reset timestamp with time zone,
  last_weekly_reset timestamp with time zone,
  last_monthly_reset timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 12. SUPPORT TICKETS
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  message text not null,
  category text check (category in ('withdrawal', 'offer', 'account', 'payment', 'technical', 'other')),
  priority text default 'NORMAL' check (priority in ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status text default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.ticket_replies (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  is_admin_reply boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- 13. SITE SETTINGS & CONFIGURATION
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.site_settings (
  id uuid default uuid_generate_v4() primary key,
  setting_key text unique not null,
  setting_value text not null,
  setting_type text default 'string',
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13b. API Integrations (external service credentials)
create table if not exists public.api_integrations (
  id uuid default uuid_generate_v4() primary key,
  service_name text unique not null,
  service_type text not null check (service_type in ('payment', 'email', 'sms', 'analytics', 'storage', 'social', 'other')),
  api_key text,
  api_secret text,
  webhook_url text,
  is_active boolean default true,
  last_test_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════════════════
-- INDEXES (Performance Optimization — all use IF NOT EXISTS)
-- ════════════════════════════════════════════════════════════════════

-- Profiles
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_coins on public.profiles(balance_coins desc);
create index if not exists idx_profiles_xp on public.profiles(xp desc);
create index if not exists idx_profiles_level on public.profiles(level desc);
create index if not exists idx_profiles_referred_by on public.profiles(referred_by);
create index if not exists idx_profiles_is_admin on public.profiles(is_admin);
create index if not exists idx_profiles_kyc_status on public.profiles(kyc_status);
create index if not exists idx_profiles_vpn_detected on public.profiles(vpn_detected);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

-- Login History
create index if not exists idx_login_history_user on public.login_history(user_id);
create index if not exists idx_login_history_created on public.login_history(created_at desc);
create index if not exists idx_login_history_vpn on public.login_history(vpn_detected);

-- Notifications
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read);
create index if not exists idx_notifications_created on public.notifications(created_at desc);

-- Coin Transactions
create index if not exists idx_coin_tx_user on public.coin_transactions(user_id);
create index if not exists idx_coin_tx_type on public.coin_transactions(transaction_type);
create index if not exists idx_coin_tx_created on public.coin_transactions(created_at desc);
create index if not exists idx_coin_tx_source on public.coin_transactions(source, source_id);

-- Earnings History
create index if not exists idx_earnings_user on public.earnings_history(user_id);
create index if not exists idx_earnings_source on public.earnings_history(source_type);
create index if not exists idx_earnings_created on public.earnings_history(created_at desc);

-- Withdrawals
create index if not exists idx_withdrawals_user on public.withdrawals(user_id);
create index if not exists idx_withdrawals_status on public.withdrawals(status);
create index if not exists idx_withdrawals_created on public.withdrawals(created_at desc);
create index if not exists idx_withdrawals_payout on public.withdrawals(payout_method);

-- Live Earnings
create index if not exists idx_earnings_feed on public.live_earnings(created_at desc);

-- Offerwalls
create index if not exists idx_offerwalls_status on public.offerwalls(status);
create index if not exists idx_offerwalls_priority on public.offerwalls(priority);
create index if not exists idx_offerwalls_provider on public.offerwalls(provider_id);

-- Promo Codes
create index if not exists idx_promo_codes_code on public.promo_codes(code);
create index if not exists idx_promo_codes_active on public.promo_codes(is_active);

-- Referrals
create index if not exists idx_referral_earnings_referrer on public.referral_earnings(referrer_id);
create index if not exists idx_referral_earnings_level on public.referral_earnings(level_depth);

-- Leaderboard
create index if not exists idx_leaderboard_earnings on public.leaderboard_statistics(total_earned_coins desc);
create index if not exists idx_leaderboard_weekly on public.leaderboard_statistics(weekly_earnings desc);
create index if not exists idx_leaderboard_monthly on public.leaderboard_statistics(monthly_earnings desc);

-- Admin Logs
create index if not exists idx_admin_logs_action on public.admin_activity_logs(action);
create index if not exists idx_admin_logs_created on public.admin_activity_logs(created_at desc);
create index if not exists idx_admin_logs_admin on public.admin_activity_logs(admin_id);

-- Fraud Detection
create index if not exists idx_fraud_user on public.fraud_detection_logs(user_id);
create index if not exists idx_fraud_type on public.fraud_detection_logs(detection_type);

-- Support Tickets
create index if not exists idx_tickets_user on public.support_tickets(user_id);
create index if not exists idx_tickets_status on public.support_tickets(status);

-- Daily Rewards
create index if not exists idx_daily_rewards_user on public.daily_rewards(user_id, day_number);

-- Security Logs
create index if not exists idx_security_logs_severity on public.security_logs(severity);
create index if not exists idx_security_logs_created on public.security_logs(created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- TRIGGERS & FUNCTIONS
-- ════════════════════════════════════════════════════════════════════

-- Drop all triggers and functions first so they can be safely recreated
drop function if exists public.fn_update_timestamp() cascade;
drop function if exists public.fn_log_coin_transaction() cascade;
drop function if exists public.fn_update_level_by_xp() cascade;
drop function if exists public.fn_create_notification_settings() cascade;
drop function if exists public.fn_create_referral_link() cascade;
drop function if exists public.fn_update_leaderboard() cascade;
drop function if exists public.fn_distribute_referral_rewards() cascade;
drop function if exists public.fn_reset_daily_leaderboard() cascade;
drop function if exists public.fn_reset_weekly_leaderboard() cascade;
drop function if exists public.fn_reset_monthly_leaderboard() cascade;
drop function if exists public.fn_process_withdrawal(uuid, text, uuid) cascade;
drop function if exists public.fn_admin_add_coins(uuid, integer, uuid, text) cascade;
drop function if exists public.fn_is_admin() cascade;

-- Trigger: Auto-update updated_at timestamp
create or replace function public.fn_update_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Apply updated_at trigger to all relevant tables
drop trigger if exists tr_profiles_updated_at on public.profiles;
create trigger tr_profiles_updated_at
  before update on public.profiles
  for each row execute function public.fn_update_timestamp();

drop trigger if exists tr_offerwall_providers_updated_at on public.offerwall_providers;
create trigger tr_offerwall_providers_updated_at
  before update on public.offerwall_providers
  for each row execute function public.fn_update_timestamp();

drop trigger if exists tr_offerwall_api_configs_updated_at on public.offerwall_api_configs;
create trigger tr_offerwall_api_configs_updated_at
  before update on public.offerwall_api_configs
  for each row execute function public.fn_update_timestamp();

drop trigger if exists tr_offerwalls_updated_at on public.offerwalls;
create trigger tr_offerwalls_updated_at
  before update on public.offerwalls
  for each row execute function public.fn_update_timestamp();

drop trigger if exists tr_surveys_updated_at on public.surveys;
create trigger tr_surveys_updated_at
  before update on public.surveys
  for each row execute function public.fn_update_timestamp();

drop trigger if exists tr_withdrawal_methods_updated_at on public.withdrawal_methods;
create trigger tr_withdrawal_methods_updated_at
  before update on public.withdrawal_methods
  for each row execute function public.fn_update_timestamp();

drop trigger if exists tr_promo_codes_updated_at on public.promo_codes;
create trigger tr_promo_codes_updated_at
  before update on public.promo_codes
  for each row execute function public.fn_update_timestamp();

drop trigger if exists tr_rewards_updated_at on public.rewards;
create trigger tr_rewards_updated_at
  before update on public.rewards
  for each row execute function public.fn_update_timestamp();

drop trigger if exists tr_site_settings_updated_at on public.site_settings;
create trigger tr_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.fn_update_timestamp();

drop trigger if exists tr_notification_settings_updated_at on public.notification_settings;
create trigger tr_notification_settings_updated_at
  before update on public.notification_settings
  for each row execute function public.fn_update_timestamp();

-- Trigger: Log every coin transaction automatically
create or replace function public.fn_log_coin_transaction()
returns trigger as $$
begin
  if new.balance_coins is distinct from old.balance_coins then
    return new;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Update user level based on XP
create or replace function public.fn_update_level_by_xp()
returns trigger as $$
begin
  -- Level up every 1000 XP (Level 1 at 0 XP, Level 2 at 1000 XP, etc.)
  new.level := floor(new.xp / 1000) + 1;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_update_user_level on public.profiles;
create trigger tr_update_user_level
  before update of xp on public.profiles
  for each row execute function public.fn_update_level_by_xp();

-- Trigger: Auto-create notification_settings when a profile is created
create or replace function public.fn_create_notification_settings()
returns trigger as $$
begin
  insert into public.notification_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_create_notification_settings on public.profiles;
create trigger tr_create_notification_settings
  after insert on public.profiles
  for each row execute function public.fn_create_notification_settings();

-- Trigger: Auto-create referral link when a profile is created
create or replace function public.fn_create_referral_link()
returns trigger as $$
declare
  code text;
  v_referrer_id uuid;
  v_referral_code text;
begin
  -- Generate unique referral code from username + random suffix
  code := lower(new.username) || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 6);
  insert into public.referral_links (user_id, referral_code)
  values (new.id, code)
  on conflict (user_id) do nothing;

  -- If the new user was referred by someone, update referrer stats
  if new.referred_by is not null then
    -- Increment referrer's referrals_count
    update public.profiles
    set referrals_count = referrals_count + 1
    where id = new.referred_by;

    -- Increment referrer's referral link total_signups
    update public.referral_links
    set total_signups = total_signups + 1
    where user_id = new.referred_by;

    -- Lookup the referral code used (if any was recorded in metadata)
    select referral_code into v_referral_code
    from public.referral_links
    where user_id = new.referred_by;

    -- Notify the referrer
    insert into public.notifications (user_id, title, description, notification_type, source_name)
    values (new.referred_by, 'New Referral!', format('%s joined using your referral link!', new.username), 'referral_reward', new.username);
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_create_referral_link on public.profiles;
create trigger tr_create_referral_link
  after insert on public.profiles
  for each row execute function public.fn_create_referral_link();

-- Trigger: Update leaderboard statistics when earnings change
create or replace function public.fn_update_leaderboard()
returns trigger as $$
begin
  insert into public.leaderboard_statistics (user_id, username, total_earned_coins, total_earned_usd, level, xp)
  values (new.id, new.username, new.total_earned_coins, new.total_earned_usd, new.level, new.xp)
  on conflict (user_id) do update set
    username = excluded.username,
    total_earned_coins = excluded.total_earned_coins,
    total_earned_usd = excluded.total_earned_usd,
    level = excluded.level,
    xp = excluded.xp,
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_update_leaderboard on public.profiles;
create trigger tr_update_leaderboard
  after update of total_earned_coins, level, xp on public.profiles
  for each row execute function public.fn_update_leaderboard();

-- Trigger: Distribute multi-level referral rewards
create or replace function public.fn_distribute_referral_rewards()
returns trigger as $$
declare
  lvl1_ref_id uuid;
  lvl2_ref_id uuid;
  lvl3_ref_id uuid;
  earned_coins integer;
  l1_pct numeric(5,2);
  l2_pct numeric(5,2);
  l3_pct numeric(5,2);
  l1_coins integer;
  l2_coins integer;
  l3_coins integer;
begin
  if new.total_earned_coins > old.total_earned_coins then
    earned_coins := new.total_earned_coins - old.total_earned_coins;

    -- Get referral percentages from site settings (defaults: 10%, 5%, 2%)
    select coalesce(
      (select setting_value::numeric(5,2) from public.site_settings where setting_key = 'referral_level1_percent'),
      10.00
    ) into l1_pct;
    select coalesce(
      (select setting_value::numeric(5,2) from public.site_settings where setting_key = 'referral_level2_percent'),
      5.00
    ) into l2_pct;
    select coalesce(
      (select setting_value::numeric(5,2) from public.site_settings where setting_key = 'referral_level3_percent'),
      2.00
    ) into l3_pct;

    -- Level 1
    select referred_by into lvl1_ref_id from public.profiles where id = new.id;
    if lvl1_ref_id is not null then
      l1_coins := floor(earned_coins * l1_pct / 100);
      if l1_coins > 0 then
        update public.profiles
        set balance_coins = balance_coins + l1_coins,
            total_earned_coins = total_earned_coins + l1_coins,
            balance_usd = (balance_coins + l1_coins) / 1000.00
        where id = lvl1_ref_id;

        insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
        values (lvl1_ref_id, new.id, new.username, 1, l1_coins, l1_pct, 'earnings');

        -- Create notification for referrer
        insert into public.notifications (user_id, title, description, notification_type, coins_earned, source_name)
        values (lvl1_ref_id, 'Referral Reward!', format('You earned %s coins from %s (Level 1 referral).', l1_coins, new.username), 'referral_reward', l1_coins, new.username);

        -- Level 2
        select referred_by into lvl2_ref_id from public.profiles where id = lvl1_ref_id;
        if lvl2_ref_id is not null then
          l2_coins := floor(earned_coins * l2_pct / 100);
          if l2_coins > 0 then
            update public.profiles
            set balance_coins = balance_coins + l2_coins,
                total_earned_coins = total_earned_coins + l2_coins,
                balance_usd = (balance_coins + l2_coins) / 1000.00
            where id = lvl2_ref_id;

            insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
            values (lvl2_ref_id, new.id, new.username, 2, l2_coins, l2_pct, 'earnings');

            insert into public.notifications (user_id, title, description, notification_type, coins_earned, source_name)
            values (lvl2_ref_id, 'Referral Reward!', format('You earned %s coins from %s (Level 2 referral).', l2_coins, new.username), 'referral_reward', l2_coins, new.username);

            -- Level 3
            select referred_by into lvl3_ref_id from public.profiles where id = lvl2_ref_id;
            if lvl3_ref_id is not null then
              l3_coins := floor(earned_coins * l3_pct / 100);
              if l3_coins > 0 then
                update public.profiles
                set balance_coins = balance_coins + l3_coins,
                    total_earned_coins = total_earned_coins + l3_coins,
                    balance_usd = (balance_coins + l3_coins) / 1000.00
                where id = lvl3_ref_id;

                insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
                values (lvl3_ref_id, new.id, new.username, 3, l3_coins, l3_pct, 'earnings');

                insert into public.notifications (user_id, title, description, notification_type, coins_earned, source_name)
                values (lvl3_ref_id, 'Referral Reward!', format('You earned %s coins from %s (Level 3 referral).', l3_coins, new.username), 'referral_reward', l3_coins, new.username);
              end if;
            end if;
          end if;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_referral_rewards_payout on public.profiles;
create trigger tr_referral_rewards_payout
  after update of total_earned_coins on public.profiles
  for each row execute function public.fn_distribute_referral_rewards();

-- Schedule: Reset daily leaderboard rankings
create or replace function public.fn_reset_daily_leaderboard()
returns void as $$
begin
  update public.leaderboard_statistics
  set daily_earnings = 0,
      daily_rank = null,
      last_daily_reset = timezone('utc'::text, now());
end;
$$ language plpgsql security definer;

-- Schedule: Reset weekly leaderboard rankings
create or replace function public.fn_reset_weekly_leaderboard()
returns void as $$
begin
  update public.leaderboard_statistics
  set weekly_earnings = 0,
      weekly_rank = null,
      last_weekly_reset = timezone('utc'::text, now());
end;
$$ language plpgsql security definer;

-- Schedule: Reset monthly leaderboard rankings
create or replace function public.fn_reset_monthly_leaderboard()
returns void as $$
begin
  update public.leaderboard_statistics
  set monthly_earnings = 0,
      monthly_rank = null,
      last_monthly_reset = timezone('utc'::text, now());
end;
$$ language plpgsql security definer;

-- Function: Process a withdrawal (approve or reject)
create or replace function public.fn_process_withdrawal(
  p_withdrawal_id uuid,
  p_action text,
  p_admin_id uuid
)
returns void as $$
declare
  v_withdrawal record;
  v_user record;
begin
  select * into v_withdrawal from public.withdrawals where id = p_withdrawal_id;
  if not found then
    raise exception 'Withdrawal not found';
  end if;

  if p_action = 'APPROVED' then
    update public.withdrawals
    set status = 'APPROVED', processed_by = p_admin_id, processed_at = timezone('utc'::text, now())
    where id = p_withdrawal_id;

    insert into public.notifications (user_id, title, description, notification_type, source_name)
    values (v_withdrawal.user_id, 'Withdrawal Approved!', format('Your %s withdrawal of $%s has been approved.', v_withdrawal.payout_method, v_withdrawal.usd_value), 'withdrawal_status', 'system');

  elsif p_action = 'REJECTED' then
    -- Refund coins to user
    select * into v_user from public.profiles where id = v_withdrawal.user_id;
    if found then
      update public.profiles
      set balance_coins = balance_coins + v_withdrawal.coins_deducted,
          balance_usd = (balance_coins + v_withdrawal.coins_deducted) / 1000.00,
          total_withdrawn_usd = greatest(0, total_withdrawn_usd - v_withdrawal.usd_value)
      where id = v_withdrawal.user_id;
    end if;

    update public.withdrawals
    set status = 'REJECTED', processed_by = p_admin_id, processed_at = timezone('utc'::text, now())
    where id = p_withdrawal_id;

    insert into public.notifications (user_id, title, description, notification_type, source_name)
    values (v_withdrawal.user_id, 'Withdrawal Rejected', format('Your %s withdrawal of $%s has been rejected. Coins have been refunded.', v_withdrawal.payout_method, v_withdrawal.usd_value), 'withdrawal_status', 'system');

    -- Log the transaction
    insert into public.coin_transactions (user_id, transaction_type, amount_coins, amount_usd, balance_after_coins, balance_after_usd, source, source_id, description)
    select v_withdrawal.user_id, 'REFUND', v_withdrawal.coins_deducted, v_withdrawal.usd_value,
           balance_coins, balance_usd, 'withdrawal', p_withdrawal_id::text,
           format('Refund for rejected withdrawal #%s', substring(p_withdrawal_id::text, 1, 8))
    from public.profiles where id = v_withdrawal.user_id;
  end if;

  -- Log admin action
  insert into public.admin_activity_logs (admin_id, admin_name, action, target_type, target_id, details)
  values (p_admin_id, (select username from public.profiles where id = p_admin_id),
          format('WITHDRAWAL_%s', p_action), 'withdrawal', p_withdrawal_id::text,
          format('%s withdrawal #%s for $%s via %s', p_action, substring(p_withdrawal_id::text, 1, 8), v_withdrawal.usd_value, v_withdrawal.payout_method));
end;
$$ language plpgsql security definer;

-- Function: Add coins to a user (admin action)
create or replace function public.fn_admin_add_coins(
  p_target_user_id uuid,
  p_amount integer,
  p_admin_id uuid,
  p_reason text default 'Admin credit'
)
returns void as $$
begin
  update public.profiles
  set balance_coins = balance_coins + p_amount,
      total_earned_coins = total_earned_coins + p_amount,
      balance_usd = (balance_coins + p_amount) / 1000.00
  where id = p_target_user_id;

  insert into public.coin_transactions (user_id, transaction_type, amount_coins, balance_after_coins, balance_after_usd, source, source_id, description)
  select p_target_user_id, 'ADMIN_CREDIT', p_amount, balance_coins, balance_usd, 'admin', p_admin_id::text, p_reason
  from public.profiles where id = p_target_user_id;

  insert into public.notifications (user_id, title, description, notification_type, coins_earned, source_name)
  select p_target_user_id, format('%s Coins Added!', p_amount), format('%s coins have been credited to your account.', p_amount), 'admin_credit', p_amount, 'Admin'
  from public.profiles where id = p_target_user_id;

  insert into public.admin_activity_logs (admin_id, admin_name, action, target_type, target_id, details)
  values (p_admin_id, (select username from public.profiles where id = p_admin_id),
          'COIN_ADDED', 'user', p_target_user_id::text,
          format('Added %s coins to user. Reason: %s', p_amount, p_reason));
end;
$$ language plpgsql security definer;

-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ════════════════════════════════════════════════════════════════════

-- Helper function to check if user is admin
create or replace function public.fn_is_admin()
returns boolean as $$
begin
  return exists (select 1 from public.profiles where id = auth.uid() and is_admin = true);
end;
$$ language plpgsql security definer;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_balances enable row level security;
alter table public.user_levels enable row level security;
alter table public.login_history enable row level security;
alter table public.email_verifications enable row level security;
alter table public.user_activity_logs enable row level security;
alter table public.admin_accounts enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.security_logs enable row level security;
alter table public.fraud_detection_logs enable row level security;
alter table public.offerwall_providers enable row level security;
alter table public.offerwall_api_configs enable row level security;
alter table public.offerwalls enable row level security;
alter table public.locked_offerwalls enable row level security;
alter table public.offer_unlock_rules enable row level security;
alter table public.offerwall_status_history enable row level security;
alter table public.surveys enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.earnings_history enable row level security;
alter table public.live_earnings enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;
alter table public.system_notifications enable row level security;
alter table public.withdrawal_methods enable row level security;
alter table public.withdrawals enable row level security;
alter table public.wallet_configurations enable row level security;
alter table public.referral_links enable row level security;
alter table public.referral_earnings enable row level security;
alter table public.promo_codes enable row level security;
alter table public.promo_code_redemptions enable row level security;
alter table public.rewards enable row level security;
alter table public.daily_rewards enable row level security;
alter table public.achievement_rewards enable row level security;
alter table public.leaderboard_statistics enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_replies enable row level security;
alter table public.announcements enable row level security;
alter table public.site_settings enable row level security;
alter table public.api_integrations enable row level security;
alter table public.social_campaigns enable row level security;
alter table public.campaign_tasks enable row level security;
alter table public.campaign_submissions enable row level security;
alter table public.campaign_submission_screenshots enable row level security;

-- ── Drop all policies first so they can be safely recreated ──
-- Safely drop all existing policies (with table existence check)
drop policy if exists "Anyone can view profiles (public leaderboard)" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can manage all profiles" on public.profiles;
drop policy if exists "Users view own transactions" on public.coin_transactions;
drop policy if exists "Admins view all transactions" on public.coin_transactions;
drop policy if exists "Users view own earnings" on public.earnings_history;
drop policy if exists "Admins view all earnings" on public.earnings_history;
drop policy if exists "Public read access on earnings feed" on public.live_earnings;
drop policy if exists "Authenticated users can log earnings" on public.live_earnings;
drop policy if exists "Users view own notifications" on public.notifications;
drop policy if exists "Users update own notifications (mark read)" on public.notifications;
drop policy if exists "Users delete own notifications" on public.notifications;
drop policy if exists "System can insert notifications" on public.notifications;
drop policy if exists "Users manage own notification settings" on public.notification_settings;
drop policy if exists "Users view own withdrawals" on public.withdrawals;
drop policy if exists "Users create own withdrawals" on public.withdrawals;
drop policy if exists "Admins manage all withdrawals" on public.withdrawals;
drop policy if exists "Anyone can view active withdrawal methods" on public.withdrawal_methods;
drop policy if exists "Admins manage withdrawal methods" on public.withdrawal_methods;
drop policy if exists "Users manage own wallets" on public.wallet_configurations;
drop policy if exists "Anyone can view offerwall providers" on public.offerwall_providers;
drop policy if exists "Admins manage providers" on public.offerwall_providers;
drop policy if exists "Admins manage API configs" on public.offerwall_api_configs;
drop policy if exists "Anyone can view active offerwalls" on public.offerwalls;
drop policy if exists "Admins manage offerwalls" on public.offerwalls;
drop policy if exists "Anyone can view locked offerwall conditions" on public.locked_offerwalls;
drop policy if exists "Admins manage locked offerwalls" on public.locked_offerwalls;
drop policy if exists "Anyone can view unlock rules" on public.offer_unlock_rules;
drop policy if exists "Admins manage unlock rules" on public.offer_unlock_rules;
drop policy if exists "Anyone can view active surveys" on public.surveys;
drop policy if exists "Admins manage surveys" on public.surveys;
drop policy if exists "Anyone can view active promo codes" on public.promo_codes;
drop policy if exists "Admins manage promo codes" on public.promo_codes;
drop policy if exists "Users view own redemptions" on public.promo_code_redemptions;
drop policy if exists "Authenticated users can redeem" on public.promo_code_redemptions;
drop policy if exists "Users view own referral link" on public.referral_links;
drop policy if exists "Anyone can view referral code for signup" on public.referral_links;
drop policy if exists "Users view own referral earnings" on public.referral_earnings;
drop policy if exists "Admins view all referral earnings" on public.referral_earnings;
drop policy if exists "Anyone can view rewards" on public.rewards;
drop policy if exists "Admins manage rewards" on public.rewards;
drop policy if exists "Users view own daily rewards" on public.daily_rewards;
drop policy if exists "Users claim daily rewards" on public.daily_rewards;
drop policy if exists "Users view own achievements" on public.achievement_rewards;
drop policy if exists "Anyone can view leaderboard" on public.leaderboard_statistics;
drop policy if exists "Users view own login history" on public.login_history;
drop policy if exists "Admins view all login history" on public.login_history;
drop policy if exists "Admins view activity logs" on public.user_activity_logs;
drop policy if exists "Admins manage admin accounts" on public.admin_accounts;
drop policy if exists "Admins view activity logs" on public.admin_activity_logs;
drop policy if exists "Admins view security logs" on public.security_logs;
drop policy if exists "Admins manage fraud logs" on public.fraud_detection_logs;
drop policy if exists "Users manage own tickets" on public.support_tickets;
drop policy if exists "Admins manage all tickets" on public.support_tickets;
drop policy if exists "Users view own ticket replies" on public.ticket_replies;
drop policy if exists "Users create ticket replies" on public.ticket_replies;
drop policy if exists "Admins manage all replies" on public.ticket_replies;
drop policy if exists "Anyone can view active announcements" on public.announcements;
drop policy if exists "Admins manage announcements" on public.announcements;
drop policy if exists "Anyone can view site settings" on public.site_settings;
drop policy if exists "Admins manage site settings" on public.site_settings;
drop policy if exists "Admins manage API integrations" on public.api_integrations;
drop policy if exists "Anyone can view level definitions" on public.user_levels;
drop policy if exists "Admins manage levels" on public.user_levels;
drop policy if exists "Admins manage system notifications" on public.system_notifications;
drop policy if exists "Admins view status history" on public.offerwall_status_history;
drop policy if exists "Users view own balance" on public.user_balances;
drop policy if exists "Admins view all balances" on public.user_balances;
drop policy if exists "Users view own verifications" on public.email_verifications;
drop policy if exists "Anyone can view active campaigns" on public.social_campaigns;
drop policy if exists "Admins manage campaigns" on public.social_campaigns;
drop policy if exists "Anyone can view campaign tasks" on public.campaign_tasks;
drop policy if exists "Admins manage campaign tasks" on public.campaign_tasks;
drop policy if exists "Users view own submissions" on public.campaign_submissions;
drop policy if exists "Users create submissions" on public.campaign_submissions;
drop policy if exists "Admins manage all submissions" on public.campaign_submissions;
drop policy if exists "Users view own screenshots" on public.campaign_submission_screenshots;
drop policy if exists "Users upload screenshots" on public.campaign_submission_screenshots;
drop policy if exists "Admins manage screenshots" on public.campaign_submission_screenshots;

-- ── Recreate all policies ──

-- PROFILES
drop policy if exists "Anyone can view profiles (public leaderboard)" on public.profiles;
create policy "Anyone can view profiles (public leaderboard)" on public.profiles
  for select using (true);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can manage all profiles" on public.profiles
  for all using (public.fn_is_admin());

-- COIN TRANSACTIONS
drop policy if exists "Users view own transactions" on public.coin_transactions;
create policy "Users view own transactions" on public.coin_transactions
  for select using (auth.uid() = user_id);
drop policy if exists "Admins view all transactions" on public.coin_transactions;
create policy "Admins view all transactions" on public.coin_transactions
  for select using (public.fn_is_admin());

-- EARNINGS HISTORY
drop policy if exists "Users view own earnings" on public.earnings_history;
create policy "Users view own earnings" on public.earnings_history
  for select using (auth.uid() = user_id);
drop policy if exists "Admins view all earnings" on public.earnings_history;
create policy "Admins view all earnings" on public.earnings_history
  for select using (public.fn_is_admin());

-- LIVE EARNINGS (public feed)
drop policy if exists "Public read access on earnings feed" on public.live_earnings;
create policy "Public read access on earnings feed" on public.live_earnings
  for select using (true);
drop policy if exists "Authenticated users can log earnings" on public.live_earnings;
create policy "Authenticated users can log earnings" on public.live_earnings
  for insert with check (auth.role() = 'authenticated');

-- NOTIFICATIONS
drop policy if exists "Users view own notifications" on public.notifications;
create policy "Users view own notifications" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "Users update own notifications (mark read)" on public.notifications;
create policy "Users update own notifications (mark read)" on public.notifications
  for update using (auth.uid() = user_id);
drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);
drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications" on public.notifications
  for insert with check (auth.role() in ('authenticated', 'service_role'));

-- NOTIFICATION SETTINGS
drop policy if exists "Users manage own notification settings" on public.notification_settings;
create policy "Users manage own notification settings" on public.notification_settings
  for all using (auth.uid() = user_id);

-- WITHDRAWALS
drop policy if exists "Users view own withdrawals" on public.withdrawals;
create policy "Users view own withdrawals" on public.withdrawals
  for select using (auth.uid() = user_id);
drop policy if exists "Users create own withdrawals" on public.withdrawals;
create policy "Users create own withdrawals" on public.withdrawals
  for insert with check (auth.uid() = user_id);
drop policy if exists "Admins manage all withdrawals" on public.withdrawals;
create policy "Admins manage all withdrawals" on public.withdrawals
  for all using (public.fn_is_admin());

-- WITHDRAWAL METHODS
drop policy if exists "Anyone can view active withdrawal methods" on public.withdrawal_methods;
create policy "Anyone can view active withdrawal methods" on public.withdrawal_methods
  for select using (status = 'ACTIVE');
drop policy if exists "Admins manage withdrawal methods" on public.withdrawal_methods;
create policy "Admins manage withdrawal methods" on public.withdrawal_methods
  for all using (public.fn_is_admin());

-- WALLET CONFIGURATIONS
drop policy if exists "Users manage own wallets" on public.wallet_configurations;
create policy "Users manage own wallets" on public.wallet_configurations
  for all using (auth.uid() = user_id);

-- OFFERWALL PROVIDERS
drop policy if exists "Anyone can view offerwall providers" on public.offerwall_providers;
create policy "Anyone can view offerwall providers" on public.offerwall_providers
  for select using (true);
drop policy if exists "Admins manage providers" on public.offerwall_providers;
create policy "Admins manage providers" on public.offerwall_providers
  for all using (public.fn_is_admin());

-- OFFERWALL API CONFIGS (sensitive - admins only)
drop policy if exists "Admins manage API configs" on public.offerwall_api_configs;
create policy "Admins manage API configs" on public.offerwall_api_configs
  for all using (public.fn_is_admin());

-- OFFERWALLS
drop policy if exists "Anyone can view active offerwalls" on public.offerwalls;
create policy "Anyone can view active offerwalls" on public.offerwalls
  for select using (status = 'ACTIVE' or public.fn_is_admin());
drop policy if exists "Admins manage offerwalls" on public.offerwalls;
create policy "Admins manage offerwalls" on public.offerwalls
  for all using (public.fn_is_admin());

-- LOCKED OFFERWALLS
drop policy if exists "Anyone can view locked offerwall conditions" on public.locked_offerwalls;
create policy "Anyone can view locked offerwall conditions" on public.locked_offerwalls
  for select using (true);
drop policy if exists "Admins manage locked offerwalls" on public.locked_offerwalls;
create policy "Admins manage locked offerwalls" on public.locked_offerwalls
  for all using (public.fn_is_admin());

-- OFFER UNLOCK RULES
drop policy if exists "Anyone can view unlock rules" on public.offer_unlock_rules;
create policy "Anyone can view unlock rules" on public.offer_unlock_rules
  for select using (true);
drop policy if exists "Admins manage unlock rules" on public.offer_unlock_rules;
create policy "Admins manage unlock rules" on public.offer_unlock_rules
  for all using (public.fn_is_admin());

-- SURVEYS
drop policy if exists "Anyone can view active surveys" on public.surveys;
create policy "Anyone can view active surveys" on public.surveys
  for select using (is_active = true or public.fn_is_admin());
drop policy if exists "Admins manage surveys" on public.surveys;
create policy "Admins manage surveys" on public.surveys
  for all using (public.fn_is_admin());

-- PROMO CODES
drop policy if exists "Anyone can view active promo codes" on public.promo_codes;
create policy "Anyone can view active promo codes" on public.promo_codes
  for select using (is_active = true or public.fn_is_admin());
drop policy if exists "Admins manage promo codes" on public.promo_codes;
create policy "Admins manage promo codes" on public.promo_codes
  for all using (public.fn_is_admin());

-- PROMO CODE REDEMPTIONS
drop policy if exists "Users view own redemptions" on public.promo_code_redemptions;
create policy "Users view own redemptions" on public.promo_code_redemptions
  for select using (auth.uid() = user_id);
drop policy if exists "Users can redeem promo codes" on public.promo_code_redemptions;
create policy "Users can redeem promo codes" on public.promo_code_redemptions
  for insert with check (auth.uid() = user_id);

-- REFERRAL LINKS
drop policy if exists "Users view own referral link" on public.referral_links;
create policy "Users view own referral link" on public.referral_links
  for select using (auth.uid() = user_id);
drop policy if exists "Anyone can view referral code for signup" on public.referral_links;
create policy "Anyone can view referral code for signup" on public.referral_links
  for select using (true);

-- REFERRAL EARNINGS
drop policy if exists "Users view own referral earnings" on public.referral_earnings;
create policy "Users view own referral earnings" on public.referral_earnings
  for select using (auth.uid() = referrer_id);
drop policy if exists "Admins view all referral earnings" on public.referral_earnings;
create policy "Admins view all referral earnings" on public.referral_earnings
  for select using (public.fn_is_admin());

-- REWARDS
drop policy if exists "Anyone can view rewards" on public.rewards;
create policy "Anyone can view rewards" on public.rewards
  for select using (true);
drop policy if exists "Admins manage rewards" on public.rewards;
create policy "Admins manage rewards" on public.rewards
  for all using (public.fn_is_admin());

-- DAILY REWARDS
drop policy if exists "Users view own daily rewards" on public.daily_rewards;
create policy "Users view own daily rewards" on public.daily_rewards
  for select using (auth.uid() = user_id);
drop policy if exists "Users claim daily rewards" on public.daily_rewards;
create policy "Users claim daily rewards" on public.daily_rewards
  for insert with check (auth.uid() = user_id);

-- ACHIEVEMENT REWARDS
drop policy if exists "Users view own achievements" on public.achievement_rewards;
create policy "Users view own achievements" on public.achievement_rewards
  for select using (auth.uid() = user_id);

-- LEADERBOARD
drop policy if exists "Anyone can view leaderboard" on public.leaderboard_statistics;
create policy "Anyone can view leaderboard" on public.leaderboard_statistics
  for select using (true);

-- LOGIN HISTORY
drop policy if exists "Users view own login history" on public.login_history;
create policy "Users view own login history" on public.login_history
  for select using (auth.uid() = user_id);
drop policy if exists "Admins view all login history" on public.login_history;
create policy "Admins view all login history" on public.login_history
  for select using (public.fn_is_admin());

-- USER ACTIVITY LOGS
drop policy if exists "Admins view activity logs" on public.user_activity_logs;
create policy "Admins view activity logs" on public.user_activity_logs
  for select using (public.fn_is_admin());

-- ADMIN ACCOUNTS
drop policy if exists "Admins manage admin accounts" on public.admin_accounts;
create policy "Admins manage admin accounts" on public.admin_accounts
  for all using (public.fn_is_admin());

-- ADMIN ACTIVITY LOGS
drop policy if exists "Admins view activity logs" on public.admin_activity_logs;
create policy "Admins view activity logs" on public.admin_activity_logs
  for select using (public.fn_is_admin());

-- SECURITY LOGS
drop policy if exists "Admins view security logs" on public.security_logs;
create policy "Admins view security logs" on public.security_logs
  for select using (public.fn_is_admin());

-- FRAUD DETECTION LOGS
drop policy if exists "Admins manage fraud logs" on public.fraud_detection_logs;
create policy "Admins manage fraud logs" on public.fraud_detection_logs
  for all using (public.fn_is_admin());

-- SUPPORT TICKETS
drop policy if exists "Users manage own tickets" on public.support_tickets;
create policy "Users manage own tickets" on public.support_tickets
  for all using (auth.uid() = user_id);
drop policy if exists "Admins manage all tickets" on public.support_tickets;
create policy "Admins manage all tickets" on public.support_tickets
  for all using (public.fn_is_admin());

-- TICKET REPLIES
drop policy if exists "Users view own ticket replies" on public.ticket_replies;
create policy "Users view own ticket replies" on public.ticket_replies
  for select using (auth.uid() = user_id);
drop policy if exists "Users create ticket replies" on public.ticket_replies;
create policy "Users create ticket replies" on public.ticket_replies
  for insert with check (auth.uid() = user_id);
drop policy if exists "Admins manage all replies" on public.ticket_replies;
create policy "Admins manage all replies" on public.ticket_replies
  for all using (public.fn_is_admin());

-- ANNOUNCEMENTS
drop policy if exists "Anyone can view active announcements" on public.announcements;
create policy "Anyone can view active announcements" on public.announcements
  for select using (true);
drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements" on public.announcements
  for all using (public.fn_is_admin());

-- SITE SETTINGS
drop policy if exists "Anyone can view site settings" on public.site_settings;
create policy "Anyone can view site settings" on public.site_settings
  for select using (true);
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
  for all using (public.fn_is_admin());

-- API INTEGRATIONS (sensitive - admins only)
drop policy if exists "Admins manage API integrations" on public.api_integrations;
create policy "Admins manage API integrations" on public.api_integrations
  for all using (public.fn_is_admin());

-- USER LEVELS
drop policy if exists "Anyone can view level definitions" on public.user_levels;
create policy "Anyone can view level definitions" on public.user_levels
  for select using (true);
drop policy if exists "Admins manage levels" on public.user_levels;
create policy "Admins manage levels" on public.user_levels
  for all using (public.fn_is_admin());

-- SYSTEM NOTIFICATIONS
drop policy if exists "Admins manage system notifications" on public.system_notifications;
create policy "Admins manage system notifications" on public.system_notifications
  for all using (public.fn_is_admin());

-- OFFERWALL STATUS HISTORY
drop policy if exists "Admins view status history" on public.offerwall_status_history;
create policy "Admins view status history" on public.offerwall_status_history
  for select using (public.fn_is_admin());

-- USER BALANCES
drop policy if exists "Users view own balance" on public.user_balances;
create policy "Users view own balance" on public.user_balances
  for select using (auth.uid() = user_id);
drop policy if exists "Admins view all balances" on public.user_balances;
create policy "Admins view all balances" on public.user_balances
  for select using (public.fn_is_admin());

-- EMAIL VERIFICATIONS
drop policy if exists "Users view own verifications" on public.email_verifications;
create policy "Users view own verifications" on public.email_verifications
  for select using (auth.uid() = user_id);

-- SOCIAL BOUNTY CAMPAIGNS
drop policy if exists "Anyone can view active campaigns" on public.social_campaigns;
create policy "Anyone can view active campaigns" on public.social_campaigns
  for select using (is_active = true or public.fn_is_admin());
drop policy if exists "Admins manage campaigns" on public.social_campaigns;
create policy "Admins manage campaigns" on public.social_campaigns
  for all using (public.fn_is_admin());

-- CAMPAIGN TASKS
drop policy if exists "Anyone can view campaign tasks" on public.campaign_tasks;
create policy "Anyone can view campaign tasks" on public.campaign_tasks
  for select using (true);
drop policy if exists "Admins manage campaign tasks" on public.campaign_tasks;
create policy "Admins manage campaign tasks" on public.campaign_tasks
  for all using (public.fn_is_admin());

-- CAMPAIGN SUBMISSIONS
drop policy if exists "Users view own submissions" on public.campaign_submissions;
create policy "Users view own submissions" on public.campaign_submissions
  for select using (auth.uid() = user_id or public.fn_is_admin());
drop policy if exists "Users create submissions" on public.campaign_submissions;
create policy "Users create submissions" on public.campaign_submissions
  for insert with check (auth.uid() = user_id);
drop policy if exists "Admins manage all submissions" on public.campaign_submissions;
create policy "Admins manage all submissions" on public.campaign_submissions
  for all using (public.fn_is_admin());

-- CAMPAIGN SUBMISSION SCREENSHOTS
drop policy if exists "Users view own screenshots" on public.campaign_submission_screenshots;
create policy "Users view own screenshots" on public.campaign_submission_screenshots
  for select using (exists (select 1 from public.campaign_submissions where id = submission_id and user_id = auth.uid()) or public.fn_is_admin());
drop policy if exists "Users upload screenshots" on public.campaign_submission_screenshots;
create policy "Users upload screenshots" on public.campaign_submission_screenshots
  for insert with check (exists (select 1 from public.campaign_submissions where id = submission_id and user_id = auth.uid()));
drop policy if exists "Admins manage screenshots" on public.campaign_submission_screenshots;
create policy "Admins manage screenshots" on public.campaign_submission_screenshots
  for all using (public.fn_is_admin());


-- ════════════════════════════════════════════════════════════════════
-- SUPABASE REALTIME (Instant Updates)
-- ════════════════════════════════════════════════════════════════════

-- Safely add tables to realtime publication (ignore if already member)
do $$
declare
  tbl text;
  tables_to_add text[] := array[
    'live_earnings', 'profiles', 'notifications', 'leaderboard_statistics',
    'coin_transactions', 'withdrawals', 'offerwalls', 'offerwall_providers',
    'earnings_history', 'promo_codes', 'admin_activity_logs', 'admin_accounts',
    'referral_earnings', 'referral_links', 'withdrawal_methods', 'site_settings',
    'support_tickets', 'announcements'
  ];
begin
  foreach tbl in array tables_to_add loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    exception
      when duplicate_object then
        null; -- table is already in the publication
    end;
  end loop;
end;
$$;

-- ════════════════════════════════════════════════════════════════════
-- SEED DATA (idempotent — uses ON CONFLICT DO NOTHING)
-- ════════════════════════════════════════════════════════════════════

-- User Levels (1-50)
insert into public.user_levels (level_number, level_name, xp_required, bonus_coins, daily_bonus_multiplier) values
  (1, 'Newbie', 0, 0, 1.00),
  (2, 'Bronze', 1000, 10, 1.00),
  (3, 'Bronze II', 2500, 15, 1.00),
  (4, 'Silver', 5000, 25, 1.10),
  (5, 'Silver II', 8000, 30, 1.10),
  (6, 'Gold', 12000, 50, 1.20),
  (7, 'Gold II', 18000, 60, 1.20),
  (8, 'Platinum', 25000, 80, 1.25),
  (9, 'Platinum II', 35000, 100, 1.25),
  (10, 'Diamond', 50000, 150, 1.30),
  (15, 'Master', 100000, 250, 1.40),
  (20, 'Grandmaster', 200000, 500, 1.50),
  (25, 'Legend', 400000, 750, 1.60),
  (30, 'Mythic', 700000, 1000, 1.75),
  (40, 'Godlike', 1200000, 2000, 2.00),
  (50, 'Transcendent', 2000000, 5000, 2.50)
on conflict (level_number) do nothing;

-- Default Site Settings
insert into public.site_settings (setting_key, setting_value, setting_type, description) values
  ('site_name', 'CoinLoot', 'string', 'Website display name'),
  ('coin_to_usd_rate', '1000', 'integer', 'Number of coins equal to $1 USD'),
  ('min_withdrawal_coins', '1000', 'integer', 'Minimum coins required for withdrawal'),
  ('max_withdrawal_coins', '500000', 'integer', 'Maximum coins per withdrawal'),
  ('referral_level1_percent', '10', 'decimal', 'Level 1 referral commission percentage'),
  ('referral_level2_percent', '5', 'decimal', 'Level 2 referral commission percentage'),
  ('referral_level3_percent', '2', 'decimal', 'Level 3 referral commission percentage'),
  ('daily_streak_base', '50', 'integer', 'Base daily streak reward coins'),
  ('daily_streak_increment', '10', 'integer', 'Additional coins per consecutive day'),
  ('max_daily_streak_bonus', '500', 'integer', 'Maximum daily streak bonus'),
  ('new_user_bonus_coins', '0', 'integer', 'Welcome bonus for new users (disabled by default)'),
  ('smtp_host', 'smtp.example.com', 'string', 'SMTP server host'),
  ('smtp_port', '587', 'integer', 'SMTP server port'),
  ('smtp_user', 'noreply@coinloot.com', 'string', 'SMTP username'),
  ('smtp_pass', '', 'string', 'SMTP password'),
  ('notification_sound', 'true', 'boolean', 'Enable notification sounds'),
  ('popup_enabled', 'true', 'boolean', 'Enable reward popups'),
  ('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
  ('leaderboard_daily_reset', 'true', 'boolean', 'Auto-reset daily leaderboard'),
  ('fraud_detection_enabled', 'true', 'boolean', 'Enable VPN/proxy detection'),
  ('homepage_sections', '{"featured":true,"hot":true,"surveys":true,"offerwalls":true,"announcements":true,"promo_cards":true,"rewards":true,"challenges":true}', 'string', 'Homepage section visibility toggles'),
  ('enable_demo_data', 'false', 'boolean', 'Enable demo/test user accounts (for development only)')
on conflict (setting_key) do nothing;

-- Default Withdrawal Methods
insert into public.withdrawal_methods (name, icon, min_coins, max_coins, fee_percent, fee_fixed_coins, api_connected, status, sort_order) values
  ('PayPal', '💎', 1000, 50000, 0, 0, true, 'ACTIVE', 1),
  ('Binance Pay', '🌐', 1000, 100000, 0, 0, true, 'ACTIVE', 2),
  ('USDT (TRC-20)', '₮', 2000, 500000, 0, 0, true, 'ACTIVE', 3),
  ('Litecoin', 'Ł', 5000, 500000, 0.5, 0, false, 'INACTIVE', 4),
  ('Bitcoin', '₿', 5000, 500000, 0.5, 0, false, 'INACTIVE', 5),
  ('Ethereum', '♦', 5000, 500000, 0.5, 0, false, 'INACTIVE', 6)
on conflict (name) do nothing;

-- Offerwall Providers (9 default)
insert into public.offerwall_providers (name, initials, color) values
  ('Torox', 'TX', 'from-cyan-500 to-blue-600'),
  ('CPX Research', 'CP', 'from-purple-500 to-pink-600'),
  ('AdGate', 'AG', 'from-amber-500 to-orange-600'),
  ('Lootably', 'LB', 'from-emerald-500 to-teal-600'),
  ('AdGem', 'AG', 'from-rose-500 to-red-600'),
  ('BitLabs', 'BL', 'from-indigo-500 to-violet-600'),
  ('Revenue Universe', 'RU', 'from-sky-500 to-cyan-600'),
  ('TimeWall', 'TW', 'from-fuchsia-500 to-pink-600'),
  ('GemiAds', 'GA', 'from-cyan-500 to-purple-600')
on conflict (name) do nothing;

-- Create corresponding offerwall entries (only if not already present)
insert into public.offerwalls (provider_id, name, status, priority)
select id, name, 'ACTIVE', row_number() over (order by name)::integer * 10
from public.offerwall_providers
where not exists (
  select 1 from public.offerwalls ow where ow.provider_id = public.offerwall_providers.id
);

-- Rewards Store Items
insert into public.rewards (name, icon, min_coins, reward_type, fields) values
  ('PayPal Cashout', '💎', 1000, 'paypal', '["email"]'),
  ('Binance Pay Transfer', '🌐', 1000, 'binance', '["email", "wallet_id"]'),
  ('USDT (TRC-20)', '₮', 2000, 'usdt', '["wallet_address"]'),
  ('Skrill Transfer', 'S', 1000, 'skrill', '["email"]'),
  ('Payeer Transfer', 'P', 1000, 'payeer', '["account_id"]'),
  ('Amazon Gift Card', '🎁', 1000, 'giftcard', '["email"]'),
  ('Google Play Gift Card', '🎮', 1000, 'giftcard', '["email"]'),
  ('Bitcoin (BTC)', '₿', 5000, 'bitcoin', '["wallet_address"]'),
  ('Litecoin (LTC)', 'Ł', 5000, 'litecoin', '["wallet_address"]'),
  ('Ethereum (ETH)', '♦', 5000, 'ethereum', '["wallet_address"]')
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════════
-- 14. DEMO / TEST USER ACCOUNTS (optional — guarded by enable_demo_data)
-- ════════════════════════════════════════════════════════════════════
-- Only runs when enable_demo_data = true in site_settings.
-- To enable:  UPDATE site_settings SET setting_value = 'true'
--               WHERE setting_key = 'enable_demo_data';
-- To remove:  DELETE FROM public.profiles
--               WHERE email LIKE 'demo.%@coinloot.test';
--
-- These profiles have no matching auth.users row, so we temporarily
-- disable FK enforcement during inserts.
-- ════════════════════════════════════════════════════════════════════

do $$
declare
  demo_enabled boolean;
begin
  select coalesce(
    (select setting_value = 'true' from public.site_settings where setting_key = 'enable_demo_data'),
    false
  ) into demo_enabled;

  if not demo_enabled then
    raise notice 'DEMO DATA SKIPPED: enable_demo_data is not set to true.';
    return;
  end if;

  raise notice 'Creating demo user accounts...';

  -- Bypass FK checks (profiles.id references auth.users)
  set session_replication_role = replica;

  -- ── 14a. Demo User Profiles ──
  insert into public.profiles (id, username, email, country, balance_coins, balance_usd, xp, level, streak_days, total_earned_coins, total_earned_usd, total_withdrawn_usd, kyc_status, is_admin, vpn_detected) values
    (gen_random_uuid(), 'sarah_j',       'demo.sarah@coinloot.test',  'United States',   8750,  8.75,  14200, 12, 5,  45000,  45.00,  125.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'mike_chen',     'demo.mike@coinloot.test',  'Canada',          3200,  3.20,   6800,  8, 3,  12000,  12.00,   35.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'emma_w',        'demo.emma@coinloot.test',  'United Kingdom',      0,  0.00,      0,  1, 0,      0,   0.00,    0.00, 'NOT_STARTED', false, false),
    (gen_random_uuid(), 'david_m',       'demo.david@coinloot.test', 'Australia',        2100,  2.10,   4100,  6, 2,   8500,   8.50,   20.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'fatima_r',      'demo.fatima@coinloot.test','Bangladesh',       5400,  5.40,   9100,  9, 7,  22000,  22.00,   55.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'oliver_b',      'demo.oliver@coinloot.test','Germany',          6800,  6.80,  11500, 11, 4,  35000,  35.00,   95.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'sophie_l',      'demo.sophie@coinloot.test','France',            350,  0.35,   1200,  3, 1,   1800,   1.80,    0.00, 'PENDING',    false, false),
    (gen_random_uuid(), 'james_w',       'demo.james@coinloot.test', 'United States',   12000, 12.00,  19800, 15, 9,  78000,  78.00,  220.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'aisha_p',       'demo.aisha@coinloot.test', 'India',            4100,  4.10,   7200,  8, 6,  28000,  28.00,   15.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'liam_t',        'demo.liam@coinloot.test',  'United Kingdom',   1800,  1.80,   3900,  6, 2,  15000,  15.00,   45.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'chen_wei',      'demo.chen@coinloot.test',  'Australia',        4600,  4.60,   8300,  9, 4,  19000,  19.00,   50.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'isabella_g',    'demo.isabella@coinloot.test','United States',   950,  0.95,   2800,  5, 2,   6500,   6.50,   18.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'mohammed_a',    'demo.mohammed@coinloot.test','Bangladesh',      780,  0.78,   2100,  4, 1,   3200,   3.20,    0.00, 'PENDING',    false, false),
    (gen_random_uuid(), 'charlotte_k',   'demo.charlotte@coinloot.test','Canada',        2900,  2.90,   5600,  7, 8,  10500,  10.50,   25.00, 'APPROVED',   false, false),
    (gen_random_uuid(), 'lucas_s',       'demo.lucas@coinloot.test', 'Germany',          2600,  2.60,   4800,  6, 3,  11000,  11.00,   30.00, 'APPROVED',   false, false)
  on conflict (email) do nothing;

  -- ── 14b. User Balances ──
  insert into public.user_balances (user_id, balance_coins, balance_usd, xp, level)
  select id, balance_coins, balance_usd, xp, level
  from public.profiles
  where email like 'demo.%@coinloot.test'
    and id not in (select user_id from public.user_balances)
  on conflict (id) do nothing;

  -- ── 14c. Leaderboard Statistics ──
  insert into public.leaderboard_statistics (user_id, username, total_earned_coins, total_earned_usd, total_withdrawn_usd, level, xp)
  select id, username, total_earned_coins, total_earned_usd, total_withdrawn_usd, level, xp
  from public.profiles
  where email like 'demo.%@coinloot.test'
    and id not in (select user_id from public.leaderboard_statistics)
  on conflict (user_id) do nothing;

  -- ── 14d. Temp mapping for cross-referencing ──
  create temporary table if not exists demo_user_map as
  select id, username, email from public.profiles where email like 'demo.%@coinloot.test';

  -- ── 14e. Coin Transaction History ──

  -- Sarah Johnson — high earner
  insert into public.coin_transactions (user_id, transaction_type, amount_coins, amount_usd, balance_after_coins, balance_after_usd, source, source_id, description, created_at)
  select id, 'OFFER_COMPLETED', 500, 0.50, 500, 0.50, 'Torox', 'tox-' || id, 'Home Insurance Quote', now() - interval '60 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 750, 0.75, 1250, 1.25, 'AdGate', 'ag-' || id, 'Game of Thrones Slots - Reach Level 10', now() - interval '55 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 200, 0.20, 1450, 1.45, 'YourSurveys', 'ys-' || id, 'Consumer Electronics Survey', now() - interval '50 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1000, 1.00, 2450, 2.45, 'CPX Research', 'cpx-' || id, 'Credit Card Application', now() - interval '45 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 2750, 2.75, 'AdGem', 'agem-' || id, 'Mobile Game Trial', now() - interval '40 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 150, 0.15, 2900, 2.90, 'YourSurveys', 'ys2-' || id, 'Streaming Service Preferences', now() - interval '35 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 2000, 2.00, 4900, 4.90, 'Lootably', 'loot-' || id, 'Sign up for Investment App', now() - interval '30 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 250, 0.25, 5150, 5.15, 'YourSurveys', 'ys3-' || id, 'Healthcare Survey', now() - interval '25 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 600, 0.60, 5750, 5.75, 'Revenue Universe', 'ru-' || id, 'Free Trial - Meal Kit', now() - interval '20 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 180, 0.18, 5930, 5.93, 'YourSurveys', 'ys4-' || id, 'Travel Habits Survey', now() - interval '15 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 820, 0.82, 6750, 6.75, 'TimeWall', 'tw-' || id, 'Sign up for VPN Service', now() - interval '10 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 300, 0.30, 7050, 7.05, 'YourSurveys', 'ys5-' || id, 'Insurance Brand Perception', now() - interval '7 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 450, 0.45, 7500, 7.50, 'BitLabs', 'bl-' || id, 'Download & Register Fitness App', now() - interval '3 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 250, 0.25, 7750, 7.75, 'YourSurveys', 'ys6-' || id, 'Mobile Banking Survey', now() - interval '1 day' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1000, 1.00, 8750, 8.75, 'GemiAds', 'ga-' || id, 'Auto Insurance Quote', now() - interval '6 hours' from demo_user_map where email = 'demo.sarah@coinloot.test';

  -- Mike Chen — medium activity with referrals
  insert into public.coin_transactions (user_id, transaction_type, amount_coins, amount_usd, balance_after_coins, balance_after_usd, source, source_id, description, created_at)
  select id, 'OFFER_COMPLETED', 400, 0.40, 400, 0.40, 'Torox', 'tox-' || id, 'Home Appliance Warranty Sign Up', now() - interval '45 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 180, 0.18, 580, 0.58, 'YourSurveys', 'ys-' || id, 'Smartphone Usage Survey', now() - interval '40 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 600, 0.60, 1180, 1.18, 'AdGate', 'ag-' || id, 'Fantasy Football App - Sign Up', now() - interval '35 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 150, 0.15, 1330, 1.33, 'Referral', 'ref-' || id, 'Referral reward - Level 1', now() - interval '30 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 350, 0.35, 1680, 1.68, 'CPX Research', 'cpx-' || id, 'Streaming Service Trial', now() - interval '25 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 220, 0.22, 1900, 1.90, 'YourSurveys', 'ys2-' || id, 'Online Shopping Survey', now() - interval '20 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 500, 0.50, 2400, 2.40, 'Lootably', 'loot-' || id, 'Invest $1 Get $25 Bonus App', now() - interval '15 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 150, 0.15, 2550, 2.55, 'YourSurveys', 'ys3-' || id, 'Food Delivery Preferences', now() - interval '10 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 280, 0.28, 2830, 2.83, 'AdGem', 'agem-' || id, 'Language Learning App Trial', now() - interval '5 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 100, 0.10, 2930, 2.93, 'Referral', 'ref2-' || id, 'Referral reward - Level 2', now() - interval '3 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 270, 0.27, 3200, 3.20, 'YourSurveys', 'ys4-' || id, 'Auto Insurance Survey', now() - interval '1 day' from demo_user_map where email = 'demo.mike@coinloot.test';

  -- James Wilson — top earner
  insert into public.coin_transactions (user_id, transaction_type, amount_coins, amount_usd, balance_after_coins, balance_after_usd, source, source_id, description, created_at)
  select id, 'OFFER_COMPLETED', 1500, 1.50, 1500, 1.50, 'Torox', 'tox-' || id, 'Home Security System Sign Up', now() - interval '90 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 2500, 2.50, 4000, 4.00, 'AdGate', 'ag-' || id, 'Online Casino - Deposit $25', now() - interval '85 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 300, 0.30, 4300, 4.30, 'YourSurveys', 'ys-' || id, 'Financial Services Survey', now() - interval '80 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 2000, 2.00, 6300, 6.30, 'CPX Research', 'cpx-' || id, 'Credit Card - Platinum Card', now() - interval '75 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1800, 1.80, 8100, 8.10, 'Lootably', 'loot-' || id, 'Trading Platform - Deposit $50', now() - interval '68 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 400, 0.40, 8500, 8.50, 'YourSurveys', 'ys2-' || id, 'Luxury Goods Survey', now() - interval '60 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 3000, 3.00, 11500, 11.50, 'AdGem', 'agem-' || id, 'Real Money Poker App - Deposit $20', now() - interval '55 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 250, 0.25, 11750, 11.75, 'YourSurveys', 'ys3-' || id, 'Automotive Brand Survey', now() - interval '50 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1200, 1.20, 12950, 12.95, 'Revenue Universe', 'ru-' || id, 'Free Trial - Coffee Subscription', now() - interval '45 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'LEVEL_UP_BONUS', 500, 0.50, 13450, 13.45, 'system', 'lvl-' || id, 'Level 10 Bonus', now() - interval '42 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 3500, 3.50, 16950, 16.95, 'TimeWall', 'tw-' || id, 'Crypto Exchange - Buy $100 BTC', now() - interval '38 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 350, 0.35, 17300, 17.30, 'YourSurveys', 'ys4-' || id, 'Telecom Services Survey', now() - interval '32 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 2200, 2.20, 19500, 19.50, 'BitLabs', 'bl-' || id, 'Online Degree - Sign Up', now() - interval '28 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'LEVEL_UP_BONUS', 750, 0.75, 20250, 20.25, 'system', 'lvl2-' || id, 'Level 12 Bonus', now() - interval '25 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1600, 1.60, 21850, 21.85, 'GemiAds', 'ga-' || id, 'Solar Panel Quote', now() - interval '20 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 280, 0.28, 22130, 22.13, 'YourSurveys', 'ys5-' || id, 'Gaming Console Survey', now() - interval '15 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 4000, 4.00, 26130, 26.13, 'Torox', 'tox2-' || id, 'Investment Platform - Fund $100', now() - interval '12 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'WITHDRAWAL', -5000, -5.00, 21130, 21.13, 'withdrawal', 'wd-' || id, 'PayPal withdrawal - $5.00', now() - interval '10 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 2800, 2.80, 23930, 23.93, 'AdGate', 'ag2-' || id, 'High Yield Savings Account', now() - interval '8 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 320, 0.32, 24250, 24.25, 'YourSurveys', 'ys6-' || id, 'Crypto Investment Survey', now() - interval '5 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'WITHDRAWAL', -10000, -10.00, 14250, 14.25, 'withdrawal', 'wd2-' || id, 'Binance withdrawal - $10.00', now() - interval '3 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1750, 1.75, 16000, 16.00, 'CPX Research', 'cpx2-' || id, 'Business Credit Card Application', now() - interval '1 day' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 300, 0.30, 16300, 16.30, 'YourSurveys', 'ys7-' || id, 'Business Software Survey', now() - interval '12 hours' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 2700, 2.70, 19000, 19.00, 'Lootably', 'loot2-' || id, 'Managed Investment Portfolio', now() - interval '6 hours' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 350, 0.35, 19350, 19.35, 'YourSurveys', 'ys8-' || id, 'Insurance Bundle Survey', now() - interval '2 hours' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 2650, 2.65, 22000, 22.00, 'TimeWall', 'tw2-' || id, 'Premium VPN - 2 Year Plan', now() - interval '1 hour' from demo_user_map where email = 'demo.james@coinloot.test';

  -- Oliver Brown — high earner
  insert into public.coin_transactions (user_id, transaction_type, amount_coins, amount_usd, balance_after_coins, balance_after_usd, source, source_id, description, created_at)
  select id, 'OFFER_COMPLETED', 800, 0.80, 800, 0.80, 'Torox', 'tox-' || id, 'Loan Comparison Sign Up', now() - interval '55 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1200, 1.20, 2000, 2.00, 'AdGate', 'ag-' || id, 'Sports Betting App - Deposit $10', now() - interval '48 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 250, 0.25, 2250, 2.25, 'YourSurveys', 'ys-' || id, 'Automotive Purchase Survey', now() - interval '42 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1500, 1.50, 3750, 3.75, 'CPX Research', 'cpx-' || id, 'Gold IRA Investment', now() - interval '36 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 300, 0.30, 4050, 4.05, 'YourSurveys', 'ys2-' || id, 'Real Estate Survey', now() - interval '30 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 900, 0.90, 4950, 4.95, 'Lootably', 'loot-' || id, 'Free Trial - Meal Delivery Service', now() - interval '25 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'LEVEL_UP_BONUS', 250, 0.25, 5200, 5.20, 'system', 'lvl-' || id, 'Level 8 Bonus', now() - interval '22 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1100, 1.10, 6300, 6.30, 'AdGem', 'agem-' || id, 'Online Trading Course - Sign Up', now() - interval '18 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 200, 0.20, 6500, 6.50, 'YourSurveys', 'ys3-' || id, 'Renewable Energy Survey', now() - interval '14 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 700, 0.70, 7200, 7.20, 'Revenue Universe', 'ru-' || id, 'Free Trial - Project Management Tool', now() - interval '10 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'WITHDRAWAL', -4000, -4.00, 3200, 3.20, 'withdrawal', 'wd-' || id, 'PayPal withdrawal - $4.00', now() - interval '8 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1300, 1.30, 4500, 4.50, 'TimeWall', 'tw-' || id, 'Fitness App - Annual Subscription', now() - interval '5 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 280, 0.28, 4780, 4.78, 'YourSurveys', 'ys4-' || id, 'Smart Home Technology Survey', now() - interval '3 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 2200, 2.20, 6980, 6.98, 'GemiAds', 'ga-' || id, 'Life Insurance Quote', now() - interval '1 day' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 320, 0.32, 7300, 7.30, 'YourSurveys', 'ys5-' || id, 'Luxury Brand Survey', now() - interval '6 hours' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 1500, 1.50, 8800, 8.80, 'BitLabs', 'bl-' || id, 'Premium News Subscription', now() - interval '2 hours' from demo_user_map where email = 'demo.oliver@coinloot.test';

  -- Fatima Rahman — active user with referrals
  insert into public.coin_transactions (user_id, transaction_type, amount_coins, amount_usd, balance_after_coins, balance_after_usd, source, source_id, description, created_at)
  select id, 'OFFER_COMPLETED', 300, 0.30, 300, 0.30, 'Torox', 'tox-' || id, 'Mobile Recharge Offer', now() - interval '40 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 180, 0.18, 480, 0.48, 'YourSurveys', 'ys-' || id, 'E-commerce Survey', now() - interval '35 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 500, 0.50, 980, 0.98, 'AdGate', 'ag-' || id, 'Free Sample - Beauty Products', now() - interval '30 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 200, 0.20, 1180, 1.18, 'Referral', 'ref-' || id, 'Referral reward - Level 1', now() - interval '28 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 220, 0.22, 1400, 1.40, 'YourSurveys', 'ys2-' || id, 'FMCG Brand Survey', now() - interval '25 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 400, 0.40, 1800, 1.80, 'CPX Research', 'cpx-' || id, 'Telecom Bundle Sign Up', now() - interval '20 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 350, 0.35, 2150, 2.15, 'Referral', 'ref2-' || id, 'Referral reward - referrals activity', now() - interval '18 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 150, 0.15, 2300, 2.30, 'YourSurveys', 'ys3-' || id, 'Digital Wallet Survey', now() - interval '14 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 600, 0.60, 2900, 2.90, 'Lootably', 'loot-' || id, 'Freelancer Platform Sign Up', now() - interval '10 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 120, 0.12, 3020, 3.02, 'Referral', 'ref3-' || id, 'Referral reward - Level 2', now() - interval '8 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 280, 0.28, 3300, 3.30, 'YourSurveys', 'ys4-' || id, 'Banking App Survey', now() - interval '5 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 750, 0.75, 4050, 4.05, 'AdGem', 'agem-' || id, 'Online Course - Digital Marketing', now() - interval '3 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'WITHDRAWAL', -2000, -2.00, 2050, 2.05, 'withdrawal', 'wd-' || id, 'Binance withdrawal - $2.00', now() - interval '2 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 200, 0.20, 2250, 2.25, 'YourSurveys', 'ys5-' || id, 'Telemedicine Survey', now() - interval '1 day' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 500, 0.50, 2750, 2.75, 'Revenue Universe', 'ru-' || id, 'Free Trial - VPN Service', now() - interval '6 hours' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 180, 0.18, 2930, 2.93, 'Referral', 'ref4-' || id, 'Referral reward - Level 3', now() - interval '4 hours' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 170, 0.17, 3100, 3.10, 'YourSurveys', 'ys6-' || id, 'Education Technology Survey', now() - interval '2 hours' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 3400, 3.40, 'TimeWall', 'tw-' || id, 'Health App Registration', now() - interval '1 hour' from demo_user_map where email = 'demo.fatima@coinloot.test';

  -- Other users — David, Chen Wei, Lucas, Liam, Sophie, Isabella, Charlotte, Mohammed, Aisha
  insert into public.coin_transactions (user_id, transaction_type, amount_coins, amount_usd, balance_after_coins, balance_after_usd, source, source_id, description, created_at)
  select id, 'OFFER_COMPLETED', 350, 0.35, 350, 0.35, 'Torox', 'tox-' || id, 'Sign up for Credit Monitoring', now() - interval '50 days' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 200, 0.20, 550, 0.55, 'YourSurveys', 'ys-' || id, 'Pet Ownership Survey', now() - interval '45 days' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 800, 0.80, 1350, 1.35, 'AdGate', 'ag-' || id, 'Casino App - Deposit $10', now() - interval '38 days' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 150, 0.15, 1500, 1.50, 'YourSurveys', 'ys2-' || id, 'Fitness Habits Survey', now() - interval '30 days' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 450, 0.45, 1950, 1.95, 'CPX Research', 'cpx-' || id, 'Free Trial - Music Streaming', now() - interval '22 days' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 180, 0.18, 2130, 2.13, 'YourSurveys', 'ys3-' || id, 'Workplace Culture Survey', now() - interval '15 days' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 370, 0.37, 2500, 2.50, 'Revenue Universe', 'ru-' || id, 'Free Trial - Vitamin Supply', now() - interval '8 days' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 200, 0.20, 2700, 2.70, 'YourSurveys', 'ys4-' || id, 'Travel Insurance Survey', now() - interval '3 days' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 400, 0.40, 3100, 3.10, 'GemiAds', 'ga-' || id, 'Energy Provider Comparison', now() - interval '1 day' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'WITHDRAWAL', -1000, -1.00, 2100, 2.10, 'withdrawal', 'wd-' || id, 'PayPal withdrawal', now() - interval '2 days' from demo_user_map where email = 'demo.david@coinloot.test'
  -- Chen Wei — survey specialist
  union all select id, 'SURVEY_COMPLETED', 250, 0.25, 250, 0.25, 'YourSurveys', 'ys-' || id, 'Technology Trends Survey', now() - interval '40 days' from demo_user_map where email = 'demo.chen@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 300, 0.30, 550, 0.55, 'YourSurveys', 'ys2-' || id, 'Work From Home Survey', now() - interval '35 days' from demo_user_map where email = 'demo.chen@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 400, 0.40, 950, 0.95, 'Torox', 'tox-' || id, 'Broadband Internet Sign Up', now() - interval '30 days' from demo_user_map where email = 'demo.chen@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 350, 0.35, 1500, 1.50, 'YourSurveys', 'ys4-' || id, 'Healthcare Provider Survey', now() - interval '20 days' from demo_user_map where email = 'demo.chen@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 600, 0.60, 2100, 2.10, 'AdGate', 'ag-' || id, 'Online Banking Sign Up', now() - interval '15 days' from demo_user_map where email = 'demo.chen@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 320, 0.32, 2700, 2.70, 'YourSurveys', 'ys6-' || id, 'Mobile Payment App Survey', now() - interval '8 days' from demo_user_map where email = 'demo.chen@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 3900, 3.90, 'AdGem', 'agem-' || id, 'Free Trial - Cloud Storage', now() - interval '12 hours' from demo_user_map where email = 'demo.chen@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 450, 0.45, 4600, 4.60, 'Revenue Universe', 'ru-' || id, 'Free Trial - Accounting Software', now() - interval '1 hour' from demo_user_map where email = 'demo.chen@coinloot.test'
  -- Lucas Schmidt — moderate earner
  union all select id, 'OFFER_COMPLETED', 350, 0.35, 350, 0.35, 'Torox', 'tox-' || id, 'Car Warranty Quote', now() - interval '30 days' from demo_user_map where email = 'demo.lucas@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 500, 0.50, 1050, 1.05, 'AdGate', 'ag-' || id, 'Casino App - Free Registration', now() - interval '22 days' from demo_user_map where email = 'demo.lucas@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 150, 0.15, 1200, 1.20, 'Referral', 'ref-' || id, 'Referral reward - Level 1', now() - interval '20 days' from demo_user_map where email = 'demo.lucas@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 400, 0.40, 1780, 1.78, 'CPX Research', 'cpx-' || id, 'Free Trial - Audiobook Service', now() - interval '12 days' from demo_user_map where email = 'demo.lucas@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 100, 0.10, 1880, 1.88, 'Referral', 'ref2-' || id, 'Referral reward - Level 2', now() - interval '10 days' from demo_user_map where email = 'demo.lucas@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 450, 0.45, 3100, 3.10, 'AdGem', 'agem-' || id, 'Free Trial - Language Learning', now() - interval '1 day' from demo_user_map where email = 'demo.lucas@coinloot.test'
  union all select id, 'WITHDRAWAL', -1000, -1.00, 2100, 2.10, 'withdrawal', 'wd-' || id, 'PayPal withdrawal', now() - interval '12 hours' from demo_user_map where email = 'demo.lucas@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 200, 0.20, 2600, 2.60, 'Revenue Universe', 'ru-' || id, 'Free Trial - HR Software', now() - interval '1 hour' from demo_user_map where email = 'demo.lucas@coinloot.test'
  -- Liam Taylor — mid earner with withdrawals
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 300, 0.30, 'Torox', 'tox-' || id, 'Mobile Insurance Sign Up', now() - interval '45 days' from demo_user_map where email = 'demo.liam@coinloot.test'
  union all select id, 'WITHDRAWAL', -1000, -1.00, 680, 0.68, 'withdrawal', 'wd-' || id, 'PayPal withdrawal', now() - interval '22 days' from demo_user_map where email = 'demo.liam@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 350, 0.35, 1280, 1.28, 'Lootably', 'loot-' || id, 'Free Trial - Meal Prep Service', now() - interval '14 days' from demo_user_map where email = 'demo.liam@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 220, 0.22, 1500, 1.50, 'YourSurveys', 'ys4-' || id, 'Fashion E-commerce Survey', now() - interval '10 days' from demo_user_map where email = 'demo.liam@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 500, 0.50, 2000, 2.00, 'AdGem', 'agem-' || id, 'Currency Exchange App - Sign Up', now() - interval '6 days' from demo_user_map where email = 'demo.liam@coinloot.test'
  union all select id, 'WITHDRAWAL', -2000, -2.00, 160, 0.16, 'withdrawal', 'wd2-' || id, 'Binance withdrawal', now() - interval '1 day' from demo_user_map where email = 'demo.liam@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 240, 0.24, 400, 0.40, 'YourSurveys', 'ys6-' || id, 'E-Wallet Usage Survey', now() - interval '12 hours' from demo_user_map where email = 'demo.liam@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 150, 0.15, 1800, 1.80, 'GemiAds', 'ga-' || id, 'Newsletter Subscription', now() from demo_user_map where email = 'demo.liam@coinloot.test'
  -- Sophie Laurent — casual/low earner
  union all select id, 'SURVEY_COMPLETED', 150, 0.15, 150, 0.15, 'YourSurveys', 'ys-' || id, 'Social Media Usage Survey', now() - interval '20 days' from demo_user_map where email = 'demo.sophie@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 200, 0.20, 350, 0.35, 'Torox', 'tox-' || id, 'Free Sample - Skincare', now() - interval '15 days' from demo_user_map where email = 'demo.sophie@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 180, 0.18, 530, 0.53, 'YourSurveys', 'ys2-' || id, 'Sustainable Living Survey', now() - interval '10 days' from demo_user_map where email = 'demo.sophie@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 830, 0.83, 'AdGate', 'ag-' || id, 'Free Trial - Yoga App', now() - interval '5 days' from demo_user_map where email = 'demo.sophie@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 220, 0.22, 1050, 1.05, 'YourSurveys', 'ys3-' || id, 'Organic Food Survey', now() - interval '2 days' from demo_user_map where email = 'demo.sophie@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 250, 0.25, 1300, 1.30, 'CPX Research', 'cpx-' || id, 'Free Trial - Meditation App', now() - interval '1 day' from demo_user_map where email = 'demo.sophie@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 200, 0.20, 1500, 1.50, 'YourSurveys', 'ys4-' || id, 'Wellness Products Survey', now() - interval '6 hours' from demo_user_map where email = 'demo.sophie@coinloot.test'
  -- Isabella Garcia — rewards redeemer
  union all select id, 'OFFER_COMPLETED', 400, 0.40, 400, 0.40, 'Torox', 'tox-' || id, 'Fashion Retailer Sign Up', now() - interval '30 days' from demo_user_map where email = 'demo.isabella@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 500, 0.50, 1100, 1.10, 'AdGate', 'ag-' || id, 'Online Dating Site - Sign Up', now() - interval '22 days' from demo_user_map where email = 'demo.isabella@coinloot.test'
  union all select id, 'REWARD_REDEMPTION', -500, -0.50, 600, 0.60, 'reward', 'rw-' || id, 'Starbucks Gift Card', now() - interval '20 days' from demo_user_map where email = 'demo.isabella@coinloot.test'
  union all select id, 'REWARD_REDEMPTION', -600, -0.60, 530, 0.53, 'reward', 'rw2-' || id, 'Amazon Gift Card', now() - interval '10 days' from demo_user_map where email = 'demo.isabella@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 350, 0.35, 1130, 1.13, 'CPX Research', 'cpx-' || id, 'Free Trial - Meal Kit Service', now() - interval '12 days' from demo_user_map where email = 'demo.isabella@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 1050, 1.05, 'AdGem', 'agem-' || id, 'Free Sample - Baby Products', now() - interval '5 days' from demo_user_map where email = 'demo.isabella@coinloot.test'
  union all select id, 'REWARD_REDEMPTION', -400, -0.40, 900, 0.90, 'reward', 'rw3-' || id, 'Walmart Gift Card', now() - interval '1 day' from demo_user_map where email = 'demo.isabella@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 250, 0.25, 1150, 1.15, 'Revenue Universe', 'ru-' || id, 'Free Trial - Grocery Delivery', now() - interval '6 hours' from demo_user_map where email = 'demo.isabella@coinloot.test'
  -- Charlotte King — daily streak user
  union all select id, 'DAILY_REWARD', 50, 0.05, 50, 0.05, 'daily', 'dr-' || id, 'Day 1 Reward', now() - interval '14 days' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'DAILY_REWARD', 60, 0.06, 110, 0.11, 'daily', 'dr2-' || id, 'Day 2 Reward', now() - interval '13 days' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 760, 0.76, 'Torox', 'tox-' || id, 'Free Trial - Pet Food Delivery', now() - interval '9 days' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'DAILY_REWARD', 90, 0.09, 850, 0.85, 'daily', 'dr5-' || id, 'Day 5 Reward', now() - interval '8 days' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'STREAK_BONUS', 200, 0.20, 1150, 1.15, 'streak', 'sb-' || id, '7-Day Streak Bonus', now() - interval '6 days' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 220, 0.22, 1420, 1.42, 'YourSurveys', 'ys2-' || id, 'Health & Wellness Survey', now() - interval '4 days' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 400, 0.40, 1880, 1.88, 'AdGate', 'ag-' || id, 'Free Sample - Coffee Subscription', now() - interval '2 days' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'DAILY_REWARD', 70, 0.07, 1950, 1.95, 'daily', 'dr9-' || id, 'Day 3 Reward', now() - interval '1 day' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 250, 0.25, 2200, 2.20, 'YourSurveys', 'ys3-' || id, 'Pet Care Survey', now() - interval '12 hours' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'WITHDRAWAL', -1000, -1.00, 1280, 1.28, 'withdrawal', 'wd-' || id, 'PayPal withdrawal', now() - interval '3 hours' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 350, 0.35, 1630, 1.63, 'CPX Research', 'cpx-' || id, 'Free Trial - Smart Home Device', now() - interval '1 hour' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'DAILY_REWARD', 90, 0.09, 1720, 1.72, 'daily', 'dr11-' || id, 'Day 5 Reward', now() - interval '30 mins' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 2200, 2.20, 'AdGem', 'agem-' || id, 'Free Trial - Password Manager', now() - interval '5 mins' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  -- Mohammed Ali — growing new user
  union all select id, 'OFFER_COMPLETED', 200, 0.20, 200, 0.20, 'Torox', 'tox-' || id, 'Mobile Top Up Offer', now() - interval '10 days' from demo_user_map where email = 'demo.mohammed@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 650, 0.65, 'AdGate', 'ag-' || id, 'Free Trial - Music Streaming', now() - interval '6 days' from demo_user_map where email = 'demo.mohammed@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 180, 0.18, 830, 0.83, 'YourSurveys', 'ys2-' || id, 'E-Learning Survey', now() - interval '4 days' from demo_user_map where email = 'demo.mohammed@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 250, 0.25, 1080, 1.08, 'CPX Research', 'cpx-' || id, 'Free Trial - Cloud Backup', now() - interval '2 days' from demo_user_map where email = 'demo.mohammed@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 200, 0.20, 1480, 1.48, 'AdGem', 'agem-' || id, 'Free Trial - PDF Scanner', now() - interval '6 hours' from demo_user_map where email = 'demo.mohammed@coinloot.test'
  union all select id, 'SURVEY_COMPLETED', 300, 0.30, 1780, 1.78, 'YourSurveys', 'ys4-' || id, 'Ride Sharing Survey', now() - interval '2 hours' from demo_user_map where email = 'demo.mohammed@coinloot.test'
  -- Aisha Patel — referral specialist
  union all select id, 'OFFER_COMPLETED', 250, 0.25, 250, 0.25, 'Torox', 'tox-' || id, 'Fashion Store Sign Up', now() - interval '35 days' from demo_user_map where email = 'demo.aisha@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 400, 0.40, 850, 0.85, 'Referral', 'ref-' || id, 'Referral reward - Level 1', now() - interval '28 days' from demo_user_map where email = 'demo.aisha@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 350, 0.35, 1200, 1.20, 'AdGate', 'ag-' || id, 'Food Delivery App Sign Up', now() - interval '25 days' from demo_user_map where email = 'demo.aisha@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 500, 0.50, 1700, 1.70, 'Referral', 'ref2-' || id, 'Referral reward - Level 1', now() - interval '22 days' from demo_user_map where email = 'demo.aisha@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 250, 0.25, 2130, 2.13, 'Referral', 'ref3-' || id, 'Referral reward - Level 2', now() - interval '18 days' from demo_user_map where email = 'demo.aisha@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 300, 0.30, 2930, 2.93, 'Referral', 'ref4-' || id, 'Referral reward - Level 1', now() - interval '12 days' from demo_user_map where email = 'demo.aisha@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 180, 0.18, 3330, 3.33, 'Referral', 'ref5-' || id, 'Referral reward - Level 3', now() - interval '8 days' from demo_user_map where email = 'demo.aisha@coinloot.test'
  union all select id, 'OFFER_COMPLETED', 300, 0.30, 3630, 3.63, 'Lootably', 'loot-' || id, 'Free Trial - Beauty Box', now() - interval '5 days' from demo_user_map where email = 'demo.aisha@coinloot.test'
  union all select id, 'REFERRAL_REWARD', 210, 0.21, 4100, 4.10, 'Referral', 'ref6-' || id, 'Referral reward - Level 2', now() - interval '1 day' from demo_user_map where email = 'demo.aisha@coinloot.test';

  -- ── 14f. Earnings History ──
  insert into public.earnings_history (user_id, source_type, source_name, coins_earned, usd_value, provider_name, offer_title, created_at)
  select id, 'offerwall', 'Torox', 500, 0.50, 'Torox', 'Home Insurance Quote', now() - interval '60 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'offerwall', 'AdGate', 750, 0.75, 'AdGate', 'Game of Thrones Slots', now() - interval '55 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'survey', 'YourSurveys', 200, 0.20, 'YourSurveys', 'Consumer Electronics Survey', now() - interval '50 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'offerwall', 'CPX Research', 1000, 1.00, 'CPX Research', 'Credit Card Application', now() - interval '45 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'offerwall', 'Torox', 400, 0.40, 'Torox', 'Loan Comparison Sign Up', now() - interval '55 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'offerwall', 'AdGate', 1200, 1.20, 'AdGate', 'Sports Betting App', now() - interval '48 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'referral', 'Referral', 200, 0.20, 'Referral', 'Referral reward', now() - interval '28 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'referral', 'Referral', 400, 0.40, 'Referral', 'Referral reward', now() - interval '28 days' from demo_user_map where email = 'demo.aisha@coinloot.test'
  union all select id, 'daily', 'Daily Reward', 50, 0.05, 'Daily', 'Day 1 Reward', now() - interval '14 days' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'daily', 'Daily Reward', 100, 0.10, 'Daily', 'Day 6 Reward', now() from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'offerwall', 'Torox', 200, 0.20, 'Torox', 'Mobile Top Up Offer', now() - interval '10 days' from demo_user_map where email = 'demo.mohammed@coinloot.test';

  -- ── 14g. Withdrawal Records ──
  insert into public.withdrawals (user_id, username, reward_name, payout_method, payout_details, coins_deducted, usd_value, status, created_at)
  select id, 'james_w', 'PayPal Cash', 'PayPal', 'james.wilson@email.com', 5000, 5.00, 'PAID', now() - interval '10 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'james_w', 'Binance Pay', 'Binance Pay', 'james_w_binance', 10000, 10.00, 'APPROVED', now() - interval '3 days' from demo_user_map where email = 'demo.james@coinloot.test'
  union all select id, 'sarah_j', 'PayPal Cash', 'PayPal', 'sarah.johnson@email.com', 5000, 5.00, 'PAID', now() - interval '40 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'sarah_j', 'PayPal Cash', 'PayPal', 'sarah.johnson@email.com', 8000, 8.00, 'PAID', now() - interval '20 days' from demo_user_map where email = 'demo.sarah@coinloot.test'
  union all select id, 'oliver_b', 'PayPal Cash', 'PayPal', 'oliver.brown@email.com', 4000, 4.00, 'PAID', now() - interval '8 days' from demo_user_map where email = 'demo.oliver@coinloot.test'
  union all select id, 'fatima_r', 'Binance Pay', 'Binance Pay', 'fatima_binance', 2000, 2.00, 'PAID', now() - interval '2 days' from demo_user_map where email = 'demo.fatima@coinloot.test'
  union all select id, 'david_m', 'PayPal Cash', 'PayPal', 'david.miller@email.com', 1000, 1.00, 'PAID', now() - interval '2 days' from demo_user_map where email = 'demo.david@coinloot.test'
  union all select id, 'liam_t', 'PayPal Cash', 'PayPal', 'liam.taylor@email.com', 1000, 1.00, 'PENDING', now() - interval '22 days' from demo_user_map where email = 'demo.liam@coinloot.test'
  union all select id, 'liam_t', 'Binance Pay', 'Binance Pay', 'liam_binance', 2000, 2.00, 'PENDING', now() - interval '1 day' from demo_user_map where email = 'demo.liam@coinloot.test'
  union all select id, 'charlotte_k', 'PayPal Cash', 'PayPal', 'charlotte.king@email.com', 1000, 1.00, 'PENDING', now() - interval '3 hours' from demo_user_map where email = 'demo.charlotte@coinloot.test'
  union all select id, 'mike_chen', 'PayPal Cash', 'PayPal', 'mike.chen@email.com', 2000, 2.00, 'PENDING', now() - interval '15 days' from demo_user_map where email = 'demo.mike@coinloot.test'
  union all select id, 'lucas_s', 'PayPal Cash', 'PayPal', 'lucas.schmidt@email.com', 1000, 1.00, 'PENDING', now() - interval '12 hours' from demo_user_map where email = 'demo.lucas@coinloot.test';

  -- ── 14h. Referral Relationships ──
  update public.profiles set referred_by = (select id from demo_user_map where email = 'demo.james@coinloot.test')
  where email = 'demo.sarah@coinloot.test' and referred_by is null;
  update public.profiles set referred_by = (select id from demo_user_map where email = 'demo.sarah@coinloot.test')
  where email = 'demo.fatima@coinloot.test' and referred_by is null;
  update public.profiles set referred_by = (select id from demo_user_map where email = 'demo.mike@coinloot.test')
  where email = 'demo.david@coinloot.test' and referred_by is null;
  update public.profiles set referred_by = (select id from demo_user_map where email = 'demo.aisha@coinloot.test')
  where email = 'demo.mohammed@coinloot.test' and referred_by is null;
  update public.profiles set referred_by = (select id from demo_user_map where email = 'demo.lucas@coinloot.test')
  where email = 'demo.sophie@coinloot.test' and referred_by is null;
  update public.profiles set referred_by = (select id from demo_user_map where email = 'demo.james@coinloot.test')
  where email = 'demo.oliver@coinloot.test' and referred_by is null;
  update public.profiles set referred_by = (select id from demo_user_map where email = 'demo.charlotte@coinloot.test')
  where email = 'demo.liam@coinloot.test' and referred_by is null;

  -- ── 14i. Referral Earnings ──
  insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
  select r.id, u.id, u.username, 1, 150, 10.00, 'earnings' from demo_user_map r, demo_user_map u
  where r.email = 'demo.mike@coinloot.test' and u.email = 'demo.david@coinloot.test'
    and not exists (select 1 from public.referral_earnings where referrer_id = r.id and referred_user_id = u.id);
  insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
  select r.id, u.id, u.username, 1, 200, 10.00, 'earnings' from demo_user_map r, demo_user_map u
  where r.email = 'demo.fatima@coinloot.test' and u.email = 'demo.mohammed@coinloot.test'
    and not exists (select 1 from public.referral_earnings where referrer_id = r.id and referred_user_id = u.id);
  insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
  select r.id, u.id, u.username, 1, 400, 10.00, 'earnings' from demo_user_map r, demo_user_map u
  where r.email = 'demo.aisha@coinloot.test' and u.email = 'demo.mohammed@coinloot.test'
    and not exists (select 1 from public.referral_earnings where referrer_id = r.id and referred_user_id = u.id);
  insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
  select r.id, u.id, u.username, 1, 100, 10.00, 'earnings' from demo_user_map r, demo_user_map u
  where r.email = 'demo.lucas@coinloot.test' and u.email = 'demo.sophie@coinloot.test'
    and not exists (select 1 from public.referral_earnings where referrer_id = r.id and referred_user_id = u.id);
  insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
  select r.id, u.id, u.username, 1, 500, 10.00, 'earnings' from demo_user_map r, demo_user_map u
  where r.email = 'demo.james@coinloot.test' and u.email = 'demo.sarah@coinloot.test'
    and not exists (select 1 from public.referral_earnings where referrer_id = r.id and referred_user_id = u.id);
  insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
  select r.id, u.id, u.username, 1, 300, 10.00, 'earnings' from demo_user_map r, demo_user_map u
  where r.email = 'demo.james@coinloot.test' and u.email = 'demo.oliver@coinloot.test'
    and not exists (select 1 from public.referral_earnings where referrer_id = r.id and referred_user_id = u.id);
  insert into public.referral_earnings (referrer_id, referred_user_id, ref_username, level_depth, coins_awarded, percentage, source_type)
  select r.id, u.id, u.username, 1, 200, 10.00, 'earnings' from demo_user_map r, demo_user_map u
  where r.email = 'demo.charlotte@coinloot.test' and u.email = 'demo.liam@coinloot.test'
    and not exists (select 1 from public.referral_earnings where referrer_id = r.id and referred_user_id = u.id);

  -- ── 14j. Live Earnings Feed ──
  insert into public.live_earnings (username, provider, coins_earned, created_at) values
    ('sarah_j', 'Torox', 500, now() - interval '60 days'),
    ('james_w', 'AdGate', 2500, now() - interval '85 days'),
    ('oliver_b', 'CPX Research', 1500, now() - interval '36 days'),
    ('fatima_r', 'YourSurveys', 220, now() - interval '25 days'),
    ('david_m', 'Revenue Universe', 370, now() - interval '8 days'),
    ('chen_wei', 'YourSurveys', 320, now() - interval '8 days'),
    ('charlotte_k', 'Daily Reward', 50, now() - interval '14 days'),
    ('mohammed_a', 'AdGate', 300, now() - interval '6 days'),
    ('isabella_g', 'Torox', 400, now() - interval '30 days'),
    ('sophie_l', 'YourSurveys', 150, now() - interval '20 days'),
    ('liam_t', 'AdGem', 500, now() - interval '6 days'),
    ('lucas_s', 'Torox', 350, now() - interval '30 days'),
    ('aisha_p', 'AdGate', 350, now() - interval '25 days'),
    ('mike_chen', 'Lootably', 500, now() - interval '15 days');

  -- ── 14k. Re-enable FK checks ──
  set session_replication_role = default;

  -- ── 14l. Cleanup ──
  drop table if exists demo_user_map;

  raise notice '============================================================';
  raise notice 'DEMO DATA CREATED: 15 demo users with earnings,';
  raise notice 'withdrawals, and referral data for testing.';
  raise notice 'To remove: DELETE FROM public.profiles';
  raise notice '            WHERE email LIKE ''demo.%%@coinloot.test'';';
  raise notice '============================================================';
end $$;

-- ====================================================================
-- VPN / PROXY DETECTION SYSTEM
-- ====================================================================

-- VPN / Proxy Detection Logs
create table if not exists public.vpn_detection_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  username text,
  ip_address text not null,
  country text,
  isp text,
  detection_type text not null default 'Proxy',
  detected_at timestamptz not null default now(),
  user_agent text,
  created_at timestamptz not null default now()
);

-- User Restrictions
create table if not exists public.user_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  restricted_until timestamptz not null,
  reason text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Restriction History (audit trail)
create table if not exists public.restriction_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  username text,
  action text not null check (action in ('restricted', 'unrestricted', 'extended', 'banned')),
  duration_minutes int default 0,
  reason text default '',
  admin_action text,
  timestamp timestamptz not null default now()
);

-- IP Logs (per-user IP tracking)
create table if not exists public.ip_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  ip_address text not null,
  country text,
  isp text,
  detection_type text default 'clean',
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  seen_count int default 1
);

-- Indexes
create index if not exists idx_vpn_logs_user_id on public.vpn_detection_logs(user_id);
create index if not exists idx_vpn_logs_detected_at on public.vpn_detection_logs(detected_at);
create index if not exists idx_user_restrictions_user_id on public.user_restrictions(user_id);
create index if not exists idx_restriction_history_user_id on public.restriction_history(user_id);
create index if not exists idx_ip_logs_user_id on public.ip_logs(user_id);
create index if not exists idx_ip_logs_ip on public.ip_logs(ip_address);

-- Add vpn_detected column if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'vpn_detected'
  ) then
    alter table public.profiles add column vpn_detected boolean default false;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'restriction_count'
  ) then
    alter table public.profiles add column restriction_count int default 0;
  end if;
end $$;

-- Enable RLS
alter table public.vpn_detection_logs enable row level security;
alter table public.user_restrictions enable row level security;
alter table public.restriction_history enable row level security;
alter table public.ip_logs enable row level security;

-- RLS policies
drop policy if exists "Admins can read vpn_detection_logs" on public.vpn_detection_logs;
create policy "Admins can read vpn_detection_logs" on public.vpn_detection_logs
  for select using (
    auth.role() = 'service_role' or
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
drop policy if exists "Admins can insert vpn_detection_logs" on public.vpn_detection_logs;
create policy "Admins can insert vpn_detection_logs" on public.vpn_detection_logs
  for insert with check (true);
drop policy if exists "Admins can read user_restrictions" on public.user_restrictions;
create policy "Admins can read user_restrictions" on public.user_restrictions
  for select using (
    auth.role() = 'service_role' or
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) or
    user_id = auth.uid()
  );
drop policy if exists "Admins can manage user_restrictions" on public.user_restrictions;
create policy "Admins can manage user_restrictions" on public.user_restrictions
  for all using (auth.role() = 'service_role' or (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)));
drop policy if exists "Admins can read restriction_history" on public.restriction_history;
create policy "Admins can read restriction_history" on public.restriction_history
  for select using (true);
drop policy if exists "Admins can insert restriction_history" on public.restriction_history;
create policy "Admins can insert restriction_history" on public.restriction_history
  for insert with check (true);
drop policy if exists "Admins can read ip_logs" on public.ip_logs;
create policy "Admins can read ip_logs" on public.ip_logs
  for select using (true);
drop policy if exists "Admins can insert ip_logs" on public.ip_logs;
create policy "Admins can insert ip_logs" on public.ip_logs
  for insert with check (true);

-- ════════════════════════════════════════════════════════════════════
-- 15. ADMIN USER SEED (idempotent)
-- ════════════════════════════════════════════════════════════════════
-- Creates the admin auth user, profile, and admin_accounts entry.
-- Requires pgcrypto extension (enabled by default in Supabase).
-- ════════════════════════════════════════════════════════════════════

do $$
declare
  v_admin_id uuid;
  v_admin_email text := 'coinlootadmin@gmail.com';
  v_admin_password text := 'Coinloot@#admin@#';
  v_admin_username text := 'SuperAdmin';
begin
  -- Check if admin already exists in auth.users
  select id into v_admin_id from auth.users where email = v_admin_email;

  if v_admin_id is null then
    -- Create auth user with confirmed email
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_admin_email,
      crypt(v_admin_password, gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('username', v_admin_username),
      now(), now(),
      '', '', '', '',
      false, false
    )
    returning id into v_admin_id;

    -- Insert identity for email/password login
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (
      v_admin_id,
      v_admin_id,
      jsonb_build_object('sub', v_admin_id, 'email', v_admin_email),
      'email',
      v_admin_email,
      now(), now(), now()
    );

    raise notice 'Admin auth user and identity created: %', v_admin_id;
  else
    -- Update existing admin's password
    update auth.users
    set encrypted_password = crypt(v_admin_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_admin_id;

    raise notice 'Admin auth user already exists: %', v_admin_id;
  end if;

  -- Create / update profile
  insert into public.profiles (id, username, email, is_admin)
  values (v_admin_id, v_admin_username, v_admin_email, true)
  on conflict (id) do update set
    is_admin = true,
    username = v_admin_username;

  -- Insert into admin_accounts
  insert into public.admin_accounts (user_id, role)
  values (v_admin_id, 'ADMIN')
  on conflict (user_id) do nothing;

  raise notice 'Admin profile and admin_accounts created/updated.';
end;
$$;

-- ════════════════════════════════════════════════════════════════════
-- SCHEMA PERMISSIONS — Grant access to Supabase roles
-- ════════════════════════════════════════════════════════════════════

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- ====================================================================
-- END OF SCHEMA
-- ====================================================================

