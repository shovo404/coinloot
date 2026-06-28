export interface VpnCheckResult {
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isHosting: boolean;
  isAnonymousProxy: boolean;
  ip: string;
  country: string;
  city: string;
  region: string;
  isp: string;
  org: string;
  vpnProvider: string;
  fraudScore: number;
  detectionType: string;
  rawResponse?: any;
}

export interface VpnDetectionLog {
  id: string;
  userId: string;
  username: string;
  ip: string;
  country: string;
  city: string;
  isp: string;
  org: string;
  detectionType: string;
  vpnProvider: string;
  fraudScore: number;
  rawResponse?: any;
  detectedAt: string;
}

export interface RestrictionHistoryEntry {
  id: string;
  userId: string;
  username: string;
  action: "restricted" | "unrestricted" | "extended" | "banned";
  duration: number;
  reason: string;
  adminNote?: string;
  adminAction: string;
  timestamp: string;
}

// ── User IP Log (per-user IP tracking) ──

export interface UserIpLog {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  country: string;
  city: string;
  isp: string;
  proxyDetected: boolean;
  proxyType: string;
  riskScore: number;
  lastSeen: string;
  createdAt: string;
}

export function logUserIp(userId: string, username: string, result: VpnCheckResult): UserIpLog {
  const entry: UserIpLog = {
    id: `ipl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    username,
    ipAddress: result.ip,
    country: result.country,
    city: result.city,
    isp: result.isp,
    proxyDetected: result.isVpn || result.isProxy || result.isTor || result.isHosting,
    proxyType: result.detectionType,
    riskScore: result.fraudScore,
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  try {
    const logs: UserIpLog[] = JSON.parse(localStorage.getItem("coinloot_user_ip_logs") || "[]");
    logs.unshift(entry);
    localStorage.setItem("coinloot_user_ip_logs", JSON.stringify(logs.slice(0, 1000)));
  } catch { /* */ }
  return entry;
}

export function getUserIpLogs(limit = 200): UserIpLog[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_user_ip_logs") || "[]").slice(0, limit);
  } catch { return []; }
}

// ── VPN Protection Settings ──

export interface VpnProtectionSettings {
  vpnWarning: boolean;
  offerwallBlock: boolean;
  withdrawalBlock: boolean;
}

export function getVpnSettings(): VpnProtectionSettings {
  try {
    const saved = localStorage.getItem("coinloot_vpn_settings");
    if (saved) return JSON.parse(saved);
  } catch { /* */ }
  return { vpnWarning: true, offerwallBlock: true, withdrawalBlock: true };
}

export function saveVpnSettings(settings: VpnProtectionSettings) {
  localStorage.setItem("coinloot_vpn_settings", JSON.stringify(settings));
}

// ── Server-side VPN check ──

export async function checkVpnStatus(): Promise<VpnCheckResult> {
  try {
    const resp = await fetch("/api/vpn/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(15000),
    });
    const data = await resp.json();

    // Check for API key / config error
    if (data.error) {
      if (data.error === "Invalid IP address") {
        // Try with a public IP fetch as fallback
        const publicIp = await getPublicIpFallback();
        if (publicIp) {
          const retry = await fetch("/api/vpn/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip: publicIp }),
            signal: AbortSignal.timeout(10000),
          });
          const retryData = await retry.json();
          return mapServerResponse(retryData);
        }
      }
      return emptyResult();
    }

    return mapServerResponse(data);
  } catch {
    // Server unreachable — allow access (fail open)
    return emptyResult();
  }
}

function mapServerResponse(data: any): VpnCheckResult {
  const isDetected = data.detected === true;
  return {
    isVpn: data.isVpn === true || isDetected,
    isProxy: data.isProxy === true,
    isTor: data.isTor === true,
    isHosting: data.isHosting === true,
    isAnonymousProxy: data.isAnonymousProxy === true,
    ip: data.ip || "",
    country: data.country || "",
    city: data.city || "",
    region: data.region || "",
    isp: data.isp || "",
    org: data.org || "",
    vpnProvider: data.vpnProvider || "",
    fraudScore: data.fraudScore || 0,
    detectionType: data.detectionType || data.detection_type || "unknown",
    rawResponse: data.rawResponse || null,
  };
}

async function getPublicIpFallback(): Promise<string> {
  try {
    const resp = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await resp.json();
    return data.ip || "";
  } catch {
    return "";
  }
}

function emptyResult(): VpnCheckResult {
  return {
    isVpn: false, isProxy: false, isTor: false, isHosting: false,
    isAnonymousProxy: false, ip: "", country: "", city: "", region: "",
    isp: "", org: "", vpnProvider: "", fraudScore: 0,
    detectionType: "none",
  };
}

// ── Detection Logging ──

export function logDetection(userId: string, username: string, result: VpnCheckResult, email: string = "") {
  try {
    const logs: VpnDetectionLog[] = JSON.parse(localStorage.getItem("coinloot_vpn_logs") || "[]");
    logs.unshift({
      id: `vpn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      username,
      ip: result.ip,
      country: result.country,
      city: result.city,
      isp: result.isp,
      org: result.org,
      detectionType: result.detectionType,
      vpnProvider: result.vpnProvider,
      fraudScore: result.fraudScore,
      rawResponse: result.rawResponse,
      detectedAt: new Date().toISOString(),
    });
    localStorage.setItem("coinloot_vpn_logs", JSON.stringify(logs.slice(0, 500)));

    // Also log to user_ip_logs
    logUserIp(userId, username, result);

    // Also log server-side with email
    fetch("/api/vpn/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, username, email, result }),
    }).catch(() => {});
  } catch { /* */ }
}

