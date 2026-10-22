import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ArrowRight, Quote, Compass, Send, MapPin, Mail, Coffee, Maximize2, Minimize2 } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

export default function SignalDrawer({ isOpen, onClose, onNextChapter }) {
  const [activeTab, setActiveTab] = useState('article'); // 'article' | 'contact'
  const [isZenMode, setIsZenMode] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    topic: 'Komentar Naskah & Apresiasi',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const { profile, articles } = PORTFOLIO_DATA;
  const article = articles.contact;

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - clientHeight > 0) {
      const progress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
      setReadProgress(progress);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 pointer-events-none flex ${isZenMode ? 'justify-center items-center p-3 sm:p-6' : 'justify-end'}`}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/65 pointer-events-auto"
        />

        {/* Signal / Article Drawer Sheet */}
        <motion.aside
          initial={isZenMode ? { scale: 0.95, opacity: 0 } : { x: '100%' }}
          animate={isZenMode ? { scale: 1, opacity: 1 } : { x: 0 }}
          exit={isZenMode ? { scale: 0.95, opacity: 0 } : { x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className={`relative h-full bg-[#FAF7F2] dark:bg-[#0F172A] border border-stone-200 dark:border-slate-800 shadow-2xl pointer-events-auto flex flex-col overflow-hidden text-slate-900 dark:text-white transition-all ${
            isZenMode ? 'w-full max-w-4xl rounded-3xl max-h-[92vh]' : 'w-full max-w-2xl border-l'
          }`}
        >
          {/* Scroll Reading Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-stone-200 dark:bg-slate-800 z-30">
            <div
              style={{ width: `${readProgress}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-[#FF4B1F] transition-all duration-150"
            />
          </div>

          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-stone-200 dark:border-slate-800 bg-[#F4EFEA] dark:bg-[#1E293B] z-20">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4B1F] block">
                  {article.chapter} · {article.category}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Pulau Titik Nol & Tugu Pal Putih · Malioboro
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex p-0.5 rounded-lg bg-stone-200 dark:bg-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('article')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'article'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-stone-300 dark:border-slate-600'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  Naskah Artikel
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'contact'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-stone-300 dark:border-slate-600'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  Kirim Catatan
                </button>
              </div>

              {/* Zen Fullscreen Toggle */}
              <button
                onClick={() => setIsZenMode(!isZenMode)}
                title={isZenMode ? 'Kembali ke Tampilan Drawer' : 'Buka Mode Layar Penuh (Zen Reader)'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors ml-1"
              >
                {isZenMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span className="hidden sm:inline">{isZenMode ? 'Samping' : 'Layar Penuh'}</span>
              </button>

              <button
                onClick={onClose}
                aria-label="Tutup Sinyal"
                className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 border border-stone-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors ml-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Drawer Scrollable Content */}
          <div
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-12 py-7 space-y-8 ${isZenMode ? 'max-w-3xl mx-auto w-full' : ''}`}
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

                {/* Hero Photo */}
                <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-800 shadow-md">
                  <img
                    src={article.heroImage}
                    alt={article.title}
                    className="w-full h-56 sm:h-72 object-cover"
                  />
                  <div className="p-3 bg-[#F4EFEA] dark:bg-[#1E293B] border-t border-stone-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-light flex items-center justify-between">
                    <span>Lentera malam dan senja di persimpangan jalan Malioboro Yogyakarta</span>
                    <span className="text-[#FF4B1F] font-medium">Dokumentasi Arsip</span>
                  </div>
                </div>

                {/* Lead Paragraph with Drop-Cap */}
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 font-serif leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:text-[#FF4B1F] first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                  {article.leadParagraph}
                </p>

                {/* Sections */}
                {article.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-4 pt-2">
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white border-l-3 border-[#FF4B1F] pl-3">
                      {sec.heading}
                    </h2>

                    {sec.content.map((p, pIdx) => (
                      <p key={pIdx} className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-light leading-relaxed">
                        {p}
                      </p>
                    ))}

                    {/* Pull Quote */}
                    {sec.quote && (
                      <div className="my-6 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 border-y border-r border-amber-200 dark:border-amber-900/40 text-slate-800 dark:text-slate-100 flex items-start gap-3">
                        <Quote size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="font-serif italic text-sm sm:text-base leading-relaxed font-normal">
                          "{sec.quote}"
                        </p>
                      </div>
                    )}

                    {/* Trivia Callout */}
                    {sec.trivia && (
                      <div className="p-4 rounded-xl bg-[#F4EFEA] dark:bg-[#1E293B] border border-stone-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <strong className="text-[#FF4B1F] font-semibold flex items-center gap-1.5">
                          <Compass size={13} />
                          Fakta Budaya
                        </strong>
                        <p className="leading-relaxed font-light">{sec.trivia}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Photo Gallery Grid */}
                <div className="space-y-3 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kajian Visual & Potret Senja Mataram
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {article.photoGallery.map((photo, pIdx) => (
                      <div key={pIdx} className="rounded-xl overflow-hidden border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
                        <img src={photo.url} alt={photo.caption} className="w-full h-36 object-cover" />
                        <p className="p-2.5 text-[11px] text-slate-600 dark:text-slate-400 leading-snug font-light">
                          {photo.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ) : (
              /* --- Reader Notes & Feedback Form --- */
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                    Tinggalkan Catatan atau Sapaan
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-light mt-1">
                    Punya cerita tentang sudut Jogja favorit Anda, atau ingin berdiskusi mengenai proyek kurasi visual? Silakan kirimkan pesan langsung kepada Gabriel.
                  </p>
                </div>

                {isSubmitted ? (
                  <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-3">
                    <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                    <h3 className="font-serif text-xl font-medium text-emerald-800 dark:text-emerald-300">
                      Matur Nuwun! Pesan Terkirim
                    </h3>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 font-light">
                      Catatan Anda telah diterima di atelier Tirtodipuran. Kami akan membalas melalui surel sesegera mungkin.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="Nama Anda"
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-stone-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4B1F]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Alamat Surel (Email)
                      </label>
                      <input
                        type="email"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        placeholder="surel@domain.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-stone-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4B1F]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Pesan atau Refleksi Anda
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        placeholder="Tuliskan pengalaman Anda saat membaca naskah artikel ini..."
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-stone-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#FF4B1F] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-full bg-[#111625] dark:bg-white text-white dark:text-[#111625] text-xs font-semibold hover:bg-[#FF4B1F] dark:hover:bg-[#FF4B1F] dark:hover:text-white transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Send size={13} />
                      <span>{isSubmitting ? 'Mengirim...' : 'Kirim Catatan'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
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
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-[#111625] dark:bg-white text-white dark:text-[#111625] text-xs font-semibold shadow-luxury hover:bg-[#FF4B1F] dark:hover:bg-[#FF4B1F] dark:hover:text-white transition-all group hover:scale-103"
            >
              <span>Terbang Kembali ke Bab I: Keraton</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
