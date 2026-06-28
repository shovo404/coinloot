import { useEffect, useState, useRef, useCallback } from "react";
import { Award, Sparkles, TrendingUp, Star, ChevronRight } from "lucide-react";
import { getLevelTitle } from "../utils/levelSystem";

interface LevelUpCelebrationProps {
  show: boolean;
  level: number;
  onDismiss: () => void;
}

export default function LevelUpCelebration({ show, level, onDismiss }: LevelUpCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismissRef.current(), 500);
  }, []);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 2,
    }));
    setParticles(p);
    const timer = setTimeout(() => {
      dismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [show, dismiss]);

  if (!show && !visible) return null;

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 cursor-pointer ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/90 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.15),transparent_70%)]" />

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-ping"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(168,85,247,0.8), rgba(6,182,212,0.4))`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${1.5 + Math.random()}s`,
          }}
        />
      ))}

      <div className="relative z-10 text-center px-6 animate-zoom-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Level Complete</span>
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        </div>

        <div className="relative mb-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-bounce">
            <Award className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
          </div>
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
          LEVEL UP!
        </h2>

        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="text-lg sm:text-2xl text-purple-300 font-bold">LV {level - 1}</span>
          <ChevronRight className="w-6 h-6 text-cyan-400" />
          <span className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            LV {level}
          </span>
        </div>

        <p className="text-purple-200/80 text-sm sm:text-base mb-2">{getLevelTitle(level)}</p>

        <div className="flex items-center justify-center gap-1.5 text-xs text-cyan-300/70">
          <Star className="w-3 h-3" />
          <span>New perks unlocked</span>
          <TrendingUp className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
