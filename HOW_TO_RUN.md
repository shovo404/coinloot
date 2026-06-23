# Coin Loot — How to Run

> **GPT/Offerwall Platform v3**
> Built with React, TypeScript, Vite, Tailwind CSS, and Supabase

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# TypeScript type check
npx tsc --noEmit
```

The app runs at `http://localhost:5173` by default.

---

## Admin Account

### Default Credentials

| Field | Value |
|---|---|
| **Email** | `coinlootadmin@gmail.com` |
| **Password** | `Coinloot@#admin@#` |
| **Username** | `SuperAdmin` |
| **Role** | Admin (full platform access) |

### How to Access the Admin Panel

1. **Open the app** → `http://localhost:5173`
2. Click **"Get Started"** → Click **"Sign In"** tab
3. Enter the admin email and password above
4. **Automatic redirect** to the **Admin Panel** with the full admin sidebar

> ⚠️ **There is no separate admin login page.** All users (admin + normal) use the same sign-in form on the homepage. The system detects the admin role and redirects accordingly.

---

## Admin Panel Layout

When logged in as admin, you see a **professional SaaS dashboard**:

| Component | Description |
|---|---|
| **Left Sidebar** | Fixed navigation with 12 sections (Dashboard, Users, Offerwalls, Locked Offers, Withdrawals, Notifications, Coins & Rewards, Promo Codes, Referrals, Leaderboard, Security, Settings). Collapsible via hamburger icon. |
| **Top Header** | Branding, search bar, notification bell with badge, admin profile dropdown with logout. |
| **Content Area** | The selected admin section renders here. Full management controls for all platform features. |

### Sidebar Sections

| Section | Management Capabilities |
|---|---|
| **Dashboard** | Stats cards (users, coins, withdrawals, offerwalls), mini charts, recent activity feed |
| **Users** | View all users, search by username/email, add/deduct coins, change level, suspend/unsuspend, ban/unban, cycle KYC status, batch operations |
| **Offerwalls** | View providers, toggle status (Active/Inactive/Locked), API credential management |
| **Locked Offers** | Configure unlock rules (coin requirements, level requirements) |
| **Withdrawals** | View all withdrawal requests, approve/reject with automatic coin refund on rejection |
| **Payment Methods** | View payout methods, enable/disable, min/max/fee display |
| **Notifications** | Send to one user, selected users, or all users |
| **Coins & Rewards** | Reward specific user, selected users, or all users with bonus coins |
| **Promo Codes** | View all codes, enable/disable |
| **Referrals** | Edit referral percentages (Level 1/2/3), view top referrers |
| **Leaderboard** | View top earners ranked by coins earned |
| **Security** | VPN/fraud detection with restrict/ban actions, user login logs |
| **Activity Logs** | Full admin action audit trail with color-coded badges |
| **Settings** | Site name, coin → USD rate, min withdrawal, database connection info |

---

## Access Rules

| User Type | After Login | Can See Admin Panel? |
|---|---|---|
| **Admin** | Redirected to Admin Panel | ✅ Yes — full sidebar + content |
| **Normal User** | Redirected to Earn Page | ❌ No — admin layout never renders |

### Role Verification

The system checks two fields after login:
1. `is_admin: true` — Admin flag on the profile
2. `admin_role === "ADMIN"` — Single admin role (no multi-role hierarchy)

Both must match for admin access. Normal users have `is_admin: false` and no `admin_role`.

---

## Creating Normal Users

1. Click **"Get Started"** → Click **"Sign Up"** tab
2. Enter username, email, and password (min. 6 characters)
3. Click **"Create Account"**
4. You will be redirected to the **Earn Page**

New users start with:
- 0 coins ($0.00 USD)
- Level 1 (0 XP)
- KYC: NOT_STARTED
- Role: Normal User (no admin access)
- No welcome bonus or signup coins are granted automatically

---

## Security Notes

### Password Storage
- **Demo mode (localStorage):** Passwords are stored alongside account data in the browser's localStorage. This is a development convenience and not suitable for production.
- **Production (Supabase):** When connected to Supabase Auth, passwords are hashed using bcrypt server-side. All admin actions are logged in the `admin_activity_logs` table for audit purposes.

### Admin Route Protection
- The admin layout is only rendered when `is_admin === true && admin_role === "ADMIN"`
- Normal users can never access admin controls — they see only the user dashboard (Earn, Surveys, Withdraw, Leaderboard, Affiliates, Rewards)
- Even if a normal user modifies localStorage, the role check prevents admin panel rendering

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **Lucide React** | Icons |
| **Supabase** | Backend (Database + Auth + Realtime) |
| **Web Audio API** | Coin Sound Effects |

---

## Database

The full Supabase/PostgreSQL schema is in `supabase_schema.sql` (40+ tables, triggers, RLS policies, seed data, realtime publications).

### To deploy to Supabase:

1. Copy the contents of `supabase_schema.sql`
2. Go to your Supabase project dashboard → **SQL Editor**
3. Paste and click **▶ Run**
4. The schema will create all tables, indexes, triggers, RLS policies, and seed data
5. Update `src/lib/supabase.ts` with your Supabase project URL and anon key

### Admin Account in Production

When using Supabase Auth:
1. Create the admin user via Supabase Auth dashboard (or Auth API)
2. A `profiles` table entry is auto-created on auth signup (the `profiles` table uses DEFAULT values, so all balances start at 0)
3. Manually set `is_admin = true` and `admin_role = 'ADMIN'` in the `profiles` table
4. Insert into `admin_accounts` table to link the auth user with admin privileges

---

## Project Structure

```
coin-loot/
├── src/
│   ├── components/         # React components
│   │   ├── AdminLayout.tsx # Admin shell (sidebar + header + content)
│   │   ├── AdminPanel.tsx  # Admin content sections
│   │   ├── Navbar.tsx      # User navigation (no admin tab)
│   │   ├── AuthModal.tsx   # Sign-in/sign-up form (seeds admin account)
│   │   ├── OfferwallHub.tsx
│   │   ├── SurveyHub.tsx
│   │   ├── WithdrawHub.tsx
│   │   ├── RewardsStore.tsx
│   │   ├── ReferralsAffiliates.tsx
│   │   ├── LeaderboardPodium.tsx
│   │   ├── AIChatBot.tsx
│   │   ├── AnimatedBackground.tsx
│   │   ├── Globe3D.tsx
│   │   └── ...
│   ├── hooks/              # Custom React hooks (useRealtimeCollection, useAdminDashboard)
│   ├── lib/                # Supabase client
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions (coin sound, provider logos)
│   ├── App.tsx             # Main app with auth + role-based routing
│   └── main.tsx            # Entry point
├── supabase_schema.sql     # Complete database schema (40+ tables, idempotent)
├── DATABASE_DOCUMENTATION.md
├── HOW_TO_RUN.md           # This file
└── package.json
```

---

> **Version:** 3.0.0
> **Last Updated:** June 2026
