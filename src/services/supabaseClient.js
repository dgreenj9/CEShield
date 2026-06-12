import { createClient } from '@supabase/supabase-js';

// Reads from either env-var prefix so the same module works under both CRA
// (REACT_APP_*) and Next.js (NEXT_PUBLIC_*) during the migration.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
