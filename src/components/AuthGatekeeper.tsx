import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  History,
  Clock,
  HeartHandshake
} from 'lucide-react';
import { useApp, ADMIN_EMAIL, ADMIN_CORRECT_NAME } from '../context/AppContext';
import { formatBanglaNumber } from '../utils/scoring';

export const AuthGatekeeper: React.FC = () => {
  const {
    loginUser,
    loginAdmin,
    registerUser,
    updateUserProfile,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'admin'>('login');
  
  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup Form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [birthDay, setBirthDay] = useState<number>(15);
  const [birthMonth, setBirthMonth] = useState<number>(5);
  const [birthYear, setBirthYear] = useState<number>(1998);
  const [totalQazaInput, setTotalQazaInput] = useState<number>(150);

  // Admin Form
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Error & Message
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('দয়া করে ইমেইল/ফোন এবং পাসওয়ার্ড প্রদান করুন');
      return;
    }
    const res = loginUser(loginIdentifier, loginPassword);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!signupName.trim()) {
      setErrorMsg('দয়া করে আপনার নাম লিখুন');
      return;
    }
    if (!signupPhone.trim() && !signupEmail.trim()) {
      setErrorMsg('দয়া করে ফোন নাম্বার বা ইমেইল লিখুন');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMsg('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');
      return;
    }

    const calculatedAge = Math.max(1, new Date().getFullYear() - birthYear);
    const birthDateStr = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

    const res = registerUser(
      signupName,
      signupEmail || `${signupPhone}@amaltracker.local`,
      signupPhone || '01700000000',
      calculatedAge,
      signupPassword,
      birthDay,
      birthMonth,
      birthYear
    );

    if (res.success) {
      // update qaza
      updateUserProfile({
        total_qaza: totalQazaInput,
        qaza_adaied: 0,
        birth_date: birthDateStr
      });
      showToast('রেজিস্ট্রেশন সফল হয়েছে! আমল ট্র্যাকার ড্যাশবোর্ডে স্বাগতম');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginAdmin(adminEmailInput, adminPasswordInput);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleQuickDemoLogin = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      loginAdmin(ADMIN_EMAIL, 'Yahya38@#');
    } else {
      // Quick Demo user with full profile
      const res = loginUser('user@demo.com', '123456');
      if (!res.success) {
        registerUser(
          'মুহাম্মাদ আব্দুল্লাহ',
          'user@demo.com',
          '01711223344',
          26,
          '123456',
          15,
          5,
          1998
        );
        loginUser('user@demo.com', '123456');
      }
    }
    showToast('সফলভাবে প্রবেশ করেছেন');
  };

  return (
    <div className="min-h-screen bg-[#071326] text-white flex flex-col items-center justify-center p-3 sm:p-6 font-bangla relative overflow-hidden">
      
      {/* Background Decorative Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <div className="w-full max-w-md text-center mb-6 space-y-2 z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#1a2a4a] border-2 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.3)] mb-2">
          <Sparkles className="w-8 h-8 text-[#D4AF37] animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] tracking-wide">
          দৈনন্দিন আমল ট্র্যাকার
        </h1>
        <p className="text-xs sm:text-sm text-white/70">
          প্রথমে আপনার প্রোফাইল তৈরি বা লগইন করুন। এরপরই সমস্ত নূরানী কোরআন, আমল হিসাব ও নোটিফিকেশন ফিচারসমূহ উন্মুক্ত হবে।
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 bg-black/40 border-b border-white/10 text-xs sm:text-sm font-semibold">
          <button
            id="tab-user-login"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`py-3.5 transition-all text-center ${
              activeTab === 'login'
                ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            ইউজার লগইন
          </button>
          
          <button
            id="tab-user-signup"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg('');
            }}
            className={`py-3.5 transition-all text-center ${
              activeTab === 'signup'
                ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            নতুন প্রোফাইল তৈরি
          </button>

          <button
            id="tab-admin-login"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
            }}
            className={`py-3.5 transition-all text-center ${
              activeTab === 'admin'
                ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            এডমিন প্যানেল
          </button>
        </div>

        {/* Error / Alert Messages */}
        {errorMsg && (
          <div className="m-4 p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center font-medium animate-shake">
            ⚠️ {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="m-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs text-center font-medium">
            ✅ {infoMsg}
          </div>
        )}

        {/* TAB 1: USER LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/80">
                ইমেইল বা মোবাইল নাম্বার
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-identifier"
                  type="text"
                  placeholder="যেমন: 01700000000 বা user@gmail.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/80">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
            >
              <span>লগইন করুন ও আমল শুরু করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Access */}
            <div className="pt-3 border-t border-white/10 text-center space-y-2">
              <span className="text-xs text-white/50 block">বা দ্রুত পরীক্ষামূলকভাবে দেখতে চান?</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-quick-demo-user"
                  type="button"
                  onClick={() => handleQuickDemoLogin('user')}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-amber-200 transition-all"
                >
                  ⚡ ডেমো ইউজার প্রবেশ
                </button>
                <button
                  id="btn-quick-demo-admin"
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="py-2 px-3 rounded-xl bg-[#1a2a4a] hover:bg-[#22365e] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] transition-all"
                >
                  👑 এডমিন ডেমো প্রবেশ
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: USER SIGNUP & PROFILE REGISTRATION */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="p-5 sm:p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white/80">
                আপনার পূর্ণ নাম <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-signup-name"
                  type="text"
                  placeholder="যেমন: মুহাম্মাদ আব্দুল্লাহ"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-white/80">
                  মোবাইল নাম্বার
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-phone"
                    type="tel"
                    placeholder="017xxxxxxxx"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-black/40 border border-white/10 rounded-2xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-white/80">
                  ইমেইল (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-signup-email"
                    type="email"
                    placeholder="user@gmail.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-black/40 border border-white/10 rounded-2xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Birth Date Section (Crucial for 60-Year Remaining Life Calculation) */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-black/30 border border-white/5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>জন্ম তারিখ (দিন, মাস, বছর)</span>
                </label>
                <span className="text-[11px] text-white/60">
                  বয়স: {formatBanglaNumber(Math.max(1, new Date().getFullYear() - birthYear))} বছর
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                উম্মতের গড় আয়ু ৬০ বছর থেকে আপনার বাকি নিঃশ্বাস ও দিন গণনা করতে এটি ব্যবহৃত হবে।
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <select
                  id="select-birth-day"
                  value={birthDay}
                  onChange={(e) => setBirthDay(Number(e.target.value))}
                  className="bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:border-[#D4AF37]"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {formatBanglaNumber(d)} তারিখ
                    </option>
                  ))}
                </select>

                <select
                  id="select-birth-month"
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(Number(e.target.value))}
                  className="bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:border-[#D4AF37]"
                >
                  {months.map((m) => (
                    <option key={m.num} value={m.num}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <select
                  id="select-birth-year"
                  value={birthYear}
                  onChange={(e) => setBirthYear(Number(e.target.value))}
                  className="bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:border-[#D4AF37]"
                >
                  {Array.from({ length: 90 }, (_, i) => new Date().getFullYear() - 5 - i).map((y) => (
                    <option key={y} value={y}>
                      {formatBanglaNumber(y)} সাল
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Qaza Estimation Section */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-black/30 border border-white/5">
              <label className="block text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>বালেগ হওয়ার পর থেকে সারা জীবনের মোট কাজা (রাকাত)</span>
              </label>
              <p className="text-[11px] text-white/50">
                পেছনের যত রাকাত নামাজ কাজা হয়েছে তা লিখুন। প্রতিদিন আমল থেকে যা আদায় করবেন তা নিজে থেকেই বিয়োগ হবে।
              </p>
              <input
                id="input-signup-total-qaza"
                type="number"
                min="0"
                value={totalQazaInput}
                onChange={(e) => setTotalQazaInput(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:border-[#D4AF37]"
                placeholder="মোট কাজা রাকাত (যেমন: 150)"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-white/80">
                পাসওয়ার্ড সেট করুন <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-signup-password"
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-signup-submit"
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 mt-1"
            >
              <span>প্রোফাইল তৈরি করে প্রবেশ করুন</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 3: ADMIN LOGIN */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#1a2a4a]/80 border border-[#D4AF37]/30 text-xs text-amber-100/90 leading-relaxed flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-[#D4AF37] shrink-0" />
              <div>
                <strong className="text-[#D4AF37] block font-bold">{ADMIN_CORRECT_NAME}</strong>
                <span>সম্মানিত পরিচালক ও এডমিন এক্সেস প্যানেল</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/80">
                এডমিন ইমেইল
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-admin-email"
                  type="email"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/80">
                এডমিন সিকিউর পাসওয়ার্ড
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-admin-password"
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-admin-submit"
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>এডমিন হিসেবে প্রবেশ করুন</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
