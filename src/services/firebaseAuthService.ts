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
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { User, UserRole, AccountStatus } from '../types';
import { normalizeBanglaPhone, isValidBanglaPhone } from '../utils/phoneUtils';

export interface DbUserRecord {
  uid: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  photo?: string;
  bio?: string;
  district?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  isOnline: boolean;
  createdAt: string;
  lastLoginAt: string;
  lastActiveAt: string;
  age: number;
  total_qaza: number;
  qaza_adaied: number;
}

// Map Firestore doc to app User model
export const mapDocToUser = (data: any, id: string): User => {
  // Realtime Presence: Consider user online if isOnline is true AND lastActiveAt is within 120 seconds
  const lastActive = data.lastActiveAt ? new Date(data.lastActiveAt).getTime() : 0;
  const isRecentlyActive = Date.now() - lastActive < 120 * 1000;
  const isOnline = Boolean(data.isOnline && isRecentlyActive);

  return {
    id: id,
    uid: id,
    email: data.email || '',
    phone: data.phone || '',
    name: data.name || 'ব্যবহারকারী',
    username: data.username || data.email?.split('@')[0] || '',
    age: data.age || 25,
    photo: data.photo || '',
    avatar_url: data.photo || '',
    bio: data.bio || '',
    district: data.district || '',
    total_qaza: data.total_qaza || 0,
    qaza_adaied: data.qaza_adaied || 0,
    is_verified_phone: data.is_verified_phone ?? true,
    is_verified_email: data.is_verified_email ?? true,
    role: (data.role as UserRole) || 'user',
    accountStatus: (data.accountStatus as AccountStatus) || 'active',
    isOnline,
    createdAt: data.createdAt || new Date().toISOString(),
    created_at: data.createdAt || new Date().toISOString(),
    lastLoginAt: data.lastLoginAt || new Date().toISOString(),
    lastActiveAt: data.lastActiveAt || new Date().toISOString(),
    is_banned: data.accountStatus === 'banned',
    is_suspended: data.accountStatus === 'suspended',
    is_public_profile: data.is_public_profile ?? true,
    phone_visibility: data.phone_visibility || 'friends'
  };
};

/**
 * Register a user via Firebase Authentication and create /users & /profiles records
 */
export async function registerWithFirebase(params: {
  email: string;
  pass: string;
  name: string;
  phone: string;
  age: number;
  district?: string;
  bio?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
}): Promise<{ success: boolean; user?: User; message: string }> {
  try {
    const normPhone = normalizeBanglaPhone(params.phone);
    if (!isValidBanglaPhone(normPhone)) {
      return {
        success: false,
        message: 'সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01860977699)।'
      };
    }

    // Check if phone number already registered in Firestore
    const existingPhoneQ = query(
      collection(db, 'users'),
      where('phone', '==', normPhone),
      limit(1)
    );
    const existingPhoneSnap = await getDocs(existingPhoneQ);
    if (!existingPhoneSnap.empty) {
      return {
        success: false,
        message: 'এই ফোন নম্বর দিয়ে ইতিমধ্যে একটি একাউন্ট রয়েছে। অনুগ্রহ করে সেই একাউন্টে লগইন করুন।'
      };
    }

    const cleanEmail = params.email && params.email.includes('@')
      ? params.email.trim().toLowerCase()
      : `${normPhone}@amaltracker.local`;

    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, params.pass);
    const fbUser = userCredential.user;
    const nowIso = new Date().toISOString();

    const username = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Determine initial role: if matching super admin email, grant super_admin
    const isSuperAdminEmail = cleanEmail === 'mahmudyahya941@gmail.com';
    const role: UserRole = isSuperAdminEmail ? 'super_admin' : 'user';

    const userDocData: DbUserRecord = {
      uid: fbUser.uid,
      name: params.name.trim(),
      username,
      email: cleanEmail,
      phone: normPhone,
      photo: '',
      bio: params.bio || '',
      district: params.district || 'ঢাকা',
      role,
      accountStatus: 'active',
      isOnline: true,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      lastActiveAt: nowIso,
      age: params.age || 25,
      total_qaza: 100,
      qaza_adaied: 0
    };

    // Write to /users/{uid}
    await setDoc(doc(db, 'users', fbUser.uid), userDocData);

    // Write to /profiles/{uid}
    await setDoc(doc(db, 'profiles', fbUser.uid), {
      userId: fbUser.uid,
      phoneVisibility: 'friends',
      isPublicProfile: true,
      donationTarget: 1000,
      preferredCity: 'Dhaka',
      updatedAt: nowIso
    });

    // Write to /presence/{uid}
    await setDoc(doc(db, 'presence', fbUser.uid), {
      userId: fbUser.uid,
      isOnline: true,
      lastSeen: nowIso,
      device: navigator.userAgent
    });

    const appUser = mapDocToUser(userDocData, fbUser.uid);
    return { success: true, user: appUser, message: 'রেজিস্ট্রেশন সফল হয়েছে!' };
  } catch (err: any) {
    let msg = 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
    if (err.code === 'auth/email-already-in-use') {
      msg = 'এই ইমেইল বা ফোন ঠিকানা দিয়ে ইতিমধ্যে একটি একাউন্ট রয়েছে। দয়া করে লগইন করুন।';
    } else if (err.code === 'auth/weak-password') {
      msg = 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'সঠিক ইমেইল ফরম্যাট দিন।';
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, message: msg };
  }
}

