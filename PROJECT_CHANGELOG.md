# Changelog

All notable changes to this project are documented here.

## 2026-06-30 — Fix User Deletion and Re-Registration Issue

### Added
- **`src/lib/supabaseService.ts`**:
  - `softDeleteUser(userId)` — Sets `deleted_at`, `status: "deleted"`, `is_banned: true` on profile (email stays reserved)
  - `restoreUser(userId)` — Clears `deleted_at`, resets `status: "active"`, `is_banned: false`
  - `permanentDeleteUser(userId, email?)` — Deletes from 20+ related tables + Supabase Auth (email becomes available for re-registration)
  - `getActiveProfileByEmail(email)` — Queries profiles with `deleted_at IS NULL` for registration validation
  - `getAdminClient()` — Shared helper to create service-role Supabase client

### Modified
- **`src/lib/supabaseService.ts`**:
  - `signUp()` — Now detects orphaned auth users (deleted profile but auth user still exists) and deletes + re-registers them automatically
  - `deleteAuthUser()` — Refactored to use shared `getAdminClient()` helper
  - Added missing table cleanup in `permanentDeleteUser`: `campaign_submission_screenshots`, `ticket_replies`, `email_verifications`, `wallet_configurations`, `password_recovery_requests`
- **`src/components/AdminPanel.tsx`**:
  - Replaced single `handleDeleteUser` with three handlers:
    - `handleSoftDeleteUser` — Soft deletes + localStorage cleanup
    - `handleRestoreUser` — Restores soft-deleted user
    - `handlePermanentDeleteUser` — Permanently deletes from all tables + Auth
  - Added `cleanupLocalStorage(targetId)` — Shared helper to clean all localStorage entries for a deleted user
  - Updated delete modal: now shows three options — **Soft Delete** (with Archive icon), **Permanent Delete** (with Trash2 icon), and **Cancel**
  - Added `Archive` to lucide-react imports
  - Imported `softDeleteUser`, `permanentDeleteUser`, `restoreUser` from supabaseService
- **`supabase_schema.sql`** — Added `deleted_at timestamp with time zone` column to profiles table

### How it works
| Action | Effect on Supabase | Effect on Auth | Email available? |
|---|---|---|---|
| **Soft Delete** | Sets `deleted_at`, `status`, `is_banned` | No change | ❌ Reserved |
| **Permanent Delete** | Removes from all tables | Deleted from Auth | ✅ Yes |
| **Restore** | Clears `deleted_at` | No change | N/A |

### Registration flow
1. User tries to sign up with an email
2. If auth says "already registered", system checks for a non-deleted profile
3. If no active profile found, the orphaned auth user is deleted and sign-up retried automatically
4. If active profile found, registration is blocked as expected

### Files modified
- `src/lib/supabaseService.ts` — Core deletion/restore/validation functions
- `src/components/AdminPanel.tsx` — Admin UI for soft/permanent delete + restore
- `supabase_schema.sql` — Schema update with `deleted_at` column

## 2026-06-30 — Removed Global Lock System → Per-Offerwall Lock Toggle

### Removed
- **Global Lock System toggle** — Completely removed from all components
- **`getOfferwallLockSystemEnabled()` / `setOfferwallLockSystemEnabled()`** — Removed from `lockedOfferwallDB.ts`
- **`GLOBAL_LOCK_KEY`** constant removed

### Added
- **`lockedOfferwallDB.ts`**: `getOfferwallLockStatusMap()`, `setOfferwallLockEnabled(providerName, enabled)`, `isOfferwallLockEnabled(providerName)` — each offerwall stores its own independent lock enable/disable state
- **AdminLockedOfferwalls.tsx**: Individual ON/OFF toggle switch per provider row (green emerald = enabled, slate = disabled)
- **`toggleLock(providerName)`** function in admin panel for per-offerwall toggle

