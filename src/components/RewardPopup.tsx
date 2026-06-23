import { useState, useEffect, useCallback } from "react";
import { Coins, X } from "lucide-react";
import { getProviderInfo } from "../utils/providerLogos";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RewardPopupData {
  id: string;
  sourceName: string;
  coins: number;
  message: string;
}

interface RewardPopupProps {
  popups: RewardPopupData[];
  onDismiss: (id: string) => void;
}

// ─── Single Popup ───────────────────────────────────────────────────────────

function SinglePopup({ popup, onDismiss }: { popup: RewardPopupData; onDismiss: () => void }) {
  const provider = getProviderInfo(popup.sourceName);
  const POPUP_DURATION = 6000; // 6 seconds
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Auto-dismiss after duration with fade-out
  useEffect(() => {
    // Start fade-out 400ms before removal
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, POPUP_DURATION - 400);
    // Remove from DOM after fade-out completes
    const removeTimer = setTimeout(() => {
      onDismiss();
    }, POPUP_DURATION);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`relative w-full max-w-[calc(100vw-2rem)] sm:max-w-sm glass border border-white/10 rounded-2xl p-4 shadow-2xl group transition-all duration-[400ms] ${
        isFadingOut ? "animate-reward-popup-out" : "animate-reward-popup-in"
      }`}
      role="alert"
    >
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-0.5 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex items-center gap-3.5">
        {/* Provider Logo */}
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${provider.color} border ${provider.border} flex items-center justify-center shadow-lg shrink-0`}
        >
          <span className="text-white font-bold text-sm">{provider.initials}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-white truncate">
              {popup.sourceName}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] font-mono whitespace-nowrap">
              +{popup.coins.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">{popup.message}</p>

          {/* Coin animation accent */}
          <div className="flex items-center gap-1 mt-1.5">
            <Coins className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="text-[9px] font-mono text-amber-400/70">
              {popup.coins.toLocaleString()} coins credited
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full animate-shrink-width" />
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function RewardPopup({ popups, onDismiss }: RewardPopupProps) {
  if (popups.length === 0) return null;

  // Render all popups but only show the most recent one (last in array).
  // Using key on the wrapper div ensures proper remounting when the visible popup changes.
  return (
    <div className="fixed bottom-20 sm:bottom-6 left-2 sm:left-6 z-[9999] max-w-sm w-full pointer-events-none">
      {popups.map((p, i) => (
        <div key={p.id} className={i === popups.length - 1 ? "pointer-events-auto" : "hidden"}>
          <SinglePopup popup={p} onDismiss={() => onDismiss(p.id)} />
        </div>
      ))}
      {/* Queue indicator */}
      {popups.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2 pointer-events-auto">
          <span className="text-[9px] font-mono text-slate-500">
            +{popups.length - 1} more
          </span>
        </div>
      )}
    </div>
  );
}

// Re-export hook for convenient popup queue management
export function usePopupQueue() {
  const [popups, setPopups] = useState<RewardPopupData[]>([]);

  const addPopup = useCallback((popup: RewardPopupData) => {
    setPopups((prev) => [...prev.slice(-4), popup]); // max 5 in queue
  }, []);

  const dismissPopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { popups, addPopup, dismissPopup };
}
