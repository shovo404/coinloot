export interface LockedOfferwallConfig {
  providerName: string;
  title: string;
  subtitle: string;
  isLocked: boolean;
  requiredCoins: number;
  logo: string;
  watermark: string;
  promoEnabled: boolean;
  createdAt: string;
}

export interface OfferwallPromoCode {
  id: string;
  code: string;
  offerwallName: string;
  active: boolean;
  expiryDate: string | null;
  usageLimit: number;
  usageCount: number;
  createdAt: string;
}

export interface UserUnlock {
  id: string;
  userId: string;
  offerwallName: string;
  unlockedBy: "coins" | "promo";
  promoCode: string | null;
  unlockedAt: string;
}

const CONFIG_KEY = "coinloot_locked_offerwalls";
const PROMO_KEY = "coinloot_offerwall_promo_codes";
const UNLOCK_KEY = "coinloot_user_unlocks";
const LOCK_STATUS_KEY = "coinloot_offerwall_lock_status_map";

// ── Per-Offerwall Lock Status ──

export function getOfferwallLockStatusMap(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(LOCK_STATUS_KEY) || "{}");
  } catch { return {}; }
}

function saveOfferwallLockStatusMap(map: Record<string, boolean>): void {
  localStorage.setItem(LOCK_STATUS_KEY, JSON.stringify(map));
}

export function setOfferwallLockEnabled(providerName: string, enabled: boolean): void {
  const map = getOfferwallLockStatusMap();
  map[providerName] = enabled;
  saveOfferwallLockStatusMap(map);
}

export function isOfferwallLockEnabled(providerName: string): boolean {
  const map = getOfferwallLockStatusMap();
  // Default to true if not explicitly set (lock enabled by default)
  return map[providerName] !== false;
}

// ── Locked Offerwall Config ──

export function getLockedOfferwallConfigs(): LockedOfferwallConfig[] {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "[]");
  } catch { return []; }
}

export function saveLockedOfferwallConfig(configs: LockedOfferwallConfig[]) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
}

export function getLockedOfferwallConfig(providerName: string): LockedOfferwallConfig | null {
  return getLockedOfferwallConfigs().find((c) => c.providerName === providerName) || null;
}

export function setLockedOfferwallConfig(config: LockedOfferwallConfig) {
  const all = getLockedOfferwallConfigs();
  const idx = all.findIndex((c) => c.providerName === config.providerName);
  if (idx >= 0) all[idx] = config;
  else all.push(config);
  saveLockedOfferwallConfig(all);
}

export function deleteLockedOfferwallConfig(providerName: string) {
  saveLockedOfferwallConfig(getLockedOfferwallConfigs().filter((c) => c.providerName !== providerName));
}

// ── Promo Codes ──

export function getOfferwallPromoCodes(): OfferwallPromoCode[] {
  try {
    return JSON.parse(localStorage.getItem(PROMO_KEY) || "[]");
  } catch { return []; }
}

export function saveOfferwallPromoCodes(codes: OfferwallPromoCode[]) {
  localStorage.setItem(PROMO_KEY, JSON.stringify(codes));
}

export function addOfferwallPromoCode(code: OfferwallPromoCode) {
  const all = getOfferwallPromoCodes();
  all.push(code);
  saveOfferwallPromoCodes(all);
}

export function updateOfferwallPromoCode(id: string, updates: Partial<OfferwallPromoCode>) {
  const all = getOfferwallPromoCodes();
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates };
    saveOfferwallPromoCodes(all);
  }
}

export function deleteOfferwallPromoCode(id: string) {
  saveOfferwallPromoCodes(getOfferwallPromoCodes().filter((c) => c.id !== id));
}

export function validatePromoCode(code: string, offerwallName: string): OfferwallPromoCode | null {
  const all = getOfferwallPromoCodes();
  const found = all.find(
    (c) =>
      c.code.toUpperCase() === code.toUpperCase() &&
      c.offerwallName === offerwallName &&
      c.active &&
      (c.expiryDate ? new Date(c.expiryDate) > new Date() : true) &&
      c.usageCount < c.usageLimit
  );
  return found || null;
}

export function incrementPromoUsage(id: string) {
  const all = getOfferwallPromoCodes();
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) {
    all[idx].usageCount += 1;
    saveOfferwallPromoCodes(all);
  }
}

const USER_PROMO_USAGE_KEY = "coinloot_user_promo_usage";

export function hasUserUsedPromoCode(userId: string, promoCodeId: string): boolean {
  try {
    const map: Record<string, string[]> = JSON.parse(localStorage.getItem(USER_PROMO_USAGE_KEY) || "{}");
    const used = map[userId] || [];
    return used.includes(promoCodeId);
  } catch { return false; }
}

export function markUserPromoUsed(userId: string, promoCodeId: string) {
  try {
    const map: Record<string, string[]> = JSON.parse(localStorage.getItem(USER_PROMO_USAGE_KEY) || "{}");
    if (!map[userId]) map[userId] = [];
    if (!map[userId].includes(promoCodeId)) map[userId].push(promoCodeId);
    localStorage.setItem(USER_PROMO_USAGE_KEY, JSON.stringify(map));
  } catch { /* */ }
}