### Modified
- **`AdminLockedOfferwalls.tsx`**: Removed the entire "Global Lock System Toggle" UI section (gradient card, status badges, switch). Added per-offerwall toggle switch in each provider row. Keep Edit/Delete buttons.
- **`LockedOfferwallCard.tsx`**: Checks `isOfferwallLockEnabled(config.providerName)` instead of global lock
- **`OfferwallHub.tsx`**: Checks `isOfferwallLockEnabled(ao.provider)` instead of global lock
- **`EarnPage.tsx`**: All 3 lock-check paths (`lockedConfigs`, `adminLockStatusMap`, `lockedProviderMap`) now use `isOfferwallLockEnabled(providerName)` instead of `getOfferwallLockSystemEnabled()`

### Behavior
| Toggle State | Effect |
|---|---|
| **ON** (default) | Lock active — users must meet configured requirements |
| **OFF** | Lock bypassed — users access immediately, config preserved |

Each offerwall operates independently: TOROX=ON, AdGem=OFF, Lootably=ON, BitLabs=OFF — all independent.

### Files modified
- `src/utils/lockedOfferwallDB.ts` — Replaced global lock with per-offerwall lock status functions
- `src/components/AdminLockedOfferwalls.tsx` — Removed global toggle, added per-offerwall toggles
- `src/components/LockedOfferwallCard.tsx` — Per-offerwall lock check
- `src/components/OfferwallHub.tsx` — Per-offerwall lock check
- `src/components/EarnPage.tsx` — Per-offerwall lock checks (3 locations)

## 2026-06-30 — VPN & Proxy Page Fix: Blank Page → Full Management Suite

### Root Cause
Sidebar parent ID `"vpn"` had no corresponding handler in `renderSection` inside `AdminPanel.tsx`. Clicking "VPN & Proxy" in the sidebar would navigate to `section="vpn"`, which produced no JSX output — resulting in a completely blank page below the admin layout header. Only the child sections (`vpn-api`, `vpn-control`) had handlers (inside the SECURITY block), but the parent itself rendered nothing.

