import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Award,
  Calendar,
  Activity,
  Search,
  Eye,
  Trash2,
  Mail,
  Phone,
  Sparkles,
  ArrowLeft,
  X,
  ExternalLink,
  BookOpen,
  MapPin,
  GraduationCap,
  HeartHandshake,
  CheckCircle2,
  Megaphone,
  Gift,
  Send,
  Trophy,
  Video,
  MessageSquare,
  Key,
  AlertTriangle,
  Ban,
  UserCheck,
  UserX,
  Clock,
  ShieldAlert,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed
} from 'lucide-react';
import { useApp, ADMIN_CORRECT_NAME, ADMIN_EMAIL, ADMIN_PASS } from '../context/AppContext';
import { formatBanglaNumber, formatDateToBangla, getLevelInfo } from '../utils/scoring';
import { User, AdminAnnouncement, CommunityMessage, ContentReport } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

export const AdminPage: React.FC = () => {
  const {
    allUsers,
    user,
    isAdmin,
    deleteUserByAdmin,
    suspendUserByAdmin,
    banUserByAdmin,
    reports,
    resolveReport,
    callHistory,
    clearCallHistory,
    publicCommunityCounter,
    actualRegisteredUsers,
    actualActiveUsers,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'calls' | 'broadcast'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isBioCollapsed, setIsBioCollapsed] = useState<boolean>(false);

  // Announcement Creator State
  const [annTitle, setAnnTitle] = useState('🏆 মাসিক সেরা আমলকারী প্রতিযোগিতা ও বিশেষ পুরস্কার ঘোষণা!');
  const [annContent, setAnnContent] = useState('চলতি মাসে যারা ধারাবাহিকভাবে ৫ ওয়াক্ত নামাজ জামাতে আদায় করবেন এবং সর্বোচ্চ আমল স্কোর অর্জন করবেন, তাদের মধ্য থেকে শীর্ষ ৩ জনকে পরিচালকের পক্ষ থেকে নগদ অর্থ পুরস্কার ও দুর্লভ ইসলামিক কিতাব উপহার দেওয়া হবে।');
  const [annPrizes, setAnnPrizes] = useState('১ম পুরস্কার: নগদ ৫,০০০ টাকা ও তাফসীরুল কুরআন • ২য় পুরস্কার: ৩,০০০ টাকা • ৩য় পুরস্কার: ২,০০০ টাকা');
  const [annDeadline, setAnnDeadline] = useState('৩০ সেপ্টেম্বর, ২০২৬');
  const [isPublishingNotice, setIsPublishingNotice] = useState(false);

  // Broadcast Message to All Users
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center font-bangla space-y-4 text-white">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-rose-300">অননুমোদিত প্রবেশাধিকার</h2>
        <p className="text-xs text-white/70">
          এই এডমিন প্যানেলে শুধুমাত্র প্রধান পরিচালক ও প্রতিষ্ঠাতা <strong>{ADMIN_CORRECT_NAME}</strong> প্রবেশ করতে পারবেন।
        </p>
      </div>
    );
  }

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  // Save Announcement to localStorage and Firestore
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const annId = `ann-${Date.now()}`;
    const newAnn: AdminAnnouncement = {
      id: annId,
      title: annTitle,
      content: annContent,
      prize_details: annPrizes,
      deadline: annDeadline,
      created_at: new Date().toISOString(),
      is_active: true,
      author_name: ADMIN_CORRECT_NAME
    };
    try {
      localStorage.setItem('amal_admin_announcement_v1', JSON.stringify(newAnn));
      // Sync to Firestore announcements collection
      setDoc(doc(db, 'announcements', annId), newAnn).catch(() => {});

      showToast('🎉 পুরস্কার ও বিশেষ নোটিশ সফলভাবে সকল ইউজারের জন্য জারি করা হয়েছে!');
      setIsPublishingNotice(false);
    } catch {}
  };

  // Broadcast message to Majlis, Inboxes and Firestore
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    try {
      // 1. Add to public majlis
      const savedMajlis = localStorage.getItem('amal_community_messages_v2');
      const majlisList: CommunityMessage[] = savedMajlis ? JSON.parse(savedMajlis) : [];
      const msgId = `broadcast-${Date.now()}`;
      const newMsg: CommunityMessage = {
        id: msgId,
        sender_id: 'admin-yahya-01',
        sender_name: ADMIN_CORRECT_NAME,
        sender_role: 'admin',
        text: `📢 পরিচালকের বিশেষ বার্তা: ${broadcastText.trim()}`,
        timestamp: 'আজ এইমাত্র',
        type: 'announcement',
        level: 'পরিচালক'
      };
      majlisList.push(newMsg);
      localStorage.setItem('amal_community_messages_v2', JSON.stringify(majlisList));

      // Sync to Firestore communityMessages collection
      setDoc(doc(db, 'communityMessages', msgId), {
        ...newMsg,
        createdAt: new Date().toISOString()
      }).catch(() => {});

      // 2. Add to private inboxes
      const savedChats = localStorage.getItem('amal_messenger_private_chats_v2');
      const chatsMap: { [id: string]: CommunityMessage[] } = savedChats ? JSON.parse(savedChats) : {};
      allUsers.forEach((u) => {
        if (!chatsMap[u.id]) chatsMap[u.id] = [];
        chatsMap[u.id].push({
          id: `broadcast-pm-${Date.now()}-${u.id}`,
          sender_id: 'admin-yahya-01',
          sender_name: ADMIN_CORRECT_NAME,
          sender_role: 'admin',
          receiver_id: u.id,
          text: `📢 পরিচালকের সার্বজনীন বার্তা: ${broadcastText.trim()}`,
          timestamp: 'আজ এইমাত্র',
          type: 'text',
          seen: false
        });
      });
      localStorage.setItem('amal_messenger_private_chats_v2', JSON.stringify(chatsMap));

      setBroadcastText('');
      setIsBroadcasting(false);
      showToast('📢 সার্বজনীন নোটিশ সফলভাবে সকল ইউজারের ইনবক্স ও মজলিসে পাঠানো হয়েছে!');
    } catch {
      showToast('বার্তা প্রেরণ ব্যর্থ হয়েছে');
    }
  };

  const audioCallsCount = callHistory.filter(c => c.type === 'audio').length;
  const videoCallsCount = callHistory.filter(c => c.type === 'video').length;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 font-bangla space-y-6 text-white animate-fadeIn pb-24">
      
      {/* Top Founder & Admin Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0a1628] via-[#06101e] to-[#040810] border border-[#D4AF37]/40 p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F59E0B] p-0.5 shadow-xl shadow-[#D4AF37]/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center text-[#D4AF37]">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#D4AF37]">{ADMIN_CORRECT_NAME}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#0a1628] text-[10px] font-bold">
                  প্রধান পরিচালক ও প্রতিষ্ঠাতা
                </span>
              </div>
              <p className="text-xs text-white/70">
                মুফতি ও গবেষক • ইমেইল: <span className="font-mono text-[#D4AF37]">{ADMIN_EMAIL}</span> • মোবাইল: <span className="font-mono text-[#D4AF37]">01860977699</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsPublishingNotice(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-[#D4AF37] text-[#0a1628] rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>পুরস্কার ঘোষণা করুন</span>
            </button>

            <button
              onClick={() => setIsBroadcasting(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Megaphone className="w-4 h-4" />
              <span>সকলকে বার্তা পাঠান</span>
            </button>
            
            <button
              onClick={() => setIsBioCollapsed(!isBioCollapsed)}
              className="px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-xs text-white/80 font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title={isBioCollapsed ? 'বায়ো ও পরিসংখ্যান খুলুন' : 'বায়ো ও পরিসংখ্যান লুকান'}
            >
              <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{isBioCollapsed ? 'বায়ো দেখান' : 'প্যানেল লুকান'}</span>
            </button>
          </div>
        </div>

        {/* Bio Details Grid & Stats (Toggled) */}
        {!isBioCollapsed && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                <div className="text-white/60 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-semibold">শিক্ষাগত যোগ্যতা</span>
                </div>
                <p className="text-white/90 font-medium">বসুন্ধরা ইসলামী রিসার্চ সেন্টার</p>
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                <div className="text-white/60 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">জন্ম ও বাসস্থান</span>
                </div>
                <p className="text-white/90 font-medium">জন্ম: কক্সবাজার • বর্তমান: সিরাজগঞ্জ</p>
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                <div className="text-white/60 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">মাদ্রাসায় খেদমত</span>
                </div>
                <p className="text-white/90 font-medium">চারাবাগ, আশুলিয়া, সাভার, ঢাকা (দাওরায়ে হাদীস)</p>
              </div>
            </div>

            {/* Global Statistics Grid with Strict Distinction between Real Count & Public Community Counter */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
              {/* 1. Real Database Accounts (Admin only) */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                <span className="text-white/60 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>প্রকৃত নিবন্ধিত একাউন্ট</span>
                </span>
                <p className="text-lg sm:text-2xl font-bold text-[#D4AF37] font-mono">
                  {formatBanglaNumber(actualRegisteredUsers)} জন
                </p>
                <span className="text-[10px] text-emerald-400 block font-bangla">ডাটাবেজে আসল একাউন্ট সংখ্যা</span>
              </div>

              {/* 2. Real Active Accounts Today */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                <span className="text-white/60 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>সক্রিয় একাউন্ট</span>
                </span>
                <p className="text-lg sm:text-2xl font-bold text-emerald-300 font-mono">
                  {formatBanglaNumber(actualActiveUsers)} জন
                </p>
                <span className="text-[10px] text-white/50 block font-bangla">ব্যানমুক্ত কার্যকর প্রোফাইল</span>
              </div>

              {/* 3. Public Community Counter Display (Base 95,570 + real user delta) */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-amber-500/30 space-y-1">
                <span className="text-amber-300/80 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>পাবলিক কাউন্টার ডিসপ্লে</span>
                </span>
                <p className="text-lg sm:text-2xl font-bold text-amber-300 font-mono">
                  {formatBanglaNumber(publicCommunityCounter)}+
                </p>
                <span className="text-[10px] text-amber-200/60 block font-bangla">সাধারণ ইউজারদের দৃশ্যমান সংখ্যা</span>
              </div>

              {/* 4. Pending Reports */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
                <span className="text-white/60 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>রিপোর্ট ও মডারেশন</span>
                </span>
                <p className="text-lg sm:text-2xl font-bold text-rose-300 font-mono">
                  {formatBanglaNumber(reports.filter(r => r.status === 'pending').length)} টি
                </p>
                <span className="text-[10px] text-rose-300/70 block font-bangla">পেন্ডিং পর্যালোচনা</span>
              </div>
            </div>

            {/* Clarification Disclaimer Banner */}
            <div className="p-3 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs text-[#D4AF37] flex items-start gap-2.5">
              <span className="text-sm shrink-0">ℹ️</span>
              <p className="text-white/80 leading-relaxed text-[11px] sm:text-xs">
                <strong>স্বচ্ছতার নীতিমালা:</strong> সাধারণ ব্যবহারকারীদের উৎসাহ ও অংশগ্রহণ বৃদ্ধির জন্য মূল ড্যাশবোর্ডে "কমিউনিটি কাউন্টার ({formatBanglaNumber(publicCommunityCounter)}+)" প্রদর্শিত হয়। আর ডাটাবেজের <strong>আসল নিবন্ধিত একাউন্ট ({formatBanglaNumber(actualRegisteredUsers)} জন)</strong> এবং সক্রিয় ব্যবহারকারীর সংখ্যা শুধুমাত্র প্রধান পরিচালকের সুরক্ষিত এডমিন ড্যাশবোর্ডে সংরক্ষিত থাকে।
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ADMIN WORKSPACE TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ইউজার তালিকা ও একাউন্ট নিয়ন্ত্রণ ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap relative ${
            activeTab === 'moderation'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>মডারেশন ও রিপোর্টস ({reports.filter(r => r.status === 'pending').length})</span>
          {reports.filter(r => r.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-2 right-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'calls'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>কল লগ ও পরিসংখ্যান ({callHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>সার্বজনীন নোটিশ ও ব্রডকাস্ট</span>
        </button>
      </div>

      {/* TAB 1: USERS TABLE & ACCOUNT MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                <span>নিবন্ধিত ইউজার ডাটাবেজ ({allUsers.length} জন আসল প্রোফাইল)</span>
              </h3>
              <p className="text-[11px] text-white/50">ইউজারদের আমল ট্র্যাক রেকর্ড দেখা, সাময়িক স্থগিত করা বা নিষিদ্ধ করার সম্পূর্ণ প্রশাসনিক ক্ষমতা</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/50 border-b border-white/10 text-white/60">
                  <th className="p-3.5 font-semibold">ইউজার তথ্য</th>
                  <th className="p-3.5 font-semibold">যোগাযোগ</th>
                  <th className="p-3.5 font-semibold">বয়স</th>
                  <th className="p-3.5 font-semibold">স্ট্যাটাস ও রোল</th>
                  <th className="p-3.5 font-semibold">কাজা অবস্থা</th>
                  <th className="p-3.5 font-semibold text-right">প্রশাসনিক অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => {
                  const isSuperAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 font-medium text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {u.photo ? (
                              <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              u.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-bold block truncate max-w-[140px] sm:max-w-none">{u.name}</span>
                            <span className="text-[10px] text-white/40 block font-mono">আইডি: {u.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-white/80 font-mono text-[11px]">
                        <div>{u.email}</div>
                        <div className="text-white/50">{u.phone}</div>
                      </td>

                      <td className="p-3.5 text-white/80 font-mono">
                        {formatBanglaNumber(u.age || 25)} বছর
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuperAdmin
                              ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {isSuperAdmin ? 'প্রধান এডমিন' : 'সক্রিয় মুমিন'}
                          </span>
                          {u.is_banned && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40">
                              স্থায়ী ব্যানড্
                            </span>
                          )}
                          {u.is_suspended && !u.is_banned && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                              সাময়িক স্থগিত
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-[11px] font-mono">
                          <span className="text-emerald-400">{formatBanglaNumber(u.qaza_adaied || 0)}</span>
                          <span className="text-white/40"> / </span>
                          <span className="text-[#D4AF37]">{formatBanglaNumber(u.total_qaza || 0)}</span>
                          <span className="text-[10px] text-white/50 block font-bangla">রাকাত আদায়</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-xl bg-white/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] transition-all"
                            title="ইউজার আমল প্রোফাইল দেখুন"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isSuperAdmin && (
                            <>
                              {/* Suspend / Unsuspend */}
                              <button
                                onClick={() => suspendUserByAdmin(u.id)}
                                className={`p-1.5 rounded-xl transition-all ${
                                  u.is_suspended
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                    : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                }`}
                                title={u.is_suspended ? 'স্থগিতাদেশ প্রত্যাহার করুন' : 'সাময়িক স্থগিত করুন'}
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>

                              {/* Ban / Unban */}
                              <button
                                onClick={() => banUserByAdmin(u.id)}
                                className={`p-1.5 rounded-xl transition-all ${
                                  u.is_banned
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                    : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                }`}
                                title={u.is_banned ? 'ব্যান প্রত্যাহার করুন' : 'স্থায়ী ব্যান করুন'}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (confirm(`আপনি কি নিশ্চিতভাবে ${u.name}-এর একাউন্ট ডাটাবেজ থেকে মুছে ফেলতে চান?`)) {
                                    deleteUserByAdmin(u.id);
                                  }
                                }}
                                className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white/60 hover:text-white transition-all"
                                title="ইউজার একাউন্ট ডাটাবেজ থেকে মুছুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MODERATION & USER REPORTS */}
      {activeTab === 'moderation' && (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                <span>কন্টেন্ট ও ইউজার রিপোর্টস তালিকা ({reports.length} টি রিপোর্ট)</span>
              </h3>
              <p className="text-[11px] text-white/50">মজলিস বার্তা বা সন্দেহভাজন ইউজারের বিরুদ্ধে সাধারণ ইউজারদের অভিযোগ পর্যালোচনা করুন</p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center text-white/50 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm">আলহামদুলিল্লাহ, বর্তমানে কোনো অমীমাংসিত অভিযোগ বা রিপোর্ট নেই।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    rep.status === 'pending'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-black/30 border-white/5 opacity-70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rep.status === 'pending'
                          ? 'bg-rose-500 text-white'
                          : rep.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {rep.status === 'pending' ? 'অমীমাংসিত' : rep.status === 'resolved' ? 'সমাধানকৃত' : 'খারিজ'}
                      </span>
                      <h4 className="text-sm font-bold text-white">অভিযোগের কারণ: {rep.reason}</h4>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">{rep.created_at}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-white/50">রিপোর্টার: </span>
                      <strong className="text-white">{rep.reporter_name}</strong>
                    </div>
                    {rep.reported_user_name && (
                      <div>
                        <span className="text-white/50">অভিযুক্ত ইউজার: </span>
                        <strong className="text-rose-300">{rep.reported_user_name}</strong>
                      </div>
                    )}
                  </div>

                  {rep.message_text && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white/80">
                      <span className="text-[10px] text-white/40 block mb-0.5">অভিযুক্ত বার্তা:</span>
                      "{rep.message_text}"
                    </div>
                  )}

                  {rep.details && (
                    <p className="text-xs text-white/70 italic">বিবরণ: {rep.details}</p>
                  )}

                  {rep.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => resolveReport(rep.id, 'dismiss')}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 rounded-xl text-xs font-semibold"
                      >
                        খারিজ করুন
                      </button>
                      <button
                        onClick={() => resolveReport(rep.id, 'resolve')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                      >
                        সমাধান হিসেবে চিহ্নিত করুন
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CALL LOGS & STATISTICS */}
      {activeTab === 'calls' && (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#D4AF37] flex items-center gap-2">
                <Video className="w-4 h-4 text-[#D4AF37]" />
                <span>WebRTC কল লগ ও যোগাযোগ হিস্টোরি</span>
              </h3>
              <p className="text-[11px] text-white/50">অ্যাপের ভেতর সম্পন্ন হওয়া দ্বীনি অডিও ও ভিডিও কলের পর্যবেক্ষণ লগ</p>
            </div>

            {callHistory.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('আপনি কি সমস্ত কল হিস্টোরি মুছে ফেলতে চান?')) {
                    clearCallHistory();
                  }
                }}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>কল হিস্টোরি সাফ করুন</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
              <span className="text-white/60">মোট রেকর্ডকৃত কল:</span>
              <p className="text-xl font-bold text-[#D4AF37] font-mono">{formatBanglaNumber(callHistory.length)} টি</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
              <span className="text-white/60">অডিও কল:</span>
              <p className="text-xl font-bold text-emerald-400 font-mono">{formatBanglaNumber(audioCallsCount)} টি</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
              <span className="text-white/60">ভিডিও কল:</span>
              <p className="text-xl font-bold text-cyan-400 font-mono">{formatBanglaNumber(videoCallsCount)} টি</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {callHistory.length === 0 ? (
              <p className="text-xs text-white/50 text-center py-6">এখনো কোনো কল হিস্টোরি সংরক্ষিত নেই।</p>
            ) : (
              callHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${item.type === 'video' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {item.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.partner_name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-white/50">
                        <span>{item.direction === 'incoming' ? 'ইনকামিং' : 'আউটগোয়িং'}</span>
                        <span>•</span>
                        <span>{item.timestamp}</span>
                        {item.duration !== undefined && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-emerald-400">{formatBanglaNumber(Math.floor(item.duration / 60))} মিনিট {formatBanglaNumber(item.duration % 60)} সেকেন্ড</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    item.status === 'answered'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {item.status === 'answered' ? 'সম্পন্ন' : item.status === 'missed' ? 'মিসড' : 'বাতিল'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST & NOTICE CREATOR */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Quick Notice Poster */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#D4AF37] flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <span>মাসিক পুরস্কার ও আমল প্রতিযোগিতা নোটিশ</span>
            </h3>
            <p className="text-xs text-white/60">
              সকল ব্যবহারকারীর ড্যাশবোর্ড ও নোটিশ বোর্ডে এই পুরস্কারের ঘোষণাটি পিন হয়ে থাকবে।
            </p>

            <form onSubmit={handleSaveAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="text-white/70 block mb-1">নোটিশের শিরোনাম:</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">বিস্তারিত বার্তা:</label>
                <textarea
                  rows={3}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full p-3.5 bg-black/50 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">পুরস্কারের তালিকা:</label>
                <input
                  type="text"
                  value={annPrizes}
                  onChange={(e) => setAnnPrizes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">প্রতিযোগিতার শেষ সময় / ডেডলাইন:</label>
                <input
                  type="text"
                  value={annDeadline}
                  onChange={(e) => setAnnDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#D4AF37] hover:brightness-110 text-[#0a1628] rounded-2xl font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all text-xs sm:text-sm"
              >
                <Trophy className="w-4 h-4" />
                <span>পুরস্কার নোটিশ জারি করুন</span>
              </button>
            </form>
          </div>

          {/* Quick Broadcast Sender */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              <span>সকল ইউজারের ইনবক্স ও মজলিসে সার্বজনীন বার্তা</span>
            </h3>
            <p className="text-xs text-white/60">
              এখানে বার্তা লিখলে তা এক ক্লিকে প্রতিটি ইউজারের ইনবক্স এবং পাবলিক মজলিস আলোচনায় সরাসরি পৌঁছে যাবে।
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="text-white/70 block mb-1">সার্বজনীন নসিহত বা ঘোষণা:</label>
                <textarea
                  rows={6}
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="যেমন: আসসালামু আলাইকুম। আজকের তাহাজ্জুদ ও ফজরের জামাতে সবাইকে শরিক হওয়ার আন্তরিক দাওয়াত রইলো..."
                  className="w-full p-3.5 bg-black/50 border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all text-xs sm:text-sm"
              >
                <Send className="w-4 h-4" />
                <span>সকলের কাছে সাথে সাথে প্রেরণ করুন</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#060e1b] border border-[#D4AF37]/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#D4AF37] text-[#0a1628] flex items-center justify-center font-bold text-lg overflow-hidden">
                  {selectedUser.photo ? (
                    <img src={selectedUser.photo} alt={selectedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.name.charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#D4AF37]">{selectedUser.name}</h4>
                  <p className="text-xs text-white/50">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-xl bg-white/10 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-white/50">ফোন নম্বর:</span>
                <p className="text-white font-mono font-bold">{selectedUser.phone}</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-white/50">বয়স / জন্ম সাল:</span>
                <p className="text-white font-mono font-bold">
                  {formatBanglaNumber(selectedUser.age || 25)} বছর {selectedUser.birth_year ? `(${formatBanglaNumber(selectedUser.birth_year)})` : ''}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-white/50">মোট কাজা টার্গেট:</span>
                <p className="text-[#D4AF37] font-mono font-bold">{formatBanglaNumber(selectedUser.total_qaza || 0)} রাকাত</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-white/50">কাজা সম্পন্ন:</span>
                <p className="text-emerald-400 font-mono font-bold">{formatBanglaNumber(selectedUser.qaza_adaied || 0)} রাকাত</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ইউজারের আমল ডেটা ও রেকর্ড নিয়মিত ডাটাবেজে সংরক্ষিত হচ্ছে।</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
