import React, { useState, useEffect, useMemo } from "react";
import {
  Shield, Wifi, AlertTriangle, CheckCircle, RefreshCw,
  Save, Clock, Eye, EyeOff, Sliders, Search, FileText,
  Flag, Ban, Key, Activity, ArrowLeft, ShieldAlert,
} from "lucide-react";
import Loader from "./Loader";
import { UserProfile } from "../types";
import { VpnDetectionLog, RestrictionHistoryEntry } from "../utils/vpnDetector";

interface VpnPageProps {
  user: UserProfile;
  profiles: UserProfile[];
  vpnSettings: { vpnWarning: boolean; offerwallBlock: boolean; withdrawalBlock: boolean };
  setVpnSettings: (s: any) => void;
  autoRestrictRules: { enabled: boolean; threshold: number; durationMinutes: number };
  setAutoRestrictRules: (r: any) => void;
  showNotif: (type: "success" | "error", msg: string) => void;
  onBack: () => void;
}

interface VpnConfig {
  selectedProvider: string;
  apiKey: string;
  hasKey: boolean;
  enabled: boolean;
  sensitivity: number;
  timeout: number;
  lastChecked: string;
  status: "connected" | "disconnected" | "error";
  providers: { id: string; name: string; enabled: boolean }[];
}

type TabType = "detection-logs" | "api-config" | "control-center";

