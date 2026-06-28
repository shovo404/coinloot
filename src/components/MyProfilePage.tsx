import { User, ShieldCheck, Calendar, MapPin, Award, Coins, DollarSign, Users, CheckCircle, Fingerprint, Globe } from "lucide-react";
import { UserProfile } from "../types";
import LevelProgress from "./LevelProgress";
import { calcLevel } from "../utils/levelSystem";

interface MyProfilePageProps {
  user: UserProfile;
}

export default function MyProfilePage({ user }: MyProfilePageProps) {
  const joinDate = new Date("2025-11-14").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const profileFields = [
    { label: "Username", value: user.username, icon: User, color: "text-cyan-400" },
    { label: "User ID", value: user.id, icon: Fingerprint, color: "text-purple-400" },
    { label: "Email", value: user.email, icon: Globe, color: "text-cyan-400" },
    { label: "Join Date", value: joinDate, icon: Calendar, color: "text-purple-400" },
    { label: "Country", value: "Bangladesh", icon: MapPin, color: "text-cyan-400" },
  ];

  const statsGrid = [
    { label: "Current Level", value: `LVL ${calcLevel(user.balance_coins)}`, sub: `${user.xp} total XP`, icon: Award, color: "text-purple-400", bg: "from-purple-500/10 to-pink-500/10", border: "border-purple-500/20" },
    { label: "Total Coins Earned", value: `${user.total_earned_coins.toLocaleString()}c`, sub: `≈ $${(user.total_earned_coins / 1000).toFixed(2)} USD`, icon: Coins, color: "text-cyan-400", bg: "from-cyan-500/10 to-blue-500/10", border: "border-cyan-500/20" },
    { label: "Total Withdrawals", value: `$${user.total_withdrawn_usd.toFixed(2)}`, sub: `${user.total_withdrawn_usd > 0 ? "Paid out" : "No withdrawals yet"}`, icon: DollarSign, color: "text-emerald-400", bg: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/20" },
    { label: "Referral Count", value: `${user.referrals_count}`, sub: `${user.referrals_count === 1 ? "1 recruit" : `${user.referrals_count} recruits`}`, icon: Users, color: "text-amber-400", bg: "from-amber-500/10 to-orange-500/10", border: "border-amber-500/20" },
  ];

  return (
    <div className="px-4 lg:px-8 py-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-3">
          <User className="w-6 h-6 text-cyan-400" />
          My Profile
        </h1>
        <p className="text-slate-400 text-sm mt-1">Your account overview and statistics.</p>
      </div>

      {/* Profile Identity Card */}
      <div className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-4xl sm:text-5xl shadow-lg shadow-cyan-500/20 shrink-0 overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span>{user.username[0].toUpperCase()}</span>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="font-sans font-bold text-2xl sm:text-3xl text-white">{user.username}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                {user.kyc_status === "APPROVED" ? "✓ KYC Verified" : user.kyc_status === "PENDING" ? "⏳ KYC Pending" : "KYC Not Started"}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                {user.vpn_detected ? "⚠️ VPN Detected" : "🛡️ Secure Connection"}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Info Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profileFields.map((field, i) => {
            const Icon = field.icon;
            return (
              <div key={i} className="bg-slate-900/70 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/5 border border-white/5 ${field.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">{field.label}</span>
                  <span className="block text-sm font-semibold text-white truncate max-w-[200px]" title={field.value}>{field.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Level Progress */}
      <LevelProgress user={user} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {statsGrid.slice(1).map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`bg-gradient-to-br ${stat.bg} border ${stat.border} rounded-2xl p-5 relative overflow-hidden group hover:border-opacity-50 transition-all`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <div className="text-xl sm:text-2xl font-bold text-white mt-1">{stat.value}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{stat.sub}</div>
                </div>
                <Icon className={`w-8 h-8 ${stat.color} opacity-50 group-hover:opacity-80 transition-opacity`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Status */}
      <div className="glass rounded-3xl p-6">
        <h3 className="font-sans font-bold text-base text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Account Security
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "KYC Status", value: user.kyc_status, status: user.kyc_status === "APPROVED" ? "text-emerald-400" : user.kyc_status === "PENDING" ? "text-amber-400" : "text-slate-400" },
            { label: "VPN Detection", value: user.vpn_detected ? "Detected" : "Clean", status: user.vpn_detected ? "text-rose-400" : "text-emerald-400" },
            { label: "Account Status", value: "Active", status: "text-emerald-400" },
            { label: "Device ID", value: user.device_fingerprint.slice(0, 12) + "...", status: "text-cyan-400" },
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-xl p-4 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase">{item.label}</span>
              <span className={`block text-xs font-bold mt-1 ${item.status}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
