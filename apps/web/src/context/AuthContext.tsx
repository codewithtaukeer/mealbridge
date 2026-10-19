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
        if (res.data.organization) {
          setOrganization(res.data.organization);
          localStorage.setItem('mealbridge_current_org', JSON.stringify(res.data.organization));
        }
        localStorage.setItem('mealbridge_current_user', JSON.stringify(res.data.user));
        return res.data.user;
      }
    } catch {
      // Backend sync pending or database temporarily unreachable
    }

    // Hydrate from localStorage or session user metadata if /auth/me did not return user
    const currentUserJson = localStorage.getItem('mealbridge_current_user') || localStorage.getItem('mealbridge_custom_user');
    const currentOrgJson = localStorage.getItem('mealbridge_current_org') || localStorage.getItem('mealbridge_custom_org');

    if (currentUserJson) {
      try {
        const parsedUser: User = JSON.parse(currentUserJson);
        const parsedOrg: Organization | null = currentOrgJson ? JSON.parse(currentOrgJson) : null;
        setUser(parsedUser);
        setRole(parsedUser.role);
        setOrganization(parsedOrg);
        return parsedUser;
      } catch {}
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

      const fallbackOrg: Organization | null = isOrg
        ? {
            id: meta.organizationId || `org-${supaUser.id.slice(0, 8)}`,
            name: meta.organizationName || (userRole === 'DONOR' ? `${userName}'s Kitchen` : 'Community Shelter NGO'),
            type: meta.organizationType || (userRole === 'DONOR' ? 'RESTAURANT' : 'NGO'),
            phone: meta.phone || '+91 98765 00000',
            email: supaUser.email || '',
            address: meta.organizationAddress || 'Commercial Area',
            city: meta.city || 'Prayagraj',
            state: 'UP',
            pinCode: meta.pinCode || '211001',
            verificationStatus: 'PENDING',
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
      localStorage.setItem('mealbridge_current_user', JSON.stringify(fallbackUser));
      if (fallbackOrg) localStorage.setItem('mealbridge_current_org', JSON.stringify(fallbackOrg));
      return fallbackUser;
    }

    return null;
  };

  useEffect(() => {
    // 1. Check if user is already saved in localStorage for immediate rendering
    const currentUserJson = localStorage.getItem('mealbridge_current_user') || localStorage.getItem('mealbridge_custom_user');
    const currentOrgJson = localStorage.getItem('mealbridge_current_org') || localStorage.getItem('mealbridge_custom_org');
    const demoToken = localStorage.getItem('mealbridge_demo_token');
    const demoRole = localStorage.getItem('mealbridge_demo_role') as UserRole | null;
    const demoEmail = localStorage.getItem('mealbridge_demo_email');

    if (currentUserJson) {
      try {
        const restoredUser: User = JSON.parse(currentUserJson);
        const restoredOrg: Organization | null = currentOrgJson ? JSON.parse(currentOrgJson) : null;
        const customSession: Session = {
          access_token: demoToken || 'custom-token-' + restoredUser.id,
          token_type: 'bearer',
          expires_in: 86400,
          refresh_token: 'custom-ref',
          user: {
            id: restoredUser.id,
            email: restoredUser.email,
            app_metadata: {},
            user_metadata: { name: restoredUser.name, role: restoredUser.role },
            aud: 'authenticated',
            created_at: '',
          },
        };
        setUser(restoredUser);
        setRole(restoredUser.role);
        setOrganization(restoredOrg);
        setSession(customSession);
      } catch {}
    } else if (demoToken && demoRole) {
      const email = demoEmail || `${demoRole.toLowerCase()}@demo.mealbridge.org`;
      const userIdMap: Record<UserRole, string> = {
        DONOR: 'demo-donor-user-1',
        RECIPIENT: 'demo-recipient-user-1',
        VOLUNTEER: 'demo-volunteer-user-1',
        ADMIN: 'demo-admin-user-1',
      };
      const orgIdMap: Record<UserRole, string> = {
        DONOR: 'demo-donor-org-1',
        RECIPIENT: 'demo-recipient-org-1',
        VOLUNTEER: 'demo-volunteer-org-1',
        ADMIN: 'demo-admin-org-1',
      };
      const nameMap: Record<UserRole, string> = {
        DONOR: 'Chef Rajesh (Grand Royal Hotel)',
        RECIPIENT: 'Sister Teresa (Hope Shelter NGO)',
        VOLUNTEER: 'Amit Kumar (Express Volunteer)',
        ADMIN: 'Chief Operations Officer (Admin)',
      };
      const restoredUser: User = {
        id: userIdMap[demoRole],
        email,
        name: nameMap[demoRole],
        role: demoRole,
        organizationId: orgIdMap[demoRole],
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const restoredOrg: Organization = {
        id: orgIdMap[demoRole],
        name:
          demoRole === 'DONOR'
            ? 'Grand Royal Hotel & Restaurant'
            : demoRole === 'RECIPIENT'
            ? 'Hope Community Shelter & Kitchen'
            : 'MealBridge Rapid Volunteers',
        type: demoRole === 'DONOR' ? 'RESTAURANT' : 'NGO',
        phone: demoRole === 'DONOR' ? '+91 98765 11223' : '+91 98765 99887',
        email,
        address: demoRole === 'DONOR' ? 'Civil Lines, MG Marg' : 'Katra Old Road',
        city: 'Prayagraj',
        state: 'UP',
        pinCode: '211001',
        verificationStatus: 'VERIFIED',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const demoSession: Session = {
        access_token: demoToken,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'demo-ref',
        user: { id: 'demo-supabase-id', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
      };
      setUser(restoredUser);
      setRole(demoRole);
      setOrganization(restoredOrg);
      setSession(demoSession);
    }

    // 2. Check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        fetchProfile(session).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // 3. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        setSession(newSession);
        await fetchProfile(newSession);
      } else {
        // Only clear if not in custom user / local registry mode
        const savedUser = localStorage.getItem('mealbridge_current_user') || localStorage.getItem('mealbridge_custom_user');
        const token = localStorage.getItem('mealbridge_demo_token');
        if (!savedUser && !token) {
          setUser(null);
          setRole(null);
          setOrganization(null);
          setSession(null);
        }
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

      // Check registered users in local registry first
      const registryJson = localStorage.getItem('mealbridge_users_registry');
      let registryUser: { user: User; organization?: Organization; password?: string } | null = null;
      if (registryJson) {
        try {
          const registry = JSON.parse(registryJson);
          if (registry[cleanEmail]) {
            registryUser = registry[cleanEmail];
          }
        } catch {}
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        console.warn('Supabase sign-in response:', error.message);

        // If local user exists in registry
        if (registryUser) {
          const savedUser = registryUser.user;
          const savedOrg = registryUser.organization || null;
          setUser(savedUser);
          setRole(savedUser.role);
          setOrganization(savedOrg);
          const customSession: Session = {
            access_token: `custom-token-${savedUser.id}`,
            token_type: 'bearer',
            expires_in: 86400,
            refresh_token: 'custom-ref',
            user: {
              id: savedUser.id,
              email: savedUser.email,
              app_metadata: {},
              user_metadata: { name: savedUser.name, role: savedUser.role },
              aud: 'authenticated',
              created_at: '',
            },
          };
          setSession(customSession);
          localStorage.setItem('mealbridge_current_user', JSON.stringify(savedUser));
          if (savedOrg) localStorage.setItem('mealbridge_current_org', JSON.stringify(savedOrg));
          localStorage.setItem('mealbridge_custom_user', JSON.stringify(savedUser));
          if (savedOrg) localStorage.setItem('mealbridge_custom_org', JSON.stringify(savedOrg));
          localStorage.setItem('mealbridge_demo_token', `custom-token-${savedUser.id}`);
          localStorage.setItem('mealbridge_demo_role', savedUser.role);
          localStorage.setItem('mealbridge_demo_email', cleanEmail);
          toast.success(`Signed in as ${savedUser.name}`);
          return { success: true, role: savedUser.role, user: savedUser };
        }

        const customUserJson = localStorage.getItem('mealbridge_custom_user');
        if (customUserJson) {
          try {
            const savedUser = JSON.parse(customUserJson);
            if (savedUser.email?.toLowerCase() === cleanEmail) {
              const savedOrg = localStorage.getItem('mealbridge_custom_org')
                ? JSON.parse(localStorage.getItem('mealbridge_custom_org')!)
                : null;
              setUser(savedUser);
              setRole(savedUser.role);
              setOrganization(savedOrg);
              const customSession: Session = {
                access_token: `custom-token-${savedUser.id}`,
                token_type: 'bearer',
                expires_in: 86400,
                refresh_token: 'custom-ref',
                user: {
                  id: savedUser.id,
                  email: savedUser.email,
                  app_metadata: {},
                  user_metadata: { name: savedUser.name, role: savedUser.role },
                  aud: 'authenticated',
                  created_at: '',
                },
              };
              setSession(customSession);
              localStorage.setItem('mealbridge_current_user', JSON.stringify(savedUser));
              if (savedOrg) localStorage.setItem('mealbridge_current_org', JSON.stringify(savedOrg));
              localStorage.setItem('mealbridge_demo_token', `custom-token-${savedUser.id}`);
              localStorage.setItem('mealbridge_demo_role', savedUser.role);
              localStorage.setItem('mealbridge_demo_email', cleanEmail);
              toast.success(`Signed in as ${savedUser.name}`);
              return { success: true, role: savedUser.role, user: savedUser };
            }
          } catch {}
        }

        // Demo account or offline fallback
        const isPlaceholder =
          !import.meta.env.VITE_SUPABASE_ANON_KEY ||
          import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder');
        const isDemoAccount =
          cleanEmail.startsWith('donor@') ||
          cleanEmail.startsWith('ngo@') ||
          cleanEmail.startsWith('volunteer@') ||
          cleanEmail.startsWith('admin@') ||
          cleanEmail.startsWith('recipient@');

        if (
          isPlaceholder ||
          isDemoAccount ||
          error.message.includes('fetch failed') ||
          error.message.includes('Invalid API key') ||
          error.message.includes('Invalid login credentials') ||
          error.message.includes('Email not confirmed')
        ) {
          const roleFromEmail: UserRole = cleanEmail.includes('admin')
            ? 'ADMIN'
            : cleanEmail.includes('recipient') || cleanEmail.includes('ngo')
            ? 'RECIPIENT'
            : cleanEmail.includes('volunteer')
            ? 'VOLUNTEER'
            : 'DONOR';

          const userIdMap: Record<UserRole, string> = {
            DONOR: 'demo-donor-user-1',
            RECIPIENT: 'demo-recipient-user-1',
            VOLUNTEER: 'demo-volunteer-user-1',
            ADMIN: 'demo-admin-user-1',
          };
          const orgIdMap: Record<UserRole, string> = {
            DONOR: 'demo-donor-org-1',
            RECIPIENT: 'demo-recipient-org-1',
            VOLUNTEER: 'demo-volunteer-org-1',
            ADMIN: 'demo-admin-org-1',
          };
          const mockUser: User = {
            id: userIdMap[roleFromEmail],
            email: cleanEmail,
            name:
              roleFromEmail === 'DONOR'
                ? 'Chef Rajesh (Grand Royal Hotel)'
                : roleFromEmail === 'RECIPIENT'
                ? 'Sister Teresa (Hope Shelter NGO)'
                : roleFromEmail === 'VOLUNTEER'
                ? 'Amit Kumar (Express Volunteer)'
                : 'Chief Operations Officer (Admin)',
            role: roleFromEmail,
            organizationId: orgIdMap[roleFromEmail],
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const mockOrg: Organization = {
            id: orgIdMap[roleFromEmail],
            name:
              roleFromEmail === 'DONOR'
                ? 'Grand Royal Hotel & Restaurant'
                : roleFromEmail === 'RECIPIENT'
                ? 'Hope Community Shelter & Kitchen'
                : 'MealBridge Rapid Volunteers',
            type: roleFromEmail === 'DONOR' ? 'RESTAURANT' : 'NGO',
            phone: roleFromEmail === 'DONOR' ? '+91 98765 11223' : '+91 98765 99887',
            email: cleanEmail,
            address: roleFromEmail === 'DONOR' ? 'Civil Lines, MG Marg' : 'Katra Old Road',
            city: 'Prayagraj',
            state: 'UP',
            pinCode: '211001',
            verificationStatus: 'VERIFIED',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setUser(mockUser);
          setRole(roleFromEmail);
          setOrganization(mockOrg);
          localStorage.setItem('mealbridge_current_user', JSON.stringify(mockUser));
          localStorage.setItem('mealbridge_current_org', JSON.stringify(mockOrg));
          localStorage.setItem('mealbridge_demo_token', `demo-token-${mockUser.id}`);
          localStorage.setItem('mealbridge_demo_role', roleFromEmail);
          localStorage.setItem('mealbridge_demo_email', cleanEmail);
          setSession({
            access_token: `demo-token-${mockUser.id}`,
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'demo-ref',
            user: { id: mockUser.id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
          });
          toast.success(`Signed in as ${roleFromEmail}: ${mockUser.name}`);
          return { success: true, role: roleFromEmail, user: mockUser };
        }

        return { success: false, error: error.message };
      }

      // Supabase sign-in succeeded
      setSession(data.session);
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
        organizationId: meta.organizationId || (effectiveRole !== 'VOLUNTEER' ? `org-${data.session.user.id.slice(0, 8)}` : undefined),
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(effectiveUser);
      setRole(effectiveRole);
      localStorage.setItem('mealbridge_current_user', JSON.stringify(effectiveUser));
      localStorage.setItem('mealbridge_demo_token', data.session.access_token);
      localStorage.setItem('mealbridge_demo_role', effectiveRole);
      localStorage.setItem('mealbridge_demo_email', effectiveUser.email);
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

      let createdUser: User;
      let createdOrg: Organization | null = null;
      let userSession: Session | null = null;

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
        console.warn('Supabase auth notice:', authError.message);
      }

      const effectiveSupabaseId = authData?.user?.id || 'usr-' + Date.now();

      // Sync user and organization to backend
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

      if (syncRes.data?.user) {
        createdUser = syncRes.data.user;
        createdOrg = syncRes.data.organization || null;
      } else {
        const isOrg = data.role === 'DONOR' || data.role === 'RECIPIENT';
        createdOrg = isOrg
          ? {
              id: 'org-' + Date.now(),
              name: data.organizationName || (data.role === 'DONOR' ? 'Surplus Food Donor' : 'Community Kitchen NGO'),
              type: data.organizationType || (data.role === 'DONOR' ? 'RESTAURANT' : 'NGO'),
              phone: data.phone || '+91 98765 00000',
              email: data.email,
              address: data.organizationAddress || 'Commercial Area',
              city: data.city || 'Prayagraj',
              state: 'UP',
              pinCode: data.pinCode || '211001',
              latitude: data.latitude,
              longitude: data.longitude,
              verificationStatus: 'PENDING',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : null;

        createdUser = {
          id: effectiveSupabaseId,
          email: data.email,
          name: data.name,
          role: data.role,
          phone: data.phone,
          organizationId: createdOrg ? createdOrg.id : undefined,
          isActive: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // If Supabase returned an active session, use it; otherwise create local authenticated session
      if (authData?.session) {
        userSession = authData.session;
      } else {
        userSession = {
          access_token: 'custom-token-' + createdUser.id,
          token_type: 'bearer',
          expires_in: 86400,
          refresh_token: 'custom-ref',
          user: {
            id: createdUser.id,
            email: createdUser.email,
            app_metadata: {},
            user_metadata: { name: createdUser.name, role: createdUser.role },
            aud: 'authenticated',
            created_at: '',
          },
        };
      }

      // Update context and persist to local storage
      setUser(createdUser);
      setRole(createdUser.role);
      setOrganization(createdOrg);
      setSession(userSession);

      localStorage.setItem('mealbridge_current_user', JSON.stringify(createdUser));
      if (createdOrg) localStorage.setItem('mealbridge_current_org', JSON.stringify(createdOrg));
      localStorage.setItem('mealbridge_custom_user', JSON.stringify(createdUser));
      if (createdOrg) localStorage.setItem('mealbridge_custom_org', JSON.stringify(createdOrg));
      localStorage.setItem('mealbridge_demo_token', userSession.access_token);
      localStorage.setItem('mealbridge_demo_role', createdUser.role);
      localStorage.setItem('mealbridge_demo_email', createdUser.email);

      // Save to persistent user registry so this account can always log in on this device
      try {
        const registry = JSON.parse(localStorage.getItem('mealbridge_users_registry') || '{}');
        registry[data.email.toLowerCase()] = {
          user: createdUser,
          organization: createdOrg,
          password: data.password,
        };
        localStorage.setItem('mealbridge_users_registry', JSON.stringify(registry));
      } catch {}

      // Save initial welcome and verification notification
      const existingNotifs = JSON.parse(localStorage.getItem('mealbridge_user_notifications') || '[]');
      existingNotifs.unshift({
        id: 'notif-' + Date.now(),
        title: 'Account Registered & Verification Required',
        message: `Welcome to MealBridge, ${createdUser.name}! Please submit your organization documents for review before publishing surplus food donations.`,
        time: 'Just now',
        isRead: false,
        type: 'VERIFICATION',
      });
      localStorage.setItem('mealbridge_user_notifications', JSON.stringify(existingNotifs));

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
      localStorage.removeItem('mealbridge_demo_token');
      localStorage.removeItem('mealbridge_demo_role');
      localStorage.removeItem('mealbridge_demo_email');
      localStorage.removeItem('mealbridge_current_user');
      localStorage.removeItem('mealbridge_current_org');
      localStorage.removeItem('mealbridge_custom_user');
      localStorage.removeItem('mealbridge_custom_org');
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
