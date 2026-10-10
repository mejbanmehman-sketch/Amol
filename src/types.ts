export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';
export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface User {
  id: string; // Firebase Auth UID
  uid?: string;
  email: string;
  phone: string;
  name: string;
  username?: string;
  age: number;
  birth_day?: number;
  birth_month?: number;
  birth_year?: number;
  birth_date?: string;
  avatar_url?: string;
  photo?: string;
  bio?: string;
  district?: string;
  total_qaza: number;
  qaza_adaied: number;
  total_donation_taka?: number;
  is_verified_phone: boolean;
  is_verified_email: boolean;
  role: UserRole;
  accountStatus?: AccountStatus;
  isOnline?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  created_at: string;
  is_public_profile?: boolean;
  phone_visibility?: 'everyone' | 'friends' | 'nobody';
  is_banned?: boolean;
  is_suspended?: boolean;
  lastReadQuranPage?: number;
}

export interface PersonalContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relation?: string;
  category?: 'আলেম' | 'পরিবার' | 'দ্বীনি ভাই' | 'উস্তাদ' | 'জরুরি' | 'অন্যান্য' | string;
  note?: string;
  created_at: string;
}

export interface UploadedPdf {
  id: string;
  user_id: string;
  title: string;
  fileName: string;
  fileData: string; // Base64 data URL
  fileSize?: string;
  currentPage: number;
  totalPages?: number;
  uploaded_at: string;
}

export interface DailyAmal {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  
  // ১. ৫ ওয়াক্ত নামাজ
  namaz_adaied: number; // 0-5
  namaz_qaza: number;   // 0-5
  namaz_jamat: number;  // 0-5
  namaz_eka: number;    // 0-5
  
  // ২. সুন্নত/নফল
  sunnat: number;       // rakat
  nafl: number;         // rakat
  beter: number;        // rakat
  awabin: number;       // rakat
  ishraq: number;       // rakat
  tahajjud: number;     // rakat
  
  // ৩. কুরআন
  quran_pages: number;  // pages 0-604
  surah_yasin: boolean;
  surah_wakiah: boolean;
  surah_mulk: boolean;
  
  // ৪. রোজা/দান
  roza_weekly: number;  // 0-7
  roza_monthly: number; // 0-30
  dan_taka: number;     // taka
  
  // ৫. সকাল-সন্ধ্যা মাসনুন
  morning_masnun: boolean;
  evening_masnun: boolean;
  sleep_masnun: boolean;
  
  // ৬. দোয়া ও জিকির
  bathroom_enter: boolean;
  bathroom_exit: boolean;
  food_dua: boolean;
  sleep_dua: boolean;
  death_reminder: boolean;
  
  // ৭. সামাজিক আমল
  gheebat_free: boolean;
  poroninda_free: boolean;
  help_people: boolean;
  salam_given: boolean;
  
  // ৮. জিকির ও ইস্তেগফার
  durud_count: number;
  istighfar_count: number;
  tasbih_done: boolean;
  
  // ৯. কাজা
  qaza_today: number; // rakat
  
  // ১০. অন্যান্য
  mithya: boolean; // penalty -15
  extra_nafl: string;
  
  // শুক্রবারের বিশেষ আমল
  surah_kahf: boolean;
  asr_durud: boolean;
  magrib_dua: boolean;
  
  // ব্যবহারের পার্সেন্টেজ (স্লাইডার)
  gheebat_percent: number; // 0-100
  eye_protect_percent: number; // 0-100
  tongue_protect_percent: number; // 0-100
  good_deeds_percent: number; // 0-100 (auto calculated)
  
  // স্কোর
  total_score: number;
  level: string;
  updated_at: string;
}

export interface RankingLevelInfo {
  name: string;
  minPoints: number;
  maxPoints: number;
  emoji: string;
  color: string;
}

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
  Firstthird?: string;
  Lastthird?: string;
}

export interface QuranNote {
  id: string;
  user_id: string;
  page: number;
  surah: string;
  ayah: number;
  note: string;
  created_at: string;
}

export interface DuaItem {
  id: string;
  category: 'সকাল' | 'সন্ধ্যা' | 'প্রয়োজনীয়' | 'নামাজ' | 'ঘুম';
  title: string;
  arabic: string;
  bangla_pronunciation: string;
  bangla_meaning: string;
  virtue?: string;
  reference?: string;
}

