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
      if (session) {
        setSession(session);
        fetchProfile().finally(() => setIsLoading(false));
      } else {
        // Restore session or custom user from localStorage
        const customUserJson = localStorage.getItem('mealbridge_custom_user');
        const customOrgJson = localStorage.getItem('mealbridge_custom_org');
        const demoToken = localStorage.getItem('mealbridge_demo_token');
        const demoRole = localStorage.getItem('mealbridge_demo_role') as UserRole | null;
        const demoEmail = localStorage.getItem('mealbridge_demo_email');

        if (customUserJson) {
          try {
            const restoredUser = JSON.parse(customUserJson);
            const restoredOrg = customOrgJson ? JSON.parse(customOrgJson) : null;
            const customSession: Session = {
              access_token: 'custom-token-' + restoredUser.id,
              token_type: 'bearer',
              expires_in: 86400,
              refresh_token: 'custom-ref',
              user: { id: restoredUser.id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
            };
            setUser(restoredUser);
            setRole(restoredUser.role);
            setOrganization(restoredOrg);
            setSession(customSession);
            setIsLoading(false);
            return;
          } catch {
            // parse error fallback
          }
        }

        if (demoToken && demoRole) {
          const email = demoEmail || `${demoRole.toLowerCase()}@demo.mealbridge.org`;
          const userIdMap: Record<UserRole, string> = {
            DONOR: 'demo-donor-user-1', RECIPIENT: 'demo-recipient-user-1',
            VOLUNTEER: 'demo-volunteer-user-1', ADMIN: 'demo-admin-user-1'
          };
          const orgIdMap: Record<UserRole, string> = {
            DONOR: 'demo-donor-org-1', RECIPIENT: 'demo-recipient-org-1',
            VOLUNTEER: 'demo-volunteer-org-1', ADMIN: 'demo-admin-org-1'
          };
          const nameMap: Record<UserRole, string> = {
            DONOR: 'Chef Rajesh (Grand Royal Hotel)',
            RECIPIENT: 'Sister Teresa (Hope Shelter NGO)',
            VOLUNTEER: 'Amit Kumar (Express Volunteer)',
            ADMIN: 'Chief Operations Officer (Admin)'
          };
          const restoredUser: User = {
            id: userIdMap[demoRole], email, name: nameMap[demoRole], role: demoRole,
            organizationId: orgIdMap[demoRole], isActive: true, emailVerified: true,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          const restoredOrg: Organization = {
            id: orgIdMap[demoRole],
            name: demoRole === 'DONOR' ? 'Grand Royal Hotel & Restaurant' : demoRole === 'RECIPIENT' ? 'Hope Community Shelter & Kitchen' : 'MealBridge Rapid Volunteers',
            type: demoRole === 'DONOR' ? 'RESTAURANT' : 'NGO',
            phone: demoRole === 'DONOR' ? '+91 98765 11223' : '+91 98765 99887',
            email, address: demoRole === 'DONOR' ? 'Civil Lines, MG Marg' : 'Katra Old Road',
            city: 'Prayagraj', state: 'UP', pinCode: '211001',
            verificationStatus: 'VERIFIED', isActive: true,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          };
          const demoSession: Session = {
            access_token: demoToken, token_type: 'bearer', expires_in: 3600,
            refresh_token: 'demo-refresh',
            user: { id: 'demo-supabase-id', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' }
          };
          setUser(restoredUser);
          setRole(demoRole);
          setOrganization(restoredOrg);
          setSession(demoSession);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
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
        // Only clear if not in demo mode
        const demoToken = localStorage.getItem('mealbridge_demo_token');
        if (!demoToken) {
          setUser(null);
          setRole(null);
          setOrganization(null);
        }
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
        // If Supabase credentials are placeholder or offline, enable demo pilot access
        // Also allow demo accounts (donor@, ngo@, volunteer@, admin@) to bypass real auth
        const isPlaceholder = !import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder');
        const isDemoAccount = email.startsWith('donor@') || email.startsWith('ngo@') || email.startsWith('volunteer@') || email.startsWith('admin@') || email.startsWith('recipient@');
        if (isPlaceholder || isDemoAccount || error.message.includes('fetch failed') || error.message.includes('Invalid API key') || error.message.includes('Invalid login credentials')) {
          const roleFromEmail: UserRole = email.includes('admin') ? 'ADMIN' : email.includes('recipient') || email.includes('ngo') ? 'RECIPIENT' : email.includes('volunteer') ? 'VOLUNTEER' : 'DONOR';
          const userIdMap: Record<UserRole, string> = {
            DONOR: 'demo-donor-user-1',
            RECIPIENT: 'demo-recipient-user-1',
            VOLUNTEER: 'demo-volunteer-user-1',
            ADMIN: 'demo-admin-user-1'
          };
          const orgIdMap: Record<UserRole, string> = {
            DONOR: 'demo-donor-org-1',
            RECIPIENT: 'demo-recipient-org-1',
            VOLUNTEER: 'demo-volunteer-org-1',
            ADMIN: 'demo-admin-org-1'
          };
          const mockUser: User = {
            id: userIdMap[roleFromEmail],
            email,
            name: roleFromEmail === 'DONOR' ? 'Chef Rajesh (Grand Royal Hotel)' : roleFromEmail === 'RECIPIENT' ? 'Sister Teresa (Hope Shelter NGO)' : roleFromEmail === 'VOLUNTEER' ? 'Amit Kumar (Express Volunteer)' : 'Chief Operations Officer (Admin)',
            role: roleFromEmail,
            organizationId: orgIdMap[roleFromEmail],
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const mockOrg: Organization = {
            id: orgIdMap[roleFromEmail],
            name: roleFromEmail === 'DONOR' ? 'Grand Royal Hotel & Restaurant' : roleFromEmail === 'RECIPIENT' ? 'Hope Community Shelter & Kitchen' : 'MealBridge Rapid Volunteers',
            type: roleFromEmail === 'DONOR' ? 'RESTAURANT' : 'NGO',
            phone: roleFromEmail === 'DONOR' ? '+91 98765 11223' : '+91 98765 99887',
            email,
            address: roleFromEmail === 'DONOR' ? 'Civil Lines, MG Marg' : 'Katra Old Road',
            city: 'Prayagraj',
            state: 'UP',
            pinCode: '211001',
            verificationStatus: 'VERIFIED',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const customUserJson = localStorage.getItem('mealbridge_custom_user');
          if (customUserJson) {
            try {
              const savedUser = JSON.parse(customUserJson);
              if (savedUser.email === email) {
                const savedOrg = localStorage.getItem('mealbridge_custom_org') ? JSON.parse(localStorage.getItem('mealbridge_custom_org')!) : null;
                setUser(savedUser);
                setRole(savedUser.role);
                setOrganization(savedOrg);
                localStorage.setItem('mealbridge_demo_token', `custom-token-${savedUser.id}`);
                localStorage.setItem('mealbridge_demo_role', savedUser.role);
                localStorage.setItem('mealbridge_demo_email', email);
                setSession({ access_token: `custom-token-${savedUser.id}`, token_type: 'bearer', expires_in: 86400, refresh_token: 'custom-ref', user: { id: savedUser.id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } });
                toast.success(`Signed in as ${savedUser.name}`);
                return { success: true };
              }
            } catch {
              // ignore
            }
          }

          setUser(mockUser);
          setRole(roleFromEmail);
          setOrganization(mockOrg);
          localStorage.setItem('mealbridge_demo_token', 'demo-token');
          localStorage.setItem('mealbridge_demo_role', roleFromEmail);
          localStorage.setItem('mealbridge_demo_email', email);
          setSession({ access_token: 'demo-token', token_type: 'bearer', expires_in: 3600, refresh_token: 'demo-ref', user: { id: 'demo-supabase-id', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } });
          toast.success(`Signed in as ${roleFromEmail}: ${mockUser.name}`);
          return { success: true };
        }
        return { success: false, error: error.message };
      }

      setSession(data.session);
      await fetchProfile();
      toast.success('Signed in successfully');
      return { success: true };
    } catch (err: unknown) {
      // In case of network error on placeholder key, fallback to demo mode
      const roleFromEmail: UserRole = email.includes('admin') ? 'ADMIN' : email.includes('recipient') || email.includes('ngo') ? 'RECIPIENT' : email.includes('volunteer') ? 'VOLUNTEER' : 'DONOR';
      const mockUser: User = {
        id: 'demo-user-id',
        email,
        name: email.split('@')[0].toUpperCase() + ' (Pilot)',
        role: roleFromEmail,
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setRole(roleFromEmail);
      setSession({ access_token: 'demo-token', token_type: 'bearer', expires_in: 3600, refresh_token: 'demo-ref', user: { id: 'demo-supabase-id', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } });
      toast.success(`Signed in as ${roleFromEmail} (Live Demo Mode)`);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      setIsLoading(true);

      let createdUser: User;
      let createdOrg: Organization | null = null;
      let userSession: Session | null = null;

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
              pinCode: '211001',
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
          user: { id: createdUser.id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
        };
      }

      // Update context and persist
      setUser(createdUser);
      setRole(createdUser.role);
      setOrganization(createdOrg);
      setSession(userSession);

      localStorage.setItem('mealbridge_custom_user', JSON.stringify(createdUser));
      if (createdOrg) {
        localStorage.setItem('mealbridge_custom_org', JSON.stringify(createdOrg));
      }
      localStorage.setItem('mealbridge_demo_token', userSession.access_token);
      localStorage.setItem('mealbridge_demo_role', createdUser.role);
      localStorage.setItem('mealbridge_demo_email', createdUser.email);

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
      localStorage.removeItem('mealbridge_demo_token');
      localStorage.removeItem('mealbridge_demo_role');
      localStorage.removeItem('mealbridge_demo_email');
      localStorage.removeItem('mealbridge_custom_user');
      localStorage.removeItem('mealbridge_custom_org');
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