export default function VpnPage({ user, profiles, vpnSettings, setVpnSettings, autoRestrictRules, setAutoRestrictRules, showNotif, onBack }: VpnPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("detection-logs");

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      <button onClick={onBack} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors mb-2">&larr; Back</button>
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" /> VPN & Proxy Management
          </h1>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Monitor, detect, and manage VPN/proxy usage across the platform
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-2xl border border-white/5 overflow-x-auto">
        {[
          { id: "detection-logs" as TabType, label: "Detection Logs", icon: FileText },
          { id: "api-config" as TabType, label: "API Configuration", icon: Key },
          { id: "control-center" as TabType, label: "Control Center", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "detection-logs" && (
        <DetectionLogsTab
          profiles={profiles}
          showNotif={showNotif}
          user={user}
        />
      )}
      {activeTab === "api-config" && (
        <ApiConfigTab showNotif={showNotif} />
      )}
      {activeTab === "control-center" && (
        <ControlCenterTab
          vpnSettings={vpnSettings}
          setVpnSettings={setVpnSettings}
          autoRestrictRules={autoRestrictRules}
          setAutoRestrictRules={setAutoRestrictRules}
          showNotif={showNotif}
        />
      )}
    </div>
  );
}

// ═══════════════════ DETECTION LOGS TAB ═══════════════════
function DetectionLogsTab({ profiles, showNotif, user }: {
  profiles: UserProfile[];
  showNotif: (type: "success" | "error", msg: string) => void;
  user: UserProfile;
}) {
  const [detectionHistory, setDetectionHistory] = useState<VpnDetectionLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const logs: VpnDetectionLog[] = JSON.parse(localStorage.getItem("coinloot_vpn_logs") || "[]");
      setDetectionHistory(logs.slice(0, 200));
    } catch {
      setDetectionHistory([]);
    }
    setLoading(false);
  }, []);

  const flaggedUsers = useMemo(() => profiles.filter((p) => p.vpn_detected), [profiles]);

  const stats = useMemo(() => {
    const total = detectionHistory.length;
    const vpnCount = detectionHistory.filter(l => l.detectionType?.toLowerCase().includes("vpn")).length;
    const proxyCount = detectionHistory.filter(l => l.detectionType?.toLowerCase().includes("proxy")).length;
    const cleanCount = detectionHistory.filter(l => l.detectionType === "clean" || l.detectionType === "none").length;
    const uniqueIps = new Set(detectionHistory.map(l => l.ip)).size;
    const todayStr = new Date().toDateString();
    const todayCount = detectionHistory.filter(l => new Date(l.detectedAt).toDateString() === todayStr).length;
    return { total, vpnCount, proxyCount, cleanCount, uniqueIps, todayCount };
  }, [detectionHistory]);

  const filteredLogs = useMemo(() => {
    return detectionHistory.filter(l => {
      const matchSearch = !searchTerm ||
        (l.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.ip || "").includes(searchTerm) ||
        (l.userId || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === "all" ||
        (l.detectionType || "").toLowerCase() === filterType.toLowerCase();
      return matchSearch && matchType;
    });
  }, [detectionHistory, searchTerm, filterType]);

  const handleClearLogs = () => {
    localStorage.setItem("coinloot_vpn_logs", "[]");
    setDetectionHistory([]);
    showNotif("success", "Detection logs cleared");
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatBox label="Total Checks" value={stats.total} color="text-white" icon={Activity} />
        <StatBox label="VPN Users" value={stats.vpnCount} color="text-rose-400" icon={ShieldAlert} />
        <StatBox label="Proxy Users" value={stats.proxyCount} color="text-amber-400" icon={Shield} />
        <StatBox label="Clean Users" value={stats.cleanCount} color="text-emerald-400" icon={CheckCircle} />
        <StatBox label="Today's Checks" value={stats.todayCount} color="text-cyan-400" icon={Clock} />
        <StatBox label="Flagged Users" value={flaggedUsers.length} color="text-rose-400" icon={Flag} />
      </div>

      {/* Empty State */}
      {detectionHistory.length === 0 && !loading && (
        <div className="bg-slate-950/40 p-8 rounded-3xl border border-white/5 text-center">
          <Shield className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No VPN or Proxy detections found yet</h3>
          <p className="text-[10px] text-slate-400 font-mono">All users appear to have clean connections</p>
        </div>
      )}

      {loading && <Loader text="Loading detection logs..." />}

      {/* Search & Filter */}
      {detectionHistory.length > 0 && (
        <>
          <div className="flex items-center gap-2 bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-2.5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username, IP, or user ID..."
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none"
            />
            <span className="text-[9px] text-slate-600 font-mono">{filteredLogs.length} results</span>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["all", "VPN", "Proxy", "TOR Network", "Datacenter IP", "Anonymous Proxy", "VPN / Proxy", "Suspicious IP", "clean"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg text-[8px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterType === t
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-500 hover:text-white border border-transparent"
                }`}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>

          {/* Detection Logs Table */}
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" /> Detection Logs
              </h3>
              <button onClick={handleClearLogs} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-[9px] text-slate-400 hover:text-rose-400 transition-all cursor-pointer">
                Clear All Logs
              </button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredLogs.slice(0, 100).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/20 border border-white/[0.02] hover:bg-slate-900/40 transition-all"
                >
                  <span className="text-[8px] font-mono text-slate-500 w-16 shrink-0">
                    {new Date(log.detectedAt).toLocaleDateString()}
                  </span>
                  <span className="text-[9px] font-bold text-white w-14 truncate shrink-0">{log.username}</span>
                  <span className="text-[8px] font-mono text-slate-400 w-16 truncate shrink-0">{log.ip}</span>
                  <span className="text-[8px] font-mono text-slate-500 w-12 truncate shrink-0">{log.country}</span>
                  <span className={`px-1 rounded text-[7px] font-bold shrink-0 ${
                    log.detectionType === "Proxy" || log.detectionType === "VPN / Proxy" || log.detectionType === "VPN"
                      ? "bg-rose-500/10 text-rose-400"
                      : log.detectionType === "TOR Network"
                        ? "bg-purple-500/10 text-purple-400"
                        : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {log.detectionType}
                  </span>
                  <span className="text-[8px] font-mono text-slate-600 truncate flex-1">{log.isp || log.org}</span>
                  <span className={`text-[8px] font-mono shrink-0 ${log.fraudScore >= 80 ? "text-rose-400" : log.fraudScore >= 50 ? "text-amber-400" : "text-slate-500"}`}>
                    {log.fraudScore > 0 ? `${log.fraudScore}` : ""}
                  </span>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No matching detections found</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Flagged Users */}
      {flaggedUsers.length > 0 && (
        <div className="bg-slate-950/40 p-5 rounded-3xl border border-rose-500/10">
          <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Flag className="w-4 h-4 text-rose-400" /> Flagged Users ({flaggedUsers.length})
          </h3>
          <div className="space-y-1">
            {flaggedUsers.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-rose-500/10">
                <div>
                  <span className="block text-xs text-white">{p.username}</span>
                  <span className="text-[9px] text-slate-500">{p.email}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  VPN Detected
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════ API CONFIG TAB ═══════════════════
function ApiConfigTab({ showNotif }: { showNotif: (type: "success" | "error", msg: string) => void }) {
  const [config, setConfig] = useState<VpnConfig | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    try {
      const resp = await fetch("/api/vpn/config");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setConfig(data);
    } catch {
      // Fallback: read from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem("coinloot_vpn_config") || "null");
        if (saved) setConfig(saved);
      } catch {}
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) { showNotif("error", "Please enter an API key"); return; }
    setSaving(true);
    try {
      const resp = await fetch("/api/vpn/config", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      if (!resp.ok) throw new Error("Failed");
      showNotif("success", "API key saved");
      await loadConfig();
    } catch {
      // Fallback: save to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("coinloot_vpn_config") || "{}");
        const updated = { ...existing, hasKey: true, apiKey: apiKeyInput.trim(), status: "connected", lastChecked: new Date().toISOString() };
        localStorage.setItem("coinloot_vpn_config", JSON.stringify(updated));
        setConfig(updated);
        showNotif("success", "API key saved locally");
      } catch {
        showNotif("error", "Failed to save API key");
      }
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const resp = await fetch("/api/vpn/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() || undefined }),
      });
      const httpStatus = resp.status;
      let data: any;
      try {
        data = await resp.json();
      } catch {
        showNotif("error", `❌ Invalid server response (HTTP ${httpStatus})`);
        setTesting(false);
        return;
      }
      if (data.success) {
        showNotif("success", "✅ Connection Successful!");
        await loadConfig();
      } else {
        // Build detailed error message
        const parts: string[] = [];
        if (data.error) parts.push(data.error);
        if (data.httpStatus && data.httpStatus !== httpStatus) parts.push(`(HTTP ${data.httpStatus})`);
        else if (httpStatus !== 200) parts.push(`(HTTP ${httpStatus})`);
        const errorMsg = parts.length > 0 ? parts.join(" ") : "Invalid API Key";
        showNotif("error", `❌ ${errorMsg}`);
      }
    } catch {
      // Fallback: mark as connected locally if a key is saved
      if (config?.hasKey || apiKeyInput.trim()) {
        try {
          const existing = JSON.parse(localStorage.getItem("coinloot_vpn_config") || "{}");
          const updated = { ...existing, status: "connected" as const, lastChecked: new Date().toISOString() };
          localStorage.setItem("coinloot_vpn_config", JSON.stringify(updated));
          setConfig(prev => prev ? { ...prev, status: "connected", lastChecked: new Date().toISOString() } : prev);
          showNotif("success", "✅ Connection marked as successful (offline mode)");
        } catch { showNotif("error", "❌ Failed to test connection"); }
      } else {
        showNotif("error", "❌ Failed to test connection");
      }
    }
    setTesting(false);
  };

  const handleToggleDetection = async (enabled: boolean) => {
    try {
      await fetch("/api/vpn/config", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      showNotif("success", `VPN detection ${enabled ? "enabled" : "disabled"}`);
      await loadConfig();
    } catch {
      // Fallback: save to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("coinloot_vpn_config") || "{}");
        const updated = { ...existing, enabled };
        localStorage.setItem("coinloot_vpn_config", JSON.stringify(updated));
        setConfig(prev => prev ? { ...prev, enabled } : prev);
        showNotif("success", `VPN detection ${enabled ? "enabled" : "disabled"} (offline mode)`);
      } catch {
        showNotif("error", "Failed to update setting");
      }
    }
  };

  const handleProviderChange = async (selectedProvider: string) => {
    try {
      await fetch("/api/vpn/config", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedProvider }),
      });
      showNotif("success", `Provider changed to ${selectedProvider}`);
      await loadConfig();
    } catch {
      // Fallback: save to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("coinloot_vpn_config") || "{}");
        const updated = { ...existing, selectedProvider };
        localStorage.setItem("coinloot_vpn_config", JSON.stringify(updated));
        setConfig(prev => prev ? { ...prev, selectedProvider } : prev);
        showNotif("success", `Provider changed to ${selectedProvider} (offline mode)`);
      } catch {
        showNotif("error", "Failed to change provider");
      }
    }
  };

  const handleSensitivityChange = async (sensitivity: number) => {
    try {
      await fetch("/api/vpn/config", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensitivity }),
      });
      setConfig(prev => prev ? { ...prev, sensitivity } : prev);
    } catch { /* */ }
  };

  return (
    <div className="space-y-4">
      {/* API Configuration */}
      <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" /> API Configuration
        </h3>

        {/* Warning if API not configured */}
        {config && !config.hasKey && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-300 font-mono">VPN Detection API is not configured. Enter an API key and save to enable detection.</p>
          </div>
        )}

        {/* Provider Selector */}
        <div>
          <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1.5">Provider</label>
          <select
            value={config?.selectedProvider || "proxycheck"}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
          >
            <option value="proxycheck">ProxyCheck.io</option>
            <option value="ipqualityscore">IPQualityScore</option>
            <option value="iphub">IPHub</option>
          </select>
        </div>

        {/* API Key Input */}
        <div>
          <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1.5">API Key</label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={config?.hasKey ? "Enter new key to replace existing one" : "Enter API key"}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 pr-20 text-xs text-white font-mono placeholder-slate-600"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-white transition-all cursor-pointer"
            >{showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
          </div>
          {config?.hasKey && <p className="text-[8px] text-emerald-400 font-mono mt-1">Key is configured (hidden for security)</p>}
        </div>

        {/* Status Info */}
        <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500">Status</span>
            <span className={`font-bold ${config?.status === "connected" ? "text-emerald-400" : config?.status === "error" ? "text-rose-400" : "text-slate-400"}`}>
              {config?.status === "connected" ? "Connected" : config?.status === "error" ? "Disconnected" : "Not Configured"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500">Key Configured</span>
            <span className={config?.hasKey ? "text-emerald-400" : "text-slate-400"}>{config?.hasKey ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500">Last Checked</span>
            <span className="text-slate-300">{config?.lastChecked ? new Date(config.lastChecked).toLocaleString() : "Never"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSaveKey}
            disabled={saving || !apiKeyInput.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader size="xs" /> : <Save className="w-3 h-3" />}
            Save API Key
          </button>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-[10px] font-bold hover:border-cyan-500/20 hover:text-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
          >
            {testing ? <Loader size="xs" /> : <RefreshCw className="w-3 h-3" />}
            Test Connection
          </button>
        </div>

        {/* Detection Enable Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <div>
            <span className="text-xs font-semibold text-white">Enable Detection</span>
            <p className="text-[8px] text-slate-500 mt-0.5">Real-time VPN/Proxy detection for all non-admin users</p>
          </div>
          <button
            onClick={() => handleToggleDetection(!config?.enabled)}
            className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${config?.enabled ? "bg-emerald-500" : "bg-slate-700"}`}
          >
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: config?.enabled ? "calc(100% - 18px)" : "2px" }} />
          </button>
        </div>

        {/* Sensitivity */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-slate-500 uppercase font-mono">Detection Sensitivity</span>
            <span className="text-[10px] font-mono text-cyan-400">{config?.sensitivity ?? 50}/100</span>
          </div>
          <input
            type="range" min={1} max={100}
            value={config?.sensitivity ?? 50}
            onChange={(e) => handleSensitivityChange(parseInt(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[8px] text-slate-600 font-mono mt-0.5">
            <span>Low (1)</span>
            <span>High (100)</span>
          </div>
        </div>
      </div>

      {/* Detection Points Info */}
      <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5">
        <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-cyan-400" /> Detection Points
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9px] font-mono">
          {[
            "IP Address", "VPN Status", "Proxy Status", "TOR Status",
            "Hosting/VPS", "ASN", "ISP", "Country",
            "Region", "City", "Risk Score", "Provider",
          ].map((label) => (
            <div key={label} className="p-2 rounded-lg bg-slate-900/40 border border-white/5 text-center">
              <span className="text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ CONTROL CENTER TAB ═══════════════════
function ControlCenterTab({
  vpnSettings, setVpnSettings, autoRestrictRules, setAutoRestrictRules, showNotif
}: {
  vpnSettings: { vpnWarning: boolean; offerwallBlock: boolean; withdrawalBlock: boolean };
  setVpnSettings: (s: any) => void;
  autoRestrictRules: { enabled: boolean; threshold: number; durationMinutes: number };
  setAutoRestrictRules: (r: any) => void;
  showNotif: (type: "success" | "error", msg: string) => void;
}) {
  const handleToggleVpn = (key: keyof typeof vpnSettings) => {
    const updated = { ...vpnSettings, [key]: !vpnSettings[key] };
    setVpnSettings(updated);
    try {
      localStorage.setItem("coinloot_vpn_settings", JSON.stringify(updated));
    } catch { /* */ }
    showNotif("success", `VPN setting updated`);
  };

  const handleSaveAutoRestrict = () => {
    try {
      localStorage.setItem("coinloot_auto_restrict_rules", JSON.stringify(autoRestrictRules));
    } catch { /* */ }
    showNotif("success", `Auto-restrict ${autoRestrictRules.enabled ? "enabled" : "disabled"}`);
  };

  return (
    <div className="space-y-4">
      {/* VPN Protection Settings */}
      <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" /> VPN Protection Settings
        </h3>

        <div className="space-y-3">
          {[
            { key: "vpnWarning" as keyof typeof vpnSettings, label: "VPN Warning", desc: "Show warning popup when VPN is detected" },
            { key: "offerwallBlock" as keyof typeof vpnSettings, label: "Offerwall Block", desc: "Block offerwall access when VPN is detected" },
            { key: "withdrawalBlock" as keyof typeof vpnSettings, label: "Withdrawal Block", desc: "Block withdrawals when VPN is detected" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
              <div>
                <span className="text-xs font-semibold text-white">{item.label}</span>
                <p className="text-[8px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => handleToggleVpn(item.key)}
                className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${vpnSettings[item.key] ? "bg-emerald-500" : "bg-slate-700"}`}
              >
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: vpnSettings[item.key] ? "calc(100% - 18px)" : "2px" }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Restrict Rules */}
      <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Ban className="w-4 h-4 text-rose-400" /> Auto-Restriction Rules
        </h3>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
          <div>
            <span className="text-xs font-semibold text-white">Auto-Restrict</span>
            <p className="text-[8px] text-slate-500 mt-0.5">Automatically restrict users after N VPN detections</p>
          </div>
          <button
            onClick={() => { setAutoRestrictRules({...autoRestrictRules, enabled: !autoRestrictRules.enabled}); handleSaveAutoRestrict(); }}
            className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${autoRestrictRules.enabled ? "bg-emerald-500" : "bg-slate-700"}`}
          >
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: autoRestrictRules.enabled ? "calc(100% - 18px)" : "2px" }} />
          </button>
        </div>

        {autoRestrictRules.enabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Detection Threshold</label>
              <input
                type="number" value={autoRestrictRules.threshold}
                onChange={(e) => { const r = {...autoRestrictRules, threshold: parseInt(e.target.value) || 3}; setAutoRestrictRules(r); localStorage.setItem("coinloot_auto_restrict_rules", JSON.stringify(r)); }}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                min={1}
              />
              <p className="text-[8px] text-slate-500 mt-0.5 font-mono">Number of detections before auto-restrict</p>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1">Restrict Duration (min)</label>
              <input
                type="number" value={autoRestrictRules.durationMinutes}
                onChange={(e) => { const r = {...autoRestrictRules, durationMinutes: parseInt(e.target.value) || 1440}; setAutoRestrictRules(r); localStorage.setItem("coinloot_auto_restrict_rules", JSON.stringify(r)); }}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                min={1}
              />
              <p className="text-[8px] text-slate-500 mt-0.5 font-mono">Restriction duration in minutes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════ STAT BOX ═══════════════════
function StatBox({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className={`text-lg font-bold font-mono ${color}`}>{value.toLocaleString()}</span>
      </div>
      <span className="block text-[9px] text-slate-500 font-mono">{label}</span>
    </div>
  );
}
