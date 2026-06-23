# Coin Loot — Database Architecture Documentation

> **Project:** Coin Loot (GPT/Offerwall Platform)
> **Database:** Supabase (PostgreSQL 15+)
> **Project ID:** `advxrogjhjkrwgzlxqwn`
> **Version:** 1.0.0 (Production)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Table Reference](#2-table-reference)
3. [Entity Relationships](#3-entity-relationships)
4. [Core Systems](#4-core-systems)
   - [User & Auth System](#41-user--auth-system)
   - [Admin System](#42-admin-system)
   - [Offerwall System](#43-offerwall-system)
   - [Survey System](#44-survey-system)
   - [Coin & Transaction System](#45-coin--transaction-system)
   - [Notification System](#46-notification-system)
   - [Withdrawal System](#47-withdrawal-system)
   - [Referral System](#48-referral-system)
   - [Promo Code System](#49-promo-code-system)
   - [Rewards System](#410-rewards-system)
   - [Leaderboard System](#411-leaderboard-system)
   - [Support System](#412-support-system)
5. [Indexes](#5-indexes)
6. [Triggers & Functions](#6-triggers--functions)
7. [Row Level Security (RLS)](#7-row-level-security-rls)
8. [Realtime Subscriptions](#8-realtime-subscriptions)
9. [Seed Data](#9-seed-data)
10. [Migration Guide](#10-migration-guide)
11. [Admin Features Reference](#11-admin-features-reference)
12. [User Features Reference](#12-user-features-reference)

---

## 1. Architecture Overview

The Coin Loot database is built on **Supabase** (PostgreSQL 15+ with Row Level Security). The entire schema is a single file (`supabase_schema.sql`) organized into **38 tables** across **12 core systems**:

| System | Tables | Purpose |
|---|---|---|
| User & Auth | 6 | Profiles, balances, levels, login history, email verification, activity logs |
| Admin | 4 | Admin accounts, activity logs, security logs, fraud detection |
| Offerwall | 6 | Providers, API configs, offerwalls, locked offerwalls, unlock rules, status history |
| Survey | 1 | Survey offers with targeting |
| Coin & Transaction | 3 | Coin transactions, earnings history, live earnings feed |
| Notification | 3 | User notifications, notification settings, system broadcasts |
| Withdrawal | 3 | Withdrawal methods, withdrawal requests, wallet configs |
| Referral | 2 | Referral links, referral earnings (3-level) |
| Promo Code | 2 | Promo codes, redemptions |
| Rewards | 3 | Reward store items, daily rewards, achievements |
| Leaderboard | 1 | Materialized leaderboard statistics |
| Support | 2 | Support tickets, ticket replies |
| Site Config | 2 | Site settings, API integrations |

### Key Design Principles

- **Every coin movement is logged** — The `coin_transactions` table records every credit and debit with balance snapshots
- **Multi-level referrals** — Automatic 3-level referral reward distribution with configurable percentages
- **Single admin role** — One `ADMIN` role with full unrestricted platform access
- **RLS-first security** — Every table has Row Level Security policies; users see only their own data
- **Realtime-ready** — Key tables published to Supabase Realtime for instant UI updates
- **Soft state management** — Offerwall status, user ban/suspend statuses are soft toggles

---

## 2. Table Reference

### 2.1 User & Auth System

| # | Table | Schema | Description |
|---|---|---|---|
| 1 | `profiles` | `public` | Core user profiles with balances, stats, and preferences |
| 2 | `user_balances` | `public` | Balance snapshot table for transactional tracking |
| 3 | `user_levels` | `public` | Level configuration (XP thresholds, bonuses) |
| 4 | `login_history` | `public` | User login audit log with VPN/device detection |
| 5 | `email_verifications` | `public` | Email verification tokens (24h expiry) |
| 6 | `user_activity_logs` | `public` | General user activity audit trail |

### 2.2 Admin System

| # | Table | Schema | Description |
|---|---|---|---|
| 7 | `admin_accounts` | `public` | Links auth users to admin role |
| 8 | `admin_activity_logs` | `public` | Admin action audit trail with target/detail |
| 9 | `security_logs` | `public` | Security event log (severity: LOW→CRITICAL) |
| 10 | `fraud_detection_logs` | `public` | VPN/proxy/suspicious activity detection |

### 2.3 Offerwall System

| # | Table | Schema | Description |
|---|---|---|---|
| 12 | `offerwall_providers` | `public` | Provider definitions (name, initials, logo) |
| 13 | `offerwall_api_configs` | `public` | Encrypted API credentials per provider |
| 14 | `offerwalls` | `public` | Offerwall instances with status and targeting |
| 15 | `locked_offerwalls` | `public` | Conditional unlock requirements |
| 16 | `offer_unlock_rules` | `public` | Per-offerwall rule definitions |
| 17 | `offerwall_status_history` | `public` | Status change audit log |

### 2.4 Surveys

| # | Table | Schema | Description |
|---|---|---|---|
| 18 | `surveys` | `public` | Survey offers with payouts, targeting, and availability |

### 2.5 Coin & Transaction System

| # | Table | Schema | Description |
|---|---|---|---|
| 19 | `coin_transactions` | `public` | Every coin movement (17 types) with balance snapshots |
| 20 | `earnings_history` | `public` | Human-readable earnings log |
| 21 | `live_earnings` | `public` | Real-time earnings feed for UI ticker |

### 2.6 Notification System

| # | Table | Schema | Description |
|---|---|---|---|
| 22 | `notifications` | `public` | Per-user notifications with type, source, and read status |
| 23 | `notification_settings` | `public` | Per-user notification preferences (email, push, sound) |
| 24 | `system_notifications` | `public` | Admin-created broadcast notifications |

### 2.7 Withdrawal System

| # | Table | Schema | Description |
|---|---|---|---|
| 25 | `withdrawal_methods` | `public` | Payout method configurations (min/max, fees, API status) |
| 26 | `withdrawals` | `public` | Withdrawal requests with full audit trail |
| 27 | `wallet_configurations` | `public` | User-stored wallet addresses per method |

### 2.8 Referral System

| # | Table | Schema | Description |
|---|---|---|---|
| 28 | `referral_links` | `public` | Per-user referral codes with click/signup stats |
| 29 | `referral_earnings` | `public` | Multi-level referral reward log (3 levels) |

### 2.9 Promo Code System

| # | Table | Schema | Description |
|---|---|---|---|
| 30 | `promo_codes` | `public` | Promo code definitions with usage limits |
| 31 | `promo_code_redemptions` | `public` | User redemption log (prevents double-redeem) |

### 2.10 Rewards System

| # | Table | Schema | Description |
|---|---|---|---|
| 32 | `rewards` | `public` | Reward store item definitions |
| 33 | `daily_rewards` | `public` | Daily streak claim log |
| 34 | `achievement_rewards` | `public` | Achievement unlock log |

### 2.11 Leaderboard System

| # | Table | Schema | Description |
|---|---|---|---|
| 35 | `leaderboard_statistics` | `public` | Materialized user stats with daily/weekly/monthly rankings |

### 2.12 Support System

| # | Table | Schema | Description |
|---|---|---|---|
| 36 | `support_tickets` | `public` | User support tickets with priority and assignment |
| 37 | `ticket_replies` | `public` | Ticket thread replies (user + admin) |

### 2.13 Site Configuration

| # | Table | Schema | Description |
|---|---|---|---|
| 38 | `site_settings` | `public` | Key-value site configuration |
| 39 | `api_integrations` | `public` | External service API credentials |

---

## 3. Entity Relationships

### Core User Relationship Map

```
auth.users
  └─ profiles (id = auth.users.id)
      ├─ user_balances (user_id → profiles.id)
      ├─ login_history (user_id → profiles.id)
      ├─ email_verifications (user_id → profiles.id)
      ├─ user_activity_logs (user_id → profiles.id)
      ├─ notification_settings (user_id → profiles.id, 1:1)
      ├─ referral_links (user_id → profiles.id, 1:1)
      ├─ wallet_configurations (user_id → profiles.id)
      ├─ daily_rewards (user_id → profiles.id)
      ├─ achievement_rewards (user_id → profiles.id)
      ├─ leaderboard_statistics (user_id → profiles.id, 1:1)
      ├─ support_tickets (user_id → profiles.id)
      ├─ fraud_detection_logs (user_id → profiles.id)
      ├─ referred_by → profiles.id (self-referential)
      └─ admin_accounts (user_id → profiles.id, 1:1)
```

### Offerwall Relationship Map

```
offerwall_providers
  └─ offerwall_api_configs (provider_id → offerwall_providers.id, 1:1)
  └─ offerwalls (provider_id → offerwall_providers.id)
       ├─ locked_offerwalls (offerwall_id → offerwalls.id, 1:1)
       ├─ offer_unlock_rules (offerwall_id → offerwalls.id)
       └─ offerwall_status_history (offerwall_id → offerwalls.id)
```

### Transaction & Notification Flow

```
coin_transactions → earnings_history → live_earnings
                                       notifications (created via triggers)
                                       leaderboard_statistics (updated via triggers)
        └─ withdrawal refunds          referral_earnings (3-level distribution)
```

---

## 4. Core Systems

### 4.1 User & Auth System

The `profiles` table is the central user record, linked 1:1 to `auth.users` via UUID foreign key. It stores:

- **Identity:** `username`, `email`, `full_name`, `country`, `avatar_url`
- **Balances:** `balance_coins` (default `0`), `balance_usd` (default `0.00`), `total_earned_coins` (default `0`), `total_withdrawn_usd` (default `0.00`)
- **Progression:** `xp`, `level`, `streak_days`
- **Referral:** `referred_by` (self-referential FK), `referrals_count`
- **KYC:** `kyc_status` (NOT_STARTED → PENDING → APPROVED → REJECTED cycle)
- **Moderation:** `is_banned`, `is_suspended`, `ban_reason`
- **Security:** `vpn_detected`, `device_fingerprint`, `last_login_at`
- **Preferences:** `preference_theme`, `preference_language`, `notification_email`, `notification_push`

**Key Constraints:**
- `username`: UNIQUE, NOT NULL
- `email`: UNIQUE, NOT NULL
- `kyc_status`: CHECK constraint on allowed values
- `referred_by`: Self-referential FK with ON DELETE SET NULL

**Auto-creation triggers:** When a profile is created, the system auto-creates:
- `notification_settings` row
- `referral_links` row (with generated code)
- `leaderboard_statistics` row
- **No initial coins or welcome bonus** — `new_user_bonus_coins` site setting is `'0'` (disabled by default)

**Level system:** XP-based auto-leveling via trigger (`fn_update_level_by_xp`). Formula: `level = floor(xp / 1000) + 1`. Level thresholds are configurable via `user_levels` table.

---

### 4.2 Admin System

The platform uses a **single admin role**: **Admin** with full unrestricted access.

**Admin access is gated by:**
1. `profiles.is_admin` boolean (quick check)
2. `admin_accounts` table entry with `role = 'ADMIN'`

**Helper function for RLS:**
- `fn_is_admin()` — Checks `profiles.is_admin`

**Security & Fraud Detection:**
- `security_logs`: Severity-graded security events (LOW/MEDIUM/HIGH/CRITICAL)
- `fraud_detection_logs`: VPN, proxy, TOR, click fraud, multi-account detection with confidence scoring
- `login_history`: Every login recorded with IP, device fingerprint, and VPN detection

---

### 4.3 Offerwall System

**Provider Management:**
- `offerwall_providers`: Name, initials, color, logo URL
- `offerwall_api_configs`: 1:1 with providers; stores API keys, publisher IDs, secret keys, webhook secrets (all text fields — encrypted at application layer recommended)

**Offerwall Instances:**
- `offerwalls`: Provider + name + status (ACTIVE/INACTIVE/LOCKED) + priority + country/device restrictions
- Supports `is_featured` boolean for special placement

**Locked Offerwalls:**
- `locked_offerwalls`: 1:1 with offerwalls
- Unlock condition types: `coins_earned`, `level`, `tasks_completed`
- Example: Unlock Torox after earning 500 coins
- Admin can modify unlock conditions at any time via prompt-based UI

**Offer Unlock Rules:**
- `offer_unlock_rules`: Per-offerwall rule definitions
- Rule types: `min_level`, `min_coins_earned`, `country`, `device`, `new_users_only`, `returning_users_only`
- Multiple rules can apply to a single offerwall (AND logic)

---

### 4.4 Survey System

The `surveys` table stores individual survey offers with:
- Provider link via `provider_id`
- Payout, difficulty, category
- Country restrictions (JSONB array)
- Slot tracking (`total_slots`, `remaining_slots`)
- Expiry date

---

### 4.5 Coin & Transaction System

**Every coin movement is recorded** in `coin_transactions` with:

- `transaction_type`: 17 enum values covering all earning/spending scenarios
- `amount_coins` and `amount_usd`: The transaction amount
- `balance_after_coins` and `balance_after_usd`: Balance snapshot after the transaction
- `source` and `source_id`: Tracing fields (e.g., "offerwall", "promo_code_id")
- `reference_id`: External reference (e.g., withdrawal ID for refunds)
- `metadata`: JSONB for extensible data

**Transaction Types:**
| Type | Direction | Description |
|---|---|---|
| OFFER_COMPLETED | Credit | Offerwall completion reward |
| SURVEY_COMPLETED | Credit | Survey completion reward |
| REFERRAL_REWARD | Credit | Referral commission payout |
| DAILY_REWARD | Credit | Daily streak claim |
| BONUS_REWARD | Credit | Special bonus |
| PROMO_REWARD | Credit | Promo code redemption |
| ACHIEVEMENT_REWARD | Credit | Achievement unlock |
| ADMIN_CREDIT | Credit | Admin-added coins |
| ADMIN_DEBIT | Debit | Admin-removed coins |
| WITHDRAWAL | Debit | Withdrawal request |
| REFUND | Credit | Rejected withdrawal refund |
| SYSTEM_CREDIT | Credit | System-initiated credit |
| SYSTEM_DEBIT | Debit | System-initiated debit |
| REWARD_REDEMPTION | Debit | Reward store purchase |
| LEVEL_UP_BONUS | Credit | Level-up bonus |
| STREAK_BONUS | Credit | Streak milestone bonus |
| SPECIAL_EVENT | Credit | Event-based reward |

The `earnings_history` table provides a human-readable view with source names, logos, and provider info for UI display.

---

### 4.6 Notification System

**Notification Types** (stored in `notifications.notification_type`):

| Type | Trigger | Content |
|---|---|---|
| offer_completed | Offerwall completion | "You earned X coins from Provider" |
| survey_completed | Survey completion | "You earned X coins from Survey" |
| referral_reward | Referral payout | "You earned X coins from Username (L1 referral)" |
| daily_reward | Daily claim | "Daily reward: X coins" |
| bonus_reward | Bonus credit | "Bonus: X coins" |
| promo_reward | Code redemption | "Promo code X: Y coins" |
| achievement_reward | Achievement | "Achievement unlocked: X coins" |
| admin_credit | Admin action | "Admin credited X coins" |
| system_reward | System event | System-generated reward message |
| withdrawal_status | WD approve/reject | "Withdrawal approved/rejected" |
| level_up | Level increase | "You reached Level X!" |
| system | General system | Platform announcements |
| security_alert | Security event | "New login from unknown device" |

**Notification Settings** (per-user): Email and push notification toggles for offers, surveys, withdrawals, promotions. Sound and popup controls for in-app notifications.

**System Notifications:** Admin-broadcast notifications targeting all users, selected users, or single users with scheduling support.

**Auto-creation:** The referral trigger (`fn_distribute_referral_rewards`) automatically creates notifications for referrers when earnings are distributed.

---

### 4.7 Withdrawal System

**Withdrawal Methods** are managed via `withdrawal_methods`:
- Configurable min/max coin limits
- Percentage + fixed fee support
- API connection status
- Sort order for UI display

**Withdrawal Requests** (`withdrawals`) track:
- Coin amount and USD value at time of request
- Processing fee calculation
- Wallet address for crypto payouts
- 5 statuses: PENDING → APPROVED → PAID | REJECTED | CANCELLED
- Admin processing audit (who processed, when)

**Wallet Configurations:** Users can store multiple wallet addresses per payment method and set a default.

**Processing Flow:**
1. User submits withdrawal → status = PENDING
2. Admin reviews → Approve (APPROVED) or Reject (REJECTED)
3. On rejection: coins auto-refunded to user balance, notification sent
4. `fn_process_withdrawal()` handles the entire flow atomically

---

### 4.8 Referral System

**3-Level Referral Model:**

```
User A (referrer, Level 1)
  └─ User B (referred by A, Level 1 referral)
       └─ User C (referred by B, Level 2 referral)
            └─ User D (referred by C, Level 3 referral)
```

When User D earns coins:
- User C gets 10% (Level 1)
- User B gets 5% (Level 2)
- User A gets 2% (Level 3)

**Automatic distribution** via `fn_distribute_referral_rewards()` trigger on `profiles.total_earned_coins` updates.

**Referral Codes:** Auto-generated on profile creation (format: `username-hexcode`). Each code tracks clicks, signups, and total earnings.

---

### 4.9 Promo Code System

**Promo Codes** (`promo_codes`):
- Unique code string (e.g., "WELCOME100")
- Coin reward amount
- Usage limit (max uses, current uses counter)
- Level minimum requirement
- Country restrictions (JSONB array)
- Expiry date

**Redemption Guard:** `promo_code_redemptions` prevents double-redeem via UNIQUE constraint on (promo_code_id, user_id) enforced at application layer.

---

### 4.10 Rewards System

**Reward Store Items** (`rewards`):
- 10 default items: PayPal, Binance, USDT, Skrill, Payeer, Gift Cards, Crypto
- Configurable min coins and required form fields
- Icon and type classification

**Daily Rewards** (`daily_rewards`):
- Tracks claims by user and day number (1-30)
- Streak bonus calculation based on consecutive days
- Configurable via site_settings: base amount, increment, max bonus

**Achievement Rewards** (`achievement_rewards`):
- Unlockable achievements with criteria tracking
- One-time coin bonuses per achievement

---

### 4.11 Leaderboard System

The `leaderboard_statistics` table materializes user stats for performant leaderboard queries:

- **Period tracking:** `daily_rank`, `weekly_rank`, `monthly_rank`, `all_time_rank`
- **Period earnings:** `daily_earnings`, `weekly_earnings`, `monthly_earnings`
- **Auto-updated** via trigger on profile changes
- **Reset functions:** `fn_reset_daily_leaderboard()`, `fn_reset_weekly_leaderboard()`, `fn_reset_monthly_leaderboard()`
- **Supabase cron:** Can be scheduled via `pg_cron` or `supabase.scheduler` extension

---

### 4.12 Support System

**Tickets** (`support_tickets`):
- Categories: withdrawal, offer, account, payment, technical, other
- Priorities: LOW, NORMAL, HIGH, URGENT
- Statuses: OPEN → IN_PROGRESS → WAITING_ON_USER → RESOLVED → CLOSED
- Admin assignment via `assigned_to`

**Replies** (`ticket_replies`):
- Threaded replies between user and admin
- `is_admin_reply` flag for distinguishing user vs. admin responses
- RLS policies ensure users see only their own tickets

---

## 5. Indexes

The schema includes **50+ performance indexes** across all tables. Key indexes:

| Table | Index | Purpose |
|---|---|---|
| `profiles` | `idx_profiles_coins` | Leaderboard sorting by balance |
| `profiles` | `idx_profiles_xp` | Level-based sorting |
| `profiles` | `idx_profiles_referred_by` | Referral tree queries |
| `notifications` | `idx_notifications_unread` | Unread badge count |
| `coin_transactions` | `idx_coin_tx_user` | User transaction history |
| `coin_transactions` | `idx_coin_tx_source` | Source tracing queries |
| `withdrawals` | `idx_withdrawals_status` | Admin queue by status |
| `leaderboard_statistics` | `idx_leaderboard_weekly` | Weekly ranking queries |
| `admin_activity_logs` | `idx_admin_logs_created` | Admin audit chronology |

---

## 6. Triggers & Functions

### Automatic Triggers

| Trigger | Table | Event | Action |
|---|---|---|---|
| `tr_profiles_updated_at` | `profiles` | BEFORE UPDATE | Sets `updated_at = now()` |
| `tr_update_user_level` | `profiles` | BEFORE UPDATE OF xp | Recalculates `level` from XP |
| `tr_create_notification_settings` | `profiles` | AFTER INSERT | Creates default notification settings |
| `tr_create_referral_link` | `profiles` | AFTER INSERT | Generates referral code |
| `tr_update_leaderboard` | `profiles` | AFTER UPDATE OF earnings | Syncs leaderboard statistics |
| `tr_referral_rewards_payout` | `profiles` | AFTER UPDATE OF total_earned_coins | Distributes 3-level referral rewards |

### Stored Functions

| Function | Parameters | Description |
|---|---|---|
| `fn_process_withdrawal` | withdrawal_id, action, admin_id | Approve/reject withdrawal with auto-refund on rejection |
| `fn_admin_add_coins` | user_id, amount, admin_id, reason | Add coins with full audit trail and notification |
| `fn_reset_daily_leaderboard` | none | Reset daily rankings (scheduled) |
| `fn_reset_weekly_leaderboard` | none | Reset weekly rankings (scheduled) |
| `fn_reset_monthly_leaderboard` | none | Reset monthly rankings (scheduled) |
| `fn_is_admin` | none | RLS helper — checks current user admin status |

---

## 7. Row Level Security (RLS)

RLS is enabled on **all 38 tables**. The security model follows these principles:

### User-Level Access

| Data Type | Access Pattern |
|---|---|
| Own profile | Full read/write |
| Own notifications | Read, mark-read, delete |
| Own transactions | Read-only |
| Own withdrawals | Read, create |
| Own tickets | Full CRUD |
| Own wallets | Full CRUD |
| Own referral link | Read |
| Own login history | Read |

### Public Access

| Data Type | Access Pattern |
|---|---|
| Profiles | Read (for leaderboard) |
| Live earnings | Read (for feed ticker) |
| Offerwall providers | Read |
| Active offerwalls | Read |
| Surveys | Read (active only) |
| Rewards | Read |
| Leaderboard | Read |
| Promo codes | Read (active only) |
| Withdrawal methods | Read (active only) |
| Site settings | Read |

### Admin Access

| Data Type | Access Pattern |
|---|---|
| All profiles | Full access |
| All withdrawals | Full access |
| Admin accounts | Full access |
| Offerwall API configs | Full access (sensitive) |
| API integrations | Full access (sensitive) |
| Fraud logs | Full access |
| Security logs | Read |
| Admin activity logs | Read |
| User activity logs | Read |
| Admin accounts | Full access |
| System notifications | Full access |

### Auth Integration

All policies use `auth.uid()` from Supabase Auth for user identification. The `service_role` key bypasses all RLS for backend operations.

---

## 8. Realtime Subscriptions

The following tables are published to **Supabase Realtime** for instant UI updates:

| Table | Purpose |
|---|---|
| `live_earnings` | Real-time earnings ticker on dashboard |
| `profiles` | Balance/level updates without page refresh |
| `notifications` | Instant notification delivery |
| `leaderboard_statistics` | Live leaderboard rankings |
| `coin_transactions` | Transaction feed (admin dashboard) |
| `withdrawals` | Real-time withdrawal status updates |

---

## 9. Seed Data

The schema includes comprehensive seed data for development and staging environments:

### Admin Role (Single)
- `ADMIN` — Full unrestricted platform access

### User Levels (16 levels, Level 1–50 with gaps)
- Newbie (1) → Bronze (2-3) → Silver (4-5) → Gold (6-7) → Platinum (8-9) → Diamond (10) → Master (15) → Grandmaster (20) → Legend (25) → Mythic (30) → Godlike (40) → Transcendent (50)

### Site Settings (21 settings)
- Site name, coin rate (1000:1), withdrawal limits, referral percentages (10/5/2), streak config, SMTP, notification/sound toggles, fraud detection toggle, welcome bonus (disabled), demo/test account toggle

### Withdrawal Methods (6)
- PayPal, Binance Pay, USDT, Litecoin, Bitcoin, Ethereum

### Offerwall Providers (9)
- Torox, CPX Research, AdGate, Lootably, AdGem, BitLabs, Revenue Universe, TimeWall, GemiAds

### Rewards Store Items (10)
- PayPal, Binance, USDT, Skrill, Payeer, Amazon GC, Google Play GC, BTC, LTC, ETH

### Demo/Test User Accounts (15 users — guarded by `enable_demo_data`)
- **Guard:** Controlled by `enable_demo_data` site setting (default `'false'`)
- **Users:** 15 realistic profiles (sarah_j, james_w, oliver_b, fatima_r, mike_chen, aisha_p, chen_wei, charlotte_k, david_m, lucas_s, liam_t, isabella_g, sophie_l, mohammed_a, emma_w)
- **Countries:** US, UK, Canada, Australia, Germany, France, Bangladesh, India
- **Data:** Full transaction histories (offerwalls, surveys, referrals, level-ups, withdrawals, daily rewards)
- **Referrals:** 7 referral relationships with earnings records
- **Withdrawals:** 12 withdrawal records (PAID, PENDING, APPROVED)
- **Removal:** `DELETE FROM profiles WHERE email LIKE 'demo.%@coinloot.test'`

---

## 10. Migration Guide

### First Deployment

1. **Enable UUID extension** (included in schema)
2. **Run the SQL file** in Supabase SQL Editor (copy entire file)
3. **Enable Realtime** for the 6 published tables in Supabase Dashboard → Database → Replication
4. **Set up Auth** in Supabase Dashboard → Authentication → Providers (enable email/password)
5. **Create the default admin user** via Supabase Auth, then set `is_admin = true` in `profiles`
6. **Link admin account**: Insert into `admin_accounts` with role=`'ADMIN'`
7. **Configure SMTP** in site_settings or Supabase Auth settings
8. **Test RLS**: Verify that anonymous users see only public data and authenticated users see own data

### Schema Updates

- All tables use `create table if not exists` for idempotent migrations
- Indexes use `create index if not exists`
- Triggers use `create or replace trigger`
- For destructive changes, create a new migration file with `alter table` statements

### Common Migration Patterns

```sql
-- Add a new column
alter table public.profiles add column if not exists new_field text;

-- Add a new index
create index if not exists idx_new on public.table_name(column_name);

-- Add a new trigger
create or replace function public.fn_new_trigger() returns trigger as $$ ... $$;

-- Modify an existing function
create or replace function public.fn_existing(...) returns ... as $$ ... $$;
```

---

## 11. Admin Features Reference

The database schema fully supports all admin panel features:

### User Management
- **View all users**: `SELECT * FROM profiles` (admin RLS)
- **Search users**: `WHERE username ILIKE '%term%' OR email ILIKE '%term%'`
- **Add coins**: `fn_admin_add_coins(user_id, amount, admin_id, reason)`
- **Deduct coins**: `INSERT INTO coin_transactions ... ADMIN_DEBIT`
- **Change level**: `UPDATE profiles SET xp = (new_level - 1) * 1000 WHERE id = user_id`
- **Ban/Suspend**: `UPDATE profiles SET is_banned = true, ban_reason = 'reason'`
- **Cycle KYC**: `UPDATE profiles SET kyc_status = next_status`

### Offerwall Management
- **Add offerwall**: Insert into `offerwalls` with provider reference
- **Connect API**: Insert/update `offerwall_api_configs`
- **Lock/Unlock**: Update `offerwalls.status` + manage `locked_offerwalls`
- **Edit unlock conditions**: Update `locked_offerwalls.unlock_condition_value`

### Withdrawal Management
- **View pending**: `SELECT * FROM withdrawals WHERE status = 'PENDING'`
- **Approve**: `fn_process_withdrawal(id, 'APPROVED', admin_id)`
- **Reject**: `fn_process_withdrawal(id, 'REJECTED', admin_id)`
- **Add method**: Insert into `withdrawal_methods`

### Role Management
- The platform has a single `ADMIN` role with full unrestricted access
- No multi-role hierarchy or permission groups

### Notification Management
- **Send to all**: Insert into `system_notifications` with target_type = 'all'
- **Send to selected**: Insert into `system_notifications` with target_users array
- **View sent**: `SELECT * FROM system_notifications ORDER BY created_at DESC`

### Promo Code Management
- **Create**: Insert into `promo_codes`
- **Disable**: `UPDATE promo_codes SET is_active = false`
- **Track usage**: `SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = id`

### Leaderboard Management
- **Reset weekly**: `SELECT fn_reset_weekly_leaderboard()`
- **Top earners**: `SELECT * FROM leaderboard_statistics ORDER BY total_earned_coins DESC`

### Fraud Detection
- **VPN users**: `SELECT * FROM fraud_detection_logs WHERE detection_type = 'VPN' AND resolved = false`
- **Flag user**: Insert into `fraud_detection_logs` + update profile status

### Activity Logs
- **Admin actions**: `SELECT * FROM admin_activity_logs ORDER BY created_at DESC`
- **User actions**: `SELECT * FROM user_activity_logs WHERE user_id = '...'`

---

## 12. User Features Reference

The database schema supports these user-facing features:

### Authentication & Profile
- Register: Supabase Auth → auto-creates profile via trigger
- Login: Auth → creates `login_history` record with IP/device
- View profile: `SELECT * FROM profiles WHERE id = auth.uid()`
- Update preferences: `UPDATE profiles SET preference_theme = 'light'`

### Earning
- Complete offers: Insert `coin_transactions` + update profile balance
- View balance: Real-time via Supabase subscription
- View history: `SELECT * FROM earnings_history WHERE user_id = auth.uid()`
- Live feed: Subscribe to `live_earnings` Realtime channel

### Notifications
- View notifications: `SELECT * FROM notifications WHERE user_id = auth.uid()`
- Mark read: `UPDATE notifications SET is_read = true`
- Badge count: `SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid() AND is_read = false`
- Real-time: Subscribe to `notifications` Realtime channel

### Withdrawals
- Submit request: Insert into `withdrawals`
- View status: `SELECT * FROM withdrawals WHERE user_id = auth.uid()`
- Store wallets: Insert into `wallet_configurations`

### Referrals
- Get code: `SELECT referral_code FROM referral_links WHERE user_id = auth.uid()`
- View earnings: `SELECT * FROM referral_earnings WHERE referrer_id = auth.uid()`
- Leaderboard: `SELECT * FROM leaderboard_statistics ORDER BY referrals_count DESC`

### Promo Codes
- Redeem: Insert into `promo_code_redemptions` (validated at app layer)
- Check balance: `SELECT balance_coins FROM profiles WHERE id = auth.uid()`

### Daily Rewards
- Claim: Insert into `daily_rewards` + update profile balance
- Streak tracking: `SELECT MAX(day_number), streak_days FROM profiles WHERE id = auth.uid()`

### Support
- Create ticket: Insert into `support_tickets`
- Reply: Insert into `ticket_replies`
- Track: `SELECT * FROM support_tickets WHERE user_id = auth.uid()`

---

## Appendix: Quick SQL Queries

### Admin Dashboard Stats

```sql
-- Pending withdrawals
select count(*) from public.withdrawals where status = 'PENDING';

-- New users today
select count(*) from public.profiles
where created_at >= date_trunc('day', timezone('utc'::text, now()));

-- Top earners (all time)
select username, total_earned_coins from public.leaderboard_statistics
order by total_earned_coins desc limit 10;

-- Active offerwalls
select count(*) from public.offerwalls where status = 'ACTIVE';

-- Daily earnings (last 7 days)
select date_trunc('day', created_at) as day, sum(coins_earned) as total
from public.earnings_history
where created_at >= timezone('utc'::text, now()) - interval '7 days'
group by 1 order by 1;
```

### User Data Export

```sql
select
  p.id, p.username, p.email, p.country, p.level, p.balance_coins,
  p.total_earned_coins, p.total_withdrawn_usd,
  p.kyc_status, p.created_at, p.last_login_at,
  lr.referral_code, lr.total_signups as referral_signups
from public.profiles p
left join public.referral_links lr on lr.user_id = p.id;
```

---

> **Document Version:** 1.0.0
> **Last Updated:** June 2026
> **Project:** Coin Loot — advxrogjhjkrwgzlxqwn
