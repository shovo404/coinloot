import { Award, TrendingUp } from "lucide-react";
import { UserProfile } from "../types";
import { getLevelTitle, levelProgress, coinsForLevel } from "../utils/levelSystem";

interface LevelProgressProps {
  user: UserProfile;
  compact?: boolean;
}

export default function LevelProgress({ user, compact }: LevelProgressProps) {
  const { current, next, progress } = levelProgress(user.balance_coins);
  const { max } = coinsForLevel(current);
  const nextLevelMin = current < 10 ? coinsForLevel(next).min : max;

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono font-bold text-purple-300">LVL {current}</span>
          <span className="text-[9px] font-mono text-slate-500">{user.balance_coins.toLocaleString()} / {nextLevelMin.toLocaleString()}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 blur-[60px] rounded-full pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Current Level</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {user.balance_coins.toLocaleString()} total coins
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            LVL {current}
          </span>
          <span className="text-sm text-slate-400 font-mono">{getLevelTitle(current)}</span>
        </div>

        {current < 10 && (
          <>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 mt-4">
              <span>{user.balance_coins.toLocaleString()} / {nextLevelMin.toLocaleString()} Coins</span>
              <span className="flex items-center gap-1 text-purple-300">
                <TrendingUp className="w-3 h-3" />
                Next: LVL {next}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </>
        )}

        {current >= 10 && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 inline-block">
            <span className="text-xs font-bold text-cyan-400">MAX LEVEL — Cosmic Mogul</span>
          </div>
        )}
      </div>
    </div>
  );
}
