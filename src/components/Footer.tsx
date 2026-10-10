import React from 'react';
import {
  Facebook,
  MessageCircle,
  Mail,
  Heart,
  ExternalLink,
  Shield,
  Sparkles,
  Phone
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#060e1b]/90 backdrop-blur-xl border-t border-white/10 text-white/70 pt-10 pb-28 sm:pb-12 px-4 mt-12">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Brand & Purpose Card */}
        <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#1a2a4a] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#D4AF37] font-bangla text-base sm:text-lg">আমল ট্র্যাকার - ইসলামিক অ্যাপ</h3>
                <p className="text-xs text-white/60 font-bangla">প্রতিদিনের ইবাদত ও আত্মশুদ্ধির বিশ্বস্ত ডিজিটাল সঙ্গী</p>
              </div>
            </div>

            {/* Dreams Explanation Promo */}
            <a
              href="https://www.facebook.com/share/19QPbrJQ49/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37] hover:text-[#0a1628] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold font-bangla transition-all active:scale-95 shadow-sm"
            >
              <span>স্বপ্নের ব্যাখ্যা জানতে ভিজিট করুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Contact Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Facebook Profile */}
          <a
            href="https://www.facebook.com/share/1bJkcR3Djt/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Facebook className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors">ফেসবুক প্রোফাইল</p>
              <p className="text-[11px] text-white/50 truncate">yahya mahmud</p>
            </div>
          </a>

          {/* Facebook Page */}
          <a
            href="https://www.facebook.com/share/19QPbrJQ49/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Facebook className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors">অফিসিয়াল পেইজ</p>
              <p className="text-[11px] text-white/50 truncate">ইসলামিক আলোচনা ও সেবা</p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/8801860977699"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">হোয়াটসঅ্যাপ</p>
              <p className="text-[11px] text-white/50">01860977699</p>
            </div>
          </a>

          {/* Email */}
          <a
            href="mailto:yahyamahmud035@gmail.com"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors">ইমেইল যোগাযোগ</p>
              <p className="text-[11px] text-white/50 truncate">yahyamahmud035</p>
            </div>
          </a>
        </div>

        {/* Credits & Copyright */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-xs text-white/60 font-bangla">
          <div className="flex items-center gap-1.5 text-[#D4AF37] font-medium">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>অ্যাপ তৈরি ও পরিচালনায়: <strong className="text-white">yahya mahmud siraji</strong></span>
          </div>

          <p className="text-[11px] text-white/40 flex items-center justify-center gap-1">
            <span>© {new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত</span>
            <span>•</span>
            <span>আল্লাহর সন্তুষ্টির উদ্দেশ্যে নির্মিত</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
