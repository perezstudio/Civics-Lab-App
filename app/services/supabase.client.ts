import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;
let isInitialized = false;

export function initSupabaseClient(url: string, anonKey: string, token: string) {
  if (!isInitialized) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storage: {
          getItem: () => token,
          setItem: () => {},
          removeItem: () => {}
        }
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    isInitialized = true;
  }
  return supabaseInstance;
}

export function getSupabaseClient() {
  if (!isInitialized) {
    console.warn('Attempting to use Supabase client before initialization');
    return null;
  }
  return supabaseInstance;
}

export function isSupabaseInitialized() {
  return isInitialized;
} 