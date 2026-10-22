import React, { useState, useMemo } from 'react';
import { 
  Compass, ChevronDown, ChevronUp, 
  Crown, Landmark, Sun, Droplets, Mountain, Wind, Navigation
} from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

// Theme configuration per destination island
const ISLAND_THEMES = {
  about: {
    icon: Crown,
    color: '#d97706',       // Royal Gold / Pareanom
    bgClass: 'bg-amber-500',
    name: 'Keraton'
  },
  work: {
    icon: Landmark,
    color: '#7c3aed',       // Candi Andesite / Royal Violet
    bgClass: 'bg-purple-600',
    name: 'Prambanan'
  },
  ratuboko: {
    icon: Sun,
    color: '#ea580c',       // Sunset Amber / Terracotta
    bgClass: 'bg-orange-500',
    name: 'Ratu Boko'
  },
  journal: {
    icon: Droplets,
    color: '#0284c7',       // Water Castle Azure
    bgClass: 'bg-sky-500',
    name: 'Tamansari'
  },
  breksi: {
    icon: Mountain,
    color: '#059669',       // Pine Emerald
    bgClass: 'bg-emerald-600',
    name: 'Breksi'
  },
  parangtritis: {
    icon: Wind,
    color: '#ca8a04',       // Coastal Dune Ochre
    bgClass: 'bg-yellow-500',
    name: 'Gumuk Pasir'
  },
  contact: {
    icon: Navigation,
    color: '#FF4B1F',       // Tugu Vermilion
    bgClass: 'bg-[#FF4B1F]',
    name: 'Titik Nol'
  }
};

