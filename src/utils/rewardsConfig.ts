// ─── Rewards & Challenges Admin Configuration ───────────────────────────────
// Stores Social Bounty Campaign and Weekly Elite Challenge settings in localStorage.
// All values are configurable by the admin and instantly reflect in the user panel.

export interface SocialBountyConfig {
  enabled: boolean;
  title: string;
  description: string;
  icon: string;
  reward_coins: number;
  required_level: number;
  max_reward_limit: number;
  active: boolean;
  updated_at: string;
}

export interface WeeklyChallengeConfig {
  enabled: boolean;
  title: string;
  description: string;
  icon: string;
  reward_coins: number;
  bonus_coins: number;
  required_level: number;
  required_tasks: number;
  completion_conditions: string;
  weekly_reset_rules: string;
  active: boolean;
  updated_at: string;
}

const SOCIAL_BOUNTY_KEY = "coinloot_social_bounty_config";
const WEEKLY_CHALLENGE_KEY = "coinloot_weekly_challenge_config";

const DEFAULT_SOCIAL_BOUNTY: SocialBountyConfig = {
  enabled: true,
  title: "Social bounty campaign networks",
  description: "Connect to Coin Loot global channels. Follow profiles, verify connection vectors, and capture free tokens!",
  icon: "Sparkles",
  reward_coins: 250,
  required_level: 1,
  max_reward_limit: 500,
  active: true,
  updated_at: new Date().toISOString(),
};

const DEFAULT_WEEKLY_CHALLENGE: WeeklyChallengeConfig = {
  enabled: true,
  title: "Weekly Elite Challenge Chest",
  description: "Active clearance players of Clearance Level 2 or higher can decrypt this chest once every calendar week. Guarantees large coin payouts.",
  icon: "Trophy",
  reward_coins: 1000,
  bonus_coins: 250,
  required_level: 2,
  required_tasks: 0,
  completion_conditions: "Complete the required tasks to unlock the chest.",
  weekly_reset_rules: "Resets every Monday at 00:00 UTC.",
  active: true,
  updated_at: new Date().toISOString(),
};

// ─── Social Bounty Config ───

export function getSocialBountyConfig(): SocialBountyConfig {
  try {
    const saved = localStorage.getItem(SOCIAL_BOUNTY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SOCIAL_BOUNTY, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SOCIAL_BOUNTY };
}

export function saveSocialBountyConfig(config: Partial<SocialBountyConfig>): SocialBountyConfig {
  const current = getSocialBountyConfig();
  const updated = { ...current, ...config, updated_at: new Date().toISOString() };
  localStorage.setItem(SOCIAL_BOUNTY_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("social-bounty-changed", { detail: updated }));
  return updated;
}

// ─── Weekly Challenge Config ───

export function getWeeklyChallengeConfig(): WeeklyChallengeConfig {
  try {
    const saved = localStorage.getItem(WEEKLY_CHALLENGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_WEEKLY_CHALLENGE, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_WEEKLY_CHALLENGE };
}

export function saveWeeklyChallengeConfig(config: Partial<WeeklyChallengeConfig>): WeeklyChallengeConfig {
  const current = getWeeklyChallengeConfig();
  const updated = { ...current, ...config, updated_at: new Date().toISOString() };
  localStorage.setItem(WEEKLY_CHALLENGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("weekly-challenge-changed", { detail: updated }));
  return updated;
}

// ─── Reset to defaults ───

export function resetSocialBountyToDefaults(): SocialBountyConfig {
  const defaults = { ...DEFAULT_SOCIAL_BOUNTY, updated_at: new Date().toISOString() };
  localStorage.setItem(SOCIAL_BOUNTY_KEY, JSON.stringify(defaults));
  window.dispatchEvent(new CustomEvent("social-bounty-changed", { detail: defaults }));
  return defaults;
}

export function resetWeeklyChallengeToDefaults(): WeeklyChallengeConfig {
  const defaults = { ...DEFAULT_WEEKLY_CHALLENGE, updated_at: new Date().toISOString() };
  localStorage.setItem(WEEKLY_CHALLENGE_KEY, JSON.stringify(defaults));
  window.dispatchEvent(new CustomEvent("weekly-challenge-changed", { detail: defaults }));
  return defaults;
}

// ─── Level validation helper ───

export function checkLevelRequirement(userLevel: number, requiredLevel: number): { passed: boolean; message: string } {
  if (userLevel < requiredLevel) {
    return {
      passed: false,
      message: `LEVEL ${requiredLevel}+ REQUIRED`,
    };
  }
  return { passed: true, message: "" };
}
