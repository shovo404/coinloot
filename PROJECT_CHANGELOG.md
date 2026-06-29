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
