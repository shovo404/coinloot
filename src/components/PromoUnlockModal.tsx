import { useState } from "react";
import { X, Gift, CheckCircle, AlertCircle, Lock, Sparkles } from "lucide-react";
import { validatePromoCode, incrementPromoUsage, hasUserUsedPromoCode, markUserPromoUsed } from "../utils/lockedOfferwallDB";

interface Props {
  offerwallName: string;
  userId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PromoUnlockModal({ offerwallName, userId, onSuccess, onClose }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please enter a promo code");
      return;
    }
    setLoading(true);
    setError("");

    // Simulate network delay
    setTimeout(() => {
      const validated = validatePromoCode(trimmed, offerwallName);
      if (!validated) {
        setError("Invalid or expired promo code");
        setLoading(false);
        return;
      }
      if (hasUserUsedPromoCode(userId, validated.id)) {
        setError("You have already used this promo code");
        setLoading(false);
        return;
      }
      markUserPromoUsed(userId, validated.id);
      incrementPromoUsage(validated.id);
      setSuccess(true);
      setLoading(false);
      setTimeout(() => onSuccess(), 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in">
      <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/[0.08] rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden animate-zoom-in">
        {/* Header */}
        <div className="relative px-5 pt-6 pb-4 border-b border-white/[0.06]">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Unlock with Promo Code</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{offerwallName}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-white">Offerwall Unlocked!</p>
              <p className="text-[11px] text-slate-400 mt-1">You now have access to {offerwallName}</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                  placeholder="ENTER PROMO CODE"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm font-mono font-bold text-white placeholder-slate-700 uppercase tracking-widest focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-[10px] text-rose-300 font-medium">{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="relative w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.45)] hover:from-purple-500 hover:to-pink-500 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Validating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Unlock Now
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
