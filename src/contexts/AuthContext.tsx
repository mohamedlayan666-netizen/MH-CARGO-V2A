import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { DEFAULT_COMMISSION_SETTINGS } from '../lib/constants';
import type { PlatformSetting, UserProfile, UserRole } from '../types/domain';

interface RegisterProfileInput {
  displayName: string;
  phone: string;
  companyName: string;
  role: UserRole;
  commercialRegister?: string;
  city?: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  authReady: boolean;
  needsRegistration: boolean;
  commissionSettings: PlatformSetting;
  signInWithGoogle: () => Promise<User>;
  registerProfile: (input: RegisterProfileInput) => Promise<void>;
  updateOwnProfile: (input: Partial<Pick<UserProfile, 'displayName' | 'phone' | 'companyName' | 'commercialRegister' | 'city'>>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [commissionSettings, setCommissionSettings] = useState<PlatformSetting>({
    ...DEFAULT_COMMISSION_SETTINGS,
    updatedBy: 'system',
  });

  // Load live platform commission settings
  useEffect(() => {
    const settingRef = doc(db, 'platformSettings', 'commissions');
    const unsub = onSnapshot(
      settingRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as PlatformSetting;
          setCommissionSettings(data);
        }
      },
      () => {
        // Fallback to defaults silently if settings doc has not been seeded yet
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setIsAdmin(false);
        setProfileChecked(true);
        setAuthReady(true);
        return;
      }

      setProfileChecked(false);

      try {
        const isBootstrappedAdmin =
          Boolean(user.emailVerified) &&
          user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

        let hasAdminDoc = false;
        try {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          hasAdminDoc = adminSnap.exists();
        } catch {
          hasAdminDoc = false;
        }

        const adminFlag = isBootstrappedAdmin || hasAdminDoc;
        setIsAdmin(adminFlag);

        const userRef = doc(db, 'users', user.uid);
        unsubProfile = onSnapshot(
          userRef,
          (snap) => {
            if (snap.exists()) {
              setProfile(snap.data() as UserProfile);
            } else {
              setProfile(null);
            }
            setProfileChecked(true);
            setAuthReady(true);
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
        );
      } catch (err) {
        console.error('Auth initialization error:', err);
        setProfileChecked(true);
        setAuthReady(true);
      }
    });

    return () => {
      if (unsubProfile) unsubProfile();
      unsubAuth();
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User> => {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  }, []);

  const registerProfile = useCallback(
    async (input: RegisterProfileInput): Promise<void> => {
      if (!auth.currentUser) {
        throw new Error('يجب تسجيل الدخول بحساب Google أولاً.');
      }
      const uid = auth.currentUser.uid;
      const email = auth.currentUser.email || '';
      const payload = {
        uid,
        displayName: input.displayName.trim().slice(0, 100),
        email: email.slice(0, 150),
        phone: input.phone.trim().slice(0, 30),
        companyName: input.companyName.trim().slice(0, 120),
        role: input.role,
        accountStatus: 'active' as const,
        commercialRegister: (input.commercialRegister || '').trim().slice(0, 60),
        city: (input.city || '').trim().slice(0, 80),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'users', uid), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
      }
    },
    []
  );

  const updateOwnProfile = useCallback(
    async (
      input: Partial<
        Pick<UserProfile, 'displayName' | 'phone' | 'companyName' | 'commercialRegister' | 'city'>
      >
    ): Promise<void> => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (input.displayName !== undefined) updateData.displayName = input.displayName.trim().slice(0, 100);
      if (input.phone !== undefined) updateData.phone = input.phone.trim().slice(0, 30);
      if (input.companyName !== undefined) updateData.companyName = input.companyName.trim().slice(0, 120);
      if (input.commercialRegister !== undefined) updateData.commercialRegister = input.commercialRegister.trim().slice(0, 60);
      if (input.city !== undefined) updateData.city = input.city.trim().slice(0, 80);

      try {
        await updateDoc(doc(db, 'users', uid), updateData);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    await signOut(auth);
  }, []);

  const needsRegistration = Boolean(firebaseUser && profileChecked && !profile && !isAdmin);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        isAdmin,
        authReady,
        needsRegistration,
        commissionSettings,
        signInWithGoogle,
        registerProfile,
        updateOwnProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
