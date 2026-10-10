import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Heart,
  Bookmark,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  FileText,
  Sliders,
  Check,
  RotateCcw,
  Layers,
  HelpCircle,
  Share2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALL_114_SURAHS, ALL_30_JUZ } from '../data/quranSurahList';
import { fetchHafeziPage, FetchedQuranPage, QuranAyah, TOTAL_HAFEZI_PAGES, getQuranPageImageUrl } from '../data/quranService';
import { formatBanglaNumber } from '../utils/scoring';
import { UploadedPdf } from '../types';

type TabType = 'quran' | 'duas' | 'notes' | 'pdf';

export const QuranDuaPage: React.FC = () => {
  const {
    duas,
    quranNotes,
    addQuranNote,
    deleteQuranNote,
    uploadedPdfs,
    addUploadedPdf,
    deleteUploadedPdf,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('quran');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Noorani Hafezi Quran State (Pages 1 to 611)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amal_hafezi_last_page_v3');
      if (saved) return Math.min(TOTAL_HAFEZI_PAGES, Math.max(1, Number(saved)));
    } catch {}
    return 1;
  });

  const [pageData, setPageData] = useState<FetchedQuranPage | null>(null);
  const [loadingPage, setLoadingPage] = useState<boolean>(true);
  const [pageInput, setPageInput] = useState<string>('1');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const touchStartX = useRef<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const quranContainerRef = useRef<HTMLDivElement | null>(null);

  // Dua States
  const [selectedDuaCategory, setSelectedDuaCategory] = useState<string>('সকল');
  const [duaSearch, setDuaSearch] = useState('');

  // PDF Viewer States
  const [selectedPdf, setSelectedPdf] = useState<UploadedPdf | null>(null);
  const [pdfUploadTitle, setPdfUploadTitle] = useState('');
  const [showPdfUploadModal, setShowPdfUploadModal] = useState(false);

  // Note Modal / Form States
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteSurah, setNoteSurah] = useState('পারা ১ / পৃষ্ঠা ১');
  const [noteAyah, setNoteAyah] = useState<number>(1);
  const [notePage, setNotePage] = useState<number>(1);
  const [noteText, setNoteText] = useState('');

  // Fetch page data whenever currentPage changes
  useEffect(() => {
    let isMounted = true;
    setLoadingPage(true);
    setPageInput(String(currentPage));

    // Stop previous audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }

    // Save bookmark
    try {
      localStorage.setItem('amal_hafezi_last_page_v3', String(currentPage));
    } catch {}

    fetchHafeziPage(currentPage).then((data) => {
      if (isMounted) {
        setPageData(data);
        setLoadingPage(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  // Handle Page Flipping
  const goToNextPage = () => {
    if (currentPage < TOTAL_HAFEZI_PAGES) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= TOTAL_HAFEZI_PAGES) {
      setCurrentPage(p);
      showToast(`পৃষ্ঠা ${formatBanglaNumber(p)}-এ যাওয়া হয়েছে`);
    } else {
      showToast(`অনুগ্রহ করে ১ থেকে ${formatBanglaNumber(TOTAL_HAFEZI_PAGES)} এর মধ্যে পৃষ্ঠা নম্বর দিন`);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
      showToast('ফুলস্ক্রিন কুরআন তিলাওয়াত মোড চালু হয়েছে');
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
      showToast('ফুলস্ক্রিন মোড বন্ধ করা হয়েছে');
    }
  };

  const handleSelectSurah = (surahNumber: number) => {
    const s = ALL_114_SURAHS.find((item) => item.number === surahNumber);
    if (s) {
      setCurrentPage(s.pageStart);
      showToast(`${s.nameBangla} (${formatBanglaNumber(s.pageStart)} নং পৃষ্ঠা)-এ যাওয়া হয়েছে`);
    }
  };

  const handleSelectJuz = (juzNumber: number) => {
    const j = ALL_30_JUZ.find((item) => item.number === juzNumber);
    if (j) {
      setCurrentPage(j.pageStart);
      showToast(`${j.nameBangla} (${formatBanglaNumber(j.pageStart)} নং পৃষ্ঠা)-এ যাওয়া হয়েছে`);
    }
  };

  const togglePageAudio = () => {
    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
      showToast('তিলাওয়াত বন্ধ করা হয়েছে');
    } else {
      // Stream first ayah audio of this page from Mishary Alafasy
      if (pageData && pageData.ayahs.length > 0) {
        const firstAyahGlobalNumber = pageData.ayahs[0].number;
        const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${firstAyahGlobalNumber}.mp3`;
        
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => setIsPlayingAudio(false);
        } else {
          audioRef.current.src = audioUrl;
        }

        audioRef.current.play().then(() => {
          setIsPlayingAudio(true);
          showToast('মিশারী রাশিদ আফাসীর সুমধুর কণ্ঠে তিলাওয়াত বাজছে...');
        }).catch(() => {
          showToast('অডিও লোড করতে ইন্টারনেট সংযোগ প্রয়োজন');
          setIsPlayingAudio(false);
        });
      }
    }
  };

  const handleSaveCurrentBookmark = () => {
    if (pageData) {
      addQuranNote(
        `${pageData.surahNameBangla} (${pageData.surahNameArabic})`,
        pageData.ayahs[0]?.numberInSurah || 1,
        currentPage,
        `বুকমার্ক: ${pageData.juzNameBangla}, পৃষ্ঠা ${formatBanglaNumber(currentPage)}`
      );
      showToast(`পৃষ্ঠা ${formatBanglaNumber(currentPage)} বুকমার্ক হিসেবে সংরক্ষিত হয়েছে`);
    }
  };

  const duaCategories = ['সকল', 'সকাল', 'সন্ধ্যা', 'প্রয়োজনীয়', 'ঘুম', 'নামাজ'];

  const filteredDuas = duas.filter((d) => {
    const matchCategory = selectedDuaCategory === 'সকল' || d.category === selectedDuaCategory;
    const matchSearch =
      d.title.toLowerCase().includes(duaSearch.toLowerCase()) ||
      d.bangla_meaning.toLowerCase().includes(duaSearch.toLowerCase()) ||
      d.bangla_pronunciation.toLowerCase().includes(duaSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast('অনুগ্রহ করে শুধুমাত্র PDF ফাইল নির্বাচন করুন');
      return;
    }

    const title = pdfUploadTitle.trim() || file.name.replace(/\.[^/.]+$/, '');
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      addUploadedPdf(title, file.name, dataUrl, sizeStr, 30);
      setPdfUploadTitle('');
      setShowPdfUploadModal(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addQuranNote(noteSurah, noteAyah, notePage, noteText.trim());
    setNoteText('');
    setShowNoteForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 font-bangla text-white">
      
      {/* Top Main Navigation Tabs */}
      <div className="grid grid-cols-4 p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-xl text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('quran')}
          className={`py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'quran'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>নূরানী কুরআন</span>
        </button>

        <button
          onClick={() => setActiveTab('duas')}
          className={`py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'duas'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>মাসনুন দোয়া</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'notes'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>বুকমার্ক ({quranNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf')}
          className={`py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'pdf'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>কিতাব PDF</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. NOORANI HAFEZI QURAN READER (PAGES 1 TO 604)           */}
      {/* ======================================================== */}
      {activeTab === 'quran' && (
        <div className="space-y-4">
          
          {/* Quick Jump & Controls Toolbar */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              
              {/* Surah Selector Dropdown */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                <select
                  value={pageData ? pageData.ayahs[0]?.surahNumber || 1 : 1}
                  onChange={(e) => handleSelectSurah(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#101e35] border border-[#D4AF37]/35 rounded-2xl text-[#D4AF37] font-semibold focus:outline-none focus:border-[#D4AF37]"
                >
                  {ALL_114_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {formatBanglaNumber(s.number)}. {s.nameBangla} ({s.nameArabic}) - পৃ: {formatBanglaNumber(s.pageStart)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Juz Selector Dropdown */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                <select
                  value={pageData?.juzNumber || 1}
                  onChange={(e) => handleSelectJuz(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#101e35] border border-[#D4AF37]/35 rounded-2xl text-white font-medium focus:outline-none focus:border-[#D4AF37]"
                >
                  {ALL_30_JUZ.map((j) => (
                    <option key={j.number} value={j.number}>
                      {j.nameBangla} - পৃ: {formatBanglaNumber(j.pageStart)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page Jump Direct Input */}
              <form onSubmit={handlePageJump} className="flex items-center gap-1.5">
                <span className="text-xs text-white/70">পৃষ্ঠা:</span>
                <input
                  type="number"
                  min="1"
                  max={TOTAL_HAFEZI_PAGES}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="w-16 px-2 py-1.5 text-center text-xs sm:text-sm font-bold bg-[#101e35] border border-[#D4AF37]/40 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                />
                <span className="text-xs text-white/60">/ {formatBanglaNumber(TOTAL_HAFEZI_PAGES)}</span>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#0a1628] text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
                >
                  যাও
                </button>
              </form>

            </div>

            {/* Sub Tools: Font Size, Audio Recitation, Fullscreen & Bookmark */}
            <div className="flex items-center justify-between border-t border-white/10 pt-2.5 flex-wrap gap-2 text-xs">
              
              {/* Font Sizer */}
              <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-xl border border-white/5">
                <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-white/70 mr-1">হরফ সাইজ:</span>
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-2 py-0.5 rounded-lg ${fontSize === 'normal' ? 'bg-[#D4AF37] text-[#0a1628] font-bold' : 'text-white/60'}`}
                >
                  সাধারণ
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-0.5 rounded-lg ${fontSize === 'large' ? 'bg-[#D4AF37] text-[#0a1628] font-bold' : 'text-white/60'}`}
                >
                  বড়
                </button>
                <button
                  onClick={() => setFontSize('huge')}
                  className={`px-2 py-0.5 rounded-lg ${fontSize === 'huge' ? 'bg-[#D4AF37] text-[#0a1628] font-bold' : 'text-white/60'}`}
                >
                  অতি বড়
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Fullscreen Reading Button */}
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-bold transition-all shadow-sm active:scale-95"
                  title="ফুলস্ক্রিন কুরআন তিলাওয়াত মোড"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFullscreen ? 'ফুলস্ক্রিন বন্ধ' : 'ফুলস্ক্রিন পড়ুন'}</span>
                </button>

                {/* Audio Reciter */}
                <button
                  onClick={togglePageAudio}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                    isPlayingAudio
                      ? 'bg-rose-600 text-white border-rose-500 font-bold animate-pulse'
                      : 'bg-white/10 hover:bg-white/20 text-[#D4AF37] border-[#D4AF37]/30'
                  }`}
                  title="পৃষ্ঠা তিলাওয়াত শুনুন"
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? 'তিলাওয়াত থামান' : 'তিলাওয়াত শুনুন'}</span>
                </button>

                {/* Bookmark current page */}
                <button
                  onClick={handleSaveCurrentBookmark}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 transition-all font-semibold"
                  title="পৃষ্ঠাটি বুকমার্কে রাখুন"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>বুকমার্ক</span>
                </button>
              </div>

            </div>
          </div>

          {/* Authentic Noorani Hafezi Mushaf Page Canvas */}
          <div className={`relative bg-[#fcfaf2] dark:bg-[#071322] border-4 border-[#D4AF37]/60 rounded-3xl p-4 sm:p-8 shadow-2xl overflow-hidden transition-all ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 overflow-y-auto max-w-none' : ''
          }`}>
            
            {/* Page Header (Right: Juz, Center: Page, Left: Surah) */}
            <div className="flex items-center justify-between border-b-2 border-[#D4AF37]/40 pb-3 mb-4 text-[#0a1628] dark:text-[#D4AF37] font-bold text-xs sm:text-sm sticky top-0 bg-[#fcfaf2] dark:bg-[#071322] z-10 py-1">
              <span className="font-semibold tracking-wide">
                {pageData?.juzNameBangla || '১ম পারা'}
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#D4AF37]/20 dark:bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/40">
                  <span>পৃষ্ঠা: {formatBanglaNumber(currentPage)}</span>
                  <span className="text-[10px] opacity-70">/ {formatBanglaNumber(TOTAL_HAFEZI_PAGES)}</span>
                </div>

                {isFullscreen && (
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs flex items-center gap-1 hover:bg-rose-500 hover:text-white"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>প্রস্থান</span>
                  </button>
                )}
              </div>

              <span className="font-amiri text-sm sm:text-base font-bold">
                {pageData?.surahNameArabic || 'سورة الفاتحة'}
              </span>
            </div>

            {/* Page Content Body */}
            {loadingPage ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-[#D4AF37]">
                  নূরানী হাফেজী পৃষ্ঠা {formatBanglaNumber(currentPage)} লোড হচ্ছে...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Surah Bismillah Banner if page starts a new Surah */}
                {pageData?.hasBismillah && (
                  <div className="text-center py-2 px-4 bg-[#D4AF37]/15 rounded-2xl border border-[#D4AF37]/30 my-2">
                    <p className="font-amiri text-lg sm:text-2xl text-[#0a1628] dark:text-[#D4AF37] font-bold">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </p>
                  </div>
                )}

                {/* Verses Layout with Classical Noorani Fonts */}
                <div
                  dir="rtl"
                  className={`font-amiri leading-[2.4] sm:leading-[2.6] text-right text-slate-900 dark:text-slate-100 transition-all ${
                    fontSize === 'normal'
                      ? 'text-lg sm:text-xl'
                      : fontSize === 'huge'
                      ? 'text-2xl sm:text-3xl'
                      : 'text-xl sm:text-2xl'
                  }`}
                  style={{ wordSpacing: '4px', textAlignLast: 'justify' }}
                >
                  {pageData?.ayahs.map((ayah) => (
                    <span key={ayah.number} className="inline transition-colors hover:text-[#D4AF37]">
                      {ayah.text}{' '}
                      <span className="inline-flex items-center justify-center mx-1 px-1.5 py-0.5 rounded-full text-xs font-mono text-[#D4AF37] border border-[#D4AF37]/40 bg-[#D4AF37]/10 align-middle">
                        ﴿{formatBanglaNumber(ayah.numberInSurah)}﴾
                      </span>{' '}
                    </span>
                  ))}
                </div>

              </div>
            )}

            {/* Page Footer Frame */}
            <div className="flex items-center justify-between border-t-2 border-[#D4AF37]/40 pt-3 mt-6 text-[11px] text-[#0a1628]/70 dark:text-white/60 font-mono">
              <span>নূরানী হাফেজী কুরআন শরীফ (৬১১ পৃষ্ঠা)</span>
              <span className="font-bold text-[#D4AF37]">পৃষ্ঠা {formatBanglaNumber(currentPage)}</span>
              <span>মনযিল • রুকু</span>
            </div>

            {/* In-Fullscreen Quick Flipping Bar */}
            {isFullscreen && (
              <div className="sticky bottom-2 mt-4 flex items-center justify-between bg-black/80 backdrop-blur-md border border-[#D4AF37]/40 rounded-2xl p-2.5 text-white">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 bg-white/10 hover:bg-[#D4AF37] hover:text-[#0a1628] rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>আগের পৃষ্ঠা</span>
                </button>

                <span className="text-xs font-bold text-[#D4AF37] font-mono">
                  {formatBanglaNumber(currentPage)} / {formatBanglaNumber(TOTAL_HAFEZI_PAGES)}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= TOTAL_HAFEZI_PAGES}
                  className="px-4 py-2 bg-[#D4AF37] text-[#0a1628] hover:brightness-110 rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-30"
                >
                  <span>পরের পৃষ্ঠা</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

          {/* Bottom Quick Page Turner Controls */}
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-3 shadow-xl">
            
            {/* Previous Page (Arabic reading: page number increases or decreases) */}
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all ${
                currentPage <= 1
                  ? 'bg-white/5 text-white/30 border-transparent cursor-not-allowed'
                  : 'bg-white/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 active:scale-95'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>আগের পৃষ্ঠা ({formatBanglaNumber(Math.max(1, currentPage - 1))})</span>
            </button>

            <span className="text-xs sm:text-sm font-bold text-[#D4AF37]">
              {formatBanglaNumber(currentPage)} / {formatBanglaNumber(TOTAL_HAFEZI_PAGES)}
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= TOTAL_HAFEZI_PAGES}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border transition-all ${
                currentPage >= TOTAL_HAFEZI_PAGES
                  ? 'bg-white/5 text-white/30 border-transparent cursor-not-allowed'
                  : 'bg-[#D4AF37] text-[#0a1628] border-[#D4AF37] hover:brightness-110 active:scale-95 shadow-md'
              }`}
            >
              <span>পরের পৃষ্ঠা ({formatBanglaNumber(Math.min(TOTAL_HAFEZI_PAGES, currentPage + 1))})</span>
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MASNUN DUAS SECTION                                   */}
      {/* ======================================================== */}
      {activeTab === 'duas' && (
        <div className="space-y-4">
          {/* Dua Search & Category Filters */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="দোয়া খুঁজুন (যেমন: সকাল, ঘুম, টয়লেট, খাদ্য)..."
                value={duaSearch}
                onChange={(e) => setDuaSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-black/40 border border-white/15 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {duaCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedDuaCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedDuaCategory === cat
                      ? 'bg-[#D4AF37] text-[#0a1628] font-bold shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Duas List */}
          <div className="space-y-3">
            {filteredDuas.length === 0 ? (
              <div className="p-8 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10">
                কোনো দোয়া পাওয়া যায়নি
              </div>
            ) : (
              filteredDuas.map((dua) => (
                <div
                  key={dua.id}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl space-y-3 hover:border-[#D4AF37]/40 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <h3 className="text-base font-bold text-[#D4AF37]">{dua.title}</h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] font-semibold border border-[#D4AF37]/30">
                      {dua.category}
                    </span>
                  </div>

                  {/* Arabic text */}
                  <div dir="rtl" className="font-amiri text-xl sm:text-2xl text-right text-white font-bold leading-relaxed py-1">
                    {dua.arabic}
                  </div>

                  {/* Pronunciation & Meaning */}
                  <div className="space-y-1.5 text-xs text-white/90 bg-black/20 p-3 rounded-2xl">
                    <p>
                      <span className="font-bold text-[#D4AF37]">উচ্চারণ:</span> {dua.bangla_pronunciation}
                    </p>
                    <p>
                      <span className="font-bold text-emerald-400">অর্থ:</span> {dua.bangla_meaning}
                    </p>
                  </div>

                  {dua.virtue && (
                    <p className="text-[11px] text-white/60 italic">
                      <span className="font-semibold text-white/80">ফজিলত:</span> {dua.virtue}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BOOKMARKS & NOTES SECTION                             */}
      {/* ======================================================== */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 shadow-xl">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">কুরআনের বুকমার্ক ও ব্যক্তিগত নোট</h3>
              <p className="text-xs text-white/60">তিলাওয়াতের স্মরণীয় আয়াত ও পৃষ্ঠার তালিকা</p>
            </div>
            <button
              onClick={() => setShowNoteForm(!showNoteForm)}
              className="px-3.5 py-2 rounded-2xl bg-[#D4AF37] text-[#0a1628] font-bold text-xs flex items-center gap-1.5 hover:brightness-110 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>{showNoteForm ? 'বাতিল' : 'নতুন নোট'}</span>
            </button>
          </div>

          {showNoteForm && (
            <form onSubmit={handleSaveNote} className="bg-[#0f213d] border border-[#D4AF37]/50 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
              <h4 className="text-xs font-bold text-[#D4AF37]">কুরআন আয়াত নোট লিখুন</h4>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-white/70 mb-1">সূরা / স্থান</label>
                  <input
                    type="text"
                    value={noteSurah}
                    onChange={(e) => setNoteSurah(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-black/40 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/70 mb-1">পৃষ্ঠা নং</label>
                  <input
                    type="number"
                    min="1"
                    max="604"
                    value={notePage}
                    onChange={(e) => setNotePage(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-black/40 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/70 mb-1">আয়াত নং</label>
                  <input
                    type="number"
                    value={noteAyah}
                    onChange={(e) => setNoteAyah(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-black/40 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-white/70 mb-1">নোট / অনুভূতি</label>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="এই আয়াত বা পৃষ্ঠা সম্পর্কে আপনার ভাবনা লিখুন..."
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNoteForm(false)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white/10 text-white/70 hover:bg-white/20"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#D4AF37] text-[#0a1628] hover:brightness-110"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {quranNotes.length === 0 ? (
              <div className="p-8 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10">
                কোনো নোট সংরক্ষিত নেই। নূরানী কুরআন পড়ার সময় 'বুকমার্ক' বাটনে ক্লিক করে নোট যুক্ত করতে পারেন।
              </div>
            ) : (
              quranNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-3 hover:border-[#D4AF37]/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#D4AF37]">{note.surah}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        পৃষ্ঠা: {formatBanglaNumber(note.page)} • আয়াত: {formatBanglaNumber(note.ayah)}
                      </span>
                    </div>
                    <p className="text-xs text-white/90">{note.note}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setCurrentPage(note.page);
                        setActiveTab('quran');
                        showToast(`পৃষ্ঠা ${formatBanglaNumber(note.page)}-এ যাওয়া হয়েছে`);
                      }}
                      className="px-2.5 py-1 text-xs rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40"
                    >
                      পড়ুন
                    </button>
                    <button
                      onClick={() => deleteQuranNote(note.id)}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-rose-400"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PDF KITAAB & OFFLINE VIEWER                           */}
      {/* ======================================================== */}
      {activeTab === 'pdf' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 shadow-xl">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">ব্যক্তিগত কিতাব ও কুরআন PDF রিডার</h3>
              <p className="text-xs text-white/60">আপনার ডিভাইসের যেকোনো ইসলামিক কিতাব ও তাফসীর আপলোড করে পড়ুন</p>
            </div>
            <button
              onClick={() => setShowPdfUploadModal(true)}
              className="px-3.5 py-2 rounded-2xl bg-[#D4AF37] text-[#0a1628] font-bold text-xs flex items-center gap-1.5 hover:brightness-110 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>PDF যোগ করুন</span>
            </button>
          </div>

          {/* Upload Modal */}
          {showPdfUploadModal && (
            <div className="bg-[#0f213d] border border-[#D4AF37]/50 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
              <h4 className="text-xs font-bold text-[#D4AF37]">ডিভাইস থেকে PDF কিতাব আপলোড করুন</h4>
              
              <div>
                <label className="block text-[11px] text-white/70 mb-1">কিতাবের শিরোনাম</label>
                <input
                  type="text"
                  placeholder="যেমন: নূরানী কুরআন শরীফ, মাআরিফুল কুরআন ইত্যাদি"
                  value={pdfUploadTitle}
                  onChange={(e) => setPdfUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/40 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/70 mb-1">PDF ফাইল নির্বাচন করুন</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37] file:text-[#0a1628] hover:file:brightness-110"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowPdfUploadModal(false)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white/10 text-white/70 hover:bg-white/20"
                >
                  বাতিল
                </button>
              </div>
            </div>
          )}

          {/* PDF List */}
          <div className="space-y-3">
            {uploadedPdfs.length === 0 ? (
              <div className="p-8 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10">
                কোনো PDF ফাইল যোগ করা নেই। আপনার ডিভাইসের নূরানী কুরআন বা কিতাব PDF যোগ করতে পারেন।
              </div>
            ) : (
              uploadedPdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#D4AF37]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#D4AF37]">{pdf.title}</h4>
                      <p className="text-[10px] text-white/60">{pdf.fileName} • {pdf.fileSize}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPdf(pdf)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-[#D4AF37] text-[#0a1628] font-bold hover:brightness-110"
                    >
                      পড়ুন
                    </button>
                    <button
                      onClick={() => deleteUploadedPdf(pdf.id)}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Render Selected PDF */}
          {selectedPdf && (
            <div className="bg-black/80 rounded-3xl p-4 border border-[#D4AF37]/40 space-y-3 mt-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="text-xs sm:text-sm font-bold text-[#D4AF37]">{selectedPdf.title}</h4>
                <button
                  onClick={() => setSelectedPdf(null)}
                  className="text-xs px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  ভিউয়ার বন্ধ করুন
                </button>
              </div>
              <iframe
                src={selectedPdf.fileData}
                className="w-full h-[600px] rounded-2xl border border-white/10 bg-white"
                title={selectedPdf.title}
              />
            </div>
          )}
        </div>
      )}

    </div>
  );
};
