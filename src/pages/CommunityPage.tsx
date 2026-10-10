import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  Phone,
  Video,
  Send,
  Sparkles,
  ShieldCheck,
  Award,
  Trophy,
  Share2,
  Heart,
  Volume2,
  CheckCircle2,
  Search,
  UserPlus,
  RefreshCw,
  Smile,
  Mic,
  MicOff,
  Play,
  Pause,
  ArrowLeft,
  PhoneIncoming,
  PhoneCall,
  Check,
  CheckCheck,
  Clock,
  Circle,
  Image as ImageIcon,
  Camera,
  X,
  UserCheck,
  UserX,
  Gift,
  Megaphone,
  ThumbsUp,
  Download,
  Eye,
  ExternalLink,
  BookOpen,
  Trash2,
  Lock
} from 'lucide-react';
import { useApp, ADMIN_CORRECT_NAME, ADMIN_EMAIL } from '../context/AppContext';
import { CommunityMessage, CallSession, User, FriendRequest, AdminAnnouncement, ChatMessage, Conversation } from '../types';
import { formatBanglaNumber, getLevelInfo, formatDateToBangla } from '../utils/scoring';
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  subscribeToIncomingRequests,
  subscribeToOutgoingRequests,
  subscribeToFriendships
} from '../services/friendService';
import {
  getDeterministicConversationId,
  ensureConversation,
  sendChatMessage,
  subscribeToConversationMessages,
  markConversationAsRead,
  setTypingStatus,
  subscribeToConversation,
  subscribeToUserConversations,
  deleteChatMessage,
  toggleMessageReaction
} from '../services/chatService';

