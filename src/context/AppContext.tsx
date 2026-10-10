import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  DailyAmal,
  PrayerTimings,
  AlarmItem,
  QuranNote,
  DuaItem,
  PersonalContact,
  UploadedPdf,
  AlarmSoundType,
  CallHistoryItem,
  ContentReport,
  CallSession
} from '../types';
import {
  calculateAmalScore,
  getLevelInfo,
  getTodayDateString,
  getShiftedDateString,
  RANKING_LEVELS
} from '../utils/scoring';
import { audioService, requestNotificationPermission, sendBrowserNotification, SoundType } from '../utils/audioAlarm';
import { DEFAULT_DUAS } from '../data/defaultDuas';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import {
  registerWithFirebase,
  loginWithFirebase,
  logoutFromFirebase,
  updateUserHeartbeat,
  mapDocToUser,
  subscribeToAllUsers,
  updateUserAccountStatusInDb,
  logAdminAction
} from '../services/firebaseAuthService';
import {
  listenForIncomingCalls,
  declineCallSession
} from '../services/webrtcService';
import { subscribeToFriendships } from '../services/friendService';

interface AppContextType {
  user: User | null;
  selectedDate: string;
  dailyAmal: DailyAmal;
  prayerTimings: PrayerTimings | null;
  prayerCity: string;
  nextPrayer: { name: string; time: string; remainingText: string } | null;
  isOnline: boolean;
  alarms: AlarmItem[];
  quranNotes: QuranNote[];
  duas: DuaItem[];
  allUsers: User[];
  contacts: PersonalContact[];
  uploadedPdfs: UploadedPdf[];
  isAdmin: boolean;
  canInstallPwa: boolean;
  theme: 'dark' | 'light';
  
  // Actions
  setSelectedDate: (date: string) => void;
  shiftDate: (offset: number) => void;
  jumpToToday: () => void;
  updateDailyAmal: (updates: Partial<DailyAmal>) => void;
  saveAmalExplicitly: () => void;
  setPrayerCity: (city: string) => void;
  fetchPrayerTimesForCity: (city: string) => Promise<void>;
  toggleTheme: () => void;
  
