import React, { useState, useRef } from 'react';
import {
  PhoneCall,
  UserPlus,
  Search,
  Trash2,
  Phone,
  User,
  Copy,
  Check,
  Tag,
  Sparkles,
  HeartHandshake,
  Smartphone,
  Upload,
  FileText,
  MessageSquare,
  Share2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBanglaNumber } from '../utils/scoring';
import { PersonalContact } from '../types';
import { SmartPhonebookModal } from '../components/SmartPhonebookModal';

export const ContactsPage: React.FC = () => {
  const { contacts, addContact, importContactsBatch, deleteContact, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmartPhonebookModal, setShowSmartPhonebookModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<'আলেম' | 'পরিবার' | 'দ্বীনি ভাই' | 'উস্তাদ' | 'জরুরি' | 'অন্যান্য'>('আলেম');
  const [note, setNote] = useState('');

  const categories = ['সকল', 'আলেম', 'পরিবার', 'দ্বীনি ভাই', 'উস্তাদ', 'জরুরি', 'অন্যান্য'];

  const filteredContacts = contacts.filter((c) => {
    const cCat = c.category || c.relation || 'অন্যান্য';
    const matchCategory = selectedCategory === 'সকল' || cCat === selectedCategory;
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.note && c.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('নাম এবং ফোন নম্বর প্রদান করুন');
      return;
    }
    addContact({
      name: name.trim(),
      phone: phone.trim(),
      category,
      relation: category,
      note: note.trim()
    });
    setName('');
    setPhone('');
    setNote('');
    setShowAddModal(false);
  };

  // 1. Device Contact Picker (Native mobile navigator.contacts with Smart Selector fallback)
  const handlePickPhoneContacts = async () => {
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        // @ts-ignore
        const selected = await navigator.contacts.select(props, opts);
        if (selected && selected.length > 0) {
          const list: Partial<PersonalContact>[] = [];
          selected.forEach((item: any) => {
            const contactName = item.name?.[0] || 'মোবাইল যোগাযোগ';
            const tel = item.tel?.[0] || '';
            if (tel) {
              list.push({
                name: contactName,
                phone: tel.replace(/[^0-9+]/g, ''),
                category: 'অন্যান্য',
                relation: 'অন্যান্য',
                note: 'ফোন থেকে সরাসরি ইম্পোর্ট করা'
              });
            }
          });
          if (list.length > 0) {
            importContactsBatch(list);
            return;
          }
        }
      }
      // If native picker is not available or empty, open the smart selector
      setShowSmartPhonebookModal(true);
    } catch (err) {
      // In case of iframe security restriction or cancel, smoothly open the Smart Phonebook Multi-Selector
      setShowSmartPhonebookModal(true);
    }
  };

  // 2. VCF (vCard file) import parser
  const handleVcfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r\n|\r|\n/);
        const imported: Partial<PersonalContact>[] = [];
        let currentName = '';
        let currentPhone = '';
        let currentNote = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('BEGIN:VCARD')) {
            currentName = '';
            currentPhone = '';
            currentNote = '';
          } else if (line.startsWith('FN:')) {
            currentName = line.substring(3).trim();
          } else if (line.startsWith('N:') && !currentName) {
            const parts = line.substring(2).split(';');
            currentName = parts.filter(Boolean).join(' ').trim();
          } else if (line.includes('TEL') && line.includes(':')) {
            const numPart = line.substring(line.indexOf(':') + 1).replace(/[^0-9+]/g, '');
            if (numPart) currentPhone = numPart;
          } else if (line.startsWith('NOTE:')) {
            currentNote = line.substring(5).trim();
          } else if (line.startsWith('END:VCARD')) {
            if (currentName && currentPhone) {
              imported.push({
                name: currentName,
                phone: currentPhone,
                category: 'অন্যান্য',
                relation: 'অন্যান্য',
                note: currentNote || 'VCF ফাইল থেকে সংরক্ষিত'
              });
            }
          }
        }

        if (imported.length > 0) {
          importContactsBatch(imported);
        } else {
          setShowSmartPhonebookModal(true);
        }
      } catch (err) {
        setShowSmartPhonebookModal(true);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyPhone = (contactPhone: string, id: string) => {
    navigator.clipboard.writeText(contactPhone);
    setCopiedId(id);
    showToast(`নম্বর কপি করা হয়েছে: ${contactPhone}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 font-bangla text-white">
      {/* Header Card */}
      <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F59E0B] p-0.5 shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center text-[#D4AF37]">
                <PhoneCall className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#D4AF37]">ব্যক্তিগত দ্বীনি ও জরুরি যোগাযোগ খাতা</h2>
              <p className="text-xs text-white/60">
                মুফতিয়ান, উস্তাদ, পরিবার ও জরুরি নম্বরসমূহ অফলাইনে সুরক্ষিত রাখুন ও মোবাইল থেকে সংরক্ষণ করুন
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Phone Import */}
            <button
              onClick={handlePickPhoneContacts}
              className="px-3.5 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="মোবাইল ফোন থেকে কন্টাক্ট আনুন ও বেছে নিয়ে সেভ করুন"
            >
              <Smartphone className="w-4 h-4" />
              <span>ফোন থেকে আনুন</span>
            </button>

            {/* Smart Phonebook Multi-Selector */}
            <button
              onClick={() => setShowSmartPhonebookModal(true)}
              className="px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="ফোনবুক ফাইল (.vcf) বা টেক্সট থেকে পছন্দমতো কন্টাক্ট নির্বাচন করুন"
            >
              <Upload className="w-4 h-4" />
              <span>স্মার্ট ফোনবুক নির্বাচক</span>
            </button>

            {/* Manual New Contact */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#D4AF37] text-[#0a1628] rounded-2xl text-xs font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন নম্বর</span>
            </button>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
                    : 'bg-black/30 text-white/70 hover:bg-white/5 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="নাম বা নম্বর দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* Contacts List Grid */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10 p-6 text-white/50 text-xs space-y-2">
          <p>কোনো সংরক্ষিত কন্টাক্ট পাওয়া যায়নি।</p>
          <p className="text-white/40">উপরে "ফোন থেকে আনুন", "VCF ফাইল" বা "নতুন নম্বর" বাটনে ক্লিক করে যোগাযোগ সংরক্ষণ করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredContacts.map((c) => {
            const cleanPhone = c.phone.replace(/[^0-9+]/g, '');
            const waNumber = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone;
            return (
              <div
                key={c.id}
                className="p-4 rounded-3xl bg-black/25 backdrop-blur-md border border-white/10 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between space-y-3 group shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{c.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#D4AF37] font-semibold">
                          {c.category || c.relation || 'সাধারণ'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteContact(c.id)}
                      className="p-1.5 text-white/30 hover:text-rose-400 rounded-lg transition-colors"
                      title="নম্বর মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Phone number */}
                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                    <span className="text-xs text-white/90 font-mono tracking-wider font-semibold">
                      {c.phone}
                    </span>
                    <button
                      onClick={() => handleCopyPhone(c.phone, c.id)}
                      className="p-1 text-white/50 hover:text-[#D4AF37] transition-colors"
                      title="কপি করুন"
                    >
                      {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {c.note && (
                    <p className="text-[11px] text-white/60 line-clamp-2 px-1">
                      {c.note}
                    </p>
                  )}
                </div>

                {/* Direct Action Buttons: Call, WhatsApp, SMS */}
                <div className="grid grid-cols-3 gap-1.5 border-t border-white/5 pt-2.5">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="py-2 bg-[#D4AF37]/15 hover:bg-[#D4AF37] hover:text-[#0a1628] border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                    title="সরাসরি কল দিন"
                  >
                    <Phone className="w-3 h-3" />
                    <span>কল</span>
                  </a>

                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 bg-emerald-500/15 hover:bg-emerald-500 hover:text-white border border-emerald-500/40 text-emerald-400 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                    title="হোয়াটসঅ্যাপে বার্তা পাঠান"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>হোয়াটসঅ্যাপ</span>
                  </a>

                  <a
                    href={`sms:${cleanPhone}`}
                    className="py-2 bg-blue-500/15 hover:bg-blue-500 hover:text-white border border-blue-500/40 text-blue-400 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                    title="এসএমএস পাঠান"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>SMS</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#060e1b] border border-[#D4AF37]/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#D4AF37] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#D4AF37]" />
              <span>নতুন কন্টাক্ট নম্বর সংরক্ষণ</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs font-bangla">
              <div>
                <label className="block text-white/80 mb-1.5">ব্যক্তির নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: হযরত মাওলানা আব্দুল্লাহ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 mb-1.5">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#D4AF37] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 mb-1.5">ক্যাটাগরি</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="আলেম">আলেম / মুফতিয়ান</option>
                  <option value="উস্তাদ">উস্তাদ / শিক্ষক</option>
                  <option value="পরিবার">পরিবার ও আত্মীয়</option>
                  <option value="দ্বীনি ভাই">দ্বীনি ভাই / বন্ধু</option>
                  <option value="জরুরি">জরুরি / ডাক্তার / এম্বুলেন্স</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </div>

              <div>
                <label className="block text-white/80 mb-1.5">নোট / পদবী / ঠিকানা (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: মুহাদ্দিস, আশুলিয়া মাদ্রাসা..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37] resize-none font-bangla"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#D4AF37] hover:bg-[#c49f27] text-[#0a1628] font-bold rounded-2xl shadow-md active:scale-95 transition-all"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Phonebook Multi-Selector Modal */}
      <SmartPhonebookModal
        isOpen={showSmartPhonebookModal}
        onClose={() => setShowSmartPhonebookModal(false)}
        onSaveContacts={(imported) => {
          importContactsBatch(imported);
          showToast(`${formatBanglaNumber(imported.length)}টি কন্টাক্ট সফলভাবে সংরক্ষণ করা হয়েছে`);
        }}
        showToast={showToast}
      />
    </div>
  );
};
