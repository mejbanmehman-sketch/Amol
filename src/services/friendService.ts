import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FriendRequest, Friendship, User } from '../types';

/**
 * Send a friend request to another user
 */
export async function sendFriendRequest(
  sender: User,
  receiver: { id: string; name: string; avatar?: string }
): Promise<{ success: boolean; message: string; requestId?: string }> {
  try {
    if (!sender?.id || !receiver?.id) {
      return { success: false, message: 'প্রেরক বা প্রাপকের তথ্য অসম্পূর্ণ।' };
    }

    if (sender.id === receiver.id) {
      return { success: false, message: 'নিজেকে ফ্রেন্ড রিকোয়েস্ট পাঠানো যাবে না।' };
    }

    // 1. Check if already friends
    const friendshipQuery = query(
      collection(db, 'friendships'),
      where('participants', 'array-contains', sender.id)
    );
    const friendshipSnapshot = await getDocs(friendshipQuery);
    const alreadyFriends = friendshipSnapshot.docs.some((d) => {
      const data = d.data();
      return Array.isArray(data.participants) && data.participants.includes(receiver.id);
    });

    if (alreadyFriends) {
      return { success: false, message: 'আপনারা ইতিমধ্যে বন্ধু হিসেবে যুক্ত আছেন।' };
    }

    // 2. Check existing pending request
    const existingReqQuery = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', sender.id),
      where('receiverId', '==', receiver.id),
      where('status', '==', 'pending')
    );
    const existingSnap = await getDocs(existingReqQuery);
    if (!existingSnap.empty) {
      return { success: false, message: 'ইতিমধ্যে একটি ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে।' };
    }

    // Check if the other person already sent a request to me
    const reverseReqQuery = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', receiver.id),
      where('receiverId', '==', sender.id),
      where('status', '==', 'pending')
    );
    const reverseSnap = await getDocs(reverseReqQuery);
    if (!reverseSnap.empty) {
      // Automatically accept existing request from the other person
      const revDoc = reverseSnap.docs[0];
      await acceptFriendRequest(revDoc.id, sender, {
        id: receiver.id,
        name: receiver.name,
        avatar: receiver.avatar
      });
      return { success: true, message: 'উভয়দিক থেকে রিকোয়েস্ট থাকায় সরাসরি বন্ধু হওয়া সম্পন্ন হয়েছে!' };
    }

    // Create new friend request
    const reqRef = doc(collection(db, 'friendRequests'));
    const newReq: FriendRequest = {
      id: reqRef.id,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.photo || sender.avatar_url || '',
      senderRole: sender.role || 'user',
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverAvatar: receiver.avatar || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await setDoc(reqRef, newReq);

    // Also send an in-app notification to the receiver
    try {
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        userId: receiver.id,
        title: 'নতুন ফ্রেন্ড রিকোয়েস্ট',
        body: `${sender.name} আপনাকে ফ্রেন্ড রিকোয়েস্ট পাঠিয়েছেন।`,
        type: 'friend_request',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } catch {
      // Non-blocking notification
    }

    return { success: true, message: 'ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে!', requestId: reqRef.id };
  } catch (error: any) {
    console.error('sendFriendRequest error:', error);
    return { success: false, message: error.message || 'রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে।' };
  }
}

/**
 * Accept an incoming friend request
 */
export async function acceptFriendRequest(
  requestId: string,
  currentUser: User,
  senderUser: { id: string; name: string; avatar?: string; role?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const reqDocRef = doc(db, 'friendRequests', requestId);
    await updateDoc(reqDocRef, {
      status: 'accepted',
      updatedAt: new Date().toISOString()
    });

    // Create the friendship document with alphabetical/consistent IDs
    const participants = [currentUser.id, senderUser.id].sort();
    const friendshipId = `friendship_${participants[0]}_${participants[1]}`;
    const friendshipRef = doc(db, 'friendships', friendshipId);

    await setDoc(friendshipRef, {
      id: friendshipId,
      userA: participants[0],
      userB: participants[1],
      participants,
      createdAt: new Date().toISOString()
    });

    // Notify sender that their request was accepted
    try {
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        userId: senderUser.id,
        title: 'ফ্রেন্ড রিকোয়েস্ট গৃহীত হয়েছে',
        body: `${currentUser.name} আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন।`,
        type: 'friend_accepted',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } catch {}

    return { success: true, message: 'ফ্রেন্ড রিকোয়েস্ট গ্রহণ করা হয়েছে!' };
  } catch (error: any) {
    console.error('acceptFriendRequest error:', error);
    return { success: false, message: error.message || 'রিকোয়েস্ট গ্রহণ করতে সমস্যা হয়েছে।' };
  }
}