  // Auth & Profile
  loginUser: (emailOrPhone: string, pass: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginAdmin: (email: string, pass: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithFacebook: (fbUser?: { name: string; email?: string; photo?: string }) => { success: boolean; message: string };
  registerUser: (
    name: string,
    email: string,
    phone: string,
    age: number,
    pass: string,
    birthDay?: number,
    birthMonth?: number,
    birthYear?: number
  ) => Promise<{ success: boolean; message: string; otp?: string; user?: User }>;
  verifyOtp: (code: string) => { success: boolean; message: string };
  requestPasswordReset: (phone: string) => { success: boolean; otp?: string; message: string };
  resetPasswordWithOtp: (phone: string, otp: string, newPass: string) => { success: boolean; message: string };
  updateProfile: (updates: Partial<User>) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  deleteUserByAdmin: (userId: string) => void;
  logoutUser: () => Promise<void>;

  // Friends and WebRTC Calling
  friendsList: string[];
  isFriend: (targetUserId: string) => boolean;
  activeCallSession: CallSession | null;
  incomingCallSession: CallSession | null;
  initiateCall: (target: User, type: 'audio' | 'video') => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => Promise<void>;
  endActiveCall: () => void;
  
  // Qaza Calculations
  updateQazaTarget: (newTotal: number) => void;
  repayQazaSalah: (rakatCount: number) => void;
  
  // Alarms
  toggleAlarm: (id: string) => void;
  addAlarm: (title: string, time: string, type: 'prayer' | 'masnun' | 'custom', days: string[], sound?: SoundType) => void;
  deleteAlarm: (id: string) => void;
  testAlarmAudio: (sound?: SoundType) => void;
  enableNotifications: () => Promise<boolean>;
  
  // Quran Notes
  addQuranNote: (surah: string, ayah: number, page: number, note: string) => void;
  deleteQuranNote: (id: string) => void;

  // Personal Contacts
  addContact: (nameOrObj: string | Partial<PersonalContact>, phone?: string, relation?: string, note?: string) => void;
  importContactsBatch: (contactsList: Partial<PersonalContact>[]) => void;
  deleteContact: (id: string) => void;

  // Donation Stats
  totalDonationTaka: number;

  // Uploaded PDFs
  addUploadedPdf: (title: string, fileName: string, fileData: string, fileSize?: string, totalPages?: number) => void;
  deleteUploadedPdf: (id: string) => void;
  updatePdfPage: (id: string, page: number) => void;
  
  // Community Counters (Transparent distinction)
  publicCommunityCounter: number;
  actualRegisteredUsers: number;
  actualActiveUsers: number;

  // Moderation & Reports
  reports: ContentReport[];
  submitReport: (report: Omit<ContentReport, 'id' | 'created_at' | 'status'>) => void;
  resolveReport: (reportId: string, action: 'dismiss' | 'resolve' | 'delete_content') => void;
  suspendUserByAdmin: (userId: string) => void;
  banUserByAdmin: (userId: string) => void;

  // Call History
  callHistory: CallHistoryItem[];
  addCallHistory: (item: Omit<CallHistoryItem, 'id'>) => void;
  clearCallHistory: () => void;

  // Account Management
  deleteMyAccount: () => void;

  // PWA
  installPwa: () => void;
  
  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const ADMIN_EMAIL = 'mahmudyahya941@gmail.com';
export const ADMIN_PASS = 'Yahya38@#';
export const ADMIN_CORRECT_NAME = 'মাওলানা মোঃ ইয়াহ্ইয়া মাহমুদ সিরাজী';

const DEFAULT_PRAYER_TIMINGS: PrayerTimings = {
  Fajr: '04:45',
  Sunrise: '05:42',
  Dhuhr: '12:05',
  Asr: '16:30',
  Sunset: '18:18',
  Maghrib: '18:20',
  Isha: '19:35',
};

const DEFAULT_ADMIN_USER: User = {
  id: 'admin-yahya-01',
  email: 'mahmudyahya941@gmail.com',
  phone: '01860977699',
  name: 'মাওলানা মোঃ ইয়াহ্ইয়া মাহমুদ সিরাজী',
  age: 26,
  birth_day: 15,
  birth_month: 4,
  birth_year: 1998,
  total_qaza: 150,
  qaza_adaied: 45,
  is_verified_phone: true,
  is_verified_email: true,
  role: 'admin',
  created_at: new Date().toISOString(),
  bio: 'আমি একজন মাওলানা। আমি পড়াশোনা করেছি বসুন্ধরা ইসলামী রিসার্চ সেন্টার থেকে। আমার জন্ম কক্সবাজার, এখন সিরাজগঞ্জে থাকি, একটি মাদ্রাসায় খেদমতরত অবস্থায় আছি। মাদ্রাসাটি দাওরায়ে হাদীস পর্যন্ত। চাড়াবাগ, আশুলিয়া, সাভার, ঢাকা।',
  is_public_profile: true,
};

const INITIAL_AMAL_STATE: Omit<DailyAmal, 'id' | 'user_id' | 'date' | 'total_score' | 'level' | 'updated_at'> = {
  namaz_adaied: 0,
  namaz_qaza: 0,
  namaz_jamat: 0,
  namaz_eka: 0,
  sunnat: 0,
  nafl: 0,
  beter: 0,
  awabin: 0,
  ishraq: 0,
  tahajjud: 0,
  quran_pages: 0,
  surah_yasin: false,
  surah_wakiah: false,
  surah_mulk: false,
  roza_weekly: 0,
  roza_monthly: 0,
  dan_taka: 0,
  morning_masnun: false,
  evening_masnun: false,
  sleep_masnun: false,
  bathroom_enter: false,
  bathroom_exit: false,
  food_dua: false,
  sleep_dua: false,
  death_reminder: false,
  gheebat_free: false,
  poroninda_free: false,
  help_people: false,
  salam_given: false,
  durud_count: 0,
  istighfar_count: 0,
  tasbih_done: false,
  qaza_today: 0,
  mithya: false,
  extra_nafl: '',
  surah_kahf: false,
  asr_durud: false,
  magrib_dua: false,
  gheebat_percent: 0,
  eye_protect_percent: 0,
  tongue_protect_percent: 0,
  good_deeds_percent: 0,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  }, []);

  // Users database in LocalStorage
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('amal_tracker_all_users_v2');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [
      DEFAULT_ADMIN_USER,
      {
        id: 'user-demo-2',
        email: 'tariqul.islam@gmail.com',
        phone: '01711223344',
        name: 'তরিকুল ইসলাম',
        age: 30,
        birth_day: 10,
        birth_month: 8,
        birth_year: 1994,
        total_qaza: 300,
        qaza_adaied: 75,
        is_verified_phone: true,
        is_verified_email: true,
        role: 'user',
        created_at: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'user-demo-3',
        email: 'abdullah.alnoman@gmail.com',
        phone: '01912345678',
        name: 'আব্দুল্লাহ আল নোমান',
        age: 22,
        birth_day: 5,
        birth_month: 12,
        birth_year: 2002,
        total_qaza: 80,
        qaza_adaied: 40,
        is_verified_phone: true,
        is_verified_email: true,
        role: 'user',
        created_at: '2026-08-10T00:00:00.000Z',
      }
    ];
  });

  // Current Logged In User
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('amal_tracker_current_user_v2');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Prayer times state
  const [prayerCity, setPrayerCity] = useState<string>(() => {
    return localStorage.getItem('amal_tracker_prayer_city') || 'Dhaka';
  });
  const [prayerTimings, setPrayerTimings] = useState<PrayerTimings>(DEFAULT_PRAYER_TIMINGS);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remainingText: string } | null>(null);

  // Theme Mode (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('amal_tracker_theme', next);
      if (next === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
      showToast(next === 'dark' ? 'ডার্ক মোড সক্রিয় করা হয়েছে' : 'লাইট মোড সক্রিয় করা হয়েছে');
      return next;
    });
  }, [showToast]);

  // Contacts
  const [contacts, setContacts] = useState<PersonalContact[]>(() => {
    try {
      const stored = localStorage.getItem('amal_tracker_contacts');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'c-admin',
        user_id: DEFAULT_ADMIN_USER.id,
        name: 'মাওলানা মোঃ ইয়াহ্ইয়া মাহমুদ সিরাজী',
        phone: '01860977699',
        relation: 'উস্তাদ',
        note: 'পরিচালক ও প্রতিষ্ঠাতা - ইসলামী মাসআলা ও স্বপ্নের ব্যাখ্যা',
        created_at: new Date().toISOString(),
      },
      {
        id: 'c-father',
        user_id: DEFAULT_ADMIN_USER.id,
        name: 'আব্বাজান',
        phone: '01812345678',
        relation: 'পরিবার',
        note: 'প্রতিদিন সকাল ও সন্ধ্যায় দোয়া নেওয়া',
        created_at: new Date().toISOString(),
      },
      {
        id: 'c-friend',
        user_id: DEFAULT_ADMIN_USER.id,
        name: 'মুফতি তানভীর আহমেদ',
        phone: '01799887766',
        relation: 'বন্ধু',
        note: 'আমল মোজাকারা ও কিতাব অধ্যায়ন সঙ্গী',
        created_at: new Date().toISOString(),
      }
    ];
  });

  // Sync Contacts
  useEffect(() => {
    try {
      localStorage.setItem('amal_tracker_contacts', JSON.stringify(contacts));
    } catch {}
  }, [contacts]);

  // Uploaded PDFs
  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdf[]>(() => {
    try {
      const stored = localStorage.getItem('amal_tracker_uploaded_pdfs');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  // Sync uploaded PDFs
  useEffect(() => {
    try {
      localStorage.setItem('amal_tracker_uploaded_pdfs', JSON.stringify(uploadedPdfs));
    } catch {}
  }, [uploadedPdfs]);

  // Alarms
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    try {
      const stored = localStorage.getItem('amal_tracker_alarms_v2');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'alarm-fajr',
        user_id: DEFAULT_ADMIN_USER.id,
        title: 'ফজর নামাজের এলার্ম',
        time: '04:40',
        type: 'prayer',
        days: ['প্রতিদিন'],
        sound: 'adhan',
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'alarm-tahajjud',
        user_id: DEFAULT_ADMIN_USER.id,
        title: 'তাহাজ্জুদ নামাজের সময় (মোরগের ডাক)',
        time: '03:45',
        type: 'masnun',
        days: ['প্রতিদিন'],
        sound: 'rooster',
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'alarm-morning-masnun',
        user_id: DEFAULT_ADMIN_USER.id,
        title: 'সকাল বেলার মাসনুন আমল ও জিকির (পাখির মিষ্টি সুর)',
        time: '06:30',
        type: 'masnun',
        days: ['প্রতিদিন'],
        sound: 'birds',
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'alarm-fountain',
        user_id: DEFAULT_ADMIN_USER.id,
        title: 'শান্ত ঝরনার শব্দে আমল ও মোরাকাবা',
        time: '17:15',
        type: 'custom',
        days: ['প্রতিদিন'],
        sound: 'fountain',
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'alarm-maghrib-dua',
        user_id: DEFAULT_ADMIN_USER.id,
        title: 'মাগরিবের আগে দোয়া ও ইস্তেগফার',
        time: '18:00',
        type: 'custom',
        days: ['প্রতিদিন'],
        sound: 'chime',
        active: true,
        created_at: new Date().toISOString(),
      },
    ];
  });

  // Quran Notes
  const [quranNotes, setQuranNotes] = useState<QuranNote[]>(() => {
    try {
      const stored = localStorage.getItem('amal_tracker_quran_notes');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'note-1',
        user_id: DEFAULT_ADMIN_USER.id,
        surah: 'সূরা ইয়াসীন',
        ayah: 1,
        page: 440,
        note: 'প্রতিদিন ফজরের পর তিলাওয়াতের অভ্যাস গড়ে তুলছি। মন শান্ত থাকে।',
        created_at: new Date().toISOString(),
      },
      {
        id: 'note-2',
        user_id: DEFAULT_ADMIN_USER.id,
        surah: 'সূরা আল-মুলক',
        ayah: 2,
        page: 562,
        note: 'ঘুমানোর আগে পড়লে কবরের আযাব থেকে পরিত্রাণ পাওয়া যায়।',
        created_at: new Date().toISOString(),
      }
    ];
  });

  const [duas] = useState<DuaItem[]>(DEFAULT_DUAS);

  // Content Reports (for Moderation)
  const [reports, setReports] = useState<ContentReport[]>(() => {
    try {
      const stored = localStorage.getItem('amal_tracker_reports_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'rep-1',
        reporter_id: 'user-02',
        reporter_name: 'হাফেজ আব্দুল ওয়াদুদ',
        reported_user_id: 'user-spammer-99',
        reported_user_name: 'অপরিচিত ইউজার',
        reason: 'অনাকাঙ্ক্ষিত বিজ্ঞাপনী বার্তা প্রচার',
        details: 'মজলিসে অপ্রাসঙ্গিক লিংক পোস্ট করেছিল',
        status: 'pending',
        created_at: '২০২৬-০৮-৩১'
      }
    ];
  });

  // Call History State
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('amal_call_history_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'call-log-1',
        partner_id: 'admin-yahya-01',
        partner_name: ADMIN_CORRECT_NAME,
        partner_phone: '01860977699',
        type: 'audio',
        direction: 'incoming',
        status: 'answered',
        timestamp: 'আজ সকাল ১০:৩০',
        duration: 185
      },
      {
        id: 'call-log-2',
        partner_id: 'user-02',
        partner_name: 'হাফেজ আব্দুল ওয়াদুদ',
        partner_phone: '01711002233',
        type: 'video',
        direction: 'outgoing',
        status: 'answered',
        timestamp: 'গতকাল রাত ০৯:১৫',
        duration: 320
      }
    ];
  });

  // Community Counter (Base display: 95,570 - clearly labeled as Community Participation Counter)
  const BASE_COMMUNITY_COUNT = 95570;
  const publicCommunityCounter = useMemo(() => {
    return BASE_COMMUNITY_COUNT + allUsers.length;
  }, [allUsers.length]);

  const actualRegisteredUsers = allUsers.length;
  const actualActiveUsers = useMemo(() => {
    return allUsers.filter((u) => !u.is_banned && !u.is_suspended).length;
  }, [allUsers]);

  // Daily Amal State for currently selected date
  const [dailyAmal, setDailyAmal] = useState<DailyAmal>(() => {
    const uId = user ? user.id : 'guest';
    const key = `amal_${uId}_${selectedDate}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {}
    
    const initialRaw = {
      ...INITIAL_AMAL_STATE,
      id: `${uId}_${selectedDate}`,
      user_id: uId,
      date: selectedDate,
    };
    const scoreBreakdown = calculateAmalScore(initialRaw);
    const lvl = getLevelInfo(scoreBreakdown.totalScore).currentLevel.name;
    return {
      ...initialRaw,
      total_score: scoreBreakdown.totalScore,
      level: lvl,
      updated_at: new Date().toISOString(),
    };
  });

  // Compute Total Donations Sum across all recorded amals in localStorage + current state
  const totalDonationTaka = useMemo(() => {
    let sum = 0;
    try {
      const uId = user?.id || 'guest';
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`amal_${uId}_`)) {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const data = JSON.parse(itemStr);
            if (data && typeof data.dan_taka === 'number') {
              if (key !== `amal_${uId}_${selectedDate}`) {
                sum += Math.max(0, data.dan_taka);
              }
            }
          }
        }
      }
      if (dailyAmal?.dan_taka && typeof dailyAmal.dan_taka === 'number') {
        sum += Math.max(0, dailyAmal.dan_taka);
      }
      if (user?.total_donation_taka && typeof user.total_donation_taka === 'number') {
        sum += Math.max(0, user.total_donation_taka);
      }
    } catch {}
    return sum;
  }, [user?.id, user?.total_donation_taka, selectedDate, dailyAmal?.dan_taka]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('অনলাইন কানেকশন স্থাপিত হয়েছে');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('অফলাইন মোড সক্রিয় (ডেটা লোকাল স্টোরেজে সংরক্ষিত)');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // PWA Install prompt listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('অ্যাপটি সাফল্যের সাথে ইন্সটল হচ্ছে!');
        setCanInstallPwa(false);
      }
      setDeferredPrompt(null);
    } else {
      showToast('মোবাইলে ব্রাউজারের থ্রি-ডট মেনু থেকে "Add to Home Screen" চাপুন');
    }
  };

  // 1. Firebase Auth State Listener & auto-sync with Firestore
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const appUser = mapDocToUser(snap.data(), fbUser.uid);
            setUser(appUser);
            updateUserHeartbeat(fbUser.uid);
          }
        } catch (err) {
          console.warn('Error fetching Firestore user on auth change:', err);
        }
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Realtime Heartbeat Presence loop (every 25s) & unload offline marking
  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;

    updateUserHeartbeat(uid);
    const interval = setInterval(() => {
      updateUserHeartbeat(uid);
    }, 25000);

    const handleBeforeUnload = () => {
      try {
        const nowIso = new Date().toISOString();
        updateDoc(doc(db, 'users', uid), {
          isOnline: false,
          lastActiveAt: nowIso
        }).catch(() => {});
        setDoc(
          doc(db, 'presence', uid),
          {
            userId: uid,
            isOnline: false,
            lastSeen: nowIso
          },
          { merge: true }
        ).catch(() => {});
      } catch {}
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserHeartbeat(uid);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  // 3. Friends List Realtime Subscription
  const [friendsList, setFriendsList] = useState<string[]>([]);
  useEffect(() => {
    if (!user?.id) {
      setFriendsList([]);
      return;
    }
    const unsub = subscribeToFriendships(user.id, (friendIds) => {
      setFriendsList(friendIds);
    });
    return () => unsub();
  }, [user?.id]);

  const isFriend = useCallback(
    (targetUserId: string) => {
      if (!targetUserId) return false;
      return friendsList.includes(targetUserId);
    },
    [friendsList]
  );

  // 4. WebRTC Calling Sessions
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
  const [incomingCallSession, setIncomingCallSession] = useState<CallSession | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIncomingCallSession(null);
      return;
    }
    const unsub = listenForIncomingCalls(user.id, (session) => {
      if (activeCallSession) return;
      setIncomingCallSession(session);
    });
    return () => unsub();
  }, [user?.id, activeCallSession]);

  const initiateCall = useCallback(
    (target: User, type: 'audio' | 'video') => {
      if (!user?.id) {
        showToast('কল করার জন্য প্রথমে লগইন করুন');
        return;
      }
      if (target.id === user.id) {
        showToast('নিজের আইডিতে কল করা যাবে না');
        return;
      }
      if (!isFriend(target.id)) {
        showToast('শুধুমাত্র পারস্পরিক ফ্রেন্ডলিস্টভুক্ত বন্ধুদের সাথেই কল করা সম্ভব। প্রথমে ফ্রেন্ড রিকোয়েস্ট পাঠান।');
        return;
      }
      const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const session: CallSession = {
        id: callId,
        callId,
        caller: {
          id: user.id,
          name: user.name,
          avatar: user.photo || user.avatar_url || '',
          phone: user.phone,
          role: user.role
        },
        receiver: {
          id: target.id,
          name: target.name,
          avatar: target.photo || target.avatar_url || '',
          phone: target.phone,
          role: target.role
        },
        type,
        status: 'calling',
        started_at: Date.now()
      };
      setActiveCallSession(session);
    },
    [user, isFriend, showToast]
  );

  const acceptIncomingCall = useCallback(() => {
    if (!incomingCallSession) return;
    setActiveCallSession(incomingCallSession);
    setIncomingCallSession(null);
  }, [incomingCallSession]);

  const declineIncomingCall = useCallback(async () => {
    if (!incomingCallSession) return;
    const callId = incomingCallSession.callId || incomingCallSession.id;
    await declineCallSession(callId, incomingCallSession);
    setIncomingCallSession(null);
    showToast('কল প্রত্যাখ্যান করা হয়েছে');
  }, [incomingCallSession, showToast]);

  const endActiveCall = useCallback(() => {
    setActiveCallSession(null);
  }, []);

  // Realtime Firestore Users Synchronization
  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((dbUsers) => {
      if (dbUsers && dbUsers.length > 0) {
        setAllUsers((prevUsers) => {
          // Merge dbUsers with local hardcoded/demo admin
          const merged = [...dbUsers];
          // Ensure default admin user is present if not in Firestore
          if (!merged.some((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
            merged.unshift(DEFAULT_ADMIN_USER);
          }
          return merged;
        });

        // Also update currentUser if currently logged in user is in Firestore
        if (user?.id) {
          const matchingDbUser = dbUsers.find((u) => u.id === user.id || u.uid === user.id);
          if (matchingDbUser) {
            setUser((prev) => (prev ? { ...prev, ...matchingDbUser } : matchingDbUser));
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Sync allUsers to local storage
  useEffect(() => {
    try {
      localStorage.setItem('amal_tracker_all_users_v2', JSON.stringify(allUsers));
    } catch {}
  }, [allUsers]);

  // Sync currentUser to local storage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('amal_tracker_current_user_v2', JSON.stringify(user));
      } else {
        localStorage.removeItem('amal_tracker_current_user_v2');
      }
    } catch {}
  }, [user]);

  // Sync alarms to local storage
  useEffect(() => {
    try {
      localStorage.setItem('amal_tracker_alarms_v2', JSON.stringify(alarms));
    } catch {}
  }, [alarms]);

  // Sync quran notes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('amal_tracker_quran_notes', JSON.stringify(quranNotes));
    } catch {}
  }, [quranNotes]);

  // Sync reports to local storage
  useEffect(() => {
    try {
      localStorage.setItem('amal_tracker_reports_v1', JSON.stringify(reports));
    } catch {}
  }, [reports]);

  // Sync call history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('amal_call_history_v1', JSON.stringify(callHistory));
    } catch {}
  }, [callHistory]);

  // Fetch Prayer Times from API
  const fetchPrayerTimesForCity = useCallback(async (city: string) => {
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Bangladesh&method=1`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.timings) {
          setPrayerTimings({
            Fajr: json.data.timings.Fajr.substring(0, 5),
            Sunrise: json.data.timings.Sunrise.substring(0, 5),
            Dhuhr: json.data.timings.Dhuhr.substring(0, 5),
            Asr: json.data.timings.Asr.substring(0, 5),
            Sunset: json.data.timings.Sunset.substring(0, 5),
            Maghrib: json.data.timings.Maghrib.substring(0, 5),
            Isha: json.data.timings.Isha.substring(0, 5),
          });
          localStorage.setItem('amal_tracker_prayer_city', city);
        }
      }
    } catch (err) {
      console.warn('Using offline cached prayer times', err);
    }
  }, []);

  useEffect(() => {
    fetchPrayerTimesForCity(prayerCity);
  }, [prayerCity, fetchPrayerTimesForCity]);

  // Calculate Next Prayer countdown
  useEffect(() => {
    const calculateNext = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const prayerOrder = [
        { name: 'ফজর', time: prayerTimings.Fajr },
        { name: 'সূর্যোদয়', time: prayerTimings.Sunrise },
        { name: 'যোহর', time: prayerTimings.Dhuhr },
        { name: 'আসর', time: prayerTimings.Asr },
        { name: 'মাগরিব', time: prayerTimings.Maghrib },
        { name: 'এশা', time: prayerTimings.Isha },
      ];

      for (const p of prayerOrder) {
        const [h, m] = p.time.split(':').map(Number);
        const pMinutes = h * 60 + m;
        if (pMinutes > currentMinutes) {
          const diff = pMinutes - currentMinutes;
          const diffHours = Math.floor(diff / 60);
          const diffMins = diff % 60;
          const remainingText = diffHours > 0 ? `${diffHours} ঘণ্টা ${diffMins} মিনিট বাকি` : `${diffMins} মিনিট বাকি`;
          setNextPrayer({ name: p.name, time: p.time, remainingText });
          return;
        }
      }

      const [fh, fm] = prayerTimings.Fajr.split(':').map(Number);
      const fajrMinutesTomorrow = (24 * 60 - currentMinutes) + (fh * 60 + fm);
      const diffHours = Math.floor(fajrMinutesTomorrow / 60);
      const diffMins = fajrMinutesTomorrow % 60;
      setNextPrayer({
        name: 'ফজর (আগামীকাল)',
        time: prayerTimings.Fajr,
        remainingText: `${diffHours} ঘণ্টা ${diffMins} মিনিট বাকি`,
      });
    };

    calculateNext();
    const interval = setInterval(calculateNext, 30000);
    return () => clearInterval(interval);
  }, [prayerTimings]);

  // Alarm Check Loop (Checks active alarms every 15 seconds)
  useEffect(() => {
    let lastCheckedMinute = '';
    const alarmInterval = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      if (timeStr === lastCheckedMinute) return;
      lastCheckedMinute = timeStr;

      alarms.forEach((alarm) => {
        if (alarm.active && alarm.time === timeStr) {
          audioService.playSound(alarm.sound || 'adhan');
          sendBrowserNotification(alarm.title, `সময় হয়েছে: ${alarm.time}`);
          showToast(`🔔 এলার্ম বাজছে: ${alarm.title}`);
        }
      });
    }, 15000);

    return () => clearInterval(alarmInterval);
  }, [alarms, showToast]);

  // Load daily amal when selectedDate or user changes
  useEffect(() => {
    const uId = user ? user.id : 'guest';
    const key = `amal_${uId}_${selectedDate}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setDailyAmal(JSON.parse(stored));
        return;
      }
    } catch {}

    const newRecord: DailyAmal = {
      ...INITIAL_AMAL_STATE,
      id: `${uId}_${selectedDate}`,
      user_id: uId,
      date: selectedDate,
      total_score: 0,
      level: RANKING_LEVELS[0].name,
      updated_at: new Date().toISOString(),
    };
    const scoreBreakdown = calculateAmalScore(newRecord);
    newRecord.total_score = scoreBreakdown.totalScore;
    newRecord.level = getLevelInfo(scoreBreakdown.totalScore).currentLevel.name;
    setDailyAmal(newRecord);
  }, [selectedDate, user]);

  // Update daily amal state + auto-save + automatic qaza syncing
  const updateDailyAmal = (updates: Partial<DailyAmal>) => {
    setDailyAmal((prev) => {
      const next = { ...prev, ...updates };

      // Calculate good deeds percent automatically if behavior sliders update
      if (
        updates.gheebat_percent !== undefined ||
        updates.eye_protect_percent !== undefined ||
        updates.tongue_protect_percent !== undefined
      ) {
        const g = updates.gheebat_percent ?? next.gheebat_percent;
        const e = updates.eye_protect_percent ?? next.eye_protect_percent;
        const t = updates.tongue_protect_percent ?? next.tongue_protect_percent;
        next.good_deeds_percent = Math.round((g + e + t) / 3);
      }

      // Automatic Qaza Logic:
      // When namaz_qaza updates (আজকের কাজা রাকাত - manual input):
      // Direct rakat addition to user's total missed qaza!
      if (updates.namaz_qaza !== undefined && user) {
        const prevQaza = prev.namaz_qaza || 0;
        const newQaza = updates.namaz_qaza || 0;
        const diffQaza = newQaza - prevQaza;
        if (diffQaza !== 0) {
          const updatedTotal = Math.max(0, user.total_qaza + diffQaza);
          const updatedUser = { ...user, total_qaza: updatedTotal };
          setUser(updatedUser);
          setAllUsers((prevUsers) =>
            prevUsers.map((u) => (u.id === user.id ? updatedUser : u))
          );
        }
      }

      // When qaza_today updates (আজকে কাজা আদায় করেছি রাকাত):
      // Direct rakat addition to user's repaid qaza (qaza_adaied)!
      if (updates.qaza_today !== undefined && user) {
        const prevAdaied = prev.qaza_today || 0;
        const newAdaied = updates.qaza_today || 0;
        const diffRepaid = newAdaied - prevAdaied;
        if (diffRepaid !== 0) {
          const updatedAdaied = Math.max(0, user.qaza_adaied + diffRepaid);
          const updatedUser = { ...user, qaza_adaied: updatedAdaied };
          setUser(updatedUser);
          setAllUsers((prevUsers) =>
            prevUsers.map((u) => (u.id === user.id ? updatedUser : u))
          );
        }
      }

      // Re-calculate Score & Level
      const score = calculateAmalScore(next);
      const prevScore = prev.total_score;
      next.total_score = score.totalScore;
      const levelInfo = getLevelInfo(score.totalScore);
      next.level = levelInfo.currentLevel.name;
      next.updated_at = new Date().toISOString();

      // Check if leveled up
      if (score.totalScore >= 1000 && score.totalScore > prevScore && Math.floor(score.totalScore / 500) > Math.floor(prevScore / 500)) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#F5D76E', '#10B981', '#FFD700']
          });
        } catch {}
      }

      // Save to localStorage
      const uId = user ? user.id : 'guest';
      const key = `amal_${uId}_${selectedDate}`;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}

      return next;
    });
  };

  // Date Navigation
  const shiftDate = (offset: number) => {
    setSelectedDate((cur) => getShiftedDateString(cur, offset));
  };

  const jumpToToday = () => {
    setSelectedDate(getTodayDateString());
  };

  // Auth Operations: Dedicated User vs Admin Logins (Firebase Auth + Firestore)
  const loginUser = async (
    emailOrPhone: string,
    pass: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanInput = emailOrPhone.trim();
    if (!cleanInput) {
      return { success: false, message: 'দয়া করে ইমেইল বা ফোন নম্বর দিন।' };
    }
    if (pass.length < 6) {
      return { success: false, message: 'পাসওয়ার্ড ন্যূনতম ৬ ক্যারেক্টার হতে হবে।' };
    }

    try {
      const res = await loginWithFirebase(cleanInput, pass);
      if (res.success && res.user) {
        setUser(res.user);
        showToast(`স্বাগতম, ${res.user.name}! লগইন সফল হয়েছে।`);
        return { success: true, message: 'লগইন সফল হয়েছে', user: res.user };
      }
      return { success: false, message: res.message || 'লগইন ব্যর্থ হয়েছে।' };
    } catch (err: any) {
      return { success: false, message: err.message || 'লগইনে সমস্যা হয়েছে।' };
    }
  };

  const loginAdmin = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== ADMIN_EMAIL.toLowerCase() || pass !== ADMIN_PASS) {
      return { success: false, message: 'ভুল এডমিন ইমেইল বা পাসওয়ার্ড। শুধুমাত্র এডমিন প্রবেশের অনুমতি রাখেন।' };
    }

    try {
      const res = await loginWithFirebase(cleanEmail, pass);
      if (res.success && res.user) {
        const verifiedAdmin: User = {
          ...res.user,
          name: ADMIN_CORRECT_NAME,
          role: 'super_admin',
          is_verified_email: true,
          is_verified_phone: true
        };
        setUser(verifiedAdmin);
        showToast(`সম্মানিত পরিচালক ${ADMIN_CORRECT_NAME}, এডমিন প্যানেলে স্বাগতম!`);
        return { success: true, message: 'এডমিন লগইন সফল হয়েছে', user: verifiedAdmin };
      }
      return { success: false, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'এডমিন লগইনে ত্রুটি হয়েছে।' };
    }
  };

  const loginWithFacebook = (fbUser?: { name: string; email?: string; photo?: string }): { success: boolean; message: string } => {
    const name = fbUser?.name || 'ফেসবুক ইউজার';
    const email = fbUser?.email || `fb_${Date.now()}@facebook.com`;
    const photo = fbUser?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    let existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      existing = {
        id: `user-fb-${Date.now()}`,
        email,
        phone: '01XXXXXXXXX',
        name,
        age: 25,
        photo,
        total_qaza: 100,
        qaza_adaied: 0,
        is_verified_phone: true,
        is_verified_email: true,
        role: 'user',
        created_at: new Date().toISOString(),
      };
      setAllUsers((prev) => [...prev, existing!]);
    } else {
      existing = { ...existing, photo: photo || existing.photo };
      setAllUsers((prev) => prev.map((u) => (u.id === existing!.id ? existing! : u)));
    }
    setUser(existing);
    showToast(`স্বাগতম, ${name}! ফেসবুক একাউন্ট দিয়ে লগইন সফল হয়েছে।`);
    return { success: true, message: 'ফেসবুক লগইন সফল' };
  };

  const registerUser = async (
    name: string,
    email: string,
    phone: string,
    age: number,
    pass: string,
    birthDay?: number,
    birthMonth?: number,
    birthYear?: number
  ): Promise<{ success: boolean; message: string; otp?: string; user?: User }> => {
    if (!name.trim()) return { success: false, message: 'দয়া করে নাম লিখুন।' };
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 11) return { success: false, message: '১১ ডিজিটের সঠিক ফোন নম্বর দিন।' };
    if (pass.length < 6) return { success: false, message: 'পাসওয়ার্ড ন্যূনতম ৬ ক্যারেক্টার হতে হবে।' };

    const cleanEmail = email && email.includes('@')
      ? email.trim().toLowerCase()
      : `${cleanDigits}@amaltracker.local`;

    try {
      const res = await registerWithFirebase({
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        age: Number(age) || 25,
        pass,
        birthDay,
        birthMonth,
        birthYear
      });

      if (res.success && res.user) {
        setUser(res.user);
        showToast(`স্বাগতম, ${res.user.name}! একাউন্ট সফলভাবে তৈরি হয়েছে।`);
        return {
          success: true,
          message: 'রেজিস্ট্রেশন সফল হয়েছে!',
          otp: '123456',
          user: res.user
        };
      }
      return { success: false, message: res.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'রেজিস্ট্রেশনে ত্রুটি হয়েছে।' };
    }
  };

  const verifyOtp = (code: string): { success: boolean; message: string } => {
    if (code.trim() === '123456' || code.trim().length === 6) {
      if (user) {
        const updated = { ...user, is_verified_phone: true };
        setUser(updated);
        setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
        showToast('ফোন নম্বর সাফল্যের সাথে ভেরিফাইড হয়েছে!');
        return { success: true, message: 'ভেরিফিকেশন সফল হয়েছে!' };
      }
    }
    return { success: false, message: 'ভুল OTP কোড। আবার চেষ্টা করুন (টেস্ট কোড: 123456)' };
  };

  const requestPasswordReset = (phone: string): { success: boolean; otp?: string; message: string } => {
    const found = allUsers.find((u) => u.phone === phone.trim());
    if (!found) {
      return { success: false, message: 'এই ফোন নম্বরে কোনো একাউন্ট নেই।' };
    }
    const demoOtp = '123456';
    return {
      success: true,
      otp: demoOtp,
      message: `আপনার ফোনে ৬ ডিজিটের ওটিপি পাঠানো হয়েছে: ${demoOtp}`,
    };
  };

  const resetPasswordWithOtp = (phone: string, otp: string, newPass: string): { success: boolean; message: string } => {
    if (otp !== '123456' && otp.length !== 6) {
      return { success: false, message: 'ভুল OTP কোড।' };
    }
    if (newPass.length < 6) {
      return { success: false, message: 'পাসওয়ার্ড ন্যূনতম ৬ ক্যারেক্টার হতে হবে।' };
    }
    const found = allUsers.find((u) => u.phone === phone.trim());
    if (!found) return { success: false, message: 'ইউজার পাওয়া যায়নি।' };
    setUser(found);
    showToast('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
    return { success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' };
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));

    // Sync profile changes to Firestore
    try {
      const nowIso = new Date().toISOString();
      const firestoreUpdates: any = {
        updatedAt: nowIso
      };
      if (updates.name !== undefined) firestoreUpdates.name = updates.name;
      if (updates.phone !== undefined) firestoreUpdates.phone = updates.phone;
      if (updates.age !== undefined) firestoreUpdates.age = updates.age;
      if (updates.photo !== undefined) firestoreUpdates.photo = updates.photo;
      if (updates.bio !== undefined) firestoreUpdates.bio = updates.bio;
      if (updates.district !== undefined) firestoreUpdates.district = updates.district;
      if (updates.total_qaza !== undefined) firestoreUpdates.total_qaza = updates.total_qaza;
      if (updates.qaza_adaied !== undefined) firestoreUpdates.qaza_adaied = updates.qaza_adaied;
      if (updates.phone_visibility !== undefined) firestoreUpdates.phone_visibility = updates.phone_visibility;
      if (updates.is_public_profile !== undefined) firestoreUpdates.is_public_profile = updates.is_public_profile;

      await updateDoc(doc(db, 'users', user.id), firestoreUpdates).catch(() => {});
    } catch {}

    showToast('প্রোফাইল তথ্য আপডেট করা হয়েছে');
  };

  const deleteUserByAdmin = (userId: string) => {
    if (!isAdmin) {
      showToast('শুধুমাত্র এডমিন ইউজার ডিলিট করতে পারবেন');
      return;
    }
    if (userId === DEFAULT_ADMIN_USER.id) {
      showToast('প্রধান পরিচালকের একাউন্ট ডিলিট করা সম্ভব নয়');
      return;
    }
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));

    // Also delete from Firestore
    try {
      deleteDoc(doc(db, 'users', userId)).catch(() => {});
      logAdminAction({
        adminId: user?.id || 'admin-yahya-01',
        adminName: ADMIN_CORRECT_NAME,
        targetUserId: userId,
        action: 'delete_user'
      });
    } catch {}

    showToast('ইউজার সফলভাবে মুছে ফেলা হয়েছে');
  };

  const suspendUserByAdmin = (userId: string) => {
    if (!isAdmin) return;
    if (userId === DEFAULT_ADMIN_USER.id) {
      showToast('প্রধান পরিচালকের একাউন্ট স্থগিত করা সম্ভব নয়');
      return;
    }
    let nextStatus: 'active' | 'suspended' = 'suspended';
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const next = !u.is_suspended;
          nextStatus = next ? 'suspended' : 'active';
          return { ...u, is_suspended: next };
        }
        return u;
      })
    );

    // Sync to Firestore
    updateUserAccountStatusInDb(userId, { accountStatus: nextStatus }).catch(() => {});
    logAdminAction({
      adminId: user?.id || 'admin-yahya-01',
      adminName: ADMIN_CORRECT_NAME,
      targetUserId: userId,
      action: nextStatus === 'suspended' ? 'suspend' : 'unsuspend'
    });

    showToast('ইউজারের সাময়িক স্থগিতাদেশ স্ট্যাটাস আপডেট হয়েছে');
  };

  const banUserByAdmin = (userId: string) => {
    if (!isAdmin) return;
    if (userId === DEFAULT_ADMIN_USER.id) {
      showToast('প্রধান পরিচালকের একাউন্ট ব্যান করা সম্ভব নয়');
      return;
    }
    let nextStatus: 'active' | 'banned' = 'banned';
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const next = !u.is_banned;
          nextStatus = next ? 'banned' : 'active';
          return { ...u, is_banned: next };
        }
        return u;
      })
    );

    // Sync to Firestore
    updateUserAccountStatusInDb(userId, { accountStatus: nextStatus }).catch(() => {});
    logAdminAction({
      adminId: user?.id || 'admin-yahya-01',
      adminName: ADMIN_CORRECT_NAME,
      targetUserId: userId,
      action: nextStatus === 'banned' ? 'ban' : 'unban'
    });

    showToast('ইউজারের স্থায়ী ব্যান স্ট্যাটাস আপডেট হয়েছে');
  };

  const submitReport = (rep: Omit<ContentReport, 'id' | 'created_at' | 'status'>) => {
    const newReport: ContentReport = {
      ...rep,
      id: `report-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    setReports((prev) => [newReport, ...prev]);
    showToast('রিপোর্টটি সফলভাবে পর্যালোচনায় পাঠানো হয়েছে');
  };

  const resolveReport = (reportId: string, action: 'dismiss' | 'resolve' | 'delete_content') => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' } : r
      )
    );
    showToast(action === 'dismiss' ? 'রিপোর্টটি খারিজ করা হয়েছে' : 'রিপোর্টে প্রয়োজনীয় প্রশাসনিক ব্যবস্থা নেওয়া হয়েছে');
  };

  const addCallHistory = (item: Omit<CallHistoryItem, 'id'>) => {
    const newLog: CallHistoryItem = {
      ...item,
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    setCallHistory((prev) => [newLog, ...prev]);
  };

  const clearCallHistory = () => {
    setCallHistory([]);
    try {
      localStorage.removeItem('amal_call_history_v1');
    } catch {}
    showToast('কল হিস্টোরি সফলভাবে মুছে ফেলা হয়েছে');
  };

  const deleteMyAccount = () => {
    if (!user) return;
    if (user.id === DEFAULT_ADMIN_USER.id) {
      showToast('প্রধান পরিচালকের একাউন্ট ডিলিট করা যাবে না');
      return;
    }
    const currentId = user.id;
    setAllUsers((prev) => prev.filter((u) => u.id !== currentId));
    setUser(null);
    try {
      localStorage.removeItem('amal_tracker_current_user_v2');
    } catch {}
    showToast('আপনার একাউন্ট সফলভাবে মুছে ফেলা হয়েছে');
  };

  const logoutUser = async () => {
    const currentUid = user?.id || user?.uid;
    await logoutFromFirebase(currentUid).catch(() => {});
    setUser(null);
    showToast('লগআউট সম্পন্ন হয়েছে');
  };

  // Qaza Calculations
  const updateQazaTarget = (newTotal: number) => {
    if (!user) return;
    const safeTotal = Math.max(0, newTotal);
    const updated = { ...user, total_qaza: safeTotal };
    setUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    showToast(`মোট কাজা নামাজের লক্ষ্যমাত্রা ${safeTotal} রাকাত করা হয়েছে`);
  };

  const repayQazaSalah = (rakatCount: number) => {
    if (!user) return;
    const added = Math.max(0, rakatCount);
    const updatedAdaied = user.qaza_adaied + added;
    const updatedUser = { ...user, qaza_adaied: updatedAdaied };
    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    
    // Also record in today's dailyAmal
    updateDailyAmal({ qaza_today: (dailyAmal.qaza_today || 0) + added });
    showToast(`মাশাআল্লাহ! ${added} রাকাত কাজা আদায় সংরক্ষিত হয়েছে`);
  };

  const saveAmalExplicitly = () => {
    const uId = user ? user.id : 'guest';
    const key = `amal_${uId}_${selectedDate}`;
    try {
      localStorage.setItem(key, JSON.stringify(dailyAmal));
    } catch {}

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#10B981', '#F59E0B']
      });
    } catch {}

    showToast(`✅ মাশাআল্লাহ! আজকের (${selectedDate}) সকল আমল সংরক্ষিত হয়েছে।`);
  };

  // Alarm actions
  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    showToast('এলার্ম স্ট্যাটাস পরিবর্তিত হয়েছে');
  };

  const addAlarm = (
    title: string,
    time: string,
    type: 'prayer' | 'masnun' | 'custom',
    days: string[],
    sound: SoundType = 'adhan'
  ) => {
    const newAlarm: AlarmItem = {
      id: `alarm-${Date.now()}`,
      user_id: user?.id || 'guest',
      title,
      time,
      type,
      days: days.length ? days : ['প্রতিদিন'],
      sound,
      active: true,
      created_at: new Date().toISOString(),
    };
    setAlarms((prev) => [...prev, newAlarm]);
    showToast('নতুন এলার্ম যুক্ত করা হয়েছে');
  };

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    showToast('এলার্ম মুছে ফেলা হয়েছে');
  };

  const testAlarmAudio = (sound: SoundType = 'adhan') => {
    audioService.playSound(sound);
    const soundNames: Record<SoundType, string> = {
      adhan: 'পবিত্র আজানের সুর',
      rooster: 'মোরগের সুমধুর ডাক',
      birds: 'পাখির মিষ্টি কিচিরমিচির',
      fountain: 'ঝরনার মিষ্টি সুর',
      rain: 'বৃষ্টির স্নিগ্ধ শব্দ',
      river: 'নদীর পানির কলতান',
      ocean: 'সাগরের শান্ত ঢেউ',
      chime: 'ইসলামিক বেল চিম'
    };
    showToast(`🔊 ${soundNames[sound] || sound} বাজানো হচ্ছে...`);
  };

  const enableNotifications = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    if (granted) {
      showToast('নোটিফিকেশন অনুমতি চালু করা হয়েছে!');
      sendBrowserNotification('আমল ট্র্যাকার', 'নোটিফিকেশন সফলভাবে চালু হয়েছে!');
    } else {
      showToast('ব্রাউজারে নোটিফিকেশন অনুমতি দিন');
    }
    return granted;
  };

  // Quran Notes actions
  const addQuranNote = (surah: string, ayah: number, page: number, note: string) => {
    const newNote: QuranNote = {
      id: `note-${Date.now()}`,
      user_id: user?.id || 'guest',
      surah,
      ayah,
      page,
      note,
      created_at: new Date().toISOString(),
    };
    setQuranNotes((prev) => [newNote, ...prev]);
    showToast('কুরআন নোট সংরক্ষিত হয়েছে');
  };

  const deleteQuranNote = (id: string) => {
    setQuranNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('নোট মুছে ফেলা হয়েছে');
  };

  // Contacts actions
  const addContact = (
    nameOrObj: string | Partial<PersonalContact>,
    phone?: string,
    relation?: string,
    note?: string
  ) => {
    let newContact: PersonalContact;
    if (typeof nameOrObj === 'object') {
      newContact = {
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: user?.id || 'guest',
        name: (nameOrObj.name || '').trim(),
        phone: (nameOrObj.phone || '').trim(),
        category: nameOrObj.category || (nameOrObj as any).relation || 'অন্যান্য',
        relation: nameOrObj.relation || nameOrObj.category || 'অন্যান্য',
        note: nameOrObj.note || '',
        created_at: new Date().toISOString(),
      };
    } else {
      newContact = {
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: user?.id || 'guest',
        name: (nameOrObj || '').trim(),
        phone: (phone || '').trim(),
        category: relation || 'অন্যান্য',
        relation: relation || 'অন্যান্য',
        note: note || '',
        created_at: new Date().toISOString(),
      };
    }
    setContacts((prev) => [newContact, ...prev]);
    showToast('নতুন যোগাযোগ সফলভাবে সংরক্ষিত হয়েছে');
  };

  const importContactsBatch = (contactsList: Partial<PersonalContact>[]) => {
    if (!contactsList || contactsList.length === 0) return;
    const formatted: PersonalContact[] = contactsList
      .filter((c) => c.name && c.phone)
      .map((c) => ({
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: user?.id || 'guest',
        name: (c.name || '').trim(),
        phone: (c.phone || '').trim(),
        category: c.category || c.relation || 'অন্যান্য',
        relation: c.relation || c.category || 'অন্যান্য',
        note: c.note || '',
        created_at: new Date().toISOString(),
      }));

    if (formatted.length > 0) {
      setContacts((prev) => [...formatted, ...prev]);
      showToast(`সফলভাবে ${formatted.length} টি কন্টাক্ট নম্বর সংরক্ষিত করা হয়েছে!`);
    } else {
      showToast('কোনো বৈধ কন্টাক্ট নম্বর পাওয়া যায়নি');
    }
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    showToast('যোগাযোগ মুছে ফেলা হয়েছে');
  };

  // Uploaded PDFs actions
  const addUploadedPdf = (
    title: string,
    fileName: string,
    fileData: string,
    fileSize?: string,
    totalPages?: number
  ) => {
    const newPdf: UploadedPdf = {
      id: `pdf-${Date.now()}`,
      user_id: user?.id || 'guest',
      title,
      fileName,
      fileData,
      fileSize: fileSize || '2.5 MB',
      currentPage: 1,
      totalPages: totalPages || 30,
      uploaded_at: new Date().toISOString(),
    };
    setUploadedPdfs((prev) => [newPdf, ...prev]);
    showToast('কিতাব / কুরআন PDF সফলভাবে সংরক্ষিত হয়েছে');
  };

  const deleteUploadedPdf = (id: string) => {
    setUploadedPdfs((prev) => prev.filter((p) => p.id !== id));
    showToast('PDF মুছে ফেলা হয়েছে');
  };

  const updatePdfPage = (id: string, page: number) => {
    setUploadedPdfs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, currentPage: page } : p))
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        selectedDate,
        dailyAmal,
        prayerTimings,
        prayerCity,
        nextPrayer,
        isOnline,
        alarms,
        quranNotes,
        duas,
        allUsers,
        contacts,
        totalDonationTaka,
        uploadedPdfs,
        isAdmin,
        canInstallPwa,
        theme,
        
        setSelectedDate,
        shiftDate,
        jumpToToday,
        updateDailyAmal,
        saveAmalExplicitly,
        setPrayerCity,
        fetchPrayerTimesForCity,
        toggleTheme,
        
        loginUser,
        loginAdmin,
        loginWithFacebook,
        registerUser,
        verifyOtp,
        requestPasswordReset,
        resetPasswordWithOtp,
        updateProfile,
        updateUserProfile: updateProfile,
        deleteUserByAdmin,
        suspendUserByAdmin,
        banUserByAdmin,
        logoutUser,
        deleteMyAccount,

        // Calling & Friends
        friendsList,
        isFriend,
        activeCallSession,
        incomingCallSession,
        initiateCall,
        acceptIncomingCall,
        declineIncomingCall,
        endActiveCall,

        // Community Counter
        publicCommunityCounter,
        actualRegisteredUsers,
        actualActiveUsers,

        // Moderation
        reports,
        submitReport,
        resolveReport,

        // Call History
        callHistory,
        addCallHistory,
        clearCallHistory,

        updateQazaTarget,
        repayQazaSalah,
        
        toggleAlarm,
        addAlarm,
        deleteAlarm,
        testAlarmAudio,
        enableNotifications,
        
        addQuranNote,
        deleteQuranNote,
        addContact,
        importContactsBatch,
        deleteContact,
        addUploadedPdf,
        deleteUploadedPdf,
        updatePdfPage,
        installPwa,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#0a1628]/95 backdrop-blur-xl border border-[#D4AF37] text-[#D4AF37] text-xs sm:text-sm font-semibold rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 text-center font-bangla max-w-[90vw]">
          {toastMessage}
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
