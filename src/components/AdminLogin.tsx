import { useState, FormEvent } from "react";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import Loader from "./Loader";
import { getSupabaseClient } from "../lib/supabase";
import { getProfile } from "../lib/supabaseService";

interface AdminLoginProps {
  onLogin: (email: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const sb = getSupabaseClient();
      if (!sb) {
        setError("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
        setLoading(false);
        return;
      }

      const trimmedEmail = email.toLowerCase().trim();

      // Sign in via Supabase Auth
      const { data, error: signInError } = await sb.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setError("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      // Check admin status from Supabase profiles table
      const profile = await getProfile(data.user.id);
      if (!profile) {
        setError("Profile not found.");
        setLoading(false);
        return;
      }

      // Verify admin access via is_admin flag in Supabase
      if (!profile.is_admin) {
        // Also check admin_accounts table as fallback
        const { data: adminAccount } = await sb
          .from("admin_accounts")
          .select("*")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (!adminAccount) {
          setError("Access denied. Admin privileges required.");
          await sb.auth.signOut();
          setLoading(false);
          return;
        }
      }

      onLogin(trimmedEmail);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.08)_0%,_transparent_70%)] pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-600/20 to-cyan-500/20 rounded-3xl blur-xl" />
        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-sm text-slate-400 mt-1">CoinLoot Platform Control Center</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@coinloot.com"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader size="xs" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
