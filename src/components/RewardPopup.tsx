import { useState, useEffect, useCallback, useRef } from "react";
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
  const POPUP_DURATION = 6000;
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, POPUP_DURATION - 400);
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
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-0.5 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex items-center gap-3.5">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${provider.color} border ${provider.border} flex items-center justify-center shadow-lg shrink-0`}
        >
          <span className="text-white font-bold text-sm">{provider.initials}</span>
        </div>

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

          <div className="flex items-center gap-1 mt-1.5">
            <Coins className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="text-[9px] font-mono text-amber-400/70">
              {popup.coins.toLocaleString()} coins credited
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full animate-shrink-width" />
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function RewardPopup({ popups, onDismiss }: RewardPopupProps) {
  const handleDismiss = useCallback(() => {
    if (popups[0]) onDismiss(popups[0].id);
  }, [popups, onDismiss]);

  if (popups.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-2 sm:left-6 z-[9999] max-w-sm w-full pointer-events-none">
      <div className="pointer-events-auto">
        <SinglePopup popup={popups[0]} onDismiss={handleDismiss} />
      </div>
    </div>
  );
}

// ─── Popup Queue Hook ──────────────────────────────────────────────────────

export function usePopupQueue() {
  const [popups, setPopups] = useState<RewardPopupData[]>([]);
  const queueRef = useRef<RewardPopupData[]>([]);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const currentIdRef = useRef<string | null>(null);
  const isWaitingGapRef = useRef(false);

  const processNext = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const next = queueRef.current[0];
    queueRef.current = queueRef.current.slice(1);
    currentIdRef.current = next.id;
    isWaitingGapRef.current = false;
    setPopups([next]);
  }, []);

  const addPopup = useCallback((popup: RewardPopupData) => {
    if (queueRef.current.some(p => p.id === popup.id) || currentIdRef.current === popup.id) return;

    queueRef.current = [...queueRef.current.slice(-4), popup];

    if (currentIdRef.current === null && !isWaitingGapRef.current) {
      processNext();
    }
  }, [processNext]);

  const dismissPopup = useCallback((id: string) => {
    if (currentIdRef.current !== id) return;
    currentIdRef.current = null;
    setPopups([]);
    isWaitingGapRef.current = true;

    clearTimeout(gapTimerRef.current);
    gapTimerRef.current = setTimeout(() => {
      isWaitingGapRef.current = false;
      processNext();
    }, 3000);
  }, [processNext]);

  useEffect(() => {
    return () => clearTimeout(gapTimerRef.current);
  }, []);

  return { popups, addPopup, dismissPopup };
}
