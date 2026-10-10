import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Sparkles,
  BookOpen,
  Heart,
  Moon,
  Sun,
  Smile,
  ShieldAlert,
  Flame,
  Star,
  Check,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DailyAmal } from '../types';
import { isDateFriday, formatBanglaNumber } from '../utils/scoring';

interface NumberStepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
}

const NumberStepper: React.FC<NumberStepperProps> = ({
  label,
  value,
  min = 0,
  max = 9999,
  step = 1,
  unit = '',
  onChange,
}) => {
  const [localStr, setLocalStr] = useState<string>(value === 0 ? '' : String(value));

  // Sync when value from props changes
  useEffect(() => {
    setLocalStr(value === 0 ? '' : String(value));
  }, [value]);

  const handleDecrement = () => {
    const nextVal = Math.max(min, value - step);
    onChange(nextVal);
    setLocalStr(nextVal === 0 ? '' : String(nextVal));
  };

  const handleIncrement = () => {
    const nextVal = Math.min(max, value + step);
    onChange(nextVal);
    setLocalStr(nextVal === 0 ? '' : String(nextVal));
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalStr(val);
    if (val === '') {
      onChange(0);
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5 hover:border-[#D4AF37]/30 transition-all gap-2">
      <span className="text-xs font-bangla text-white/90 font-medium">{label}</span>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-[#D4AF37] hover:text-[#0a1628] disabled:opacity-30 text-[#D4AF37] flex items-center justify-center border border-white/10 active:scale-95 transition-all"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="relative">
          <input
            type="number"
            min={min}
            max={max}
            value={localStr}
            placeholder="০"
            onChange={handleManualChange}
            className="w-16 text-center py-1.5 text-xs font-mono font-bold bg-black/40 border border-white/10 focus:border-[#D4AF37] rounded-xl text-[#D4AF37] placeholder:text-white/30 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-[#D4AF37] hover:text-[#0a1628] disabled:opacity-30 text-[#D4AF37] flex items-center justify-center border border-white/10 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {unit && <span className="text-[11px] text-white/50 font-bangla w-9 text-left">{unit}</span>}
      </div>
    </div>
  );
};

interface ToggleRowProps {
  label: string;
  subLabel?: string;
  checked: boolean;
  isPenalty?: boolean;
  onChange: (val: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  subLabel,
  checked,
  isPenalty = false,
  onChange,
}) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
        checked
          ? isPenalty
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-sm'
            : 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)]'
          : 'bg-black/20 border-white/5 text-white/80 hover:border-white/15'
      }`}
    >
      <div className="space-y-0.5">
        <span className="text-xs font-bangla font-semibold block">{label}</span>
        {subLabel && <span className="text-[10px] text-white/50 font-bangla block">{subLabel}</span>}
      </div>

      <div
        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
          checked ? (isPenalty ? 'bg-rose-600' : 'bg-[#D4AF37]') : 'bg-white/10'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform flex items-center justify-center ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {checked && (
            isPenalty ? <AlertTriangle className="w-3 h-3 text-rose-600" /> : <Check className="w-3 h-3 text-[#0a1628] font-black" />
          )}
        </div>
      </div>
    </div>
  );
};

export const AmalSections: React.FC = () => {
  const { dailyAmal, updateDailyAmal, selectedDate, showToast } = useApp();
  const isFriday = isDateFriday(selectedDate);

  // Collapsible state (Section 1 and Friday default open, others collapsible)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sec1: true,
    sec2: true,
    sec3: false,
    sec4: false,
    sec5: false,
    sec6: false,
    sec7: false,
    sec8: false,
    sec9: false,
    sec10: false,
    secFriday: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 font-bangla">
      {/* 1. ৫ ওয়াক্ত নামাজ */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec1')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ১
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">৫ ওয়াক্ত নামাজ</h3>
              <p className="text-[11px] text-white/60">সর্বোচ্চ ১০০ পয়েন্ট (ফরজ ও জামাত বোনাস)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D4AF37] bg-[#1a2a4a] px-3 py-1 rounded-full border border-[#D4AF37]/30">
              আদায়: {formatBanglaNumber(dailyAmal.namaz_adaied || 0)}/৫
            </span>
            {openSections.sec1 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
          </div>
        </button>

        {openSections.sec1 && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberStepper
              label="আদায় করেছি (ওয়াক্ত)"
              value={dailyAmal.namaz_adaied || 0}
              min={0}
              max={5}
              onChange={(val) => updateDailyAmal({ namaz_adaied: val })}
            />
            <NumberStepper
              label="আজকের কাজা"
              value={dailyAmal.namaz_qaza || 0}
              min={0}
              max={100}
              unit="রাকাত"
              step={1}
              onChange={(val) => updateDailyAmal({ namaz_qaza: val })}
            />
            <NumberStepper
              label="জামাতের সাথে পড়েছি (ওয়াক্ত)"
              value={dailyAmal.namaz_jamat || 0}
              min={0}
              max={5}
              onChange={(val) => updateDailyAmal({ namaz_jamat: val })}
            />
            <NumberStepper
              label="একা পড়েছি (ওয়াক্ত)"
              value={dailyAmal.namaz_eka || 0}
              min={0}
              max={5}
              onChange={(val) => updateDailyAmal({ namaz_eka: val })}
            />
          </div>
        )}
      </div>

      {/* 2. সুন্নত, নফল ও অন্যান্য নামাজ */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec2')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ২
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">সুন্নত, নফল ও অন্যান্য নামাজ</h3>
              <p className="text-[11px] text-white/60">সর্বোচ্চ ৬০ পয়েন্ট (রাকাত ভিত্তিক)</p>
            </div>
          </div>
          {openSections.sec2 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.sec2 && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberStepper
              label="সুন্নত নামাজ"
              value={dailyAmal.sunnat || 0}
              min={0}
              max={20}
              unit="রাকাত"
              onChange={(val) => updateDailyAmal({ sunnat: val })}
            />
            <NumberStepper
              label="নফল নামাজ"
              value={dailyAmal.nafl || 0}
              min={0}
              max={50}
              unit="রাকাত"
              onChange={(val) => updateDailyAmal({ nafl: val })}
            />
            <NumberStepper
              label="বেতের নামাজ"
              value={dailyAmal.beter || 0}
              min={0}
              max={3}
              unit="রাকাত"
              onChange={(val) => updateDailyAmal({ beter: val })}
            />
            <NumberStepper
              label="আওয়াবিন নামাজ"
              value={dailyAmal.awabin || 0}
              min={0}
              max={6}
              unit="রাকাত"
              onChange={(val) => updateDailyAmal({ awabin: val })}
            />
            <NumberStepper
              label="ইশরাক নামাজ"
              value={dailyAmal.ishraq || 0}
              min={0}
              max={4}
              unit="রাকাত"
              onChange={(val) => updateDailyAmal({ ishraq: val })}
            />
            <NumberStepper
              label="তাহাজ্জুদ নামাজ"
              value={dailyAmal.tahajjud || 0}
              min={0}
              max={12}
              unit="রাকাত"
              onChange={(val) => updateDailyAmal({ tahajjud: val })}
            />
          </div>
        )}
      </div>

      {/* 3. কুরআন ও সূরা */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec3')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ৩
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">কুরআন ও সূরা তেলাওয়াত</h3>
              <p className="text-[11px] text-white/60">সর্বোচ্চ ৪০ পয়েন্ট (প্রতি পৃষ্ঠা ২ ও সূরা ৫)</p>
            </div>
          </div>
          {openSections.sec3 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.sec3 && (
          <div className="p-4 sm:p-5 space-y-3">
            <NumberStepper
              label="কুরআন তেলাওয়াত"
              value={dailyAmal.quran_pages || 0}
              min={0}
              max={604}
              unit="পৃষ্ঠা"
              onChange={(val) => updateDailyAmal({ quran_pages: val })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <ToggleRow
                label="সূরা ইয়াসীন"
                subLabel="ফজরের পর (+৫)"
                checked={dailyAmal.surah_yasin || false}
                onChange={(val) => updateDailyAmal({ surah_yasin: val })}
              />
              <ToggleRow
                label="সূরা ওয়াকিয়াহ"
                subLabel="মাগরিবের পর (+৫)"
                checked={dailyAmal.surah_wakiah || false}
                onChange={(val) => updateDailyAmal({ surah_wakiah: val })}
              />
              <ToggleRow
                label="সূরা মুলক"
                subLabel="ঘুমানোর আগে (+৫)"
                checked={dailyAmal.surah_mulk || false}
                onChange={(val) => updateDailyAmal({ surah_mulk: val })}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. রোজা ও দান */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec4')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ৪
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">রোজা ও দান-সদকা</h3>
              <p className="text-[11px] text-white/60">সর্বোচ্চ ৩০ পয়েন্ট (নফল সিয়াম ও দান)</p>
            </div>
          </div>
          {openSections.sec4 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.sec4 && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumberStepper
              label="সপ্তাহে রোজা (০-৭)"
              value={dailyAmal.roza_weekly || 0}
              min={0}
              max={7}
              unit="দিন"
              onChange={(val) => updateDailyAmal({ roza_weekly: val })}
            />
            <NumberStepper
              label="মাসে রোজা (০-৩০)"
              value={dailyAmal.roza_monthly || 0}
              min={0}
              max={30}
              unit="দিন"
              onChange={(val) => updateDailyAmal({ roza_monthly: val })}
            />
            <NumberStepper
              label="দান সদকা (টাকা)"
              value={dailyAmal.dan_taka || 0}
              min={0}
              max={100000}
              step={10}
              unit="টাকা"
              onChange={(val) => updateDailyAmal({ dan_taka: val })}
            />
          </div>
        )}
      </div>

      {/* 5. সকাল-সন্ধ্যা মাসনুন আমল */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec5')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ৫
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">সকাল-সন্ধ্যা মাসনুন আমল</h3>
              <p className="text-[11px] text-white/60">সর্বোচ্চ ২০ পয়েন্ট</p>
            </div>
          </div>
          {openSections.sec5 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.sec5 && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ToggleRow
              label="সকালের মাসনুন আমল"
              subLabel="৭ পয়েন্ট"
              checked={dailyAmal.morning_masnun || false}
              onChange={(val) => updateDailyAmal({ morning_masnun: val })}
            />
            <ToggleRow
              label="সন্ধ্যার মাসনুন আমল"
              subLabel="৭ পয়েন্ট"
              checked={dailyAmal.evening_masnun || false}
              onChange={(val) => updateDailyAmal({ evening_masnun: val })}
            />
            <ToggleRow
              label="ঘুমানোর আগের আমল"
              subLabel="৬ পয়েন্ট"
              checked={dailyAmal.sleep_masnun || false}
              onChange={(val) => updateDailyAmal({ sleep_masnun: val })}
            />
          </div>
        )}
      </div>

      {/* 6. দোয়া ও জিকির */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec6')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ৬
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">দৈনন্দিন দোয়া ও মৃত্যু স্মরণ</h3>
              <p className="text-[11px] text-white/60">সর্বোচ্চ ২০ পয়েন্ট</p>
            </div>
          </div>
          {openSections.sec6 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.sec6 && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <ToggleRow
              label="বাথরুমে ঢোকার দোয়া"
              subLabel="৩ পয়েন্ট"
              checked={dailyAmal.bathroom_enter || false}
              onChange={(val) => updateDailyAmal({ bathroom_enter: val })}
            />
            <ToggleRow
              label="বাথরুম থেকে বের হওয়ার দোয়া"
              subLabel="৩ পয়েন্ট"
              checked={dailyAmal.bathroom_exit || false}
              onChange={(val) => updateDailyAmal({ bathroom_exit: val })}
            />
            <ToggleRow
              label="খাবারের দোয়া"
              subLabel="৩ পয়েন্ট"
              checked={dailyAmal.food_dua || false}
              onChange={(val) => updateDailyAmal({ food_dua: val })}
            />
            <ToggleRow
              label="ঘুমানোর দোয়া"
              subLabel="৩ পয়েন্ট"
              checked={dailyAmal.sleep_dua || false}
              onChange={(val) => updateDailyAmal({ sleep_dua: val })}
            />
            <ToggleRow
              label="মৃত্যু স্মরণ করেছি"
              subLabel="৮ পয়েন্ট"
              checked={dailyAmal.death_reminder || false}
              onChange={(val) => updateDailyAmal({ death_reminder: val })}
            />
          </div>
        )}
      </div>

      {/* 7. সামাজিক আমল */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec7')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ৭
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">সামাজিক ও সদাচার আমল</h3>
              <p className="text-[11px] text-white/60">সর্বোচ্চ ২০ পয়েন্ট (প্রতিটি ৫)</p>
            </div>
          </div>
          {openSections.sec7 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.sec7 && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ToggleRow
              label="গীবত থেকে সম্পূর্ণ বিরত ছিলাম"
              subLabel="৫ পয়েন্ট"
              checked={dailyAmal.gheebat_free || false}
              onChange={(val) => updateDailyAmal({ gheebat_free: val })}
            />
            <ToggleRow
              label="পরনিন্দা ও পরচর্চা থেকে বিরত"
              subLabel="৫ পয়েন্ট"
              checked={dailyAmal.poroninda_free || false}
              onChange={(val) => updateDailyAmal({ poroninda_free: val })}
            />
            <ToggleRow
              label="মানুষের উপকার ও সহযোগিতা করেছি"
              subLabel="৫ পয়েন্ট"
              checked={dailyAmal.help_people || false}
              onChange={(val) => updateDailyAmal({ help_people: val })}
            />
            <ToggleRow
              label="অন্যকে সালাম দিয়েছি"
              subLabel="৫ পয়েন্ট"
              checked={dailyAmal.salam_given || false}
              onChange={(val) => updateDailyAmal({ salam_given: val })}
            />
          </div>
        )}
      </div>

      {/* 8. জিকির ও ইস্তেগফার */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec8')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ৮
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">জিকির ও ইস্তেগফার</h3>
              <p className="text-[11px] text-white/60">সর্বোচ্চ ৩০ পয়েন্ট</p>
            </div>
          </div>
          {openSections.sec8 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.sec8 && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumberStepper
                label="দুরুদ শরীফ পাঠ"
                value={dailyAmal.durud_count || 0}
                min={0}
                max={10000}
                step={10}
                unit="বার"
                onChange={(val) => updateDailyAmal({ durud_count: val })}
              />
              <NumberStepper
                label="ইস্তেগফার পাঠ"
                value={dailyAmal.istighfar_count || 0}
                min={0}
                max={10000}
                step={10}
                unit="বার"
                onChange={(val) => updateDailyAmal({ istighfar_count: val })}
              />
            </div>
            <ToggleRow
              label="তিন তাসবিহ (সুবহানাল্লাহ ৩৩, আলহামদুলিল্লাহ ৩৩, আল্লাহু আকবার ৩৪)"
              subLabel="৫ পয়েন্ট"
              checked={dailyAmal.tasbih_done || false}
              onChange={(val) => updateDailyAmal({ tasbih_done: val })}
            />
          </div>
        )}
      </div>

      {/* 9. কাজা নামাজ */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec9')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ৯
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">কাজা নামাজ আদায়</h3>
              <p className="text-[11px] text-white/60">সর্বোচ্চ ২০ পয়েন্ট (প্রোফাইলের মোট কাজা থেকে কমবে)</p>
            </div>
          </div>
          {openSections.sec9 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.sec9 && (
          <div className="p-4 sm:p-5">
            <NumberStepper
              label="আজকে কাজা আদায় করেছি"
              value={dailyAmal.qaza_today || 0}
              min={0}
              max={100}
              unit="রাকাত"
              onChange={(val) => updateDailyAmal({ qaza_today: val })}
            />
          </div>
        )}
      </div>

      {/* 10. অন্যান্য ও পেনাল্টি */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => toggleSection('sec10')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/20 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              ১০
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">অন্যান্য ও বিশেষ নোট</h3>
              <p className="text-[11px] text-white/60">মিথ্যা কথার পেনাল্টি (-১৫) ও নফল আমল</p>
            </div>
          </div>
          {openSections.sec10 ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.sec10 && (
          <div className="p-4 sm:p-5 space-y-4">
            <ToggleRow
              label="মিথ্যা কথা বলেছি (পেনাল্টি -১৫ পয়েন্ট)"
              subLabel="আত্মসমালোচনা ও তওবার জন্য সতর্কীকরণ"
              isPenalty={true}
              checked={dailyAmal.mithya || false}
              onChange={(val) => updateDailyAmal({ mithya: val })}
            />

            <div>
              <label className="block text-xs text-white/80 font-bangla mb-1.5">অতিরিক্ত নফল আমল ও বিশেষ বিবরণ</label>
              <textarea
                rows={2}
                placeholder="যেমন: কোনো অসুস্থ মানুষকে দেখতে গিয়েছি, কুরআন তর্জমা পড়েছি ইত্যাদি..."
                value={dailyAmal.extra_nafl || ''}
                onChange={(e) => updateDailyAmal({ extra_nafl: e.target.value })}
                className="w-full p-3 text-xs bg-black/40 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37] font-bangla resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* ⭐ শুক্রবারের বিশেষ আমল */}
      <div className={`backdrop-blur-md rounded-3xl border overflow-hidden shadow-2xl transition-all ${
        isFriday ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-[0_0_25px_rgba(212,175,55,0.15)]' : 'bg-white/5 border-white/10'
      }`}>
        <button
          type="button"
          onClick={() => toggleSection('secFriday')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#D4AF37]/20 via-[#1a2a4a]/40 to-transparent border-b border-[#D4AF37]/30 text-left hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#0a1628] flex items-center justify-center text-xs font-black shadow-md">
              <Star className="w-4 h-4 fill-[#0a1628]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#D4AF37]">শুক্রবার জুম্মার বিশেষ আমল</h3>
                {isFriday && (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#D4AF37] text-[#0a1628] rounded-full animate-pulse">
                    আজ জুমাবার!
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/60">সূরা কাহাফ, আসরের পর দুরুদ ও মাগরিবের আগের দোয়া</p>
            </div>
          </div>
          {openSections.secFriday ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
        </button>

        {openSections.secFriday && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ToggleRow
              label="সূরা কাহাফ তেলাওয়াত"
              subLabel="জুম্মার বিশেষ নূর (+১০)"
              checked={dailyAmal.surah_kahf || false}
              onChange={(val) => updateDailyAmal({ surah_kahf: val })}
            />
            <ToggleRow
              label="আসরের পর ৮০ বার দুরুদ"
              subLabel="৮০ বছরের গুনাহ মাফ (+৮)"
              checked={dailyAmal.asr_durud || false}
              onChange={(val) => updateDailyAmal({ asr_durud: val })}
            />
            <ToggleRow
              label="মাগরিবের আগে বিশেষ দোয়া"
              subLabel="দোয়া কবুলের সময় (+৭)"
              checked={dailyAmal.magrib_dua || false}
              onChange={(val) => updateDailyAmal({ magrib_dua: val })}
            />
          </div>
        )}
      </div>

      {/* Save & Confirm Action Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#1a2a4a] via-[#0e1f3b] to-[#1a2a4a] border border-[#D4AF37]/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>আজকের আমল সংরক্ষণের প্রস্তুতি সম্পন্ন</span>
              <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#0a1628] text-xs font-bold font-mono">
                স্কোর: {formatBanglaNumber(dailyAmal.total_score || 0)}
              </span>
            </div>
            <p className="text-xs text-white/60">
              সকল আমলের স্কোর স্বয়ংক্রিয়ভাবে লোকাল মেমোরিতে সংরক্ষিত হয়েছে
            </p>
          </div>
        </div>

        <button
          onClick={() => showToast('আজকের আমল ও হিসাব সফলভাবে সংরক্ষণ করা হয়েছে!')}
          className="w-full sm:w-auto px-6 py-3 bg-[#D4AF37] hover:bg-[#c49f27] text-[#0a1628] font-bold text-xs sm:text-sm rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>দৈনিক আমল হিসাব নিশ্চিত করুন</span>
        </button>
      </div>

    </div>
  );
};