/**
 * Login user via Firebase Authentication and update lastLoginAt & presence
 * Supports email or phone number login
 */
export async function loginWithFirebase(
  identifier: string,
  pass: string
): Promise<{ success: boolean; user?: User; message: string }> {
  try {
    const rawInput = identifier.trim();
    const isEmail = rawInput.includes('@');
    const normPhone = normalizeBanglaPhone(rawInput);

    let targetEmail = '';

    if (isEmail) {
      targetEmail = rawInput.toLowerCase();
    } else {
      // Look up user by normalized phone in Firestore
      const phoneQuery = query(
        collection(db, 'users'),
        where('phone', '==', normPhone),
        limit(1)
      );
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty) {
        targetEmail = phoneSnap.docs[0].data().email || `${normPhone}@amaltracker.local`;
      } else {
        targetEmail = `${normPhone}@amaltracker.local`;
      }
    }

    let fbUser: FirebaseUser;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, pass);
      fbUser = userCredential.user;
    } catch (authErr: any) {
      // If admin logging in and account not yet created, bootstrap admin
      if (
        targetEmail === 'mahmudyahya941@gmail.com' &&
        (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential')
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, targetEmail, pass);
          fbUser = newCred.user;
        } catch {
          throw authErr;
        }
      } else {
        throw authErr;
      }
    }

    const nowIso = new Date().toISOString();
    const userRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userRef);

    let appUser: User;
    if (snap.exists()) {
      const data = snap.data();
      if (data.accountStatus === 'banned') {
        await signOut(auth);
        return {
          success: false,
          message: 'আপনার একাউন্টটি সাময়িকভাবে বা স্থায়ীভাবে স্থগিত করা হয়েছে। এডমিনের সাথে যোগাযোগ করুন।'
        };
      }

      await updateDoc(userRef, {
        lastLoginAt: nowIso,
        lastActiveAt: nowIso,
        isOnline: true
      });

      // Also update presence
      await setDoc(
        doc(db, 'presence', fbUser.uid),
        {
          userId: fbUser.uid,
          isOnline: true,
          lastSeen: nowIso,
          device: navigator.userAgent
        },
        { merge: true }
      );

      appUser = mapDocToUser({ ...data, lastLoginAt: nowIso, lastActiveAt: nowIso, isOnline: true }, fbUser.uid);
    } else {
      // Create user doc if signed in via Auth but missing Firestore doc
      const isSuperAdminEmail = targetEmail === 'mahmudyahya941@gmail.com';
      const fallbackData: DbUserRecord = {
        uid: fbUser.uid,
        name: isSuperAdminEmail ? 'মাওলানা মোঃ ইয়াহ্ইয়া মাহমুদ সিরাজী' : (fbUser.displayName || 'ব্যবহারকারী'),
        username: targetEmail.split('@')[0],
        email: targetEmail,
        phone: normPhone || '01860977699',
        role: isSuperAdminEmail ? 'super_admin' : 'user',
        accountStatus: 'active',
        isOnline: true,
        createdAt: nowIso,
        lastLoginAt: nowIso,
        lastActiveAt: nowIso,
        age: 26,
        total_qaza: 100,
        qaza_adaied: 0
      };
      await setDoc(userRef, fallbackData);
      await setDoc(doc(db, 'profiles', fbUser.uid), {
        userId: fbUser.uid,
        phoneVisibility: 'friends',
        isPublicProfile: true,
        updatedAt: nowIso
      });
      await setDoc(doc(db, 'presence', fbUser.uid), {
        userId: fbUser.uid,
        isOnline: true,
        lastSeen: nowIso
      });
      appUser = mapDocToUser(fallbackData, fbUser.uid);
    }

    return { success: true, user: appUser, message: 'লগইন সফল হয়েছে!' };
  } catch (err: any) {
    let msg = 'লগইন ব্যর্থ হয়েছে। ইমেইল ও পাসওয়ার্ড যাচাই করুন।';
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/invalid-credential'
    ) {
      msg = 'ভুল ইমেইল/ফোন বা পাসওয়ার্ড প্রদান করা হয়েছে।';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'অতিরিক্ত ভুল চেষ্টার কারণে সাময়িক ব্লক হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।';
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, message: msg };
  }
}

