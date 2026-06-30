import { useState, useEffect } from "react";
import { Trophy, Medal, Crown, CheckCircle, Globe } from "lucide-react";
import { UserProfile } from "../types";
import { getLeaderboard } from "../lib/supabaseService";
import Loader from "./Loader";

export default function LeaderboardPodium() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    const data = await getLeaderboard(100);
    setProfiles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Sort by total_earned_coins descending (all-time ranking)
  const sorted = [...profiles].sort((a, b) => (b.total_earned_coins || 0) - (a.total_earned_coins || 0));
  const top3 = sorted.slice(0, 3);
  const remaining = sorted.slice(3);

  // Podium layout: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0], null]
    : top3.length === 1
    ? [null, top3[0], null]
    : [null, null, null];

  return (
    <section className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-sans font-bold text-3xl tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            All-Time Leaderboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Top earners ranked by total coins earned. Real platform data. Updated every 30s.
          </p>
        </div>

        {/* All-Time badge */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 text-cyan-300">
          <Globe className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wide">All-Time</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" text="Loading leaderboard" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Trophy className="w-16 h-16 text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-400 mb-2">No rankings yet</h3>
          <p className="text-sm text-slate-500 max-w-md">Start completing offers and surveys to appear on the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* ═══ PODIUM TOP 3 ═══ */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 max-w-2xl mx-auto gap-2 sm:gap-4 items-end pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-white/5">
              {/* 2nd Place */}
              {podiumOrder[0] ? (
                <LeaderPodiumItem user={podiumOrder[0]} rank={2} />
              ) : <div />}

              {/* 1st Place */}
              {podiumOrder[1] ? (
                <LeaderPodiumItem user={podiumOrder[1]} rank={1} />
              ) : <div />}

              {/* 3rd Place */}
              {podiumOrder[2] ? (
                <LeaderPodiumItem user={podiumOrder[2]} rank={3} />
              ) : <div />}
            </div>
          )}

          {/* ═══ REMAINING USERS LIST ═══ */}
          {remaining.length > 0 && (
            <div className="max-w-2xl mx-auto space-y-3">
              {remaining.slice(0, 50).map((item, index) => {
                const rank = index + 4;
                const displayLevel = item.level || 1;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-cyan-500/20 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 border border-white/5 text-slate-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                        #{rank}
                      </span>
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/5">
                        {item.avatar_url ? (
                          <img
                            src={item.avatar_url}
                            alt={item.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback = target.nextElementSibling;
                              if (fallback) fallback.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        {(!item.avatar_url) && (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-600/20 text-white font-bold text-sm">
                            {item.username[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        {/* Hidden fallback for image error */}
                        <div className="hidden w-full h-full items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-600/20 text-white font-bold text-sm">
                          {item.username[0]?.toUpperCase() || "?"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-sans font-semibold text-slate-200 text-sm truncate">{item.username}</span>
                          {/* Blue Verification Badge for KYC-approved users */}
                          {item.kyc_status === "APPROVED" && (
                            <span title="Verified">
                              <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">Level {displayLevel}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="font-sans font-bold text-white block text-sm tabular-nums">{(item.total_earned_coins || 0).toLocaleString()} coins</span>
                        <span className="text-[9px] text-slate-400 font-mono">≈ ${((item.total_earned_coins || 0) / 1000).toFixed(2)} USD</span>
                      </div>

                      <div className="text-center bg-purple-950/20 border border-purple-500/10 rounded-lg px-2.5 py-1 min-w-[50px]">
                        <span className="text-[10px] text-purple-400 font-bold uppercase leading-none block">LV {displayLevel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ─── Podium Item for Top 3 ───
function LeaderPodiumItem({ user, rank }: { user: UserProfile; rank: number }) {
  const displayLevel = user.level || 1;
  const coins = user.total_earned_coins || 0;
  const heights = { 1: "h-36", 2: "h-28", 3: "h-24" };
  const rankConfig = {
    1: { 
      bg: "bg-gradient-to-t from-cyan-950/20 via-slate-900/50 to-purple-950/20", 
      border: "border-cyan-500/20 hover:border-cyan-400/40", 
      shadow: "shadow-[0_0_20px_rgba(6,182,212,0.1)]", 
      number: "bg-yellow-500 text-slate-950 border-yellow-400/50", 
      medal: "text-yellow-400",
      avatarSize: "w-12 h-12 sm:w-14 sm:h-14",
      avatarRing: "ring-2 ring-yellow-400/50",
      titleSize: "text-sm text-white",
    },
    2: { 
      bg: "bg-slate-900/60", 
      border: "border-white/5 hover:border-cyan-500/10", 
      shadow: "shadow-lg", 
      number: "bg-slate-800 text-slate-300 border-slate-500/30", 
      medal: "text-slate-300",
      avatarSize: "w-10 h-10 sm:w-12 sm:h-12",
      avatarRing: "ring-1 ring-white/10",
      titleSize: "text-xs text-slate-200",
    },
    3: { 
      bg: "bg-slate-900/60", 
      border: "border-white/5 hover:border-cyan-500/10", 
      shadow: "shadow-lg", 
      number: "bg-slate-800 text-amber-600 border-amber-600/30", 
      medal: "text-amber-600",
      avatarSize: "w-10 h-10 sm:w-12 sm:h-12",
      avatarRing: "ring-1 ring-white/10",
      titleSize: "text-xs text-slate-200",
    },
  };
  const cfg = rankConfig[rank as keyof typeof rankConfig];

  return (
    <div className="flex flex-col items-center group">
      {/* Avatar */}
      <div className={`${rank === 1 ? "animate-bounce [animation-duration:3.5s]" : "animate-pulse"}`}>
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            className={`${cfg.avatarSize} rounded-full object-cover ${cfg.avatarRing}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling;
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : null}
        {!user.avatar_url && (
          <div className={`${cfg.avatarSize} rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-white font-bold text-lg mx-auto ${cfg.avatarRing}`}>
            {user.username[0]?.toUpperCase() || "?"}
          </div>
        )}
        {/* Hidden fallback for image error */}
        <div className={`hidden ${cfg.avatarSize} rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-white font-bold text-lg mx-auto ${cfg.avatarRing}`}>
          {user.username[0]?.toUpperCase() || "?"}
        </div>
      </div>

      {/* Username & Verification */}
      <div className="flex items-center gap-1 max-w-[120px] mt-1">
        <span className={`font-sans font-bold ${cfg.titleSize} truncate`}>{user.username}</span>
        {user.kyc_status === "APPROVED" && (
          <span title="Verified">
            <CheckCircle className={`${rank === 1 ? "w-4 h-4" : "w-3 h-3"} text-blue-400 shrink-0`} />
          </span>
        )}
      </div>

      <span className={`text-[10px] font-mono font-bold uppercase mt-0.5 ${rank === 1 ? "text-cyan-400" : "text-purple-400"}`}>LV {displayLevel}</span>
      <span className={`font-mono font-bold mt-1 mb-3 ${rank === 1 ? "text-sm text-yellow-400" : "text-xs text-slate-400"}`}>{coins.toLocaleString()}c</span>

      {/* Podium block */}
      <div className={`w-full ${cfg.bg} border ${cfg.border} ${cfg.shadow} rounded-t-2xl ${rank === 1 ? "rounded-t-3xl" : ""} flex flex-col justify-center items-center ${heights[rank as keyof typeof heights]} relative transition-all`}>
        <span className={`absolute top-3 w-7 h-7 ${rank === 1 ? "w-8 h-8" : ""} rounded-full ${cfg.number} flex items-center justify-center border font-bold text-xs ${rank === 1 ? "animate-pulse text-sm" : ""}`}>{rank}</span>
        {rank === 1 ? (
          <Crown className={`w-8 h-8 ${cfg.medal} mt-6 animate-pulse`} />
        ) : (
          <Medal className={`w-6 h-6 ${cfg.medal} mt-6`} />
        )}
      </div>
    </div>
  );
}
