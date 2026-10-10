export interface SurahMeta {
  number: number;
  nameArabic: string;
  nameBangla: string;
  meaningBangla: string;
  totalAyahs: number;
  revelationType: 'মাক্কী' | 'মাদানী';
  pageStart: number;
}

export const SURAH_LIST: SurahMeta[] = [
  { number: 1, nameArabic: 'الفَاتِحة', nameBangla: 'আল-ফাতিহা', meaningBangla: 'সূচনা', totalAyahs: 7, revelationType: 'মাক্কী', pageStart: 1 },
  { number: 2, nameArabic: 'البَقَرَة', nameBangla: 'আল-বাক্বারা', meaningBangla: 'গাভী', totalAyahs: 286, revelationType: 'মাদানী', pageStart: 2 },
  { number: 3, nameArabic: 'آل عِمرَان', nameBangla: 'আলে ইমরান', meaningBangla: 'ইমরানের পরিবার', totalAyahs: 200, revelationType: 'মাদানী', pageStart: 50 },
  { number: 4, nameArabic: 'النِّسَاء', nameBangla: 'আন-নিসা', meaningBangla: 'নারী', totalAyahs: 176, revelationType: 'মাদানী', pageStart: 77 },
  { number: 5, nameArabic: 'المَائدة', nameBangla: 'আল-মায়িদাহ', meaningBangla: 'খাদ্যপূর্ণ দস্তরখান', totalAyahs: 120, revelationType: 'মাদানী', pageStart: 106 },
  { number: 6, nameArabic: 'الأنعَام', nameBangla: 'আল-আনআম', meaningBangla: 'গৃহপালিত পশু', totalAyahs: 165, revelationType: 'মাক্কী', pageStart: 128 },
  { number: 18, nameArabic: 'الكهف', nameBangla: 'আল-কাহাফ', meaningBangla: 'গুহা', totalAyahs: 110, revelationType: 'মাক্কী', pageStart: 293 },
  { number: 36, nameArabic: 'يس', nameBangla: 'ইয়াসীন', meaningBangla: 'ইয়াসীন (কুরআনের হৃৎপিণ্ড)', totalAyahs: 83, revelationType: 'মাক্কী', pageStart: 440 },
  { number: 55, nameArabic: 'الرحمن', nameBangla: 'আর-রহমান', meaningBangla: 'পরম দয়ালু', totalAyahs: 78, revelationType: 'মাদানী', pageStart: 531 },
  { number: 56, nameArabic: 'الواقعة', nameBangla: 'আল-ওয়াক্বিয়া', meaningBangla: 'অবশ্যম্ভাবী ঘটনা', totalAyahs: 96, revelationType: 'মাক্কী', pageStart: 534 },
  { number: 67, nameArabic: 'الملك', nameBangla: 'আল-মুলক', meaningBangla: 'সার্বভৌম কর্তৃত্ব', totalAyahs: 30, revelationType: 'মাক্কী', pageStart: 562 },
  { number: 112, nameArabic: 'الإخلاص', nameBangla: 'আল-ইখলাস', meaningBangla: 'একনিষ্ঠতা', totalAyahs: 4, revelationType: 'মাক্কী', pageStart: 604 },
  { number: 113, nameArabic: 'الفلق', nameBangla: 'আল-ফালাক্ব', meaningBangla: 'নিশিভোর', totalAyahs: 5, revelationType: 'মাক্কী', pageStart: 604 },
  { number: 114, nameArabic: 'الناس', nameBangla: 'আন-নাস', meaningBangla: 'মানবজাতি', totalAyahs: 6, revelationType: 'মাক্কী', pageStart: 604 },
];

export interface SurahContentData {
  number: number;
  name: string;
  nameArabic: string;
  bismillah: boolean;
  verses: {
    number: number;
    arabic: string;
    bangla: string;
  }[];
}

