'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { isAuthConfigured, isDemo } from '@/lib/config';
interface AuthState {
    user: User | null;
    loading: boolean;
    error: string;
    signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthState | undefined>(undefined);
export function AuthProvider({ children }: {
    children: ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(!isDemo && isAuthConfigured), [error, setError] = useState('');
    useEffect(() => {
        if (isDemo || !isAuthConfigured) {
            setLoading(false);
            return;
        }
        let active = true;
        let sessionRevision = 0;
        const auth = getSupabase().auth;
        const initialRevision = sessionRevision;
        auth.getSession().then(({ data, error }) => {
            if (active && sessionRevision === initialRevision) {
                setUser(data.session?.user ?? null);
                setError(error?.message ?? '');
                setLoading(false);
            }
        }).catch(() => {
            if (active && sessionRevision === initialRevision) {
                setLoading(false);
                setError('Unable to check your session.');
            }
        });
        const { data: subscription } = auth.onAuthStateChange((_event, session) => {
            if (active) {
                sessionRevision += 1;
                setError('');
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });
        return () => { active = false; subscription.subscription.unsubscribe(); };
    }, []);
    async function signOut() {
        const { error } = await getSupabase().auth.signOut({ scope: 'local' });
        if (error)
            throw error;
        setUser(null);
    }
    return <AuthContext.Provider value={{ user, loading, error, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error('AuthProvider missing.');
    return context;
}
