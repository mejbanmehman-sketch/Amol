/**
 * Realtime Private Chat Service (Firestore backed)
 * Provides 1-on-1 private messaging between accepted friends
 */
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatMessage, Conversation, User } from '../types';

/**
 * Generate deterministic conversation ID for two users so duplicates never occur
 */
export function getDeterministicConversationId(uid1: string, uid2: string): string {
  if (!uid1 || !uid2) return '';
  const sorted = [uid1.trim(), uid2.trim()].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

/**
 * Ensure conversation document exists in Firestore
 */
export async function ensureConversation(
  currentUser: User,
  partner: User
): Promise<string> {
  const convId = getDeterministicConversationId(currentUser.id, partner.id);
  if (!convId) throw new Error('Invalid user IDs for conversation');

  const convRef = doc(db, 'conversations', convId);
  const now = new Date().toISOString();

  try {
    const existingSnap = await getDoc(convRef);
    if (!existingSnap.exists()) {
      await setDoc(convRef, {
        id: convId,
        conversationId: convId,
        participants: [currentUser.id, partner.id].sort(),
        participantDetails: {
          [currentUser.id]: {
            name: currentUser.name,
            avatar: currentUser.photo || '',
            role: currentUser.role || 'user'
          },
          [partner.id]: {
            name: partner.name,
            avatar: partner.photo || '',
            role: partner.role || 'user'
          }
        },
        createdAt: now,
        updatedAt: now,
        typing: {}
      });
    }
  } catch (error) {
    console.warn('ensureConversation check failed, attempting merge set:', error);
    await setDoc(
      convRef,
      {
        id: convId,
        conversationId: convId,
        participants: [currentUser.id, partner.id].sort(),
        updatedAt: now
      },
      { merge: true }
    );
  }

  return convId;
}

export interface SendMessageParams {
  conversationId: string;
  sender: User;
  receiver: User;
  text: string;
  messageType?: 'text' | 'image' | 'audio' | 'amal_share' | 'video_note';
  extra?: {
    imageUrl?: string;
    audioUrl?: string;
    voiceDuration?: number;
    score?: number;
    level?: string;
  };
}

/**
 * Send a real private message to Firestore
 */
export async function sendChatMessage({
  conversationId,
  sender,
  receiver,
  text,
  messageType = 'text',
  extra
}: SendMessageParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const now = new Date().toISOString();
    const msgRef = doc(collection(db, 'messages'));
    const messageId = msgRef.id;

    // 1. Prepare clean ChatMessage document adhering to schema
    const chatMsg: ChatMessage = {
      messageId,
      conversationId,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.photo || '',
      senderRole: sender.role || 'user',
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverAvatar: receiver.photo || '',
      text: text.trim(),
      createdAt: now,
      updatedAt: now,
      messageType,
      isRead: false,
      imageUrl: extra?.imageUrl,
      audioUrl: extra?.audioUrl,
      voiceDuration: extra?.voiceDuration,
      score: extra?.score,
      level: extra?.level,
      reactions: {}
    };

    // 2. Ensure conversation document exists first to satisfy security rules
    const convRef = doc(db, 'conversations', conversationId);
    await setDoc(
      convRef,
      {
        id: conversationId,
        conversationId,
        participants: [sender.id, receiver.id].sort(),
        participantDetails: {
          [sender.id]: {
            name: sender.name,
            avatar: sender.photo || '',
            role: sender.role || 'user'
          },
          [receiver.id]: {
            name: receiver.name,
            avatar: receiver.photo || '',
            role: receiver.role || 'user'
          }
        },
        lastMessage: {
          text: messageType === 'image' ? '📷 ছবি' : messageType === 'audio' ? '🎤 ভয়েস বার্তা' : text.trim(),
          senderId: sender.id,
          createdAt: now,
          isRead: false,
          messageType
        },
        updatedAt: now,
        [`typing.${sender.id}`]: false
      },
      { merge: true }
    );

    // 3. Write message document to messages collection
    await setDoc(msgRef, chatMsg);

    return { success: true, messageId };
  } catch (error: any) {
    console.error('sendChatMessage failed:', error);
    return { success: false, error: error.message || 'মেসেজ পাঠানো সম্ভব হয়নি' };
  }
}

/**
 * Realtime listener for messages in a conversation
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onMessages: (messages: ChatMessage[]) => void
): () => void {
  if (!conversationId) {
    onMessages([]);
    return () => {};
  }

  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push(docSnap.data() as ChatMessage);
      });

      // Sort client-side by createdAt ascending
      messages.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeA - timeB;
      });

      onMessages(messages);
    },
    (error) => {
      console.error('subscribeToConversationMessages error:', error);
    }
  );

  return unsubscribe;
}

/**
 * Mark all incoming unread messages as read in conversation
 */
export async function markConversationAsRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  if (!conversationId || !currentUserId) return;

  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('receiverId', '==', currentUserId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const now = new Date().toISOString();
    const updatePromises = snapshot.docs.map((docSnap) =>
      updateDoc(docSnap.ref, {
        isRead: true,
        updatedAt: now
      })
    );
    await Promise.all(updatePromises);

    // Update conversation lastMessage isRead if applicable
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      'lastMessage.isRead': true,
      updatedAt: now
    }).catch(() => {});
  } catch (error) {
    console.warn('markConversationAsRead failed:', error);
  }
}

/**
 * Set typing indicator status in conversation
 */
export async function setTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  if (!conversationId || !userId) return;
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await setDoc(
      convRef,
      {
        [`typing.${userId}`]: isTyping,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('setTypingStatus failed:', error);
  }
}

/**
 * Subscribe to a conversation document for typing status and metadata
 */
export function subscribeToConversation(
  conversationId: string,
  onUpdate: (conv: Conversation | null) => void
): () => void {
  if (!conversationId) {
    onUpdate(null);
    return () => {};
  }

  const convRef = doc(db, 'conversations', conversationId);
  const unsubscribe = onSnapshot(
    convRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as Conversation);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('subscribeToConversation error:', error);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to all conversations for current user to build real-time inbox
 */
export function subscribeToUserConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const convs: Conversation[] = [];
      snapshot.forEach((docSnap) => {
        convs.push(docSnap.data() as Conversation);
      });

      // Sort descending by updatedAt
      convs.sort((a, b) => {
        const timeA = new Date(a.updatedAt || 0).getTime();
        const timeB = new Date(b.updatedAt || 0).getTime();
        return timeB - timeA;
      });

      onUpdate(convs);
    },
    (error) => {
      console.warn('subscribeToUserConversations error:', error);
    }
  );

  return unsubscribe;
}

/**
 * Delete a message from Firestore (only allowed for sender or admin)
 */
export async function deleteChatMessage(messageId: string): Promise<boolean> {
  if (!messageId) return false;
  try {
    await deleteDoc(doc(db, 'messages', messageId));
    return true;
  } catch (error) {
    console.error('deleteChatMessage error:', error);
    return false;
  }
}

/**
 * Toggle emoji reaction on a message
 */
export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<void> {
  if (!messageId || !emoji || !userId) return;
  try {
    const msgRef = doc(db, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data() as ChatMessage;
    const reactions = data.reactions || {};
    const userList = reactions[emoji] || [];

    let updatedList: string[];
    if (userList.includes(userId)) {
      updatedList = userList.filter((id) => id !== userId);
    } else {
      updatedList = [...userList, userId];
    }

    const updatedReactions = { ...reactions, [emoji]: updatedList };
    await updateDoc(msgRef, {
      reactions: updatedReactions,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('toggleMessageReaction error:', error);
  }
}
