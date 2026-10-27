import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, MousePointer, Move, ZoomIn, Anchor, ArrowUp, ArrowDown } from 'lucide-react';

export default function ControlsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const bindings = [
    { key: 'W / S', desc: 'Akselerasi Maju & Rem Udara Pakem', icon: <Navigation size={14} /> },
    { key: 'A / D', desc: 'Belok Kiri / Kanan & Kemiringan Sayap (Banking)', icon: <span className="text-[11px] font-bold">◄ ►</span> },
    { key: 'Spasi', desc: 'Membubung Naik (Ascend ke atas awan)', icon: <ArrowUp size={14} /> },
    { key: 'Ctrl / C', desc: 'Menukik Turun (Descend mendekati pulau)', icon: <ArrowDown size={14} /> },
    { key: 'Shift', desc: 'Pendorong Cepat (Turbo Boost + Dynamic FOV)', icon: <span className="text-[11px] font-bold">⚡</span> },
    { key: 'E / Enter', desc: 'Berlabuh di Dermaga / Lepas Jangkar', icon: <Anchor size={14} /> },
    { key: 'Esc', desc: 'Lepas Jangkar / Tutup Naskah', icon: <span className="text-[11px] font-bold">✕</span> },
    { key: 'Klik Awan', desc: 'Terbang Autopilot ke titik tujuan', icon: <MousePointer size={14} /> },
    { key: 'Drag Mouse', desc: 'Putar Sudut Kamera Bebas 360° (Orbit)', icon: <Move size={14} /> },
    { key: 'Scroll', desc: 'Perbesar / Perkecil Jarak Pandang', icon: <ZoomIn size={14} /> },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          className="relative w-full max-w-md bg-[#F4EFEA] dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-black/10 dark:border-white/10 shadow-2xl space-y-4 text-slate-900 dark:text-white"
        >
          <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                Buku Petunjuk Kemudi Penerbangan
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
            {bindings.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs shadow-sm"
              >
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                  <span className="text-[#FF4B1F] shrink-0">{item.icon}</span>
                  <span className="font-light">{item.desc}</span>
                </div>
                <kbd className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 font-mono text-[11px] font-semibold text-slate-900 dark:text-white shrink-0 border border-black/10 dark:border-white/10 shadow-inner">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-500 dark:text-slate-400 font-light border-t border-black/5 dark:border-white/10">
            Arahkan kapal udara ke lingkaran dermaga emas untuk berlabuh.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
