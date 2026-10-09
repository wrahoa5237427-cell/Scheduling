import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface AuthValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng.';
  if (m.includes('email not confirmed')) return 'Email chưa được xác nhận. Hãy kiểm tra hộp thư.';
  if (m.includes('already registered')) return 'Email này đã có tài khoản. Hãy đăng nhập.';
  if (m.includes('password should be')) return 'Mật khẩu cần ít nhất 8 ký tự.';
  if (m.includes('rate limit')) return 'Thử quá nhiều lần. Hãy đợi một lát rồi thử lại.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? translateAuthError(error.message) : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: translateAuthError(error.message), needsConfirm: false };
    return { error: null, needsConfirm: data.session === null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, loading, signIn, signUp, signOut }),
    [session, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
