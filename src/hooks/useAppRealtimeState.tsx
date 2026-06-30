import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClient } from "../lib/supabase";
import { realtimeManager } from "../lib/realtimeManager";
import {
  HomepageSections, DeveloperModeConfig, MaintenanceModeConfig,
  GlobalPromoNotification, LockRule, RewardsConfig,
  getHomepageSections, getDeveloperMode, getMaintenanceMode,
  getGlobalPromoNotification, getLockRules, getRewardsConfig,
  getSystemNotifications, getOffers, getPromoCodes,
  getActiveAnnouncements,
  VpnSettings, getVpnSettingsDb,
  SocialBountyConfig, WeeklyChallengeConfig,
  defaultSocialBounty, defaultWeeklyChallenge,
} from "../lib/adminDb";

// ─── App Real-time State ─────────────────────────────────────────────────────

export interface AppRealtimeState {
  homepageSections: HomepageSections;
  developerMode: DeveloperModeConfig;
  maintenanceMode: MaintenanceModeConfig;
  globalPromo: GlobalPromoNotification;
  lockRules: LockRule[];
  rewardsConfig: RewardsConfig;
  socialBounty: SocialBountyConfig;
  weeklyChallenge: WeeklyChallengeConfig;
  vpnSettings: VpnSettings;
  systemNotifications: any[];
  announcements: any[];
  offers: any[];
  promoCodes: any[];
  loading: boolean;
}

const defaultState: AppRealtimeState = {
  homepageSections: { featured: true, hot: true, surveys: true, offerwalls: true, announcements: true, promo_cards: true, rewards: true, challenges: true, social_bounty: true, weekly_challenge: true },
  developerMode: { enabled: false, message: "" },
  maintenanceMode: { enabled: false, message: "" },
  globalPromo: { text: "", promoEnabled: false, promoCode: "", promoCoins: 0, promoDuration: 0, sentAt: null, startAt: null },
  lockRules: [],
  rewardsConfig: { socialBounty: defaultSocialBounty(), weeklyChallenge: defaultWeeklyChallenge() },
  socialBounty: defaultSocialBounty(),
  weeklyChallenge: defaultWeeklyChallenge(),
  vpnSettings: { vpnDetection: true, vpnWarning: true, vpnBlock: true, withdrawalBlock: true, restrictDuration: 30 },
  systemNotifications: [],
  announcements: [],
  offers: [],
  promoCodes: [],
  loading: true,
};

interface AppRealtimeContextType {
  state: AppRealtimeState;
  refresh: () => Promise<void>;
}

const AppRealtimeContext = createContext<AppRealtimeContextType>({
  state: defaultState,
  refresh: async () => {},
});

export function useAppRealtimeState() {
  return useContext(AppRealtimeContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

async function loadAllState(): Promise<AppRealtimeState> {
  const [homepageSections, developerMode, maintenanceMode, globalPromo, lockRules, rewardsConfig, vpnSettings, systemNotifications, announcements, offers, promoCodes] =
    await Promise.all([
      getHomepageSections(),
      getDeveloperMode(),
      getMaintenanceMode(),
      getGlobalPromoNotification(),
      getLockRules(),
      getRewardsConfig(),
      getVpnSettingsDb(),
      getSystemNotifications().catch(() => []),
      getActiveAnnouncements().catch(() => []),
      getOffers(),
      getPromoCodes(),
    ]);

  return {
    homepageSections,
    developerMode,
    maintenanceMode,
    globalPromo,
    lockRules,
    rewardsConfig,
    socialBounty: rewardsConfig.socialBounty,
    weeklyChallenge: rewardsConfig.weeklyChallenge,
    vpnSettings,
    systemNotifications,
    announcements,
    offers,
    promoCodes,
    loading: false,
  };
}

export function AppRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppRealtimeState>(defaultState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const refresh = useCallback(async () => {
    const newState = await loadAllState();
    setState(newState);
  }, []);

  // Load initial state
  useEffect(() => {
    let mounted = true;
    loadAllState().then((s) => {
      if (mounted) setState(s);
    });
    return () => { mounted = false; };
  }, []);

  // Subscribe to real-time site_settings changes
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const channel = sb.channel("app-state-realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        async (payload: any) => {
          const key = payload.new?.setting_key || payload.old?.setting_key;
          if (!key) return;

          const relevantKeys = [
            "homepage_sections", "developer_mode", "maintenance_mode",
            "global_promo_notification", "lock_rules", "rewards_config",
            "vpn_settings", "offers", "promo_codes",
          ];

          if (!relevantKeys.includes(key)) return;

          try {
            const newState = await loadAllState();
            setState(newState);
          } catch (err) {
            console.warn("[Realtime] Failed to reload state:", err);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[Realtime] app-state channel:", status);
        }
      });

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  // Listen for homepage-sections-changed custom event (fallback for local updates)
  useEffect(() => {
    const handler = async (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        setState(prev => ({ ...prev, homepageSections: custom.detail }));
        return;
      }
      try {
        const sections = await getHomepageSections();
        setState(prev => ({ ...prev, homepageSections: sections }));
      } catch {}
    };
    window.addEventListener("homepage-sections-changed", handler);
    return () => window.removeEventListener("homepage-sections-changed", handler);
  }, []);

  // Listen for announcements-changed custom event (same-tab sync)
  useEffect(() => {
    const handler = async () => {
      const announcements = await getActiveAnnouncements().catch(() => []);
      setState(prev => ({ ...prev, announcements }));
    };
    window.addEventListener("announcements-changed", handler);
    return () => window.removeEventListener("announcements-changed", handler);
  }, []);

  // Listen for promo-codes-changed custom event (same-tab sync)
  useEffect(() => {
    const handler = async () => {
      const promoCodes = await getPromoCodes();
      setState(prev => ({ ...prev, promoCodes }));
    };
    window.addEventListener("promo-codes-changed", handler);
    return () => window.removeEventListener("promo-codes-changed", handler);
  }, []);

  // Periodic refresh as safety net
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const sections = await getHomepageSections();
        const announcements = await getActiveAnnouncements().catch(() => []);
        const promoCodes = await getPromoCodes();
        setState(prev => ({ ...prev, homepageSections: sections, announcements, promoCodes }));
      } catch {}
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time system_notifications changes
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const channel = sb.channel("system-notifications-realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "system_notifications" },
        async () => {
          const notifs = await getSystemNotifications().catch(() => []);
          setState(prev => ({ ...prev, systemNotifications: notifs }));
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  // Subscribe to real-time announcements changes
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    const channel = sb.channel("announcements-realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        async () => {
          const announcements = await getActiveAnnouncements().catch(() => []);
          setState(prev => ({ ...prev, announcements }));
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  return (
    <AppRealtimeContext.Provider value={{ state, refresh }}>
      {children}
    </AppRealtimeContext.Provider>
  );
}