### Added
- **`src/components/VpnPage.tsx`** — New comprehensive VPN & Proxy management page with three tabs:
  - **Detection Logs tab**: Statistics dashboard (Total Checks, VPN Users, Proxy Users, Clean Users, Today's Checks, Flagged Users), search & filter by type, detection logs table (User, IP, Country, Detection Type, ISP, Risk Score), flagged users section, clear logs, empty state message
  - **API Configuration tab**: Provider selector (ProxyCheck.io / IPQualityScore / IPHub), API key input with show/hide toggle, status display (Connected/Disconnected/Not Configured), "Test Connection" button, Detection Enable toggle, Detection Sensitivity slider, Detection Points info grid, localStorage fallback for all API calls
  - **Control Center tab**: VPN Protection Settings (VPN Warning, Offerwall Block, Withdrawal Block toggles), Auto-Restriction Rules (enable/disable, detection threshold, restrict duration)
  - Proper empty states: "No VPN or Proxy detections found yet", "VPN Detection API is not configured" warning

### Modified
- **`src/components/AdminPanel.tsx`**:
  - Added `import VpnPage from "./VpnPage"`
  - Added VPN handler in `renderSection` (BEFORE SECURITY block): `if (section === "vpn" || section === "vpn-api" || section === "vpn-control")` with early return to `VpnPage`
  - Removed dead `VpnControlCenter` and `VpnApiConfigSection` render calls from SECURITY block (now unreachable)
  - Removed unused `import VpnApiConfigSection from "./VpnApiConfigSection"`

### Fixed
- **Blank VPN & Proxy page** — Root cause fixed. All three navigation paths (`vpn`, `vpn-api`, `vpn-control`) now render the VpnPage component
- **API calls without fallbacks** — All `ApiConfigTab` fetch calls to `/api/vpn/config`, `/api/vpn/test`, etc. now have localStorage fallbacks, so the page works without a backend

### Files modified
- `src/components/VpnPage.tsx` — New file, comprehensive VPN management page
- `src/components/AdminPanel.tsx` — Integrated VpnPage, removed dead code
- `PROJECT_CHANGELOG.md` — This entry

## 2026-06-30 — Fix New User Signup: Profile Never Created Due to Supabase v2 Response Format

### Root Cause
In `src/lib/supabaseService.ts`, the `signUp()` function stores the full Supabase `auth.signUp()` response into `authData`:

```javascript
const result = await sb.auth.signUp({...});
authData = result;  // { data: { user, session }, error: null }
if (authData.user) { ... }  // ❌ undefined! user is at data.user
```

In `@supabase/supabase-js` v2 (`^2.108.2`), `auth.signUp()` returns `{ data: { user, session }, error }` — the `user` object is nested under `data.user`, not at the top level. The code checked `authData.user` which was always `undefined`, so **the profile insert NEVER ran**.

### Consequences
1. Auth user created in Supabase ✅
2. **Profile NEVER inserted** in `profiles` table ❌
3. Auto sign-in after signup succeeds ✅
4. `getProfile()` returns `null` (no profile exists) ❌
5. User is left on the signup form with NO feedback — signup appears broken
6. No error is shown because no error is thrown — execution silently falls through

### Fixed
- **`src/lib/supabaseService.ts`** (`signUp` function):
  - Changed `if (authData.user)` → `const newUser = authData.data?.user || (authData as any).user; if (newUser)`
  - Updated `authData.user.id` → `newUser.id` in profile insert
  - Handles both Supabase v2 format (`data.user`) and v1 format (`user` at top level)
  - Fix applies to both initial signup and re-registration retry paths

### Files modified
- `src/lib/supabaseService.ts` — Fixed user extraction from Supabase v2 auth response

## 2026-06-30 — VPN Test Connection: Fix "Unexpected status: denied" Error

### Root Cause
ProxyCheck.io returns `{"status":"denied"}` when an API key is suspended, blocked, or the server IP is not whitelisted. The server's `testKey()` function only handled `"ok"` and `"error"` statuses — all other statuses (including `"denied"`) fell through to the generic catch-all `"Unexpected status: ${parsed.status}"`, producing the unhelpful error message.

Investigation confirmed:
- ProxyCheck.io returns `"ok"` for any key on basic lookups (even fake keys)
- `"denied"` is returned when a key has been explicitly suspended, blocked, or rate-limited
- The HTTP status code and raw API response were not included in error responses, making debugging impossible from the UI
- The provider registry only had `proxycheck` registered — selecting IPQualityScore or IPHub from the UI would silently fail

### Added
- **`server.ts`**:
  - `ipqualityscoreProvider` and `iphubProvider` stubs with clear "not implemented" messages
  - Updated providers registry to include all 3 providers (`proxycheck`, `ipqualityscore`, `iphub`)
  - `VpnProvider.testKey` interface now includes optional `httpStatus` and `rawResponse` fields

### Modified
- **`server.ts`** (`proxycheckProvider.testKey`):
  - Added handler for `denied` status → "API Access Denied — your API key may be invalid, suspended, or the server IP is not whitelisted"
  - Added handler for `blocked` status → "API access blocked — the key or IP has been blocked"
  - Added handler for `limit` status → "Rate limit exceeded — your ProxyCheck.io query limit has been reached"
  - All error responses now include `httpStatus` and `rawResponse` for debugging
  - `checkIp` function also updated with same `denied`/`blocked`/`limit` handling
- **`server.ts`** — Removed old duplicate `providers` declaration (was causing redeclaration error)
- **`src/components/VpnPage.tsx`** (`handleTestConnection`):
  - Now captures and displays HTTP status code alongside error messages
  - Handles JSON parse failures with HTTP status context
  - Builds descriptive error string from error message + HTTP status

### Error Handling Improvements
| Scenario | Before | After |
|---|---|---|
| Suspended key | `❌ Unexpected status: denied` | `❌ API Access Denied — your API key may be invalid, suspended, or the server IP is not whitelisted` |
| Rate limited | `❌ Unexpected status: limit` | `❌ Rate limit exceeded — your ProxyCheck.io query limit has been reached` |
| Incomplete provider | `❌ Unexpected status: denied` (from IPQualityScore/IPHub) | `❌ IPQualityScore provider not fully implemented yet. Use ProxyCheck.io instead.` |
| Network failure | `❌ Invalid API Key` | `❌ Failed to test connection` |

### Files modified
- `server.ts` — Fixed testKey/checkIp status handling, added provider stubs, updated registry, removed duplicate
- `src/components/VpnPage.tsx` — Better error display with HTTP status
