import React, { useState, useEffect } from "react";
import { 
  Sparkles, Gift, Flame, Trophy, Coins, CheckCircle, Bell, ArrowRight, Twitter, 
  Send as TelegramIcon, ShieldCheck, Mail, Calendar, Trash
} from "lucide-react";
import { UserProfile } from "../types";
import { isDeveloperMode } from "./DeveloperModeBanner";
import { playCoinSound } from "../utils/coinSound";
import { 
  checkLevelRequirement
} from "../utils/rewardsConfig";
import { useAppRealtimeState } from "../hooks/useAppRealtimeState";
import { savePromoCodes as savePromoCodesDb } from "../lib/adminDb";

interface RewardsStoreProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  onRewardEarned: (coins: number, sourceName: string, message?: string, xpGained?: number) => void;
}

interface SocialReward {
  id: string;
  name: string;
  payout: number;
  icon: string;
  link: string;
  completed: boolean;
}

export default function RewardsStore({ user, setUser, onRewardEarned }: RewardsStoreProps) {
  const { state } = useAppRealtimeState();
  const bountyConfig = state.rewardsConfig.socialBounty;
  const challengeConfig = state.rewardsConfig.weeklyChallenge;
  const globalPromo = state.globalPromo;

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  const [dailyStreakProgress, setDailyStreakProgress] = useState([
    { day: 1, reward: 50, claimed: true },
    { day: 2, reward: 100, claimed: true },
    { day: 3, reward: 150, claimed: true }, // userProfile has streak_days: 3 already!
    { day: 4, reward: 200, claimed: false },
    { day: 5, reward: 250, claimed: false },
    { day: 6, reward: 300, claimed: false },
    { day: 7, reward: 500, claimed: false },
  ]);

  const [socialRewards, setSocialRewards] = useState<SocialReward[]>([
    { id: "soc-1", name: "Follow Coin Loot on Twitter / X", payout: 250, icon: "🐦", link: "https://twitter.com", completed: false },
    { id: "soc-2", name: "Join Cosmic Telegram Base", payout: 250, icon: "📢", link: "https://telegram.org", completed: false },
    { id: "soc-3", name: "Subscribe to Youtube Feed Vector", payout: 500, icon: "📹", link: "https://youtube.com", completed: false },
  ]);

  const [weeklyClaimed, setWeeklyClaimed] = useState(false);

  // Claim Streak handler
  const claimStreakDay = (dayIndex: number) => {
    if (isDeveloperMode()) return;
    const day = dailyStreakProgress[dayIndex];
    if (day.claimed) return;

    // Check if user is eligible for this specific day
    const activeStreakCount = user.streak_days;
    if (day.day !== activeStreakCount + 1) {
      alert(`Error: You must complete previous streak days! Your active checked-in consecutive count is ${activeStreakCount}.`);
      return;
    }

    const pay = day.reward;

    setUser({
      ...user,
      streak_days: day.day,
    });

    const updated = [...dailyStreakProgress];
    updated[dayIndex].claimed = true;
    setDailyStreakProgress(updated);

    playCoinSound();
    onRewardEarned(pay, `Daily Streak`, `Day ${day.day} streak reward claimed! +${pay.toLocaleString()} coins.`, 100);
    alert(`Success! Multiplier Day ${day.day} verified. +${pay} coins accrued!`);
  };

  // Submit Promo Code
  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeveloperMode()) { setPromoError("Promo codes are temporarily disabled."); return; }
    setPromoError("");
    setPromoSuccess("");

    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    // Load admin-created promo codes from context (synced with Supabase)
    const adminCodes: any[] = state.promoCodes;

    // Check hardcoded codes as fallback
    const hardcodedCodes: Record<string, number> = { "NITRO2026": 250, "COINLOOT": 250, "BONUS500": 500 };

    if (adminCodes.length > 0) {
      const match = adminCodes.find((c) => c.code === code && c.active);
      if (!match) {
        setPromoError("Invalid or expired promo code.");
        return;
      }
      if (new Date(match.expiresAt) < new Date()) {
        setPromoError("This promo code has expired.");
        return;
      }
      if (match.currentUses >= match.maxUses) {
        setPromoError("This promo code has reached its maximum usage limit.");
        return;
      }
      // Check if user already claimed this code
      const claimed: string[] = JSON.parse(localStorage.getItem("coinloot_claimed_promos") || "[]");
      if (claimed.includes(code)) {
        setPromoError("You have already redeemed this promo code.");
        return;
      }
      const payout = match.coins;
      claimed.push(code);
      localStorage.setItem("coinloot_claimed_promos", JSON.stringify(claimed));
      // Update usage count
      match.currentUses += 1;
      localStorage.setItem("coinloot_promo_codes", JSON.stringify(adminCodes));
      savePromoCodesDb(adminCodes).catch(err => console.warn("[PromoCodes] DB sync failed:", err));
      playCoinSound();
      onRewardEarned(payout, "Promo Code", `Promo code "${code}" redeemed! +${payout.toLocaleString()} coins credited.`);
      setPromoSuccess(`Success! Promo code verified: +${payout} coins!`);
      setPromoCodeInput("");
    } else if (hardcodedCodes[code] !== undefined) {
      const claimed: string[] = JSON.parse(localStorage.getItem("coinloot_claimed_promos") || "[]");
      if (claimed.includes(code)) {
        setPromoError("This voucher protocol has already been used on your terminal device.");
        return;
      }
      const payout = hardcodedCodes[code];
      claimed.push(code);
      localStorage.setItem("coinloot_claimed_promos", JSON.stringify(claimed));
      playCoinSound();
      onRewardEarned(payout, "Promo Code", `Promo code "${code}" redeemed! +${payout.toLocaleString()} coins credited.`);
      setPromoSuccess(`Success! Promo code verified: +${payout} coins!`);
      setPromoCodeInput("");
    } else {
      // Check global notification promo code
      const globalCode = globalPromo.promoCode || "";
      const globalEnabled = globalPromo.promoEnabled || false;
      const globalCoins = globalPromo.promoCoins || 0;
      const globalDurationSec = globalPromo.promoDuration || 0;
      if (globalEnabled && globalCode && code === globalCode.toUpperCase() && globalCoins > 0) {
        const claimed: string[] = JSON.parse(localStorage.getItem("coinloot_claimed_promos") || "[]");
        if (claimed.includes(code)) {
          setPromoError("You have already redeemed this promo code.");
          return;
        }
        // Check expiry
        const startRaw = localStorage.getItem("coinloot_global_notif_promo_start");
        if (startRaw && globalDurationSec > 0) {
          const ms = globalDurationSec * 1000;
          if (Date.now() >= parseInt(startRaw) + ms) {
            setPromoError("This promo code has expired.");
            return;
          }
        }
        const payout = globalCoins;
        claimed.push(code);
        localStorage.setItem("coinloot_claimed_promos", JSON.stringify(claimed));
        playCoinSound();
        onRewardEarned(payout, "Promo Code", `Promo code "${code}" redeemed! +${payout.toLocaleString()} coins credited.`);
        setPromoSuccess(`Success! Promo code verified: +${payout} coins!`);
        setPromoCodeInput("");
      } else {
        setPromoError("Invalid code. Enter a valid promo code.");
      }
    }
  };

  // Claim Weekly chest
  const claimWeeklyChest = () => {
    if (isDeveloperMode()) return;
    if (weeklyClaimed) return;
    
    const levelCheck = checkLevelRequirement(user.level, challengeConfig.required_level);
    if (!levelCheck.passed) {
      alert(`Error: ${levelCheck.message} Complete surveys and tasks to level up!`);
      return;
    }

    setWeeklyClaimed(true);
    const payout = challengeConfig.reward_coins;
    const bonusPayout = challengeConfig.bonus_coins;
    const totalPayout = payout + bonusPayout;

    playCoinSound();
    onRewardEarned(totalPayout, "Weekly Elite Chest", `Weekly elite chest opened! +${totalPayout.toLocaleString()} coins credited.`, 250);
    alert(`Chest unlocked! Gained +${totalPayout.toLocaleString()} Coins and premium orbital badges!`);
  };

  // Claim Social reward
  const claimSocialBounty = (rewardId: string, payout: number, name: string) => {
    if (isDeveloperMode()) return;
    const levelCheck = checkLevelRequirement(user.level, bountyConfig.required_level);
    if (!levelCheck.passed) {
      alert(`Error: ${levelCheck.message}`);
      return;
    }
    const isDone = socialRewards.find(r => r.id === rewardId)?.completed;
    if (isDone) return;

    // Simulate opening social media window
    window.open(socialRewards.find(r => r.id === rewardId)?.link, "_blank");

    setTimeout(() => {
      setSocialRewards(prev => prev.map(r => r.id === rewardId ? { ...r, completed: true } : r));
      playCoinSound();
      onRewardEarned(payout, `Social Bounty`, `Social bounty "${name}" completed! +${payout.toLocaleString()} coins.`);
      alert(`Bounty verified! You've claimed +${payout} coins for connecting to our community.`);
    }, 1200);
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="font-sans font-bold text-3xl tracking-tight text-white flex items-center gap-2">
          Gemi-Rewards Station
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Lock in daily login multiplier sequences, type promo vouchers, and claim rewards.
        </p>
      </div>

      {/* Daily streak slider 7 days */}
      <div className="glass rounded-3xl p-6 lg:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-amber-500/10 to-transparent blur-[70px] rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-sans font-bold text-lg text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
              7-Day Landing Streak Sequence
            </h2>
            <p className="text-slate-400 text-xs">
              Consecutive daily logs unlock rising balance levels. Your active sequence is <span className="text-amber-400 font-bold font-mono">{user.streak_days} days</span>. Day 4 check-in is ready!
            </p>
          </div>

          <div className="bg-slate-900 px-4 py-2 border border-white/5 rounded-2xl text-xs font-mono text-slate-300">
            Multiplier Bonus: <span className="text-cyan-400 font-bold">+{(user.streak_days * 1.5).toFixed(1)}% Active</span>
          </div>
        </div>

        {/* Days array list */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 select-none">
          {dailyStreakProgress.map((day, idx) => {
            const isUnlockedAndReady = idx === user.streak_days;
            return (
              <div
                key={day.day}
                onClick={() => claimStreakDay(idx)}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between items-center h-32 ${
                  day.claimed
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                    : isUnlockedAndReady
                    ? "bg-amber-500/10 border-amber-500/60 text-amber-300 hover:scale-[1.03] cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse"
                    : "bg-slate-950/40 border-white/5 text-slate-500 cursor-not-allowed"
                }`}
              >
                <div className="text-center font-mono text-[10px] font-bold uppercase">
                  Day {day.day}
                </div>

                <div className="text-2xl filter drop-shadow-[0_0_6px_rgba(255,255,255,0.1)]">
                  {day.claimed ? "✔" : "🎁"}
                </div>

                <div className="text-center">
                  <span className="text-xs font-bold block">{day.reward}c</span>
                  <span className="text-[8px] opacity-70 block font-mono">Claimed</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Promo Voucher & Weekly Chest splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Promo Voucher panel */}
        <div className="glass rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-cyan-400" />
              Promo Code voucher Terminal
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Acquired a seasonal promo code from our social vectors or newsletter? Type it below to extract credits immediately.
            </p>
          </div>

          <form onSubmit={handleApplyPromoCode} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="ENTER PROMO CODE (e.g. COINLOOT)"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 hover:border-white/10 rounded-2xl px-4 py-3 text-xs text-white uppercase placeholder-slate-600 focus:outline-none focus:border-cyan-400/20 font-mono tracking-widest"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-sans font-bold text-[10px] uppercase hover:scale-[1.01] transition-transform"
              >
                Apply code
              </button>
            </div>

            {promoError && (
              <p className="text-xs font-mono text-red-400">{promoError}</p>
            )}
            {promoSuccess && (
              <p className="text-xs font-mono text-emerald-400">{promoSuccess}</p>
            )}
          </form>

          <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Voucher system protected by Sentinel Anti-Bot Firewalls.
          </div>
        </div>

        {/* Weekly Elite chest */}
        {challengeConfig.enabled && challengeConfig.active && (
        <div className="glass rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-400" />
                {challengeConfig.title}
              </h3>
              <span className="p-1 px-1.5 rounded bg-purple-500/10 text-purple-300 font-mono text-[8px] font-bold">
                LEVEL {challengeConfig.required_level}+ REQUIRED
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {challengeConfig.description}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-950/20 to-pink-950/10 border border-purple-500/10 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">chest potential payout</span>
              <span className="text-lg font-bold font-mono text-white mt-1 block">{challengeConfig.reward_coins.toLocaleString()} Coins (+{challengeConfig.bonus_coins} Bonus)</span>
            </div>

            <button
              onClick={claimWeeklyChest}
              disabled={weeklyClaimed}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                weeklyClaimed
                  ? "bg-slate-900 border border-white/5 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg hover:scale-[1.01]"
              }`}
            >
              {weeklyClaimed ? "Unlocked" : "Decrypt Chest"}
            </button>
          </div>

          <p className="text-[10px] font-mono text-slate-500">
            {challengeConfig.weekly_reset_rules}
          </p>
        </div>
        )}
      </div>

      {/* Social community Bounties */}
      {bountyConfig.enabled && bountyConfig.active && (
      <div className="glass rounded-3xl p-6 lg:p-8 space-y-5">
        <div>
          <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            {bountyConfig.title}
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            {bountyConfig.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {socialRewards.map((reward) => (
            <div
              key={reward.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                reward.completed
                  ? "bg-slate-900/40 border-white/5 text-slate-500"
                  : "bg-slate-950/20 border-white/5 hover:border-cyan-400/20 hover:bg-slate-950/40 text-slate-300"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2.5xl filter drop-shadow-[0_0_6px_rgba(255,255,255,0.1)]">{reward.icon}</span>
                <span className="px-2 py-0.5 text-[8px] font-mono tracking-widest font-bold bg-white/5 rounded border border-white/15 text-white">
                  +{bountyConfig.reward_coins} Coins
                </span>
              </div>

              <div>
                <h4 className="font-sans font-semibold text-xs text-white leading-tight">
                  {reward.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-2">
                  Verify community channel enrollment.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  disabled={reward.completed}
                  onClick={() => claimSocialBounty(reward.id, bountyConfig.reward_coins, reward.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    reward.completed
                      ? "text-emerald-400 bg-emerald-500/10 font-medium"
                      : "bg-slate-900 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-400 border border-white/5"
                  }`}
                >
                  {reward.completed ? (
                    <>
                      <span>Completed</span>
                      <span>✔</span>
                    </>
                  ) : (
                    <>
                      <span>Claim Bounty</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
