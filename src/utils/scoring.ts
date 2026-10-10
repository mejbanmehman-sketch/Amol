import { DailyAmal, RankingLevelInfo, User } from '../types';

export const RANKING_LEVELS: RankingLevelInfo[] = [
  { name: 'শুরুর পথযাত্রী', minPoints: 0, maxPoints: 200, emoji: '🌱', color: '#10B981' },
  { name: 'মুক্তা', minPoints: 200, maxPoints: 500, emoji: '💠', color: '#06B6D4' },
  { name: 'সিলভার', minPoints: 500, maxPoints: 1000, emoji: '🥈', color: '#94A3B8' },
  { name: 'গোল্ডেন', minPoints: 1000, maxPoints: 2000, emoji: '🥇', color: '#F59E0B' },
  { name: 'প্লাটিনাম', minPoints: 2000, maxPoints: 3500, emoji: '💎', color: '#8B5CF6' },
  { name: 'ডায়মন্ড', minPoints: 3500, maxPoints: 5000, emoji: '👑', color: '#EC4899' },
  { name: 'আল-মুত্তাকীন', minPoints: 5000, maxPoints: 10000, emoji: '🌟', color: '#FFD700' },
];

export interface ScoreBreakdown {
  namazScore: number;
  sunnatNaflScore: number;
  quranScore: number;
  rozaDanScore: number;
  masnunScore: number;
  duaScore: number;
  socialScore: number;
  dhikrScore: number;
  qazaScore: number;
  fridayBonus: number;
  penalty: number;
  totalScore: number;
}

export function calculateAmalScore(amal: Partial<DailyAmal>): ScoreBreakdown {
  // ১. নামাজ বিভাগ (সর্বোচ্চ ১০০)
  const namazAdaied = Math.min(5, Math.max(0, amal.namaz_adaied || 0));
  const namazJamat = Math.min(5, Math.max(0, amal.namaz_jamat || 0));
  const namazQaza = Math.min(5, Math.max(0, amal.namaz_qaza || 0));
  
  let namazRaw = (namazAdaied * 15) + (namazJamat * 5) - (namazQaza * 5);
  const namazScore = Math.max(0, Math.min(100, namazRaw));

  // ২. সুন্নত/নফল (সর্বোচ্চ ৬০)
  const sunnat = (amal.sunnat || 0) * 2;
  const nafl = (amal.nafl || 0) * 1.5;
  const beter = (amal.beter || 0) * 3;
  const awabin = (amal.awabin || 0) * 2;
  const ishraq = (amal.ishraq || 0) * 2;
  const tahajjud = (amal.tahajjud || 0) * 4;
  const sunnatNaflScore = Math.min(60, sunnat + nafl + beter + awabin + ishraq + tahajjud);

  // ৩. কুরআন (সর্বোচ্চ ৪০)
  const quranPages = (amal.quran_pages || 0) * 2;
  const yasin = amal.surah_yasin ? 5 : 0;
  const wakiah = amal.surah_wakiah ? 5 : 0;
  const mulk = amal.surah_mulk ? 5 : 0;
  const quranScore = Math.min(40, quranPages + yasin + wakiah + mulk);

  // ৪. রোজা ও দান (সর্বোচ্চ ৩০)
  const rozaWeekly = Math.min(21, (amal.roza_weekly || 0) * 3);
  const rozaMonthly = Math.min(30, (amal.roza_monthly || 0) * 1);
  const danScore = Math.min(10, Math.floor((amal.dan_taka || 0) / 10));
  const rozaDanScore = Math.min(30, rozaWeekly + rozaMonthly + danScore);

  // ৫. মাসনুন আমল (সর্বোচ্চ ২০)
  const morning = amal.morning_masnun ? 7 : 0;
  const evening = amal.evening_masnun ? 7 : 0;
  const sleepMasnun = amal.sleep_masnun ? 6 : 0;
  const masnunScore = Math.min(20, morning + evening + sleepMasnun);

  // ৬. দোয়া (সর্বোচ্চ ২০)
  let duaCount = 0;
  if (amal.bathroom_enter) duaCount += 3;
  if (amal.bathroom_exit) duaCount += 3;
  if (amal.food_dua) duaCount += 3;
  if (amal.sleep_dua) duaCount += 3;
  const deathRem = amal.death_reminder ? 8 : 0;
  const duaScore = Math.min(20, duaCount + deathRem);

  // ৭. সামাজিক (সর্বোচ্চ ২০)
  let socialCount = 0;
  if (amal.gheebat_free) socialCount += 5;
  if (amal.poroninda_free) socialCount += 5;
  if (amal.help_people) socialCount += 5;
  if (amal.salam_given) socialCount += 5;
  const socialScore = Math.min(20, socialCount);

  // ৮. জিকির (সর্বোচ্চ ৩০)
  const durud = Math.floor((amal.durud_count || 0) / 10);
  const istighfar = Math.floor((amal.istighfar_count || 0) / 35);
  const tasbih = amal.tasbih_done ? 5 : 0;
  const dhikrScore = Math.min(30, durud + istighfar + tasbih);

  // ৯. কাজা (সর্বোচ্চ ২০)
  const qazaToday = (amal.qaza_today || 0) * 2;
  const qazaRatioBonus = (amal.qaza_today || 0) > 0 ? 10 : 0;
  const qazaScore = Math.min(20, qazaToday + qazaRatioBonus);

  // শুক্রবারের বিশেষ আমল বোনাস
  let fridayBonus = 0;
  if (amal.surah_kahf) fridayBonus += 10;
  if (amal.asr_durud) fridayBonus += 8;
  if (amal.magrib_dua) fridayBonus += 7;

  // পেনাল্টি
  const penalty = amal.mithya ? 15 : 0;

  const rawTotal = (
    namazScore +
    sunnatNaflScore +
    quranScore +
    rozaDanScore +
    masnunScore +
    duaScore +
    socialScore +
    dhikrScore +
    qazaScore +
    fridayBonus -
    penalty
  );

  const totalScore = Math.max(0, Math.round(rawTotal));

  return {
    namazScore,
    sunnatNaflScore,
    quranScore,
    rozaDanScore,
    masnunScore,
    duaScore,
    socialScore,
    dhikrScore,
    qazaScore,
    fridayBonus,
    penalty,
    totalScore,
  };
}

