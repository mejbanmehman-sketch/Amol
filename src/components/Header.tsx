import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Volume2,
  Bell,
  Download,
  Wifi,
  WifiOff,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Calendar,
  Sun,
  Moon,
  ArrowLeft,
  PhoneCall,
  FileText,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Users,
  Video
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatDateToBangla,
  getTodayDateString,
  formatBanglaNumber,
  calculateRemainingLife,
  getLevelInfo,
  format12HourTime
} from '../utils/scoring';
import { AlarmModal } from './AlarmModal';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const {
    user,
    selectedDate,
    shiftDate,
    jumpToToday,
    isOnline,
    testAlarmAudio,
    canInstallPwa,
    installPwa,
    dailyAmal,
    isAdmin,
    theme,
    toggleTheme
  } = useApp();

  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullHeaderCollapsed, setIsFullHeaderCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('amal_full_header_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleFullHeader = () => {
    const nextState = !isFullHeaderCollapsed;
    setIsFullHeaderCollapsed(nextState);
    try {
      localStorage.setItem('amal_full_header_collapsed', String(nextState));
    } catch {
      // ignore
    }
  };

  const [isStatsCollapsed, setIsStatsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('amal_header_panel_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleStatsPanel = () => {
    const nextState = !isStatsCollapsed;
    setIsStatsCollapsed(nextState);
    try {
      localStorage.setItem('amal_header_panel_collapsed', String(nextState));
    } catch {
      // ignore
    }
  };

  const isToday = selectedDate === getTodayDateString();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      const isPM = hours >= 12;
      const period = isPM ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const hFormatted = String(hours).padStart(2, '0');
      setCurrentTime(`${formatBanglaNumber(hFormatted)}:${formatBanglaNumber(minutes)}:${formatBanglaNumber(seconds)} ${period}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingLife = calculateRemainingLife(user || 25);
  const levelInfo = getLevelInfo(dailyAmal.total_score || 0);
  const userName = user?.name || 'মুহাম্মাদ আব্দুল্লাহ';
  const initialLetter = userName.charAt(0).toUpperCase() || 'Y';
  const isNotHome = location.pathname !== '/';

  const totalQaza = user?.total_qaza || 0;
  const qazaAdaied = user?.qaza_adaied || 0;
  const remainingQaza = Math.max(0, totalQaza - qazaAdaied);

  // If the user chooses to hide the entire top panel:
  if (isFullHeaderCollapsed) {
    return (
      <header className="sticky top-0 z-40 w-full bg-slate-900/95 dark:bg-[#0a1628]/95 backdrop-blur-md border-b border-white/10 shadow-lg transition-all font-bangla">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
          
          {/* User Name & Photo Avatar ONLY */}
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 cursor-pointer group select-none min-w-0"
            title="প্রোফাইল দেখতে ক্লিক করুন"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#D4AF37] rounded-xl flex items-center justify-center text-sm sm:text-base font-bold text-[#0a1628] shadow-[0_0_12px_rgba(212,175,55,0.3)] group-hover:scale-105 transition-transform shrink-0">
              {user?.photo ? (
                <img src={user.photo} alt={userName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                initialLetter
              )}
            </div>

            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-[#D4AF37] truncate">
                {userName}
              </h1>
              {isAdmin && (
                <span className="hidden sm:inline-flex px-1.5 py-0.2 text-[9px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 rounded-full">
                  পরিচালক
                </span>
              )}
            </div>
          </div>

          {/* Quick Expand Button to Open Full Panel */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/community')}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 text-[#D4AF37] text-xs font-bold transition-all flex items-center gap-1"
              title="দ্বীনি মজলিস ও কল"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">মজলিস</span>
            </button>

            <button
              onClick={toggleFullHeader}
              className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.3)] active:scale-95 transition-all"
              title="সম্পূর্ণ হেডার প্যানেল বিস্তারিত খুলুন"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>প্যানেল খুলুন</span>
            </button>
          </div>

        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 dark:bg-[#0a1628]/95 backdrop-blur-md border-b border-white/10 shadow-2xl transition-colors font-bangla">
      {/* Top Banner */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Left: User / App Avatar & Back button & Life Remaining Counter */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isNotHome && (
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-[#D4AF37] transition-all flex items-center gap-1 text-xs font-bangla shrink-0"
              title="আগের পেজে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">ফিরে যান</span>
            </button>
          )}

          <div 
            onClick={() => navigate('/profile')} 
            className="flex items-center gap-3 sm:gap-4 cursor-pointer group select-none min-w-0"
            title="প্রোফাইল ও জন্ম তারিখ / কাজা এডিট করতে ক্লিক করুন"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#D4AF37] rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold text-[#0a1628] shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-105 transition-transform shrink-0">
              {user?.photo ? (
                <img src={user.photo} alt={userName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                initialLetter
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#D4AF37] truncate tracking-wide">
                  {userName}
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 rounded-full flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" /> পরিচালক
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/70 font-mono truncate flex items-center gap-1.5">
                <span>বয়স: {formatBanglaNumber(remainingLife.currentAgeYears)} বছর</span>
                <span>•</span>
                <span className="text-[#D4AF37] font-semibold hover:underline">প্রোফাইল পরিবর্তন ✎</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Date Navigator & Quick Progress / Action Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 flex-wrap">
          
          {/* Date Navigator Pill (Immersive Pill Style) */}
          <div className="flex flex-col items-start md:items-end">
            <div className="flex items-center gap-2 sm:gap-3 bg-[#1a2a4a] rounded-full px-3 sm:px-4 py-1.5 border border-[#D4AF37]/30 shadow-md">
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                className="text-[#D4AF37] font-bold hover:scale-125 transition-transform px-1 text-sm active:scale-95"
                title="আগের দিন"
              >
                ←
              </button>
              <span className="text-xs sm:text-sm font-medium text-white/90 whitespace-nowrap">
                {formatDateToBangla(selectedDate)}
              </span>
              <button
                type="button"
                onClick={() => shiftDate(1)}
                className="text-[#D4AF37] font-bold hover:scale-125 transition-transform px-1 text-sm active:scale-95"
                title="পরের দিন"
              >
                →
              </button>
              {!isToday && (
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-[#D4AF37] text-[#0a1628] rounded-full hover:brightness-110 active:scale-95 transition-all shadow-sm"
                >
                  আজ
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] mt-1 text-[#D4AF37]/80 self-center md:self-end font-semibold">
              <span>সময়: {currentTime}</span>
              <span>•</span>
              <span>আমল পয়েন্ট: {formatBanglaNumber(dailyAmal.total_score || 0)}</span>
            </div>
          </div>

          {/* Action Icons Pill */}
          <div className="flex items-center gap-1.5">
            {/* Community / Live Calls Hub Link */}
            <button
              onClick={() => navigate('/community')}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
                location.pathname === '/community'
                  ? 'bg-[#D4AF37] text-[#0a1628] border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-white/5 text-[#D4AF37] hover:bg-white/10 border-white/10 hover:border-[#D4AF37]/40'
              }`}
              title="দ্বীনি ভাইদের মজলিস ও অডিও-ভিডিও কল"
              aria-label="দ্বীনি মজলিস ও কল"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">মজলিস ও কল</span>
            </button>

            {/* Full Panel Collapse Toggle Button */}
            <button
              onClick={toggleFullHeader}
              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/30 transition-all flex items-center gap-1 text-xs font-bold"
              title="সম্পূর্ণ হেডার প্যানেল হাইড / লুকান"
              aria-label="হেডার হাইড করুন"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="hidden sm:inline">হাইড</span>
            </button>

            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/5 text-[#D4AF37] hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/40 transition-colors"
              title={theme === 'dark' ? 'লাইট মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন'}
              aria-label="থিম পরিবর্তন"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* PWA Install Button */}
            {canInstallPwa && (
              <button
                onClick={installPwa}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[#D4AF37] text-[#0a1628] rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:brightness-110 active:scale-95 transition-all"
                title="অ্যাপ মোবাইলে ইন্সটল করুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ইন্সটল</span>
              </button>
            )}

            {/* Test Audio Alarm */}
            <button
              onClick={() => testAlarmAudio('adhan')}
              className="p-2 rounded-xl bg-white/5 text-[#D4AF37] hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/40 transition-colors"
              title="আজান ও এলার্মের সুর শুনুন"
              aria-label="আজানের সুর"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Alarm Modal trigger */}
            <button
              onClick={() => setShowAlarmModal(true)}
              className="p-2 rounded-xl bg-white/5 text-[#D4AF37] hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/40 transition-colors relative"
              title="এলার্ম ও নোটিফিকেশন"
              aria-label="এলার্ম"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D4AF37] animate-ping"></span>
            </button>

            {/* User / Profile Link */}
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-xl bg-white/5 text-[#D4AF37] hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/40 transition-colors"
              title="প্রোফাইল ও সেটিংস"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED COLLAPSIBLE TOP STATS STRIP: REMAINING LIFE (60-YEAR CALCULATION) & REMAINING QAZA PRAYERS */}
      {!isStatsCollapsed ? (
        <div className="bg-black/40 border-t border-white/5 py-1.5 px-3 sm:px-6 transition-all duration-300">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            
            {/* 1. Remaining Life Counter (৬০ বছর হিসেবে বাকি আয়ু) */}
            <div 
              onClick={() => navigate('/qaza')} 
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              title="কাজা ও জীবন হিসাব দেখতে ক্লিক করুন"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="text-white/70">বাকি আয়ু (৬০ বছর গড়):</span>
              <strong className="text-[#D4AF37] font-mono tracking-wide font-bold">
                {remainingLife.isPastAverage ? (
                  'গড় আয়ু পূর্ণ হয়েছে'
                ) : (
                  `${formatBanglaNumber(remainingLife.years)} বছর ${formatBanglaNumber(remainingLife.months)} মাস ${formatBanglaNumber(remainingLife.days)} দিন`
                )}
              </strong>
            </div>

            {/* 2. Remaining Qaza Prayers Counter (আর কত রাকাত কাজা বাকি আছে) */}
            <div className="flex items-center gap-2">
              <div 
                onClick={() => navigate('/qaza')} 
                className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                title="কাজা নামাজ ট্র্যাকার দেখতে ক্লিক করুন"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-white/70">মোট বাকি কাজা নামাজ:</span>
                <strong className="text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                  {formatBanglaNumber(remainingQaza)} রাকাত বাকি
                </strong>
              </div>

              {/* Quick Hide Button right in strip */}
              <button
                onClick={toggleStatsPanel}
                className="ml-2 text-[11px] text-white/40 hover:text-white/80 transition-colors px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10"
                title="প্যানেল সাময়িক হাইড করুন"
              >
                লুকান ✕
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* Collapsed minimal banner with re-open trigger */
        <div 
          onClick={toggleStatsPanel}
          className="bg-black/20 hover:bg-black/40 border-t border-white/5 py-0.5 px-3 sm:px-6 cursor-pointer flex items-center justify-center gap-2 text-[10px] text-white/50 hover:text-[#D4AF37] transition-all select-none"
          title="বাকি আয়ু ও কাজা প্যানেল আবার খুলতে ক্লিক করুন"
        >
          <ChevronDown className="w-3 h-3 text-[#D4AF37]" />
          <span>বাকি আয়ু ও কাজা স্ট্যাটাস প্যানেল খুলুন</span>
        </div>
      )}

      {/* Modals */}
      <AlarmModal isOpen={showAlarmModal} onClose={() => setShowAlarmModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
};
