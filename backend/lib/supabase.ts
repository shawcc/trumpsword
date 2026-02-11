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
