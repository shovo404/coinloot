import { useEffect, useState } from "react";
import { Clock, ShieldAlert, AlertTriangle } from "lucide-react";
import { isUserRestricted } from "../utils/vpnDetector";

interface RestrictionPageProps {
  userId: string;
}

export default function RestrictionPage({ userId }: RestrictionPageProps) {
  const [restriction, setRestriction] = useState(() => isUserRestricted(userId));

  useEffect(() => {
    const interval = setInterval(() => {
      setRestriction(isUserRestricted(userId));
    }, 1000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!restriction.restricted) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-950 border border-amber-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-amber-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-amber-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Account Restricted</h1>
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm text-amber-300 font-medium">{restriction.reason || "VPN/Proxy Usage"}</span>
            </div>

            <div className="bg-slate-900/60 border border-amber-500/10 rounded-2xl p-6 mb-6 mt-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-mono text-slate-400">Time Remaining</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-slate-950/60 rounded-xl p-3 border border-amber-500/10">
                  <span className="block text-2xl font-bold font-mono text-white">{restriction.days}</span>
                  <span className="block text-[9px] font-mono text-slate-500 uppercase">Days</span>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-amber-500/10">
                  <span className="block text-2xl font-bold font-mono text-white">{restriction.hours}</span>
                  <span className="block text-[9px] font-mono text-slate-500 uppercase">Hours</span>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-amber-500/10">
                  <span className="block text-2xl font-bold font-mono text-white">{restriction.minutes}</span>
                  <span className="block text-[9px] font-mono text-slate-500 uppercase">Minutes</span>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-amber-500/10">
                  <span className="block text-2xl font-bold font-mono text-white">{restriction.seconds}</span>
                  <span className="block text-[9px] font-mono text-slate-500 uppercase">Seconds</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your account has been temporarily restricted due to VPN/Proxy usage.
              Access will be automatically restored when the timer expires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
