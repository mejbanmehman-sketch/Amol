import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Sparkles,
  Trophy,
  Megaphone,
  ArrowRight,
  BookOpen,
  History,
  Fingerprint,
  MessageSquare,
  Phone,
  Video,
  X,
  Gift
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBanglaNumber } from '../utils/scoring';
import { AdminAnnouncement } from '../types';
import { PrayerTimesCard } from '../components/PrayerTimesCard';
import { ProgressCard } from '../components/ProgressCard';
import { AmalSections } from '../components/AmalSections';
import { TasbihModal } from '../components/TasbihModal';

export const DashboardPage: React.FC = () => {
  const { publicCommunityCounter } = useApp();
  const navigate = useNavigate();
  const [showTasbih, setShowTasbih] = useState(false);
  const [announcement, setAnnouncement] = useState<AdminAnnouncement | null>(null);
  const [dismissNotice, setDismissNotice] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('amal_admin_announcement_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.is_active) {
          setAnnouncement(parsed);
        }
      }
    } catch {}
  }, []);

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-3 sm:px-4 py-4 font-bangla pb-24">
      
      {/* 1. PINNED ADMIN ANNOUNCEMENT / PRIZE BANNER (If Active & Not Dismissed) */}
      {announcement && !dismissNotice && (
        <div className="rounded-3xl bg-gradient-to-r from-[#D4AF37]/25 via-amber-950/40 to-black/60 border border-[#D4AF37]/50 p-4 sm:p-5 shadow-xl relative animate-fadeIn flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37] text-[#0a1628] shadow-md shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0a1628] text-[10px] font-bold">
                  বিশেষ প্রতিযোগিতা ও নোটিশ
                </span>
                <span className="text-[10px] text-white/50">{announcement.deadline} পর্যন্ত</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{announcement.title}</h3>
              <p className="text-white/80 line-clamp-2 leading-relaxed text-[11px] sm:text-xs">
                {announcement.content}
              </p>
              {announcement.prize_details && (
                <p className="text-[#D4AF37] font-semibold text-[11px] flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span>{announcement.prize_details}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => navigate('/community')}
              className="px-3.5 py-1.5 bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <span>মজলিসে দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDismissNotice(true)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white"
              title="নোটিশ বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. PUBLIC COMMUNITY COUNTER CARD (With transparent labeling) */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#06101e] to-black/60 border border-emerald-500/30 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
                আমাদের কমিউনিটি কাউন্টার
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
              <span className="text-[#D4AF37]">{formatBanglaNumber(publicCommunityCounter)}+</span>
              <span className="text-xs font-bangla font-semibold text-white/70">দ্বীনি অংশগ্রহণকারী</span>
            </h2>
            <p className="text-[10px] sm:text-xs text-white/50">
              বিশ্বব্যাপী আমল ট্র্যাকার ব্যবহারকারী ও দ্বীনি ভাইবোনদের সম্মিলিত আমল ট্র্যাকিং সংখ্যা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
          <button
            onClick={() => navigate('/community')}
            className="px-4 py-2 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>দ্বীনি মজলিস ও সাথী</span>
          </button>
        </div>
      </div>

      {/* 3. QUICK SHORTCUTS STRIP */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-xs">
        <button
          onClick={() => {
            const el = document.getElementById('prayer-times-card');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-white/80 hover:text-[#D4AF37] transition-all group"
        >
          <span className="text-base group-hover:scale-110 transition-transform">🕌</span>
          <span className="text-[10px] font-semibold">নামাজ</span>
        </button>

        <button
          onClick={() => navigate('/qaza')}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-white/80 hover:text-[#D4AF37] transition-all group"
        >
          <History className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-semibold">কাজা নামাজ</span>
        </button>

        <button
          onClick={() => navigate('/quran')}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-white/80 hover:text-[#D4AF37] transition-all group"
        >
          <BookOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-semibold">কুরআন তিলাওয়াত</span>
        </button>

        <button
          onClick={() => setShowTasbih(true)}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-white/80 hover:text-[#D4AF37] transition-all group"
        >
          <Fingerprint className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-semibold">ডিজিটাল তাসবিহ</span>
        </button>

        <button
          onClick={() => navigate('/community')}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-white/80 hover:text-[#D4AF37] transition-all group"
        >
          <MessageSquare className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-semibold">মজলিস</span>
        </button>

        <button
          onClick={() => navigate('/community')}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-white/80 hover:text-[#D4AF37] transition-all group"
        >
          <Phone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-semibold">অডিও কল</span>
        </button>

        <button
          onClick={() => navigate('/community')}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-white/80 hover:text-[#D4AF37] transition-all group"
        >
          <Video className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-semibold">ভিডিও চ্যাট</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-white/80 hover:text-[#D4AF37] transition-all group"
        >
          <span className="text-base group-hover:scale-110 transition-transform">👤</span>
          <span className="text-[10px] font-semibold">প্রোফাইল</span>
        </button>
      </div>

      {/* 4. PRAYER TIMES CARD */}
      <div id="prayer-times-card">
        <PrayerTimesCard />
      </div>

      {/* 5. TODAY'S PROGRESS, RANK & BEHAVIOR SLIDERS */}
      <ProgressCard />

      {/* 6. 10 AMAL SECTIONS */}
      <AmalSections />

      {/* Tasbih Modal */}
      <TasbihModal isOpen={showTasbih} onClose={() => setShowTasbih(false)} />

    </div>
  );
};
