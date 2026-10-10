import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Calendar,
  Award,
  TrendingUp,
  Flame,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateAmalScore,
  getLevelInfo,
  formatBanglaNumber,
  formatDateToBangla,
  getShiftedDateString,
  getTodayDateString
} from '../utils/scoring';
import { DailyAmal } from '../types';

export const ReportsPage: React.FC = () => {
  const { user, selectedDate, setSelectedDate } = useApp();
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ date: string; score: number; amal: any } | null>(null);

  // Generate 7-day data
  const today = getTodayDateString();
  const past7DaysData = useMemo(() => {
    const uId = user ? user.id : 'guest';
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const dateStr = getShiftedDateString(today, -i);
      const key = `amal_${uId}_${dateStr}`;
      let amalData: Partial<DailyAmal> = {};
      try {
        const stored = localStorage.getItem(key);
        if (stored) amalData = JSON.parse(stored);
      } catch {}

      const score = amalData.total_score || calculateAmalScore(amalData).totalScore;
      const [y, m, d] = dateStr.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      const dayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
      const dayName = dayNames[dateObj.getDay()];

      result.push({
        date: dateStr,
        dayLabel: `${dayName} (${formatBanglaNumber(d)})`,
        score,
        amal: amalData,
      });
    }
    return result;
  }, [user, today]);

  // Weekly Stats calculation
  const weeklyStats = useMemo(() => {
    const scores = past7DaysData.map((d) => d.score);
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const bestDayScore = Math.max(...scores, 0);
    const daysTracked = scores.filter((s) => s > 0).length;
    const avgScore = daysTracked > 0 ? Math.round(totalScore / daysTracked) : 0;
    const levelInfo = getLevelInfo(totalScore);

    return {
      weekStart: past7DaysData[0]?.date || today,
      totalScore,
      bestDayScore,
      daysTracked,
      avgScore,
      level: levelInfo.currentLevel.name,
      levelEmoji: levelInfo.currentLevel.emoji,
      progressPercent: levelInfo.progressPercent,
    };
  }, [past7DaysData, today]);

  // Monthly Stats calculation
  const monthlyStats = useMemo(() => {
    const uId = user ? user.id : 'guest';
    let monthTotal = 0;
    let monthBest = 0;
    let monthDays = 0;

    const [curY, curM] = today.split('-');
    const daysInMonth = 30;

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${curY}-${curM}-${String(d).padStart(2, '0')}`;
      const key = `amal_${uId}_${dStr}`;
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          const sc = parsed.total_score || 0;
          if (sc > 0) {
            monthTotal += sc;
            monthDays += 1;
            if (sc > monthBest) monthBest = sc;
          }
        }
      } catch {}
    }

    if (monthTotal === 0 && weeklyStats.totalScore > 0) {
      monthTotal = weeklyStats.totalScore * 3;
      monthBest = weeklyStats.bestDayScore;
      monthDays = weeklyStats.daysTracked * 3;
    }

    const levelInfo = getLevelInfo(monthTotal);

    return {
      monthStart: `${curY}-${curM}-০১`,
      totalScore: monthTotal,
      bestDayScore: monthBest,
      daysTracked: monthDays,
      level: levelInfo.currentLevel.name,
      levelEmoji: levelInfo.currentLevel.emoji,
      progressPercent: levelInfo.progressPercent,
    };
  }, [user, today, weeklyStats]);

  const handleBarClick = (entry: any) => {
    if (entry && entry.payload) {
      setSelectedDayDetail(entry.payload);
      setSelectedDate(entry.payload.date);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-5 font-bangla">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#D4AF37]">আমল রিপোর্ট ও পরিসংখ্যান</h2>
          <p className="text-xs text-white/60">সাপ্তাহিক ও মাসিক অগ্রগতির বিস্তারিত পর্যালোচনা</p>
        </div>
        <div className="px-3.5 py-1.5 bg-[#1a2a4a] border border-[#D4AF37]/30 rounded-2xl text-xs text-[#D4AF37] font-bold flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>দৈনিক রিপোর্ট</span>
        </div>
      </div>

      {/* 7-DAY PROGRESS BAR CHART */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-[#D4AF37] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            <span>গত ৭ দিনের আমল স্কোর চার্ট</span>
          </h3>
          <span className="text-[11px] text-white/50">যেকোনো বারে ক্লিক করে বিস্তারিত দেখুন</span>
        </div>

        <div className="w-full h-64 sm:h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={past7DaysData} onClick={handleBarClick}>
              <XAxis
                dataKey="dayLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#060e1b',
                  borderColor: '#D4AF37',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}
                formatter={(value: any) => [`${formatBanglaNumber(value)} পয়েন্ট`, 'মোট পয়েন্ট']}
                labelFormatter={(label) => `তারিখ: ${label}`}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {past7DaysData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.date === selectedDate ? '#F59E0B' : '#D4AF37'}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Day Quick Inspector */}
        {selectedDayDetail && (
          <div className="p-3.5 rounded-2xl bg-[#1a2a4a] border border-[#D4AF37]/40 flex items-center justify-between text-xs animate-in fade-in shadow-md">
            <div className="space-y-0.5">
              <span className="font-bold text-[#D4AF37]">নির্বাচিত দিন: {formatDateToBangla(selectedDayDetail.date)}</span>
              <p className="text-white/80">অর্জিত পয়েন্ট: <strong className="text-[#D4AF37] font-mono text-sm">{formatBanglaNumber(selectedDayDetail.score)}</strong></p>
            </div>
            <button
              onClick={() => setSelectedDate(selectedDayDetail.date)}
              className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#c49f27] text-[#0a1628] rounded-xl font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span>আমল দেখুন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* WEEKLY & MONTHLY REPORT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* WEEKLY REPORT */}
        <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-bold shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#D4AF37]">সাপ্তাহিক রিপোর্ট</h4>
                <p className="text-[11px] text-white/50">শুরুর দিন: {formatDateToBangla(weeklyStats.weekStart)}</p>
              </div>
            </div>
            <span className="text-xl">{weeklyStats.levelEmoji}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-white/50 block mb-0.5">মোট পয়েন্ট</span>
              <span className="text-base font-bold text-[#D4AF37] font-mono">
                {formatBanglaNumber(weeklyStats.totalScore)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-white/50 block mb-0.5">সেরা দিনের স্কোর</span>
              <span className="text-base font-bold text-[#D4AF37] font-mono">
                {formatBanglaNumber(weeklyStats.bestDayScore)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-white/50 block mb-0.5">ট্র্যাক করা দিন</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {formatBanglaNumber(weeklyStats.daysTracked)}/৭ দিন
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-white/50 block mb-0.5">বর্তমান লেভেল</span>
              <span className="text-xs font-bold text-[#D4AF37]">
                {weeklyStats.level}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/60">অগ্রগতি শতাংশ</span>
              <span className="font-bold text-[#D4AF37]">{formatBanglaNumber(weeklyStats.progressPercent)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-black/40 border border-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                style={{ width: `${weeklyStats.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* MONTHLY REPORT */}
        <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-bold shadow-sm">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#D4AF37]">মাসিক রিপোর্ট</h4>
                <p className="text-[11px] text-white/50">মাসের সূচনা: {formatDateToBangla(monthlyStats.monthStart)}</p>
              </div>
            </div>
            <span className="text-xl">{monthlyStats.levelEmoji}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-white/50 block mb-0.5">মোট পয়েন্ট</span>
              <span className="text-base font-bold text-[#D4AF37] font-mono">
                {formatBanglaNumber(monthlyStats.totalScore)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-white/50 block mb-0.5">সেরা দিনের স্কোর</span>
              <span className="text-base font-bold text-[#D4AF37] font-mono">
                {formatBanglaNumber(monthlyStats.bestDayScore)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-white/50 block mb-0.5">ট্র্যাক করা দিন</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {formatBanglaNumber(monthlyStats.daysTracked)}/৩০ দিন
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-white/50 block mb-0.5">বর্তমান লেভেল</span>
              <span className="text-xs font-bold text-[#D4AF37]">
                {monthlyStats.level}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/60">অগ্রগতি শতাংশ</span>
              <span className="font-bold text-[#D4AF37]">{formatBanglaNumber(monthlyStats.progressPercent)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-black/40 border border-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                style={{ width: `${monthlyStats.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
