import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Key, Mail, User, MessageSquare, ArrowLeft } from "lucide-react";
import Loader from "./Loader";
import { UserProfile } from "../types";
import { createRecoveryRequest, hasActiveRequest } from "../utils/passwordRecovery";

interface Props {
  user: UserProfile | null;
  onBack: () => void;
  onComplete: () => void;
}

export default function PasswordRecoveryForm({ user, onBack, onComplete }: Props) {
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedUser = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedReason = reason.trim();

    if (!trimmedUser || !trimmedEmail || !trimmedReason) {
      setError("All fields are required.");
      return;
    }

    if (trimmedReason.length < 10) {
      setError("Please provide a detailed reason (at least 10 characters).");
      return;
    }

    // Verify identity: check if user matches the account
    const accounts: any[] = JSON.parse(localStorage.getItem("coinloot_accounts") || "[]");
    const match = accounts.find(
      (a) => a.username.toLowerCase() === trimmedUser.toLowerCase() && a.email.toLowerCase() === trimmedEmail.toLowerCase()
    );
    if (!match) {
      setError("No account found with that username and email combination.");
      return;
    }

    if (hasActiveRequest(match.profile.id)) {
      setError("You already have a pending recovery request. Please wait for admin approval.");
      return;
    }

    setLoading(true);

    // Brief delay for UX
    setTimeout(() => {
      createRecoveryRequest(match.profile.id, match.username, match.email, trimmedReason);
      setLoading(false);
      setSubmitted(true);

      // Also save a notification for the user themselves
      try {
        const notifs: any[] = JSON.parse(localStorage.getItem("coinloot_notifications") || "[]");
        notifs.unshift({
          id: `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          user_id: match.profile.id,
          title: "Recovery Request Submitted",
          description: "Your password recovery request has been submitted. An admin will review it shortly.",
          time: new Date().toISOString(),
          category: "system",
          unread: true,
        });
        localStorage.setItem("coinloot_notifications", JSON.stringify(notifs));
      } catch {}
    }, 800);
  };

  if (submitted) {
    return (
      <div className="p-6 space-y-5 animate-fade-in text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Request Submitted</h3>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Your password recovery request has been submitted. An administrator will review your request.
            You will be notified once a decision has been made.
          </p>
        </div>
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs tracking-wide shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>

      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <Key className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-sm font-bold text-white">Password Recovery</h2>
        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
          Submit a recovery request. An admin will review and approve it before you can reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
            <User className="w-3 h-3" /> Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              readOnly={!!user}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> Registered Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your registered email"
              className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              readOnly={!!user}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> Reason for Recovery
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="I forgot my password and cannot access my account."
            rows={3}
            className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all resize-none"
          />
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
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-amber-500/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader size="xs" /> Submitting...</>
          ) : (
            <><Key className="w-3.5 h-3.5" /> Submit Recovery Request</>
          )}
        </button>
      </form>
    </div>
  );
}
