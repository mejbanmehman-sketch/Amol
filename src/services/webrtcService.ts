import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CallSession, User } from '../types';

// Fallback Public STUN Servers
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' }
];

/**
 * Fetch ICE servers (STUN + Metered TURN UDP/TCP/TLS) from secure backend API
 * This ensures the Metered Secret Key is never exposed to client-side code
 */
export async function getIceServers(): Promise<RTCIceServer[]> {
  try {
    const response = await fetch('/api/webrtc-credentials');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        return data.iceServers;
      }
    }
  } catch (err) {
    console.warn('Could not fetch ICE servers from backend API, using default STUN:', err);
  }
  return DEFAULT_ICE_SERVERS;
}

function sanitizeAvatar(avatar?: string): string {
  if (!avatar || typeof avatar !== 'string') return '';
  // Never store base64 data URLs or excessively long strings in signaling documents
  if (avatar.startsWith('data:') || avatar.length > 500) {
    return '';
  }
  return avatar;
}

/**
 * Create a new Call document in Firestore with the caller's SDP offer
 */
export async function createCallSession(
  caller: User,
  receiver: { id: string; name: string; avatar?: string; phone?: string; role?: string },
  type: 'audio' | 'video',
  offer: RTCSessionDescriptionInit,
  callId?: string
): Promise<{ success: boolean; callId: string; error?: string }> {
  try {
    const activeCallId = callId || `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const currentUid = auth.currentUser?.uid || caller.id;
    const callDocRef = doc(db, 'calls', activeCallId);

    const payload = {
      callId: activeCallId,
      callerId: currentUid,
      callerName: caller.name || 'মুহাম্মাদ আব্দুল্লাহ',
      callerAvatar: sanitizeAvatar(caller.photo || caller.avatar_url),
      receiverId: receiver.id,
      receiverName: receiver.name || '',
      receiverAvatar: sanitizeAvatar(receiver.avatar),
      type,
      status: 'calling',
      offer: {
        type: offer.type,
        sdp: offer.sdp
      },
      answer: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      acceptedAt: null,
      endedAt: null,
      endedReason: null,
      duration: 0
    };

    await setDoc(callDocRef, payload);
    return { success: true, callId: activeCallId };
  } catch (err: any) {
    console.error('Error creating call session in Firestore:', err);
    return { success: false, callId: '', error: err.message || 'কল সংযোগ শুরু করা যায়নি' };
  }
}

/**
 * Answer an incoming call with receiver's SDP answer
 */
export async function answerCallSession(
  callId: string,
  answer: RTCSessionDescriptionInit
): Promise<boolean> {
  if (!callId) return false;
  try {
    const callDocRef = doc(db, 'calls', callId);
    await updateDoc(callDocRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      },
      status: 'connected',
      acceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.error('Error answering call in Firestore:', err);
    return false;
  }
}

/**
 * Decline an incoming call
 */
export async function declineCallSession(
  callId: string,
  sessionInfo?: Partial<CallSession>
): Promise<boolean> {
  if (!callId) return false;
  try {
    const callDocRef = doc(db, 'calls', callId);
    const snap = await getDoc(callDocRef).catch(() => null);
    if (!snap || !snap.exists()) {
      return false;
    }
    const data = snap.data();

    await updateDoc(callDocRef, {
      status: 'declined',
      endedAt: new Date().toISOString(),
      endedReason: 'declined',
      updatedAt: new Date().toISOString()
    }).catch((err) => {
      console.warn('Could not update call doc to declined:', err);
    });

    // Record in callHistory
    if (data) {
      await recordCallHistory({
        callId,
        callerId: data.callerId,
        callerName: data.callerName,
        callerAvatar: sanitizeAvatar(data.callerAvatar),
        receiverId: data.receiverId,
        receiverName: data.receiverName,
        receiverAvatar: sanitizeAvatar(data.receiverAvatar),
        type: data.type || 'audio',
        status: 'declined',
        duration: 0,
        startedAt: data.createdAt || new Date().toISOString()
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.warn('declineCallSession error:', err);
    return false;
  }
}

/**
 * End a call session (hang up, cancel, or timeout)
 */
export async function endCallSession(
  callId: string,
  duration: number = 0,
  reason: string = 'hangup'
): Promise<boolean> {
  if (!callId) return false;
  try {
    const callDocRef = doc(db, 'calls', callId);
    const snap = await getDoc(callDocRef).catch(() => null);
    if (!snap || !snap.exists()) {
      return false;
    }
    const data = snap.data();

    if (data.status !== 'ended' && data.status !== 'declined') {
      await updateDoc(callDocRef, {
        status: 'ended',
        endedAt: new Date().toISOString(),
        endedReason: reason,
        duration,
        updatedAt: new Date().toISOString()
      }).catch((err) => {
        console.warn('Could not update call doc to ended:', err);
      });
    }

    if (data) {
      await recordCallHistory({
        callId,
        callerId: data.callerId,
        callerName: data.callerName,
        callerAvatar: sanitizeAvatar(data.callerAvatar),
        receiverId: data.receiverId,
        receiverName: data.receiverName,
        receiverAvatar: sanitizeAvatar(data.receiverAvatar),
        type: data.type || 'audio',
        status: data.status === 'connected' ? 'completed' : 'missed',
        duration,
        startedAt: data.createdAt || new Date().toISOString()
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.warn('endCallSession error:', err);
    return false;
  }
}

/**
 * Save an ICE candidate to the appropriate subcollection
 */
export async function addIceCandidate(
  callId: string,
  role: 'caller' | 'receiver',
  candidate: RTCIceCandidate
): Promise<void> {
  try {
    const subcollectionName = role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
    const candidateColRef = collection(db, 'calls', callId, subcollectionName);
    await addDoc(candidateColRef, {
      candidate: candidate.toJSON(),
      createdAt: Date.now()
    });
  } catch (err) {
    console.warn(`Error adding ${role} ICE candidate:`, err);
  }
}

/**
 * Listen to remote ICE candidates from the opposite role
 */
export function listenToRemoteIceCandidates(
  callId: string,
  oppositeRole: 'caller' | 'receiver',
  onCandidate: (candidate: RTCIceCandidateInit) => void
): () => void {
  const subcollectionName = oppositeRole === 'caller' ? 'callerCandidates' : 'receiverCandidates';
  const candidateColRef = collection(db, 'calls', callId, subcollectionName);

  return onSnapshot(
    candidateColRef,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data?.candidate) {
            onCandidate(data.candidate);
          }
        }
      });
    },
    (err) => {
      console.warn(`Error listening to ${oppositeRole} ICE candidates:`, err);
    }
  );
}

/**
 * Listen to a specific call document's state in real-time
 */
export function listenToCallSession(
  callId: string,
  onUpdate: (data: any) => void
): () => void {
  const callDocRef = doc(db, 'calls', callId);
  return onSnapshot(
    callDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data());
      } else {
        onUpdate({ status: 'ended' });
      }
    },
    (err) => {
      console.error('Error listening to call session document:', err);
    }
  );
}

/**
 * Listen for incoming calls targeted to the current user
 */
export function listenForIncomingCalls(
  currentUserId: string,
  onIncomingCall: (session: CallSession | null) => void
): () => void {
  if (!currentUserId) return () => {};

  const callsQuery = query(
    collection(db, 'calls'),
    where('receiverId', '==', currentUserId),
    where('status', 'in', ['calling', 'ringing'])
  );

  return onSnapshot(
    callsQuery,
    (snapshot) => {
      if (snapshot.empty) {
        onIncomingCall(null);
        return;
      }

      // Pick the most recent call
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();

      // Check if call is within the last 60 seconds (ignore stale calls)
      const callCreatedAt = new Date(data.createdAt || 0).getTime();
      const now = Date.now();
      if (now - callCreatedAt > 65000) {
        // Stale call, automatically decline/ignore
        return;
      }

      const session: CallSession = {
        id: docSnap.id,
        callId: docSnap.id,
        caller: {
          id: data.callerId,
          name: data.callerName || 'Unknown Caller',
          avatar: data.callerAvatar,
          role: 'Member'
        },
        receiver: {
          id: data.receiverId,
          name: data.receiverName || 'User',
          avatar: data.receiverAvatar,
          role: 'Member'
        },
        type: data.type || 'audio',
        status: data.status || 'calling',
        offer: data.offer,
        started_at: callCreatedAt
      };

      onIncomingCall(session);
    },
    (err) => {
      console.warn('Error listening for incoming calls in Firestore:', err);
    }
  );
}

/**
 * Record completed or missed call in callHistory
 */
async function recordCallHistory(record: {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  type: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined' | 'failed';
  duration: number;
  startedAt: string;
}): Promise<void> {
  try {
    const historyColRef = collection(db, 'callHistory');
    await addDoc(historyColRef, {
      ...record,
      endedAt: new Date().toISOString(),
      participants: [record.callerId, record.receiverId]
    });
  } catch (err) {
    console.warn('Could not record call history:', err);
  }
}

// -------------------------------------------------------------
// Real-time Sound Synthesis (Incoming Ringtone & Outgoing Beep)
// -------------------------------------------------------------
class CallSoundSystem {
  private audioCtx: AudioContext | null = null;
  private timer: any = null;

  private getAudioContext(): AudioContext | null {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public startIncomingRingtone(): void {
    this.stop();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playChime = () => {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      const now = this.audioCtx.currentTime;
      // Melodic harmonious chime (F5 -> A5 -> C6)
      const freqs = [698.46, 880, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.09, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.65);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.65);
      });
    };

    playChime();
    this.timer = setInterval(playChime, 2400);
  }

  public startOutgoingDialTone(): void {
    this.stop();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playTone = () => {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      const now = this.audioCtx.currentTime;

      // Standard North American / International dual tone (440Hz + 480Hz)
      const osc1 = this.audioCtx!.createOscillator();
      const osc2 = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx!.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    };

    playTone();
    this.timer = setInterval(playTone, 3000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }
}

export const callSounds = new CallSoundSystem();
