import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  KeyRound,
  CheckCircle,
  ShieldCheck,
  Facebook,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp, ADMIN_EMAIL, ADMIN_CORRECT_NAME } from '../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup' | 'admin';
}

type TabType = 'login' | 'signup' | 'admin' | 'otp' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const {
    loginUser,
    loginAdmin,
    loginWithFacebook,
    registerUser,
    verifyOtp,
    requestPasswordReset,
    resetPasswordWithOtp,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Birth date inputs
  const [birthDay, setBirthDay] = useState<number>(1);
  const [birthMonth, setBirthMonth] = useState<number>(1);
  const [birthYear, setBirthYear] = useState<number>(2000);
  const [calculatedAge, setCalculatedAge] = useState<number>(25);

  // Admin login states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // OTP & Reset States
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const handleBirthYearChange = (year: number) => {
    setBirthYear(year);
    const age = new Date().getFullYear() - year;
    setCalculatedAge(Math.max(1, age));
  };

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginUser(email || phone, password);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginAdmin(adminEmail, adminPassword);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleFacebookLogin = () => {
    // Facebook login simulation with profile picture
    loginWithFacebook({
      name: 'মুহাম্মাদ আব্দুল্লাহ',
      email: 'abdullah.facebook@gmail.com',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    });
    onClose();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = registerUser(
      name,
      email,
      phone,
      calculatedAge,
      password,
      birthDay,
      birthMonth,
      birthYear
    );
    if (res.success) {
      setInfoMsg(res.message);
      setActiveTab('otp');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = verifyOtp(otpCode);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleForgotRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = requestPasswordReset(phone);
    if (res.success) {
      setInfoMsg(res.message);
      setActiveTab('otp');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = resetPasswordWithOtp(phone, otpCode, password);
    if (res.success) {
      setActiveTab('login');
      setInfoMsg('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। এখন লগইন করুন।');
    } else {
      setErrorMsg(res.message);
    }
  };

  const months = [
    { num: 1, name: 'জানুয়ারি' },
    { num: 2, name: 'ফেব্রুয়ারি' },
    { num: 3, name: 'মার্চ' },
    { num: 4, name: 'এপ্রিল' },
    { num: 5, name: 'মে' },
    { num: 6, name: 'জুন' },
    { num: 7, name: 'জুলাই' },
    { num: 8, name: 'আগস্ট' },
    { num: 9, name: 'সেপ্টেম্বর' },
    { num: 10, name: 'অক্টোবর' },
    { num: 11, name: 'নভেম্বর' },
    { num: 12, name: 'ডিসেম্বর' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#060e1b] border border-[#D4AF37]/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto font-bangla text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1a2a4a] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center shadow-sm">
              {activeTab === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#D4AF37]">
                {activeTab === 'login' && 'ইউজার লগইন'}
                {activeTab === 'signup' && 'নতুন একাউন্ট রেজিস্টার'}
                {activeTab === 'admin' && 'এডমিন লগইন পোর্টাল'}
                {activeTab === 'otp' && 'OTP কোড ভেরিফিকেশন'}
                {activeTab === 'forgot' && 'পাসওয়ার্ড রিসেট'}
              </h2>
              <p className="text-[11px] text-white/50">
                {activeTab === 'admin' ? 'শুধুমাত্র অনুমোদিত প্রধান পরিচালকের জন্য' : 'আপনার আমল ও কাজা হিসাব সুরক্ষিত রাখতে লগইন করুন'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: 3 Separate Clean Options */}
        {activeTab !== 'otp' && activeTab !== 'forgot' && (
          <div className="grid grid-cols-3 p-1 bg-black/40 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`py-2 rounded-xl font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              ইউজার লগইন
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`py-2 rounded-xl font-bold transition-all ${
                activeTab === 'signup'
                  ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              সাইন আপ
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-[#D4AF37] text-[#0a1628] shadow-md'
                  : 'text-amber-300/70 hover:text-amber-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>এডমিন</span>
            </button>
          </div>
        )}

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-300">
            {infoMsg}
          </div>
        )}

        {/* 1. USER LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleUserLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">ইমেইল অথবা ফোন নম্বর</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="যেমন: 018XXXXXXXX অথবা example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 focus:border-[#D4AF37] rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 focus:border-[#D4AF37] rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('forgot')}
                className="text-[#D4AF37] hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg active:scale-95"
            >
              লগইন করুন
            </button>

            {/* Facebook Quick Login */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleFacebookLogin}
                className="w-full py-2.5 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/40 rounded-2xl text-xs font-bold text-[#1877F2] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <Facebook className="w-4 h-4" />
                <span>ফেসবুক দিয়ে দ্রুত লগইন ও ছবি সিঙ্ক</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. ADMIN LOGIN FORM (Separate & Protected) */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-3.5 bg-white/5 p-4 rounded-2xl border border-[#D4AF37]/30">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>প্রধান পরিচালক লগইন গেটওয়ে</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">এডমিন ইমেইল আইডি</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/50 border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-2xl text-xs text-[#D4AF37] font-mono focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">এডমিন সিকিউরিটি পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="এডমিন পাসওয়ার্ড দিন"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-2xl text-xs text-white font-mono focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>এডমিন প্যানেলে প্রবেশ করুন</span>
            </button>
          </form>
        )}

        {/* 3. SIGNUP FORM WITH BIRTH DATE (Day, Month, Year) */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">আপনার পূর্ণ নাম</label>
              <input
                type="text"
                placeholder="যেমন: আহমাদুল্লাহ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 focus:border-[#D4AF37] rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">ফোন নম্বর</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#D4AF37] rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">ইমেইল</label>
                <input
                  type="email"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-[#D4AF37] rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Birth Date Section */}
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
              <label className="block text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>জন্ম তারিখ, মাস ও সাল (বাকি আয়ু গণনার জন্য)</span>
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                {/* Day */}
                <div>
                  <label className="block text-[10px] text-white/60 mb-0.5">দিন</label>
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(Number(e.target.value))}
                    className="w-full py-1.5 px-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label className="block text-[10px] text-white/60 mb-0.5">মাস</label>
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(Number(e.target.value))}
                    className="w-full py-1.5 px-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {months.map((m) => (
                      <option key={m.num} value={m.num}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[10px] text-white/60 mb-0.5">সাল</label>
                  <select
                    value={birthYear}
                    onChange={(e) => handleBirthYearChange(Number(e.target.value))}
                    className="w-full py-1.5 px-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {Array.from({ length: 90 }, (_, i) => 2026 - i).map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <span className="text-[11px] text-emerald-400 block pt-0.5 font-medium">
                গণনাকৃত বর্তমান বয়স: {calculatedAge} বছর
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">পাসওয়ার্ড (কমপক্ষে ৬ ডিজিট)</label>
              <input
                type="password"
                placeholder="নতুন পাসওয়ার্ড লিখুন"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-black/40 border border-white/15 focus:border-[#D4AF37] rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg active:scale-95"
            >
              একাউন্ট তৈরি করুন
            </button>
          </form>
        )}

        {/* 4. OTP FORM */}
        {activeTab === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <div className="text-center py-2">
              <p className="text-xs text-white/70">আপনার ফোন/ইমেইলে পাঠানো ৬ ডিজিটের ওটিপি লিখুন</p>
              <span className="text-xs text-amber-300 font-mono font-bold block mt-1">(টেস্ট কোড: 123456)</span>
            </div>

            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full py-3 text-center text-xl font-mono font-bold tracking-widest bg-black/50 border border-[#D4AF37]/50 rounded-2xl text-[#D4AF37] focus:outline-none"
              required
            />

            <button
              type="submit"
              className="w-full py-3 bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg active:scale-95"
            >
              ওটিপি যাচাই ও সম্পন্ন করুন
            </button>
          </form>
        )}

        {/* 5. FORGOT PASSWORD */}
        {activeTab === 'forgot' && (
          <form onSubmit={handleForgotRequest} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">রেজিস্টার্ড ফোন নম্বর</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 focus:border-[#D4AF37] rounded-2xl text-xs text-white focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg active:scale-95"
            >
              ভেরিফিকেশন কোড পাঠান
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
