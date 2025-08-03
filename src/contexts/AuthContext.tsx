import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  user_type: string;
  user_role?: 'user' | 'admin' | 'moderator';
  unique_user_id?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
  bio?: string;
  location?: any;
  verification_status: string;
  verification_documents?: any;
  rating: number;
  total_ratings: number;
  is_active: boolean;
  preferred_language?: string;
  auto_translate_messages?: boolean;
  detect_language_automatically?: boolean;
  two_factor_enabled?: boolean;
  two_factor_secret?: string;
  two_factor_backup_codes?: string[];
  two_factor_verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  twoFactorRequired: boolean;
  twoFactorVerified: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; twoFactorRequired?: boolean }>;
  signInWithAdmin: (username: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  verifyTwoFactor: () => void;
  hasRole: (role: string) => boolean;
  isVerified: () => boolean;
  is2FAEnabled: () => boolean;
  canPerformTransactions: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  twoFactorRequired: false,
  twoFactorVerified: false,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithAdmin: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  updateProfile: async () => ({ error: null }),
  verifyTwoFactor: () => {},
  hasRole: () => false,
  isVerified: () => false,
  is2FAEnabled: () => false,
  canPerformTransactions: () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);

  const sendWelcomeEmail = async (emailType: string) => {
    if (!user || !profile) return;

    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          emailType: emailType,
          profileData: profile
        }
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle OAuth provider callback
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a new user from OAuth
          const isNewUser = session.user.created_at === session.user.updated_at;
          const provider = session.user.app_metadata?.provider;
          
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id, isNewUser, provider);
            }
          }, 0);
        } else if (session?.user) {
          // Regular sign-in
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Add timeout to prevent hanging on getSession
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 3000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!mounted) return;
        
        console.log('Initial session:', session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          console.log('No session, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Reduced fallback timeout to prevent long hangs
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Fallback timeout triggered, setting loading to false');
        setLoading(false);
      }
    }, 5000); // Reduced to 5 seconds

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, isNewUser = false, provider?: string) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching profile for user:', userId, { isNewUser, provider });
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('Profile fetch result:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else if (!data && isNewUser) {
        // Create profile for new OAuth users
        console.log('Creating new profile for OAuth user');
        await createOAuthProfile(userId, provider);
      } else {
        setProfile(data);
        console.log('Profile set:', data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      // Always set loading to false after attempting to fetch profile
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const createOAuthProfile = async (userId: string, provider?: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const userData = user.data.user;
      const metadata = userData.user_metadata || {};

      const profileData = {
        user_id: userId,
        user_type: 'buyer', // Default user type
        first_name: metadata.full_name?.split(' ')[0] || metadata.name?.split(' ')[0] || '',
        last_name: metadata.full_name?.split(' ').slice(1).join(' ') || metadata.name?.split(' ').slice(1).join(' ') || '',
        avatar_url: metadata.avatar_url || metadata.picture || null,
        verification_status: provider === 'google' ? 'pending' : 'unverified',
        rating: 0,
        total_ratings: 0,
        is_active: true
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating OAuth profile:', error);
        return;
      }

      setProfile(data);
      
      // Send welcome email for OAuth users
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            emailType: 'oauth_welcome',
            profileData: data,
            provider
          }
        });
      } catch (emailError) {
        console.error('Error sending OAuth welcome email:', emailError);
      }

      console.log('OAuth profile created:', data);
    } catch (error) {
      console.error('Error in createOAuthProfile:', error);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) {
        return { error };
      }

      // If user was created successfully, send verification email
      if (data.user && !data.user.email_confirmed_at) {
        try {
          await supabase.functions.invoke('send-verification-email', {
            body: {
              email: email,
              userId: data.user.id,
              firstName: userData?.firstName || '',
              lastName: userData?.lastName || '',
              userType: userData?.userType || 'buyer'
            }
          });
        } catch (emailError) {
          console.error('Error sending verification email:', emailError);
          // Don't fail the signup if email sending fails
        }
      }

      return { error: null, user: data.user };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error };
      }

      // Check if user has 2FA enabled - with timeout protection
      if (data.user) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('2FA check timeout')), 3000)
          );
          
          const profilePromise = supabase
            .from('profiles')
            .select('two_factor_enabled')
            .eq('user_id', data.user.id)
            .single();

          const { data: profile, error: profileError } = await Promise.race([profilePromise, timeoutPromise]);

          if (!profileError && profile?.two_factor_enabled) {
            setTwoFactorRequired(true);
            setTwoFactorVerified(false);
            return { error: null, twoFactorRequired: true };
          }
        } catch (error) {
          console.error('Error checking 2FA status:', error);
          // Continue without 2FA check if it fails
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithAdmin = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_admin_login', {
        p_username: username,
        p_password: password
      });

      if (error || !data || data.length === 0 || !data[0].success) {
        return { error: new Error('Invalid username or password') };
      }

      // Get admin data
      const adminData = data[0];
      
      // Create a mock user object for admin session
      const mockAdminUser = {
        id: adminData.admin_id,
        email: `${adminData.username}@admin.local`,
        role: adminData.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: { username: adminData.username },
        app_metadata: { role: adminData.role }
      };

      // Create a mock profile for admin
      const mockAdminProfile = {
        id: adminData.admin_id,
        user_id: adminData.admin_id,
        user_type: adminData.role,
        user_role: adminData.role,
        unique_user_id: 'ADMIN001',
        verification_status: 'verified',
        rating: 5.0,
        total_ratings: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Set the state for admin login
      setUser(mockAdminUser as any);
      setProfile(mockAdminProfile as any);
      
      return { error: null };
    } catch (error) {
      console.error('Admin login error:', error);
      return { error: new Error('Invalid username or password') };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Get Google OAuth configuration from API keys
      const { data: googleConfig, error: configError } = await supabase.functions.invoke('manage-api-keys', {
        body: { action: 'validate' }
      });

      if (configError) {
        console.error('Error validating Google OAuth config:', configError);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth?provider=google`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        // Handle specific OAuth errors
        if (error.message.includes('configuration')) {
          throw new Error('Google OAuth is not properly configured. Please contact an administrator.');
        }
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user found') };

    try {
      const oldUserType = profile?.user_type;
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (!error) {
        await fetchUserProfile(user.id);
        
        // Send notification email if profile was updated
        if (updates.user_type && updates.user_type !== oldUserType) {
          await sendWelcomeEmail('role_assigned');
        } else {
          await sendWelcomeEmail('profile_updated');
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const hasRole = (role: string): boolean => {
    return profile?.user_role === role || profile?.user_type === role;
  };

  const isVerified = (): boolean => {
    return profile?.verification_status === 'verified';
  };

  const is2FAEnabled = (): boolean => {
    return profile?.two_factor_enabled || false;
  };

  const verifyTwoFactor = () => {
    setTwoFactorRequired(false);
    setTwoFactorVerified(true);
  };

  const canPerformTransactions = (): boolean => {
    if (!user || !profile) return false;
    
    // User must be verified
    if (!isVerified()) return false;
    
    // If 2FA is enabled, it must be verified in this session
    if (is2FAEnabled() && !twoFactorVerified) return false;
    
    return true;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    twoFactorRequired,
    twoFactorVerified,
    signUp,
    signIn,
    signInWithAdmin,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    verifyTwoFactor,
    hasRole,
    isVerified,
    is2FAEnabled,
    canPerformTransactions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};