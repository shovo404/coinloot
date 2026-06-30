# Staging Test Plan — Global Realtime Synchronization

## Prerequisites

- Run the [Supabase migration](supabase_migration_realtime.sql) in your Supabase SQL Editor first
- Have **2 browser windows** open: Admin panel (AdminAccount) + User panel (TestUser)
- Have the **browser DevTools console** open on both windows
- Run `localStorage.clear()` on both windows before starting

---

## Test 1: Campaign Creation Cascade

**Goal:** Admin creates a social bounty campaign → user sees it instantly.

| Step | Action | Expected Result | Check |
|------|--------|----------------|-------|
| 1.1 | In user console, run: `window.addEventListener("campaigns-changed", () => console.log("[✓] campaigns-changed event fired"))` | Listener registered | |
| 1.2 | Admin: Create Campaign → fill form → Save | Campaign saved to `social_campaigns` table | |
| 1.3 | Check user console | `[✓] campaigns-changed event fired` appears (from local admin → same tab) | |
| 1.4 | Check Supabase logs | `INSERT on social_campaigns` succeeded | |
| 1.5 | In user console, run: `console.log("campaigns from state:", document.querySelector("[data-campaigns]") || "N/A")` | Or inspect page — Social Bounty Campaigns section shows new campaign | |
| 1.6 | Switch to **other browser** / incognito user | Campaign appears there too (Realtime cross-device) | |

### Fallback Check
| Step | Action | Expected Result |
|------|--------|----------------|
| 1.7 | Wait up to 15s (poll interval) | Campaign appears even if Realtime fails |

---

## Test 2: Homepage Sections Toggle

| Step | Action | Expected Result |
|------|--------|----------------|
| 2.1 | Admin: Toggle "Featured Offers" OFF → Save | `site_settings` table updated |
| 2.2 | User window | Featured Offers section disappears instantly |
| 2.3 | Admin: Toggle back ON → Save | Featured Offers section reappears instantly |

**Console verify:** `window.addEventListener("homepage-sections-changed", ...)`

---

## Test 3: Announcement Propagation

| Step | Action | Expected Result |
|------|--------|----------------|
| 3.1 | Admin: Create announcement → Save | `announcements` table updated |
| 3.2 | User window | Announcement box appears on Earn page |
| 3.3 | Admin: Toggle announcement OFF | Announcement disappears from user view |

---

## Test 4: Promo Codes

| Step | Action | Expected Result |
|------|--------|----------------|
| 4.1 | Admin: Create promo code (active, future expiry) | `promo_codes` table written |
| 4.2 | User window | Promo code appears on Earn page within 15s |
| 4.3 | Admin: Toggle promo code OFF | Promo disappears from user view |

---

## Test 5: Locked Offerwall Config

| Step | Action | Expected Result |
|------|--------|----------------|
| 5.1 | User: Open Earn page, note offerwall providers | All shown normally |
| 5.2 | Admin: Go to Lock System → Locked Offerwalls → Toggle TOROX ON | `lock-config-changed` event fires |
| 5.3 | User window | TOROX appears as locked (or in Locked Offerwalls section) |
| 5.4 | Admin: Toggle TOROX OFF | TOROX unlocks instantly on user side |

**Console verify:** `window.addEventListener("lock-config-changed", ...)`

---

## Test 6: User Restriction

| Step | Action | Expected Result |
|------|--------|----------------|
| 6.1 | Admin: VPN & Proxy → Control Center → find user → Restrict | `restriction-changed` event fires |
| 6.2 | User window | RestrictionPage shows restriction. Earn/Offerwall shows restricted state. |
| 6.3 | Admin: Unrestrict user | User immediately unrestricted |

---

## Test 7: KYC Required Toggle

| Step | Action | Expected Result |
|------|--------|----------------|
| 7.1 | Admin: User Management → find user → click KYC toggle | `profiles` table `kyc_required` updated |
| 7.2 | User window | KYC block appears on Earn/Withdraw pages |
| 7.3 | Admin: Toggle KYC off | Block disappears |

---

## Test 8: Global Notification (Promo Banner)

| Step | Action | Expected Result |
|------|--------|----------------|
| 8.1 | Admin: Settings → Global Notifications → Enter text + promo → "Save & Publish" | `site_settings` updated |
| 8.2 | User window | Notification card + promo card appear on Earn page |
| 8.3 | User: Click "Claim" | Coins added, sound plays |

---

## Test 9: VPN Settings Update

| Step | Action | Expected Result |
|------|--------|----------------|
| 9.1 | Admin: VPN & Proxy → Control Center → Toggle "VPN Warning" OFF | `site_settings` updated |
| 9.2 | User window | VPN warning no longer appears in affected flows |

---

## Test 10: Offerwall Status Change

| Step | Action | Expected Result |
|------|--------|----------------|
| 10.1 | Admin: Offerwalls → Toggle a provider to INACTIVE | `offerwalls` table updated |
| 10.2 | User window | That offerwall disappears or shows as locked |
| 10.3 | Admin: Toggle back to ACTIVE | Offerwall reappears |

---

## Test 11: Locked Offers (Individual)

| Step | Action | Expected Result |
|------|--------|----------------|
| 11.1 | Admin: Lock System → Locked Offers → Lock an active offer | Offer status changes to "locked" |
| 11.2 | User window | Offer appears in Locked Offers section on Earn page |
| 11.3 | Admin: Unlock the offer | Offer moves back to active |
| 11.4 | User window | Locked Offers section updates |

---

## Test 12: Withdrawal Status Change

| Step | Action | Expected Result |
|------|--------|----------------|
| 12.1 | Admin: Withdrawals → Approve/Reject a withdrawal | `withdrawal-status-changed` event fires |
| 12.2 | User window | Withdrawal status updates in WithdrawHub |

---

## Real-time Channel Health

Run this in the **user console** to verify active subscriptions:

```javascript
// Check Supabase Realtime channels
const sb = (await import("./src/lib/supabase")).getSupabaseClient();
console.log("Channels:", sb.getChannels().map(c => c.topic));

// Expected output (approximately):
// "app-state-realtime"        (site_settings updates)
// "campaigns-realtime"        (social_campaigns updates)  
// "system-notifications-realtime" (system_notifications updates)
// "announcements-realtime"    (announcements updates)
// "app-notifs-{user_id}"      (user notifications)
// "app-profile-{user_id}"     (profile updates)
// "app-withdrawals"           (withdrawal updates)
```

---

## Regression Check

After all tests pass, verify these still work:

- [ ] **Coin balance updates** in realtime (admin gifts coins → user sees)
- [ ] **Level progress** updates when coins change
- [ ] **Offers** render correctly with all filters (locked, active, featured, hot)
- [ ] **Unlock codes** work for locked offerwalls
- [ ] **SurveyHub** still loads and functions
- [ ] **Admin panel** navigation works for all sections
- [ ] **Mobile responsive** — test on mobile viewport
