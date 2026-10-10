import React, { useState } from 'react';
import {
  History,
  Hourglass,
  Clock,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Heart,
  Sparkles,
  Award,
  Calendar,
  Layers,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateRemainingLife, formatBanglaNumber } from '../utils/scoring';

export const QazaTrackerPage: React.FC = () => {
  const { user, updateQazaTarget, repayQazaSalah, showToast } = useApp();
  
  const remainingLife = calculateRemainingLife(user || 25);

  // Qaza states from user profile
  const totalQazaRakat = user?.total_qaza || 150;
  const repaidQazaRakat = user?.qaza_adaied || 0;
  const remainingQazaRakat = Math.max(0, totalQazaRakat - repaidQazaRakat);
  const qazaProgressPercent = totalQazaRakat > 0 ? Math.min(100, Math.round((repaidQazaRakat / totalQazaRakat) * 100)) : 100;

  // Custom Quick Repay
  const [customRepayInput, setCustomRepayInput] = useState<number>(2);
  const [showEditTotalModal, setShowEditTotalModal] = useState(false);
  const [newTotalQaza, setNewTotalQaza] = useState<number>(totalQazaRakat);

  // Individual Prayer Rakat calculation helper
  const [fajrMissed, setFajrMissed] = useState<number>(0);
  const [dhuhrMissed, setDhuhrMissed] = useState<number>(0);
  const [asrMissed, setAsrMissed] = useState<number>(0);
  const [maghribMissed, setMaghribMissed] = useState<number>(0);
  const [ishaMissed, setIshaMissed] = useState<number>(0);
  const [witrMissed, setWitrMissed] = useState<number>(0);

  const handleQuickAdd = (rakatCount: number) => {
    repayQazaSalah(rakatCount);
  };

  const handleSaveTotalQaza = (e: React.FormEvent) => {
    e.preventDefault();
    updateQazaTarget(newTotalQaza);
    setShowEditTotalModal(false);
  };

  const handleCalculateFromDays = (days: number) => {
    // 1 day missed = 2 (Fajr) + 4 (Dhuhr) + 4 (Asr) + 3 (Maghrib) + 4 (Isha) + 3 (Witr) = 20 rakat
    const totalCalc = days * 20;
    setNewTotalQaza(totalCalc);
    showToast(`${days} দিনের কাজা হিসাব: মোট ${formatBanglaNumber(totalCalc)} রাকাত`);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 font-bangla text-white">
      
      {/* 1. LIFETIME REMAINING CLOCK (মরণ স্মরণ ও বাকি আয়ু) */}
      <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center shadow-sm">
              <Hourglass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#D4AF37]">বাকি জীবন ও সময় গণনা (মরণ স্মরণ)</h2>
              <p className="text-xs text-white/50">উম্মতের গড় আয়ু ৬০ বছর হিসেবে আনুমানিক বাকি সময় ও নিঃশ্বাস</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/60">বর্তমান বয়স:</span>
            <strong className="text-[#D4AF37] ml-1.5 text-sm">
              {formatBanglaNumber(remainingLife.currentAgeYears)} বছর {formatBanglaNumber(remainingLife.currentAgeMonths)} মাস {formatBanglaNumber(remainingLife.currentAgeDays)} দিন
            </strong>
          </div>
        </div>

        {/* Life Remaining Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] font-mono">
              {formatBanglaNumber(remainingLife.years)}
            </span>
            <span className="block text-xs font-semibold text-white/70">বছর বাকি</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] font-mono">
              {formatBanglaNumber(remainingLife.months)}
            </span>
            <span className="block text-xs font-semibold text-white/70">মাস বাকি</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] font-mono">
              {formatBanglaNumber(remainingLife.days)}
            </span>
            <span className="block text-xs font-semibold text-white/70">দিন বাকি</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1a2a4a] border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)] space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] font-mono">
              {formatBanglaNumber(remainingLife.totalDays)}
            </span>
            <span className="block text-xs font-bold text-amber-200">মোট দিন বাকি</span>
          </div>
        </div>

        {/* Motivational Hadith */}
        <div className="p-3.5 rounded-2xl bg-[#1a2a4a] border border-[#D4AF37]/30 text-xs text-amber-100/90 leading-relaxed flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <p>
            রাসূলুল্লাহ (সা.) বলেছেন: <em>&ldquo;পাঁচটি জিনিস আসার আগে পাঁচটি জিনিসকে মূল্যায়ন করো: বার্ধক্যের পূর্বে তোমার যৌবনকে এবং মৃত্যুর পূর্বে তোমার জীবনকে।&rdquo;</em> (মুস্তাদরাকে হাকেম)
          </p>
        </div>
      </div>

      {/* 2. QAZA SALAH TRACKER (কাজা নামাজ ট্র্যাকার) */}
      <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#D4AF37]">কাজা নামাজ ট্র্যাকার (উমরী কাজা ও রাকাত হিসাব)</h2>
              <p className="text-xs text-white/50">জীবনের পেছনের ছুটে যাওয়া ফরজ ও ওয়াজিব নামাজের নিখুঁত হিসাব</p>
            </div>
          </div>
          <button
            onClick={() => {
              setNewTotalQaza(totalQazaRakat);
              setShowEditTotalModal(true);
            }}
            className="px-3.5 py-1.5 bg-[#1a2a4a] hover:bg-[#D4AF37] hover:text-[#0a1628] text-[#D4AF37] border border-[#D4AF37]/40 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>মোট রাকাত পরিবর্তন</span>
          </button>
        </div>

        {/* Summary Numbers */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="text-xs text-white/50">মোট লক্ষ্যমাত্রা</span>
            <p className="text-lg sm:text-xl font-bold text-white font-mono">
              {formatBanglaNumber(totalQazaRakat)} <span className="text-xs font-bangla font-normal text-white/60">রাকাত</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-1">
            <span className="text-xs text-emerald-400">আদায় করা হয়েছে</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-300 font-mono">
              {formatBanglaNumber(repaidQazaRakat)} <span className="text-xs font-bangla font-normal text-emerald-400/70">রাকাত</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-1">
            <span className="text-xs text-rose-300">এখনও বাকি আছে</span>
            <p className="text-lg sm:text-xl font-bold text-rose-400 font-mono">
              {formatBanglaNumber(remainingQazaRakat)} <span className="text-xs font-bangla font-normal text-rose-300/70">রাকাত</span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">আদায়ের অগ্রগতি</span>
            <span className="font-bold text-[#D4AF37]">{formatBanglaNumber(qazaProgressPercent)}% সম্পন্ন</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-black/40 border border-white/10 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-[#D4AF37] transition-all duration-300 shadow-[0_0_10px_rgba(212,175,55,0.4)]"
              style={{ width: `${qazaProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Repay Action Buttons */}
        <div className="pt-2 border-t border-white/10 space-y-2.5">
          <h4 className="text-xs font-bold text-[#D4AF37]">কাজা আদায় যোগ করুন (একটি ক্লিকে রাকাত বিয়োগ হবে):</h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleQuickAdd(2)}
              className="py-2.5 px-3 bg-[#1a2a4a] hover:bg-[#253961] border border-[#D4AF37]/30 rounded-2xl text-xs font-bold text-amber-200 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>২ রাকাত (ফজর)</span>
            </button>

            <button
              onClick={() => handleQuickAdd(4)}
              className="py-2.5 px-3 bg-[#1a2a4a] hover:bg-[#253961] border border-[#D4AF37]/30 rounded-2xl text-xs font-bold text-amber-200 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>৪ রাকাত (যোহর/আসর/এশা)</span>
            </button>

            <button
              onClick={() => handleQuickAdd(3)}
              className="py-2.5 px-3 bg-[#1a2a4a] hover:bg-[#253961] border border-[#D4AF37]/30 rounded-2xl text-xs font-bold text-amber-200 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>৩ রাকাত (মাগরিব/বেতের)</span>
            </button>

            <button
              onClick={() => handleQuickAdd(20)}
              className="py-2.5 px-3 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 rounded-2xl text-xs font-bold text-[#D4AF37] transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>১ পূর্ণ দিন (২০ রাকাত)</span>
            </button>
          </div>

          {/* Custom Input Repay */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              min={1}
              value={customRepayInput}
              onChange={(e) => setCustomRepayInput(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-2 bg-black/40 border border-white/20 rounded-2xl text-xs text-white text-center font-mono focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              onClick={() => handleQuickAdd(customRepayInput)}
              className="flex-1 py-2 bg-[#1a2a4a] hover:bg-[#D4AF37] hover:text-[#0a1628] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold rounded-2xl transition-all shadow-sm active:scale-95"
            >
              ম্যানুয়াল {formatBanglaNumber(customRepayInput)} রাকাত আদায় যোগ করুন
            </button>
          </div>
        </div>

        {/* Masala Guide on Qaza */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-xs text-white/70 space-y-2">
          <h5 className="font-bold text-[#D4AF37]">কাজা নামাজের ফিকহী মাসআলা ও নিয়ম:</h5>
          <ul className="list-disc list-inside space-y-1 text-white/80 leading-relaxed">
            <li>প্রতিদিনের ৫ ওয়াক্ত নামাজে মোট ১৭ রাকাত ফরজ এবং ৩ রাকাত বেতের ওয়াজিব = ২০ রাকাত কাজা করতে হয়।</li>
            <li>কাজা নামাজ ওয়াক্তিয়া নামাজের আগে বা পরে যেকোনো মাকরূহ সময় ব্যতিত (সূর্যোদয়, ঠিক দ্বিপ্রহর, সূর্যাস্তের সময় ছাড়া) আদায় করা যায়।</li>
            <li>নিয়তের সময় বলবেন: <em>&ldquo;আমার জিম্মায় যত ফজর/যোহরের কাজা বাকি আছে, তার মধ্য থেকে প্রথমটি আদায় করছি।&rdquo;</em></li>
          </ul>
        </div>
      </div>

      {/* Edit Total Modal */}
      {showEditTotalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#060e1b] border border-[#D4AF37]/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white">
            <h3 className="text-base font-bold text-[#D4AF37]">মোট কাজা নামাজের লক্ষ্যমাত্রা নির্ধারণ</h3>
            <p className="text-xs text-white/60">
              আপনার জীবনের অনুমানকৃত মোট কাজা নামাজের রাকাত সংখ্যা ইনপুট দিন বা দিন হিসেবে হিসাব করুন।
            </p>

            <form onSubmit={handleSaveTotalQaza} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">মোট কাজা রাকাত</label>
                <input
                  type="number"
                  min={0}
                  value={newTotalQaza}
                  onChange={(e) => setNewTotalQaza(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-[#D4AF37]/40 rounded-2xl text-base text-[#D4AF37] font-mono text-center focus:outline-none"
                  required
                />
              </div>

              {/* Quick Calculator from days/months/years */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-white/50 block">দ্রুত হিসাব ক্যালকুলেটর:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCalculateFromDays(30)}
                    className="py-1.5 bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 rounded-xl text-xs text-white/90"
                  >
                    ১ মাস (৬০০ রাকাত)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalculateFromDays(180)}
                    className="py-1.5 bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 rounded-xl text-xs text-white/90"
                  >
                    ৬ মাস (৩৬০০ রাকাত)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalculateFromDays(365)}
                    className="py-1.5 bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 rounded-xl text-xs text-white/90"
                  >
                    ১ বছর (৭৩০০ রাকাত)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditTotalModal(false)}
                  className="px-4 py-2 text-xs rounded-2xl bg-white/10 text-white/70 hover:bg-white/20"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-2xl bg-[#D4AF37] text-[#0a1628] hover:brightness-110 shadow-md"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
