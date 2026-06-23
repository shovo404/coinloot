import { useState } from "react";
import { Award, Trophy, Star, TrendingUp, Calendar, Globe, Medal } from "lucide-react";

export default function LeaderboardPodium() {
  const [leaderboardTab, setLeaderboardTab] = useState<"weekly" | "monthly" | "alltime">("weekly");

  // Mock datasets mapping rankings
  const leaderboardData = {
    weekly: [
      { rank: 1, name: "Neutron_Slayer", level: 54, coins: 189500, avatar: "🛸" },
      { rank: 2, name: "VoidWalker", level: 42, coins: 142000, avatar: "🪐" },
      { rank: 3, name: "CosmicGamer", level: 31, coins: 112500, avatar: "🌌" },
      { rank: 4, name: "ToroxMaster", level: 24, coins: 94800, avatar: "📡" },
      { rank: 5, name: "Bit_General", level: 19, coins: 72000, avatar: "🚀" },
      { rank: 6, name: "StellarHacks", level: 15, coins: 54100, avatar: "🛰️" }
    ],
    monthly: [
      { rank: 1, name: "VoidWalker", level: 42, coins: 692000, avatar: "🪐" },
      { rank: 2, name: "Neutron_Slayer", level: 54, coins: 581000, avatar: "🛸" },
      { rank: 3, name: "SpaceMinerX", level: 39, coins: 495000, avatar: "💎" },
      { rank: 4, name: "CosmicGamer", level: 31, coins: 382000, avatar: "🌌" },
      { rank: 5, name: "GalaxyGoon", level: 27, coins: 290000, avatar: "☄️" },
      { rank: 6, name: "SolarWind", level: 22, coins: 215000, avatar: "☀️" }
    ],
    alltime: [
      { rank: 1, name: "Genesis_Looter", level: 98, coins: 4890000, avatar: "👑" },
      { rank: 2, name: "NebulaGod", level: 81, coins: 3200000, avatar: "⭐" },
      { rank: 3, name: "VoidWalker", level: 42, coins: 2100000, avatar: "🪐" },
      { rank: 4, name: "Neutron_Slayer", level: 54, coins: 1940000, avatar: "🛸" },
      { rank: 5, name: "CosmicGamer", level: 31, coins: 1450000, avatar: "🌌" },
      { rank: 6, name: "Apollo_Earns", level: 37, coins: 1100000, avatar: "👩‍🚀" }
    ]
  };

  const activeRecords = leaderboardData[leaderboardTab];
  const podiumTop3 = [
    activeRecords[1], // 2nd place
    activeRecords[0], // 1st place
    activeRecords[2]  // 3rd place
  ];

  return (
    <section className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans font-bold text-3xl tracking-tight text-white flex items-center gap-2">
            Orbit Leaderboards
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Analyze the highest earners in the galaxy. Winners of weekly and monthly races secure deep space bonuses.
          </p>
        </div>

        {/* Toggling frequency filter */}
        <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-white/5 items-center justify-between self-start">
          {[
            { id: "weekly", label: "Weekly Run", icon: Calendar },
            { id: "monthly", label: "Monthly Orbit", icon: TrendingUp },
            { id: "alltime", label: "All-Time Galaxy", icon: Globe }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setLeaderboardTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  leaderboardTab === tab.id
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Podium Grid for the top 3 spots */}
      <div className="grid grid-cols-3 max-w-2xl mx-auto gap-2 sm:gap-4 items-end pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-white/5">
        {/* 2nd Place Column */}
        {podiumTop3[0] && (
          <div className="flex flex-col items-center group">
            <div className="text-3xl mb-1 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] animate-pulse">{podiumTop3[0].avatar}</div>
            <span className="font-sans font-bold text-xs text-slate-200 block truncate max-w-[100px]">{podiumTop3[0].name}</span>
            <span className="text-[10px] font-mono text-purple-400 font-bold uppercase mt-0.5">LV {podiumTop3[0].level}</span>
            <span className="text-xs font-mono text-slate-400 font-semibold mt-1 mb-3">{podiumTop3[0].coins.toLocaleString()}c</span>
            <div className="w-full bg-slate-900/60 border border-white/5 group-hover:border-cyan-500/10 rounded-t-2xl flex flex-col justify-center items-center h-28 relative shadow-lg">
              <span className="absolute top-3 w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-500/30 font-bold text-xs">2</span>
              <Medal className="w-6 h-6 text-slate-300 mt-6" />
            </div>
          </div>
        )}

        {/* 1st Place Column */}
        {podiumTop3[1] && (
          <div className="flex flex-col items-center group">
            <div className="text-4xl mb-2 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.3)] animate-bounce [animation-duration:3.5s]">{podiumTop3[1].avatar}</div>
            <span className="font-sans font-bold text-sm text-white block truncate max-w-[120px]">{podiumTop3[1].name}</span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase mt-0.5">LV {podiumTop3[1].level}</span>
            <span className="text-sm font-mono text-yellow-400 font-bold mt-1 mb-3">{podiumTop3[1].coins.toLocaleString()}c</span>
            <div className="w-full bg-gradient-to-t from-cyan-950/20 via-slate-900/50 to-purple-950/20 border border-cyan-500/20 group-hover:border-cyan-400/40 rounded-t-3xl flex flex-col justify-center items-center h-36 relative shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <span className="absolute top-3 w-8 h-8 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center border border-yellow-400/50 font-bold text-sm animate-pulse">1</span>
              <Trophy className="w-8 h-8 text-yellow-400 mt-6 animate-pulse" />
            </div>
          </div>
        )}

        {/* 3rd Place Column */}
        {podiumTop3[2] && (
          <div className="flex flex-col items-center group">
            <div className="text-3xl mb-1 filter drop-shadow-[0_0_8px_rgba(217,119,6,0.2)] animate-pulse">{podiumTop3[2].avatar}</div>
            <span className="font-sans font-bold text-xs text-slate-200 block truncate max-w-[100px]">{podiumTop3[2].name}</span>
            <span className="text-[10px] font-mono text-purple-400 font-bold uppercase mt-0.5">LV {podiumTop3[2].level}</span>
            <span className="text-xs font-mono text-slate-400 font-semibold mt-1 mb-3">{podiumTop3[2].coins.toLocaleString()}c</span>
            <div className="w-full bg-slate-900/60 border border-white/5 group-hover:border-cyan-500/10 rounded-t-2xl flex flex-col justify-center items-center h-24 relative shadow-lg">
              <span className="absolute top-3 w-7 h-7 rounded-full bg-slate-800 text-amber-600 flex items-center justify-center border border-amber-600/30 font-bold text-xs">3</span>
              <Medal className="w-6 h-6 text-amber-600 mt-6" />
            </div>
          </div>
        )}
      </div>

      {/* Ranks list displaying ranks 4-6 and lower */}
      <div className="max-w-2xl mx-auto space-y-3">
        {activeRecords.slice(3).map((item) => (
          <div
            key={item.rank}
            className="p-3.5 rounded-2xl glass hover:neon-border-cyan transition-all flex items-center justify-between gap-4 font-mono text-xs"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-slate-900 border border-white/5 text-slate-400 font-bold flex items-center justify-center text-[10px]">
                #{item.rank}
              </span>
              <span className="text-lg">{item.avatar}</span>
              <div>
                <span className="font-sans font-semibold text-slate-200 block">{item.name}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Global account index updated</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="font-sans font-bold text-white block">{item.coins.toLocaleString()} coins</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Total value: ${(item.coins / 1000).toFixed(2)} USD</span>
              </div>

              <div className="text-center bg-purple-950/20 border border-purple-500/10 rounded-lg px-2 py-1 min-w-[50px]">
                <span className="text-[10px] text-purple-400 font-bold uppercase leading-none block">LV {item.level}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
