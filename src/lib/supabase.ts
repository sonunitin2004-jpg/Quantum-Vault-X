import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);


/* ================================
   Quantum Vault X — Types
   (Aligned with NEW Supabase schema)
================================ */

/** qx_users */
export type Profile = {
  id: string;
  email: string;
  neural_hash: string;
  biometric_enabled: boolean;
  created_at: string;
};

/** qx_vault_files */
export type VaultItem = {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  encrypted_path: string;
  created_at: string;
};

