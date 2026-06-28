import { useEffect, useState } from "react";
import { ShieldAlert, Calendar, Clock, Mail, LogOut, MessageSquare } from "lucide-react";
import { isUserRestricted, getFullRestrictionInfo } from "../utils/vpnDetector";

interface RestrictionPageProps {
  userId: string;
  onLogout?: () => void;
  onContactSupport?: () => void;
}

export default function RestrictionPage({ userId, onLogout, onContactSupport }: RestrictionPageProps) {
  const [restriction, setRestriction] = useState(() => isUserRestricted(userId));
  const [info, setInfo] = useState(() => getFullRestrictionInfo(userId));

  useEffect(() => {
    const interval = setInterval(() => {
      const r = isUserRestricted(userId);
      setRestriction(r);
      if (!r.restricted) setInfo(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    setInfo(getFullRestrictionInfo(userId));
  }, [userId, restriction.restricted]);

  if (!restriction.restricted) return null;

  const isPermanent = info?.permanent || false;
  const restrictedDate = info?.restrictedAt
    ? new Date(info.restrictedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "N/A";
  const expiryDate = info?.restrictedUntil && !isPermanent
    ? new Date(info.restrictedUntil).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/98 backdrop-blur-xl">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-slate-950 border border-rose-500/25 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-rose-500/10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-rose-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Account Restricted</h1>
            <p className="text-sm text-slate-400 mb-6">
              Your account has been restricted by the administration team.
            </p>

            {/* Reason */}
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 mb-4">
              <span className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Reason</span>
              <span className="block text-sm font-semibold text-rose-300">
                {restriction.reason || "No reason provided"}
              </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
                <Calendar className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="block text-[9px] font-mono text-slate-500 uppercase">Restricted On</span>
                <span className="block text-[11px] font-semibold text-white mt-0.5">{restrictedDate}</span>
              </div>
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
                <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="block text-[9px] font-mono text-slate-500 uppercase">{isPermanent ? "Status" : "Expires"}</span>
                <span className="block text-[11px] font-semibold text-white mt-0.5">
                  {isPermanent ? "Permanent" : expiryDate || restriction.remaining}
                </span>
              </div>
            </div>

            {/* Countdown for temp restrictions */}
            {!isPermanent && restriction.remaining && restriction.remaining !== "Permanent" && (
              <div className="bg-slate-900/40 border border-amber-500/10 rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-slate-950/60 rounded-xl p-2 border border-amber-500/10">
                    <span className="block text-xl font-bold font-mono text-white">{restriction.days}</span>
                    <span className="block text-[8px] font-mono text-slate-500 uppercase">Days</span>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-2 border border-amber-500/10">
                    <span className="block text-xl font-bold font-mono text-white">{restriction.hours}</span>
                    <span className="block text-[8px] font-mono text-slate-500 uppercase">Hours</span>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-2 border border-amber-500/10">
                    <span className="block text-xl font-bold font-mono text-white">{restriction.minutes}</span>
                    <span className="block text-[8px] font-mono text-slate-500 uppercase">Min</span>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-2 border border-amber-500/10">
                    <span className="block text-xl font-bold font-mono text-white">{restriction.seconds}</span>
                    <span className="block text-[8px] font-mono text-slate-500 uppercase">Sec</span>
                  </div>
                </div>
              </div>
            )}

            {/* Admin notes */}
            {info?.notes && (
              <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 mb-6 text-left">
                <span className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Admin Notes</span>
                <p className="text-xs text-slate-400 leading-relaxed">{info.notes}</p>
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              If you believe this is a mistake, please contact our support team. All earning and withdrawal features are disabled while your account is restricted.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {onContactSupport && (
                <button
                  onClick={onContactSupport}
                  className="flex-1 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold text-xs hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact Support
                </button>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex-1 py-3 rounded-xl bg-slate-900 border border-white/10 text-slate-300 font-semibold text-xs hover:border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}