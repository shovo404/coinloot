import { ShieldCheck, Fingerprint, AlertTriangle, CheckCircle, Smartphone, Lock, Globe } from "lucide-react";
import { UserProfile } from "../types";

interface SecuritySettingsPageProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
}

export default function SecuritySettingsPage({ user, setUser }: SecuritySettingsPageProps) {
  const securityItems = [
    {
      icon: ShieldCheck,
      label: "KYC Verification",
      value: user.kyc_status,
      color: user.kyc_status === "APPROVED" ? "text-emerald-400" : user.kyc_status === "PENDING" ? "text-amber-400" : "text-slate-400",
      bg: user.kyc_status === "APPROVED" ? "bg-emerald-500/10" : user.kyc_status === "PENDING" ? "bg-amber-500/10" : "bg-slate-900/40",
      border: user.kyc_status === "APPROVED" ? "border-emerald-500/20" : user.kyc_status === "PENDING" ? "border-amber-500/20" : "border-white/5",
    },
    {
      icon: AlertTriangle,
      label: "VPN / Proxy Detection",
      value: user.vpn_detected ? "DETECTED" : "CLEAN",
      color: user.vpn_detected ? "text-rose-400" : "text-emerald-400",
      bg: user.vpn_detected ? "bg-rose-500/10" : "bg-emerald-500/10",
      border: user.vpn_detected ? "border-rose-500/20" : "border-emerald-500/20",
    },
  ];

  return (
    <div className="px-4 lg:px-8 py-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Security Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account security and verification status.</p>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {securityItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className={`${item.bg} ${item.border} border rounded-2xl p-5 space-y-4 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.bg} ${item.border} border`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-sans font-semibold text-sm text-white">{item.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Status</span>
                <span className={`text-sm font-bold ${item.color} flex items-center gap-1.5`}>
                  {item.value === "APPROVED" || (item.value === "CLEAN" && !user.vpn_detected) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {item.value}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Status managed by admin panel only</p>
            </div>
          );
        })}
      </div>

      {/* Device Details */}
      <div className="rounded-3xl p-6 space-y-5 bg-slate-900/70 backdrop-blur-md border border-white/5">
        <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" /> Device & Session Info
        </h3>
        <div className="space-y-4">
          {[
            { label: "Device Fingerprint", value: user.device_fingerprint, icon: Fingerprint, color: "text-cyan-400" },
            { label: "Account ID", value: user.id, icon: Lock, color: "text-purple-400" },
            { label: "Current Session", value: "Active — " + new Date().toLocaleDateString(), icon: Globe, color: "text-emerald-400" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-900/60 border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>
                <span className="text-xs font-mono text-white truncate max-w-[200px]" title={item.value}>{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Tips */}
      <div className="p-5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl space-y-3 backdrop-blur-sm">
        <h4 className="font-sans font-semibold text-sm text-cyan-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Security Tips
        </h4>
        <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
          <li className="flex items-start gap-2">• Never share your password or verification codes with anyone.</li>
          <li className="flex items-start gap-2">• Use a strong, unique password for your CoinLoot account.</li>
          <li className="flex items-start gap-2">• Enable KYC verification to unlock higher withdrawal limits.</li>
          <li className="flex items-start gap-2">• Disable VPN/Proxy services when using CoinLoot to avoid account restrictions.</li>
        </ul>
      </div>
    </div>
  );
}
