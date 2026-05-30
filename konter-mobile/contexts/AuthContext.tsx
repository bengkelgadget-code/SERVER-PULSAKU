import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, User } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth.service';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const profile = await getCurrentUser();
    setUser(profile);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          try {
            const profile = await getCurrentUser();
            if (mounted) {
              setUser(profile);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            if (mounted) setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          try {
            const profile = await getCurrentUser();
            if (mounted) setUser(profile);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            if (mounted) setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session && !!user,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}