export function getLevelInfo(points: number): {
  currentLevel: RankingLevelInfo;
  nextLevel: RankingLevelInfo | null;
  progressPercent: number;
} {
  let currentLevel = RANKING_LEVELS[0];
  let nextLevel: RankingLevelInfo | null = RANKING_LEVELS[1];

  for (let i = 0; i < RANKING_LEVELS.length; i++) {
    if (points >= RANKING_LEVELS[i].minPoints) {
      currentLevel = RANKING_LEVELS[i];
      nextLevel = RANKING_LEVELS[i + 1] || null;
    }
  }

  let progressPercent = 100;
  if (nextLevel) {
    const range = nextLevel.minPoints - currentLevel.minPoints;
    const achieved = points - currentLevel.minPoints;
    progressPercent = Math.min(100, Math.max(0, Math.round((achieved / range) * 100)));
  }

  return {
    currentLevel,
    nextLevel,
    progressPercent,
  };
}

// Calculate precise age and remaining life from birth details or age
export function calculateRemainingLife(
  ageOrUser: number | { age?: number; birth_day?: number; birth_month?: number; birth_year?: number }
): {
  currentAgeYears: number;
  currentAgeMonths: number;
  currentAgeDays: number;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  isPastAverage: boolean;
} {
  const avgLifeYears = 60;
  let exactAgeYears = 25;
  let currentAgeYears = 25;
  let currentAgeMonths = 0;
  let currentAgeDays = 0;

  if (typeof ageOrUser === 'object' && ageOrUser !== null) {
    let bYear = ageOrUser.birth_year;
    let bMonth = ageOrUser.birth_month;
    let bDay = ageOrUser.birth_day;

    if (!bYear && (ageOrUser as any).birth_date) {
      const parts = (ageOrUser as any).birth_date.split('-');
      if (parts.length === 3) {
        bYear = parseInt(parts[0], 10);
        bMonth = parseInt(parts[1], 10);
        bDay = parseInt(parts[2], 10);
      }
    }

    if (bYear && bMonth && bDay) {
      const now = new Date();
      const birth = new Date(bYear, bMonth - 1, bDay);
      const diffTime = now.getTime() - birth.getTime();
      const totalDaysLived = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      
      exactAgeYears = totalDaysLived / 365.25;
      
      let y = now.getFullYear() - birth.getFullYear();
      let m = now.getMonth() - birth.getMonth();
      let d = now.getDate() - birth.getDate();

      if (d < 0) {
        m -= 1;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        d += prevMonth.getDate();
      }
      if (m < 0) {
        y -= 1;
        m += 12;
      }
      currentAgeYears = Math.max(0, y);
      currentAgeMonths = Math.max(0, m);
      currentAgeDays = Math.max(0, d);
    } else if (ageOrUser.age) {
      currentAgeYears = ageOrUser.age;
      exactAgeYears = ageOrUser.age;
    }
  } else {
    const numAge = typeof ageOrUser === 'number' ? ageOrUser : 25;
    currentAgeYears = Math.max(0, numAge);
    exactAgeYears = currentAgeYears;
  }

  if (exactAgeYears >= avgLifeYears) {
    return {
      currentAgeYears,
      currentAgeMonths,
      currentAgeDays,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      isPastAverage: true,
    };
  }

  const remainingYearsExact = avgLifeYears - exactAgeYears;
  const years = Math.floor(remainingYearsExact);
  const months = Math.floor((remainingYearsExact - years) * 12);
  const days = Math.floor(((remainingYearsExact - years) * 12 - months) * 30.4375);
  const totalDays = Math.round(remainingYearsExact * 365.25);

  return {
    currentAgeYears,
    currentAgeMonths,
    currentAgeDays,
    years,
    months,
    days,
    totalDays,
    isPastAverage: false,
  };
}

