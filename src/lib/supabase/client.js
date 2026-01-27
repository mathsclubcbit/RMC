import { createBrowserClient } from '@supabase/ssr';

// Singleton pattern - reuse the same client instance
let supabaseClient = null;

/**
 * Creates a Supabase client for use in the browser (Client Components).
 * Uses singleton pattern to avoid recreating client on every call.
 */
export function createClient() {
    if (supabaseClient) {
        return supabaseClient;
    }

    supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );

    return supabaseClient;
}