export const SPECIAL_SURAHS: Record<number, SurahContentData> = {
  36: {
    number: 36,
    name: 'সূরা ইয়াসীন',
    nameArabic: 'سورة يس',
    bismillah: true,
    verses: [
      { number: 1, arabic: 'يسٓ', bangla: 'ইয়া-সীন।' },
      { number: 2, arabic: 'وَٱلْقُرْءَانِ ٱلْحَكِيمِ', bangla: 'প্রজ্ঞাময় কুরআনের শপথ,' },
      { number: 3, arabic: 'إِنَّكَ لَمِنَ ٱلْمُرْسَلِينَ', bangla: 'নিশ্চয় আপনি রাসূলগণের অন্তর্ভুক্ত,' },
      { number: 4, arabic: 'عَلَىٰ صِرَٰطٍۢ مُّسْتَقِيمٍۢ', bangla: 'সরল-সঠিক পথের উপর প্রতিষ্ঠিত।' },
      { number: 5, arabic: 'تَنزِيلَ ٱلْعَزِيزِ ٱلرَّحِيمِ', bangla: 'ইহা পরাক্রমশালী পরম দয়ালু আল্লাহর পক্ষ থেকে অবতীর্ণ,' },
      { number: 6, arabic: 'لِتُنذِرَ قَوْمًۭا مَّآ أُنذِرَ ءَابَآؤُهُمْ فَهُمْ غَٰفِلُونَ', bangla: 'যাতে আপনি এমন এক জাতিকে সতর্ক করেন যাদের পূর্বপুরুষদের সতর্ক করা হয়নি, যার ফলে তারা উদাসীন।' },
      { number: 7, arabic: 'لَقَدْ حَقَّ ٱلْقَوْلُ عَلَىٰٓ أَكْثَرِهِمْ فَهُمْ لَا يُؤْمِنُونَ', bangla: 'অবশ্যই তাদের অধিকাংশের বিরুদ্ধে শাস্তির বাণী অবধারিত হয়েছে, ফলে তারা ঈমান আনবে না।' },
      { number: 8, arabic: 'إِنَّا جَعَلْنَا فِىٓ أَعْنَـٰقِهِمْ أَغْلَـٰلًۭا فَهِىَ إِلَى ٱلْأَذْقَانِ فَهُم مُّقْمَحُونَ', bangla: 'আমি তাদের গর্দানে বেড়ি পরিয়ে দিয়েছি, যা চিবুক পর্যন্ত পৌঁছেছে; ফলে তাদের মাথা উপরের দিকে উত্তোলিত হয়ে আছে।' },
      { number: 83, arabic: 'فَسُبْحَـٰنَ ٱلَّذِى بِيَدِهِۦ مَلَكُوتُ كُلِّ شَىْءٍۢ وَإِلَيْهِ تُرْجَعُونَ', bangla: 'অতএব পবিত্র ও মহান সেই সত্তা, যাঁর হাতে সমস্ত কিছুর পূর্ণ সার্বভৌম কর্তৃত্ব এবং তাঁরই কাছে তোমরা প্রত্যাবর্তিত হবে।' }
    ]
  },
  56: {
    number: 56,
    name: 'সূরা আল-ওয়াক্বিয়া',
    nameArabic: 'سورة الواقعة',
    bismillah: true,
    verses: [
      { number: 1, arabic: 'إِذَا وَقَعَتِ ٱلْوَاقِعَةُ', bangla: 'যখন কিয়ামত সংঘটিত হবে,' },
      { number: 2, arabic: 'لَيْسَ لِوَقْعَتِهَا كَاذِبَةٌ', bangla: 'যার সংঘটন মিথ্যা হওয়ার নয়,' },
      { number: 3, arabic: 'خَافِضَةٌۭ رَّافِعَةٌ', bangla: 'তা কাউকে করবে অবনমিত, কাউকে করবে সমুন্নত;' },
      { number: 4, arabic: 'إِذَا رُجَّتِ ٱلْأَرْضُ رَجًّۭا', bangla: 'যখন পৃথিবী প্রবল কম্পনে প্রকম্পিত হবে,' },
      { number: 5, arabic: 'وَبُسَّتِ ٱلْجِبَالُ بَسًّۭا', bangla: 'এবং পর্বতমালা চূর্ণ-বিচূর্ণ হয়ে যাবে,' },
      { number: 6, arabic: 'فَكَانَتْ هَبَآءًۭ مُّنۢبَثًّۭا', bangla: 'অতঃপর তা বিক্ষিপ্ত ধূলিকণায় পরিণত হবে।' }
    ]
  },
  67: {
    number: 67,
    name: 'সূরা আল-মুলক',
    nameArabic: 'سورة الملك',
    bismillah: true,
    verses: [
      { number: 1, arabic: 'تَبَـٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌ', bangla: 'বরকতময় তিনি যাঁর হাতে সমগ্র রাজত্ব, আর তিনি সর্ববিষয়ে সর্বশক্তিমান।' },
      { number: 2, arabic: 'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًۭا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ', bangla: 'যিনি সৃষ্টি করেছেন মৃত্যু ও জীবন, যাতে তোমাদের পরীক্ষা করেন কে তোমাদের মধ্যে কর্মে উত্তম? আর তিনি পরাক্রমশালী, অতি ক্ষমাশীল।' },
      { number: 3, arabic: 'ٱلَّذِى خَلَقَ سَبْعَ سَمَـٰوَٰتٍۢ طِبَاقًۭا ۖ مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَـٰنِ مِن تَفَـٰوُتٍۢ ۖ فَٱرْجِعِ ٱلْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍۢ', bangla: 'যিনি সৃষ্টি করেছেন স্তরে স্তরে সাত আসমান। পরম করুণাময়ের সৃষ্টিতে তুমি কোনো অসামঞ্জস্য দেখতে পাবে না। তুমি আবার দৃষ্টি ফিরাও, কোনো ফাটল দেখতে পাও কি?' }
    ]
  },
  18: {
    number: 18,
    name: 'সূরা আল-কাহাফ',
    nameArabic: 'سورة الكهف',
    bismillah: true,
    verses: [
      { number: 1, arabic: 'ٱلْحَمْدُ لِلَّهِ ٱلَّذِىٓ أَنزَلَ عَلَىٰ عَبْدِهِ ٱلْكِتَـٰبَ وَلَمْ يَجْعَل لَّهُۥ عِوَجَاۜ', bangla: 'সমস্ত প্রশংসা আল্লাহর, যিনি তাঁর বান্দার প্রতি কিতাব অবতীর্ণ করেছেন এবং এতে কোনো বক্রতা রাখেননি।' },
      { number: 2, arabic: 'قَيِّمًۭا لِّيُنذِرَ بَأْسًۭا شَدِيدًۭا مِّن لَّدُنْهُ وَيُبَشِّرَ ٱلْمُؤْمِنِينَ ٱلَّذِينَ يَعْمَلُونَ ٱلصَّـٰلِحَـٰتِ أَنَّ لَهُمْ أَجْرًا حَسَنًۭا', bangla: 'সুপ্রতিষ্ঠিত কিতাব, যা আল্লাহর পক্ষ থেকে এক কঠিন শাস্তির ভয় প্রদর্শন করে এবং সৎকর্মশীল মুমিনদের সুসংবাদ দেয় যে তাদের জন্য রয়েছে উত্তম পুরস্কার।' },
      { number: 110, arabic: 'قُلْ إِنَّمَآ أَنَا۠ بَشَرٌۭ مِّثْلُكُمْ يُوحَىٰٓ إِلَىَّ أَنَّمَآ إِلَـٰهُكُمْ إِلَـٰهٌۭ وَٰحِدٌۭ ۖ فَمَن كَانَ يَرْجُوا۟ لِقَآءَ رَبِّهِۦ فَلْيَعْمَلْ عَمَلًۭا صَـٰلِحًۭا وَلَا يُشْرِكْ بِعِبَادَةِ رَبِّهِۦٓ أَحَدًۢا', bangla: 'বলুন: আমি তোমাদের মতোই একজন মানুষ, আমার প্রতি ওহী আসে যে তোমাদের উপাস্য একমাত্র একক উপাস্য। অতএব যে ব্যক্তি তার প্রতিপালকের সাক্ষাত কামনা করে, সে যেন সৎকর্ম করে এবং তার প্রতিপালকের ইবাদতে কাউকে অংশীদার না করে।' }
    ]
  }
};