export type AlarmSoundType = 'adhan' | 'rooster' | 'birds' | 'fountain' | 'rain' | 'river' | 'ocean' | 'chime';

export interface AlarmItem {
  id: string;
  user_id: string;
  title: string;
  time: string; // HH:mm
  type: 'prayer' | 'masnun' | 'custom';
  days: string[]; // ['শনিবার', 'রবিবার', ...]
  active: boolean;
  sound?: AlarmSoundType;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  total_score: number;
  best_day_score: number;
  days_tracked: number;
  level: string;
  progress: number;
  created_at: string;
}

export interface MonthlyReport {
  id: string;
  user_id: string;
  month: string;
  total_score: number;
  best_day_score: number;
  days_tracked: number;
  level: string;
  progress: number;
  created_at: string;
}

export interface CommunityMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  sender_role?: string;
  receiver_id?: string; // empty string or undefined for public majlis
  text: string;
  timestamp: string;
  type: 'text' | 'amal_share' | 'audio' | 'image' | 'video_note' | 'announcement' | 'system';
  score?: number;
  level?: string;
  audio_url?: string;
  image_url?: string;
  video_url?: string;
  voice_duration?: number;
  reactions?: { [emoji: string]: string[] }; // emoji -> userIds
  reply_to?: { id: string; sender_name: string; text: string };
  seen?: boolean;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string;
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  messageType: 'text' | 'image' | 'audio' | 'amal_share' | 'video_note';
  isRead: boolean;
  score?: number;
  level?: string;
  audioUrl?: string;
  imageUrl?: string;
  voiceDuration?: number;
  reactions?: { [emoji: string]: string[] };
}

export interface Conversation {
  id: string;
  conversationId: string;
  participants: string[];
  participantDetails?: {
    [uid: string]: {
      name: string;
      avatar?: string;
      role?: string;
    };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
    messageType?: string;
  };
  typing?: {
    [uid: string]: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'rejected' | 'cancelled';

export interface FriendRequest {
  id: string;
  sender_id?: string;
  senderId?: string;
  sender_name?: string;
  senderName?: string;
  sender_avatar?: string;
  senderAvatar?: string;
  sender_phone?: string;
  sender_role?: string;
  senderRole?: string;
  receiver_id?: string;
  receiverId?: string;
  receiver_name?: string;
  receiverName?: string;
  receiver_avatar?: string;
  receiverAvatar?: string;
  status: FriendRequestStatus;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  prize_details?: string;
  deadline?: string;
  created_at: string;
  is_active: boolean;
  author_name?: string;
}

export type CallStatus =
  | 'calling'
  | 'ringing'
  | 'accepted'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'declined'
  | 'busy'
  | 'missed'
  | 'ended'
  | 'failed';

export interface CallSession {
  id: string; // call document ID
  callId?: string;
  caller: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    role?: string;
  };
  receiver: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    role?: string;
  };
  callerId?: string;
  receiverId?: string;
  callerName?: string;
  callerAvatar?: string;
  receiverName?: string;
  receiverAvatar?: string;
  type: 'audio' | 'video';
  status: CallStatus;
  started_at?: number;
  createdAt?: string;
  acceptedAt?: string | null;
  endedAt?: string | null;
  endedReason?: 'declined' | 'hangup' | 'timeout' | 'busy' | 'failed' | 'cancelled' | string | null;
  duration?: number;
  offer?: { type: string; sdp: string } | null;
  answer?: { type: string; sdp: string } | null;
}

export interface CallHistoryItem {
  id: string;
  callId?: string;
  callerId?: string;
  callerName?: string;
  callerAvatar?: string;
  receiverId?: string;
  receiverName?: string;
  receiverAvatar?: string;
  partner_id: string;
  partner_name: string;
  partner_avatar?: string;
  partner_phone?: string;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing';
  status: 'answered' | 'completed' | 'missed' | 'declined' | 'failed';
  timestamp: string;
  duration?: number; // in seconds
  participants?: string[];
}

export interface ContentReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reported_user_id?: string;
  reported_user_name?: string;
  message_id?: string;
  message_text?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface Friendship {
  id: string;
  userA: string;
  userB: string;
  participants: string[];
  createdAt: string;
  // Denormalized friend profiles for speedy display
  friendId?: string;
  friendName?: string;
  friendAvatar?: string;
  friendRole?: string;
  friendDistrict?: string;
}


