import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for build time
    console.warn('Supabase credentials not found. Using mock client.');
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