export function formatBanglaNumber(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => banglaDigits[Number(d)]);
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToBangla(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    return `${formatBanglaNumber(d)} ${monthName} ${formatBanglaNumber(y)} (${dayName})`;
  } catch {
    return dateStr;
  }
}

export function format12HourTime(time24: string, banglaPeriod: boolean = false): string {
  if (!time24 || typeof time24 !== 'string') return '';
  try {
    // Extract HH:MM even if there is trailing timezone text like "16:30 (BST)"
    const cleanMatch = time24.match(/(\d{1,2}):(\d{2})/);
    if (!cleanMatch) return time24;

    let hours = parseInt(cleanMatch[1], 10);
    const minutes = cleanMatch[2];
    
    if (isNaN(hours)) return time24;

    const isPM = hours >= 12;
    const period = isPM ? 'PM' : 'AM';
    let bPeriod = '';

    if (hours === 0) {
      hours = 12;
      bPeriod = 'রাত';
    } else if (hours < 12) {
      if (hours >= 4 && hours < 6) bPeriod = 'ভোর';
      else if (hours >= 6 && hours < 12) bPeriod = 'সকাল';
      else bPeriod = 'রাত';
    } else if (hours === 12) {
      hours = 12;
      bPeriod = 'দুপুর';
    } else {
      hours = hours - 12;
      if (hours >= 1 && hours < 4) bPeriod = 'দুপুর';
      else if (hours >= 4 && hours < 6) bPeriod = 'বিকাল';
      else if (hours >= 6 && hours < 8) bPeriod = 'সন্ধ্যা';
      else bPeriod = 'রাত';
    }

    const hFormatted = String(hours).padStart(2, '0');
    const timeFormatted = `${formatBanglaNumber(hFormatted)}:${formatBanglaNumber(minutes)}`;

    if (banglaPeriod) {
      return `${bPeriod} ${timeFormatted}`;
    }
    return `${timeFormatted} ${period}`;
  } catch {
    return time24;
  }
}

export function isDateFriday(dateStr: string): boolean {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getDay() === 5; // 5 is Friday
  } catch {
    return false;
  }
}

export function getShiftedDateString(dateStr: string, dayOffset: number): string {
  const [y, d, m] = [parseInt(dateStr.slice(0, 4), 10), parseInt(dateStr.slice(8, 10), 10), parseInt(dateStr.slice(5, 7), 10)];
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dayOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
