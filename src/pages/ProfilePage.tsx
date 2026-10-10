import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  LogOut,
  Download,
  Upload,
  Bell,
  Volume2,
  Lock,
  Save,
  CheckCircle2,
  Sparkles,
  Trophy,
  Award,
  Crown,
  Camera,
  Globe,
  Eye,
  Check,
  Edit3
} from 'lucide-react';
import { useApp, ADMIN_CORRECT_NAME, ADMIN_EMAIL } from '../context/AppContext';
import { getLevelInfo, formatBanglaNumber } from '../utils/scoring';
import { AuthModal } from '../components/AuthModal';

export const ProfilePage: React.FC = () => {
  const {
    user,
    dailyAmal,
    totalDonationTaka,
    updateUserProfile,
    logoutUser,
    deleteMyAccount,
    isAdmin,
    showToast
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [birthDate, setBirthDate] = useState(user?.birth_date || '1998-05-15');
  const [totalQazaInput, setTotalQazaInput] = useState<number>(user?.total_qaza || 150);
  const [qazaAdaiedInput, setQazaAdaiedInput] = useState<number>(user?.qaza_adaied || 0);
  const [baselineDonationInput, setBaselineDonationInput] = useState<number>(user?.total_donation_taka || 0);
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneVisibility, setPhoneVisibility] = useState<'public' | 'friends_only' | 'private'>(
    user?.phone_visibility || 'friends_only'
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'rewards' | 'settings'>('profile');

  const levelInfo = getLevelInfo(dailyAmal.total_score || 0);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateUserProfile({ photo: reader.result as string });
      showToast('প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate approximate age from birthDate
    let calculatedAge = 25;
    let birthYear = 1998;
    let birthMonth = 5;
    let birthDay = 15;

    if (birthDate) {
      const birth = new Date(birthDate);
      const now = new Date();
      birthYear = birth.getFullYear();
      birthMonth = birth.getMonth() + 1;
      birthDay = birth.getDate();

      let ageDiff = now.getFullYear() - birthYear;
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        ageDiff--;
      }
      calculatedAge = Math.max(1, ageDiff);
    }

    updateUserProfile({
      name,
      phone,
      email,
      phone_visibility: phoneVisibility,
      birth_date: birthDate,
      birth_day: birthDay,
      birth_month: birthMonth,
      birth_year: birthYear,
      age: calculatedAge,
      total_qaza: totalQazaInput,
      qaza_adaied: qazaAdaiedInput,
      total_donation_taka: baselineDonationInput
    });

    setIsEditing(false);
    showToast('প্রোফাইল, জন্ম তারিখ, কাজা ও দান তথ্য সংরক্ষিত হয়েছে');
  };

  // Backup & Restore
  const handleExportData = () => {
    const backupObj: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        backupObj[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_amal_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('সব আমল ডেটা ব্যাকআপ ফাইল হিসেবে ডাউনলোড হয়েছে');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        Object.keys(parsed).forEach((k) => {
          if (parsed[k] !== null) {
            localStorage.setItem(k, parsed[k]);
          }
        });
        showToast('ডেটা সফলভাবে রিস্টোর হয়েছে! পেজ রিফ্রেশ হচ্ছে...');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        showToast('ফাইল সঠিক নয়, রিস্টোর ব্যর্থ হয়েছে');
      }
    };
    reader.readAsText(file);
  };

  // Leaderboard
  const leaderboardUsers = [
    { rank: 1, name: ADMIN_CORRECT_NAME, score: 1450, level: 'মুত্তাক্বীন (المتقين)', badge: '🏆' },
    { rank: 2, name: 'হাফেজ আব্দুল ওয়াদুদ', score: 1320, level: 'মুহসিন (المحسن)', badge: '🥈' },
    { rank: 3, name: 'মুফতি তানভীর আহমেদ', score: 1280, level: 'মুহসিন (المحسن)', badge: '🥉' },
    { rank: 4, name: user?.name || 'আপনি', score: dailyAmal.total_score || 350, level: levelInfo.currentLevel.name, badge: '⭐' },
    { rank: 5, name: 'মাওলানা কামরুল হাসান', score: 940, level: 'মুমিন (المؤمن)', badge: '🎖️' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 font-bangla text-white">
      
      {/* Sub Tabs */}
      <div className="grid grid-cols-3 p-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-xl text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'profile'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>প্রোফাইল</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'rewards'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>র‍্যাঙ্কিং ও পুরষ্কার</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'settings'
              ? 'bg-[#D4AF37] text-[#0a1628] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>ব্যাকআপ ও সেটিংস</span>
        </button>
      </div>

      {/* TAB 1: Profile View */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {/* Main User Card */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Avatar with Camera upload */}
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F59E0B] p-0.5 shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center overflow-hidden">
                    {user?.photo ? (
                      <img src={user.photo} alt={user.name} className="w-full h-full object-cover rounded-[14px]" />
                    ) : (
                      <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center text-[#D4AF37]">
                        <UserIcon className="w-10 h-10" />
                      </div>
                    )}
                  </div>

                  <label className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-[#0a1628] p-1.5 rounded-full shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all" title="ছবি পরিবর্তন করুন">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>

                {/* Basic Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-[#D4AF37]">{user?.name || 'শ্রদ্ধেয় ইউজার'}</h2>
                    {isAdmin && (
                      <span className="px-2 py-0.5 rounded-lg bg-[#D4AF37] text-[#0a1628] text-[10px] font-bold">
                        অ্যাডমিন
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 font-mono">{user?.email || 'email@example.com'}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {levelInfo.currentLevel.name}
                    </span>
                    <span className="text-white/60">
                      বয়স: <strong className="text-[#D4AF37]">{formatBanglaNumber(user?.age || 25)} বছর</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Profile Toggle Button */}
              <button
                onClick={() => {
                  setName(user?.name || '');
                  setEmail(user?.email || '');
                  setPhone(user?.phone || '');
                  setBirthDate(user?.birth_date || '1998-05-15');
                  setIsEditing(!isEditing);
                }}
                className="px-4 py-2 bg-[#1a2a4a] hover:bg-[#D4AF37] hover:text-[#0a1628] text-[#D4AF37] border border-[#D4AF37]/40 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'সম্পাদনা বন্ধ' : 'প্রোফাইল এডিট'}</span>
              </button>
            </div>

            {/* Edit Profile Form */}
            {isEditing && (
              <form onSubmit={handleSaveProfile} className="border-t border-white/10 pt-4 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-white/70 mb-1">পূর্ণ নাম</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">জন্ম তারিখ (সঠিক বয়স ও আয়ু গণনার জন্য)</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">ইমেইল ঠিকানা</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#D4AF37] mb-1 font-semibold">বালেগ হওয়ার পর থেকে সারা জীবনের মোট কাজা (রাকাত)</label>
                    <input
                      type="number"
                      min="0"
                      value={totalQazaInput}
                      onChange={(e) => setTotalQazaInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-[#D4AF37]/30 rounded-2xl text-[#D4AF37] font-bold focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-400 mb-1 font-semibold">এখন পর্যন্ত আদায়কৃত কাজা (রাকাত)</label>
                    <input
                      type="number"
                      min="0"
                      value={qazaAdaiedInput}
                      onChange={(e) => setQazaAdaiedInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-emerald-500/30 rounded-2xl text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-teal-400 mb-1 font-semibold">পূর্বে দান-সদকা করা প্রারম্ভিক মোট টাকা (ঐচ্ছিক বেসলাইন)</label>
                    <input
                      type="number"
                      min="0"
                      value={baselineDonationInput}
                      onChange={(e) => setBaselineDonationInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-teal-500/30 rounded-2xl text-teal-300 font-bold focus:outline-none focus:border-teal-400"
                      placeholder="যেমন: ১০০০"
                    />
                  </div>

                  {/* Phone Privacy Visibility */}
                  <div className="sm:col-span-2 space-y-1.5 pt-1">
                    <label className="block text-white/80 font-semibold text-xs">
                      🔒 মোবাইল নম্বরের গোপনীয়তা (Privacy Setting):
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPhoneVisibility('public')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          phoneVisibility === 'public'
                            ? 'bg-[#D4AF37] text-[#0a1628] border-[#D4AF37] font-bold'
                            : 'bg-black/30 text-white/70 border-white/10'
                        }`}
                      >
                        <span className="block font-semibold">সবার জন্য উন্মুক্ত</span>
                        <span className="text-[9px] opacity-75">ডিরেক্টরিতে দেখা যাবে</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhoneVisibility('friends_only')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          phoneVisibility === 'friends_only'
                            ? 'bg-[#D4AF37] text-[#0a1628] border-[#D4AF37] font-bold'
                            : 'bg-black/30 text-white/70 border-white/10'
                        }`}
                      >
                        <span className="block font-semibold">বন্ধু ও সাথী</span>
                        <span className="text-[9px] opacity-75">ফ্রেন্ড রিকোয়েস্টে</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhoneVisibility('private')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          phoneVisibility === 'private'
                            ? 'bg-[#D4AF37] text-[#0a1628] border-[#D4AF37] font-bold'
                            : 'bg-black/30 text-white/70 border-white/10'
                        }`}
                      >
                        <span className="block font-semibold">সম্পূর্ণ গোপন</span>
                        <span className="text-[9px] opacity-75">কেউ দেখতে পাবে না</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs rounded-2xl bg-white/10 text-white/70"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-2xl bg-[#D4AF37] text-[#0a1628] hover:brightness-110 shadow-md"
                  >
                    তথ্য সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center border-t border-white/10 pt-4">
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                <span className="text-xs text-white/50">আজকের স্কোর</span>
                <p className="text-base sm:text-lg font-bold text-[#D4AF37] font-mono">
                  {formatBanglaNumber(dailyAmal.total_score || 0)} / ১০০
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                <span className="text-xs text-white/50">মোট জীবনের কাজা</span>
                <p className="text-base sm:text-lg font-bold text-amber-200 font-mono">
                  {formatBanglaNumber(user?.total_qaza || 0)} রাকাত
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                <span className="text-xs text-white/50">আদায় সম্পন্ন</span>
                <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                  {formatBanglaNumber(user?.qaza_adaied || 0)} রাকাত
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#1a2a4a] border border-[#D4AF37]/40 space-y-1 shadow-md">
                <span className="text-xs text-amber-300 font-bold">অবশিষ্ট বাকি কাজা</span>
                <p className="text-base sm:text-lg font-extrabold text-[#D4AF37] font-mono">
                  {formatBanglaNumber(Math.max(0, (user?.total_qaza || 0) - (user?.qaza_adaied || 0)))} রাকাত
                </p>
              </div>
            </div>

          </div>

          {/* Dedicated Donation / Sadaqah Summary Card */}
          <div className="rounded-3xl bg-gradient-to-br from-[#092218] via-[#0d2e22] to-[#081812] border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-400/30 inline-block mb-1">
                    দান ও সদকাহ ট্র্যাকার (স্বয়ংক্রিয় সঞ্চয়)
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">মোট দান ও সদকা ফান্ড</h3>
                  <p className="text-xs text-emerald-200/70">
                    দৈনিক আমল ছকে যে দান লিখবেন তা এখানে স্বয়ংক্রিয়ভাবে যুক্ত হয়ে মোট হিসাব প্রদর্শন করবে
                  </p>
                </div>
              </div>

              <div className="bg-black/40 border border-emerald-500/40 rounded-2xl px-6 py-3 text-center sm:text-right shadow-md">
                <span className="text-[11px] text-emerald-300/80 block font-medium">সর্বমোট সংগৃহীত দান:</span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-wide">
                  ৳ {formatBanglaNumber(totalDonationTaka || 0)}
                </p>
                <span className="text-[10px] text-emerald-400/70 block mt-0.5">
                  আজকের দান: ৳ {formatBanglaNumber(dailyAmal?.dan_taka || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Account Switch or Admin Access */}
          <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">একাউন্ট পরিবর্তন বা এডমিন এক্সেস</h3>
              <p className="text-xs text-white/50">অন্য একাউন্টে সুইচ করুন বা প্রধান পরিচালকের পোর্টালে লগইন করুন</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-[#1a2a4a] hover:bg-[#D4AF37] hover:text-[#0a1628] text-[#D4AF37] border border-[#D4AF37]/40 rounded-2xl text-xs font-bold transition-all shadow-sm"
              >
                লগইন / এডমিন প্যানেল
              </button>
              <button
                onClick={logoutUser}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-2xl text-xs font-bold transition-all"
              >
                লগআউট
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Rewards & Leaderboard */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#D4AF37] flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <span>মুত্তাক্বীন লিডারবোর্ড (শীর্ষ আমলকারীগণ)</span>
            </h3>

            <div className="space-y-2.5">
              {leaderboardUsers.map((lb) => (
                <div
                  key={lb.rank}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    lb.rank === 1
                      ? 'bg-gradient-to-r from-[#D4AF37]/20 to-black/40 border-[#D4AF37]/50 shadow-md'
                      : 'bg-black/30 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lb.badge}</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">{lb.name}</h4>
                      <p className="text-[10px] text-white/50">{lb.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-bold text-[#D4AF37] font-mono">
                      {formatBanglaNumber(lb.score)}
                    </span>
                    <span className="text-[10px] text-white/40 block">পয়েন্ট</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Settings & Backup */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#D4AF37] flex items-center gap-2">
              <Save className="w-5 h-5" />
              <span>ডেটা ব্যাকআপ ও নিরাপত্তা সংরক্ষণ</span>
            </h3>
            <p className="text-xs text-white/60">
              আপনার সমস্ত দৈনিক আমল, কাজা নামাজের হিসাব এবং কিতাব নোটস একটি নিরাপদ JSON ফাইলে ব্যাকআপ করে রাখতে পারেন।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportData}
                className="p-4 rounded-2xl bg-[#1a2a4a] hover:bg-[#253961] border border-[#D4AF37]/40 text-left space-y-1 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-xs">
                  <Download className="w-4 h-4" />
                  <span>আমল ডেটা ব্যাকআপ ডাউনলোড</span>
                </div>
                <p className="text-[10px] text-white/60">সব রেকর্ড লোকাল ফাইলে সেভ করুন</p>
              </button>

              <label className="p-4 rounded-2xl bg-black/30 hover:bg-black/40 border border-white/10 text-left space-y-1 cursor-pointer transition-all block">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>ব্যাকআপ ফাইল থেকে রিস্টোর</span>
                </div>
                <p className="text-[10px] text-white/60">পূর্বে সেভ করা JSON ফাইল লোড করুন</p>
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
          </div>

          {/* Account Deletion & GDPR Privacy Section */}
          <div className="rounded-3xl bg-rose-950/20 border border-rose-500/30 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-rose-300">একাউন্ট স্থায়ীভাবে মুছে ফেলা (Delete Account)</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              আপনি যদি আপনার একাউন্ট ডিলিট করতে চান, তবে আপনার প্রোফাইল তথ্য, ফোন নম্বর, সংরক্ষিত কাজা নামাজের হিসাব এবং সমস্ত ব্যক্তিগত আমল ডেটা স্থায়ীভাবে ডাটাবেজ ও আপনার ডিভাইস থেকে সম্পূর্ণ মুছে ফেলা হবে।
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (confirm('সতর্কতা: আপনি কি নিশ্চিতভাবে আপনার একাউন্ট ও সমস্ত সংরক্ষিত আমল ডাটা স্থায়ীভাবে ডিলিট করতে চান? এটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।')) {
                    deleteMyAccount();
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>আমার একাউন্ট স্থায়ীভাবে মুছে ফেলুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

    </div>
  );
};
