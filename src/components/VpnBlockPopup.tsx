import { ShieldAlert, RefreshCw, Globe, Wifi, MapPin, AlertTriangle, Skull } from "lucide-react";
import { VpnCheckResult } from "../utils/vpnDetector";

interface VpnBlockPopupProps {
  result: VpnCheckResult;
  onRetry: () => void;
  onRefresh: () => void;
}

export default function VpnBlockPopup({ result, onRetry, onRefresh }: VpnBlockPopupProps) {
  const isTor = result.detectionType === "TOR Network";
  const isHighFraud = result.fraudScore > 85;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-950 border border-rose-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-rose-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full border flex items-center justify-center ${isTor ? "bg-purple-500/10 border-purple-500/30" : isHighFraud ? "bg-red-500/10 border-red-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
              {isTor ? <Skull className="w-10 h-10 text-purple-400" /> : <ShieldAlert className="w-10 h-10 text-rose-400" />}
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              {isTor ? "TOR Connection Detected" : isHighFraud ? "Suspicious Connection Blocked" : "VPN or Proxy Detected"}
            </h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {isTor
                ? "TOR network access is not permitted. Please disable TOR and refresh to continue."
                : "Please disable your VPN or Proxy connection and refresh the page to continue using CoinLoot."}
            </p>

            <div className="space-y-2 mb-6 text-left">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[10px] font-mono text-slate-400">IP:</span>
                <span className="text-[10px] font-mono text-white">{result.ip || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-[10px] font-mono text-slate-400">Country:</span>
                <span className="text-[10px] font-mono text-white">{result.country || "Unknown"}</span>
                {result.city && <span className="text-[10px] font-mono text-slate-500">, {result.city}</span>}
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                <Wifi className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[10px] font-mono text-slate-400">ISP:</span>
                <span className="text-[10px] font-mono text-white">{result.isp || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-[10px] font-mono text-slate-400">Detection:</span>
                <span className="text-[10px] font-mono text-rose-400 font-bold">{result.detectionType || "VPN/Proxy"}</span>
              </div>
              {result.fraudScore > 0 && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-[10px] font-mono text-slate-400">Fraud Score:</span>
                  <span className="text-[10px] font-mono text-red-400 font-bold">{result.fraudScore}/100</span>
                </div>
              )}
              {result.isTor && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Skull className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-[10px] font-mono text-slate-400">Network:</span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">TOR Exit Node</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onRetry}
                className="flex-1 py-3 rounded-2xl bg-slate-900 border border-white/10 text-slate-300 hover:border-cyan-500/20 hover:text-cyan-400 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Check Again
              </button>
              <button
                onClick={onRefresh}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Page
              </button>
            </div>

            <p className="text-[9px] text-slate-600 font-mono mt-4">
              CoinLoot security requires a clean connection. VPN/proxy/TOR usage violates our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
