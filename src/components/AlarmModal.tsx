import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  CheckCircle2,
  Play,
  Square,
  Music,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SoundType, audioService } from '../utils/audioAlarm';
import { format12HourTime } from '../utils/scoring';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOUND_OPTIONS: { id: SoundType; name: string; desc: string; emoji: string }[] = [
  { id: 'adhan', name: 'আজানের সুর', desc: 'নামাজের জন্য পবিত্র আজানের মধুর সুর', emoji: '🕌' },
  { id: 'birds', name: 'পাখির ডাক', desc: 'সকালের মিষ্টি পাখির কলকাকলি', emoji: '🐦' },
  { id: 'fountain', name: 'ঝরনার শব্দ', desc: 'শান্ত পাহাড়ি ঝরনার পানির শব্দ', emoji: '⛲' },
  { id: 'rain', name: 'বৃষ্টির সুর', desc: 'স্নিগ্ধ বৃষ্টির শান্তিময় পরিবেশ', emoji: '🌧️' },
  { id: 'river', name: 'নদীর কলতান', desc: 'প্রবাহিত নদীর শান্ত পানির ধ্বনি', emoji: '🌊' },
  { id: 'ocean', name: 'সাগরের ঢেউ', desc: 'সাগরের মৃদু ও গম্ভীর ঢেউ', emoji: '🏖️' },
  { id: 'rooster', name: 'মোরগের ডাক', desc: 'তাহাজ্জুদ ও ফজরে ঘুম ভাঙ্গার জন্য', emoji: '🐓' },
  { id: 'chime', name: 'ইসলামিক বেল', desc: 'যেকোনো আমলের মিষ্টি বেল', emoji: '🔔' },
];

