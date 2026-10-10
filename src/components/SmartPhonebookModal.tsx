import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Upload,
  Clipboard,
  Check,
  Search,
  Users,
  CheckSquare,
  Square,
  Phone,
  Tag,
  Sparkles,
  AlertCircle,
  FileText
} from 'lucide-react';
import { PersonalContact } from '../types';
import { formatBanglaNumber } from '../utils/scoring';

interface SmartPhonebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContacts: (contacts: Partial<PersonalContact>[]) => void;
  showToast: (msg: string) => void;
}

interface ParsedContactItem {
  id: string;
  name: string;
  phone: string;
  selected: boolean;
  category: 'আলেম' | 'পরিবার' | 'দ্বীনি ভাই' | 'উস্তাদ' | 'জরুরি' | 'অন্যান্য';
}

export const SmartPhonebookModal: React.FC<SmartPhonebookModalProps> = ({
  isOpen,
  onClose,
  onSaveContacts,
  showToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vcf' | 'paste' | 'manual'>('vcf');
  const [parsedList, setParsedList] = useState<ParsedContactItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [bulkCategory, setBulkCategory] = useState<'আলেম' | 'পরিবার' | 'দ্বীনি ভাই' | 'উস্তাদ' | 'জরুরি' | 'অন্যান্য'>('দ্বীনি ভাই');
  const [rawText, setRawText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual quick single entry
  const [singleName, setSingleName] = useState('');
  const [singlePhone, setSinglePhone] = useState('');

  if (!isOpen) return null;

  // Convert raw text or VCF lines into contact items
  const parseVcfText = (vcfString: string) => {
    const lines = vcfString.split(/\r\n|\r|\n/);
    const items: ParsedContactItem[] = [];
    let currentName = '';
    let currentPhone = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('BEGIN:VCARD')) {
        currentName = '';
        currentPhone = '';
      } else if (line.startsWith('FN:')) {
        currentName = line.substring(3).trim();
      } else if (line.startsWith('N:') && !currentName) {
        const parts = line.substring(2).split(';');
        currentName = parts.filter(Boolean).join(' ').trim();
      } else if (line.includes('TEL') && line.includes(':')) {
        const num = line.substring(line.indexOf(':') + 1).replace(/[^0-9+]/g, '');
        if (num) currentPhone = num;
      } else if (line.startsWith('END:VCARD')) {
        if (currentName && currentPhone) {
          items.push({
            id: `vcf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: currentName,
            phone: currentPhone,
            selected: true,
            category: bulkCategory
          });
        }
      }
    }

    if (items.length > 0) {
      setParsedList(items);
      showToast(`${formatBanglaNumber(items.length)}টি কন্টাক্ট পাওয়া গেছে! তালিকা থেকে নির্বাচন করুন।`);
    } else {
      showToast('ফাইলে কোনো বৈধ ফোন নম্বর বা নাম পাওয়া যায়নি');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseVcfText(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Parse plain text (copy pasted from phonebook / whatsapp / notes)
  const handleParseRawText = () => {
    if (!rawText.trim()) {
      showToast('অনুগ্রহ করে কন্টাক্ট বা ফোন নম্বর পেস্ট করুন');
      return;
    }

    const lines = rawText.split('\n');
    const items: ParsedContactItem[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Try split by comma, colon, tab, dash
      const parts = trimmed.split(/[,:\t|-]/);
      if (parts.length >= 2) {
        const namePart = parts[0].trim();
        const phonePart = parts[1].replace(/[^0-9+]/g, '').trim();
        if (namePart && phonePart.length >= 6) {
          items.push({
            id: `paste-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: namePart,
            phone: phonePart,
            selected: true,
            category: bulkCategory
          });
          return;
        }
      }

      // Regex phone finder
      const phoneMatch = trimmed.match(/(\+?88)?01[3-9]\d{8}/g) || trimmed.match(/(\+?\d{8,15})/g);
      if (phoneMatch && phoneMatch.length > 0) {
        const pNum = phoneMatch[0].replace(/[^0-9+]/g, '');
        const pName = trimmed.replace(phoneMatch[0], '').replace(/[,\-:]/g, '').trim() || 'মোবাইল কন্টাক্ট';
        items.push({
          id: `paste-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: pName,
          phone: pNum,
          selected: true,
          category: bulkCategory
        });
      }
    });

    if (items.length > 0) {
      setParsedList(items);
      showToast(`${formatBanglaNumber(items.length)}টি কন্টাক্ট শনাক্ত করা হয়েছে!`);
    } else {
      showToast('টেক্সট থেকে কোনো সঠিক ফোন নম্বর শনাক্ত করা যায়নি');
    }
  };

  // Paste directly from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawText(text);
          showToast('ক্লিপবোর্ড থেকে পেস্ট করা হয়েছে');
        }
      }
    } catch {
      showToast('ক্লিপবোর্ড অ্যাক্সেস করতে বক্সটিতে সরাসরি পেস্ট (Ctrl+V) করুন');
    }
  };

  // Add single contact to list
  const handleAddSingleToList = () => {
    if (!singleName.trim() || !singlePhone.trim()) {
      showToast('নাম এবং ফোন নম্বর উভয়ই পূরণ করুন');
      return;
    }
    const newItem: ParsedContactItem = {
      id: `manual-${Date.now()}`,
      name: singleName.trim(),
      phone: singlePhone.trim(),
      selected: true,
      category: bulkCategory
    };
    setParsedList((prev) => [newItem, ...prev]);
    setSingleName('');
    setSinglePhone('');
    showToast('তালিকায় যোগ হয়েছে!');
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setParsedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const selectAll = (select: boolean) => {
    setParsedList((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Save selected contacts into app database
  const handleSaveSelected = () => {
    const selected = parsedList.filter((item) => item.selected);
    if (selected.length === 0) {
      showToast('অনুগ্রহ করে অন্তত একটি কন্টাক্ট নির্বাচন করুন');
      return;
    }

    const payload: Partial<PersonalContact>[] = selected.map((item) => ({
      name: item.name,
      phone: item.phone,
      category: item.category || bulkCategory,
      relation: item.category || bulkCategory,
      note: 'ফোনবুক থেকে সংরক্ষিত'
    }));

    onSaveContacts(payload);
    onClose();
  };

  const filteredItems = parsedList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.phone.includes(searchFilter)
  );

  const selectedCount = parsedList.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-bangla">
      <div className="bg-[#0b1626] border border-[#D4AF37]/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b1626] rounded-[14px] flex items-center justify-center text-[#D4AF37]">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#D4AF37]">
                ফোন কন্টাক্ট নির্বাচক ও সংরক্ষণাগার
              </h3>
              <p className="text-xs text-white/60">
                ফোন থেকে সরাসরি বা ফাইল/টেক্সটের মাধ্যমে পছন্দমতো নম্বর বেছে নিয়ে সেভ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="p-3 bg-black/40 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap text-xs font-bold">
          <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveSubTab('vcf')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeSubTab === 'vcf'
                  ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ফোন VCF ফাইল</span>
            </button>

            <button
              onClick={() => setActiveSubTab('paste')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeSubTab === 'paste'
                  ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>টেক্সট / ক্লিপবোর্ড পেস্ট</span>
            </button>

            <button
              onClick={() => setActiveSubTab('manual')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeSubTab === 'manual'
                  ? 'bg-[#D4AF37] text-[#0a1628] shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>একক এন্ট্রি</span>
            </button>
          </div>

          {/* Bulk Category Selector */}
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-xs">ক্যাটাগরি:</span>
            <select
              value={bulkCategory}
              onChange={(e: any) => setBulkCategory(e.target.value)}
              className="bg-black/60 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-[#D4AF37] focus:outline-none"
            >
              <option value="দ্বীনি ভাই">দ্বীনি ভাই</option>
              <option value="আলেম">আলেম / মুফতি</option>
              <option value="উস্তাদ">উস্তাদ / শিক্ষক</option>
              <option value="পরিবার">পরিবার ও আত্মীয়</option>
              <option value="জরুরি">জরুরি সেবা</option>
              <option value="অন্যান্য">অন্যান্য</option>
            </select>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: VCF Import Trigger Card */}
          {activeSubTab === 'vcf' && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-white/5 to-black/30 border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">মোবাইল কন্টাক্ট ফাইল (VCF / vCard) নির্বাচন করুন</h4>
                <p className="text-xs text-white/60 mt-1 max-w-md mx-auto">
                  আপনার ফোনের কন্টাক্টস অ্যাপ থেকে 'Export to .vcf' করা ফাইলটি সিলেক্ট করলে ফোনের সব নাম ও নম্বর এখানে চলে আসবে এবং আপনি যেটা যেটা চান টিক চিহ্ন দিয়ে সেভ করতে পারবেন।
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold rounded-2xl text-xs sm:text-sm cursor-pointer shadow-lg active:scale-95 transition-all">
                <Smartphone className="w-4 h-4" />
                <span>ফোন ফাইল সিলেক্ট করুন (.vcf)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".vcf,text/vcard"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 2: Text / Clipboard Paste */}
          {activeSubTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">
                  নিচের বক্সে নাম ও ফোন নম্বর পেস্ট করুন (যেমন: আব্দুল্লাহ 01812345678 বা প্রতি লাইনে একটি):
                </span>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-[#D4AF37] flex items-center gap-1"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>ক্লিপবোর্ড পেস্ট</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="মুফতি তানভীর আহমেদ, 01822334455&#10;হাফেজ আব্দুল ওয়াদুদ, 01711002233"
                className="w-full p-3 bg-black/40 border border-white/15 rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
              />

              <button
                type="button"
                onClick={handleParseRawText}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>নম্বরগুলো শনাক্ত করে তালিকায় আনুন</span>
              </button>
            </div>
          )}

          {/* TAB 3: Manual Single Entry */}
          {activeSubTab === 'manual' && (
            <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="নাম (যেমন: মাওলানা আব্দুর রহমান)"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="tel"
                  placeholder="ফোন নম্বর (যেমন: 01711223344)"
                  value={singlePhone}
                  onChange={(e) => setSinglePhone(e.target.value)}
                  className="px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-2xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddSingleToList}
                className="w-full py-2 bg-[#D4AF37] text-[#0a1628] font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5"
              >
                <span>+ তালিকায় যোগ করুন</span>
              </button>
            </div>
          )}

          {/* PARSED CONTACTS INTERACTIVE SELECTION LIST */}
          {parsedList.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              
              {/* Filter and Select All / Deselect Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#D4AF37]">
                    শনাক্তকৃত কন্টাক্ট ({formatBanglaNumber(parsedList.length)}টি):
                  </span>
                  <span className="text-xs text-white/60">
                    ({formatBanglaNumber(selectedCount)}টি নির্বাচিত)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectAll(true)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium"
                  >
                    সবগুলো নির্বাচন
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAll(false)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/60"
                  >
                    আনসিলেক্ট
                  </button>
                </div>
              </div>

              {/* Search Inside List */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="তালিকায় নাম বা নম্বর খুঁজুন..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none"
                />
              </div>

              {/* Scrollable Checkbox List */}
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                      item.selected
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-white'
                        : 'bg-black/20 border-white/5 text-white/50 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-[#D4AF37]">
                        {item.selected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-white/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-white">{item.name}</p>
                        <p className="text-[11px] font-mono text-white/60 truncate">{item.phone}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-[#D4AF37] shrink-0">
                      {item.category || bulkCategory}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer with Action Button */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white/80 rounded-2xl text-xs font-bold transition-colors"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleSaveSelected}
            disabled={selectedCount === 0}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 ${
              selectedCount > 0
                ? 'bg-[#D4AF37] hover:brightness-110 text-[#0a1628] shadow-[#D4AF37]/20'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>নির্বাচিত ({formatBanglaNumber(selectedCount)}টি) কন্টাক্ট সেভ করুন</span>
          </button>
        </div>

      </div>
    </div>
  );
};