export const CommunityPage: React.FC = () => {
  const { user, dailyAmal, showToast, allUsers, isAdmin, initiateCall } = useApp();

  const [activeTab, setActiveTab] = useState<'messenger' | 'majlis' | 'directory' | 'requests'>('messenger');
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const voiceTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Active Announcement State
  const [announcement, setAnnouncement] = useState<AdminAnnouncement>(() => {
    try {
      const stored = localStorage.getItem('amal_admin_announcement_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      id: 'ann-1',
      title: '🏆 মাসিক সেরা আমলকারী প্রতিযোগিতা ও বিশেষ পুরস্কার ঘোষণা!',
      content: 'আসসালামু আলাইকুম। চলতি মাসে যারা ধারাবাহিকভাবে ৫ ওয়াক্ত নামাজ জামাতে আদায় করবেন এবং সর্বোচ্চ আমল স্কোর অর্জন করবেন, তাদের মধ্য থেকে শীর্ষ ৩ জনকে পরিচালকের পক্ষ থেকে নগদ অর্থ পুরস্কার ও দুর্লভ ইসলামিক কিতাব উপহার দেওয়া হবে।',
      prize_details: '১ম পুরস্কার: নগদ ৫,০০০ টাকা ও তাফসীরুল কুরআন • ২য় পুরস্কার: ৩,০০০ টাকা • ৩য় পুরস্কার: ২,০০০ টাকা',
      deadline: '৩০ সেপ্টেম্বর, ২০২৬',
      created_at: new Date().toISOString(),
      is_active: true,
      author_name: ADMIN_CORRECT_NAME
    };
  });

  // Friend Requests State
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => {
    try {
      const stored = localStorage.getItem('amal_friend_requests_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'fr-1',
        sender_id: 'user-02',
        sender_name: 'হাফেজ আব্দুল ওয়াদুদ',
        sender_phone: '01711002233',
        receiver_id: user?.id || 'current-user',
        status: 'pending',
        created_at: '২০২৬-০৮-৩০'
      }
    ];
  });

  // Friendships Map: userId -> boolean
  const [friendsList, setFriendsList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('amal_friends_list_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['admin-yahya-01']; // Admin is default connected friend
  });

  // Realtime 1-to-1 Private Messages from Firestore
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const [liveConversations, setLiveConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Public Group Majlis Messages
  const [majlisMessages, setMajlisMessages] = useState<CommunityMessage[]>(() => {
    try {
      const saved = localStorage.getItem('amal_community_messages_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'msg-1',
        sender_id: 'admin-yahya-01',
        sender_name: ADMIN_CORRECT_NAME,
        sender_role: 'admin',
        text: 'আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ্। সকল দ্বীনি ভাইদের দৈনিক আমল, কুরআন তিলাওয়াত ও ৫ ওয়াক্ত নামাজের ধারাবাহিকতা রক্ষার আহ্বান জানাচ্ছি।',
        timestamp: 'আজ সকাল ০৭:৩০',
        type: 'text',
        level: 'মুত্তাক্বীন'
      },
      {
        id: 'msg-2',
        sender_id: 'user-02',
        sender_name: 'হাফেজ আব্দুল ওয়াদুদ',
        text: 'আলহামদুলিল্লাহ! আজকের ফজরের পর ২ পারা কুরআন তিলাওয়াত ও ইশরাক সম্পন্ন হয়েছে। সবার দোয়ার দরখাস্ত।',
        timestamp: 'আজ সকাল ০৮:১৫',
        type: 'amal_share',
        score: 92,
        level: 'মুহসিন'
      }
    ];
  });

  // Combine Default Users with Context Users
  const allCommunityMembers: User[] = [
    {
      id: 'admin-yahya-01',
      name: ADMIN_CORRECT_NAME,
      email: ADMIN_EMAIL,
      phone: '01860977699',
      age: 26,
      total_qaza: 150,
      qaza_adaied: 45,
      role: 'admin',
      is_verified_email: true,
      is_verified_phone: true,
      created_at: '2026-01-01',
      bio: 'পরিচালক ও প্রতিষ্ঠাতা - বসুন্ধরা ইসলামী রিসার্চ সেন্টার'
    },
    {
      id: 'user-02',
      name: 'হাফেজ আব্দুল ওয়াদুদ',
      email: 'wadud@example.com',
      phone: '01711002233',
      age: 24,
      total_qaza: 40,
      qaza_adaied: 35,
      role: 'user',
      is_verified_email: true,
      is_verified_phone: true,
      created_at: '2026-02-10',
      bio: 'হাফেজে কুরআন ও দ্বীনি শিক্ষার্থী'
    },
    {
      id: 'user-03',
      name: 'মুফতি তানভীর আহমেদ',
      email: 'tanvir@example.com',
      phone: '01822334455',
      age: 32,
      total_qaza: 10,
      qaza_adaied: 10,
      role: 'user',
      is_verified_email: true,
      is_verified_phone: true,
      created_at: '2026-02-15',
      bio: 'মুফতি ও খতীব, জামে মসজিদ'
    },
    {
      id: 'user-04',
      name: 'মাওলানা কামরুল হাসান',
      email: 'kamrul@example.com',
      phone: '01933445566',
      age: 29,
      total_qaza: 80,
      qaza_adaied: 60,
      role: 'user',
      is_verified_email: true,
      is_verified_phone: true,
      created_at: '2026-03-01',
      bio: 'মাদ্রাসার উস্তাদ ও দ্বীনি গবেষক'
    },
    ...allUsers.filter((u) => u.id !== 'admin-yahya-01' && u.id !== user?.id)
  ];

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('amal_community_messages_v2', JSON.stringify(majlisMessages));
    } catch {}
  }, [majlisMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('amal_friend_requests_v1', JSON.stringify(friendRequests));
    } catch {}
  }, [friendRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('amal_friends_list_v1', JSON.stringify(friendsList));
    } catch {}
  }, [friendsList]);

  // Realtime Firebase subscriptions for Friend Requests & Friendships
  useEffect(() => {
    if (!user?.id) return;

    // 1. Subscribe to incoming friend requests
    const unsubIncoming = subscribeToIncomingRequests(user.id, (realtimeIncoming) => {
      setFriendRequests((prev) => {
        // Keep non-conflicting outgoing/local requests, merge realtime incoming
        const outgoingAndOthers = prev.filter(
          (r) => (r.receiverId || r.receiver_id) !== user.id
        );
        const mappedIncoming: FriendRequest[] = realtimeIncoming.map((r) => ({
          id: r.id,
          sender_id: r.senderId || r.sender_id,
          senderId: r.senderId || r.sender_id,
          sender_name: r.senderName || r.sender_name || 'দ্বীনি ভাই',
          senderName: r.senderName || r.sender_name || 'দ্বীনি ভাই',
          sender_avatar: r.senderAvatar || r.sender_avatar,
          senderAvatar: r.senderAvatar || r.sender_avatar,
          sender_role: r.senderRole || r.sender_role,
          senderRole: r.senderRole || r.sender_role,
          receiver_id: user.id,
          receiverId: user.id,
          status: (r.status as any) || 'pending',
          created_at: formatDateToBangla(r.createdAt || r.created_at || new Date().toISOString())
        }));
        return [...outgoingAndOthers, ...mappedIncoming];
      });
    });

    // 2. Subscribe to outgoing requests so state stays in sync
    const unsubOutgoing = subscribeToOutgoingRequests(user.id, (realtimeOutgoing) => {
      setFriendRequests((prev) => {
        const incomingAndOthers = prev.filter(
          (r) => (r.senderId || r.sender_id) !== user.id
        );
        const mappedOutgoing: FriendRequest[] = realtimeOutgoing.map((r) => ({
          id: r.id,
          sender_id: user.id,
          senderId: user.id,
          sender_name: user.name,
          senderName: user.name,
          receiver_id: r.receiverId || r.receiver_id,
          receiverId: r.receiverId || r.receiver_id,
          status: (r.status as any) || 'pending',
          created_at: formatDateToBangla(r.createdAt || r.created_at || new Date().toISOString())
        }));
        return [...incomingAndOthers, ...mappedOutgoing];
      });
    });

    // 3. Subscribe to accepted friendships
    const unsubFriendships = subscribeToFriendships(user.id, (friendIds) => {
      setFriendsList((prev) => {
        const combined = new Set([...prev, ...friendIds, 'admin-yahya-01']);
        return Array.from(combined);
      });
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
      unsubFriendships();
    };
  }, [user?.id]);

  // Subscribe to all conversations for user's inbox
  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeToUserConversations(user.id, (convs) => {
      setLiveConversations(convs);
    });
    return () => unsub();
  }, [user?.id]);

  // Subscribe to current selected conversation's messages and live typing status
  useEffect(() => {
    if (!selectedChatUser || !user?.id) {
      setRealtimeMessages([]);
      setActiveConversation(null);
      return;
    }

    if (!isFriend(selectedChatUser.id)) {
      showToast('শুধুমাত্র পারস্পরিক ফ্রেন্ডলিস্টভুক্ত দ্বীনি ভাইদের সাথে ব্যক্তিগত চ্যাট করা যাবে।');
      setSelectedChatUser(null);
      return;
    }

    const convId = getDeterministicConversationId(user.id, selectedChatUser.id);

    // Ensure conversation exists in Firestore
    ensureConversation(user, selectedChatUser).catch(console.error);

    // Subscribe to realtime messages via onSnapshot
    const unsubMsgs = subscribeToConversationMessages(convId, (msgs) => {
      setRealtimeMessages(msgs);
      markConversationAsRead(convId, user.id);
    });

    // Subscribe to conversation doc for realtime partner typing status
    const unsubConv = subscribeToConversation(convId, (conv) => {
      setActiveConversation(conv);
    });

    // Initial read mark
    markConversationAsRead(convId, user.id);

    return () => {
      unsubMsgs();
      unsubConv();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingStatus(convId, user.id, false);
    };
  }, [selectedChatUser?.id, user?.id, friendsList]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [majlisMessages, realtimeMessages, selectedChatUser]);

  const levelInfo = getLevelInfo(dailyAmal?.total_score || 0);

  // Time format helper for chat
  const formatMessageTime = (isoString?: string): string => {
    if (!isoString) return 'এইমাত্র';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const isPM = hours >= 12;
      const period = isPM ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${formatBanglaNumber(String(hours).padStart(2, '0'))}:${formatBanglaNumber(minutes)} ${period}`;
    } catch {
      return 'এইমাত্র';
    }
  };

  // Realtime typing status updater
  const handleMessageInputChange = (val: string) => {
    setMessageInput(val);
    if (!selectedChatUser || !user?.id) return;
    const convId = getDeterministicConversationId(user.id, selectedChatUser.id);
    setTypingStatus(convId, user.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(convId, user.id, false);
    }, 2500);
  };

  // Send 1-on-1 Real Private Message to Firestore
  const handleSendPrivateMessage = async (
    textToSend?: string,
    msgType: 'text' | 'audio' | 'image' | 'amal_share' = 'text',
    extra?: { audioUrl?: string; imageUrl?: string; duration?: number }
  ) => {
    if (!selectedChatUser || !user?.id) return;

    if (!isFriend(selectedChatUser.id)) {
      showToast('শুধুমাত্র পারস্পরিক ফ্রেন্ডলিস্টভুক্ত দ্বীনি ভাইদের সাথে ব্যক্তিগত চ্যাট করা যাবে।');
      return;
    }

    const finalContent = textToSend !== undefined ? textToSend : messageInput;
    if (!finalContent.trim() && msgType === 'text' && !selectedImagePreview) return;

    const convId = getDeterministicConversationId(user.id, selectedChatUser.id);

    // Cancel active typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingStatus(convId, user.id, false);

    const score = msgType === 'amal_share' ? dailyAmal?.total_score || 0 : undefined;
    const level = levelInfo.currentLevel.name;

    const sendRes = await sendChatMessage({
      conversationId: convId,
      sender: user,
      receiver: selectedChatUser,
      text: finalContent.trim(),
      messageType: msgType,
      extra: {
        imageUrl: extra?.imageUrl || selectedImagePreview || undefined,
        audioUrl: extra?.audioUrl,
        voiceDuration: extra?.duration,
        score,
        level
      }
    });

    if (!sendRes.success) {
      showToast(sendRes.error || 'বার্তা পাঠানো সম্ভব হয়নি');
      return;
    }

    if (msgType === 'text') {
      setMessageInput('');
      setSelectedImagePreview(null);
    }
  };

  // Delete message from Firestore
  const handleDeletePrivateMessage = async (messageId: string) => {
    const ok = await deleteChatMessage(messageId);
    if (ok) {
      showToast('বার্তাটি মুছে ফেলা হয়েছে');
    } else {
      showToast('বার্তা মুছতে ব্যর্থ হয়েছে');
    }
  };

  // Image Upload Handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Voice Note Recorder with real MediaRecorder
  const toggleVoiceRecording = async () => {
    if (isRecordingVoice) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      clearInterval(voiceTimerRef.current);
      setIsRecordingVoice(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const dur = voiceDuration || 4;

          if (activeTab === 'messenger' && selectedChatUser) {
            handleSendPrivateMessage(
              `ভয়েস বার্তা (${formatBanglaNumber(dur)} সেকেন্ড)`,
              'audio',
              { audioUrl, duration: dur }
            );
          } else {
            handleSendMajlisMessageWithAudio(audioUrl, dur);
          }

          stream.getTracks().forEach((track) => track.stop());
          setVoiceDuration(0);
          showToast('ভয়েস মেসেজ পাঠানো হয়েছে');
        };

        mediaRecorder.start();
        setIsRecordingVoice(true);
        setVoiceDuration(1);
        voiceTimerRef.current = setInterval(() => {
          setVoiceDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.warn('Mic error:', err);
        // Fallback simulation
        setIsRecordingVoice(true);
        setVoiceDuration(1);
        voiceTimerRef.current = setInterval(() => {
          setVoiceDuration((prev) => prev + 1);
        }, 1000);
      }
    }
  };

  // Send Public Majlis Message
  const handleSendMajlisMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedImagePreview) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const isPM = hours >= 12;
    const period = isPM ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeString = `আজ ${formatBanglaNumber(String(hours).padStart(2, '0'))}:${formatBanglaNumber(minutes)} ${period}`;

    const newMsg: CommunityMessage = {
      id: `msg-${Date.now()}`,
      sender_id: user?.id || 'current-user',
      sender_name: user?.name || 'মুহাম্মাদ আব্দুল্লাহ',
      sender_avatar: user?.photo,
      sender_role: user?.role,
      text: messageInput.trim(),
      image_url: selectedImagePreview || undefined,
      timestamp: timeString,
      type: selectedImagePreview ? 'image' : 'text',
      level: levelInfo.currentLevel.name
    };

    setMajlisMessages((prev) => [...prev, newMsg]);
    setMessageInput('');
    setSelectedImagePreview(null);
    showToast('বার্তা উন্মুক্ত মজলিসে পাঠানো হয়েছে');

    // Friendly group auto-reply
    setTimeout(() => {
      const responses = [
        'মাশাআল্লাহ! আল্লাহ তাআলা আপনার আমলে বরকত দান করুন।',
        'আমিন, আল্লাহ আমাদের সকলকে দ্বীনের ওপর অবিচল রাখুন।',
        'আলহামদুলিল্লাহ ভাই, খুব সুন্দর নসিহত ও অনুপ্রেরণা।'
      ];
      const botMsg: CommunityMessage = {
        id: `msg-reply-${Date.now()}`,
        sender_id: 'user-02',
        sender_name: 'হাফেজ আব্দুল ওয়াদুদ',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: 'এখনই',
        type: 'text',
        level: 'মুহসিন'
      };
      setMajlisMessages((prev) => [...prev, botMsg]);
    }, 2200);
  };

  const handleSendMajlisMessageWithAudio = (audioUrl: string, duration: number) => {
    const now = new Date();
    const timeString = `আজ ${formatBanglaNumber(now.getHours() % 12 || 12)}:${formatBanglaNumber(String(now.getMinutes()).padStart(2, '0'))}`;
    const newMsg: CommunityMessage = {
      id: `msg-voice-${Date.now()}`,
      sender_id: user?.id || 'current-user',
      sender_name: user?.name || 'মুহাম্মাদ আব্দুল্লাহ',
      sender_avatar: user?.photo,
      sender_role: user?.role,
      text: `ভয়েস নসিহত (${formatBanglaNumber(duration)} সেকেন্ড)`,
      audio_url: audioUrl,
      voice_duration: duration,
      timestamp: timeString,
      type: 'audio',
      level: levelInfo.currentLevel.name
    };
    setMajlisMessages((prev) => [...prev, newMsg]);
  };

  // Add Message Reaction
  const handleToggleReaction = (msgId: string, emoji: string, isPrivate = false, partnerId?: string) => {
    const myId = user?.id || 'current-user';

    if (isPrivate) {
      if (user?.id) {
        toggleMessageReaction(msgId, emoji, user.id).catch(console.error);
      }
    } else {
      setMajlisMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          const currentReactions = { ...(m.reactions || {}) };
          const userList = currentReactions[emoji] || [];
          if (userList.includes(myId)) {
            currentReactions[emoji] = userList.filter((id) => id !== myId);
          } else {
            currentReactions[emoji] = [...userList, myId];
          }
          return { ...m, reactions: currentReactions };
        })
      );
    }
  };

  // Share Live Amal Score
  const handleShareMyAmal = () => {
    const currentScore = dailyAmal?.total_score || 0;
    const now = new Date();
    const timeString = `আজ ${formatBanglaNumber(now.getHours() % 12 || 12)}:${formatBanglaNumber(String(now.getMinutes()).padStart(2, '0'))}`;

    if (activeTab === 'messenger' && selectedChatUser) {
      handleSendPrivateMessage(
        `আলহামদুলিল্লাহ! আজকের আমল স্কোর: ${formatBanglaNumber(currentScore)} পয়েন্ট (${levelInfo.currentLevel.name})। ৫ ওয়াক্ত নামাজ ও জিকির সম্পন্ন হয়েছে।`,
        'amal_share'
      );
      showToast('আমল স্কোর চ্যাটে শেয়ার করা হয়েছে');
    } else {
      const shareMsg: CommunityMessage = {
        id: `amal-${Date.now()}`,
        sender_id: user?.id || 'current-user',
        sender_name: user?.name || 'মুহাম্মাদ আব্দুল্লাহ',
        sender_avatar: user?.photo,
        sender_role: user?.role,
        text: `আলহামদুলিল্লাহ! আজকের আমল স্কোর: ${formatBanglaNumber(currentScore)} পয়েন্ট (${levelInfo.currentLevel.name})। ৫ ওয়াক্ত নামাজ ও জিকির চালু আছে।`,
        timestamp: timeString,
        type: 'amal_share',
        score: currentScore,
        level: levelInfo.currentLevel.name
      };
      setMajlisMessages((prev) => [...prev, shareMsg]);
      showToast('আপনার আজকের আমল স্কোর মজলিসে শেয়ার করা হয়েছে');
    }
  };

  // Start Real WebRTC Call (Audio or Video)
  const handleStartCall = (target: User, type: 'audio' | 'video') => {
    initiateCall(target, type);
  };

  // Friend Request Actions (Real Firebase + Local fallback)
  const handleSendFriendRequest = async (targetUser: User) => {
    if (friendsList.includes(targetUser.id)) return;
    
    // Check if user is logged in with real Firebase
    if (user?.id) {
      try {
        const res = await sendFriendRequest(user, {
          id: targetUser.id,
          name: targetUser.name,
          avatar: targetUser.photo || targetUser.avatar_url
        });
        showToast(res.message);
        if (res.success && res.requestId) {
          const newReq: FriendRequest = {
            id: res.requestId,
            sender_id: user.id,
            senderId: user.id,
            sender_name: user.name,
            senderName: user.name,
            sender_avatar: user.photo,
            senderAvatar: user.photo,
            sender_phone: user.phone,
            receiver_id: targetUser.id,
            receiverId: targetUser.id,
            status: 'pending',
            created_at: formatDateToBangla(new Date().toISOString())
          };
          setFriendRequests((prev) => [...prev, newReq]);
        }
      } catch (err: any) {
        showToast(err.message || 'রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে');
      }
    } else {
      // Local fallback
      const newReq: FriendRequest = {
        id: `fr-${Date.now()}`,
        sender_id: 'current-user',
        senderId: 'current-user',
        sender_name: 'মুহাম্মাদ আব্দুল্লাহ',
        senderName: 'মুহাম্মাদ আব্দুল্লাহ',
        receiver_id: targetUser.id,
        receiverId: targetUser.id,
        status: 'pending',
        created_at: formatDateToBangla(new Date().toISOString())
      };
      setFriendRequests((prev) => [...prev, newReq]);
      showToast(`${targetUser.name}-কে ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে`);

      setTimeout(() => {
        setFriendsList((prev) => [...new Set([...prev, targetUser.id])]);
        setFriendRequests((prev) =>
          prev.map((r) => (r.id === newReq.id ? { ...r, status: 'accepted' } : r))
        );
        showToast(`🎉 ${targetUser.name} আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন!`);
      }, 2500);
    }
  };

  const handleAcceptFriendRequest = async (req: FriendRequest) => {
    const senderId = req.senderId || req.sender_id || '';
    const senderName = req.senderName || req.sender_name || 'দ্বীনি ভাই';

    if (user?.id && req.id && !req.id.startsWith('fr-')) {
      try {
        const res = await acceptFriendRequest(req.id, user, {
          id: senderId,
          name: senderName,
          avatar: req.senderAvatar || req.sender_avatar
        });
        showToast(res.message);
      } catch (err: any) {
        showToast(err.message || 'রিকোয়েস্ট গ্রহণে সমস্যা হয়েছে');
      }
    } else {
      showToast(`${senderName}-এর অনুরোধ গ্রহণ করা হয়েছে! এখন থেকে ব্যক্তিগত চ্যাট ও কল করতে পারবেন।`);
    }

    setFriendsList((prev) => [...new Set([...prev, senderId])]);
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  const handleRejectFriendRequest = async (req: FriendRequest) => {
    if (user?.id && req.id && !req.id.startsWith('fr-')) {
      try {
        const res = await declineFriendRequest(req.id);
        showToast(res.message);
      } catch (err: any) {
        showToast(err.message || 'বাতিল করতে সমস্যা হয়েছে');
      }
    } else {
      showToast('অনুরোধ বাতিল করা হয়েছে');
    }
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  const isFriend = (userId: string) => {
    return friendsList.includes(userId) || userId === 'admin-yahya-01' || isAdmin;
  };

  const isRequestPending = (userId: string) => {
    const myId = user?.id || 'current-user';
    return friendRequests.some(
      (r) =>
        (r.receiverId === userId || r.receiver_id === userId) &&
        (r.senderId === myId || r.sender_id === myId) &&
        r.status === 'pending'
    );
  };

  const pendingIncomingRequests = friendRequests.filter((r) => {
    const myId = user?.id || 'current-user';
    return (r.receiverId === myId || r.receiver_id === myId) && r.status === 'pending';
  });

  const filteredMembers = allCommunityMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 font-bangla text-white select-none">
      
      {/* 🏆 PINNED ADMIN PRIZE & SPECIAL NOTICE ANNOUNCEMENT */}
      {announcement && announcement.is_active && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/80 via-[#18233a] to-emerald-950/80 border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.25)] space-y-3 relative overflow-hidden animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-500 p-0.5 shadow-xl flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#06101e] rounded-[14px] flex items-center justify-center text-[#D4AF37]">
                  <Trophy className="w-6 h-6 animate-bounce" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#06101e] text-[10px] font-black uppercase">
                    বিশেষ নোটিশ ও পুরস্কার
                  </span>
                  <span className="text-[11px] text-amber-200/70 font-mono">
                    ঘোষণাকারী: {announcement.author_name}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                  {announcement.title}
                </h3>
              </div>
            </div>

            {isAdmin && (
              <span className="px-2 py-1 rounded-xl bg-white/10 text-xs text-[#D4AF37] border border-[#D4AF37]/30">
                এডমিন প্যানেল
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed pl-1">
            {announcement.content}
          </p>

          {announcement.prize_details && (
            <div className="p-3 rounded-2xl bg-black/40 border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
                <Gift className="w-4 h-4 shrink-0" />
                <span>{announcement.prize_details}</span>
              </div>
              {announcement.deadline && (
                <div className="flex items-center gap-1.5 text-white/60 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>শেষ তারিখ: {announcement.deadline}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Top Banner: Messenger & Calling Hub */}
      <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F59E0B] p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center text-[#D4AF37]">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#D4AF37]">দ্বীনি মেসেঞ্জার ও এইচডি কল</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{formatBanglaNumber(allCommunityMembers.length)} জন সক্রিয়</span>
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                ফেসবুকের মতো ফ্রেন্ড রিকোয়েস্ট, ১-অন-১ প্রাইভেট চ্যাট, ছবি-ভয়েস শেয়ার ও সরাসরি কল
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareMyAmal}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:brightness-110 text-[#0a1628] rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title="আমার আজকের আমল স্কোর পোস্ট করুন"
            >
              <Sparkles className="w-4 h-4" />
              <span>আমল স্কোর শেয়ার</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 p-1 bg-black/50 rounded-2xl border border-white/10 text-xs sm:text-sm font-bold">
          <button
            onClick={() => {
              setActiveTab('messenger');
              setSelectedChatUser(null);
            }}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'messenger'
                ? 'bg-[#D4AF37] text-[#0a1628] shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">ইনবক্স চ্যাট</span>
            <span className="sm:hidden">ইনবক্স</span>
          </button>

          <button
            onClick={() => setActiveTab('majlis')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'majlis'
                ? 'bg-[#D4AF37] text-[#0a1628] shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">আমল মজলিস</span>
            <span className="sm:hidden">মজলিস</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'directory'
                ? 'bg-[#D4AF37] text-[#0a1628] shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">দ্বীনি ভাইদের তালিকা</span>
            <span className="sm:hidden">ডিরেক্টরি</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'requests'
                ? 'bg-[#D4AF37] text-[#0a1628] shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>অনুরোধ</span>
            {pendingIncomingRequests.length > 0 && (
              <span className="absolute top-1.5 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                {pendingIncomingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: 1-ON-1 MESSENGER (INBOX & CHAT) */}
      {activeTab === 'messenger' && (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden">
          {!selectedChatUser ? (
            /* CONVERSATION INBOX LIST */
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm sm:text-base font-bold text-[#D4AF37] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>ব্যক্তিগত ইনবক্স (বন্ধুদের বার্তা ও কল)</span>
                </h3>
                <span className="text-xs text-white/50">ট্যাপ করে সরাসরি কথা বলুন</span>
              </div>

              <div className="space-y-2">
                {allCommunityMembers
                  .filter((m) => isFriend(m.id))
                  .map((member) => {
                    const conv = liveConversations.find((c) =>
                      c.participants?.includes(member.id)
                    );
                    const lastMsg = conv?.lastMessage;
                    const isUnread =
                      lastMsg &&
                      lastMsg.senderId !== user?.id &&
                      !lastMsg.isRead;
                    const liveMember =
                      allUsers.find((u) => u.id === member.id) || member;

                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedChatUser(member)}
                        className={`p-3.5 rounded-2xl bg-black/40 hover:bg-white/10 border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                          isUnread
                            ? 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                            : 'border-white/5 hover:border-[#D4AF37]/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-0.5 flex items-center justify-center shadow-md">
                              <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center text-sm font-bold text-[#D4AF37]">
                                {member.photo ? (
                                  <img src={member.photo} alt={member.name} className="w-full h-full object-cover rounded-[14px]" />
                                ) : (
                                  member.name.charAt(0)
                                )}
                              </div>
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#060e1b] ${
                                liveMember.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors truncate">
                                {member.name}
                              </h4>
                              {member.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[9px] font-bold">
                                  পরিচালক
                                </span>
                              )}
                              {isUnread && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#D4AF37] text-[#060e1b] text-[9px] font-black animate-pulse">
                                  নতুন বার্তা
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/60 truncate mt-0.5">
                              {lastMsg ? (
                                lastMsg.messageType === 'image'
                                  ? '📷 ছবি'
                                  : lastMsg.messageType === 'audio'
                                  ? '🎤 ভয়েস বার্তা'
                                  : lastMsg.text
                              ) : (
                                'বার্তা আদান-প্রদান করতে ক্লিক করুন...'
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Quick Call Actions & Timestamp */}
                        <div className="flex items-center gap-2 shrink-0">
                          {lastMsg && (
                            <span className="text-[10px] text-white/40 hidden sm:inline">
                              {formatMessageTime(lastMsg.createdAt)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCall(member, 'audio');
                            }}
                            className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-300 border border-emerald-500/30 transition-all active:scale-95"
                            title="সরাসরি অডিও কল"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCall(member, 'video');
                            }}
                            className="p-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500 hover:text-white text-blue-300 border border-blue-500/30 transition-all active:scale-95"
                            title="সরাসরি ভিডিও কল"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* ACTIVE 1-ON-1 MESSENGER SCREEN */
            <div className="flex flex-col h-[580px]">
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 bg-black/70 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => setSelectedChatUser(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                    title="ইনবক্সে ফিরে যান"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div
                    onClick={() => setSelectedProfileUser(selectedChatUser)}
                    className="relative cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-0.5 flex items-center justify-center">
                      <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                        {selectedChatUser.photo ? (
                          <img src={selectedChatUser.photo} alt={selectedChatUser.name} className="w-full h-full object-cover rounded-[14px]" />
                        ) : (
                          selectedChatUser.name.charAt(0)
                        )}
                      </div>
                    </div>
                    {(() => {
                      const livePartner =
                        allUsers.find((u) => u.id === selectedChatUser.id) || selectedChatUser;
                      return (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#060e1b] ${
                            livePartner.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                        />
                      );
                    })()}
                  </div>

                  <div className="min-w-0 cursor-pointer" onClick={() => setSelectedProfileUser(selectedChatUser)}>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                      <span>{selectedChatUser.name}</span>
                      {selectedChatUser.role === 'admin' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      )}
                    </h3>
                    {(() => {
                      const livePartner =
                        allUsers.find((u) => u.id === selectedChatUser.id) || selectedChatUser;
                      return livePartner.isOnline ? (
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>অনলাইনে সক্রিয়</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-white/50 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          <span>
                            {livePartner.lastActiveAt
                              ? `সর্বশেষ সক্রিয়: ${formatMessageTime(livePartner.lastActiveAt)}`
                              : 'অফলাইন'}
                          </span>
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Direct Calling Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartCall(selectedChatUser, 'audio')}
                    className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 hover:text-white text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    title="সরাসরি অডিও কল"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden sm:inline">অডিও কল</span>
                  </button>

                  <button
                    onClick={() => handleStartCall(selectedChatUser, 'video')}
                    className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600 hover:text-white text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    title="সরাসরি ভিডিও কল"
                  >
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">ভিডিও কল</span>
                  </button>
                </div>
              </div>

              {/* Chat Stream (Firestore Realtime onSnapshot) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {realtimeMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40 space-y-2">
                    <MessageSquare className="w-10 h-10 text-[#D4AF37]/50" />
                    <p className="text-sm font-semibold text-white/70">কথোপকথন শুরু করুন</p>
                    <p className="text-xs max-w-xs">
                      {selectedChatUser.name}-এর সাথে আপনার চ্যাট রিয়েল-টাইমে এন্ড-টু-এন্ড সুরক্ষিত।
                    </p>
                  </div>
                )}

                {realtimeMessages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  const displayTime = formatMessageTime(msg.createdAt);
                  const imageUrl = msg.imageUrl;
                  const audioUrl = msg.audioUrl;
                  const msgType = msg.messageType;

                  return (
                    <div
                      key={msg.messageId}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg relative ${
                          isMe
                            ? 'bg-[#152542] text-white border border-[#D4AF37]/40 rounded-tr-none'
                            : 'bg-black/50 text-white/90 border border-white/10 rounded-tl-none'
                        }`}
                      >
                        {/* Image Message */}
                        {imageUrl && (
                          <div
                            className="mb-2 rounded-xl overflow-hidden border border-white/10 cursor-pointer"
                            onClick={() => setLightboxImage(imageUrl || null)}
                          >
                            <img
                              src={imageUrl}
                              alt="Shared"
                              className="w-full max-h-60 object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        {/* Voice Audio Message */}
                        {msgType === 'audio' ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (playingVoiceId === msg.messageId) {
                                  setPlayingVoiceId(null);
                                } else {
                                  setPlayingVoiceId(msg.messageId);
                                  if (audioUrl) {
                                    const audio = new Audio(audioUrl);
                                    audio.play().catch(() => {});
                                    audio.onended = () => setPlayingVoiceId(null);
                                  } else {
                                    setTimeout(() => setPlayingVoiceId(null), 3500);
                                  }
                                }
                              }}
                              className="w-9 h-9 rounded-full bg-[#D4AF37] text-[#0a1628] flex items-center justify-center shadow-md active:scale-95 transition-transform"
                            >
                              {playingVoiceId === msg.messageId ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-[#D4AF37]">ভয়েস বার্তা</span>
                                <span className="text-[10px] text-white/60">
                                  ({formatBanglaNumber(msg.voiceDuration || 4)} সে.)
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[3, 7, 5, 9, 6, 4, 8, 5, 9, 4, 7, 3].map((h, i) => (
                                  <span
                                    key={i}
                                    className={`w-1 rounded-full ${
                                      playingVoiceId === msg.messageId
                                        ? 'bg-[#D4AF37] animate-pulse'
                                        : 'bg-white/40'
                                    }`}
                                    style={{ height: `${h * 2}px` }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : msgType === 'amal_share' ? (
                          /* Amal Point Share Bubble */
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 text-emerald-400 font-bold border-b border-emerald-500/20 pb-1">
                              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>আজকের আমল স্কোর রিপোর্ট</span>
                            </div>
                            <p>{msg.text}</p>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}

                        {/* Reactions on bubble */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {Object.entries(msg.reactions).map(([emoji, uids]) => {
                              const list = (uids || []) as string[];
                              if (list.length === 0) return null;
                              return (
                                <span
                                  key={emoji}
                                  onClick={() =>
                                    handleToggleReaction(
                                      msg.messageId,
                                      emoji,
                                      true,
                                      selectedChatUser.id
                                    )
                                  }
                                  className="px-1.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-[11px] cursor-pointer"
                                >
                                  {emoji} {formatBanglaNumber(list.length)}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Timestamp, Seen Status & Actions Bar */}
                      <div className="flex items-center gap-2 text-[10px] text-white/50 mt-1 px-1">
                        <span>{displayTime}</span>
                        {isMe &&
                          (msg.isRead ? (
                            <span title="দেখা হয়েছে (Seen)" className="flex items-center gap-0.5 text-[#D4AF37]">
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span className="text-[9px]">দেখা হয়েছে</span>
                            </span>
                          ) : (
                            <span title="পাঠানো হয়েছে (Sent)" className="flex items-center gap-0.5 text-white/40">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ))}

                        {/* Sender Delete Message button */}
                        {isMe && (
                          <button
                            type="button"
                            onClick={() => handleDeletePrivateMessage(msg.messageId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-white/40 hover:text-rose-400"
                            title="বার্তা মুছুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        {/* Reaction Trigger Bar */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                          {['🤲', '❤️', '👍', '🕌', '👏'].map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() =>
                                handleToggleReaction(
                                  msg.messageId,
                                  em,
                                  true,
                                  selectedChatUser.id
                                )
                              }
                              className="hover:scale-125 transition-transform"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Recipient Realtime Typing Indicator */}
                {Boolean(activeConversation?.typing?.[selectedChatUser.id]) && (
                  <div className="flex items-center gap-2 text-xs text-[#D4AF37] px-2 py-1">
                    <span className="font-semibold">{selectedChatUser.name} টাইপ করছেন...</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce delay-150" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce delay-300" />
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Islamic Quick Phrases */}
              <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-white/50 shrink-0">দ্রুত বার্তা:</span>
                {['আসসালামু আলাইকুম', 'আলহামদুলিল্লাহ', 'জাযাকাল্লাহু খাইরান', 'দোয়ার দরখাস্ত', 'মাশাআল্লাহ', 'ইনশাআল্লাহ'].map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => handleSendPrivateMessage(phrase)}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-white/80 shrink-0 transition-colors"
                  >
                    {phrase}
                  </button>
                ))}
              </div>

              {/* Image Preview before sending */}
              {selectedImagePreview && (
                <div className="p-2 bg-black/70 border-t border-white/10 flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D4AF37]">
                    <img src={selectedImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setSelectedImagePreview(null)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="text-xs text-white/70">ছবি সংযুক্ত করা হয়েছে (পাঠাতে সেন্ড বাটনে চাপ দিন)</span>
                </div>
              )}

              {/* Message Composer Bar */}
              <div className="p-3 bg-black/70 border-t border-white/10 flex items-center gap-2">
                {/* Image Picker */}
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#D4AF37] transition-all"
                  title="ছবি বা ফটো পাঠান"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Voice Note Button */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`p-2.5 rounded-2xl transition-all flex items-center justify-center shrink-0 ${
                    isRecordingVoice
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-[#D4AF37]'
                  }`}
                  title={isRecordingVoice ? 'ভয়েস রেকর্ড সম্পন্ন ও পাঠান' : 'ভয়েস বার্তা রেকর্ড করুন'}
                >
                  {isRecordingVoice ? (
                    <div className="flex items-center gap-1 text-xs font-bold px-1">
                      <MicOff className="w-4 h-4" />
                      <span>{formatBanglaNumber(voiceDuration)}s</span>
                    </div>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="text"
                  placeholder="মেসেঞ্জারের মতো বার্তা লিখুন..."
                  value={messageInput}
                  onChange={(e) => handleMessageInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendPrivateMessage();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-black/40 border border-white/15 rounded-2xl text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                />

                <button
                  type="button"
                  onClick={() => handleSendPrivateMessage()}
                  className="px-4 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">পাঠান</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBLIC GROUP MAJLIS */}
      {activeTab === 'majlis' && (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl flex flex-col h-[540px] overflow-hidden">
          <div className="px-5 py-2.5 bg-black/50 border-b border-white/10 flex items-center justify-between text-xs text-white/70">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>দ্বীনি আলোচনা ও পরামর্শের উন্মুক্ত মজলিস (সবার বার্তা সবাই দেখতে পারবেন)</span>
            </span>
            <span className="text-[#D4AF37] font-semibold hidden sm:inline">গ্রুপ ফোরাম</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {majlisMessages.map((msg) => {
              const isMine = msg.sender_id === (user?.id || 'current-user');
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'} group`}
                >
                  <div
                    onClick={() => {
                      const found = allCommunityMembers.find((m) => m.id === msg.sender_id);
                      if (found) setSelectedProfileUser(found);
                    }}
                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-0.5 shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <div className="w-full h-full bg-[#060e1b] rounded-[10px] flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                      {msg.sender_avatar ? (
                        <img src={msg.sender_avatar} alt={msg.sender_name} className="w-full h-full object-cover rounded-[10px]" />
                      ) : (
                        msg.sender_name.charAt(0)
                      )}
                    </div>
                  </div>

                  <div className={`max-w-[85%] sm:max-w-[70%] space-y-1 ${isMine ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                      <span className="font-bold text-white/90">{msg.sender_name}</span>
                      {msg.sender_role === 'admin' ? (
                        <span className="px-2 py-0.2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[9px] font-bold">
                          পরিচালক
                        </span>
                      ) : msg.level ? (
                        <span className="px-2 py-0.2 rounded-full bg-white/10 text-[#D4AF37] text-[9px] font-medium">
                          {msg.level}
                        </span>
                      ) : null}
                      <span>•</span>
                      <span className="text-[10px]">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                        isMine
                          ? 'bg-[#152542] text-white border border-[#D4AF37]/40 rounded-tr-none'
                          : 'bg-black/50 text-white/90 border border-white/10 rounded-tl-none'
                      }`}
                    >
                      {msg.image_url && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => setLightboxImage(msg.image_url || null)}>
                          <img src={msg.image_url} alt="Shared" className="w-full max-h-60 object-cover" />
                        </div>
                      )}

                      {msg.type === 'audio' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (playingVoiceId === msg.id) {
                                setPlayingVoiceId(null);
                              } else {
                                setPlayingVoiceId(msg.id);
                                if (msg.audio_url) {
                                  const a = new Audio(msg.audio_url);
                                  a.play().catch(() => {});
                                  a.onended = () => setPlayingVoiceId(null);
                                } else {
                                  setTimeout(() => setPlayingVoiceId(null), 3500);
                                }
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0a1628] flex items-center justify-center shadow-md active:scale-95"
                          >
                            {playingVoiceId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                          <span className="text-xs font-bold text-[#D4AF37]">ভয়েস বার্তা ({formatBanglaNumber(msg.voice_duration || 4)} সে.)</span>
                        </div>
                      ) : msg.type === 'amal_share' ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-1">
                            <span className="font-bold text-emerald-300 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>দৈনিক আমল আপডেট</span>
                            </span>
                            <span className="text-xs font-black text-[#D4AF37] font-mono">
                              {formatBanglaNumber(msg.score || 0)} পয়েন্ট
                            </span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}

                      {/* Reactions on bubble */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {Object.entries(msg.reactions).map(([emoji, uids]) => {
                            const list = (uids || []) as string[];
                            if (list.length === 0) return null;
                            return (
                              <span
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className="px-1.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-[11px] cursor-pointer"
                              >
                                {emoji} {formatBanglaNumber(list.length)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Reaction trigger */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 inline-flex">
                      {['🤲', '❤️', '👍', '🕌', '👏'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, em)}
                          className="hover:scale-125 transition-transform"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {selectedImagePreview && (
            <div className="p-2 bg-black/70 border-t border-white/10 flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#D4AF37]">
                <img src={selectedImagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedImagePreview(null)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              <span className="text-xs text-white/70">ছবি নির্বাচিত হয়েছে</span>
            </div>
          )}

          <form onSubmit={handleSendMajlisMessage} className="p-3 bg-black/70 border-t border-white/10 flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#D4AF37] transition-all"
              title="ছবি পাঠান"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`p-2.5 rounded-2xl transition-all flex items-center justify-center shrink-0 ${
                isRecordingVoice
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-[#D4AF37]'
              }`}
              title="ভয়েস রেকর্ড করুন"
            >
              {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              placeholder="মজলিসে সবার উদ্দেশ্যে বার্তা বা নসিহত লিখুন..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-black/40 border border-white/15 rounded-2xl text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#D4AF37] hover:brightness-110 text-[#0a1628] font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">পাঠান</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MEMBER DIRECTORY & FRIEND REQUESTS */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="দ্বীনি ভাইদের নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredMembers.map((member) => {
              const alreadyFriend = isFriend(member.id);
              const requestPending = isRequestPending(member.id);

              return (
                <div
                  key={member.id}
                  className="p-5 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#D4AF37]/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => setSelectedProfileUser(member)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-0.5 shadow-md flex items-center justify-center">
                          <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center text-base font-bold text-[#D4AF37]">
                            {member.photo ? (
                              <img src={member.photo} alt={member.name} className="w-full h-full object-cover rounded-[14px]" />
                            ) : (
                              member.name.charAt(0)
                            )}
                          </div>
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#060e1b]" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-1">
                          <span>{member.name}</span>
                          {member.role === 'admin' && <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />}
                        </h4>
                        <p className="text-xs text-white/60 font-mono truncate">{member.phone}</p>
                        {member.role === 'admin' ? (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold">
                            পরিচালক ও এডমিন
                          </span>
                        ) : (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[10px] font-semibold">
                            দ্বীনি সাথী • বয়স {formatBanglaNumber(member.age)} বছর
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedProfileUser(member)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs flex items-center gap-1"
                      title="পূর্ণাঙ্গ প্রোফাইল দেখুন"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions: Friend Request or Direct Message/Call */}
                  <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                    {alreadyFriend ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedChatUser(member);
                            setActiveTab('messenger');
                          }}
                          className="py-2.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#060e1b] border border-[#D4AF37]/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>মেসেজ</span>
                        </button>
                        <button
                          onClick={() => handleStartCall(member, 'video')}
                          className="py-2.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <Video className="w-4 h-4" />
                          <span>কল দিন</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSendFriendRequest(member)}
                          disabled={requestPending}
                          className={`col-span-2 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                            requestPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                          }`}
                        >
                          {requestPending ? (
                            <>
                              <Clock className="w-4 h-4 animate-spin" />
                              <span>অনুরোধ পাঠানো হয়েছে (অপেক্ষমাণ)</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>বন্ধু হওয়ার অনুরোধ পাঠান</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FRIEND REQUESTS MANAGEMENT */}
      {activeTab === 'requests' && (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#D4AF37] flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>আগত ফ্রেন্ড রিকোয়েস্টসমূহ ({pendingIncomingRequests.length} টি)</span>
            </h3>
            <span className="text-xs text-white/50">গ্রহণ করলে একক চ্যাট ও কল করতে পারবেন</span>
          </div>

          {pendingIncomingRequests.length === 0 ? (
            <div className="py-12 text-center text-white/60 space-y-2">
              <UserCheck className="w-10 h-10 mx-auto text-white/20" />
              <p className="text-sm">বর্তমানে কোনো নতুন ফ্রেন্ড রিকোয়েস্ট নেই</p>
              <p className="text-xs text-white/40">ডিরেক্টরি থেকে নতুন দ্বীনি ভাইদের অনুরোধ পাঠান</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingIncomingRequests.map((req) => {
                const displayName = req.senderName || req.sender_name || 'দ্বীনি ভাই';
                const displayPhone = req.sender_phone || '';
                const displayDate = req.created_at || req.createdAt || '';
                const displayAvatar = req.senderAvatar || req.sender_avatar;

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-0.5 flex items-center justify-center">
                        <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center font-bold text-[#D4AF37] overflow-hidden">
                          {displayAvatar ? (
                            <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover rounded-[14px]" />
                          ) : (
                            displayName.charAt(0)
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{displayName}</h4>
                        {displayPhone && <p className="text-xs text-white/60 font-mono">{displayPhone}</p>}
                        {displayDate && <span className="text-[10px] text-white/40">তারিখ: {displayDate}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectFriendRequest(req)}
                        className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-2xl text-xs font-bold transition-all"
                      >
                        বাতিল
                      </button>
                      <button
                        onClick={() => handleAcceptFriendRequest(req)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>গ্রহণ করুন</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {selectedProfileUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#06101e] border-2 border-[#D4AF37] rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-[#D4AF37]">দ্বীনি প্রোফাইল পরিচিতি</span>
              <button
                onClick={() => setSelectedProfileUser(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 p-1 flex items-center justify-center shadow-xl">
                <div className="w-full h-full bg-[#060e1b] rounded-[14px] flex items-center justify-center text-2xl font-bold text-[#D4AF37]">
                  {selectedProfileUser.photo ? (
                    <img src={selectedProfileUser.photo} alt={selectedProfileUser.name} className="w-full h-full object-cover rounded-[14px]" />
                  ) : (
                    selectedProfileUser.name.charAt(0)
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>{selectedProfileUser.name}</span>
                  {selectedProfileUser.role === 'admin' && <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />}
                </h3>
                <p className="text-xs text-[#D4AF37] font-mono">{selectedProfileUser.phone}</p>
                <p className="text-[11px] text-white/60 font-mono">{selectedProfileUser.email}</p>
              </div>
            </div>

            {selectedProfileUser.bio && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/85 leading-relaxed">
                {selectedProfileUser.bio}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-white/50 block">বয়স:</span>
                <span className="font-bold text-white font-mono">{formatBanglaNumber(selectedProfileUser.age)} বছর</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-white/50 block">স্ট্যাটাস:</span>
                <span className="font-bold text-emerald-400">অনলাইনে সক্রিয়</span>
              </div>
            </div>

            {isFriend(selectedProfileUser.id) ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedChatUser(selectedProfileUser);
                    setSelectedProfileUser(null);
                    setActiveTab('messenger');
                  }}
                  className="py-2.5 bg-[#D4AF37] text-[#06101e] font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>মেসেজ পাঠান</span>
                </button>

                <button
                  onClick={() => {
                    const target = selectedProfileUser;
                    setSelectedProfileUser(null);
                    handleStartCall(target, 'video');
                  }}
                  className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>ভিডিও কল দিন</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => {
                    const target = selectedProfileUser;
                    handleSendFriendRequest(target);
                  }}
                  disabled={isRequestPending(selectedProfileUser.id)}
                  className={`w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all ${
                    isRequestPending(selectedProfileUser.id)
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {isRequestPending(selectedProfileUser.id) ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>অনুরোধ পাঠানো হয়েছে (অপেক্ষমাণ)</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>ফ্রেন্ড রিকোয়েস্ট পাঠান (চ্যাট করতে যুক্ত হন)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL SCREEN PHOTO LIGHTBOX */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fadeIn cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={lightboxImage} alt="Enlarged" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/20" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center text-sm font-bold border border-white/20"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
