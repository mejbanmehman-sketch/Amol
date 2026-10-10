// Quran Page Fetcher & Cache Service for 611 Hafezi Pages (নূরানী হাফেজী কুরআন শরীফ ৬১১ পৃষ্ঠা)
import { ALL_114_SURAHS, ALL_30_JUZ } from './quranSurahList';

export const TOTAL_HAFEZI_PAGES = 611;

export interface QuranAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surahNumber: number;
  surahNameArabic: string;
  surahNameBangla: string;
}

export interface FetchedQuranPage {
  pageNumber: number;
  juzNumber: number;
  juzNameBangla: string;
  surahNameArabic: string;
  surahNameBangla: string;
  ayahs: QuranAyah[];
  hasBismillah: boolean;
  isKhatmulQuran?: boolean;
}

// In-memory cache for fast snappy page flipping
const pageMemoryCache: Record<number, FetchedQuranPage> = {};

// Helper: Determine Surah and Juz for any given page
export function getPageMetadata(pageNum: number) {
  const page = Math.min(TOTAL_HAFEZI_PAGES, Math.max(1, pageNum));
  
  // Find Juz
  let currentJuz = ALL_30_JUZ[0];
  for (let i = 0; i < ALL_30_JUZ.length; i++) {
    if (page >= ALL_30_JUZ[i].pageStart) {
      currentJuz = ALL_30_JUZ[i];
    }
  }

  // Find Surah
  let currentSurah = ALL_114_SURAHS[0];
  for (let i = 0; i < ALL_114_SURAHS.length; i++) {
    if (page >= ALL_114_SURAHS[i].pageStart) {
      currentSurah = ALL_114_SURAHS[i];
    }
  }

  return {
    juz: currentJuz,
    surah: currentSurah,
  };
}

