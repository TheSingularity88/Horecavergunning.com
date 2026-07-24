'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  // Monotonic sequence so a slow fetch for a previous user/session can never
  // clobber state written by a newer one (e.g. sign-out during a load).
  const loadSeq = useRef(0);
  // Which user id we last finished loading profile/client data for — lets us
  // skip pointless refetches on TOKEN_REFRESHED events for the same user.
  const loadedForUserId = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // Clients intentionally have no profiles row (see handle_new_user) —
        // not a critical error, the app works without one.
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

  const loadUserData = useCallback(async (userId: string) => {
    const seq = ++loadSeq.current;
    try {
      const [profileData, clientDataResult] = await Promise.all([
        fetchProfile(userId),
        fetchClientData(userId),
      ]);
      if (seq !== loadSeq.current) return; // superseded by a newer auth event
      setProfile(profileData);
      setClientData(clientDataResult);
      loadedForUserId.current = userId;
    } finally {
      if (seq === loadSeq.current) {
        setIsLoading(false);
      }
    }
  }, [fetchProfile, fetchClientData]);

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
    // DEADLOCK WARNING — this callback MUST stay synchronous.
    //
    // GoTrueClient emits auth events while holding its auth lock (a
    // navigator.locks entry keyed on the sb-<ref>-auth-token storage key) and
    // AWAITS the callback before releasing it. Any supabase query awaited in
    // here re-enters getSession() → queues on that same lock → the callback
    // waits for the lock while the lock waits for the callback. The app then
    // hangs on the "Loading..." spinner forever (isLoading never resolves).
    // Confirmed via navigator.locks.query(): the lock stayed held with the
    // old async-callback code. Supabase's own docs say: do not await Supabase
    // calls inside onAuthStateChange; defer them instead.
    //
    // INITIAL_SESSION fires on subscribe (with a null session when logged
    // out), so this single listener also covers initial page load — no
    // separate getSession() bootstrap needed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (session.user.id !== loadedForUserId.current) {
          const userId = session.user.id;
          // setTimeout escapes the auth lock's critical section; the queries
          // then run against a released lock and complete normally.
          setTimeout(() => {
            void loadUserData(userId);
          }, 0);
        }
      } else {
        loadSeq.current++; // invalidate any in-flight load
        loadedForUserId.current = null;
        setUser(null);
        setProfile(null);
        setClientData(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadUserData]);

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
