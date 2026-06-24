import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const ADMIN_EMAIL = "coinlootadmin@gmail.com";
const ADMIN_PASSWORD = "Coinloot@#admin@#";
const ADMIN_USERNAME = "SuperAdmin";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Missing VITE_SUPABASE_URL in .env");
  process.exit(1);
}
if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  console.error("\nTo get it: Supabase Dashboard → Project Settings → API → service_role key");
  console.error("Then add to .env: SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...\n");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("Creating admin user in Supabase Auth...");

  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { username: ADMIN_USERNAME },
  });

  if (createError) {
    if (createError.message.includes("already exists")) {
      console.log("Admin auth user already exists, fetching it...");
    } else {
      console.error("Failed to create admin auth user:", createError.message);
      process.exit(1);
    }
  }

  let userId = userData?.user?.id;

  if (!userId) {
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("Failed to list users:", listError.message);
      process.exit(1);
    }
    const existing = listData.users.find((u) => u.email === ADMIN_EMAIL);
    if (!existing) {
      console.error("Admin user not found in Auth. Something went wrong.");
      process.exit(1);
    }
    userId = existing.id;
    console.log("Found existing admin user:", userId);
  } else {
    console.log("Admin auth user created:", userId);
  }

  console.log("Creating / updating profile...");

  const { error: upsertError } = await supabaseAdmin.from("profiles").upsert({
    id: userId,
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    is_admin: true,
    balance_coins: 0,
    balance_usd: 0,
    xp: 0,
    level: 1,
    kyc_status: "NOT_STARTED",
    vpn_detected: false,
    preference_theme: "dark",
  }, { onConflict: "id" });

  if (upsertError) {
    console.error("Failed to create/update profile:", upsertError.message);
    process.exit(1);
  }
  console.log("Profile created/updated.");

  console.log("Creating admin_accounts entry...");

  const { error: adminAccountError } = await supabaseAdmin.from("admin_accounts").upsert({
    user_id: userId,
    role: "ADMIN",
    is_active: true,
  }, { onConflict: "user_id" });

  if (adminAccountError) {
    if (adminAccountError.message.includes("violates foreign key")) {
      console.log("Foreign key constraint hit — retrying after profile insert...");
    } else {
      console.error("Failed to create admin_accounts:", adminAccountError.message);
      process.exit(1);
    }
  } else {
    console.log("admin_accounts entry created.");
  }

  console.log("\n✓ Admin seed complete!");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log("\nYou can now sign in at https://coinloot.netlify.app/");
}

seed().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
