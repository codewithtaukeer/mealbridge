import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/services/api';
import type { User, UserRole, Organization, OrganizationType } from '@mealbridge/shared';
import type { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

/** Normalize status values returned by Prisma, Supabase REST, or older metadata. */
function normalizeVerificationStatus(value: unknown): Organization['verificationStatus'] {
  const raw = String(value ?? 'PENDING').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const normalized = raw === 'APPROVED' ? 'VERIFIED' : raw;
  const allowed: Organization['verificationStatus'][] = [
    'PENDING',
    'UNDER_REVIEW',
    'VERIFIED',
    'REJECTED',
    'SUSPENDED',
  ];
  return allowed.includes(normalized as Organization['verificationStatus'])
    ? (normalized as Organization['verificationStatus'])
    : 'PENDING';
}

function normalizeOrganization(value?: Organization | null): Organization | null {
  if (!value) return null;

  // Keep compatibility with either camelCase API responses or Supabase snake_case rows.
  const raw = value as Organization & { verification_status?: unknown };
  return {
    ...value,
    verificationStatus: normalizeVerificationStatus(
      raw.verificationStatus ?? raw.verification_status,
    ),
  };
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  organizationName?: string;
  organizationType?: OrganizationType;
  organizationAddress?: string;
  city?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  organization: Organization | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole; user?: User }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string; role?: UserRole; user?: User }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Guard against concurrent fetchProfile calls to avoid race conditions
  const isFetchingRef = React.useRef(false);

  const fetchProfile = async (fallbackSession?: Session | null): Promise<User | null> => {
    // Deduplicate concurrent calls: if already fetching, just wait
    if (isFetchingRef.current) return null;
    isFetchingRef.current = true;

    // Always get a fresh session from Supabase SDK — never rely on stale closure
    let currentSession = fallbackSession;
    if (!currentSession) {
      try {
        const { data } = await supabase.auth.getSession();
        currentSession = data.session;
      } catch {
        // fallthrough
      }
    }

    try {
      const res = await api.get<{ user: User; organization?: Organization }>('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        setRole(res.data.user.role);
        setOrganization(normalizeOrganization(res.data.organization || null));
        return res.data.user;
      }
    } catch (err) {
      console.warn('API /auth/me lookup notice:', err);
    }

    if (currentSession?.user) {
      const supaUser = currentSession.user;
      const meta = (supaUser.user_metadata || {}) as Record<string, any>;
      const userRole: UserRole =
        (meta.role as UserRole) ||
        (supaUser.email?.includes('admin')
          ? 'ADMIN'
          : supaUser.email?.includes('recipient') || supaUser.email?.includes('ngo')
          ? 'RECIPIENT'
          : supaUser.email?.includes('volunteer')
          ? 'VOLUNTEER'
          : 'DONOR');

      const userName = meta.name || supaUser.email?.split('@')[0] || 'User';

      const isOrg = userRole === 'DONOR' || userRole === 'RECIPIENT';
      const fallbackOrg: Organization | null = isOrg && (meta.organizationName || meta.organizationId)
        ? {
            id: meta.organizationId || `org-${supaUser.id.slice(0, 8)}`,
            name: meta.organizationName || `${userName}'s Kitchen`,
            type: meta.organizationType || (userRole === 'DONOR' ? 'RESTAURANT' : 'NGO'),
            phone: meta.phone || '+91 98765 00000',
            email: supaUser.email || '',
            address: meta.organizationAddress || 'Commercial Area',
            city: meta.city || 'Prayagraj',
            state: meta.state || 'UP',
            pinCode: meta.pinCode || '211001',
            verificationStatus: normalizeVerificationStatus(meta.verificationStatus),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : null;

      const fallbackUser: User = {
        id: supaUser.id,
        email: supaUser.email || '',
        name: userName,
        role: userRole,
        phone: meta.phone,
        organizationId: fallbackOrg?.id,
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(fallbackUser);
      setRole(fallbackUser.role);
      setOrganization(fallbackOrg);
      return fallbackUser;
    }

    return null;
  };

  useEffect(() => {
    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        fetchProfile(session).finally(() => {
          isFetchingRef.current = false;
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await fetchProfile(newSession);
      } else {
        setUser(null);
        setRole(null);
        setOrganization(null);
      }
      isFetchingRef.current = false;
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // A verification may be approved while this tab remains open. Refresh the profile
  // when the user returns to the app, even if a socket event was missed.
  useEffect(() => {
    let isRefreshingForVisibility = false;

    const refreshWhenActive = async () => {
      if (
        typeof document === 'undefined' ||
        document.visibilityState === 'hidden' ||
        isRefreshingForVisibility ||
        isFetchingRef.current
      ) {
        return;
      }

      isRefreshingForVisibility = true;
      let startedFetch = false;
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session || isFetchingRef.current) return;

        startedFetch = true;
        await fetchProfile(data.session);
      } catch (err) {
        console.warn('Profile refresh on app focus failed:', err);
      } finally {
        if (startedFetch) isFetchingRef.current = false;
        isRefreshingForVisibility = false;
      }
    };

    window.addEventListener('focus', refreshWhenActive);
    document.addEventListener('visibilitychange', refreshWhenActive);
    return () => {
      window.removeEventListener('focus', refreshWhenActive);
      document.removeEventListener('visibilitychange', refreshWhenActive);
    };
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole; user?: User }> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setSession(data.session);

      // Reset guard so signIn's own fetchProfile always runs
      isFetchingRef.current = false;

      // Synchronize session with database
      const loadedUser = await fetchProfile(data.session);
      isFetchingRef.current = false; // allow refreshProfile to work after

      const meta = (data.session.user.user_metadata || {}) as Record<string, any>;
      const effectiveRole: UserRole =
        loadedUser?.role ||
        (meta.role as UserRole) ||
        (cleanEmail.includes('admin')
          ? 'ADMIN'
          : cleanEmail.includes('recipient') || cleanEmail.includes('ngo')
          ? 'RECIPIENT'
          : cleanEmail.includes('volunteer')
          ? 'VOLUNTEER'
          : 'DONOR');

      const effectiveUser: User = loadedUser || {
        id: data.session.user.id,
        email: data.session.user.email || cleanEmail,
        name: meta.name || cleanEmail.split('@')[0],
        role: effectiveRole,
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(effectiveUser);
      setRole(effectiveRole);
      toast.success('Signed in successfully');
      return { success: true, role: effectiveRole, user: effectiveUser };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      return { success: false, error: message };
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  const signUp = async (
    data: SignUpData
  ): Promise<{ success: boolean; error?: string; role?: UserRole; user?: User }> => {
    try {
      setIsLoading(true);

      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/login`
          : 'https://mealbridge-three.vercel.app/login';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
            role: data.role,
            phone: data.phone,
            organizationName: data.organizationName,
            organizationType: data.organizationType,
            organizationAddress: data.organizationAddress,
            city: data.city,
            pinCode: data.pinCode,
            latitude: data.latitude,
            longitude: data.longitude,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      const effectiveSupabaseId = authData?.user?.id;
      if (!effectiveSupabaseId) {
        return { success: false, error: 'Registration failed: Supabase user ID was not generated.' };
      }

      if (authData.session) {
        setSession(authData.session);
      }

      // Sync user and organization to PostgreSQL database
      const syncRes = await api.post<{ user: User; organization?: Organization }>('/auth/sync', {
        supabaseId: effectiveSupabaseId,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        organizationName: data.organizationName,
        organizationType: data.organizationType,
        organizationAddress: data.organizationAddress,
        city: data.city,
        pinCode: data.pinCode,
      });

      if (syncRes.error) {
        console.warn('Backend sync warning:', syncRes.error.message);
      }

      const createdUser: User = syncRes.data?.user || {
        id: effectiveSupabaseId,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdOrg: Organization | null = syncRes.data?.organization || (data.organizationName ? {
        id: `org-${effectiveSupabaseId.slice(0, 8)}`,
        name: data.organizationName,
        type: data.organizationType || (data.role === 'DONOR' ? 'RESTAURANT' : 'NGO'),
        phone: data.phone || '+91 98765 00000',
        email: data.email,
        address: data.organizationAddress || 'Commercial Area',
        city: data.city || 'Prayagraj',
        state: 'UP',
        pinCode: data.pinCode || '211001',
        verificationStatus: 'PENDING',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : null);

      setUser(createdUser);
      setRole(createdUser.role);
      setOrganization(createdOrg);

      toast.success('Account created successfully! Welcome to MealBridge.');
      return { success: true, role: createdUser.role, user: createdUser };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      localStorage.clear();
      setUser(null);
      setSession(null);
      setRole(null);
      setOrganization(null);
      toast.success('Signed out');
    }
  };

  const refreshProfile = async () => {
    isFetchingRef.current = false; // always allow explicit refreshes
    await fetchProfile();
    isFetchingRef.current = false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        organization,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
