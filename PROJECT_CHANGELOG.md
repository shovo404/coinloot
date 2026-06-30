# Production Readiness Audit — Fixes

## 2026-06-30 — Complete Production Readiness Audit & Fixes

### Root Causes Found

1. **Hardcoded admin credentials in client-side code** — `AdminLogin.tsx` checked `admin@gmail.com`/`admin123` against localStorage instead of Supabase Auth
2. **Self-promote to admin toggle** — `ProfileSettingsSupport.tsx` had a UI button that let any user toggle their `is_admin` flag
3. **Plaintext password storage** — `coinloot_accounts` localStorage stored all user passwords in plaintext; login fell back to localStorage when Supabase was unavailable
4. **LocalStorage-only restriction system** — VPN restrictions, bans, and user restrictions only persisted to localStorage; switching devices or clearing cache removed all enforcement
5. **LocalStorage-only admin notifications** — Admin notifications were lost on page refresh or cache clear
6. **LocalStorage-only locked offerwall configs** — Lock configs, promo codes, and user unlocks were device-local only
7. **Client-side OTP password recovery** — Password recovery used a client-generated OTP stored in localStorage instead of Supabase Auth's built-in password reset

### Security Issues Fixed

| Issue | Severity | File | Fix |
|---|---|---|---|
| Hardcoded admin creds (`admin@gmail.com`/`admin123`) | 🔴 CRITICAL | `AdminLogin.tsx` | Rewrote to use Supabase Auth `signInWithPassword()` + `verifyAdminAccess()` |
| Self-promote to admin toggle | 🔴 CRITICAL | `ProfileSettingsSupport.tsx` | Removed the `setUser({...is_admin: !user.is_admin})` button |
| Plaintext passwords in localStorage | 🟠 HIGH | `AuthModal.tsx` | Removed `saveToAccounts()`, removed localStorage fallback sign-in |

### Production-Only Issues Fixed

| Issue | Impact | Files Modified | Fix |
|---|---|---|---|
| VPN restrictions localStorage-only | Cross-device enforcement broken | `vpnDetector.ts` | Added `supabaseSyncRestriction()` helper; sync/async dual exports; `getRestrictedUsersAsync()` reads from Supabase profiles table |
| Admin notifications lost on refresh | Admin loses notification history | `adminNotifier.ts` | Added `persistToSupabase()` / `loadAdminNotificationsFromSupabase()` using `site_settings` table |
| Locked offerwall configs device-local | Configs lost on cache clear | `lockedOfferwallDB.ts` | Added `persistLockSystemToSupabase()` writing to `site_settings` |
| Password recovery data localStorage-only | Recovery requests lost on admin cache clear | `passwordRecovery.ts` | Added `persistRecoveryToSupabase()` writing to `site_settings` |
| Dead OTP/newPassword flow in AuthModal | Dead code, confusing | `AuthModal.tsx` | Removed OTP step, new password step, and `handleVerifyOtp`/`handleResendOtp`/`handleForgotNewPassword`. Now uses `sb.auth.resetPasswordForEmail()` exclusively |

### Architecture Decisions

**Dual sync/async pattern for VPN restrictions:**
- Sync versions (`isUserRestricted()`, `restrictUser()`, etc.) — localStorage only, backward compatible for inline component use
- Async versions (`isUserRestrictedAsync()`, `getRestrictedUsersAsync()`) — read from Supabase first, fall back to localStorage
- All mutation functions call `supabaseSyncRestriction()` as fire-and-forget to sync to Supabase profiles table

**Supabase `site_settings` as generic JSON store:**
- Admin notifications stored under key `admin_notifications`
- Locked offerwall system stored under key `locked_offerwall_system`
- Password recovery requests stored under key `password_recovery_requests`

**Auth flow simplification:**
- Sign-in: Supabase Auth only (`signInWithPassword`), no localStorage fallback
- Sign-up: Supabase Auth + profile insert, no `saveToAccounts()`
- Forgot password: `supabase.auth.resetPasswordForEmail()` sends a proper reset email via Supabase

### Files Modified

| File | Change |
|---|---|
| `src/components/AdminLogin.tsx` | Full rewrite — Supabase Auth login, removed hardcoded creds, removed localStorage fallback |
| `src/components/ProfileSettingsSupport.tsx` | Removed self-admin-toggle button |
| `src/components/AuthModal.tsx` | Removed localStorage fallback sign-in, removed `saveToAccounts`, removed dead OTP/newPassword code, uses `resetPasswordForEmail()` |
| `src/utils/vpnDetector.ts` | Added `getSupabaseClient` import, `supabaseSyncRestriction()`, `isUserRestrictedAsync()`, `getRestrictedUsersAsync()` |
| `src/utils/adminNotifier.ts` | Added `getSupabaseClient` import, `persistToSupabase()`, `loadAdminNotificationsFromSupabase()` |
| `src/utils/lockedOfferwallDB.ts` | Added `getSupabaseClient` import, `persistLockSystemToSupabase()` |
| `src/utils/passwordRecovery.ts` | Added `persistRecoveryToSupabase()` |

### Testing Results

- TypeScript compilation: **No new errors introduced**. All pre-existing errors (AdminPanel.tsx, SurveyHub.tsx, RewardPopup.tsx, seed-admin.ts) unchanged.
- All modified files compile cleanly.
- The sync functions remain backward compatible — existing callers in 6+ components continue to work without modification.
