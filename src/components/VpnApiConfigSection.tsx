import React, { useState, useEffect } from "react";
import { Shield, Key, Globe, Wifi, AlertTriangle, CheckCircle, XCircle, RefreshCw, Save, Server, Clock, Eye, EyeOff, Sliders, Download } from "lucide-react";
import Loader from "./Loader";

interface VpnApiConfigSectionProps {
  showNotif: (type: "success" | "error", message: string) => void;
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

export default function VpnApiConfigSection({ showNotif }: VpnApiConfigSectionProps) {
  const [config, setConfig] = useState<VpnConfig | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    try {
      const resp = await fetch("/api/vpn/config");
      const data = await resp.json();
      setConfig(data);
    } catch {
      showNotif("error", "Failed to load VPN config");
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      showNotif("error", "Please enter an API key");
      return;
    }
    setSaving(true);
    try {
      await fetch("/api/vpn/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      showNotif("success", "API key saved");
      await loadConfig();
      // Auto-test after saving
      await handleTestConnection(apiKeyInput.trim());
    } catch {
      showNotif("error", "Failed to save API key");
    }
    setSaving(false);
  };

  const handleTestConnection = async (key?: string) => {
    setTesting(true);
    try {
      const resp = await fetch("/api/vpn/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key || apiKeyInput.trim() || undefined }),
      });
      const data = await resp.json();
      if (data.success) {
        showNotif("success", "✅ Connection Successful! API key is valid.");
      } else {
        showNotif("error", `❌ ${data.error || "Invalid API Key"}`);
      }
      await loadConfig();
    } catch {
      showNotif("error", "Failed to test connection");
    }
    setTesting(false);
  };

  const handleToggleDetection = async (enabled: boolean) => {
    try {
      await fetch("/api/vpn/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      showNotif("success", `VPN detection ${enabled ? "enabled" : "disabled"}`);
      await loadConfig();
    } catch {
      showNotif("error", "Failed to update setting");
    }
  };

  const handleSensitivityChange = async (sensitivity: number) => {
    try {
      await fetch("/api/vpn/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensitivity }),
      });
      setConfig((prev) => prev ? { ...prev, sensitivity } : prev);
    } catch { /* */ }
  };

