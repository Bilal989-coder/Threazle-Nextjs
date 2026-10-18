'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config, isAuthConfigured } from './config';
let client: SupabaseClient | undefined;
/** Same Supabase token contract as Threazle-main/frontend; Express verifies it. */
export function getSupabase(): SupabaseClient {
    if (typeof window === 'undefined')
        throw new Error('Auth must be used in the browser.');
    if (!isAuthConfigured)
        throw new Error('Sign-in is temporarily unavailable. Please try again shortly.');
    client ??= createClient(config.supabaseUrl, config.supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    });
    return client;
}
