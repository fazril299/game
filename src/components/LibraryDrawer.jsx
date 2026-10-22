import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ArrowRight, Quote, Compass, BookOpen, Maximize2, Minimize2 } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

export default function LibraryDrawer({ isOpen, onClose, onNextChapter }) {
  const [activeTab, setActiveTab] = useState('article'); // 'article' | 'notes'
  const [isZenMode, setIsZenMode] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  if (!isOpen) return null;

  const { journal, articles } = PORTFOLIO_DATA;
  const article = articles.journal;

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - clientHeight > 0) {
      const progress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
      setReadProgress(progress);
    }
  };

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 pointer-events-none flex ${isZenMode ? 'justify-center items-center p-3 sm:p-6' : 'justify-end'}`}>
        {/* Backdrop (Solid Dimming) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/65 pointer-events-auto"
        />

        {/* Library / Article Drawer Sheet (Solid non-glass surface) */}
        <motion.aside
          initial={isZenMode ? { scale: 0.95, opacity: 0 } : { x: '100%' }}
          animate={isZenMode ? { scale: 1, opacity: 1 } : { x: 0 }}
          exit={isZenMode ? { scale: 0.95, opacity: 0 } : { x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className={`relative h-full bg-[#FAF7F2] dark:bg-[#0F172A] border border-stone-200 dark:border-slate-800 shadow-2xl pointer-events-auto flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-all ${
            isZenMode ? 'w-full max-w-4xl rounded-2xl max-h-[92vh]' : 'w-full max-w-2xl border-l'
          }`}
        >
          {/* Scroll Reading Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-stone-200 dark:bg-slate-800 z-30">
            <div
              style={{ width: `${readProgress}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-[#1da8a4] transition-all duration-150"
            />
          </div>

          {/* Top Header Bar (Solid) */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-stone-200 dark:border-slate-800 bg-[#F4EFEA] dark:bg-[#1E293B] z-20">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1da8a4] block">
                  {article.chapter} · {article.category}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Pulau Istana Air Tamansari · Umbul Pasiraman
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex p-0.5 rounded-lg bg-stone-200 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setActiveTab('article')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'article'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Naskah Artikel
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'notes'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Catatan ({journal.length})
                </button>
              </div>

              {/* Zen Fullscreen Toggle */}
              <button
                onClick={() => setIsZenMode(!isZenMode)}
                title={isZenMode ? 'Kembali ke Tampilan Drawer' : 'Buka Mode Layar Penuh (Zen Reader)'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-sm ml-1"
              >
                {isZenMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span className="hidden sm:inline">{isZenMode ? 'Samping' : 'Layar Penuh'}</span>
              </button>

              <button
                onClick={onClose}
                aria-label="Tutup Pustaka"
                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors ml-1 shadow-sm text-slate-700 dark:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Drawer Scrollable Content */}
          <div
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-12 py-7 space-y-8 bg-[#FAF7F2] dark:bg-[#0F172A] ${isZenMode ? 'max-w-3xl mx-auto w-full' : ''}`}
          >
            {activeTab === 'article' ? (
              /* --- Article Reader Mode --- */
              <article className="space-y-7">
                {/* Header Metadata */}
                <div className="space-y-3 border-b border-stone-200 dark:border-slate-800 pb-6">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-semibold text-slate-900 dark:text-slate-200 tracking-wide uppercase text-[11px]">
                      {article.chapter} · {article.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      {article.readTime}
                    </span>
                    <span>•</span>
                    <span>Oleh {article.author}</span>
                  </div>

                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal leading-tight tracking-tight text-slate-900 dark:text-white">
                    {article.title}
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-light leading-relaxed italic">
                    "{article.subtitle}"
                  </p>
                </div>

                {/* Hero Photo (Solid Card) */}
                <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-800">
                  <img
                    src={article.heroImage}
                    alt={article.title}
                    className="w-full h-56 sm:h-72 object-cover"
                  />
                  <div className="p-3 bg-stone-100 dark:bg-slate-800 border-t border-stone-200 dark:border-slate-750 text-[11px] text-slate-600 dark:text-slate-400 font-light flex items-center justify-between">
                    <span>Lorong bawah air dan tangga melingkar Sumur Gumuling Tamansari</span>
                    <span className="text-[#1da8a4] font-semibold">Dokumentasi Arsip</span>
                  </div>
                </div>

                {/* Lead Paragraph with Drop-Cap */}
                <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 font-serif leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:text-[#1da8a4] first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                  {article.leadParagraph}
                </p>

                {/* Sections */}
                {article.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-4 pt-2">
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white border-l-4 border-[#1da8a4] pl-3">
                      {sec.heading}
                    </h2>

                    {sec.content.map((p, pIdx) => (
                      <p key={pIdx} className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-light leading-relaxed">
                        {p}
                      </p>
                    ))}

                    {/* Pull Quote (Solid Card) */}
                    {sec.quote && (
                      <div className="my-6 p-5 rounded-xl bg-teal-50 dark:bg-teal-950/50 border-l-4 border-teal-500 border-stone-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex items-start gap-3 shadow-sm">
                        <Quote size={20} className="text-teal-600 shrink-0 mt-0.5" />
                        <p className="font-serif italic text-sm sm:text-base leading-relaxed font-normal">
                          "{sec.quote}"
                        </p>
                      </div>
                    )}

                    {/* Trivia Callout (Solid Card) */}
                    {sec.trivia && (
                      <div className="p-4 rounded-xl bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1 shadow-sm">
                        <strong className="text-[#1da8a4] font-semibold flex items-center gap-1.5">
                          <Compass size={13} />
                          Fakta Sejarah
                        </strong>
                        <p className="leading-relaxed font-light">{sec.trivia}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Photo Gallery Grid (Solid Cards) */}
                <div className="space-y-3 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kajian Arsitektur Air & Lengkungan Bata
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {article.photoGallery.map((photo, pIdx) => (
                      <div key={pIdx} className="rounded-xl overflow-hidden border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                        <img src={photo.url} alt={photo.caption} className="w-full h-36 object-cover" />
                        <p className="p-3 text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-light border-t border-stone-100 dark:border-slate-700/60 bg-stone-50 dark:bg-slate-800/80">
                          {photo.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ) : (
              /* --- Field Notes Mode (Solid Cards) --- */
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                    Catatan Refleksi Lapangan
                  </h2>
                  <p className="text-xs text-slate-500 font-light">
                    Koleksi esai pendek tentang pengamatan cahaya, kriya, dan lanskap Yogyakarta.
                  </p>
                </div>

                <div className="space-y-4">
                  {journal.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold uppercase tracking-wider text-[#1da8a4]">
                          {item.category}
                        </span>
                        <span>{item.readTime}</span>
                      </div>
                      <h3 className="font-serif text-lg font-medium text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                        {item.summary}
                      </p>
                      <div className="pt-2 text-xs text-slate-400 border-t border-stone-100 dark:border-slate-750">
                        {item.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions (Solid Bar) */}
          <div className="p-5 sm:p-6 border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F4EFEA] dark:bg-[#1E293B]">
            <button
              onClick={onClose}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline underline-offset-4"
            >
              Lepas Jangkar & Terbang Bebas [Esc]
            </button>

            <button
              onClick={() => {
                onClose();
                if (onNextChapter) onNextChapter();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-[#111625] dark:bg-white text-white dark:text-[#111625] text-xs font-semibold shadow-md hover:bg-[#FF4B1F] dark:hover:bg-[#FF4B1F] dark:hover:text-white transition-all group hover:scale-103"
            >
              <span>Lanjut Terbang ke Bab IV: Tugu & Titik Nol</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
