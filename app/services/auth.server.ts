// app/services/auth.server.ts
import { redirect } from '@remix-run/node';
import { supabase, sessionStorage } from './supabase.server';

export class AuthService {
  static async signIn({ 
    email, 
    password 
  }: { 
    email: string; 
    password: string;
  }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data?.session) {
        const session = await sessionStorage.getSession();
        session.set('token', data.session.access_token);
        
        return { 
          success: true, 
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session)
          }
        };
      }
    } catch (error) {
      return { error: 'Authentication failed' };
    }

    return { error: 'An unexpected error occurred' };
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: error.message };
      }

      const session = await sessionStorage.getSession();
      return { 
        success: true,
        headers: {
          'Set-Cookie': await sessionStorage.destroySession(session)
        }
      };
    } catch (error) {
      return { error: 'Sign out failed' };
    }
  }

  static async requireAuth(request: Request) {
    const session = await sessionStorage.getSession(
      request.headers.get('Cookie')
    );
    
    const token = session.get('token');
    
    if (!token) {
      throw redirect('/login');
    }
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        throw redirect('/login');
      }
      
      return user;
    } catch (error) {
      throw redirect('/login');
    }
  }
}