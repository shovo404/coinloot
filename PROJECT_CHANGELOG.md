# Project Changelog

## 2026-06-29 — Critical Reward Flow Fix

### Root Cause
`handleRewardEarned` in `App.tsx` had 4 bugs:

1. **`total_earned_coins` never persisted to DB** — `dbUpd` only included `balance_coins`, `level`, `xp`. On page refresh, profile re-fetch reverted `total_earned_coins` to old value.

2. **No transaction/earnings audit trail** — Unlike `addCoins()` which writes to `coin_transactions`, `earnings_history`, and `live_earnings`, the normal reward flow only updated the `profiles` table with `updateProfile()`.

3. **Notification fired BEFORE DB write** — `addNotification()` called at line 693, DB `updateProfile()` at line 703. User saw "You earned X coins" even if the DB update failed.

4. **Silent error swallowing** — `.catch(() => {})` on the `updateProfile()` promise hid all database failures.

### Files Modified
- **`src/App.tsx`** — Rewrote `handleRewardEarned` to:
  - Call `addCoins()` which atomically updates profile + creates `coin_transactions` + `earnings_history` + `live_earnings` records
  - Only update local React state AFTER successful DB write
  - Only show notification + play sound AFTER successful DB write
  - Log errors to console instead of swallowing them
  - Handle XP persistence separately (addCoins doesn't cover XP)
  - Level calculated from `total_earned_coins` (lifetime earnings) instead of `balance_coins`

- **`src/components/AdminPanel.tsx`** — Fixed double-credit bug:
  - `handleAddCoins` was calling `addCoins()` directly AND then `onRewardEarned()` which called `addCoins()` again via `handleRewardEarned`
  - Removed `onRewardEarned` call; `addCoins()` already does the complete DB write
  - Same fix for "Bonus to all users" path

- **`src/components/RewardsStore.tsx`** — Fixed double-credit bug:
  - Promo code flow called `validatePromoCode()` (which calls `addCoins()` internally) AND then `onRewardEarned()` which called `addCoins()` again
  - Replaced `onRewardEarned` with direct local state update + sound

### Database Tables Involved
- `profiles` — `balance_coins`, `total_earned_coins`, `balance_usd`, `level`, `xp`
- `coin_transactions` — now properly created for all reward sources
- `earnings_history` — now properly created for all reward sources
- `live_earnings` — now properly created for all reward sources

### Level Calculation
- **Before**: `calcLevel(balance_coins)` — level based on current wallet balance (would decrease on withdrawal)
- **After**: `calcLevel(total_earned_coins)` — level based on lifetime earnings (never decreases)
- This is consistent with how `addCoins()` already calculated level internally

## 2026-06-29 — Notification System Cleanup & Admin Routing + Mobile Responsiveness

### Notification Fixes
- **Unwanted notifications removed** — Added one-time cleanup in `App.tsx` that filters out stale broadcast notifications ("📢 Announcement" / "🎉 Promo Event" with short descriptions) from localStorage on boot. This prevents old test broadcasts like "Hi" from persisting.

- **Admin notification routing** — All user actions now generate admin notifications via `createAdminNotification()`:

| User Action | Admin Notification | File |
|---|---|---|
| KYC submitted | 🪪 KYC Submitted | `kycEngine.ts` |
| Support ticket created | 🎫 New Support Ticket | `SupportTicket.tsx` |
| Social bounty submitted | 🎯 Campaign Submitted | `supabaseService.ts` |
| Offer completed | 🏆 Offer Completed (>100 coins) | `App.tsx` |
| User registered | 🆕 New User Registration | `AuthModal.tsx` |
| Promo code redeemed | 🎁 Promo Code Redeemed | `supabaseService.ts` |
| Withdrawal requested | 💰 New Withdrawal Request | `WithdrawHub.tsx` *(already wired)* |

- **Notification routing separation** — User notifications go through `addNotification()`/`addUserNotification()` (localStorage + Supabase `notifications` table). Admin notifications go through `createAdminNotification()` (localStorage + API POST). No cross-contamination.

### Mobile Responsiveness
- Added comprehensive mobile CSS in `index.css` targeting:
  - All viewport widths (320px, 375px, 390px, 414px, tablets, desktop)
  - Page wrapper padding responsive
  - Table horizontal scroll
  - Modal bottom-sheet behavior on mobile
  - Touch target minimum sizes (44px)
  - Text overflow prevention (`overflow-wrap: break-word`)
  - Grid column reduction on tablet
  - Card padding reduction on tiny screens
  - Notification panel full-width on mobile

### Files Modified
- `src/App.tsx` — Stale broadcast notification cleanup; admin notification for offer completions
- `src/utils/kycEngine.ts` — Admin notification on KYC submission
- `src/components/SupportTicket.tsx` — Admin notification on ticket creation
- `src/lib/supabaseService.ts` — Admin notification on campaign submission and promo code redemption
- `src/components/AuthModal.tsx` — Admin notification on new user registration
- `src/index.css` — Comprehensive mobile responsive CSS
