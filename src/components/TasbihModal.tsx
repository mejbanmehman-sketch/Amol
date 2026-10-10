import React, { useState } from 'react';
import { X, RotateCcw, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { audioService } from '../utils/audioAlarm';
import { useApp } from '../context/AppContext';
import { formatBanglaNumber } from '../utils/scoring';

interface TasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  { name: 'সুবহানাল্লাহ', arabic: 'سُبْحَانَ اللَّهِ', target: 33 },
  { name: 'আলহামদুলিল্লাহ', arabic: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { name: 'আল্লাহু আকবার', arabic: 'اللَّهُ أَكْبَرُ', target: 34 },
  { name: 'আস্তাগফিরুল্লাহ', arabic: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
  { name: 'দুরুদ শরীফ', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', target: 100 },
  { name: 'লা ইলাহা ইল্লাল্লাহ', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', target: 100 },
];

export const TasbihModal: React.FC<TasbihModalProps> = ({ isOpen, onClose }) => {
  const { dailyAmal, updateDailyAmal, showToast } = useApp();
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [totalSessionCount, setTotalSessionCount] = useState(0);

  if (!isOpen) return null;

  const currentPreset = PRESETS[selectedPresetIndex];

  const handleTap = () => {
    audioService.playTasbihClick();
    if (navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }

    const nextCount = count + 1;
    setCount(nextCount);
    setTotalSessionCount((prev) => prev + 1);

    // Sync with Daily Amal
    if (currentPreset.name === 'দুরুদ শরীফ') {
      updateDailyAmal({ durud_count: (dailyAmal.durud_count || 0) + 1 });
    } else if (currentPreset.name === 'আস্তাগফিরুল্লাহ') {
      updateDailyAmal({ istighfar_count: (dailyAmal.istighfar_count || 0) + 1 });
    } else {
      updateDailyAmal({ tasbih_done: true });
    }

    if (nextCount === currentPreset.target) {
      audioService.playAlarmSound();
      showToast(`মাশাআল্লাহ! ${currentPreset.name} এর ${formatBanglaNumber(currentPreset.target)} বার পূর্ণ হয়েছে!`);
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#091424] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-300 font-bangla">ডিজিটাল তাসবিহ কাউন্টার</h2>
              <p className="text-[10px] text-slate-400 font-bangla">স্পর্শ করে জিকির আদায় করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#060d17] rounded-xl border border-slate-800">
          {PRESETS.map((p, idx) => (
            <button
              key={p.name}
              onClick={() => {
                setSelectedPresetIndex(idx);
                setCount(0);
              }}
              className={`p-1.5 text-[11px] rounded-lg font-bangla font-semibold transition-all ${
                selectedPresetIndex === idx
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Selected Dhikr Display */}
        <div className="text-center py-2 px-4 rounded-2xl bg-gradient-to-b from-[#0f213b] to-[#0a1628] border border-amber-500/25">
          <p className="text-xl sm:text-2xl font-arabic text-amber-300 mb-1 leading-relaxed">
            {currentPreset.arabic}
          </p>
          <p className="text-xs text-slate-300 font-bangla font-medium">
            {currentPreset.name} (টার্গেট: {formatBanglaNumber(currentPreset.target)} বার)
          </p>
        </div>

        {/* Giant Tap Circle Bead Button */}
        <div className="flex flex-col items-center justify-center py-2">
          <button
            onClick={handleTap}
            className="w-44 h-44 rounded-full bg-gradient-to-tr from-[#122846] via-[#1a3860] to-[#254f85] border-4 border-amber-400/40 shadow-2xl shadow-amber-500/20 active:scale-95 transition-all flex flex-col items-center justify-center group relative select-none"
          >
            {/* Ambient Pulse Ring */}
            <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-ping opacity-30 pointer-events-none" />
            
            <span className="text-4xl font-extrabold text-amber-300 font-mono tracking-tight drop-shadow-md">
              {formatBanglaNumber(count)}
            </span>
            <span className="text-xs text-amber-200/70 font-bangla mt-1 group-hover:text-amber-100 transition-colors">
              এখানে চাপুন
            </span>
          </button>
        </div>

        {/* Progress Bar & Reset Control */}
        <div className="space-y-2">
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200"
              style={{
                width: `${Math.min(100, Math.round((count / currentPreset.target) * 100))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-bangla">
            <span>সেশনের মোট: {formatBanglaNumber(totalSessionCount)} বার</span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট (০)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