export async function fetchHafeziPage(pageNumber: number): Promise<FetchedQuranPage> {
  const page = Math.min(TOTAL_HAFEZI_PAGES, Math.max(1, pageNumber));

  // 1. Check memory cache
  if (pageMemoryCache[page]) {
    return pageMemoryCache[page];
  }

  // 2. Check localStorage cache
  try {
    const cachedStr = localStorage.getItem(`hafezi_page_cache_611_v1_${page}`);
    if (cachedStr) {
      const parsed: FetchedQuranPage = JSON.parse(cachedStr);
      pageMemoryCache[page] = parsed;
      return parsed;
    }
  } catch {}

  const meta = getPageMetadata(page);

  // Special Page 611: Dua Khatmul Quran (খতমুল কুরআন দোয়া ও মুনাজাত)
  if (page === 611) {
    const khatmulQuranData: FetchedQuranPage = {
      pageNumber: 611,
      juzNumber: 30,
      juzNameBangla: '৩০তম পারা (আম্মা)',
      surahNameArabic: 'دُعَاءُ خَتْمِ الْقُرْآنِ',
      surahNameBangla: 'খতমুল কুরআন দোয়া ও মুনাজাত',
      hasBismillah: true,
      isKhatmulQuran: true,
      ayahs: [
        {
          number: 6237,
          text: 'اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ، وَاجْعَلْهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً',
          numberInSurah: 1,
          juz: 30,
          page: 611,
          surahNumber: 114,
          surahNameArabic: 'دُعَاءُ خَتْمِ الْقُرْآنِ',
          surahNameBangla: 'খতমুল কুরআন দোয়া',
        },
        {
          number: 6238,
          text: 'اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نَسِيتُ، وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ، وَارْزُقْنِي تِلَاوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ الْعَالَمِينَ',
          numberInSurah: 2,
          juz: 30,
          page: 611,
          surahNumber: 114,
          surahNameArabic: 'دُعَاءُ خَتْمِ الْقُرْآنِ',
          surahNameBangla: 'খতমুল কুরআন দোয়া',
        },
        {
          number: 6239,
          text: 'اللَّهُمَّ أَصْلِحْ لِي دِينِيَ الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِيَ الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ',
          numberInSurah: 3,
          juz: 30,
          page: 611,
          surahNumber: 114,
          surahNameArabic: 'دُعَاءُ خَتْمِ الْقُرْآنِ',
          surahNameBangla: 'খতমুল কুরআন দোয়া',
        },
        {
          number: 6240,
          text: 'اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ، وَخَيْرَ عَمَلِي خَوَاتِمَهُ، وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ فِيهِ',
          numberInSurah: 4,
          juz: 30,
          page: 611,
          surahNumber: 114,
          surahNameArabic: 'دُعَاءُ خَتْمِ الْقُرْآنِ',
          surahNameBangla: 'খতমুল কুরআন দোয়া',
        },
        {
          number: 6241,
          text: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ وَصَلَّى اللَّهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ',
          numberInSurah: 5,
          juz: 30,
          page: 611,
          surahNumber: 114,
          surahNameArabic: 'دُعَاءُ خَتْمِ الْقُرْآنِ',
          surahNameBangla: 'খতমুল কুরআন দোয়া',
        }
      ]
    };

    pageMemoryCache[611] = khatmulQuranData;
    return khatmulQuranData;
  }

  // 3. For pages 1-604, fetch from standard Al-Quran API
  const apiPage = Math.min(604, page);

  try {
    const res = await fetch(`https://api.alquran.cloud/v1/page/${apiPage}/quran-uthmani`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data.ayahs) && json.data.ayahs.length > 0) {
        const rawAyahs = json.data.ayahs;
        const firstAyah = rawAyahs[0];
        const matchedSurah = ALL_114_SURAHS.find((s) => s.number === firstAyah.surah.number) || meta.surah;
        const matchedJuz = ALL_30_JUZ.find((j) => j.number === firstAyah.juz) || meta.juz;

        const ayahs: QuranAyah[] = rawAyahs.map((a: any) => {
          let cleanText = a.text || '';
          if (a.numberInSurah === 1 && a.surah.number !== 1 && cleanText.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ')) {
            cleanText = cleanText.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', '').trim();
          }
          return {
            number: a.number,
            text: cleanText,
            numberInSurah: a.numberInSurah,
            juz: a.juz,
            page: page,
            surahNumber: a.surah.number,
            surahNameArabic: a.surah.name || matchedSurah.nameArabic,
            surahNameBangla: matchedSurah.nameBangla,
          };
        });

        const hasBismillah = rawAyahs.some((a: any) => a.numberInSurah === 1 && a.surah.number !== 9);

        const pageData: FetchedQuranPage = {
          pageNumber: page,
          juzNumber: matchedJuz.number,
          juzNameBangla: matchedJuz.nameBangla,
          surahNameArabic: matchedSurah.nameArabic,
          surahNameBangla: matchedSurah.nameBangla,
          ayahs,
          hasBismillah,
        };

        // Cache page
        pageMemoryCache[page] = pageData;
        try {
          localStorage.setItem(`hafezi_page_cache_611_v1_${page}`, JSON.stringify(pageData));
        } catch {}

        return pageData;
      }
    }
  } catch (err) {
    console.warn(`Could not fetch page ${page} online, using fallback template`, err);
  }

  // 4. Offline Fallback Page Generator
  const isStartOfSurah = meta.surah.pageStart === page;
  const fallbackAyahs: QuranAyah[] = [
    {
      number: page * 10,
      text: `${meta.surah.nameArabic} - পৃষ্ঠা ${page} এর পবিত্র কুরআন তিলাওয়াত। আল্লাহ তাআলার রহমত ও বরকতপূর্ণ বাণী।`,
      numberInSurah: 1,
      juz: meta.juz.number,
      page: page,
      surahNumber: meta.surah.number,
      surahNameArabic: meta.surah.nameArabic,
      surahNameBangla: meta.surah.nameBangla,
    }
  ];

  const fallbackData: FetchedQuranPage = {
    pageNumber: page,
    juzNumber: meta.juz.number,
    juzNameBangla: meta.juz.nameBangla,
    surahNameArabic: meta.surah.nameArabic,
    surahNameBangla: meta.surah.nameBangla,
    ayahs: fallbackAyahs,
    hasBismillah: isStartOfSurah && meta.surah.number !== 9,
  };

  return fallbackData;
}

/**
 * Returns the high-resolution authentic Mushaf page image URL
 * Pages 1 to 604 map directly to standard Hafs Madani Mushaf images.
 */
export function getQuranPageImageUrl(pageNumber: number): string {
  const page = Math.min(604, Math.max(1, pageNumber));
  const pad = String(page).padStart(3, '0');
  return `https://files.quran.app/hafs/madani/width_1024/page${pad}.png`;
}

