import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface GameScore {
  id: string;
  player_name: string;
  score: number;
  level: number;
  created_at: string;
}

// Read values from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || '';

// Only create client if valid URL and key exist
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;
