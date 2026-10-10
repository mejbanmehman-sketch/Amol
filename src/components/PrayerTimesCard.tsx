import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Sunrise,
  Sunset,
  Moon,
  Volume2,
  Sparkles,
  ChevronDown,
  Navigation
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBanglaNumber, format12HourTime } from '../utils/scoring';

const CITIES = [
  { id: 'Dhaka', name: 'ঢাকা' },
  { id: 'Chittagong', name: 'চট্টগ্রাম' },
  { id: 'Sylhet', name: 'সিলেট' },
  { id: 'Rajshahi', name: 'রাজশাহী' },
  { id: 'Khulna', name: 'খুলনা' },
  { id: 'Barisal', name: 'বরিশাল' },
  { id: 'Rangpur', name: 'রংপুর' },
  { id: 'Mymensingh', name: 'ময়মনসিংহ' },
  { id: 'CoxsBazar', name: 'কক্সবাজার' },
  { id: 'Sirajganj', name: 'সিরাজগঞ্জ' },
];

export const PrayerTimesCard: React.FC = () => {
  const {
    prayerTimings,
    prayerCity,
    setPrayerCity,
    fetchPrayerTimesForCity,
    nextPrayer,
    testAlarmAudio,
    showToast
  } = useApp();

  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const handleCityChange = (cityId: string) => {
    setPrayerCity(cityId);
    fetchPrayerTimesForCity(cityId);
    setShowCityDropdown(false);
    showToast(`নামাজের সময়সূচী ${CITIES.find(c => c.id === cityId)?.name || cityId}-এর জন্য আপডেট হয়েছে`);
  };

  const handleGpsLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          showToast(`লোকেশন সনাক্ত হয়েছে (ঢাকা সময়সূচী সমন্বয় করা হয়েছে)`);
          fetchPrayerTimesForCity('Dhaka');
        },
        () => {
          showToast('লোকেশন পারমিশন পাওয়া যায়নি, ডিফল্ট ঢাকা ব্যবহৃত হচ্ছে');
        }
      );
    }
  };

  if (!prayerTimings) return null;

  const prayers = [
    { name: 'ফজর', time: prayerTimings.Fajr, icon: Moon, isFarz: true },
    { name: 'সূর্যোদয়', time: prayerTimings.Sunrise, icon: Sunrise, isFarz: false },
    { name: 'যোহর', time: prayerTimings.Dhuhr, icon: Clock, isFarz: true },
    { name: 'আসর', time: prayerTimings.Asr, icon: Clock, isFarz: true },
    { name: 'সূর্যাস্ত', time: prayerTimings.Sunset, icon: Sunset, isFarz: false },
    { name: 'মাগরিব', time: prayerTimings.Maghrib, icon: Sunset, isFarz: true },
    { name: 'এশা', time: prayerTimings.Isha, icon: Moon, isFarz: true },
  ];

  // Calculate Awabin & Tahajjud estimated timings in 12h
  const awabinTime = prayerTimings.Maghrib ? `${format12HourTime(prayerTimings.Maghrib)} - ${format12HourTime(prayerTimings.Isha)}` : 'সন্ধ্যা ০৬:২০ PM - ০৭:৩৫ PM';
  const tahajjudTime = 'রাত ০৩:১৫ AM - ০৪:৩০ AM';

  const currentCityName = CITIES.find((c) => c.id === prayerCity)?.name || prayerCity;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
      {/* Header: Location & Next Prayer Highlight */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#D4AF37]/20 pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[#D4AF37] text-lg font-bold">আজান ও নামাজের সময়সূচী</h2>

          {/* City Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a2a4a] border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-xs font-semibold text-[#D4AF37] font-bangla transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{currentCityName}</span>
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>

            {showCityDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-[#0a1628]/95 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl shadow-2xl z-30 py-1.5 max-h-60 overflow-y-auto">
                <button
                  onClick={handleGpsLocation}
                  className="w-full px-3.5 py-2 text-left text-xs font-bangla text-[#D4AF37] hover:bg-white/10 flex items-center gap-2 border-b border-white/10 font-bold"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>বর্তমান জিপিএস লোকেশন</span>
                </button>
                {CITIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCityChange(c.id)}
                    className={`w-full px-3.5 py-2 text-left text-xs font-bangla transition-colors ${
                      prayerCity === c.id
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-bold'
                        : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Next Prayer Countdown */}
        {nextPrayer && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1a2a4a] border border-[#D4AF37]/40">
            <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <div className="text-left font-bangla">
              <span className="text-xs font-bold text-[#D4AF37]">
                পরবর্তী: {nextPrayer.name} ({format12HourTime(nextPrayer.time)})
              </span>
              <span className="text-[11px] text-white/70 ml-1.5">({nextPrayer.remainingText})</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Prayer Times Grid (12-hour format) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {prayers.map((p) => {
          const isNext = nextPrayer?.name.includes(p.name);
          const Icon = p.icon;
          const formatted12h = format12HourTime(p.time);
          return (
            <div
              key={p.name}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${
                isNext
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)] scale-[1.03]'
                  : 'bg-black/20 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <Icon className={`w-3.5 h-3.5 ${isNext ? 'text-[#D4AF37]' : 'text-white/50'}`} />
                <span className={`text-xs uppercase font-bangla font-semibold ${isNext ? 'text-[#D4AF37]' : 'text-white/70'}`}>
                  {p.name}
                </span>
              </div>
              <span className={`text-xs sm:text-sm font-bold font-mono ${isNext ? 'text-[#D4AF37]' : 'text-white'}`}>
                {formatted12h}
              </span>
            </div>
          );
        })}
      </div>

      {/* Special Times: Awabin & Tahajjud */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10 text-xs font-bangla">
        <div className="flex justify-between items-center bg-[#D4AF37] text-[#0a1628] p-3.5 rounded-2xl font-bold shadow-md">
          <span className="flex items-center gap-1.5">
            <Moon className="w-4 h-4" />
            <span>তাহাজ্জুদ (শেষ প্রহর)</span>
          </span>
          <span className="font-mono text-xs sm:text-sm">{tahajjudTime}</span>
        </div>

        <div className="flex justify-between items-center bg-black/20 border border-white/5 p-3.5 rounded-2xl">
          <span className="text-white/70">আওয়াবীনের সময় (মাগরিবের পর):</span>
          <span className="font-bold text-[#D4AF37] font-mono text-xs sm:text-sm">{awabinTime}</span>
        </div>
      </div>
    </div>
  );
};
