import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, Sparkles } from 'lucide-react';
import { audioService, SoundType } from '../utils/audioAlarm';

export const ActiveAlarmBanner: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [soundType, setSoundType] = useState<SoundType | null>(null);
  const [alarmTitle, setAlarmTitle] = useState<string>('আজান / অ্যালার্ম');

  useEffect(() => {
    const unsubscribe = audioService.subscribe((playing, type, title) => {
      setIsPlaying(playing);
      if (type) setSoundType(type);
      if (title) setAlarmTitle(title);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isPlaying) return null;

  const handleStop = () => {
    audioService.stopAll();
  };

  const getSoundLabel = () => {
    switch (soundType) {
      case 'adhan':
        return 'পবিত্র আজান চলছে...';
      case 'rooster':
        return 'মোরগের ডাক (তাহাজ্জুদ/ফজর অ্যালার্ম)';
      case 'birds':
        return 'পাখির মিষ্টি সুর';
      case 'fountain':
        return 'ঝরনার কলতান';
      case 'rain':
        return 'বৃষ্টির মিষ্টি সুর';
      case 'river':
        return 'নদীর শান্ত পানির স্রোত';
      case 'ocean':
        return 'সাগরের শান্ত ঢেউ';
      case 'chime':
        return 'ইসলামিক মিষ্টি বেল';
      default:
        return alarmTitle || 'অ্যালার্ম বাজছে';
    }
  };

  return (
    <div
      id="active-alarm-ringing-banner"
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900 via-amber-900 to-red-900 border-b-2 border-[#D4AF37] text-white px-4 py-3 shadow-[0_4px_30px_rgba(212,175,55,0.4)] animate-bounce font-bangla"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-[#D4AF37] flex items-center justify-center animate-spin">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h4 className="text-sm sm:text-base font-bold text-[#D4AF37]">
                🔔 {alarmTitle}
              </h4>
            </div>
            <p className="text-xs text-amber-200/90 font-medium">
              {getSoundLabel()}
            </p>
          </div>
        </div>

        <button
          id="btn-stop-active-alarm"
          onClick={handleStop}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold px-4 sm:px-6 py-2.5 rounded-2xl shadow-lg border-2 border-white/40 transition-all text-sm sm:text-base shrink-0"
        >
          <BellOff className="w-5 h-5 animate-pulse" />
          <span>🔕 অ্যালার্ম বন্ধ করুন</span>
        </button>
      </div>
    </div>
  );
};
