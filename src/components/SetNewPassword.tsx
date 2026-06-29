import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Lock, Eye, EyeOff, Key } from "lucide-react";
import Loader from "./Loader";
import { isValidRecoveryToken, completeRecovery } from "../utils/passwordRecovery";
import { changeUserPassword } from "../lib/supabaseService";

interface Props {
  token: string;
  onComplete: () => void;
}

export default function SetNewPassword({ token, onComplete }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  const [tokenValid, setTokenValid] = useState(true);
  useEffect(() => {
    if (!isValidRecoveryToken(token)) {
      setTokenValid(false);
    }
  }, [token]);

  if (!tokenValid) {
    return (
      <div className="p-6 space-y-5 animate-fade-in text-center">
        <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-rose-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Invalid or Expired Link</h3>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            This password reset link is invalid or has expired. Recovery tokens expire 24 hours after approval.
            Please submit a new recovery request.
          </p>
        </div>
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-6 space-y-5 animate-fade-in text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Password Changed!</h3>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
        </div>
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold text-xs tracking-wide shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = completeRecovery(token);
      if (!result) {
        setError("Invalid or expired recovery token.");
        setLoading(false);
        return;
      }

      await changeUserPassword(result.userId, newPassword);

      // Notify user of success
      try {
        const notifs: any[] = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
        notifs.unshift({
          id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          user_id: result.userId,
          title: "Password Successfully Changed",
          description: "Your password has been successfully reset via the recovery process.",
          time: new Date().toISOString(),
          category: "system",
          unread: true,
        });
        localStorage.setItem("coinloot_notifications", JSON.stringify(notifs));
      } catch {}

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 animate-fade-in">
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Key className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-sm font-bold text-white">Set New Password</h2>
        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
          Your recovery request was approved. Create a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 chars)"
              className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-[10px] text-rose-300 font-medium">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader size="xs" /> Resetting Password...</>
          ) : (
            <><CheckCircle className="w-3.5 h-3.5" /> Reset Password</>
          )}
        </button>
      </form>
    </div>
  );
}
