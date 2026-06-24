import React, { useState, useEffect, useMemo } from "react";
import {
  Building2, CreditCard, DollarSign, Wallet, ShieldAlert, ArrowRight, CheckCircle,
  History, Clock, AlertTriangle, AlertCircle, Sparkles, Send, Copy, Coins, Zap
} from "lucide-react";
import { UserProfile, WithdrawalRequest } from "../types";
import { isDeveloperMode } from "./DeveloperModeBanner";
import { notifyWithdrawalRequest } from "../utils/adminNotifier";
import { checkVpnStatus, getVpnSettings, isUserRestricted, restrictUser, logDetection } from "../utils/vpnDetector";
import { calcLevelFromBalance } from "../utils/levelSystem";
import { getWithdrawalMethods } from "../lib/supabaseService";

// ── Constants ───────────────────────────────────────────────────────────────

const COINS_PER_USD = 1000; // 1,000 coins = $1.00 USD

const QUICK_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

// ─── Types ──────────────────────────────────────────────────────────────────

interface WithdrawHubProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  withdrawals: WithdrawalRequest[];
  onAddWithdrawal: (req: WithdrawalRequest) => void;
}

interface WithdrawMethod {
  id: string;
  name: string;
  icon: string;
  minCoins: number;
  type: string;
  fieldLabel: string;
  placeholder: string;
  description: string;
}

interface ValidationError {
  field: "amount" | "account" | "balance";
  message: string;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function coinsToUsd(coins: number): number {
  return coins / COINS_PER_USD;
}

function usdToCoins(usd: number): number {
  return Math.round(usd * COINS_PER_USD);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function WithdrawHub({ user, setUser, withdrawals, onAddWithdrawal }: WithdrawHubProps) {
  // ── State ──
  const [selectedMethod, setSelectedMethod] = useState<WithdrawMethod | null>(null);
  const [targetAccountInput, setTargetAccountInput] = useState("");
  const [amountCoins, setAmountCoins] = useState<number>(1000);
  const [amountInput, setAmountInput] = useState("1000");
  const [withdrawingState, setWithdrawingState] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [vpnBlocked, setVpnBlocked] = useState(false);
  const [vpnChecking, setVpnChecking] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // ── Derived values ──
  const usdValue = coinsToUsd(amountCoins);
  const myWithdrawalRequests = withdrawals.filter((w) => w.user_id === user.id);

  // ── Fetch payment methods ──
  useEffect(() => {
    getWithdrawalMethods().then(setPaymentMethods).catch(() => setPaymentMethods([]));
  }, []);

  // ── Validation ──
  const validate = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (!selectedMethod) return errors;

    // ── KYC Check ──
    if (user.kyc_required && user.kyc_status !== "APPROVED") {
      errors.push({ field: "account", message: "KYC verification is required before withdrawal. Please complete KYC verification first." });
      return errors;
    }

    if (!targetAccountInput.trim()) {
      errors.push({ field: "account", message: `${selectedMethod.fieldLabel} is required.` });
    }

    if (amountCoins < selectedMethod.minCoins) {
      errors.push({ field: "amount", message: `Minimum for ${selectedMethod.name} is ${selectedMethod.minCoins.toLocaleString()} coins ($${coinsToUsd(selectedMethod.minCoins).toFixed(2)} USD).` });
    }

    if (amountCoins > user.balance_coins) {
      errors.push({ field: "balance", message: `Insufficient balance. You have ${user.balance_coins.toLocaleString()} coins ($${user.balance_usd.toFixed(2)} USD).` });
    }

    if (amountCoins <= 0) {
      errors.push({ field: "amount", message: "Amount must be greater than 0." });
    }

    // Round to nearest 10
    if (amountCoins % 10 !== 0) {
      errors.push({ field: "amount", message: "Amount must be in increments of 10 coins." });
    }

    return errors;
  };

  // ── Handle amount change ──
  const handleAmountChange = (value: string) => {
    // Allow empty while typing
    if (value === "") {
      setAmountInput("");
      setAmountCoins(0);
      return;
    }

    // Only allow digits
    const cleaned = value.replace(/[^0-9]/g, "");
    if (cleaned === "") {
      setAmountInput("");
      setAmountCoins(0);
      return;
    }

    const num = parseInt(cleaned, 10);
    setAmountInput(cleaned);
    setAmountCoins(num);
    setValidationErrors([]);
  };

  const handleQuickAmount = (coins: number) => {
    setAmountInput(coins.toString());
    setAmountCoins(coins);
    setValidationErrors([]);
  };

  // ── Submit ──
  const handleCreateWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;

    const errors = validate();
    setValidationErrors(errors);
    if (errors.length > 0) return;

    // ── VPN Protection Check ──
    const settings = getVpnSettings();
    if (settings.withdrawalBlock) {
      setVpnChecking(true);
      try {
        const vpnResult = await checkVpnStatus();
        logDetection(user.id, user.username, vpnResult);
        if (vpnResult.isVpn || vpnResult.isProxy || vpnResult.isTor || vpnResult.isHosting) {
          restrictUser(user.id, 30, "VPN detected during withdrawal request");
          setVpnBlocked(true);
          setVpnChecking(false);
          return;
        }
      } catch { /* server check failed — allow through */ }
      setVpnChecking(false);
    }

    setWithdrawingState(true);

    setTimeout(() => {
      const finalCoins = user.balance_coins - amountCoins;

      setUser({
        ...user,
        balance_coins: finalCoins,
        balance_usd: finalCoins / 1000,
        total_withdrawn_usd: user.total_withdrawn_usd + usdValue,
        level: calcLevelFromBalance(finalCoins)
      });

      const newWd: WithdrawalRequest = {
        id: `wd-${Math.floor(Math.random() * 90000) + 10000}`,
        user_id: user.id,
        username: user.username,
        reward_name: selectedMethod.name,
        payout_method: selectedMethod.id,
        payout_details: `${selectedMethod.type}: ${targetAccountInput}`,
        coins_deducted: amountCoins,
        usd_value: usdValue,
        status: "PENDING",
        created_at: new Date().toISOString()
      };

      onAddWithdrawal(newWd);

      notifyWithdrawalRequest(user.id, user.username, amountCoins, usdValue, selectedMethod.name, newWd.id);

      setWithdrawingState(false);
      setSelectedMethod(null);
      setTargetAccountInput("");
      setAmountInput("1000");
      setAmountCoins(1000);
      setValidationErrors([]);
    }, 1800);
  };

