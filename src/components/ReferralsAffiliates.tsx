import { useState } from "react";
import { 
  Users, Award, TrendingUp, Link2, Copy, BarChart3, Star, BadgePercent, ChevronRight 
} from "lucide-react";
import { UserProfile, ReferrerRewardLog } from "../types";

interface ReferralsAffiliatesProps {
  user: UserProfile;
}

export default function ReferralsAffiliates({ user }: ReferralsAffiliatesProps) {
  const [copied, setCopied] = useState(false);
  
  const refCode = `COINL_REF_${user.username.toUpperCase()}`;
  const referralLink = `${window.location.origin}/signup?ref=${refCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock multilevel referrals counts
  const levelsData = [
    { level: 1, percent: "10%", label: "Direct recruits", count: user.referrals_count || 12, coinsAwarded: 1450 },
    { level: 2, percent: "5%", label: "Second-tier orbits", count: Math.round((user.referrals_count || 12) * 2.5), coinsAwarded: 890 },
    { level: 3, percent: "2%", label: "Third-tier dimensions", count: Math.round((user.referrals_count || 12) * 5.2), coinsAwarded: 420 }
  ];

  // Mock affiliate recruiters leaderboards
  const recruitersRankings = [
    { rank: 1, name: "VoidCruiser99", recruits: 480, pointsAwarded: "98,400 coins" },
    { rank: 2, name: "CosmicGamer", recruits: 320, pointsAwarded: "54,200 coins" },
    { rank: 3, name: "StellarHacks", recruits: 210, pointsAwarded: "32,900 coins" },
    { rank: 4, name: "Torox_King", recruits: 148, pointsAwarded: "19,500 coins" }
  ];

  return (
    <section className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-sans font-bold text-3xl tracking-tight text-white flex items-center gap-2">
          Affiliate Portal
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Build your galactic network empire. Receive rewards from tier 1, tier 2, and tier 3 referrals instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recruitment link & metrics helper (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking control block */}
          <div className="glass rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-[50px] rounded-full" />
            <h3 className="font-sans font-bold text-base text-white mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-cyan-400" />
              Recruitment tracking matrix link
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Distribute this custom encrypted link on forums, telegram threads, or blogs. Any player joining logs automatically to your multilevel network.
            </p>

            <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-white/5 items-center justify-between">
              <span className="text-xs font-mono text-cyan-300 pl-4 select-all truncate max-w-xs md:max-w-md">
                {referralLink}
              </span>

              <button
                onClick={copyToClipboard}
                className="px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold font-sans text-xs tracking-wide hover:bg-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? "Copied Link!" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Multilevel tiers specs info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {levelsData.map((tier) => (
              <div
                key={tier.level}
                className="p-5 rounded-2xl glass flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <span className="text-xs font-mono font-bold text-purple-400">Tiers Level {tier.level}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[9px] border border-emerald-500/20">
                      +{tier.percent}
                    </span>
                  </div>
                  <h4 className="font-sans font-semibold text-sm text-white">{tier.label}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Recruits: {tier.count} nodes</p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-end justify-between font-mono">
                  <span className="text-[9px] text-slate-500 uppercase leading-none">Coins Claimed</span>
                  <span className="text-sm font-bold text-white leading-none">+{tier.coinsAwarded.toLocaleString()}c</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recruiters stats visualization charts mock */}
          <div className="glass rounded-3xl p-6">
            <h3 className="font-sans font-bold text-base text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Recruit Velocity & Converter Index
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: "Active Recruit nodes", val: levelsData[0].count + levelsData[1].count + levelsData[2].count, color: "text-white" },
                { label: "Commission rates", val: "10% / 5% / 2%", color: "text-cyan-400" },
                { label: "Cumulative coin payouts", val: "2,760 coins", color: "text-purple-400" },
                { label: "Recruit multiplier tier", val: "Bronze Node", color: "text-pink-400" }
              ].map((metric, idx) => (
                <div key={idx} className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl">
                  <span className="block text-[9px] text-slate-500 font-mono uppercase leading-snug">{metric.label}</span>
                  <span className={`block text-sm font-bold mt-1 tracking-tight ${metric.color}`}>{metric.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Affiliate Recruiters Leaderboards Panel (1 Column) */}
        <div>
          <div className="glass rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400 animate-pulse" />
                Elite Affiliates Leaderboard
              </h3>
            </div>

            <div className="space-y-3">
              {recruitersRankings.map((rec) => (
                <div
                  key={rec.rank}
                  className="bg-slate-900/40 border border-white/5 hover:border-cyan-500/10 p-3.5 rounded-2xl flex items-center justify-between transition-colors font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                      rec.rank === 1
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : rec.rank === 2
                        ? "bg-slate-400/20 text-slate-300 border border-slate-400/30"
                        : rec.rank === 3
                        ? "bg-amber-700/20 text-amber-500 border border-amber-500/30"
                        : "bg-slate-900 border-white/5 text-slate-500"
                    }`}>
                      #{rec.rank}
                    </span>
                    <div>
                      <span className="font-sans font-semibold text-slate-200 block">{rec.name}</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">{rec.recruits} Recruits</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-white">{rec.pointsAwarded}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl text-[11px] text-purple-300 leading-normal text-center">
              ⭐ Monthly recruiters win a share of the **250,000 Coins bonus pool**! Target resets in 12 Земля days.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
