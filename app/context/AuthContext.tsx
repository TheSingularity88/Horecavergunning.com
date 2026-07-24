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

/**
 * Distinguishes "row absent" (ok, data null — e.g. clients intentionally have
 * no profiles row) from "fetch failed" (network error, 5xx, transient RLS
 * hiccup). Failures must NOT be treated as absence: latching a failed fetch
 * as loaded would strip isAdmin/isClient until remount.
 */
type FetchResult<T> = { ok: true; data: T | null } | { ok: false };

/** Retry delays for transient profile/client fetch failures. */
const RETRY_DELAYS_MS = [2000, 8000];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  // Monotonic sequence so a stale load (scheduled OR in-flight) can never
  // clobber state written for a newer auth event. Claimed at SCHEDULING time
  // in the auth callback — claiming it at execution time would let a
  // scheduled-but-not-started load survive a sign-out's invalidation.
  const loadSeq = useRef(0);
  // Which user id we last SUCCESSFULLY loaded data for — lets us skip
  // refetches on TOKEN_REFRESHED for the same user. Only set when both
  // fetches succeeded, so transient failures keep retrying on later events.
  const loadedForUserId = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<FetchResult<Profile>> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch warning:', error.message);
        return { ok: false };
      }

      return { ok: true, data: data as Profile | null };
    } catch (err) {
      console.warn('Profile fetch error:', err);
      return { ok: false };
    }
  }, [supabase]);

  const fetchClientData = useCallback(async (userId: string): Promise<FetchResult<Client>> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Client data fetch warning:', error.message);
        return { ok: false };
      }

      return { ok: true, data: data as Client | null };
    } catch (err) {
      console.warn('Client data fetch error:', err);
      return { ok: false };
    }
  }, [supabase]);

  const loadUserData = useCallback(async (userId: string, seq: number, attempt = 0) => {
    if (seq !== loadSeq.current) return; // superseded before we even started
    try {
      const [profileResult, clientResult] = await Promise.all([
        fetchProfile(userId),
        fetchClientData(userId),
      ]);
      if (seq !== loadSeq.current) return; // superseded by a newer auth event

      // Apply whatever succeeded; never overwrite existing state with a
      // failure — a mid-session blip must not strip isAdmin/isClient.
      if (profileResult.ok) setProfile(profileResult.data);
      if (clientResult.ok) setClientData(clientResult.data);

      if (profileResult.ok && clientResult.ok) {
        loadedForUserId.current = userId;
      } else if (attempt < RETRY_DELAYS_MS.length) {
        // Transient failure: leave the latch unset and retry with the SAME
        // seq — any newer auth event bumps loadSeq and the retry bails at
        // the guard above. If retries exhaust, the latch stays unset so the
        // next TOKEN_REFRESHED / SIGNED_IN event triggers a fresh load.
        setTimeout(() => {
          void loadUserData(userId, seq, attempt + 1);
        }, RETRY_DELAYS_MS[attempt]);
      }
    } finally {
      if (seq === loadSeq.current) {
        setIsLoading(false);
      }
    }
  }, [fetchProfile, fetchClientData]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const [profileResult, clientResult] = await Promise.all([
        fetchProfile(user.id),
        fetchClientData(user.id),
      ]);
      if (profileResult.ok) setProfile(profileResult.data);
      if (clientResult.ok) setClientData(clientResult.data);
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
          // Claim the sequence NOW (a ref increment — never touches the auth
          // lock) so a SIGNED_OUT arriving before the timer fires invalidates
          // this load instead of letting it resurrect signed-out state.
          const seq = ++loadSeq.current;
          // setTimeout escapes the auth lock's critical section; the queries
          // then run against a released lock and complete normally.
          setTimeout(() => {
            void loadUserData(userId, seq);
          }, 0);
        }
      } else {
        loadSeq.current++; // invalidate any scheduled or in-flight load
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
