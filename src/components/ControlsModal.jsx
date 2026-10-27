import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CONTROLS_LIST = [
  { key: 'Click', desc: 'Fly to a spot or an island' },
  { key: 'W A S D', desc: 'Steer' },
  { key: 'Shift', desc: 'Full throttle' },
  { key: 'Enter', desc: 'Moor at the island' },
  { key: 'Esc', desc: 'Cast off' },
  { key: 'Drag', desc: 'Look around' },
  { key: 'Scroll', desc: 'Zoom' }
];

export default function ControlsModal({ isOpen, onClose }) {
  const popoverRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e) => {
      // Don't close if clicking the toggle button itself (handled by toggle)
      if (e.target.closest('[data-controls-trigger="true"]')) return;
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDownOutside);
    return () => window.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed left-[78px] bottom-[72px] z-50 pointer-events-auto rounded-2xl bg-white/90 dark:bg-[#151f2e]/90 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_12px_44px_rgba(15,27,36,0.18)] p-3.5 sm:p-4 text-slate-800 dark:text-slate-100 select-none"
          style={{ minWidth: '240px', maxWidth: '300px' }}
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-[13px] leading-tight">
            {CONTROLS_LIST.map(({ key, desc }) => (
              <React.Fragment key={key}>
                <kbd className="justify-self-start px-2 py-0.5 rounded-md bg-black/6 dark:bg-white/10 text-slate-800 dark:text-slate-100 font-sans font-semibold text-[11px] tracking-tight">
                  {key}
                </kbd>
                <span className="text-slate-700 dark:text-slate-200 text-[13px] font-normal whitespace-nowrap">
                  {desc}
                </span>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