// ── User Unlocks ──

export function getUserUnlocks(userId: string): UserUnlock[] {
  try {
    const all: UserUnlock[] = JSON.parse(localStorage.getItem(UNLOCK_KEY) || "[]");
    return all.filter((u) => u.userId === userId);
  } catch { return []; }
}

export function isOfferwallUnlocked(userId: string, offerwallName: string): boolean {
  return getUserUnlocks(userId).some((u) => u.offerwallName === offerwallName);
}

export function addUserUnlock(unlock: UserUnlock) {
  try {
    const all: UserUnlock[] = JSON.parse(localStorage.getItem(UNLOCK_KEY) || "[]");
    all.push(unlock);
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(all));
  } catch { /* */ }
}

export function getAllUserUnlocks(): UserUnlock[] {
  try {
    return JSON.parse(localStorage.getItem(UNLOCK_KEY) || "[]");
  } catch { return []; }
}

// ── Special Unlock Codes ──

export interface OfferwallUnlockCode {
  id: string;
  code: string;
  description: string;
  status: "active" | "inactive";
  expiresAt: string | null;
  usageLimit: number;
  usageCount: number;
  unlockOfferwallIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserUnlockedOfferwall {
  id: string;
  userId: string;
  offerwallId: string;
  unlockCodeId: string;
  unlockedAt: string;
}

const UNLOCK_CODES_KEY = "coinloot_offerwall_unlock_codes";
const USER_UNLOCKED_OFFERWALLS_KEY = "coinloot_user_unlocked_offerwalls";

export function getOfferwallUnlockCodes(): OfferwallUnlockCode[] {
  try {
    return JSON.parse(localStorage.getItem(UNLOCK_CODES_KEY) || "[]");
  } catch { return []; }
}

function saveOfferwallUnlockCodes(codes: OfferwallUnlockCode[]) {
  localStorage.setItem(UNLOCK_CODES_KEY, JSON.stringify(codes));
}

export function addOfferwallUnlockCode(code: OfferwallUnlockCode) {
  const all = getOfferwallUnlockCodes();
  all.push(code);
  saveOfferwallUnlockCodes(all);
}

export function updateOfferwallUnlockCode(id: string, updates: Partial<OfferwallUnlockCode>) {
  const all = getOfferwallUnlockCodes();
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    saveOfferwallUnlockCodes(all);
  }
}

export function deleteOfferwallUnlockCode(id: string) {
  saveOfferwallUnlockCodes(getOfferwallUnlockCodes().filter((c) => c.id !== id));
}

export function validateOfferwallUnlockCode(code: string, offerwallName: string): { valid: boolean; error?: string; record?: OfferwallUnlockCode } {
  const all = getOfferwallUnlockCodes();
  const found = all.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (!found) return { valid: false, error: "Invalid Unlock Code" };
  if (found.status !== "active") return { valid: false, error: "Invalid Unlock Code" };
  if (found.expiresAt && new Date(found.expiresAt) < new Date()) return { valid: false, error: "Unlock Code Expired" };
  if (found.usageLimit > 0 && found.usageCount >= found.usageLimit) return { valid: false, error: "Usage Limit Reached" };
  if (!found.unlockOfferwallIds.includes(offerwallName)) return { valid: false, error: "Invalid Unlock Code" };
  return { valid: true, record: found };
}

export function incrementUnlockCodeUsage(id: string) {
  const all = getOfferwallUnlockCodes();
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) {
    all[idx].usageCount += 1;
    saveOfferwallUnlockCodes(all);
  }
}

export function getUserUnlockedOfferwalls(userId: string): UserUnlockedOfferwall[] {
  try {
    const all: UserUnlockedOfferwall[] = JSON.parse(localStorage.getItem(USER_UNLOCKED_OFFERWALLS_KEY) || "[]");
    return all.filter((u) => u.userId === userId);
  } catch { return []; }
}

export function addUserUnlockedOfferwall(record: UserUnlockedOfferwall) {
  try {
    const all: UserUnlockedOfferwall[] = JSON.parse(localStorage.getItem(USER_UNLOCKED_OFFERWALLS_KEY) || "[]");
    all.push(record);
    localStorage.setItem(USER_UNLOCKED_OFFERWALLS_KEY, JSON.stringify(all));
  } catch { /* */ }
}

export function isOfferwallUnlockedByCode(userId: string, offerwallName: string): boolean {
  return getUserUnlockedOfferwalls(userId).some((u) => u.offerwallId === offerwallName);
}

export function getAllUserUnlockedOfferwalls(): UserUnlockedOfferwall[] {
  try {
    return JSON.parse(localStorage.getItem(USER_UNLOCKED_OFFERWALLS_KEY) || "[]");
  } catch { return []; }
}
