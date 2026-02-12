import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
// Prefer Service Role Key for backend operations to bypass RLS, but fallback to Anon Key if needed
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase URL or Key is missing. Database operations will fail.');
}

// Singleton pattern to prevent multiple instances
let instance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (instance) return instance;

  // Mock for debug script if env is missing
  // NOTE: process.env.DEBUG_MODE is set BEFORE import in debug script, but module resolution order might be tricky in ESM.
  // We check if supabaseUrl is empty, which implies we are in a bad state unless debug is on.
  if (process.env.DEBUG_MODE === 'true' || !supabaseUrl || supabaseUrl === 'your_supabase_url') {
      if (process.env.DEBUG_MODE === 'true') {
        console.warn('[Supabase] Running in DEBUG MOCK mode. DB calls will fail if not mocked.');
      }
      // Return a dummy object or a valid client pointing to nowhere just to pass initialization
      // But better to just let it fail gracefully or check call sites.
      // For now, let's inject a dummy URL to bypass the constructor check if we are debugging Meegle only
      // Ensure we are passing valid-looking URL
      instance = createClient('https://mock.supabase.co', 'mock-key');
      return instance;
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  instance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return instance;
};

// Export a direct instance for backward compatibility, but using the getter logic
export const supabase = getSupabase();
