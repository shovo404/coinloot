# Project Changelog

## 2026-06-30 — MetReward-Style Offer System Redesign

### Added
- **`src/utils/offerData.ts`** — Dynamic offer data source architecture with:
  - Demo featured/hot offers with real game-like thumbnails, milestone steps, rewards
  - `OfferSource` interface for future API provider registration
  - Placeholder functions for future API integration (TOROX, AdGem, AdGate, Lootably, etc.)
  - When API sources are configured, offers automatically replace demo data
- **`src/components/OfferCard.tsx`** — MetReward-style compact card component:
  - Fixed 190-210px width horizontal scroll card
  - Large 4:3 aspect ratio game thumbnail at top
  - Provider badge on image, reward badge overlay
  - "UP TO X" badge for multi-step rewards
  - Title (2-line clamp), description (1-line clamp)
  - "View Offer" button on hover with scale effect
  - Dark premium theme with hover glow
- **New offer data structure**: Each offer supports `title`, `description`, `imageUrl`, `reward`, `provider`, `offer_url`, plus `steps[]` with milestone rewards

### Modified
- **`src/components/EarnPage.tsx`**:
  - Featured/Hot offer sections redesigned: grid layout → `HorizontalScroll` with `OfferCard`
  - Removed old inline offer detail modal (simple single-reward view)
  - Removed unused `handleLaunchOffer`/`completeOfferSimulator` usage for Hot offers (now unified through `viewingOfferDetails` → `OfferDetailsModal`)
  - Added offer count badges to section headers
- **`src/components/OfferDetailsModal.tsx`** — Complete MetReward-style redesign:
  - Full-width 16:9 cover image at top with gradient overlay
  - Provider badge + platform badge (Mobile/Cross-Platform) overlaid on image
  - Reward badge with total reward on image
  - "How to Earn" section with numbered milestone steps (e.g. "1. Complete Level 10 → +100 Coins")
  - Each step has "Claim" button (when offer is started)
  - Completed steps shown with green checkmark + strikethrough
  - Total Reward card with amber gradient, progress bar
  - "Start Offer" CTA button → opens tracking link, enables step claiming
  - "All Rewards Claimed" state when all steps completed
  - No tabs, no activity feed, no QR code, no support form in main flow
  - Clean single-column layout matching MetReward style
- **`PROJECT_CHANGELOG.md`** — This entry

### Not Changed
- Wallet, Rewards, Notifications, Withdrawals, Referrals, User Accounts kept intact
- Existing offerwall provider system, admin offers, API offer fetching preserved
- `Offer` type in `types/index.ts` unchanged (already had `steps?`, `max_reward?`, `tracking_link?`)

## 2026-06-30 — Forgot Password Feature

### Added
- **"Forgot Password?" link** on the Sign In form below the password field
- **3-step forgot password flow** inside AuthModal:
  1. **Email step** — user enters registered email, admin fallback notice shown
  2. **OTP step** — 6-digit code verification with 10-minute expiry, resend with 30s cooldown
  3. **New Password step** — set new password with confirmation, auto-login on success
- **OTP-based reset system** — stores OTP in localStorage with expiry, marks used after verification
- **Rate limiting** — max 3 OTP requests per email per hour, tracked in localStorage
- **Admin fallback messaging** — notice in forgot password UI directing users to contact support or use admin panel
- **Activity logging** — password reset via forgot flow logged to `coinloot_admin_logs` as `PASSWORD_CHANGED`

### Modified
- `src/components/AuthModal.tsx` — Added forgot password state variables, handlers, and 3 UI views; updated header subtitle; added Forgot Password link

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
