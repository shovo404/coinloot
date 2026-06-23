import { createClient } from "@supabase/supabase-js";

// Use environment variables when available, with hardcoded fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://kswnbkvdbocmyglwsmnr.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzd25ia3ZkYm9jbXlnbHdzbW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4Nzk0NjgsImV4cCI6MjA5NzQ1NTQ2OH0.bWXjaX0YZFiqyhP7V5ZSB49IrMcrNMsTEbQRHoTVjJI";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
