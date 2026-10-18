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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  organization: Organization | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
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

  const fetchProfile = async () => {
    try {
      const res = await api.get<{ user: User; organization?: Organization }>('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        setRole(res.data.user.role);
        if (res.data.organization) {
          setOrganization(res.data.organization);
        }
      }
    } catch {
      // Profile fetch failed (e.g. backend sync pending)
    }
  };

  useEffect(() => {
    // Check initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await fetchProfile();
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

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setSession(data.session);
      await fetchProfile();
      toast.success('Signed in successfully');
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      setIsLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Registration failed to create user.' };
      }

      // Sync user and organization to backend PostgreSQL
      const syncRes = await api.post<{ user: User; organization?: Organization }>('/auth/sync', {
        supabaseId: authData.user.id,
        email: data.email,
        name: data.name,
        role: data.role,
        phone: data.phone,
        organizationName: data.organizationName,
        organizationType: data.organizationType,
        organizationAddress: data.organizationAddress,
        city: data.city,
      });

      if (syncRes.error) {
        console.warn('Backend sync warning:', syncRes.error.message);
      } else if (syncRes.data?.user) {
        setUser(syncRes.data.user);
        setRole(syncRes.data.user.role);
        if (syncRes.data.organization) {
          setOrganization(syncRes.data.organization);
        }
      }

      toast.success('Account created successfully');
      return { success: true };
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
      setUser(null);
      setSession(null);
      setRole(null);
      setOrganization(null);
      toast.success('Signed out');
    } catch (err) {
      console.error('Sign out error:', err);
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