export const AlarmModal: React.FC<AlarmModalProps> = ({ isOpen, onClose }) => {
  const {
    alarms,
    toggleAlarm,
    addAlarm,
    deleteAlarm,
    enableNotifications,
    showToast
  } = useApp();

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('05:00');
  const [newType, setNewType] = useState<'prayer' | 'masnun' | 'custom'>('custom');
  const [newSound, setNewSound] = useState<SoundType>('adhan');
  const [showAddForm, setShowAddForm] = useState(false);
  const [playingSound, setPlayingSound] = useState<SoundType | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    audioService.stopAll();
    setPlayingSound(null);
    onClose();
  };

  const handlePlaySound = (soundId: SoundType) => {
    if (playingSound === soundId) {
      audioService.stopAll();
      setPlayingSound(null);
      showToast('অডিও বন্ধ করা হয়েছে');
    } else {
      audioService.playSound(soundId);
      setPlayingSound(soundId);
      const matched = SOUND_OPTIONS.find((s) => s.id === soundId);
      showToast(`🔊 ${matched?.name || soundId} বাজানো হচ্ছে...`);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTime) return;
    addAlarm(newTitle.trim(), newTime, newType, ['প্রতিদিন'], newSound);
    setNewTitle('');
    setShowAddForm(false);
    showToast('নতুন এলার্ম সফলভাবে সংরক্ষিত হয়েছে');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-[#071326] border border-[#D4AF37]/50 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-bangla text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Back/Close button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 text-[#D4AF37]">
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#D4AF37] transition-colors flex items-center gap-1 text-xs"
              title="ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Bell className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-base sm:text-lg font-bold">নামাজ ও আমলের এলার্ম</h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-rose-500/20 transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ringtone test bar */}
        <div className="bg-[#0f213d] border border-[#D4AF37]/30 rounded-2xl p-3.5 space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-xs font-bold text-[#D4AF37]">
            <span className="flex items-center gap-1.5">
              <Music className="w-4 h-4 text-[#D4AF37]" />
              <span>রিংটোন অডিও টেস্ট (ক্লিক করে শুনুন)</span>
            </span>
            {playingSound && (
              <button
                type="button"
                onClick={() => {
                  audioService.stopAll();
                  setPlayingSound(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold animate-pulse hover:bg-rose-700 transition-colors"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>সাউন্ড থামান</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SOUND_OPTIONS.map((snd) => {
              const isPlaying = playingSound === snd.id;
              return (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => handlePlaySound(snd.id)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-left transition-all group ${
                    isPlaying
                      ? 'bg-[#D4AF37] text-[#0a1628] border-[#D4AF37] font-bold shadow-lg scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white hover:border-[#D4AF37]/50'
                  }`}
                  title={`${snd.name} বাজিয়ে শুনুন`}
                >
                  <div className="min-w-0 pr-1">
                    <p className={`text-xs font-bold truncate ${isPlaying ? 'text-[#0a1628]' : 'text-white'}`}>
                      {snd.emoji} {snd.name}
                    </p>
                    <p className={`text-[9px] truncate ${isPlaying ? 'text-[#0a1628]/80' : 'text-[#D4AF37]/80'}`}>
                      {isPlaying ? 'বাজছে...' : snd.desc}
                    </p>
                  </div>
                  {isPlaying ? (
                    <Volume2 className="w-4 h-4 text-[#0a1628] animate-bounce shrink-0" />
                  ) : (
                    <Play className="w-3 h-3 text-[#D4AF37] opacity-80 group-hover:opacity-100 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Browser Notification Permission trigger */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
            <span className="text-white/70">মোবাইল/পিসি স্ক্রিনে নোটিফিকেশন পেতে:</span>
            <button
              type="button"
              onClick={enableNotifications}
              className="text-emerald-400 font-bold hover:underline flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>অনুমতি চালু করুন</span>
            </button>
          </div>
        </div>

        {/* Alarms List Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span>সেট করা এলার্ম সমূহ ({alarms.length}টি)</span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-[#D4AF37] hover:brightness-125 flex items-center gap-1 font-bold bg-[#D4AF37]/15 px-3 py-1.5 rounded-full border border-[#D4AF37]/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'ফর্ম বন্ধ' : 'নতুন এলার্ম'}</span>
            </button>
          </div>

          {/* Add Alarm Form */}
          {showAddForm && (
            <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-[#0e1d35] border border-[#D4AF37]/50 space-y-3">
              <h4 className="text-xs font-bold text-[#D4AF37]">নতুন এলার্ম ও সুর নির্বাচন করুন</h4>
              
              <div>
                <label className="block text-[11px] text-white/80 mb-1">এলার্মের নাম বা আমলের বিবরণ</label>
                <input
                  type="text"
                  placeholder="যেমন: তাহাজ্জুদ, ফজর বা আসরের আমল"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-white/80 mb-1">সময় নির্ধারণ</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                  <span className="text-[11px] text-[#D4AF37] font-semibold block mt-1">
                    রূপান্তর: {format12HourTime(newTime)}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] text-white/80 mb-1">ক্যাটাগরি</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-2 py-2 text-xs bg-black/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="prayer">নামাজ</option>
                    <option value="masnun">মাসনুন আমল</option>
                    <option value="custom">কাস্টম আমল</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-white/80 mb-1">রিংটোন সাউন্ড সিলেক্ট করুন</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SOUND_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setNewSound(s.id);
                        audioService.playSound(s.id);
                      }}
                      className={`p-2 rounded-xl text-left border text-xs transition-all flex flex-col justify-between ${
                        newSound === s.id
                          ? 'bg-[#D4AF37]/25 border-[#D4AF37] text-[#D4AF37] font-bold'
                          : 'bg-black/30 border-white/10 text-white/70 hover:border-white/30'
                      }`}
                    >
                      <span>{s.emoji} {s.name}</span>
                      <span className="text-[9px] opacity-70 truncate">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white/10 text-white/70 hover:bg-white/20"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#D4AF37] text-[#0a1628] hover:brightness-110 shadow-md"
                >
                  এলার্ম সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          {/* Alarms Item List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {alarms.length === 0 ? (
              <div className="text-center py-6 text-white/50 text-xs">
                কোনো এলার্ম সেট করা নেই। উপরের 'নতুন এলার্ম' বাটনে ক্লিক করুন।
              </div>
            ) : (
              alarms.map((alarm) => {
                const matchedSound = SOUND_OPTIONS.find((s) => s.id === alarm.sound) || SOUND_OPTIONS[0];
                return (
                  <div
                    key={alarm.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      alarm.active
                        ? 'bg-[#0f213d] border-[#D4AF37]/35 shadow-md'
                        : 'bg-white/5 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleAlarm(alarm.id)}
                        className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                          alarm.active ? 'bg-[#D4AF37]' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-[#071326] transition-transform ${
                            alarm.active ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-[#D4AF37] font-mono">
                            {format12HourTime(alarm.time)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                            {matchedSound.emoji} {matchedSound.name}
                          </span>
                        </div>
                        <p className="text-xs text-white/90 font-medium">{alarm.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePlaySound(alarm.sound || 'adhan')}
                        className="p-2 rounded-xl bg-white/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] transition-colors"
                        title="বাজিয়ে শুনুন"
                      >
                        {playingSound === alarm.sound ? (
                          <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteAlarm(alarm.id);
                          showToast('এলার্ম মুছে ফেলা হয়েছে');
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom prominent Close & Return button */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-2xl bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <X className="w-4 h-4" />
            <span>বন্ধ করুন ও ড্যাশবোর্ডে ফিরে যান</span>
          </button>
        </div>

      </div>
    </div>
  );
};
