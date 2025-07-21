import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  user_type: string;
  user_role?: 'user' | 'admin' | 'moderator';
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
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with onAuthStateChange
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle missing profiles gracefully

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      // Always set loading to false after attempting to fetch profile
      setLoading(false);
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

      // Check if user has 2FA enabled
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('two_factor_enabled')
          .eq('user_id', data.user.id)
          .single();

        if (!profileError && profile?.two_factor_enabled) {
          setTwoFactorRequired(true);
          setTwoFactorVerified(false);
          return { error: null, twoFactorRequired: true };
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      return { error };
    } catch (error) {
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
    return profile?.user_type === role;
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