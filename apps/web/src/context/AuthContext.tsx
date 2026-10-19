import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/services/api';
import type { User, UserRole, Organization, OrganizationType } from '@mealbridge/shared';
import type { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

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

  const fetchProfile = async (fallbackSession?: Session | null): Promise<User | null> => {
    const currentSession = fallbackSession || session;

    try {
      const res = await api.get<{ user: User; organization?: Organization }>('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        setRole(res.data.user.role);
        setOrganization(res.data.organization || null);
        return res.data.user;
      }
    } catch (err) {
      console.warn('API /auth/me lookup notice:', err);
    }

    // If backend profile is not yet synced, construct clean representation from real Supabase session metadata
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

      const fallbackUser: User = {
        id: supaUser.id,
        email: supaUser.email || '',
        name: userName,
        role: userRole,
        phone: meta.phone,
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(fallbackUser);
      setRole(fallbackUser.role);
      setOrganization(null);
      return fallbackUser;
    }

    return null;
  };

  useEffect(() => {
    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        fetchProfile(session).finally(() => setIsLoading(false));
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
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
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

      // Synchronize session with database
      const loadedUser = await fetchProfile(data.session);
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

      const createdOrg: Organization | null = syncRes.data?.organization || null;

      setUser(createdUser);
      setRole(createdUser.role);
      setOrganization(createdOrg);
      if (authData.session) {
        setSession(authData.session);
      }

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
    await fetchProfile();
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