/**
 * Decline/Reject a friend request
 */
export async function declineFriendRequest(
  requestId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const reqDocRef = doc(db, 'friendRequests', requestId);
    await updateDoc(reqDocRef, {
      status: 'declined',
      updatedAt: new Date().toISOString()
    });
    return { success: true, message: 'রিকোয়েস্ট বাতিল করা হয়েছে।' };
  } catch (error: any) {
    console.error('declineFriendRequest error:', error);
    return { success: false, message: error.message || 'রিকোয়েস্ট বাতিল করতে ব্যর্থ হয়েছে।' };
  }
}

/**
 * Cancel an outgoing friend request
 */
export async function cancelFriendRequest(
  requestId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const reqDocRef = doc(db, 'friendRequests', requestId);
    await deleteDoc(reqDocRef);
    return { success: true, message: 'ফ্রেন্ড রিকোয়েস্ট প্রত্যাহার করা হয়েছে।' };
  } catch (error: any) {
    console.error('cancelFriendRequest error:', error);
    return { success: false, message: error.message || 'রিকোয়েস্ট প্রত্যাহার করতে ব্যর্থ হয়েছে।' };
  }
}

/**
 * Remove/Unfriend an existing friendship
 */
export async function unfriend(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const participants = [currentUserId, targetUserId].sort();
    const friendshipId = `friendship_${participants[0]}_${participants[1]}`;
    const friendshipRef = doc(db, 'friendships', friendshipId);
    await deleteDoc(friendshipRef);

    return { success: true, message: 'বন্ধু তালিকা থেকে সরানো হয়েছে।' };
  } catch (error: any) {
    console.error('unfriend error:', error);
    return { success: false, message: error.message || 'আনফ্রেন্ড করতে সমস্যা হয়েছে।' };
  }
}

/**
 * Subscribe to incoming pending friend requests in realtime
 */
export function subscribeToIncomingRequests(
  userId: string,
  callback: (requests: FriendRequest[]) => void
): () => void {
  if (!userId) return () => {};

  const q = query(
    collection(db, 'friendRequests'),
    where('receiverId', '==', userId),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as FriendRequest[];
      callback(requests);
    },
    (err) => {
      console.warn('subscribeToIncomingRequests error:', err);
    }
  );
}

/**
 * Subscribe to outgoing pending friend requests in realtime
 */
export function subscribeToOutgoingRequests(
  userId: string,
  callback: (requests: FriendRequest[]) => void
): () => void {
  if (!userId) return () => {};

  const q = query(
    collection(db, 'friendRequests'),
    where('senderId', '==', userId),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as FriendRequest[];
      callback(requests);
    },
    (err) => {
      console.warn('subscribeToOutgoingRequests error:', err);
    }
  );
}

/**
 * Subscribe to established friendships in realtime
 */
export function subscribeToFriendships(
  userId: string,
  callback: (friendUserIds: string[]) => void
): () => void {
  if (!userId) return () => {};

  const q = query(
    collection(db, 'friendships'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const friendIds: string[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (Array.isArray(data.participants)) {
          const friendId = data.participants.find((p: string) => p !== userId);
          if (friendId && !friendIds.includes(friendId)) {
            friendIds.push(friendId);
          }
        }
      });
      callback(friendIds);
    },
    (err) => {
      console.warn('subscribeToFriendships error:', err);
    }
  );
}
