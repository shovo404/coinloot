-- ====================================================================
-- SUPABASE REALTIME PUBLICATION — ENABLE ALL REQUIRED TABLES
-- ====================================================================
-- Run this in the Supabase SQL Editor to ensure every table used by
-- the app's realtime subscriptions is published to the Realtime bus.
--
-- Idempotent: safe to run multiple times.
--
-- Current tables in supabase_realtime (from schema):
--   live_earnings, profiles, notifications, leaderboard_statistics,
--   coin_transactions, withdrawals, offerwalls, offerwall_providers,
--   earnings_history, promo_codes, admin_activity_logs, admin_accounts,
--   referral_earnings, referral_links, withdrawal_methods, site_settings,
--   support_tickets, announcements
--
-- Tables being added by this migration:
--   system_notifications  ← used by useAppRealtimeState subscription
--   social_campaigns      ← used by admin campaign management
--   campaign_tasks        ← used by admin campaign management
--   campaign_submissions  ← used by admin + user campaign submissions
--   campaign_submission_screenshots ← used by admin review
--   kyc_records           ← used by admin KYC management (status changes)
--   locked_offerwalls     ← used by admin locked offerwall management
--   surveys               ← used by admin survey management
--   fraud_detection_logs  ← used by admin VPN/security management
-- ====================================================================

-- ════════════════════════════════════════════════════════════════════
-- STEP 1: Add missing tables to the supabase_realtime publication
-- ════════════════════════════════════════════════════════════════════

do $$
declare
  tbl text;
  tables_to_add text[] := array[
    -- Notification system (subscribed in useAppRealtimeState)
    'system_notifications',
    -- Social bounty campaigns (admin management + user submissions)
    'social_campaigns',
    'campaign_tasks',
    'campaign_submissions',
    'campaign_submission_screenshots',
    -- KYC records (admin approves/rejects via kycEngine, profiles trigger fires)
    'kyc_records',
    -- Offerwall locking (admin management)
    'locked_offerwalls',
    -- Surveys (admin management)
    'surveys',
    -- Fraud detection (admin VPN/security panel)
    'fraud_detection_logs'
  ];
begin
  foreach tbl in array tables_to_add loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', tbl);
      raise notice 'Added table: %', tbl;
    exception
      when duplicate_object then
        raise notice 'Table already in publication (skipped): %', tbl;
      when undefined_table then
        raise notice 'Table does not exist (skipped): %', tbl;
    end;
  end loop;
end;
$$;

-- ════════════════════════════════════════════════════════════════════
-- STEP 2: Verify the current publication membership
-- ════════════════════════════════════════════════════════════════════
-- Run this separately to confirm:
--   SELECT * FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime'
--   ORDER BY schemaname, tablename;

-- ════════════════════════════════════════════════════════════════════
-- STEP 3: Confirm RLS policies allow Realtime reads
-- ════════════════════════════════════════════════════════════════════
-- All the tables listed above already have RLS policies defined in
-- supabase_schema.sql that allow Realtime to broadcast changes to
-- authorized clients. No additional policy changes are needed.
--
-- Key policies:
--   system_notifications  → Admins manage (Realtime reads with service_role)
--   social_campaigns      → Anyone can view active (is_active = true)
--   campaign_tasks        → Anyone can view (is_active = true)
--   campaign_submissions  → Users view own / Admins view all
--   kyc_records           → Users view own / Admins view all
--   locked_offerwalls     → Anyone can view conditions
--   surveys               → Anyone can view active
--   fraud_detection_logs  → Admins manage
-- ====================================================================
