import { Coins, Lock } from "lucide-react";

interface Props {
  offer: any;
  isRestricted?: boolean;
  onClick: (offer: any) => void;
}

export default function OfferCard({ offer, isRestricted, onClick }: Props) {
  return (
    <div
      className="group relative w-[190px] sm:w-[210px] shrink-0 snap-start rounded-2xl bg-slate-950/60 border border-white/5 hover:border-cyan-400/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.1)] transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => !isRestricted && onClick(offer)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
        <img
          src={offer.imageUrl}
          alt={offer.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = "none";
          }}
        />
        {/* Provider badge */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/5">
          <span className="text-[7px] font-bold text-white/80 uppercase tracking-wider">{offer.provider}</span>
        </div>
        {/* Reward badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-gradient-to-r from-cyan-500/90 to-purple-600/90 backdrop-blur-sm shadow-lg">
          <span className="text-[10px] font-extrabold text-white flex items-center gap-1">
            <Coins className="w-3 h-3" /> {offer.payout_coins.toLocaleString()}
          </span>
        </div>
        {offer.max_reward && offer.max_reward > offer.payout_coins && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-sm">
            <span className="text-[7px] font-bold text-white">UP TO {offer.max_reward.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1.5">
        <h3 className="text-[11px] font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight line-clamp-2">
          {offer.title}
        </h3>
        <p className="text-[8px] text-slate-500 leading-snug line-clamp-1">{offer.description}</p>
        {isRestricted ? (
          <div className="w-full py-1.5 rounded-lg bg-slate-800/60 text-slate-500 text-[8px] font-semibold text-center border border-white/5 flex items-center justify-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Restricted
          </div>
        ) : (
          <div className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[8px] font-bold tracking-wide text-center hover:scale-[1.02] transition-all opacity-0 group-hover:opacity-100">
            View Offer
          </div>
        )}
      </div>
    </div>
  );
}