export function getDetectionHistory(): VpnDetectionLog[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_vpn_logs") || "[]").slice(0, 100);
  } catch { return []; }
}

export function getIpLogs(userId: string): VpnDetectionLog[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_vpn_logs") || "[]")
      .filter((l: VpnDetectionLog) => l.userId === userId).slice(0, 50);
  } catch { return []; }
}

export function clearDetectionLogs() {
  localStorage.setItem("coinloot_vpn_logs", "[]");
}

// ── Restriction Management ──

interface RestrictionEntry {
  userId: string;
  restrictedUntil: string;  // ISO date, or "" for permanent
  reason: string;
  notes: string;
  restrictedAt: string;
  restrictedBy: string;
  permanent: boolean;
}

function getRestrictionEntries(): RestrictionEntry[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_restricted_users_v2") || "[]");
  } catch { return []; }
}

function saveRestrictionEntries(entries: RestrictionEntry[]) {
  localStorage.setItem("coinloot_restricted_users_v2", JSON.stringify(entries));
}

export function isUserRestricted(userId: string): {
  restricted: boolean;
  until: string | null;
  remaining: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  reason: string;
} {
  try {
    const entries = getRestrictionEntries();
    const entry = entries.find((r) => r.userId === userId);
    if (!entry) return { restricted: false, until: null, remaining: "", days: 0, hours: 0, minutes: 0, seconds: 0, reason: "" };
    if (entry.permanent) {
      return { restricted: true, until: null, remaining: "Permanent", days: 0, hours: 0, minutes: 0, seconds: 0, reason: entry.reason };
    }
    const now = Date.now();
    const until = new Date(entry.restrictedUntil).getTime();
    if (now >= until) {
      saveRestrictionEntries(entries.filter((r) => r.userId !== userId));
      return { restricted: false, until: null, remaining: "", days: 0, hours: 0, minutes: 0, seconds: 0, reason: "" };
    }
    const diffMs = until - now;
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const remaining = `${days > 0 ? days + "d " : ""}${hours}h ${minutes}m ${seconds}s`;
    return { restricted: true, until: entry.restrictedUntil, remaining, days, hours, minutes, seconds, reason: entry.reason };
  } catch {
    return { restricted: false, until: null, remaining: "", days: 0, hours: 0, minutes: 0, seconds: 0, reason: "" };
  }
}

export function restrictUser(
  userId: string,
  durationMinutes: number,
  reason: string,
  adminName: string = "Admin",
  notes: string = ""
) {
  try {
    const entries = getRestrictionEntries();
    const existing = entries.findIndex((r) => r.userId === userId);
    const entry: RestrictionEntry = {
      userId,
      restrictedUntil: new Date(Date.now() + durationMinutes * 60000).toISOString(),
      reason,
      notes,
      restrictedAt: new Date().toISOString(),
      restrictedBy: adminName,
      permanent: false,
    };
    if (existing >= 0) {
      entries[existing] = entry;
    } else {
      entries.push(entry);
    }
    saveRestrictionEntries(entries);
    updateUserProfileStatus(userId, "restricted");
  } catch { /* */ }
}

export function banUser(
  userId: string,
  reason: string,
  adminName: string = "Admin",
  notes: string = ""
) {
  try {
    const entries = getRestrictionEntries();
    const existing = entries.findIndex((r) => r.userId === userId);
    const entry: RestrictionEntry = {
      userId,
      restrictedUntil: "",
      reason,
      notes,
      restrictedAt: new Date().toISOString(),
      restrictedBy: adminName,
      permanent: true,
    };
    if (existing >= 0) {
      entries[existing] = entry;
    } else {
      entries.push(entry);
    }
    saveRestrictionEntries(entries);
    updateUserProfileStatus(userId, "banned");
  } catch { /* */ }
}