/**
 * Logout user from Firebase Auth & update offline status
 */
export async function logoutFromFirebase(uid?: string) {
  try {
    if (uid) {
      const nowIso = new Date().toISOString();
      await updateDoc(doc(db, 'users', uid), {
        isOnline: false,
        lastActiveAt: nowIso
      }).catch(() => {});

      await setDoc(
        doc(db, 'presence', uid),
        {
          userId: uid,
          isOnline: false,
          lastSeen: nowIso
        },
        { merge: true }
      ).catch(() => {});
    }
    await signOut(auth);
  } catch (err) {
    console.error('Logout error', err);
  }
}

/**
 * Update user heartbeat / presence
 */
export async function updateUserHeartbeat(uid: string) {
  if (!uid) return;
  const nowIso = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'users', uid), {
      lastActiveAt: nowIso,
      isOnline: true
    });
    await setDoc(
      doc(db, 'presence', uid),
      {
        userId: uid,
        isOnline: true,
        lastSeen: nowIso
      },
      { merge: true }
    );
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Log administrative actions to /adminActions for audit
 */
export async function logAdminAction(params: {
  adminId: string;
  adminName: string;
  targetUserId: string;
  action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'delete_user' | 'change_role' | 'broadcast';
  reason?: string;
}) {
  try {
    const actionRef = doc(collection(db, 'adminActions'));
    await setDoc(actionRef, {
      ...params,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to log admin action', err);
  }
}

/**
 * Subscribe to all users in Firestore in realtime (for Admin and Community Directory)
 */
export function subscribeToAllUsers(onUpdate: (users: User[]) => void): () => void {
  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, limit(200));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((docSnap) => {
          users.push(mapDocToUser(docSnap.data(), docSnap.id));
        });
        onUpdate(users);
      },
      (error) => {
        console.warn('Firestore users subscription error:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to setup users subscription:', err);
    return () => {};
  }
}

/**
 * Update user status in Firestore (ban, suspend, role)
 */
export async function updateUserAccountStatusInDb(
  userId: string,
  updates: { accountStatus?: AccountStatus; role?: UserRole }
) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (err) {
    console.error('Failed to update account status in DB', err);
    throw err;
  }
}
