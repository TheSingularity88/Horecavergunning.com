'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/app/lib/supabase/client';
import type { Profile, Client } from '@/app/lib/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  clientData: Client | null;
  isLoading: boolean;
  isAdmin: boolean;
  isClient: boolean;
  clientId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // Profile table might not exist or user might not have a profile yet
        // This is not a critical error - user can still access the app
        console.warn('Profile fetch warning:', error.message);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.warn('Profile fetch error:', err);
      return null;
    }
  }, [supabase]);

  const fetchClientData = useCallback(async (userId: string): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // User might not be a client - this is normal for employees/admins
        return null;
      }

      return data as Client;
    } catch (err) {
      console.warn('Client data fetch error:', err);
      return null;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const [profileData, clientDataResult] = await Promise.all([
        fetchProfile(user.id),
        fetchClientData(user.id),
      ]);
      setProfile(profileData);
      setClientData(clientDataResult);
    }
  }, [user, fetchProfile, fetchClientData]);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
        }

        if (isMounted && session?.user) {
          setUser(session.user);
          // IMPORTANT: Wait for profile and client data before setting isLoading to false
          // This prevents race conditions where isClient is checked before data loads
          const [profileData, clientDataResult] = await Promise.all([
            fetchProfile(session.user.id),
            fetchClientData(session.user.id),
          ]);
          if (isMounted) {
            setProfile(profileData);
            setClientData(clientDataResult);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        // IMPORTANT: Wait for profile and client data before setting isLoading to false
        // This prevents race conditions where isClient is checked before data loads
        const [profileData, clientDataResult] = await Promise.all([
          fetchProfile(session.user.id),
          fetchClientData(session.user.id),
        ]);
        if (isMounted) {
          setProfile(profileData);
          setClientData(clientDataResult);
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setClientData(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, fetchClientData]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setProfile(null);
    setClientData(null);
  };

  const isAdmin = profile?.role === 'admin';
  const isClient = clientData !== null;
  const clientId = clientData?.id || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        clientData,
        isLoading,
        isAdmin,
        isClient,
        clientId,
        signIn,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