  const handleTimeoutChange = async (timeout: number) => {
    try {
      await fetch("/api/vpn/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeout }),
      });
      setConfig((prev) => prev ? { ...prev, timeout } : prev);
    } catch { /* */ }
  };

  const handleProviderChange = async (selectedProvider: string) => {
    try {
      await fetch("/api/vpn/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedProvider }),
      });
      showNotif("success", `Provider changed to ${selectedProvider}`);
      await loadConfig();
    } catch {
      showNotif("error", "Failed to change provider");
    }
  };

  if (!config) {
    return (
      <div className="bg-slate-950/40 p-8 rounded-3xl border border-white/5 text-center">
        <p className="text-xs text-slate-500 font-mono">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" /> VPN & Proxy Detection</h2>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Configure VPN/Proxy detection providers and API keys</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold border ${config.status === "connected" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : config.status === "error" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-800/60 text-slate-400 border-white/5"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.status === "connected" ? "bg-emerald-400" : config.status === "error" ? "bg-rose-400" : "bg-slate-400"}`} />
            {config.status === "connected" ? "Connected" : config.status === "error" ? "Error" : "Not Connected"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

        {/* API Configuration */}
        <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2"><Key className="w-4 h-4 text-amber-400" /> API Configuration</h3>

          {/* Provider Selector */}
          <div>
            <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1.5">Provider</label>
            <select
              value={config.selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
            >
              {config.providers.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.enabled}>
                  {p.name} {!p.enabled ? "(coming soon)" : ""}
                </option>
              ))}
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
                placeholder={config.hasKey ? "Enter new key to replace existing one" : "Enter ProxyCheck.io API key"}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 pr-20 text-xs text-white font-mono placeholder-slate-600"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-white transition-all cursor-pointer"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {config.hasKey && (
              <p className="text-[8px] text-emerald-400 font-mono mt-1">Key is configured (hidden for security)</p>
            )}
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
              onClick={() => handleTestConnection()}
              disabled={testing}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-[10px] font-bold hover:border-cyan-500/20 hover:text-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              {testing ? <Loader size="xs" /> : <RefreshCw className="w-3 h-3" />}
              Test Connection
            </button>
          </div>

          {/* Status Info */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Status</span>
              <span className={`font-bold ${config.status === "connected" ? "text-emerald-400" : config.status === "error" ? "text-rose-400" : "text-slate-400"}`}>
                {config.status === "connected" ? "Connected" : config.status === "error" ? "Disconnected" : "Not Configured"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Key Configured</span>
              <span className={config.hasKey ? "text-emerald-400" : "text-slate-400"}>{config.hasKey ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Last Checked</span>
              <span className="text-slate-300">{config.lastChecked ? new Date(config.lastChecked).toLocaleString() : "Never"}</span>
            </div>
          </div>
        </div>

        {/* Detection Settings */}
        <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2"><Sliders className="w-4 h-4 text-purple-400" /> Detection Settings</h3>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <div>
              <span className="text-xs font-semibold text-white">Enable Detection</span>
              <p className="text-[8px] text-slate-500 mt-0.5">Real-time VPN/Proxy detection for all non-admin users</p>
            </div>
            <button
              onClick={() => handleToggleDetection(!config.enabled)}
              className={`relative w-10 h-5 rounded-full transition-all shrink-0 cursor-pointer ${config.enabled ? "bg-emerald-500" : "bg-slate-700"}`}
            >
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: config.enabled ? "calc(100% - 18px)" : "2px" }} />
            </button>
          </div>

          {/* Sensitivity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-mono">Detection Sensitivity</span>
              <span className="text-[10px] font-mono text-cyan-400">{config.sensitivity}/100</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={config.sensitivity}
              onChange={(e) => handleSensitivityChange(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[8px] text-slate-600 font-mono mt-0.5">
              <span>Low (1)</span>
              <span>High (100)</span>
            </div>
            <p className="text-[8px] text-slate-500 mt-1 font-mono">Lower values detect more, higher values are stricter</p>
          </div>

          {/* Timeout */}
          <div>
            <label className="text-[9px] text-slate-500 uppercase font-mono block mb-1.5">Request Timeout (ms)</label>
            <select
              value={config.timeout}
              onChange={(e) => handleTimeoutChange(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
            >
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={15000}>15 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
          </div>

          {/* Provider Info */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
            <h4 className="text-[10px] font-bold text-white mb-2 flex items-center gap-1.5"><Server className="w-3 h-3 text-cyan-400" /> Available Providers</h4>
            <div className="space-y-1.5">
              {config.providers.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-[9px] font-mono">
                  <span className={`${p.enabled ? "text-slate-300" : "text-slate-600"}`}>{p.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold ${p.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800/60 text-slate-500"}`}>
                    {p.enabled ? "Available" : "Coming Soon"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detection checks info */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-cyan-500/10">
            <h4 className="text-[10px] font-bold text-cyan-400 mb-1.5 flex items-center gap-1.5"><Wifi className="w-3 h-3" /> Detection Points</h4>
            <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> Registration</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> Login</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> Dashboard Access</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> Withdrawal</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> Offer Completion</span>
              <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5 text-cyan-400" /> Admin Bypass</span>
            </div>
          </div>
        </div>

        {/* Detection Log Info */}
        <div className="lg:col-span-2 bg-slate-950/40 p-5 rounded-3xl border border-white/5">
          <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400" /> Detection Data Points</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[9px] font-mono">
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
          <p className="text-[9px] text-slate-500 font-mono mt-3">All detection data is stored server-side. API keys are never exposed to the frontend.</p>
        </div>
      </div>
    </div>
  );
}