export default function MiniMap({ stats, onSelectIsland }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredIsland, setHoveredIsland] = useState(null);

  const { islands } = PORTFOLIO_DATA;
  const { heading = 0, speed = 0, altitude = 210, nearIslandId = null } = stats || {};

  // Compact dimensions
  const mapWidth = 168;
  const mapHeight = 168;

  const worldToRadar = (wx, wz) => {
    const padding = 16;
    const rx = ((wx + 125) / 250) * (mapWidth - padding * 2) + padding;
    const rz = ((wz + 195) / 250) * (mapHeight - padding * 2) + padding;
    return {
      x: Math.max(padding, Math.min(mapWidth - padding, rx)),
      y: Math.max(padding, Math.min(mapHeight - padding, rz))
    };
  };

  const playerX = stats?.playerX ?? 0;
  const playerZ = stats?.playerZ ?? -50;
  const playerRadar = worldToRadar(playerX, playerZ);

  // Distance in meters
  const getDistanceMeters = (ix, iz) => {
    const dx = playerX - ix;
    const dz = playerZ - iz;
    return Math.round(Math.sqrt(dx * dx + dz * dz) * 8);
  };

  // Javanese cardinal direction
  const cardinal = useMemo(() => {
    const d = ((heading % 360) + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'LOR';
    if (d >= 22.5 && d < 67.5) return 'LOR-WETAN';
    if (d >= 67.5 && d < 112.5) return 'WETAN';
    if (d >= 112.5 && d < 157.5) return 'KIDUL-WETAN';
    if (d >= 157.5 && d < 202.5) return 'KIDUL';
    if (d >= 202.5 && d < 247.5) return 'KIDUL-KULON';
    if (d >= 247.5 && d < 292.5) return 'KULON';
    return 'LOR-KULON';
  }, [heading]);

  return (
    <div className="fixed bottom-6 right-5 z-40 pointer-events-auto select-none font-sans">
      <div className="flex flex-col items-end">
        {/* Compact Radar Card */}
        {isExpanded && (
          <div className="w-[196px] p-2.5 rounded-[22px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-black/10 dark:border-white/10 text-slate-800 dark:text-white shadow-[0_12px_36px_rgba(0,0,0,0.12)] mb-2 transition-all duration-200">
            
            {/* Header: Title & Altitude */}
            <div className="flex items-center justify-between pb-1.5 border-b border-black/5 dark:border-white/10 text-[10px]">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold tracking-tight">
                <Compass size={12} className="animate-spin-slow shrink-0" />
                <span>Kompas Mataram</span>
              </div>
              <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 font-semibold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800">
                {altitude}m
              </span>
            </div>

            {/* Circular Radar Screen */}
            <div className="relative w-full aspect-square my-2 rounded-2xl overflow-hidden border border-amber-500/25 bg-gradient-to-b from-sky-50/80 via-slate-50/70 to-amber-50/70 dark:from-slate-950 dark:via-[#0c121e] dark:to-slate-900 shadow-inner flex items-center justify-center">
              
              {/* Concentric Astrolabe Rings */}
              <div className="absolute inset-2 rounded-full border border-amber-500/15 pointer-events-none" />
              <div className="absolute inset-7 rounded-full border border-amber-500/20 border-dashed pointer-events-none" />
              <div className="absolute inset-13 rounded-full border border-amber-500/25 pointer-events-none" />

              {/* Flight Boundary Circle (Batas Wilayah Udara) */}
              {(() => {
                const bCenter = worldToRadar(0, -75);
                const bRadius = ((175 / 250) * (mapWidth - 32)) * 0.7;
                return (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <circle
                      cx={bCenter.x}
                      cy={bCenter.y}
                      r={bRadius}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                      opacity="0.38"
                    />
                  </svg>
                );
              })()}

              {/* Sumbu Filosofi (Merapi -> Tugu -> Keraton -> Laut Selatan) */}
              <div className="absolute top-0 bottom-0 left-[48%] -translate-x-1/2 w-[1px] border-l border-dashed border-amber-500/35 pointer-events-none" />

              {/* Radar Sonar Sweep Ray */}
              <div className="absolute inset-0 rounded-full pointer-events-none animate-[spin_5s_linear_infinite] origin-center opacity-30 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_280deg,rgba(245,158,11,0.25)_360deg)]" />

              {/* Cardinal Markers */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 pointer-events-none z-10 text-[8px] font-black text-amber-600 dark:text-amber-400">
                <span className="text-[7px] text-red-500">▲</span> LOR
              </div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 pointer-events-none z-10 text-[8px] font-black text-slate-400 dark:text-slate-500">
                KIDUL
              </div>
              <div className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[7.5px] font-bold text-slate-400 dark:text-slate-500 pointer-events-none">
                KULON
              </div>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[7.5px] font-bold text-slate-400 dark:text-slate-500 pointer-events-none">
                WETAN
              </div>

              {/* Hover Line Trajectory */}
              {hoveredIsland && (
                (() => {
                  const tgt = islands.find(i => i.id === hoveredIsland);
                  if (!tgt) return null;
                  const tgtRadar = worldToRadar(tgt.x, tgt.z);
                  return (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      <line
                        x1={`${(playerRadar.x / mapWidth) * 100}%`}
                        y1={`${(playerRadar.y / mapHeight) * 100}%`}
                        x2={`${(tgtRadar.x / mapWidth) * 100}%`}
                        y2={`${(tgtRadar.y / mapHeight) * 100}%`}
                        stroke="#FF4B1F"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.8"
                      />
                    </svg>
                  );
                })()
              )}

              {/* 7 Island Pin Badges */}
              {islands.map((isl) => {
                const pt = worldToRadar(isl.x, isl.z);
                const theme = ISLAND_THEMES[isl.id] || ISLAND_THEMES.about;
                const IconComp = theme.icon;
                const isNear = nearIslandId === isl.id;
                const isHovered = hoveredIsland === isl.id;
                const dist = getDistanceMeters(isl.x, isl.z);

                return (
                  <div
                    key={isl.id}
                    style={{
                      left: `${(pt.x / mapWidth) * 100}%`,
                      top: `${(pt.y / mapHeight) * 100}%`
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                    onMouseEnter={() => setHoveredIsland(isl.id)}
                    onMouseLeave={() => setHoveredIsland(null)}
                  >
                    <button
                      onClick={() => onSelectIsland(isl.id)}
                      className="group relative flex items-center justify-center focus:outline-none transition-transform hover:scale-130"
                    >
                      {/* Pulse when nearby */}
                      {isNear && (
                        <span
                          style={{ borderColor: theme.color }}
                          className="absolute w-6 h-6 rounded-full border-2 animate-ping opacity-70"
                        />
                      )}

                      {/* Icon Pin Dot */}
                      <div
                        style={{ backgroundColor: theme.color }}
                        className={`w-4 h-4 rounded-full border border-white dark:border-slate-800 flex items-center justify-center text-white shadow-xs transition-all ${
                          isHovered || isNear ? 'ring-2 ring-amber-400 scale-110' : ''
                        }`}
                      >
                        <IconComp size={8.5} strokeWidth={2.6} />
                      </div>

                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-slate-900/95 text-white shadow-lg text-[8.5px] whitespace-nowrap pointer-events-none z-30 border border-white/10 font-medium">
                          <div className="font-bold flex items-center gap-1">
                            <span>{theme.name}</span>
                            <span className="text-amber-400 font-mono">({dist}m)</span>
                          </div>
                          <span className="text-[7.5px] text-slate-300 block">Klik untuk terbang</span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Player Airship Blip */}
              <div
                style={{
                  left: `${(playerRadar.x / mapWidth) * 100}%`,
                  top: `${(playerRadar.y / mapHeight) * 100}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-25 transition-all duration-150"
              >
                <div
                  style={{ transform: `rotate(${heading}deg)` }}
                  className="relative w-6 h-6 flex items-center justify-center"
                >
                  {/* Subtle Forward Vision Cone */}
                  <div
                    style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}
                    className="absolute -top-4 w-7 h-5 bg-gradient-to-t from-[#FF4B1F]/35 to-transparent opacity-70"
                  />
                  {/* Ship Dot */}
                  <div className="w-3 h-3 rounded-full bg-[#FF4B1F] border border-white shadow-sm flex items-center justify-center relative">
                    <div className="absolute -top-0.5 w-1 h-1 bg-white rotate-45" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Telemetry (Speed & Heading) */}
            <div className="flex items-center justify-between text-[8.5px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
              <span>Kecepatan: <strong className="text-slate-800 dark:text-slate-200 font-mono">{speed} kt</strong></span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{heading}° {cardinal}</span>
            </div>
          </div>
        )}

        {/* Slim Toggle Pill Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-black/10 dark:border-white/10 text-slate-800 dark:text-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:scale-105 transition-all text-[11px] font-semibold"
        >
          <Compass size={12} className="text-[#FF4B1F]" />
          <span>Radar Peta</span>
          {isExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronUp size={12} className="text-slate-400" />}
        </button>
      </div>
    </div>
  );
}
