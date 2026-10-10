import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  Sliders,
  Shield,
  Eye,
  MessageSquare,
  Heart,
  Fingerprint,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getLevelInfo, formatBanglaNumber } from '../utils/scoring';
import { TasbihModal } from './TasbihModal';

export const ProgressCard: React.FC = () => {
  const { dailyAmal, updateDailyAmal } = useApp();
  const [showTasbih, setShowTasbih] = useState(false);
  const [isCardCollapsed, setIsCardCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('amal_progress_card_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCard = () => {
    const next = !isCardCollapsed;
    setIsCardCollapsed(next);
    try {
      localStorage.setItem('amal_progress_card_collapsed', String(next));
    } catch {
      // ignore
    }
  };

  const levelDetails = getLevelInfo(dailyAmal.total_score || 0);
  const currentLvl = levelDetails.currentLevel;
  const nextLvl = levelDetails.nextLevel;
  const progressPct = levelDetails.progressPercent;

  if (isCardCollapsed) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs font-bangla">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{currentLvl.emoji}</span>
          <span className="text-white/80 font-bold">{currentLvl.name} লেভেল</span>
          <span className="text-[#D4AF37] font-mono font-bold text-sm">
            {formatBanglaNumber(dailyAmal.total_score || 0)} পয়েন্ট
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTasbih(true)}
            className="px-2.5 py-1 rounded-xl bg-[#D4AF37] text-[#0a1628] font-bold text-[11px] flex items-center gap-1 active:scale-95 shadow-sm"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>তাসবিহ</span>
          </button>

          <button
            onClick={toggleCard}
            className="px-2.5 py-1 rounded-xl bg-white/10 text-white/80 hover:text-white text-[11px] flex items-center gap-1"
            title="স্কোর ও মূল্যায়ন স্লাইডার বড় করে দেখুন"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>বিস্তারিত প্যানেল খুলুন</span>
          </button>
        </div>

        <TasbihModal isOpen={showTasbih} onClose={() => setShowTasbih(false)} />
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      
      {/* Top Banner: Score, Rank & Level */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        {/* Score & Emoji */}
        <div className="flex items-center gap-4">
          <div className="text-4xl sm:text-5xl shrink-0 p-2 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            {currentLvl.emoji}
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-black text-[#D4AF37] font-mono tracking-tight">
                {formatBanglaNumber(dailyAmal.total_score || 0)}
              </span>
              <span className="text-xs font-semibold text-white/60 font-bangla">
                / {nextLvl ? formatBanglaNumber(nextLvl.minPoints) : 'সর্বোচ্চ'} পয়েন্ট
              </span>
            </div>
            <p className="text-sm font-bold text-white tracking-wide font-bangla flex items-center gap-1.5 mt-0.5">
              <span>{currentLvl.name} লেভেল</span>
              <span className="text-xs text-white/50 font-normal">
                ({formatBanglaNumber(currentLvl.minPoints)}-{formatBanglaNumber(currentLvl.maxPoints)} পয়েন্ট)
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Digital Tasbih Quick Action Button */}
          <button
            onClick={() => setShowTasbih(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-black text-xs sm:text-sm font-bangla shadow-[0_10px_30px_rgba(212,175,55,0.3)] active:scale-95 transition-all"
          >
            <Fingerprint className="w-4 h-4" />
            <span>ডিজিটাল তাসবিহ (+১)</span>
          </button>

          {/* Minimize / Hide Button */}
          <button
            onClick={toggleCard}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
            title="স্কোর প্যানেল মিনিমাইজ / লুকান"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bangla">
          <span className="text-white/70 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>পরবর্তী লেভেলের অগ্রগতি</span>
          </span>
          <span className="font-bold text-[#D4AF37]">
            {formatBanglaNumber(progressPct)}% {nextLvl ? `(${nextLvl.name})` : '(পূর্ণ)'}
          </span>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div
            className="bg-[#D4AF37] h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, boxShadow: '0 0 10px #D4AF37' }}
          />
        </div>
      </div>

      {/* Behavior Percentages (Sliders) */}
      <div className="pt-2 border-t border-white/10 space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#D4AF37] font-bangla flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>আত্মশুদ্ধি ও আচরণের শতকরা মূল্যায়ন</span>
          </h4>
          <div className="text-[11px] font-bold text-emerald-300 font-bangla bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            উত্তম আচরণ: {formatBanglaNumber(dailyAmal.good_deeds_percent || 0)}%
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Slider 1: Gheebat */}
          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bangla">
              <span className="text-white/70 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>গীবত মুক্ত</span>
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {formatBanglaNumber(dailyAmal.gheebat_percent || 0)}%
              </span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-1">
              <div 
                className="bg-emerald-400 h-full transition-all" 
                style={{ width: `${dailyAmal.gheebat_percent || 0}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={dailyAmal.gheebat_percent || 0}
              onChange={(e) => updateDailyAmal({ gheebat_percent: Number(e.target.value) })}
              className="w-full accent-[#D4AF37] cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* Slider 2: Eye protection */}
          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bangla">
              <span className="text-white/70 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>চোখের হেফাজত</span>
              </span>
              <span className="font-bold text-cyan-400 font-mono">
                {formatBanglaNumber(dailyAmal.eye_protect_percent || 0)}%
              </span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-1">
              <div 
                className="bg-cyan-400 h-full transition-all" 
                style={{ width: `${dailyAmal.eye_protect_percent || 0}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={dailyAmal.eye_protect_percent || 0}
              onChange={(e) => updateDailyAmal({ eye_protect_percent: Number(e.target.value) })}
              className="w-full accent-[#D4AF37] cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* Slider 3: Tongue protection */}
          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bangla">
              <span className="text-white/70 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                <span>জবানের হেফাজত</span>
              </span>
              <span className="font-bold text-violet-400 font-mono">
                {formatBanglaNumber(dailyAmal.tongue_protect_percent || 0)}%
              </span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-1">
              <div 
                className="bg-violet-400 h-full transition-all" 
                style={{ width: `${dailyAmal.tongue_protect_percent || 0}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={dailyAmal.tongue_protect_percent || 0}
              onChange={(e) => updateDailyAmal({ tongue_protect_percent: Number(e.target.value) })}
              className="w-full accent-[#D4AF37] cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>
        </div>
      </div>

      <TasbihModal isOpen={showTasbih} onClose={() => setShowTasbih(false)} />
    </div>
  );
};
