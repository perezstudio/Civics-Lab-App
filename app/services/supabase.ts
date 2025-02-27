// app/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { createCookieSessionStorage, redirect } from '@remix-run/node';
import type { Session } from '@supabase/supabase-js';

// Environment validation
if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!process.env.SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Session storage configuration
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb-session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET || 'secret'],
    secure: process.env.NODE_ENV === 'production',
  },
});

/**
 * Server-side Supabase client
 * Used for server-side operations
 */
export const serverSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Client-side singleton to avoid multiple initializations
let clientSupabaseInstance: any = null;

/**
 * Initialize the client-side Supabase client
 * Should be called from client components after hydration
 */
export function initClientSupabase(token: string) {
  if (!clientSupabaseInstance) {
    clientSupabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  } else {
    // Update headers with current token if client already exists
    clientSupabaseInstance.supabaseUrl = supabaseUrl;
    clientSupabaseInstance.supabaseKey = supabaseAnonKey;
    clientSupabaseInstance.headers = {
      ...clientSupabaseInstance.headers,
      Authorization: `Bearer ${token}`
    };
  }

  return clientSupabaseInstance;
}

/**
 * Get the client-side Supabase instance
 * Will return null if not initialized yet
 */
export function getClientSupabase() {
  return clientSupabaseInstance;
}

/**
 * Check if client-side Supabase is initialized
 */
export function isClientSupabaseInitialized(): boolean {
  return clientSupabaseInstance !== null;
}

/**
 * Create a new session and return headers for setting cookies
 */
export async function createServerSession(session: Session) {
  const remix_session = await sessionStorage.getSession();
  remix_session.set('token', session.access_token);
  remix_session.set('refresh_token', session.refresh_token);
  remix_session.set('expires_at', session.expires_at);
  
  return {
    'Set-Cookie': await sessionStorage.commitSession(remix_session)
  };
}

/**
 * Destroy the session and return headers for clearing cookies
 */
export async function destroyServerSession(request: Request) {
  const session = await getServerSession(request);
  return {
    'Set-Cookie': await sessionStorage.destroySession(session)
  };
}

/**
 * Get the current server session from request
 */
export async function getServerSession(request: Request) {
  const cookie = request.headers.get('Cookie');
  return sessionStorage.getSession(cookie);
}

/**
 * Get authentication token from request
 */
export async function getTokenFromRequest(request: Request): Promise<string | null> {
  const session = await getServerSession(request);
  return session.get('token');
}

/**
 * Authentication Service class that handles auth operations
 */
export class AuthService {
  /**
   * Sign in a user with email and password
   */
  static async signIn({ 
    email, 
    password 
  }: { 
    request?: Request;
    email: string; 
    password: string;
  }) {
    try {
      const { data, error } = await serverSupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data?.session) {
        const headers = await createServerSession(data.session);
        
        return { 
          success: true, 
          headers,
          user: data.user
        };
      }
    } catch (error: any) {
      return { error: 'Authentication failed: ' + error.message };
    }

    return { error: 'An unexpected error occurred' };
  }

  /**
   * Sign out a user
   */
  static async signOut(request: Request) {
    try {
      const token = await getTokenFromRequest(request);
      
      if (token) {
        const { error } = await serverSupabase.auth.signOut();
        
        if (error) {
          return { error: error.message };
        }
      }

      const headers = await destroyServerSession(request);
      
      return { 
        success: true,
        headers
      };
    } catch (error: any) {
      return { error: 'Sign out failed: ' + error.message };
    }
  }

  /**
   * Require authentication for a route
   * Redirects to login if not authenticated
   */
  static async requireAuth(request: Request) {
    const token = await getTokenFromRequest(request);
    
    if (!token) {
      throw redirect('/login');
    }
    
    try {
      const { data: { user }, error } = await serverSupabase.auth.getUser(token);
      
      if (error || !user) {
        throw redirect('/login');
      }
      
      return user;
    } catch (error) {
      throw redirect('/login');
    }
  }
}

/**
 * Data Service class that handles CRUD operations
 */
export class DataService {
  /**
   * Fetch data with optional query parameters
   */
  static async fetchData({ 
    table, 
    query = {},
    request
  }: { 
    table: string;
    query?: any;
    request?: Request;
  }) {
    try {
      const { data, error } = await serverSupabase
        .from(table)
        .select()
        .match(query);

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'Failed to fetch data' };
    }
  }

  /**
   * Create data in a table
   */
  static async createData({ 
    table, 
    data 
  }: { 
    table: string;
    data: any;
  }) {
    try {
      const { data: result, error } = await serverSupabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: result };
    } catch (error: any) {
      return { error: error.message || 'Failed to create data' };
    }
  }

  /**
   * Update data in a table
   */
  static async updateData({ 
    table, 
    id,
    data 
  }: { 
    table: string;
    id: string;
    data: any;
  }) {
    try {
      const { data: result, error } = await serverSupabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: result };
    } catch (error: any) {
      return { error: error.message || 'Failed to update data' };
    }
  }

  /**
   * Delete data from a table
   */
  static async deleteData({ 
    table, 
    id 
  }: { 
    table: string;
    id: string;
  }) {
    try {
      const { error } = await serverSupabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { error: error.message || 'Failed to delete data' };
    }
  }
}