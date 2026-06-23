import { createClient } from "@supabase/supabase-js";

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient(): ReturnType<typeof createClient> | null {
  if (cachedClient) return cachedClient;
  try {
    const config = JSON.parse(localStorage.getItem("coinloot_db_config") || "{}");
    const supabaseUrl = config.projectUrl || import.meta.env.VITE_SUPABASE_URL as string || "";
    const supabaseKey = config.apiKey || import.meta.env.VITE_SUPABASE_ANON_KEY as string || "";
    if (!supabaseUrl || !supabaseKey) return null;
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
    return cachedClient;
  } catch {
    return null;
  }
}

export function clearSupabaseClient(): void {
  cachedClient = null;
}
