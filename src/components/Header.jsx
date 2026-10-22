import React from 'react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

export default function Header({
  isNight,
  onToggleNight,
  isSoundOn,
  onToggleSound,
  onOpenControls,
  dockedIsland,
  onSelectIsland,
  onOpenSignal
}) {
  const { islands } = PORTFOLIO_DATA;

  return (
    <>
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 px-5 sm:px-8 py-5 pointer-events-none flex items-center justify-between">
        {/* Top-Left: Saga Holm Brand Pill */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-black/5 dark:border-white/10 px-5 py-2.5 rounded-full shadow-luxury hover:scale-102 transition-transform">
          {/* Exact Saga Holm Sunset Emblem */}
          <div className="w-5 h-5 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
              <defs>
                <clipPath id="saclip">
                  <rect x="0" y="0" width="64" height="37" />
                </clipPath>
              </defs>
              <circle cx="32" cy="32" r="21" fill="#FF4B1F" clipPath="url(#saclip)" />
              <rect x="6" y="40" width="52" height="5" rx="2.5" fill="#0F1B24" className="dark:fill-white" />
              <rect x="14" y="49" width="36" height="5" rx="2.5" fill="#0F1B24" className="dark:fill-white" />
              <rect x="23" y="58" width="18" height="5" rx="2.5" fill="#0F1B24" className="dark:fill-white" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#0F1B24] dark:text-white">
            Gabriel <span className="text-slate-400 font-normal text-xs ml-1 hidden sm:inline">· Jurnal Jogja</span>
          </span>
        </div>

        {/* Top-Center: Narasi Ekspedisi Button */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-2.5">
          <button
            onClick={() => onSelectIsland('about')}
            className="flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-[#111625] dark:bg-white text-white dark:text-[#111625] shadow-luxury hover:bg-[#FF4B1F] dark:hover:bg-[#FF4B1F] dark:hover:text-white transition-all group hover:scale-105"
          >
            <span className="text-xs font-semibold tracking-tight">Mulai Bab I</span>
            <div className="w-6 h-6 rounded-full bg-white dark:bg-[#111625] text-[#111625] dark:text-white group-hover:bg-white group-hover:text-[#FF4B1F] flex items-center justify-center transition-colors">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
          </button>
        </div>

        {/* Top-Right: Island Navigation Bar Pill */}
        <nav className="pointer-events-auto flex items-center gap-4 sm:gap-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-black/5 dark:border-white/10 px-5 sm:px-7 py-2.5 rounded-full shadow-luxury overflow-x-auto max-w-[62vw] custom-scrollbar">
          {islands.map((isl) => {
            const isDocked = dockedIsland === isl.id;
            return (
              <button
                key={isl.id}
                onClick={() => onSelectIsland(isl.id)}
                className={`text-xs font-medium transition-colors ${
                  isDocked
                    ? 'text-[#FF4B1F] font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {isl.title}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Left Bottom Stack: 3 Circular Buttons (Keyboard, Moon, Volume) */}
      <div className="fixed bottom-7 left-6 z-40 pointer-events-auto flex flex-col gap-2.5">
        {/* Keyboard Controls */}
        <button
          onClick={onOpenControls}
          aria-label="Flight Controls Help"
          title="Flight Controls Help"
          className="w-11 h-11 rounded-full bg-white/95 border border-black/5 shadow-luxury flex items-center justify-center text-slate-800 hover:scale-108 transition-transform"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
            <path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" />
          </svg>
        </button>

        {/* Day / Night Toggle */}
        <button
          onClick={onToggleNight}
          aria-label={isNight ? 'Switch to day' : 'Switch to night'}
          title={isNight ? 'Switch to day' : 'Switch to night'}
          className="w-11 h-11 rounded-full bg-white/95 border border-black/5 shadow-luxury flex items-center justify-center text-slate-800 hover:scale-108 transition-transform"
        >
          {isNight ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
            </svg>
          )}
        </button>

        {/* Ambient Sound Toggle */}
        <button
          onClick={onToggleSound}
          aria-label={isSoundOn ? 'Mute sound' : 'Play sound'}
          title={isSoundOn ? 'Mute sound' : 'Play sound'}
          className="w-11 h-11 rounded-full bg-white/95 border border-black/5 shadow-luxury flex items-center justify-center text-slate-800 hover:scale-108 transition-transform"
        >
          {isSoundOn ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#FF4B1F]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" />
              <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" />
              <path d="M17 9l5 6M22 9l-5 6" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