  // ── Balance check for UI ──
  const hasEnoughBalance = amountCoins <= user.balance_coins;
  const meetsMinimum = selectedMethod ? amountCoins >= selectedMethod.minCoins : true;
  const devMode = isDeveloperMode();
  const canSubmit = !devMode && selectedMethod && targetAccountInput.trim() && amountCoins > 0 && hasEnoughBalance && meetsMinimum && !vpnBlocked;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div>
        {devMode && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex items-center gap-2">
            <span className="text-base">🔧</span> Withdrawals are temporarily disabled — site under development
          </div>
        )}
        <h1 className="font-sans font-bold text-3xl tracking-tight text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-cyan-400" />
          Withdrawal Portal
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Convert your coins to real money. 1,000 coins = $1.00 USD. Zero fees on all withdrawals.
        </p>
      </div>

      {/* ── Balance Card ── */}
      <div className="glass rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Available Balance</span>
            <span className="block text-2xl font-bold text-white font-mono mt-0.5">{user.balance_coins.toLocaleString()} <span className="text-xs text-slate-400 font-normal">coins</span></span>
            <span className="block text-xs font-mono text-cyan-400 mt-0.5">≈ ${user.balance_usd.toFixed(2)} USD</span>
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
          ⚡ Instant Payouts
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Payment Methods Grid (2 cols) ── */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod?.id === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedMethod(method);
                    setValidationErrors([]);
                    if (amountCoins < method.minCoins) {
                      const newMin = method.minCoins;
                      setAmountInput(newMin.toString());
                      setAmountCoins(newMin);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all duration-200 text-left ${
                    isSelected
                      ? "glass border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.12)]"
                      : "glass hover:neon-border-cyan"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-white truncate">{method.name}</span>
                      <span className="block text-[9px] font-mono text-slate-500">Min: {method.minCoins.toLocaleString()} coins</span>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{method.description}</p>
                </button>
              );
            })}
          </div>

          {/* ── Withdrawal History ── */}
          <div className="glass rounded-3xl p-6">
            <h3 className="font-sans font-bold text-base text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              Withdrawal History
            </h3>

            {myWithdrawalRequests.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl text-slate-500 text-xs font-mono">
                No withdrawal history yet. Complete offers and surveys to start withdrawing.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                {myWithdrawalRequests.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Method icon */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-base shrink-0">
                        {paymentMethods.find(m => m.id === item.payout_method)?.icon || "💳"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-sans font-semibold text-slate-200 text-xs">{item.reward_name}</span>
                          <span className="text-[8px] text-slate-500 font-mono">#{item.id.slice(-6)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            {item.coins_deducted.toLocaleString()} coins
                          </span>
                          <span>•</span>
                          <span>${item.usd_value.toFixed(2)} USD</span>
                          <span>•</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg ${
                        item.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : item.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Withdrawal Form Sidebar (1 col) ── */}
        <div>
          {selectedMethod ? (
            <form
              onSubmit={handleCreateWithdrawalSubmit}
              className="glass border-cyan-500/20 rounded-3xl p-5 space-y-5 sticky top-24"
            >
              {/* Header */}
              <div className="pb-4 border-b border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold block">New Withdrawal</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedMethod.icon}</span>
                  <span className="text-lg font-bold text-white tracking-tight">{selectedMethod.name}</span>
                </div>
              </div>

              {/* ── Custom Coin Amount Input ── */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono text-slate-300 uppercase font-semibold block">
                  Select Coin Amount
                </label>

                {/* Numeric Input */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Coins className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountInput}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400/20 transition-all"
                  />
                </div>

                {/* Quick Amount Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_AMOUNTS.map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => handleQuickAmount(qty)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                        amountCoins === qty
                          ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                          : "bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:border-white/10"
                      }`}
                    >
                      {qty.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Live Conversion Display */}
                <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Coins</span>
                    <span className="text-white font-bold font-mono">{amountCoins.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-white/5">
                    <span className="text-slate-400 font-mono">USD Value</span>
                    <span className="text-cyan-400 font-bold font-mono">${usdValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ── Destination Account ── */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-300 uppercase font-semibold block">
                  {selectedMethod.fieldLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={targetAccountInput}
                  onChange={(e) => {
                    setTargetAccountInput(e.target.value);
                    setValidationErrors([]);
                  }}
                  placeholder={selectedMethod.placeholder}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/20 transition-all"
                />
              </div>

              {/* ── Validation Errors ── */}
              {validationErrors.length > 0 && (
                <div className="space-y-2">
                  {validationErrors.map((err, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-[10px] text-red-300 leading-relaxed">{err.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Withdrawal Summary ── */}
              <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Selected Method</span>
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    <span className="text-sm">{selectedMethod.icon}</span>
                    {selectedMethod.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Coin Amount</span>
                  <span className="text-white font-mono font-bold">{amountCoins.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Estimated Cash</span>
                  <span className="text-cyan-400 font-mono font-bold">${usdValue.toFixed(2)} USD</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between text-slate-400">
                  <span>Processing Fee</span>
                  <span className="text-emerald-400 font-mono font-bold">$0.00</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between text-white font-semibold">
                  <span>You Receive</span>
                  <span className="text-emerald-400 font-mono text-sm font-bold">${usdValue.toFixed(2)} USD</span>
                </div>
              </div>

              {/* ── VPN Block Notice ── */}
              {vpnBlocked && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-300 leading-normal flex gap-2 items-start">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-200 mb-0.5">VPN Detected</span>
                    <span>Withdrawals are blocked while connected to a VPN, proxy, or TOR. Please disable and try again.</span>
                  </div>
                </div>
              )}

              {/* ── VPN Checking Loader ── */}
              {vpnChecking && (
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[10px] text-cyan-300 leading-normal flex gap-2 items-center">
                  <Wallet className="w-4 h-4 animate-spin" />
                  <span>Verifying network security...</span>
                </div>
              )}

              {/* ── Balance Warning ── */}
              {!hasEnoughBalance && amountCoins > 0 && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 leading-normal flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Insufficient balance. You have <strong>{user.balance_coins.toLocaleString()} coins</strong> (${user.balance_usd.toFixed(2)} USD) but requested <strong>{amountCoins.toLocaleString()} coins</strong>.
                  </span>
                </div>
              )}

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={withdrawingState || !canSubmit}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold tracking-wide text-white text-xs hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {withdrawingState ? (
                  <>
                    <Wallet className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>Processing Withdrawal...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Request Withdrawal</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 text-center sticky top-24 space-y-4">
              <div className="w-14 h-14 rounded-full bg-cyan-950/10 border border-cyan-500/10 flex items-center justify-center mx-auto">
                <Wallet className="w-7 h-7 text-slate-500" />
              </div>
              <h3 className="text-sm font-bold text-white">Select a Payment Method</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Choose from {paymentMethods.length} payout methods above. Enter the amount and your wallet details to withdraw.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-[10px] text-slate-500 font-mono">
                <span className="px-2 py-1 rounded-lg bg-white/5">Min: 1,000 coins</span>
                <span className="px-2 py-1 rounded-lg bg-white/5">0% fee</span>
                <span className="px-2 py-1 rounded-lg bg-white/5">Instant</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
