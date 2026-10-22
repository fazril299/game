import React from 'react';
import { Anchor, BookOpen } from 'lucide-react';

export default function FlightHUD({
  stats,
  dockedIsland,
  onMoor,
  onCastOff
}) {
  const { nearIsland = null, isDocked = false, isNearBoundary = false } = stats || {};

  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300 flex flex-col items-center gap-2">
      {/* Mataram Airspace Boundary Warning */}
      {isNearBoundary && !isDocked && (
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-600/95 dark:bg-amber-600/90 text-white shadow-luxury text-xs font-semibold backdrop-blur-md animate-pulse border border-amber-300/40">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Batas Wilayah Udara Mataram · Arus Angin Memutar Kapal</span>
        </div>
      )}

      {nearIsland && !isDocked && (
        <div className="pointer-events-auto flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-black/5 dark:border-white/10 px-5 py-2.5 rounded-full shadow-luxury animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#FF4B1F] animate-ping" />
          <span className="text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <BookOpen size={14} className="text-[#FF4B1F]" />
            Dermaga tersedia di <strong className="text-[#FF4B1F] font-semibold">{nearIsland}</strong>
          </span>
          <button
            onClick={onMoor}
            className="px-4 py-1.5 rounded-full bg-[#111625] dark:bg-white text-white dark:text-[#111625] text-xs font-semibold hover:bg-[#FF4B1F] dark:hover:bg-[#FF4B1F] dark:hover:text-white transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Berlabuh & Baca [Enter]</span>
          </button>
        </div>
      )}

      {isDocked && (
        <div className="pointer-events-auto flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-black/5 dark:border-white/10 px-5 py-2.5 rounded-full shadow-luxury">
          <Anchor size={15} className="text-[#FF4B1F]" />
          <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
            Kapal sedang berlabuh di dermaga
          </span>
          <button
            onClick={onCastOff}
            className="px-4 py-1.5 rounded-full bg-[#111625] dark:bg-white text-white dark:text-[#111625] text-xs font-semibold hover:bg-[#FF4B1F] dark:hover:bg-[#FF4B1F] dark:hover:text-white transition-all shadow-sm"
          >
            Lepas Jangkar & Terbang [Esc]
          </button>
        </div>
      )}
    </div>
  );
}