export function unRestrictUser(userId: string) {
  try {
    const entries = getRestrictionEntries();
    saveRestrictionEntries(entries.filter((r) => r.userId !== userId));
    updateUserProfileStatus(userId, "active");
  } catch { /* */ }
}

export function unbanUser(userId: string) {
  unRestrictUser(userId);
}

export function getRestrictedUsers(): { userId: string; restrictedUntil: string; reason: string; permanent: boolean; restrictedBy: string; restrictedAt: string; notes: string }[] {
  try {
    const entries = getRestrictionEntries();
    const now = Date.now();
    return entries.filter((r: RestrictionEntry) => {
      if (r.permanent) return true;
      return new Date(r.restrictedUntil).getTime() > now;
    });
  } catch { return []; }
}

export function getFullRestrictionInfo(userId: string): RestrictionEntry | null {
  try {
    return getRestrictionEntries().find((r) => r.userId === userId) || null;
  } catch { return null; }
}

export function extendRestriction(userId: string, additionalMinutes: number) {
  try {
    const entries = getRestrictionEntries();
    const idx = entries.findIndex((r) => r.userId === userId);
    if (idx === -1) return;
    const current = new Date(entries[idx].restrictedUntil).getTime();
    const base = current > Date.now() ? current : Date.now();
    entries[idx].restrictedUntil = new Date(base + additionalMinutes * 60000).toISOString();
    saveRestrictionEntries(entries);
  } catch { /* */ }
}

function updateUserProfileStatus(userId: string, status: "active" | "restricted" | "banned") {
  try {
    const accounts = JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
    const updated = accounts.map((a: any) => {
      if (a.profile?.id === userId || a.id === userId) {
        return { ...a, profile: { ...a.profile, status } };
      }
      return a;
    });
    localStorage.setItem("coinloot_accounts", JSON.stringify(updated));

    const storedProfile = localStorage.getItem("coinloot_user_profile");
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      if (profile.id === userId) {
        profile.status = status;
        localStorage.setItem("coinloot_user_profile", JSON.stringify(profile));
      }
    }
  } catch { /* */ }
}

// ── Restriction History ──

export function logRestrictionHistory(entry: RestrictionHistoryEntry) {
  try {
    const history: RestrictionHistoryEntry[] = JSON.parse(localStorage.getItem("coinloot_restriction_history") || "[]");
    history.unshift(entry);
    localStorage.setItem("coinloot_restriction_history", JSON.stringify(history.slice(0, 200)));
  } catch { /* */ }
}

export function getRestrictionHistory(): RestrictionHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("coinloot_restriction_history") || "[]");
  } catch { return []; }
}

// ── VPN Detection Count (for auto-restriction) ──

export function getVpnDetectionCount(userId: string): number {
  try {
    const logs: VpnDetectionLog[] = JSON.parse(localStorage.getItem("coinloot_vpn_logs") || "[]");
    return logs.filter((l) => l.userId === userId && l.detectionType !== "clean").length;
  } catch { return 0; }
}

// ── Auto-Restriction Rules ──

export interface AutoRestrictRules {
  enabled: boolean;
  threshold: number; // number of detections before auto-restrict
  durationMinutes: number; // restriction duration in minutes
}

const AUTO_RESTRICT_KEY = "coinloot_auto_restrict_rules";

export function getAutoRestrictRules(): AutoRestrictRules {
  try {
    const saved = localStorage.getItem(AUTO_RESTRICT_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* */ }
  return { enabled: false, threshold: 3, durationMinutes: 1440 }; // disabled by default
}

export function saveAutoRestrictRules(rules: AutoRestrictRules) {
  localStorage.setItem(AUTO_RESTRICT_KEY, JSON.stringify(rules));
}

export function checkAutoRestrict(userId: string, username: string, adminName: string = "System") {
  const rules = getAutoRestrictRules();
  if (!rules.enabled) return false;
  const count = getVpnDetectionCount(userId);
  if (count >= rules.threshold) {
    // Check if already restricted
    const existing = isUserRestricted(userId);
    if (!existing.restricted) {
      restrictUser(userId, rules.durationMinutes, `Auto-restricted: ${count} VPN detections`, adminName, `Automatic restriction after ${count} VPN detections`);
      logRestrictionHistory({
        id: `rh-${Date.now()}`,
        userId,
        username,
        action: "restricted",
        duration: rules.durationMinutes,
        reason: `Auto-restricted after ${count} VPN detections`,
        adminNote: `Threshold: ${rules.threshold} detections, Duration: ${rules.durationMinutes} min`,
        adminAction: `Auto-restricted by system (${count} detections)`,
        timestamp: new Date().toISOString(),
      });
      return true;
    }
  }
  return false;
}
